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

export const CreateContactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email").max(200).nullable(),
  phone: z.string().max(30).nullable(),
  company: z.string().max(100).nullable(),
  role: z.string().max(100).nullable(),
  list_id: z.string().nullable(),
  touch_frequency_days: z.number().int().positive().nullable(),
  notes: z.string().max(2000).nullable(),
});

export const LogTouchSchema = z.object({
  contact_id: z.string().min(1, "Contact is required"),
  type: z.enum(["call", "email", "meeting", "note"]),
  notes: z.string().max(2000).nullable(),
  touched_at: z.string().nullable(),
});
