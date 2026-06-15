import { cleanSnippet } from "./providers";
import type { GoalPrefillFromIntegration, IntegrationItem } from "./types";

function splitIntoMilestones(text: string): string[] {
  const lines = text
    .split(/\n|•|·|[-–—]\s+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 3);

  if (lines.length >= 2) return lines.slice(0, 6);
  if (text.length > 80) {
    return [
      "Review the source item",
      "Define the desired outcome",
      "Complete the follow-up",
    ];
  }
  return [];
}

export function integrationItemToGoalPrefill(item: IntegrationItem): GoalPrefillFromIntegration {
  const [, , externalId] = item.id.split(":");
  const snippet = cleanSnippet(item.snippet);

  if (item.service === "calendar") {
    const milestones = snippet ? splitIntoMilestones(snippet) : ["Prepare for the event", "Attend and follow up"];
    return {
      title: item.title,
      goal_type: "deadline",
      due_date: item.date,
      milestones: milestones.length ? milestones : undefined,
      source: {
        provider: item.provider,
        service: item.service,
        externalId: externalId ?? item.id,
        accountEmail: item.accountEmail,
      },
    };
  }

  const milestones = snippet
    ? ["Read and summarize the message", "Identify required action", "Complete the follow-up"]
    : ["Review the message", "Take action"];

  return {
    title: item.title,
    goal_type: "concrete",
    milestones,
    source: {
      provider: item.provider,
      service: item.service,
      externalId: externalId ?? item.id,
      accountEmail: item.accountEmail,
    },
  };
}
