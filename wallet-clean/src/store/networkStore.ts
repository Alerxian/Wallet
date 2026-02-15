/**
 * 网络状态管理
 */

import { create } from 'zustand';
import { ChainId, Network } from '@/types/network.types';
import { getNetwork, getAllNetworks } from '@/config/networks';
import { StorageService } from '@/services/StorageService';

interface NetworkState {
  currentChainId: ChainId;
  currentNetwork: Network;
  networks: Network[];
  customNetworks: Network[];

  // Actions
  setCurrentNetwork: (chainId: ChainId) => Promise<void>;
  addCustomNetwork: (network: Network) => Promise<void>;
  removeCustomNetwork: (chainId: number) => Promise<void>;
  loadNetworks: () => Promise<void>;
  init: () => Promise<void>;
}

const STORAGE_KEY = 'network_settings';

export const useNetworkStore = create<NetworkState>((set, get) => ({
  currentChainId: ChainId.ETHEREUM,
  currentNetwork: getNetwork(ChainId.ETHEREUM),
  networks: getAllNetworks(),
  customNetworks: [],

  setCurrentNetwork: async (chainId: ChainId) => {
    try {
      const network = getNetwork(chainId);
      set({ currentChainId: chainId, currentNetwork: network });

      // 保存到本地
      await StorageService.setSecure(
        STORAGE_KEY,
        JSON.stringify({ currentChainId: chainId })
      );
    } catch (error) {
      console.error('切换网络失败:', error);
    }
  },

  addCustomNetwork: async (network: Network) => {
    try {
      const { customNetworks } = get();
      const updated = [...customNetworks, network];
      set({ customNetworks: updated });

      // 保存到本地
      await StorageService.setSecure(
        `${STORAGE_KEY}_custom`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('添加自定义网络失败:', error);
    }
  },

  removeCustomNetwork: async (chainId: number) => {
    try {
      const { customNetworks } = get();
      const updated = customNetworks.filter(n => n.chainId !== chainId);
      set({ customNetworks: updated });

      // 保存到本地
      await StorageService.setSecure(
        `${STORAGE_KEY}_custom`,
        JSON.stringify(updated)
      );
    } catch (error) {
      console.error('删除自定义网络失败:', error);
    }
  },

  loadNetworks: async () => {
    try {
      // 加载自定义网络
      const customStr = await StorageService.getSecure(`${STORAGE_KEY}_custom`);
      if (customStr) {
        const customNetworks = JSON.parse(customStr);
        set({ customNetworks });
      }
    } catch (error) {
      console.error('加载网络配置失败:', error);
    }
  },

  init: async () => {
    try {
      // 加载保存的网络设置
      const settingsStr = await StorageService.getSecure(STORAGE_KEY);
      if (settingsStr) {
        const settings = JSON.parse(settingsStr);
        const network = getNetwork(settings.currentChainId);
        set({
          currentChainId: settings.currentChainId,
          currentNetwork: network,
        });
      }

      // 加载自定义网络
      await get().loadNetworks();
    } catch (error) {
      console.error('初始化网络配置失败:', error);
    }
  },
}));
