CREATE TABLE IF NOT EXISTS "connected_integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "provider" text NOT NULL,
  "account_email" text NOT NULL,
  "access_token" text NOT NULL,
  "refresh_token" text,
  "expires_at" timestamptz,
  "scopes" jsonb DEFAULT '[]'::jsonb NOT NULL,
  "enabled_services" jsonb DEFAULT '{"mail":true,"calendar":true}'::jsonb NOT NULL,
  "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
  "created_at" timestamptz DEFAULT now() NOT NULL,
  "updated_at" timestamptz DEFAULT now() NOT NULL
);

CREATE INDEX IF NOT EXISTS "connected_integrations_user_id_idx" ON "connected_integrations" ("user_id");
CREATE INDEX IF NOT EXISTS "connected_integrations_provider_idx" ON "connected_integrations" ("provider");
