// apps/api/src/modules/billing/application/payfast-signature.util.ts
//
// PayFast's signature scheme: MD5 hash of the URL-encoded parameter
// string (fields joined in order with &), with the merchant passphrase
// appended if one is configured. Used both when WE build a signed
// payload to send to PayFast (generateSignature), and when VERIFYING an
// incoming ITN webhook is genuinely from PayFast (same algorithm, just
// applied to the data PayFast sent us).
//
// PayFast's own docs specify: fields are URL-encoded using '+' for
// spaces (application/x-www-form-urlencoded style, not %20), and every
// field with a non-empty value is included, in the order given.

import * as crypto from 'crypto';

/**
 * Builds the exact query-string PayFast expects for signing: iterates
 * the object's own keys in insertion order, skips empty/undefined
 * values and the 'signature' key itself, URL-encodes each value with
 * spaces as '+', and joins as key=value pairs with '&'.
 */
function buildSignatureString(
  data: Record<string, string | number | undefined>,
  passphrase?: string,
): string {
  const pairs: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    if (key === 'signature') continue;
    if (value === undefined || value === null || value === '') continue;

    const encoded = encodeURIComponent(String(value).trim()).replace(/%20/g, '+');
    pairs.push(`${key}=${encoded}`);
  }

  let queryString = pairs.join('&');

  if (passphrase) {
    const encodedPassphrase = encodeURIComponent(passphrase.trim()).replace(/%20/g, '+');
    queryString += `&passphrase=${encodedPassphrase}`;
  }

  return queryString;
}

/**
 * Computes the MD5 signature for an outgoing payload (used when WE
 * build a payment request to send to PayFast).
 */
export function generatePayfastSignature(
  data: Record<string, string | number | undefined>,
  passphrase?: string,
): string {
  const queryString = buildSignatureString(data, passphrase);
  return crypto.createHash('md5').update(queryString).digest('hex');
}

/**
 * Verifies an incoming ITN webhook's signature matches what PayFast
 * would have computed, proving the notification genuinely came from
 * PayFast (or at least from someone who knows the merchant passphrase)
 * and wasn't tampered with in transit.
 */
export function verifyPayfastSignature(
  data: Record<string, string | number | undefined>,
  receivedSignature: string,
  passphrase?: string,
): boolean {
  const expectedSignature = generatePayfastSignature(data, passphrase);
  return expectedSignature === receivedSignature;
}