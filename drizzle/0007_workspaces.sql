-- Shared workspaces
-- A workspace groups team members who share one dataset. All of a workspace's
-- data is stored under its owner_id, so every member resolves to the same owner
-- id (see lib/workspace.ts) and sees the same shared CRM/goals/settings.
-- Each account is bootstrapped into its own workspace on first use; admins
-- invite teammates into their workspace from the Team page.
-- Idempotent. Apply via `npm run db:push` or the Neon SQL console.

CREATE TABLE IF NOT EXISTS "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL DEFAULT 'My Workspace',
	"owner_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);

DO $$ BEGIN
	ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_owner_id_users_id_fk"
		FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "workspace_id" uuid;

DO $$ BEGIN
	ALTER TABLE "users" ADD CONSTRAINT "users_workspace_id_workspaces_id_fk"
		FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
