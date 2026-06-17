export function getPaymentIntentIdFromClientSecret(
  clientSecret: string
): string | null {
  const separatorIndex = clientSecret.indexOf("_secret_");
  if (separatorIndex === -1) {
    return null;
  }

  return clientSecret.slice(0, separatorIndex);
}
