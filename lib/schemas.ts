import { z } from "zod";

export const CreateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title too long"),
  group_id: z.string().min(1, "Group is required"),
  goal_type: z.enum(["concrete", "touches", "deadline", "maintenance"]),
  importance: z.enum(["normal", "important", "critical"]),
  due_date: z.string().nullable(),
});

export const UpdateGoalSchema = z.object({
  title: z.string().min(1, "Title is required").max(120, "Title too long"),
  group_id: z.string().min(1, "Group is required"),
  goal_type: z.enum(["concrete", "touches", "deadline", "maintenance"]),
  importance: z.enum(["normal", "important", "critical"]),
  due_date: z.string().nullable(),
});

export const CreateGroupSchema = z.object({
  name: z.string().min(1, "Group name is required").max(50, "Name too long"),
  color: z.string().min(1, "Color is required"),
});
