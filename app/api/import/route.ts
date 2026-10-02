import { NextResponse } from 'next/server';
import { fixture } from '@/lib/fixture';
import { loadAssessmentRequests } from '@/lib/input-loader';
import { importRequests } from '@/lib/importer';

export async function POST() {
  const input = await loadAssessmentRequests(fixture);
  const result = await importRequests(input);
  return NextResponse.json(result);
}
