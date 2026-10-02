export type Role = 'viewer' | 'manager';
export type Department =
  | 'IT'
  | 'Marketing'
  | 'E-commerce'
  | 'Customer Service'
  | 'SCM'
  | 'Finance'
  | 'HR'
  | 'Production'
  | 'Needs Review';
export type Priority = 'Critical' | 'High' | 'Medium' | 'Low';
export type State =
  | 'Received'
  | 'Triaged'
  | 'Draft'
  | 'Needs Review'
  | 'Approved'
  | 'Open'
  | 'Rejected'
  | 'Merged';
export type RiskFlag =
  | 'duplicate'
  | 'conflict'
  | 'security'
  | 'privacy'
  | 'missing-information';

export type RequestInput = {
  id: string;
  source: string;
  department_hint: string;
  requester_role: string;
  submitted_at: string;
  content: string;
};

export interface AIProposal {
  department: Department;
  priority: Priority;
  confidence: number;
  summary: string;
  proposed_owner: string;
  proposed_steps: string[];
  risk_flags: RiskFlag[];
  recommended_state: 'Draft' | 'Needs Review';
}

export interface RequestRecord extends RequestInput {
  proposal?: AIProposal;
  state: State;
  duplicate_of?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  request_id: string;
  actor: 'system' | 'ai' | 'viewer' | 'manager';
  action: string;
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}
