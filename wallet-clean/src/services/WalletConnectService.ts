/**
 * WalletConnect 服务
 * 支持真实 WalletConnect v2 + 本地降级模式
 */

import '@walletconnect/react-native-compat';
import { Core } from '@walletconnect/core';
import { Web3Wallet } from '@walletconnect/web3wallet';
import { ethers } from 'ethers';
import { ChainId } from '@/types/network.types';
import { StorageService } from './StorageService';
import { WalletService } from './WalletService';
import { TransactionService } from './TransactionService';
import { SecurityService } from './SecurityService';

export interface WalletConnectSession {
  topic: string;
  pairingTopic?: string;
  relay: {
    protocol: string;
  };
  expiry: number;
  acknowledged: boolean;
  controller: string;
  namespaces: Record<string, any>;
  requiredNamespaces: Record<string, any>;
  optionalNamespaces?: Record<string, any>;
  sessionProperties?: Record<string, any>;
  peer: {
    publicKey: string;
    metadata: {
      name: string;
      description: string;
      url: string;
      icons: string[];
    };
  };
}

export interface ConnectionRequest {
  id: number;
  params: {
    requiredNamespaces: Record<string, any>;
    optionalNamespaces?: Record<string, any>;
    proposer: {
      publicKey: string;
      metadata: {
        name: string;
        description: string;
        url: string;
        icons: string[];
      };
    };
  };
}

export interface SignRequest {
  id: number;
  topic: string;
  params: {
    request: {
      method: string;
      params: any[];
    };
    chainId: string;
  };
  verifyContext?: any;
}

interface WalletContext {
  walletId: string;
  address: string;
  chainIds: ChainId[];
}

export class WalletConnectService {
  private static web3wallet: any = null;
  private static core: any = null;
  private static sessions: Map<string, WalletConnectSession> = new Map();
  private static pendingRequests: Map<number, SignRequest> = new Map();
  private static initialized = false;
  private static localMode = false;
  private static readonly STORAGE_KEY = 'walletconnect_sessions';
  private static walletContext: WalletContext | null = null;

  private static requestListeners: Array<() => void> = [];

  static setWalletContext(context: WalletContext | null): void {
    this.walletContext = context;
  }

  static isLocalMode(): boolean {
    return this.localMode;
  }

  private static notifyRequestListeners(): void {
    this.requestListeners.forEach((cb) => cb());
  }

  static subscribeRequests(listener: () => void): () => void {
    this.requestListeners.push(listener);
    return () => {
      this.requestListeners = this.requestListeners.filter((l) => l !== listener);
    };
  }

  private static async loadSessionsFromStorage(): Promise<void> {
    try {
      const raw = await StorageService.getSecure(this.STORAGE_KEY);
      if (!raw) return;
      const items: WalletConnectSession[] = JSON.parse(raw);
      this.sessions = new Map(items.map((s) => [s.topic, s]));
    } catch (error) {
      console.warn('加载 WalletConnect 会话缓存失败:', error);
    }
  }

  private static async saveSessionsToStorage(): Promise<void> {
    try {
      const items = Array.from(this.sessions.values());
      await StorageService.setSecure(this.STORAGE_KEY, JSON.stringify(items));
    } catch (error) {
      console.warn('保存 WalletConnect 会话缓存失败:', error);
    }
  }

