/** Client-side helpers to prefill wizards from CRM detail pages. */

export type GoalPrefill = {
  title?: string;
  goal_type?: string;
  milestones?: string[];
  customer_id?: string;
  crm_contact_id?: string;
  opportunity_id?: string;
};

export type OpportunityPrefill = {
  customer_id?: string;
  contact_id?: string;
  title?: string;
};

export function prefillNewGoal(data: GoalPrefill) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("goal_prefill", JSON.stringify(data));
  window.location.href = "/dashboard";
}

export function prefillNewOpportunity(data: OpportunityPrefill) {
  if (typeof window === "undefined") return;
  sessionStorage.setItem("opp_prefill", JSON.stringify(data));
  window.location.href = "/opportunities";
}
