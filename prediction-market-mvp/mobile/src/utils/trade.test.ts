import { describe, expect, it } from "vitest";
import { unifyActivity, validAmount } from "./trade";

describe("trade utils", () => {
  it("validates amount", () => {
    expect(validAmount("1")).toBe(true);
    expect(validAmount("0.2")).toBe(true);
    expect(validAmount("0")).toBe(false);
    expect(validAmount("abc")).toBe(false);
  });

  it("deduplicates pending and history by tx hash", () => {
    const merged = unifyActivity(
      [
        {
          txHash: "0x1",
          marketId: "1",
          action: "BUY",
          side: "YES",
          amount: "10",
          state: "PENDING",
          updatedAt: 100,
        },
      ],
      [
        {
          txHash: "0x1",
          marketId: "1",
          marketQuestion: "Will it rain?",
          marketAddress: "0xmarket",
          walletAddress: "0xw",
          action: "BUY",
          side: "YES",
          amount: "10",
          blockNumber: 200,
          state: "INDEXED",
        },
      ],
      [
        {
          id: "1",
          question: "Will it rain?",
          closeTime: 10,
          status: "OPEN",
          marketAddress: "0xmarket",
          createTxHash: "0xcreate",
        },
      ],
      "0xw",
    );

    expect(merged).toHaveLength(1);
    expect(merged[0].state).toBe("INDEXED");
  });
});
