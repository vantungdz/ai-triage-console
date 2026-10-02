import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import { editProposal } from '@/lib/workflow';
import type { Department, Priority, Role } from '@/types/domain';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.formData();
    const role = (await cookies()).get('triage-role')?.value as Role | undefined;
    const selectedRole: Role = role === 'viewer' ? 'viewer' : 'manager';
    const steps = String(body.get('proposed_steps') ?? '')
      .split('\n')
      .map((step) => step.trim())
      .filter(Boolean);

    return NextResponse.json(await editProposal(id, selectedRole, {
      department: String(body.get('department') ?? 'IT') as Department,
      priority: String(body.get('priority') ?? 'Medium') as Priority,
      summary: String(body.get('summary') ?? ''),
      proposed_owner: String(body.get('proposed_owner') ?? ''),
      proposed_steps: steps,
    }));
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 403 });
  }
}
