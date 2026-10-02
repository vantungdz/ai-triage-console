import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { merge } from '@/lib/workflow';
import type { Role } from '@/types/domain';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.formData();
    const role = (await cookies()).get('triage-role')?.value as Role | undefined;
    const selectedRole: Role = role === 'viewer' ? 'viewer' : 'manager';
    const targetId = String(body.get('targetId') ?? '');
    return NextResponse.json(await merge(id, targetId, selectedRole));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
