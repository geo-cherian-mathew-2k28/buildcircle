import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Destination = "community" | "explore" | "events";
type DigestItem = {
  category: string;
  title: string;
  summary: string;
  action: string;
  destination: Destination;
  icon: "reply" | "sparkle" | "calendar" | "pin";
  tone: "teal" | "violet" | "orange" | "pink";
};
type Community = { name: string; description: string | null; category: string | null };
type Event = { title: string; starts_at: string; venue: string | null; kind: string | null };
type Project = { name: string; description: string | null; created_at: string };
type CommunitySignals = { communities: Community[]; events: Event[]; projects: Project[]; source: "supabase" | "seed" };

const seedSignals: CommunitySignals = {
  source: "seed",
  communities: [
    { name: "AI Agents", description: "Build autonomous systems, share patterns and ship useful agents.", category: "AI" },
    { name: "Codex Builders", description: "A practical space for people building with code and creative curiosity.", category: "Builders" },
  ],
  events: [{ title: "Build your first AI agent", starts_at: new Date(Date.now() + 86_400_000).toISOString(), venue: "Online · Live workshop", kind: "workshop" }],
  projects: [{ name: "TraceView", description: "A visual debugger for agent tool calls and failure paths.", created_at: new Date().toISOString() }],
};

const openAiSchema = {
  type: "object",
  additionalProperties: false,
  required: ["intro", "items"],
  properties: {
    intro: { type: "string", minLength: 20, maxLength: 180 },
    items: {
      type: "array",
      minItems: 3,
      maxItems: 4,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "title", "summary", "action", "destination", "icon", "tone"],
        properties: {
          category: { type: "string", minLength: 3, maxLength: 32 },
          title: { type: "string", minLength: 8, maxLength: 100 },
          summary: { type: "string", minLength: 20, maxLength: 240 },
          action: { type: "string", minLength: 3, maxLength: 32 },
          destination: { type: "string", enum: ["community", "explore", "events"] },
          icon: { type: "string", enum: ["reply", "sparkle", "calendar", "pin"] },
          tone: { type: "string", enum: ["teal", "violet", "orange", "pink"] },
        },
      },
    },
  },
} as const;

function stringValue(value: unknown, fallback: string, maxLength: number) {
  return typeof value === "string" && value.trim() ? value.trim().slice(0, maxLength) : fallback;
}

function safeItems(value: unknown, fallback: DigestItem[]) {
  if (!Array.isArray(value) || value.length < 3 || value.length > 4) return fallback;
  const allowedDestinations = new Set<Destination>(["community", "explore", "events"]);
  const allowedIcons = new Set<DigestItem["icon"]>(["reply", "sparkle", "calendar", "pin"]);
  const allowedTones = new Set<DigestItem["tone"]>(["teal", "violet", "orange", "pink"]);
  const items = value.map((entry, index) => {
    const item = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    const destination = allowedDestinations.has(item.destination as Destination) ? item.destination as Destination : fallback[index % fallback.length].destination;
    const icon = allowedIcons.has(item.icon as DigestItem["icon"]) ? item.icon as DigestItem["icon"] : fallback[index % fallback.length].icon;
    const tone = allowedTones.has(item.tone as DigestItem["tone"]) ? item.tone as DigestItem["tone"] : fallback[index % fallback.length].tone;
    return {
      category: stringValue(item.category, fallback[index % fallback.length].category, 32),
      title: stringValue(item.title, fallback[index % fallback.length].title, 100),
      summary: stringValue(item.summary, fallback[index % fallback.length].summary, 240),
      action: stringValue(item.action, fallback[index % fallback.length].action, 32),
      destination,
      icon,
      tone,
    };
  });
  return items;
}

async function getSignals(): Promise<CommunitySignals> {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return seedSignals;

  const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const now = new Date().toISOString();
  const [communitiesResult, eventsResult, projectsResult] = await Promise.all([
    supabase.from("communities").select("name, description, category").limit(4),
    supabase.from("events").select("title, starts_at, venue, kind").gte("starts_at", now).order("starts_at", { ascending: true }).limit(3),
    supabase.from("projects").select("name, description, created_at").order("created_at", { ascending: false }).limit(3),
  ]);
  const communities = communitiesResult.error ? [] : (communitiesResult.data || []).map((item) => ({ name: item.name, description: item.description, category: item.category }));
  const events = eventsResult.error ? [] : (eventsResult.data || []).map((item) => ({ title: item.title, starts_at: item.starts_at, venue: item.venue, kind: item.kind }));
  const projects = projectsResult.error ? [] : (projectsResult.data || []).map((item) => ({ name: item.name, description: item.description, created_at: item.created_at }));
  return communities.length || events.length || projects.length ? { communities, events, projects, source: "supabase" } : seedSignals;
}

