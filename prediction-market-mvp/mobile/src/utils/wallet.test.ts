import { describe, expect, it } from "vitest";
import { walletAccount, walletChainId, walletChainRef } from "./wallet";

describe("wallet utils", () => {
  const session = {
    topic: "a",
    namespaces: {
      eip155: {
        accounts: ["eip155:31337:0xabc"],
        methods: [],
        events: [],
      },
    },
  };

  it("extracts wallet chain correctly", () => {
    expect(walletChainRef(session)).toBe("eip155:31337");
    expect(walletChainId(session)).toBe(31337);
  });

  it("extracts wallet account", () => {
    expect(walletAccount(session)).toBe("0xabc");
  });
});
