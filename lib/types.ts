export type MilestoneStatus = "upcoming" | "in_progress" | "waiting" | "completed" | "stuck";
export type GoalStatus = "active" | "archived" | "completed";
export type GoalType = "concrete" | "touches" | "deadline" | "maintenance";
export type GoalImportance = "normal" | "important" | "critical";

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Goal {
  id: string;
  user_id: string;
  group_id: string;
  title: string;
  goal_type: GoalType;
  importance: GoalImportance;
  status: GoalStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  groups?: Group;
  milestones?: Milestone[];
}

export interface Milestone {
  id: string;
  goal_id: string;
  title: string;
  position: number;
  status: MilestoneStatus;
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ActivityLog {
  id: string;
  goal_id: string;
  milestone_id: string | null;
  action: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface GoalWithDetails extends Goal {
  groups: Group;
  milestones: Milestone[];
}

// ─── CRM ───────────────────────────────────────────────────────────────────────

export type CustomerStatus = "prospect" | "active" | "inactive";
export type OpportunityStatus = "open" | "won" | "lost";

export interface CrmCustomer {
  id: string;
  user_id: string;
  name: string;
  industry: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  status: CustomerStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CrmContact {
  id: string;
  user_id: string;
  customer_id: string | null;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
}

export interface CrmFlow {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  color: string;
  stages: string[];
  created_at: string;
  updated_at: string;
}

export interface CrmOpportunity {
  id: string;
  user_id: string;
  customer_id: string | null;
  contact_id: string | null;
  flow_id: string | null;
  title: string;
  value: number | null;
  stage: string;
  status: OpportunityStatus;
  close_date: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  crm_customers?: Pick<CrmCustomer, "id" | "name"> | null;
  crm_contacts?: Pick<CrmContact, "id" | "first_name" | "last_name"> | null;
  crm_flows?: Pick<CrmFlow, "id" | "name" | "stages"> | null;
}
