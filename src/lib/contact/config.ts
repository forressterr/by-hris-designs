// Typed, fail-fast access to the contact route's environment. Throws a clear
// error if a required var is missing; never logs the secret values.

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface ContactConfig {
  upstashUrl: string;
  upstashToken: string;
  formsubmitEndpoint: string;
}

export function getContactConfig(): ContactConfig {
  return {
    upstashUrl: requireEnv('UPSTASH_REDIS_REST_URL'),
    upstashToken: requireEnv('UPSTASH_REDIS_REST_TOKEN'),
    formsubmitEndpoint: requireEnv('CONTACT_FORMSUBMIT_ENDPOINT'),
  };
}
