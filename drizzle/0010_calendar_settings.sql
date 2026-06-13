ALTER TABLE "user_settings" ADD COLUMN IF NOT EXISTS "calendar_settings" jsonb NOT NULL DEFAULT '{}';
