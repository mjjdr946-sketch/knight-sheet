/**
 * API logout (prompt v14 §2) : purge le cookie de session → retour au sas.
 */
import { NextResponse } from 'next/server';

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('sheet-auth', '', { httpOnly: true, maxAge: 0, sameSite: 'strict' });
  return res;
}
