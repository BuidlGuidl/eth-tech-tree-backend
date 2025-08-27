export const createAuthMessage = (nonce: number): string => {
  return `Authenticate your Eth Tech Tree submission. Nonce: ${nonce}`;
};
