CREATE TABLE IF NOT EXISTS "crm_opportunity_customers" (
  "opportunity_id" uuid NOT NULL REFERENCES "crm_opportunities"("id") ON DELETE CASCADE,
  "customer_id" uuid NOT NULL REFERENCES "crm_customers"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("opportunity_id", "customer_id")
);

CREATE TABLE IF NOT EXISTS "crm_opportunity_contacts" (
  "opportunity_id" uuid NOT NULL REFERENCES "crm_opportunities"("id") ON DELETE CASCADE,
  "contact_id" uuid NOT NULL REFERENCES "crm_contacts"("id") ON DELETE CASCADE,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY ("opportunity_id", "contact_id")
);

INSERT INTO "crm_opportunity_customers" ("opportunity_id", "customer_id")
SELECT "id", "customer_id" FROM "crm_opportunities" WHERE "customer_id" IS NOT NULL
ON CONFLICT DO NOTHING;

INSERT INTO "crm_opportunity_contacts" ("opportunity_id", "contact_id")
SELECT "id", "contact_id" FROM "crm_opportunities" WHERE "contact_id" IS NOT NULL
ON CONFLICT DO NOTHING;
