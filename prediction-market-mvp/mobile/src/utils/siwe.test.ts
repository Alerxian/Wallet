import { describe, expect, it } from "vitest";
import { composeSiwe } from "./siwe";

describe("composeSiwe", () => {
  it("includes required fields", () => {
    const msg = composeSiwe("0xabc", "nonce-x", 31337, "http://127.0.0.1:3001");
    expect(msg).toContain("127.0.0.1:3001 wants you to sign in");
    expect(msg).toContain("URI: http://127.0.0.1:3001");
    expect(msg).toContain("Chain ID: 31337");
    expect(msg).toContain("Nonce: nonce-x");
    expect(msg).toContain("Expiration Time:");
  });
});
