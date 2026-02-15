/**
 * 状态管理 - 钱包 Store
 * 使用 Zustand 轻量级状态管理
 */

import { create } from "zustand";
import { Wallet } from "@/types/wallet.types";
import { WalletService } from "@services/WalletService";

interface WalletState {
  // 状态
  currentWallet: Wallet | null;
  wallets: Wallet[];
  isLoading: boolean;
  error: string | null;

  // 操作
  loadWallets: () => Promise<void>;
  setCurrentWallet: (wallet: Wallet | null) => void;
  createWallet: (
    name: string,
    mnemonic: string,
  ) => Promise<Wallet>;
  importWallet: (
    name: string,
    mnemonic?: string,
    privateKey?: string,
  ) => Promise<Wallet>;
  deleteWallet: (walletId: string) => Promise<void>;
  clearError: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  // 初始状态
  currentWallet: null,
  wallets: [],
  isLoading: false,
  error: null,

  // 加载所有钱包
  loadWallets: async () => {
    set({ isLoading: true, error: null });
    try {
      const wallets = await WalletService.getAllWallets();
      const currentWallet = await WalletService.getCurrentWallet();
      set({ wallets, currentWallet, isLoading: false });
    } catch (error) {
      set({ error: String(error), isLoading: false });
    }
  },

  // 设置当前钱包
  setCurrentWallet: (wallet) => {
    set({ currentWallet: wallet });
    if (wallet) {
      WalletService.setCurrentWallet(wallet.id);
    }
  },

  // 创建钱包
  createWallet: async (name, mnemonic) => {
    set({ isLoading: true, error: null });
    try {
      console.log("创建钱包，参数：", { name, mnemonic });
      const wallet = await WalletService.createWallet({
        name,
        mnemonic,
      });
      console.log("钱包创建成功:", wallet);

      const wallets = await WalletService.getAllWallets();
      set({
        wallets,
        currentWallet: wallet,
        isLoading: false,
      });

      return wallet;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // 导入钱包
  importWallet: async (name, mnemonic, privateKey) => {
    set({ isLoading: true, error: null });
    try {
      const wallet = await WalletService.importWallet({
        name,
        mnemonic,
        privateKey,
      });

      const wallets = await WalletService.getAllWallets();
      set({
        wallets,
        currentWallet: wallet,
        isLoading: false,
      });

      return wallet;
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // 删除钱包
  deleteWallet: async (walletId) => {
    set({ isLoading: true, error: null });
    try {
      await WalletService.deleteWallet(walletId);

      const wallets = await WalletService.getAllWallets();
      const currentWallet = get().currentWallet;

      // 如果删除的是当前钱包，清除当前钱包
      if (currentWallet?.id === walletId) {
        set({ wallets, currentWallet: null, isLoading: false });
      } else {
        set({ wallets, isLoading: false });
      }
    } catch (error) {
      set({ error: String(error), isLoading: false });
      throw error;
    }
  },

  // 清除错误
  clearError: () => {
    set({ error: null });
  },
}));
