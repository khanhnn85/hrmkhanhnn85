export interface User {
  id: string;
  username: string;
  email: string;
  phone: string;
  full_name: string;
  role: 'ADMIN' | 'HR' | 'EMPLOYEE';
  password_hash?: string;
  status: 'ACTIVE' | 'DISABLED';
  created_at: string;
  updated_at: string;
}

export interface Position {
  id: string;
  title: string;
  department: string;
  description: string;
  is_open: boolean;
  created_at: string;
  updated_at: string;
}

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  cv_url: string;
  applied_position_id: string;
  status: 'SUBMITTED' | 'REJECTED' | 'APPROVED' | 'INTERVIEW' | 'OFFERED' | 'HIRED' | 'NOT_HIRED';
  created_at: string;
  updated_at: string;
  position?: Position;
}

export interface Interview {
  id: string;
  candidate_id: string;
  interviewer_id: string;
  interview_session_id?: string;
  tech_notes: string;
  soft_notes: string;
  result: 'PASS' | 'FAIL' | 'PENDING';
  attachment_url?: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviewer?: User;
}

export interface InterviewSession {
  id: string;
  candidate_id: string;
  title: string;
  scheduled_date?: string;
  status: 'SCHEDULED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  created_by: string;
  created_at: string;
  updated_at: string;
  candidate?: Candidate;
  interviews?: Interview[];
  creator?: User;
}

export interface Decision {
  id: string;
  candidate_id: string;
  decided_by: string;
  decision: 'HIRE' | 'NO_HIRE';
  decision_notes: string;
  decided_at: string;
  candidate?: Candidate;
  decider?: User;
}

export interface Employee {
  id: string;
  user_id: string;
  candidate_id?: string;
  place_of_residence: string;
  hometown: string;
  national_id: string;
  created_at: string;
  updated_at: string;
  user?: User;
  candidate?: Candidate;
}

export interface AuditLog {
  id: string;
  actor_id: string;
  action: string;
  target_type: string;
  target_id: string;
  payload_json: Record<string, any>;
  created_at: string;
  actor?: User;
}

export type UserRole = 'ADMIN' | 'HR' | 'EMPLOYEE' | 'GUEST';