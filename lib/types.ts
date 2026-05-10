export type MilestoneStatus = "upcoming" | "in_progress" | "waiting" | "completed" | "stuck";
export type GoalStatus = "active" | "archived" | "completed";
export type GoalType = "concrete" | "touches" | "deadline" | "maintenance";
export type GoalImportance = "normal" | "important" | "critical";
export type TouchType = "call" | "email" | "meeting" | "note";
export type ContactStatus = "active" | "archived";

export interface Group {
  id: string;
  user_id: string;
  name: string;
  color: string | null;
  sort_order: number;
  created_at: string;
}

export interface Contact {
  id: string;
  user_id: string;
  list_id: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  notes: string | null;
  touch_frequency_days: number | null;
  last_touched_at: string | null;
  status: ContactStatus;
  created_at: string;
  updated_at: string;
  groups?: Group;
}

export interface Touch {
  id: string;
  user_id: string;
  contact_id: string;
  deal_id: string | null;
  type: TouchType;
  notes: string | null;
  touched_at: string;
  created_at: string;
  contacts?: Contact;
}

export interface Goal {
  id: string;
  user_id: string;
  group_id: string;
  contact_id: string | null;
  deal_value: number | null;
  title: string;
  goal_type: GoalType;
  importance: GoalImportance;
  status: GoalStatus;
  due_date: string | null;
  created_at: string;
  updated_at: string;
  groups?: Group;
  milestones?: Milestone[];
  contacts?: Contact;
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

export interface ContactWithDetails extends Contact {
  groups?: Group;
  touches?: Touch[];
}
