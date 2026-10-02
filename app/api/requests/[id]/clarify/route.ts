import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { clarify } from '@/lib/workflow';
import type { Role } from '@/types/domain';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.formData();
    const role = (await cookies()).get('triage-role')?.value as Role | undefined;
    const selectedRole: Role = role === 'viewer' ? 'viewer' : 'manager';
    const reason = String(body.get('reason') ?? '');
    return NextResponse.json(await clarify(id, selectedRole, reason));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
