const secrets = new Map<string, string>()

export function setSecret(key: string, value: string): void {
  secrets.set(key, value)
}

export function getSecret(key: string): string | undefined {
  return secrets.get(key) || process.env[key]
}

export function requireSecret(key: string): string {
  const value = getSecret(key)
  if (!value) {
    throw new Error(`Missing required secret: ${key}`)
  }
  return value
}

export function getPaytabConfig() {
  return {
    serverKey: getSecret('PAYTAB_SERVER_KEY') || '',
    profileId: getSecret('PAYTAB_PROFILE_ID') || '',
    isTestMode: getSecret('PAYTAB_TEST_MODE') === 'true',
  }
}

export function getPaypalConfig() {
  return {
    clientId: getSecret('PAYPAL_CLIENT_ID') || '',
    clientSecret: getSecret('PAYPAL_CLIENT_SECRET') || '',
    isSandbox: getSecret('PAYPAL_SANDBOX') === 'true',
  }
}

export function getBankConfig() {
  return {
    accountName: getSecret('BANK_ACCOUNT_NAME') || 'BookFlow Ltd.',
    accountNumber: getSecret('BANK_ACCOUNT_NUMBER') || '',
    bankName: getSecret('BANK_NAME') || '',
    branch: getSecret('BANK_BRANCH') || '',
  }
}