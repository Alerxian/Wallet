/**
 * NFT 服务
 * 集成 Alchemy NFT API 实现 NFT 管理功能
 */

import { ChainId } from '@/types/network.types';

// Alchemy API 基础 URL
const ALCHEMY_API_BASE = 'https://eth-mainnet.g.alchemy.com/nft/v3';

// Alchemy 支持的网络映射
const NETWORK_MAP: Record<ChainId, string> = {
  [ChainId.ETHEREUM]: 'eth-mainnet',
  [ChainId.POLYGON]: 'polygon-mainnet',
  [ChainId.ARBITRUM]: 'arb-mainnet',
  [ChainId.OPTIMISM]: 'opt-mainnet',
  [ChainId.SEPOLIA]: 'eth-sepolia',
  [ChainId.BSC]: '', // Alchemy 不支持 BSC
  [ChainId.AVALANCHE]: '', // Alchemy 不支持 Avalanche
};

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

export interface NFT {
  contract: string;
  tokenId: string;
  tokenType: 'ERC721' | 'ERC1155';
  name: string;
  description: string;
  image: string;
  metadata: NFTMetadata;
  balance?: string; // For ERC1155
  collectionName?: string;
}

export interface NFTCollection {
  contract: string;
  name: string;
  symbol: string;
  totalSupply: string;
  tokenType: 'ERC721' | 'ERC1155';
}

export class NFTService {
  private static apiKey: string = ''; // 需要配置 Alchemy API Key

  /**
   * 设置 Alchemy API Key
   */
  static setApiKey(key: string) {
    this.apiKey = key;
  }

  /**
   * 获取钱包的所有 NFT
   */
  static async getNFTs(
    address: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<NFT[]> {
    try {
      const network = NETWORK_MAP[chainId];
      if (!network) {
        throw new Error('不支持的网络');
      }

      if (!this.apiKey) {
        throw new Error('未配置 Alchemy API Key');
      }

      const url = `https://${network}.g.alchemy.com/nft/v3/${this.apiKey}/getNFTsForOwner`;
      const queryParams = new URLSearchParams({
        owner: address,
        withMetadata: 'true',
        pageSize: '100',
      });

      const response = await fetch(`${url}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`获取 NFT 失败: ${response.statusText}`);
      }

      const data = await response.json();

      return data.ownedNfts.map((nft: any) => ({
        contract: nft.contract.address,
        tokenId: nft.tokenId,
        tokenType: nft.tokenType,
        name: nft.name || nft.contract.name || 'Unknown',
        description: nft.description || '',
        image: this.resolveImageUrl(nft.image?.cachedUrl || nft.image?.originalUrl || ''),
        metadata: nft.raw?.metadata || {},
        balance: nft.balance,
        collectionName: nft.contract.name,
      }));
    } catch (error) {
      throw new Error(`获取 NFT 列表失败: ${error}`);
    }
  }

  /**
   * 获取 NFT 详情
   */
  static async getNFTMetadata(
    contract: string,
    tokenId: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<NFT> {
    try {
      const network = NETWORK_MAP[chainId];
      if (!network) {
        throw new Error('不支持的网络');
      }

      if (!this.apiKey) {
        throw new Error('未配置 Alchemy API Key');
      }

      const url = `https://${network}.g.alchemy.com/nft/v3/${this.apiKey}/getNFTMetadata`;
      const queryParams = new URLSearchParams({
        contractAddress: contract,
        tokenId: tokenId,
        refreshCache: 'false',
      });

      const response = await fetch(`${url}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`获取 NFT 详情失败: ${response.statusText}`);
      }

      const nft = await response.json();

      return {
        contract: nft.contract.address,
        tokenId: nft.tokenId,
        tokenType: nft.tokenType,
        name: nft.name || nft.contract.name || 'Unknown',
        description: nft.description || '',
        image: this.resolveImageUrl(nft.image?.cachedUrl || nft.image?.originalUrl || ''),
        metadata: nft.raw?.metadata || {},
        collectionName: nft.contract.name,
      };
    } catch (error) {
      throw new Error(`获取 NFT 详情失败: ${error}`);
    }
  }

  /**
   * 获取 NFT 集合信息
   */
  static async getCollection(
    contract: string,
    chainId: ChainId = ChainId.ETHEREUM
  ): Promise<NFTCollection> {
    try {
      const network = NETWORK_MAP[chainId];
      if (!network) {
        throw new Error('不支持的网络');
      }

      if (!this.apiKey) {
        throw new Error('未配置 Alchemy API Key');
      }

      const url = `https://${network}.g.alchemy.com/nft/v3/${this.apiKey}/getContractMetadata`;
      const queryParams = new URLSearchParams({
        contractAddress: contract,
      });

      const response = await fetch(`${url}?${queryParams}`);

      if (!response.ok) {
        throw new Error(`获取集合信息失败: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        contract: data.address,
        name: data.name || 'Unknown Collection',
        symbol: data.symbol || '',
        totalSupply: data.totalSupply || '0',
        tokenType: data.tokenType,
      };
    } catch (error) {
      throw new Error(`获取集合信息失败: ${error}`);
    }
  }

  /**
   * 转移 NFT
   * 注意：这个方法需要配合 TransactionService 使用
   */
  static async transferNFT(
    from: string,
    to: string,
    contract: string,
    tokenId: string,
    tokenType: 'ERC721' | 'ERC1155',
    amount: string = '1' // For ERC1155
  ): Promise<{ to: string; data: string; value: string }> {
    try {
      // ERC-721 Transfer ABI
      const ERC721_TRANSFER_ABI = [
        'function safeTransferFrom(address from, address to, uint256 tokenId)',
      ];

      // ERC-1155 Transfer ABI
      const ERC1155_TRANSFER_ABI = [
        'function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)',
      ];

      const { ethers } = await import('ethers');

      if (tokenType === 'ERC721') {
        const iface = new ethers.Interface(ERC721_TRANSFER_ABI);
        const data = iface.encodeFunctionData('safeTransferFrom', [
          from,
          to,
          tokenId,
        ]);

        return {
          to: contract,
          data,
          value: '0',
        };
      } else {
        const iface = new ethers.Interface(ERC1155_TRANSFER_ABI);
        const data = iface.encodeFunctionData('safeTransferFrom', [
          from,
          to,
          tokenId,
          amount,
          '0x',
        ]);

        return {
          to: contract,
          data,
          value: '0',
        };
      }
    } catch (error) {
      throw new Error(`构建转移交易失败: ${error}`);
    }
  }

  /**
   * 解析 IPFS 和其他图片 URL
   */
  private static resolveImageUrl(url: string): string {
    if (!url) return '';

    // IPFS URL 转换
    if (url.startsWith('ipfs://')) {
      return url.replace('ipfs://', 'https://ipfs.io/ipfs/');
    }

    // Arweave URL
    if (url.startsWith('ar://')) {
      return url.replace('ar://', 'https://arweave.net/');
    }

    return url;
  }

  /**
   * 格式化 NFT 名称
   */
  static formatNFTName(name: string, tokenId: string): string {
    if (name && name !== 'Unknown') {
      return name;
    }
    return `#${tokenId}`;
  }

  /**
   * 检查是否支持该网络
   */
  static isSupportedNetwork(chainId: ChainId): boolean {
    return !!NETWORK_MAP[chainId];
  }
}