function fallbackItems(signals: CommunitySignals): DigestItem[] {
  const community = signals.communities[0] || seedSignals.communities[0];
  const project = signals.projects[0] || seedSignals.projects[0];
  const event = signals.events[0] || seedSignals.events[0];
  const additionalCommunity = signals.communities[1] || seedSignals.communities[1];
  return [
    { category: "WORTH A LOOK", title: `${community.name} has fresh activity`, summary: community.description || "New builder conversations are ready for your perspective.", action: "Open community", destination: "community", icon: "reply", tone: "teal" },
    { category: "NEW SHOWCASE", title: `${project.name} is worth exploring`, summary: project.description || "A new project is ready for feedback from builders.", action: "Explore projects", destination: "explore", icon: "sparkle", tone: "violet" },
    { category: "UPCOMING EVENT", title: event.title, summary: `${event.venue || "Upcoming community event"} · check the details and save your spot.`, action: "View event", destination: "events", icon: "calendar", tone: "orange" },
    { category: "FROM YOUR CIRCLES", title: `${additionalCommunity.name} is building momentum`, summary: additionalCommunity.description || "There are new people and ideas to discover today.", action: "Browse communities", destination: "explore", icon: "pin", tone: "pink" },
  ];
}

function extractOutputText(value: unknown) {
  if (!value || typeof value !== "object") return "";
  const response = value as { output_text?: unknown; output?: unknown };
  if (typeof response.output_text === "string") return response.output_text;
  if (!Array.isArray(response.output)) return "";
  return response.output.flatMap((output) => {
    if (!output || typeof output !== "object") return [];
    const content = (output as { content?: unknown }).content;
    if (!Array.isArray(content)) return [];
    return content.flatMap((part) => part && typeof part === "object" && (part as { type?: unknown }).type === "output_text" && typeof (part as { text?: unknown }).text === "string" ? [(part as { text: string }).text] : []);
  }).join("\n");
}

function responseFor(signals: CommunitySignals, source: "openai" | "fallback" | "configuration", intro?: string, items?: DigestItem[], message?: string) {
  const fallback = fallbackItems(signals);
  return {
    generatedAt: new Date().toISOString(),
    intro: intro || "A focused look at the projects, conversations and events moving through your builder circles.",
    stats: [
      { value: String(signals.communities.length), label: "communities" },
      { value: String(signals.projects.length), label: "projects" },
      { value: String(signals.events.length), label: "upcoming events" },
      { value: signals.source === "supabase" ? "Live" : "Ready", label: "activity" },
    ],
    items: items || fallback,
    source,
    ...(message ? { message } : {}),
  };
}

export async function GET() {
  const signals = await getSignals().catch(() => seedSignals);
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(responseFor(signals, "configuration", undefined, undefined, "Add OPENAI_API_KEY to .env.local to enable the AI-curated version."), { headers: { "Cache-Control": "no-store" } });
  }

  try {
    const model = process.env.OPENAI_MODEL?.trim() || "gpt-5-mini";
    const openAiResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        model,
        store: false,
        instructions: "You create concise daily digests for a community platform. Use only the supplied public platform signals. Do not invent people, counts, registrations, dates, links, or capabilities. Keep the tone warm and practical. Each card must point to exactly one allowed in-app destination.",
        input: `Create a useful digest from these public platform signals. Return only the requested structured data.\n${JSON.stringify({ date: new Date().toISOString().slice(0, 10), communities: signals.communities, projects: signals.projects, events: signals.events })}`,
        text: { format: { type: "json_schema", name: "community_digest", strict: true, schema: openAiSchema } },
        max_output_tokens: 900,
      }),
    });
    if (!openAiResponse.ok) throw new Error(`OpenAI request failed with status ${openAiResponse.status}`);
    const result: unknown = await openAiResponse.json();
    const content = extractOutputText(result);
    const parsed: unknown = JSON.parse(content);
    const data = parsed && typeof parsed === "object" ? parsed as { intro?: unknown; items?: unknown } : {};
    const fallback = fallbackItems(signals);
    return NextResponse.json(responseFor(signals, "openai", stringValue(data.intro, "", 180), safeItems(data.items, fallback)), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json(responseFor(signals, "fallback", undefined, undefined, "Showing the latest platform snapshot while AI curation reconnects."), { headers: { "Cache-Control": "no-store" } });
  }
}