  static async init(projectId?: string): Promise<void> {
    if (this.initialized) return;

    try {
      if (!projectId) {
        this.localMode = true;
        this.initialized = true;
        await this.loadSessionsFromStorage();
        console.log('WalletConnect 以本地模式运行（未配置 Project ID）');
        return;
      }

      this.core = new Core({
        projectId,
      });

      this.web3wallet = await Web3Wallet.init({
        core: this.core,
        metadata: {
          name: 'Wallet Clean',
          description: 'Wallet Clean mobile wallet',
          url: 'https://wallet-clean.local',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      });

      this.setupEventListeners();
      const activeSessions = this.web3wallet.getActiveSessions?.() || {};
      this.sessions = new Map(
        Object.values(activeSessions).map((s: any) => [s.topic, s as WalletConnectSession])
      );

      this.initialized = true;
      this.localMode = false;
      await this.saveSessionsToStorage();
    } catch (error) {
      console.error('WalletConnect SDK 初始化失败，回退本地模式:', error);
      this.localMode = true;
      this.initialized = true;
      await this.loadSessionsFromStorage();
    }
  }

  private static ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('WalletConnect 未初始化');
    }
  }

  private static buildNamespaces(requiredNamespaces: Record<string, any>): Record<string, any> {
    if (!this.walletContext) {
      throw new Error('钱包上下文未设置，无法批准连接');
    }

    const { address, chainIds } = this.walletContext;
    const namespaces: Record<string, any> = {};

    if (requiredNamespaces.eip155) {
      namespaces.eip155 = {
        accounts: chainIds.map((chainId) => `eip155:${chainId}:${address}`),
        methods: [
          'eth_sendTransaction',
          'eth_signTransaction',
          'eth_sign',
          'personal_sign',
          'eth_signTypedData',
          'eth_signTypedData_v4',
        ],
        events: ['chainChanged', 'accountsChanged'],
      };
    }

    return namespaces;
  }

  private static setupEventListeners(): void {
    if (!this.web3wallet) return;

    this.web3wallet.on('session_proposal', async (proposal: ConnectionRequest) => {
      try {
        const proposerUrl = proposal.params.proposer?.metadata?.url || '';
        const urlRisk = SecurityService.assessUrl(proposerUrl);
        if (urlRisk.level === 'high') {
          throw new Error('dApp 域名风险过高，已拒绝连接');
        }

        const namespaces = this.buildNamespaces(proposal.params.requiredNamespaces);
        const session = await this.web3wallet.approveSession({
          id: proposal.id,
          namespaces,
        });

        this.sessions.set(session.topic, session as WalletConnectSession);
        await this.saveSessionsToStorage();
      } catch (error: any) {
        await this.web3wallet.rejectSession({
          id: proposal.id,
          reason: {
            code: 5000,
            message: error?.message || '用户拒绝',
          },
        });
      }
    });

    this.web3wallet.on('session_request', async (event: any) => {
      const request: SignRequest = {
        id: event.id,
        topic: event.topic,
        params: event.params,
        verifyContext: event.verifyContext,
      };

      this.pendingRequests.set(request.id, request);
      this.notifyRequestListeners();
    });

    this.web3wallet.on('session_delete', async ({ topic }: { topic: string }) => {
      this.sessions.delete(topic);
      await this.saveSessionsToStorage();
    });

    this.web3wallet.on('session_expire', async ({ topic }: { topic: string }) => {
      this.sessions.delete(topic);
      await this.saveSessionsToStorage();
    });
  }

  static async pair(uri: string): Promise<void> {
    this.ensureInitialized();
    const parsed = this.parseUri(uri);
    if (!parsed || !parsed.symKey) {
      throw new Error('无效的 WalletConnect URI');
    }

    if (this.localMode || !this.web3wallet) {
      const session = this.createLocalSessionFromUri(uri);
      this.sessions.set(session.topic, session);
      await this.saveSessionsToStorage();
      return;
    }

    await this.core.pairing.pair({ uri });
  }

  private static createLocalSessionFromUri(uri: string): WalletConnectSession {
    const parsed = this.parseUri(uri);
    if (!parsed) {
      throw new Error('WalletConnect URI 格式无效');
    }

    const name = `WalletConnect #${parsed.topic.slice(0, 6)}`;
    const nowSeconds = Math.floor(Date.now() / 1000);

    return {
      topic: parsed.topic,
      relay: { protocol: parsed.relay.protocol || 'irn' },
      expiry: nowSeconds + 7 * 24 * 60 * 60,
      acknowledged: true,
      controller: 'local-wallet',
      namespaces: {},
      requiredNamespaces: {},
      peer: {
        publicKey: parsed.topic,
        metadata: {
          name,
          description: '本地模式会话（仅用于联调）',
          url: 'https://walletconnect.com',
          icons: ['https://walletconnect.com/walletconnect-logo.png'],
        },
      },
    };
  }

  static async disconnectSession(topic: string): Promise<void> {
    this.ensureInitialized();

    if (!this.localMode && this.web3wallet) {
      await this.web3wallet.disconnectSession({
        topic,
        reason: {
          code: 6000,
          message: '用户断开连接',
        },
      });
    }

    this.sessions.delete(topic);
    await this.saveSessionsToStorage();
  }

  static async disconnectAllSessions(): Promise<void> {
    this.ensureInitialized();
    const topics = Array.from(this.sessions.keys());
    for (const topic of topics) {
      await this.disconnectSession(topic);
    }
  }

  static async getActiveSessions(): Promise<WalletConnectSession[]> {
    this.ensureInitialized();

    if (!this.localMode && this.web3wallet) {
      const activeSessions = this.web3wallet.getActiveSessions?.() || {};
      this.sessions = new Map(
        Object.values(activeSessions).map((s: any) => [s.topic, s as WalletConnectSession])
      );
      await this.saveSessionsToStorage();
    }

    return Array.from(this.sessions.values());
  }

  static getSession(topic: string): WalletConnectSession | undefined {
    return this.sessions.get(topic);
  }

  static getPendingRequests(): SignRequest[] {
    return Array.from(this.pendingRequests.values());
  }

  private static parseChainId(chainIdRaw: string | undefined): ChainId {
    if (!chainIdRaw) return ChainId.ETHEREUM;
    const n = Number(chainIdRaw.split(':')[1] || chainIdRaw);
    return n as ChainId;
  }

  private static async handlePersonalSign(request: SignRequest): Promise<string> {
    if (!this.walletContext) {
      throw new Error('钱包上下文未设置');
    }

    const [first, second] = request.params.request.params;
    const messageHex = typeof first === 'string' && first.startsWith('0x') ? first : second;
    const messageBytes = ethers.getBytes(messageHex || '0x');

    const privateKey = await WalletService.getWalletPrivateKey(this.walletContext.walletId);
    const wallet = new ethers.Wallet(ethers.hexlify(privateKey));
    return wallet.signMessage(messageBytes);
  }

  private static async handleEthSign(request: SignRequest): Promise<string> {
    if (!this.walletContext) {
      throw new Error('钱包上下文未设置');
    }

    const [, message] = request.params.request.params;
    const privateKey = await WalletService.getWalletPrivateKey(this.walletContext.walletId);
    const wallet = new ethers.Wallet(ethers.hexlify(privateKey));
    const messageBytes = ethers.getBytes(message || '0x');
    return wallet.signMessage(messageBytes);
  }

  private static async handleTypedDataSign(request: SignRequest): Promise<string> {
    if (!this.walletContext) {
      throw new Error('钱包上下文未设置');
    }

    const raw = request.params.request.params[1] || request.params.request.params[0];
    const typedData = typeof raw === 'string' ? JSON.parse(raw) : raw;

    const privateKey = await WalletService.getWalletPrivateKey(this.walletContext.walletId);
    const wallet = new ethers.Wallet(ethers.hexlify(privateKey));

    const { domain, types, message } = typedData;
    const sanitizedTypes = { ...types };
    delete sanitizedTypes.EIP712Domain;

    return wallet.signTypedData(domain || {}, sanitizedTypes || {}, message || {});
  }

  private static async handleSendTransaction(request: SignRequest): Promise<string> {
    if (!this.walletContext) {
      throw new Error('钱包上下文未设置');
    }

    const tx = request.params.request.params[0] || {};
    const chainId = this.parseChainId(request.params.chainId);

    return TransactionService.sendTransaction(
      {
        from: tx.from || this.walletContext.address,
        to: tx.to,
        value: tx.value ? BigInt(tx.value).toString() : '0',
        data: tx.data,
      },
      this.walletContext.walletId,
      chainId
    );
  }

  static async approveRequest(requestId: number): Promise<void> {
    this.ensureInitialized();
    if (this.localMode || !this.web3wallet) {
      this.pendingRequests.delete(requestId);
      this.notifyRequestListeners();
      return;
    }

    const req = this.pendingRequests.get(requestId);
    if (!req) {
      throw new Error('请求不存在或已处理');
    }

    const method = req.params.request.method;
    let result: any;

    if (method === 'eth_sendTransaction') {
      result = await this.handleSendTransaction(req);
    } else if (method === 'personal_sign') {
      result = await this.handlePersonalSign(req);
    } else if (method === 'eth_sign') {
      result = await this.handleEthSign(req);
    } else if (method === 'eth_signTypedData' || method === 'eth_signTypedData_v4') {
      result = await this.handleTypedDataSign(req);
    } else {
      throw new Error(`暂不支持方法: ${method}`);
    }

    await this.web3wallet.respondSessionRequest({
      topic: req.topic,
      response: {
        id: req.id,
        jsonrpc: '2.0',
        result,
      },
    });

    this.pendingRequests.delete(requestId);
    this.notifyRequestListeners();
  }

  static async rejectRequest(requestId: number, message = '用户拒绝'): Promise<void> {
    this.ensureInitialized();
    if (this.localMode || !this.web3wallet) {
      this.pendingRequests.delete(requestId);
      this.notifyRequestListeners();
      return;
    }

    const req = this.pendingRequests.get(requestId);
    if (!req) {
      throw new Error('请求不存在或已处理');
    }

    await this.web3wallet.respondSessionRequest({
      topic: req.topic,
      response: {
        id: req.id,
        jsonrpc: '2.0',
        error: {
          code: 5000,
          message,
        },
      },
    });

    this.pendingRequests.delete(requestId);
    this.notifyRequestListeners();
  }

  static parseUri(uri: string): {
    protocol: string;
    version: number;
    topic: string;
    symKey: string;
    relay: { protocol: string; data?: string };
  } | null {
    try {
      const match = uri.match(/^wc:([^@]+)@(\d+)\?(.+)$/);
      if (!match) return null;

      const [, topic, version, queryString] = match;
      const params = new URLSearchParams(queryString);

      return {
        protocol: 'wc',
        version: parseInt(version, 10),
        topic,
        symKey: params.get('symKey') || '',
        relay: {
          protocol: params.get('relay-protocol') || 'irn',
          data: params.get('relay-data') || undefined,
        },
      };
    } catch (error) {
      console.error('解析 URI 失败:', error);
      return null;
    }
  }

  static isSessionExpired(session: WalletConnectSession): boolean {
    return Date.now() > session.expiry * 1000;
  }
}
