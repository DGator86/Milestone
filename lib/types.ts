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
