import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

export const storage = {
  get: (key: string) => AsyncStorage.getItem(key),
  set: (key: string, value: string) => AsyncStorage.setItem(key, value),
  secureGet: (key: string) => SecureStore.getItemAsync(key),
  secureSet: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  secureDelete: (key: string) => SecureStore.deleteItemAsync(key),
};
