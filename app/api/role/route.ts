import { NextRequest, NextResponse } from 'next/server';
import type { Role } from '@/types/domain';

export async function POST(request: NextRequest) {
  const body = (await request.json()) as { role?: Role };
  const role: Role = body.role === 'viewer' ? 'viewer' : 'manager';
  const response = NextResponse.json({ role });
  response.cookies.set('triage-role', role, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
