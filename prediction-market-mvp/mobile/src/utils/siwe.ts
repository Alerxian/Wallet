export function composeSiwe(address: string, nonce: string, chainId: number, apiBase: string): string {
  const domain = new URL(apiBase).host;
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  return [
    `${domain} wants you to sign in with your Ethereum account:`,
    address,
    "",
    `URI: ${apiBase}`,
    "Version: 1",
    `Chain ID: ${chainId}`,
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join("\n");
}
