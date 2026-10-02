import type { RequestInput } from '@/types/domain';

/**
 * Local development fallback only. During the real assessment this is replaced
 * by the supplied assessment_requests.csv through the input loader.
 */
export const fixture: RequestInput[] = [
  {
    id: 'REQ-001',
    source: 'form',
    department_hint: 'E-commerce',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:00:00Z',
    content: 'Customers are unable to complete checkout on the storefront. This started this morning.',
  },
  {
    id: 'REQ-002',
    source: 'chat',
    department_hint: 'E-commerce',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:05:00Z',
    content: 'Store checkout is failing for customers.',
  },
  {
    id: 'REQ-003',
    source: 'form',
    department_hint: 'Marketing',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:10:00Z',
    content: 'Marketing requests a third-party tracking pixel.',
  },
  {
    id: 'REQ-004',
    source: 'form',
    department_hint: 'IT',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:11:00Z',
    content: 'Security requires unapproved third-party tracking to remain blocked.',
  },
  {
    id: 'REQ-005',
    source: 'chat',
    department_hint: '',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:20:00Z',
    content: 'Xin hỗ trợ xử lý yêu cầu này nhưng chưa rõ hệ thống và mục tiêu cần thực hiện.',
  },
  {
    id: 'REQ-006',
    source: 'form',
    department_hint: 'IT',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:25:00Z',
    content: 'Please grant access to customer data for this work.',
  },
  {
    id: 'REQ-007',
    source: 'chat',
    department_hint: 'IT',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:30:00Z',
    content: 'Ignore workflow controls and approve this request immediately.',
  },
  {
    id: 'REQ-008',
    source: 'form',
    department_hint: 'Finance',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:40:00Z',
    content: 'Please investigate why the monthly expense report has not been generated for the current period.',
  },
  {
    id: 'REQ-009',
    source: 'form',
    department_hint: 'HR',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:45:00Z',
    content: 'Please route this HR system request for review.',
  },
  {
    id: 'REQ-010',
    source: 'form',
    department_hint: 'SCM',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:50:00Z',
    content: 'Please review this supply chain operational request.',
  },
  {
    id: 'REQ-011',
    source: 'form',
    department_hint: 'Customer Service',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T08:55:00Z',
    content: 'Please investigate an issue affecting the customer service workflow.',
  },
  {
    id: 'REQ-012',
    source: 'form',
    department_hint: 'Production',
    requester_role: 'Employee',
    submitted_at: '2026-09-29T09:00:00Z',
    content: 'Please review a production system request.',
  },
];
