/**
 * WalletConnect 服务
 * 集成 WalletConnect v2 实现 dApp 连接
 */

import { ChainId } from '@/types/network.types';

// WalletConnect 会话类型
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

// 连接请求类型
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

// 交易签名请求类型
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
}

export class WalletConnectService {
  private static client: any = null;
  private static sessions: Map<string, WalletConnectSession> = new Map();
  private static initialized = false;

  /**
   * 初始化 WalletConnect
   */
  static async init(projectId: string): Promise<void> {
    if (this.initialized) return;

    try {
      // TODO: 实际集成需要安装 @walletconnect/react-native-compat
      // 和 @walletconnect/core
      console.log('WalletConnect 初始化（需要安装 SDK）');

      // 示例代码（需要实际 SDK）:
      // const { Core } = await import('@walletconnect/core');
      // const { Web3Wallet } = await import('@walletconnect/web3wallet');

      // this.client = await Web3Wallet.init({
      //   core: new Core({
      //     projectId,
      //   }),
      //   metadata: {
      //     name: 'Wallet App',
      //     description: 'Secure Crypto Wallet',
      //     url: 'https://wallet.app',
      //     icons: ['https://wallet.app/icon.png'],
      //   },
      // });

      // 设置事件监听器
      // this.setupEventListeners();

      this.initialized = true;
    } catch (error) {
      throw new Error(`WalletConnect 初始化失败: ${error}`);
    }
  }

  /**
   * 设置事件监听器
   */
  private static setupEventListeners(): void {
    if (!this.client) return;

    // 连接请求
    this.client.on('session_proposal', async (proposal: ConnectionRequest) => {
      console.log('收到连接请求:', proposal);
      // 触发 UI 显示连接请求
    });

    // 签名请求
    this.client.on('session_request', async (request: SignRequest) => {
      console.log('收到签名请求:', request);
      // 触发 UI 显示签名请求
    });

    // 会话删除
    this.client.on('session_delete', ({ topic }: { topic: string }) => {
      console.log('会话已删除:', topic);
      this.sessions.delete(topic);
    });
  }

  /**
   * 通过 URI 连接 dApp
   */
  static async pair(uri: string): Promise<void> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // await this.client.core.pairing.pair({ uri });
      console.log('配对请求已发送:', uri);
    } catch (error) {
      throw new Error(`配对失败: ${error}`);
    }
  }

  /**
   * 批准连接请求
   */
  static async approveSession(
    proposal: ConnectionRequest,
    accounts: string[],
    chainIds: ChainId[]
  ): Promise<WalletConnectSession> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // 构建命名空间
      const namespaces: Record<string, any> = {};

      // EIP155 (Ethereum) 命名空间
      if (proposal.params.requiredNamespaces.eip155) {
        namespaces.eip155 = {
          accounts: accounts.flatMap(account =>
            chainIds.map(chainId => `eip155:${chainId}:${account}`)
          ),
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

      // const session = await this.client.approveSession({
      //   id: proposal.id,
      //   namespaces,
      // });

      // this.sessions.set(session.topic, session);
      // return session;

      // 临时返回模拟数据
      const mockSession: WalletConnectSession = {
        topic: 'mock-topic',
        relay: { protocol: 'irn' },
        expiry: Date.now() + 7 * 24 * 60 * 60 * 1000,
        acknowledged: true,
        controller: accounts[0],
        namespaces,
        requiredNamespaces: proposal.params.requiredNamespaces,
        peer: proposal.params.proposer,
      };

      this.sessions.set(mockSession.topic, mockSession);
      return mockSession;
    } catch (error) {
      throw new Error(`批准会话失败: ${error}`);
    }
  }

  /**
   * 拒绝连接请求
   */
  static async rejectSession(proposalId: number, reason: string): Promise<void> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // await this.client.rejectSession({
      //   id: proposalId,
      //   reason: {
      //     code: 5000,
      //     message: reason,
      //   },
      // });
      console.log('已拒绝连接请求:', proposalId, reason);
    } catch (error) {
      throw new Error(`拒绝会话失败: ${error}`);
    }
  }

  /**
   * 批准签名请求
   */
  static async approveRequest(
    requestId: number,
    topic: string,
    result: any
  ): Promise<void> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // await this.client.respondSessionRequest({
      //   topic,
      //   response: {
      //     id: requestId,
      //     jsonrpc: '2.0',
      //     result,
      //   },
      // });
      console.log('已批准签名请求:', requestId, result);
    } catch (error) {
      throw new Error(`批准请求失败: ${error}`);
    }
  }

  /**
   * 拒绝签名请求
   */
  static async rejectRequest(
    requestId: number,
    topic: string,
    error: string
  ): Promise<void> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // await this.client.respondSessionRequest({
      //   topic,
      //   response: {
      //     id: requestId,
      //     jsonrpc: '2.0',
      //     error: {
      //       code: 5000,
      //       message: error,
      //     },
      //   },
      // });
      console.log('已拒绝签名请求:', requestId, error);
    } catch (error: any) {
      throw new Error(`拒绝请求失败: ${error}`);
    }
  }

  /**
   * 断开会话
   */
  static async disconnectSession(topic: string): Promise<void> {
    if (!this.client) {
      throw new Error('WalletConnect 未初始化');
    }

    try {
      // await this.client.disconnectSession({
      //   topic,
      //   reason: {
      //     code: 6000,
      //     message: '用户断开连接',
      //   },
      // });

      this.sessions.delete(topic);
      console.log('已断开会话:', topic);
    } catch (error) {
      throw new Error(`断开会话失败: ${error}`);
    }
  }

  /**
   * 获取所有活跃会话
   */
  static getActiveSessions(): WalletConnectSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * 获取指定会话
   */
  static getSession(topic: string): WalletConnectSession | undefined {
    return this.sessions.get(topic);
  }

  /**
   * 解析 WalletConnect URI
   */
  static parseUri(uri: string): {
    protocol: string;
    version: number;
    topic: string;
    symKey: string;
    relay: { protocol: string; data?: string };
  } | null {
    try {
      // wc:topic@version?relay-protocol=relay&symKey=key
      const match = uri.match(/^wc:([^@]+)@(\d+)\?(.+)$/);
      if (!match) return null;

      const [, topic, version, queryString] = match;
      const params = new URLSearchParams(queryString);

      return {
        protocol: 'wc',
        version: parseInt(version),
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

  /**
   * 格式化 dApp 信息
   */
  static formatDAppInfo(metadata: {
    name: string;
    description: string;
    url: string;
    icons: string[];
  }): string {
    return `${metadata.name}\n${metadata.url}`;
  }

  /**
   * 检查会话是否过期
   */
  static isSessionExpired(session: WalletConnectSession): boolean {
    return Date.now() > session.expiry;
  }
}
