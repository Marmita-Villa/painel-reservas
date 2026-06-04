import crypto from 'crypto';

const SECRET = process.env.NEXTAUTH_SECRET ?? 'customer-secret';

export interface CustomerSession {
  customerId: string;
  customerAccountId: string;
  restaurantSlug: string;
  name: string;
  email: string;
}

export function signCustomerToken(payload: CustomerSession): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  const body = Buffer.from(JSON.stringify({ ...payload, iat: Date.now(), exp: Date.now() + 7 * 24 * 60 * 60 * 1000 })).toString('base64url');
  const sig = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
  return `${header}.${body}.${sig}`;
}

export function verifyCustomerToken(token: string): CustomerSession | null {
  try {
    const [header, body, sig] = token.split('.');
    const expected = crypto.createHmac('sha256', SECRET).update(`${header}.${body}`).digest('base64url');
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString());
    if (payload.exp < Date.now()) return null;
    return payload as CustomerSession;
  } catch {
    return null;
  }
}

export function getCustomerSession(cookieValue: string | undefined): CustomerSession | null {
  if (!cookieValue) return null;
  return verifyCustomerToken(cookieValue);
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60,
  path: '/',
};
