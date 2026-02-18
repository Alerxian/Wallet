import { Linking } from "react-native";
import SignClient from "@walletconnect/sign-client";
import { APP_SCHEME, RELAY_FALLBACK, RELAY_PRIMARY, WALLETCONNECT_PROJECT_ID } from "../config/env";
import type { WalletSession } from "../domain/types";
import { errorMessage, withTimeout } from "../utils/common";

export async function initWalletClient(
  existing: SignClient | null,
  initRef: { current: Promise<SignClient> | null },
  relay: string,
  force = false,
) {
  if (!WALLETCONNECT_PROJECT_ID) {
    throw new Error("EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID is required");
  }

  if (existing && !force) {
    return { client: existing, relay };
  }
  if (initRef.current && !force) {
    const client = await initRef.current;
    return { client, relay };
  }

  const relayUrl = force ? (relay === RELAY_PRIMARY ? RELAY_FALLBACK : RELAY_PRIMARY) : relay || RELAY_PRIMARY;
  const initPromise = withTimeout(
    SignClient.init({
      projectId: WALLETCONNECT_PROJECT_ID,
      relayUrl,
      metadata: {
        name: "Prediction Market Mobile",
        description: "Prediction market trading client",
        url: "https://example.org",
        icons: ["https://walletconnect.com/walletconnect-logo.png"],
        redirect: { native: APP_SCHEME },
      },
    }),
    15000,
    "WalletConnect init timeout",
  );

  initRef.current = initPromise;
  try {
    const client = await initPromise;
    return { client, relay: relayUrl };
  } finally {
    initRef.current = null;
  }
}

export async function signMessage(client: SignClient, session: WalletSession, chainId: string, address: string, message: string) {
  const redirect = session.peer?.metadata?.redirect;
  const redirectUrl = redirect?.native || redirect?.universal;

  const openWallet = async () => {
    if (redirectUrl) {
      await Linking.openURL(redirectUrl).catch(() => undefined);
    }
  };

  const returnApp = async () => {
    await Linking.openURL(APP_SCHEME).catch(() => undefined);
  };

  try {
    const request = withTimeout(
      client.request({
        topic: session.topic,
        chainId,
        request: { method: "personal_sign", params: [message, address] },
      }),
      240000,
      "Wallet signature timed out",
    );
    await openWallet();
    const signature = await request;
    await returnApp();
    return String(signature);
  } catch (error) {
    const msg = errorMessage(error).toLowerCase();
    if (!msg.includes("invalid params")) {
      throw error;
    }

    const fallbackRequest = withTimeout(
      client.request({
        topic: session.topic,
        chainId,
        request: { method: "personal_sign", params: [address, message] },
      }),
      240000,
      "Wallet signature timed out",
    );
    await openWallet();
    const signature = await fallbackRequest;
    await returnApp();
    return String(signature);
  }
}
