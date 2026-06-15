export type IntegrationProvider = "google" | "microsoft";

export type IntegrationService = "mail" | "calendar";

export interface IntegrationItem {
  id: string;
  provider: IntegrationProvider;
  service: IntegrationService;
  title: string;
  snippet?: string;
  date?: string;
  url?: string;
  accountEmail: string;
}

export interface ConnectedIntegrationSummary {
  id: string;
  provider: IntegrationProvider;
  accountEmail: string;
  enabledServices: Record<IntegrationService, boolean>;
  connectedAt: string;
}

export interface GoalPrefillFromIntegration {
  title: string;
  goal_type?: string;
  due_date?: string;
  milestones?: string[];
  source?: {
    provider: IntegrationProvider;
    service: IntegrationService;
    externalId: string;
    accountEmail: string;
  };
}
