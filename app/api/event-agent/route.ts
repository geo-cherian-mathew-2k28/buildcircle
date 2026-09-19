import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type AgentTask = "event-campaign" | "announcement";
type AgentDraft = {
  headline: string;
  communityPost: string;
  emailSubject: string;
  emailBody: string;
  inAppMessage: string;
  scheduleNote: string;
};

type AgentContext = {
  title: string;
  date: string;
  time: string;
  location: string;
  audienceCount: number;
  community: string;
  purpose: string;
  actorRole?: string;
};

const outputSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "communityPost", "emailSubject", "emailBody", "inAppMessage", "scheduleNote"],
  properties: {
    headline: { type: "string", minLength: 6, maxLength: 120 },
    communityPost: { type: "string", minLength: 30, maxLength: 600 },
    emailSubject: { type: "string", minLength: 6, maxLength: 120 },
    emailBody: { type: "string", minLength: 40, maxLength: 900 },
    inAppMessage: { type: "string", minLength: 20, maxLength: 280 },
    scheduleNote: { type: "string", minLength: 12, maxLength: 180 },
  },
} as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function text(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function count(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.min(100000, Math.round(value))) : 0;
}

function parseContext(value: unknown): AgentContext | null {
  if (!isRecord(value)) return null;
  const title = text(value.title, "", 120);
  const date = text(value.date, "", 80);
  const time = text(value.time, "", 80);
  const location = text(value.location, "", 120);
  const community = text(value.community, "", 120);
  const purpose = text(value.purpose, "", 600);
  if (!title || !date || !time || !location || !community || !purpose) return null;
  return { title, date, time, location, audienceCount: count(value.audienceCount), community, purpose, actorRole: text(value.actorRole, "", 32) };
}

function fallbackDraft(task: AgentTask, context: AgentContext): AgentDraft {
  const eventLine = `${context.title} · ${context.date} · ${context.time} · ${context.location}`;
  const announcement = task === "announcement"
    ? `${context.purpose}\n\n${eventLine}`
    : `A quick update about ${context.title}: ${context.purpose}\n\n${eventLine}`;
  return {
    headline: task === "announcement" ? `${context.community} update` : `${context.title}: attendee update`,
    communityPost: announcement,
    emailSubject: task === "announcement" ? `${context.community}: an update for you` : `Update about ${context.title}`,
    emailBody: `Hi builder,\n\n${announcement}\n\nYour registration remains confirmed.\n\nBuildCircle`,
    inAppMessage: `${context.title}: ${context.purpose}`,
    scheduleNote: `Draft prepared for ${context.audienceCount || "registered"} attendees. Review is required before delivery.`,
  };
}

function extractOutputText(value: unknown) {
  if (!isRecord(value)) return "";
  if (typeof value.output_text === "string") return value.output_text;
  if (!Array.isArray(value.output)) return "";
  return value.output.flatMap((item) => {
    if (!isRecord(item) || !Array.isArray(item.content)) return [];
    return item.content.flatMap((part) => isRecord(part) && part.type === "output_text" && typeof part.text === "string" ? [part.text] : []);
  }).join("\n");
}

function safeDraft(value: unknown, fallback: AgentDraft): AgentDraft {
  const draft = isRecord(value) ? value : {};
  return {
    headline: text(draft.headline, fallback.headline, 120),
    communityPost: text(draft.communityPost, fallback.communityPost, 600),
    emailSubject: text(draft.emailSubject, fallback.emailSubject, 120),
    emailBody: text(draft.emailBody, fallback.emailBody, 900),
    inAppMessage: text(draft.inAppMessage, fallback.inAppMessage, 280),
    scheduleNote: text(draft.scheduleNote, fallback.scheduleNote, 180),
  };
}

export async function POST(request: Request) {
  const body: unknown = await request.json().catch(() => null);
  const task = isRecord(body) && (body.task === "event-campaign" || body.task === "announcement") ? body.task : null;
  const context = isRecord(body) ? parseContext(body.context) : null;
  if (!task || !context) return NextResponse.json({ error: "A complete agent task and event context are required." }, { status: 400 });

  if (task === "announcement" && context.community === "Open Source Kerala" && !["Admin", "Moderator"].includes(context.actorRole || "")) {
    return NextResponse.json({ error: "Only Open Source Kerala admins and moderators can draft announcements." }, { status: 403 });
  }

  const fallback = fallbackDraft(task, context);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ source: "configuration", draft: fallback, message: "OPENAI_API_KEY is not configured, so a safe local draft was prepared." }, { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        model,
        store: false,
        instructions: "You are the BuildCircle Event Operations Agent. Inspect the supplied, non-sensitive event context, then produce a coordinated, reviewable communication kit for an event host. Write an in-app notification, community post, and email draft that agree on all facts. Never invent dates, times, locations, registration counts, links, benefits, or sender actions. Never claim delivery has happened. Keep every draft helpful, clear, and action-ready. A human must approve every channel before delivery.",
        input: JSON.stringify({ task, context, workflow: ["audience checked", "cross-channel drafts prepared", "human approval required"] }),
        text: { format: { type: "json_schema", name: "event_communication_kit", strict: true, schema: outputSchema } },
        reasoning: { effort: "low" },
        max_output_tokens: 2800,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI request failed with ${response.status}`);
    const result: unknown = await response.json();
    const parsed: unknown = JSON.parse(extractOutputText(result));
    return NextResponse.json({ source: "openai", draft: safeDraft(parsed, fallback), message: "The Event Operations Agent checked the audience context and prepared a cross-channel draft." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ source: "fallback", draft: fallback, message: "The AI service is unavailable, so a safe local draft was prepared for review." }, { headers: { "Cache-Control": "no-store" } });
  }
}