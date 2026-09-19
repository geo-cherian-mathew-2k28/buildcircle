"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";

type Page = "home" | "explore" | "communities" | "community" | "events" | "calendar" | "notifications" | "profile";
type Modal = "create" | "register" | "pass" | "checkin" | "digest" | "impact" | "showcase" | "membership" | null;
type ProfileDialogType = "edit" | "projects" | "project" | "circles" | null;
type ProjectName = "Signalboard" | "Field Notes";
type UserProfile = {
  name: string;
  email: string;
  bio: string;
  location: string;
  role: string;
  website: string;
};
type Message = {
  id: number;
  user: string;
  initials: string;
  shade: string;
  time: string;
  body: string;
  tag: string;
  replies: number;
  reactions: number;
  accepted: boolean;
  project?: boolean;
  image?: string;
  audio?: string;
  fileName?: string;
  fileUrl?: string;
};
type ThreadReply = {
  id: number;
  user: string;
  shade: string;
  body: string;
  time: string;
};
type DigestDestination = "community" | "explore" | "events";
type DigestItem = {
  category: string;
  title: string;
  summary: string;
  action: string;
  destination: DigestDestination;
  icon: "reply" | "sparkle" | "calendar" | "pin";
  tone: "teal" | "violet" | "orange" | "pink";
};
type DigestPayload = {
  generatedAt: string;
  intro: string;
  stats: { value: string; label: string }[];
  items: DigestItem[];
  source: "openai" | "fallback" | "configuration";
  message?: string;
};
type RegisteredEvent = {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  community: string;
  type?: string;
  color?: string;
};
type EventAgentDraft = {
  headline: string;
  communityPost: string;
  emailSubject: string;
  emailBody: string;
  inAppMessage: string;
  scheduleNote: string;
};
type EventAgentPayload = {
  source: "openai" | "fallback" | "configuration";
  draft: EventAgentDraft;
  message?: string;
};

const initialsFor = (name: string) => name.trim().split(/\s+/).filter(Boolean).map((word) => word[0]).slice(0, 2).join("").toUpperCase() || "BC";
const avatar = (name: string, shade = "violet") => (
  <span className={`avatar ${shade}`}>{initialsFor(name)}</span>
);

const initialProfile: UserProfile = {
  name: "Arjun Nair",
  email: "arjun@buildcircle.dev",
  bio: "Developer, community operator and relentless prototype-maker.",
  location: "Kochi, India",
  role: "Freelancer",
  website: "https://arjun.build",
};

const Icon = ({ name, size = 18 }: { name: string; size?: number }) => {
  const paths: Record<string, React.ReactNode> = {
    grid: <><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>,
    compass: <><circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z"/></>,
    people: <><path d="M16 20v-1.8a4.2 4.2 0 0 0-4.2-4.2H6.2A4.2 4.2 0 0 0 2 18.2V20"/><circle cx="9" cy="6.5" r="3.5"/><path d="M17 4.4a3.5 3.5 0 0 1 0 6.6M22 20v-1.8a4.2 4.2 0 0 0-3-4"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></>,
    bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 22h4"/></>,
    user: <><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></>,
    search: <><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    sparkle: <><path d="m12 3-1.2 5.7L5 10l5.8 1.3L12 17l1.2-5.7L19 10l-5.8-1.3L12 3Z"/><path d="m19 16-.5 2.4L16 19l2.5.6L19 22l.5-2.4L22 19l-2.5-.6L19 16Z"/></>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    hash: <path d="M5 9h14M5 15h14M9 3 7 21M17 3l-2 18"/>,
    send: <path d="m22 2-7 20-4-9-9-4 20-7ZM11 13l4-4"/>,
    heart: <path d="M20.8 4.6a5.4 5.4 0 0 0-7.6 0L12 5.8l-1.2-1.2a5.4 5.4 0 0 0-7.6 7.6L12 21l8.8-8.8a5.4 5.4 0 0 0 0-7.6Z"/>,
    reply: <><path d="M9 17 4 12l5-5"/><path d="M4 12h9a7 7 0 0 1 7 7"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
    paperclip: <path d="m20.5 11.5-8.7 8.7a5 5 0 0 1-7-7l9-9a3.5 3.5 0 0 1 5 5l-9 9a2 2 0 0 1-3-3l8-8"/>,
    image: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9" r="1.5"/><path d="m21 15-5-5L5 20"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    chevron: <path d="m9 18 6-6-6-6"/>,
    close: <path d="m6 6 12 12M18 6 6 18"/>,
    lock: <><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    pin: <><path d="M12 17v5M8 3h8l-1 6 3 3v2H6v-2l3-3-1-6Z"/></>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h5"/></>,
    wand: <><path d="m15 4 5 5M6 21l12-12-5-5L1 16l5 5Z"/><path d="m4 6 1-3 1 3 3 1-3 1-1 3-1-3-3-1 3-1Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] || paths.grid}</svg>;
};

type Community = {
  name: string;
  members: string;
  color: string;
  badge: string;
  description: string;
  tags: string[];
  category: string;
  access: "public" | "approval";
};

let communities: Community[] = [
  { name: "AI Agents", members: "8.4k", color: "teal", badge: "Joined", description: "Build autonomous systems, share patterns and ship useful agents.", tags: ["Agents", "LLMs", "Automation"], category: "AI", access: "public" },
  { name: "Codex Builders", members: "12.8k", color: "violet", badge: "Joined", description: "A practical space for people building with code and creative curiosity.", tags: ["Web", "Open source", "AI"], category: "Software", access: "public" },
  { name: "IoT Builders", members: "5.2k", color: "orange", badge: "Join", description: "Sensors, embedded systems and the messy joy of physical computing.", tags: ["ESP32", "Hardware", "Robotics"], category: "Hardware", access: "public" },
  { name: "UI/UX Builders", members: "4.9k", color: "pink", badge: "Join", description: "Interfaces people remember, systems teams can actually use.", tags: ["Design", "Product", "Research"], category: "Design", access: "public" },
  { name: "Open Source Kerala", members: "6.1k", color: "blue", badge: "Join", description: "A kind, practical community for people building in the open.", tags: ["GitHub", "Maintainers", "Kerala"], category: "Open source", access: "public" },
  { name: "Robotics Hub", members: "3.7k", color: "yellow", badge: "Request", description: "A home for makers moving atoms as well as pixels.", tags: ["Robotics", "ROS", "Hardware"], category: "Hardware", access: "approval" },
  { name: "Founders Circle", members: "2.1k", color: "pink", badge: "Request", description: "A private room for early-stage founders sharing candid lessons and useful introductions.", tags: ["Startups", "Product", "Fundraising"], category: "Startups", access: "approval" },
];

const messagesSeed: Message[] = [
  { id: 1, user: "Maya Chen", initials: "MC", shade: "orange", time: "10:24 AM", body: "I’m moving a FastAPI side project from Railway to a Docker setup. Any deployment patterns you’ve found reliable for small apps?", tag: "Question", replies: 12, reactions: 8, accepted: false },
  { id: 2, user: "Ishaan Rao", initials: "IR", shade: "teal", time: "10:42 AM", body: "For a clean first pass: Dockerfile + Compose, an Nginx reverse proxy, and health checks. I wrote up the flow we use in the project docs.", tag: "Reply", replies: 3, reactions: 14, accepted: true },
  { id: 3, user: "Alina Brooks", initials: "AB", shade: "pink", time: "11:05 AM", body: "Sharing a tiny tool we built to inspect agent traces visually. It maps tool calls, latency and failure branches without dumping a wall of JSON.", tag: "Showcase", replies: 7, reactions: 21, accepted: false, project: true },
];

const channelDetails: Record<string, { title: string; description: string; welcome: string; welcomeCopy: string; placeholder: string; readOnly?: boolean }> = {
  general: {
    title: "General",
    description: "The shared lounge for ideas, introductions and useful detours.",
    welcome: "Welcome to #General",
    welcomeCopy: "Introduce yourself, swap notes from the week, or start a conversation worth having.",
    placeholder: "Start a conversation in #General",
  },
  help: {
    title: "Help",
    description: "Ask, unblock and learn together.",
    welcome: "Welcome to #Help",
    welcomeCopy: "A place to ask technical questions, trade implementation details, and give generous feedback.",
    placeholder: "Ask or share with #Help",
  },
  projects: {
    title: "Projects",
    description: "Share prototypes, find collaborators and celebrate work in progress.",
    welcome: "Welcome to #Projects",
    welcomeCopy: "Show the work, the rough edges and the next thing you need help solving.",
    placeholder: "Share a project update in #Projects",
  },
  resources: {
    title: "Resources",
    description: "A curated shelf of practical tools, papers and references.",
    welcome: "Welcome to #Resources",
    welcomeCopy: "Post useful things with enough context to help the next builder pick them up.",
    placeholder: "Share a resource with #Resources",
  },
  announcements: {
    title: "Announcements",
    description: "Important updates from the AI Agents team.",
    welcome: "Welcome to #Announcements",
    welcomeCopy: "Only admins and moderators can post here, so the signal stays high.",
    placeholder: "Announcements are managed by moderators",
    readOnly: true,
  },
};

const channelSeeds: Record<string, Message[]> = {
  help: messagesSeed,
  general: [
    { id: 101, user: "Leena Thomas", initials: "LT", shade: "pink", time: "9:18 AM", body: "Morning, builders! What’s one small thing you shipped this week that you’re quietly proud of?", tag: "Discussion", replies: 18, reactions: 26, accepted: false },
    { id: 102, user: "Nikhil Varma", initials: "NV", shade: "teal", time: "9:36 AM", body: "I finally replaced a brittle cron workflow with a tiny agent that checks data quality and opens a structured issue when something drifts.", tag: "Discussion", replies: 6, reactions: 17, accepted: false },
  ],
  projects: [
    { id: 201, user: "Alina Brooks", initials: "AB", shade: "pink", time: "11:05 AM", body: "TraceView is now open for early testers. It makes the invisible parts of an agent run feel like a map instead of a log file.", tag: "Showcase", replies: 7, reactions: 21, accepted: false, project: true },
    { id: 202, user: "Rahul K", initials: "RK", shade: "orange", time: "Yesterday", body: "Made a personal research assistant that turns a folder of PDFs into an evidence trail. Next up: citations that survive team reviews.", tag: "Showcase", replies: 9, reactions: 32, accepted: false, project: true },
  ],
  resources: [
    { id: 301, user: "Ishaan Rao", initials: "IR", shade: "teal", time: "8:52 AM", body: "Resource drop: a concise guide to evaluating tool-using agents. The failure taxonomy alone is worth bookmarking before you add another prompt layer.", tag: "Resource", replies: 4, reactions: 38, accepted: false },
    { id: 302, user: "Maya Chen", initials: "MC", shade: "orange", time: "Yesterday", body: "I put together a starter repo for FastAPI + Docker + health checks. It’s intentionally boring, which is exactly why it has been useful.", tag: "Resource", replies: 11, reactions: 24, accepted: false },
  ],
  announcements: [
    { id: 401, user: "AI Agents Team", initials: "AT", shade: "violet", time: "9:00 AM", body: "Registration for Saturday’s Build your first AI agent workshop is open. It’s a hands-on, beginner-friendly session — bring an idea you want to make useful.", tag: "Announcement", replies: 0, reactions: 46, accepted: false },
    { id: 402, user: "Maya Chen", initials: "MC", shade: "orange", time: "Yesterday", body: "Community office hours are moving to Thursdays at 6:30 PM IST. Drop into #Help beforehand if you want your question added to the agenda.", tag: "Announcement", replies: 0, reactions: 19, accepted: false },
  ],
};

const communityTopics: Record<string, { focus: string; prompt: string; project: string; resource: string }> = {
  "AI Agents": { focus: "agent workflows", prompt: "Which evaluation signal saved your agent project this week?", project: "A compact tool-call evaluator with replayable traces.", resource: "A practical guide to tool-use evals and failure taxonomies." },
  "Codex Builders": { focus: "developer experience", prompt: "What small workflow is making your build loop calmer this week?", project: "A command palette for project decisions and shared release notes.", resource: "A concise checklist for reliable code review hand-offs." },
  "IoT Builders": { focus: "physical computing", prompt: "Which sensor or board are you currently trying to make more reliable?", project: "A battery-aware ESP32 field monitor with offline sync.", resource: "A starter reference for power budgets and sensor calibration." },
  "UI/UX Builders": { focus: "product craft", prompt: "What interaction are you refining until it feels effortless?", project: "A motion-safe component kit for high-trust product flows.", resource: "A teardown library for accessible forms and empty states." },
  "Open Source Kerala": { focus: "open collaboration", prompt: "Which contribution would make a maintainer’s week easier?", project: "A newcomer-friendly issue triage board for local maintainers.", resource: "A guide to writing kind, actionable contribution requests." },
  "Robotics Hub": { focus: "robotics", prompt: "What is the hardest thing your robot needs to understand right now?", project: "A ROS telemetry bridge for small indoor robots.", resource: "A field note on safe simulation-to-hardware testing." },
  "Founders Circle": { focus: "early-stage building", prompt: "What decision would be easier with one honest founder conversation?", project: "A customer-learning board that keeps evidence beside decisions.", resource: "A practical template for weekly founder updates." },
};

const featuredRegisteredEvent: RegisteredEvent = {
  id: "ai-agents-workshop",
  title: "Build your first AI agent",
  date: "2026-09-21",
  time: "4:00 PM – 6:00 PM IST",
  location: "Online · Live workshop",
  community: "AI Agents",
};

const upcomingEvents: RegisteredEvent[] = [
  featuredRegisteredEvent,
  { id: "build-brew-14", title: "Build & Brew #14", date: "2026-09-25", time: "6:30 PM IST", location: "Kochi · In person", community: "Codex Builders", type: "Community meetup", color: "violet" },
  { id: "oss-office-hours", title: "Open source office hours", date: "2026-09-28", time: "7:00 PM IST", location: "Online · AMA", community: "Open Source Kerala", type: "AMA", color: "orange" },
  { id: "design-systems", title: "Design systems, together", date: "2026-10-03", time: "5:30 PM IST", location: "Bengaluru · Workshop", community: "UI/UX Builders", type: "Workshop", color: "pink" },
  { id: "hardware-prototype-night", title: "Hardware Prototype Night", date: "2026-10-08", time: "6:00 PM IST", location: "Kochi · Hands-on lab", community: "IoT Builders", type: "Hardware lab", color: "orange" },
];

const communitySeedMessages = (communityName: string, channel: string): Message[] => {
  const topic = communityTopics[communityName] || { focus: "building", prompt: "What are you making this week?", project: "A new community project.", resource: "A useful reference for builders." };
  const base = Array.from(communityName).reduce((sum, character) => sum + character.charCodeAt(0), 0) * 10;
  const content: Record<string, [string, string, string, string]> = {
    general: ["Leena Thomas", "pink", `Welcome to ${communityName}. ${topic.prompt}`, "Discussion"],
    help: ["Maya Chen", "orange", `I’m looking for a practical approach to ${topic.focus}. What has actually held up for you?`, "Question"],
    projects: ["Alina Brooks", "violet", `Sharing a work in progress: ${topic.project}`, "Showcase"],
    resources: ["Ishaan Rao", "teal", `Resource drop: ${topic.resource}`, "Resource"],
    announcements: [`${communityName} Team`, "violet", `This week in ${communityName}: introduce yourself, share useful work, and join the next builder room.`, "Announcement"],
  };
  const [user, shade, body, tag] = content[channel] || content.general;
  return [{ id: base + channel.length, user, initials: user.split(" ").map((part) => part[0]).join(""), shade, time: "Today", body, tag, replies: channel === "announcements" ? 0 : 3, reactions: 8, accepted: false, project: channel === "projects" }];
};

function VoiceNote({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const toggle = () => { const audio = audioRef.current; if (!audio) return; if (audio.paused) { void audio.play(); setPlaying(true); } else { audio.pause(); setPlaying(false); } };
  const seek = (event: React.MouseEvent<HTMLDivElement>) => { const audio = audioRef.current; if (!audio || !duration) return; const bounds = event.currentTarget.getBoundingClientRect(); audio.currentTime = Math.max(0, Math.min(duration, ((event.clientX - bounds.left) / bounds.width) * duration)); };
  const label = (seconds: number) => `${Math.floor(seconds / 60)}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  const progress = duration ? (currentTime / duration) * 100 : 0;
  return <div className="voice-note-player"><audio ref={audioRef} src={src} onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)} onTimeUpdate={(event) => setCurrentTime(event.currentTarget.currentTime)} onEnded={() => { setPlaying(false); setCurrentTime(0); }}/><button type="button" className="voice-play" onClick={toggle} aria-label={playing ? "Pause voice message" : "Play voice message"}>{playing ? "❚❚" : "▶"}</button><div className="voice-track" role="slider" aria-label="Voice message progress" aria-valuemin={0} aria-valuemax={Math.round(duration)} aria-valuenow={Math.round(currentTime)} onClick={seek}>{Array.from({ length: 26 }, (_, index) => <i key={index} style={{ opacity: index / 26 * 100 <= progress ? 1 : .35, height: `${20 + ((index * 17) % 52)}%` }}/>)}</div><span>{label(currentTime || duration)}</span></div>;
}
function MiniLogo({ color = "violet" }: { color?: string }) {
  return <span className={`mini-logo ${color}`}><i/><i/><i/></span>;
}

function PlatformLogo({ className = "" }: { className?: string }) {
  return <img className={`platform-logo ${className}`.trim()} src="/buildcircle-logo.png" alt="BuildCircle logo" />;
}

export default function BuildCircle() {
  const [page, setPage] = useState<Page>("home");
  const [modal, setModal] = useState<Modal>(null);
  const [joined, setJoined] = useState<string[]>(["AI Agents", "Codex Builders"]);
  const [channel, setChannel] = useState("help");
  const [channelMessages, setChannelMessages] = useState(channelSeeds);
  const [draft, setDraft] = useState("");
  const [attached, setAttached] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachedAudio, setAttachedAudio] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [registeredEvents, setRegisteredEvents] = useState<RegisteredEvent[]>([]);
  const [registrationTarget, setRegistrationTarget] = useState<RegisteredEvent>(featuredRegisteredEvent);
  const [wishlistedEvents, setWishlistedEvents] = useState<RegisteredEvent[]>([]);
  const [eventPlanReady, setEventPlanReady] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [eventMoved, setEventMoved] = useState(false);
  const [activeCommunityName, setActiveCommunityName] = useState("AI Agents");
  const [showSearch, setShowSearch] = useState(false);
  const [toast, setToast] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [profile, setProfile] = useState<UserProfile>(initialProfile);

  useEffect(() => {
    try {
      const storedProfile = window.localStorage.getItem("buildcircle-profile");
      if (!storedProfile) return;
      const savedProfile = JSON.parse(storedProfile) as Partial<UserProfile>;
      setProfile({
        ...initialProfile,
        ...savedProfile,
        website: savedProfile.website && !/^https?:\/\//i.test(savedProfile.website) ? `https://${savedProfile.website}` : savedProfile.website || initialProfile.website,
      });
    } catch {
      window.localStorage.removeItem("buildcircle-profile");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem("buildcircle-event-plan");
      if (stored) {
        const plan = JSON.parse(stored) as { registeredEvents?: RegisteredEvent[]; wishlistedEvents?: RegisteredEvent[] };
        if (Array.isArray(plan.registeredEvents)) setRegisteredEvents(plan.registeredEvents);
        if (Array.isArray(plan.wishlistedEvents)) setWishlistedEvents(plan.wishlistedEvents);
      }
    } catch {
      window.localStorage.removeItem("buildcircle-event-plan");
    } finally {
      setEventPlanReady(true);
    }
  }, []);

  useEffect(() => {
    if (!eventPlanReady) return;
    window.localStorage.setItem("buildcircle-event-plan", JSON.stringify({ registeredEvents, wishlistedEvents }));
  }, [eventPlanReady, registeredEvents, wishlistedEvents]);

  const notify = (text: string) => {
    setToast(text);
    window.setTimeout(() => setToast(""), 2800);
  };
  const saveProfile = (nextProfile: UserProfile) => {
    setProfile(nextProfile);
    window.localStorage.setItem("buildcircle-profile", JSON.stringify(nextProfile));
    notify("Profile updated across BuildCircle");
  };
  const beginEventRegistration = (event: RegisteredEvent) => {
    setRegistrationTarget(event);
    setModal("register");
  };
  const registerForSelectedEvent = () => {
    setRegisteredEvents((events) => events.some((event) => event.id === registrationTarget.id) ? events : [...events, registrationTarget]);
    setWishlistedEvents((events) => events.filter((event) => event.id !== registrationTarget.id));
    setModal("pass");
    notify(`${registrationTarget.title} is registered — it is now in your calendar`);
  };
  const openEventPass = (event: RegisteredEvent) => {
    setRegistrationTarget(event);
    setModal("pass");
  };
  const toggleWishlist = (event: RegisteredEvent) => {
    if (registeredEvents.some((registeredEvent) => registeredEvent.id === event.id)) {
      notify("This event is already in your registered calendar");
      return;
    }
    setWishlistedEvents((events) => {
      const saved = events.some((savedEvent) => savedEvent.id === event.id);
      notify(saved ? `${event.title} removed from your wishlist` : `${event.title} added to your wishlist`);
      return saved ? events.filter((savedEvent) => savedEvent.id !== event.id) : [...events, event];
    });
  };

  const addMessage = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim() && !attached && !attachedAudio) return;
    setChannelMessages((current) => ({
      ...current,
      [`${activeCommunityName}:${channel}`]: [...(current[`${activeCommunityName}:${channel}`] || []), {
        id: Date.now(), user: profile.name, initials: initialsFor(profile.name), shade: "violet", time: "Just now", body: draft || (attachedAudio ? "Voice message" : attachmentName ? `Shared ${attachmentName}` : "Shared an image"), tag: channel === "projects" ? "Showcase" : "Discussion", replies: 0, reactions: 0, accepted: false, image: attached && !attachmentName ? attached : undefined, audio: attachedAudio || undefined, fileName: attachmentName || undefined, fileUrl: attached && attachmentName ? attached : undefined,
      }],
    }));
    setDraft(""); setAttached(null); setAttachmentName(""); setAttachedAudio(null); notify(`Posted to #${channelDetails[channel].title}`);
  };

  const switchPage = (next: Page) => { setPage(next); setShowSearch(false); };
  const join = (name: string) => {
    setJoined((items) => items.includes(name) ? items : [...items, name]);
    notify(`You joined ${name}`);
  };
  const createCommunity = (draft: { name: string; description: string; category: string; access: "public" | "approval" }) => {
    const name = draft.name.trim();
    if (!name || communities.some((community) => community.name.toLowerCase() === name.toLowerCase())) { notify("Choose a community name that is not already in use"); return; }
    const colors = ["violet", "teal", "orange", "pink", "blue"];
    communities = [...communities, { name, members: "1", color: colors[communities.length % colors.length], badge: "Joined", description: draft.description.trim(), tags: [draft.category, "New circle", "Builder-led"], category: draft.category, access: draft.access }];
    setJoined((items) => [...items, name]); setActiveCommunityName(name); setChannel("general"); setModal(null); setPage("community"); notify(`${name} is ready to shape`);
  };

  const content = useMemo(() => {
    if (page === "communities") return <CommunitiesView joined={joined} onJoin={join} onOpen={(name) => { setActiveCommunityName(name); setPage("community"); }} onCreate={() => setModal("create")} />;
    if (page === "community") return <CommunityView profile={profile} communityName={activeCommunityName} channel={channel} setChannel={setChannel} channelMessages={channelMessages} setChannelMessages={setChannelMessages} draft={draft} setDraft={setDraft} attached={attached} setAttached={setAttached} attachmentName={attachmentName} setAttachmentName={setAttachmentName} attachedAudio={attachedAudio} setAttachedAudio={setAttachedAudio} onSubmit={addMessage} onShowcase={() => setModal("showcase")} onMembership={() => setModal("membership")} onSwitchCommunity={(name) => { setActiveCommunityName(name); setChannel("help"); }} onBrowseCommunities={() => setPage("communities")} />;
    if (page === "explore") return <ExploreView joined={joined} onJoin={join} onOpen={(name) => { setActiveCommunityName(name); setPage("community"); }} onCreate={() => setModal("create")} />;
    if (page === "events") return <EventsView registeredEvents={registeredEvents} eventMoved={eventMoved} wishlistedEvents={wishlistedEvents} onRegister={beginEventRegistration} onPass={openEventPass} onCheckin={() => setModal("checkin")} onImpact={() => setModal("impact")} onMove={() => { setEventMoved(true); notify("Event time updated — attendees are being reviewed"); }} onToggleWishlist={toggleWishlist} />;
    if (page === "calendar") return <CalendarView registeredEvents={registeredEvents} wishlistedEvents={wishlistedEvents} onOpenEvents={() => setPage("events")} onToggleWishlist={toggleWishlist} onViewPass={openEventPass} />;
    if (page === "notifications") return <NotificationsView profile={profile} onOpen={() => setPage("community")} />;
    if (page === "profile") return <ProfileView profile={profile} onSave={saveProfile} />;
    return <HomeView profile={profile} onExplore={() => setPage("explore")} onCommunity={() => { setActiveCommunityName("AI Agents"); setPage("community"); }} onEvents={() => setPage("events")} onDigest={() => setModal("digest")} />;
  }, [page, channel, channelMessages, draft, attached, attachedAudio, joined, registeredEvents, wishlistedEvents, eventMoved, activeCommunityName, profile]);

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => switchPage("home")} aria-label="BuildCircle home"><PlatformLogo className="brand-logo"/><span>build<span>circle</span></span></button>
        <nav className="primary-nav" aria-label="Primary navigation">
          <NavItem label="Home" icon="grid" active={page === "home"} onClick={() => switchPage("home")} />
          <NavItem label="Explore" icon="compass" active={page === "explore"} onClick={() => switchPage("explore")} />
          <NavItem label="Communities" icon="people" active={page === "communities" || page === "community"} onClick={() => switchPage("communities")} />
          <NavItem label="Events" icon="calendar" active={page === "events"} onClick={() => switchPage("events")} />
          <NavItem label="Calendar" icon="calendar" active={page === "calendar"} onClick={() => switchPage("calendar")} />
          <NavItem label="Notifications" icon="bell" active={page === "notifications"} count="3" onClick={() => switchPage("notifications")} />
        </nav>
        <div className="sidebar-spacer" />
        <button className="create-button" onClick={() => setModal("create")}><Icon name="plus" size={17}/> Create</button>
        <button className="account-block" onClick={() => switchPage("profile")}>{avatar(profile.name, "violet")}<span><b>{profile.name}</b><small>Builder profile</small></span><Icon name="chevron" size={16}/></button>
      </aside>

      <section className="main-area">
        <header className="topbar">
          <div className="mobile-brand"><PlatformLogo className="mobile-logo"/>buildcircle</div>
          <div className="search-wrap">
            <Icon name="search" size={17}/><input value={query} onChange={(e) => { setQuery(e.target.value); setShowSearch(true); }} onFocus={() => setShowSearch(true)} placeholder="Search communities, discussions, events..." />
            <kbd>⌘ K</kbd>
            {showSearch && <SearchResults query={query} onNavigate={(target) => { switchPage(target); setQuery(""); }} />}
          </div>
          <div className="top-actions"><button className="icon-button" aria-label="Toggle theme" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "◐" : "☼"}</button><button className="notification-dot" onClick={() => switchPage("notifications")}><Icon name="bell"/><i/></button>{avatar(profile.name, "violet")}</div>
        </header>
        {content}
      </section>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        <NavItem label="Home" icon="grid" active={page === "home"} onClick={() => switchPage("home")} />
        <NavItem label="Explore" icon="compass" active={page === "explore"} onClick={() => switchPage("explore")} />
        <button className="mobile-create" onClick={() => setModal("create")}><Icon name="plus"/></button>
        <NavItem label="Events" icon="calendar" active={page === "events"} onClick={() => switchPage("events")} />
        <NavItem label="Calendar" icon="calendar" active={page === "calendar"} onClick={() => switchPage("calendar")} />
        <NavItem label="Profile" icon="user" active={page === "profile"} onClick={() => switchPage("profile")} />
      </nav>

      {modal && <ModalLayer type={modal} close={() => setModal(null)} profile={profile} registered={registeredEvents.some((event) => event.id === registrationTarget.id)} registrationEvent={registrationTarget} checkedIn={checkedIn} eventMoved={eventMoved} onNavigate={(target) => { switchPage(target); setModal(null); }} onRegister={registerForSelectedEvent} onCheckin={() => { setCheckedIn(true); notify("Attendee checked in successfully"); }} onMove={() => { setEventMoved(true); setModal("impact"); }} onShowcase={(project) => { setChannelMessages((current) => ({ ...current, [`${activeCommunityName}:projects`]: [...(current[`${activeCommunityName}:projects`] || []), { id: Date.now(), user: profile.name, initials: initialsFor(profile.name), shade: "violet", time: "Just now", body: project.description, tag: "Showcase", replies: 0, reactions: 0, accepted: false, project: true, image: project.image }] })); setChannel("projects"); setModal(null); setPage("community"); notify("Your project showcase was published"); }} onCreate={createCommunity} />}
      {toast && <div className="toast"><Icon name="check" size={16}/>{toast}</div>}
    </main>
  );
}

function NavItem({ label, icon, active, count, onClick }: { label: string; icon: string; active?: boolean; count?: string; onClick: () => void }) {
  return <button onClick={onClick} className={`nav-item ${active ? "active" : ""}`}><Icon name={icon}/><span>{label}</span>{count && <em>{count}</em>}</button>;
}

function HomeView({ profile, onExplore, onCommunity, onEvents, onDigest }: { profile: UserProfile; onExplore: () => void; onCommunity: () => void; onEvents: () => void; onDigest: () => void }) {
  const [openCardMenu, setOpenCardMenu] = useState<"question" | "project" | null>(null);
  const [savedCards, setSavedCards] = useState<string[]>([]);
  const toggleSaved = (card: string) => setSavedCards((cards) => cards.includes(card) ? cards.filter((item) => item !== card) : [...cards, card]);
  return <div className="page-content home-page">
    <section className="welcome-row"><div><p className="eyebrow">FRIDAY, SEPTEMBER 19</p><h1>Good morning, {profile.name.split(" ")[0]} <span>✦</span></h1><p className="subtitle">Your builder network is moving. Here’s what’s worth your attention.</p></div><button className="ai-button" onClick={onDigest}><Icon name="sparkle" size={17}/><span><b>Today’s digest</b><small>Powered by community activity</small></span><Icon name="arrow" size={16}/></button></section>
    <div className="story-strip">
      {communities.slice(0, 3).map((community, index) => <button className="community-pill" key={community.name} onClick={onCommunity}><MiniLogo color={community.color}/><span><b>{community.name}</b><small>{index === 0 ? "18 new posts" : index === 1 ? "Workshop tomorrow" : "6 new projects"}</small></span><Icon name="chevron" size={15}/></button>)}
      <button className="discover-pill" onClick={onExplore}><Icon name="plus" size={17}/><span>Discover<br/>communities</span></button>
    </div>
    <div className="home-grid">
      <section className="feed"><div className="section-title"><div><p className="eyebrow">FOR YOU</p><h2>Activity around your circles</h2></div><button className="text-button" onClick={onCommunity}>View all <Icon name="arrow" size={15}/></button></div>
        <article className="feed-card featured"><div className="card-topline"><span className="community-label"><MiniLogo color="teal"/> AI Agents · <b>#Help</b></span><div className="card-menu"><button className="quiet-button" aria-label="Options for FastAPI discussion" aria-expanded={openCardMenu === "question"} onClick={() => setOpenCardMenu((current) => current === "question" ? null : "question")}><Icon name="more"/></button>{openCardMenu === "question" && <div className="card-menu-panel" role="menu"><button role="menuitem" onClick={() => { toggleSaved("question"); setOpenCardMenu(null); }}>{savedCards.includes("question") ? "Remove saved post" : "Save for later"}</button><button role="menuitem" onClick={() => { setOpenCardMenu(null); onCommunity(); }}>Open discussion <Icon name="arrow" size={14}/></button></div>}</div></div><div className="post-author">{avatar("Maya Chen", "orange")}<span><b>Maya Chen</b><small>ML Engineer · 14 min ago</small></span></div><h3>What’s your reliable FastAPI deployment setup?</h3><p>I’m moving a side project from Railway to Docker. Curious what deployment patterns are holding up well for small apps.</p><div className="feed-actions"><button><Icon name="heart" size={16}/> 8</button><button onClick={onCommunity}><Icon name="reply" size={16}/> 12 replies</button><span className="status-chip question">Question</span></div></article>
        <article className="feed-card project-card"><div className="card-topline"><span className="community-label"><MiniLogo color="violet"/> Codex Builders · <b>#Projects</b></span><div className="card-menu"><button className="quiet-button" aria-label="Options for TraceView project" aria-expanded={openCardMenu === "project"} onClick={() => setOpenCardMenu((current) => current === "project" ? null : "project")}><Icon name="more"/></button>{openCardMenu === "project" && <div className="card-menu-panel" role="menu"><button role="menuitem" onClick={() => { toggleSaved("project"); setOpenCardMenu(null); }}>{savedCards.includes("project") ? "Remove saved project" : "Save for later"}</button><button role="menuitem" onClick={() => { setOpenCardMenu(null); onExplore(); }}>Explore project <Icon name="arrow" size={14}/></button></div>}</div></div><div className="project-preview"><div className="project-visual"><div className="trace-node a"/><div className="trace-node b"/><div className="trace-node c"/><svg viewBox="0 0 250 120"><path d="M35 65C66 65 69 27 104 27s35 65 70 65 25-39 45-39" fill="none" stroke="currentColor" strokeWidth="2"/></svg><span>TRACEVIEW</span></div><div><div className="post-author">{avatar("Alina Brooks", "pink")}<span><b>Alina Brooks</b><small>Product designer · 28 min ago</small></span></div><h3>TraceView — make agent runs visible</h3><p>A visual debugger for tool calls, latency and failure paths.</p><div className="tag-row"><span>TypeScript</span><span>OpenAI</span><span>OSS</span></div></div></div><div className="feed-actions"><button><Icon name="heart" size={16}/> 21</button><button onClick={onCommunity}><Icon name="reply" size={16}/> 7 replies</button><span className="status-chip showcase">Showcase</span></div></article>
      </section>
      <aside className="right-rail"><div className="section-title"><div><p className="eyebrow">UP NEXT</p><h2>Events you’ll like</h2></div><button className="text-button" onClick={onEvents}>All events</button></div>
        <button className="event-card" onClick={onEvents}><div className="event-date"><b>21</b><span>SEP</span></div><div><p className="event-type">WORKSHOP · ONLINE</p><h3>Build your first AI agent</h3><p>Sat · 4:00 PM · AI Agents</p><div className="attendees">{avatar("Leah", "orange")}{avatar("Nikhil", "teal")}{avatar("Maya", "pink")}<span>+128 going</span></div></div><Icon name="chevron" size={17}/></button>
        <button className="event-card compact" onClick={onEvents}><div className="event-date purple"><b>25</b><span>SEP</span></div><div><p className="event-type">MEETUP · KOCHI</p><h3>Build & Brew #14</h3><p>Thu · 6:30 PM · Codex Builders</p></div><Icon name="chevron" size={17}/></button>
        <div className="section-title lower"><div><p className="eyebrow">SUGGESTED</p><h2>Expand your circles</h2></div></div>
        {communities.slice(2).map((community) => <div className="suggestion" key={community.name}><MiniLogo color={community.color}/><div><b>{community.name}</b><small>{community.members} builders</small></div><button onClick={() => onExplore()}>View</button></div>)}
      </aside>
    </div>
  </div>;
}

function CommunitiesView({ joined, onJoin, onOpen, onCreate }: { joined: string[]; onJoin: (name: string) => void; onOpen: (name: string) => void; onCreate: () => void }) {
  const [view, setView] = useState<"all" | "joined">("all");
  const [requests, setRequests] = useState<Record<string, boolean>>({});
  const visible = view === "joined" ? communities.filter((community) => joined.includes(community.name)) : communities;
  return <div className="page-content communities-page">
    <section className="communities-hero">
      <div><p className="eyebrow">YOUR NETWORK</p><h1>Communities that move work forward.</h1><p>Rooms for real-time conversation, project collaboration and meaningful connections—without losing the signal.</p></div>
      <div className="community-hero-stats"><span><b>{joined.length}</b> circles joined</span><span><b>{communities.length}</b> to explore</span></div>
    </section>
    <div className="community-directory-bar"><div className="community-tabs" role="tablist" aria-label="Community directory"><button role="tab" aria-selected={view === "all"} className={view === "all" ? "active" : ""} onClick={() => setView("all")}>All communities <span>{communities.length}</span></button><button role="tab" aria-selected={view === "joined"} className={view === "joined" ? "active" : ""} onClick={() => setView("joined")}>Your circles <span>{joined.length}</span></button></div><button className="outline-button" onClick={onCreate}><Icon name="plus" size={16}/> Start a community</button></div>
    <section className="community-feature-strip"><div><Icon name="hash" size={18}/><span><b>Focused rooms</b><small>Channels, threads and announcements</small></span></div><div><Icon name="people" size={18}/><span><b>People-first</b><small>Member discovery and direct conversations</small></span></div><div><Icon name="paperclip" size={18}/><span><b>Share the work</b><small>Files, projects and useful resources</small></span></div></section>
    <div className="browse-head"><div><h2>{view === "all" ? "Find your next circle" : "Your active circles"}</h2><p>{view === "all" ? "Open a public community instantly or request access to a private one." : "Everything you have access to, in one place."}</p></div></div>
    <div className="community-grid">{visible.map((community) => { const isJoined = joined.includes(community.name); const isPending = requests[community.name]; const canOpen = community.access === "public" || isJoined; const action = isJoined ? "Open" : community.access === "approval" ? isPending ? "Request sent" : "Request join" : "Join"; return <article className="community-card directory-card" key={community.name}><button type="button" className={`community-cover ${community.color}`} aria-label={canOpen ? `Open ${community.name}` : `Request access to ${community.name}`} onClick={() => canOpen && onOpen(community.name)}><div className="cover-pattern"/><MiniLogo color={community.color}/>{isJoined && <span className="featured-label">Joined</span>}</button><div className="community-card-body"><div className="community-name-row"><div><h3>{community.name}</h3><p>{community.members} members · {community.access === "approval" ? "Private" : "Public"}</p></div><button className={isJoined ? "joined-button" : "join-button"} disabled={isPending} onClick={() => { if (isJoined) onOpen(community.name); else if (community.access === "approval") setRequests((current) => ({ ...current, [community.name]: true })); else onJoin(community.name); }}>{action}</button></div><p className="community-description">{community.description}</p>{isPending && <p className="community-access-note"><Icon name="lock" size={13}/> Request sent — an admin will review access.</p>}<div className="tag-row">{community.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="builder-row"><div className="avatar-stack">{avatar("Priya", "pink")}{avatar("Hari", "teal")}{avatar("Zoya", "orange")}</div><span>Active this week</span></div></div></article>; })}</div>
    {!visible.length && <div className="explore-empty"><span className="digest-glyph"><Icon name="people" size={20}/></span><h2>No joined communities yet.</h2><p>Browse all communities to find your people.</p><button className="outline-button" onClick={() => setView("all")}>Explore communities</button></div>}
  </div>;
}
function CommunityView({ profile, communityName, channel, setChannel, channelMessages, setChannelMessages, draft, setDraft, attached, setAttached, attachmentName, setAttachmentName, attachedAudio, setAttachedAudio, onSubmit, onShowcase, onMembership, onSwitchCommunity, onBrowseCommunities }: { profile: UserProfile; communityName: string; channel: string; setChannel: (value: string) => void; channelMessages: Record<string, Message[]>; setChannelMessages: React.Dispatch<React.SetStateAction<Record<string, Message[]>>>; draft: string; setDraft: (value: string) => void; attached: string | null; setAttached: (value: string | null) => void; attachmentName: string; setAttachmentName: (value: string) => void; attachedAudio: string | null; setAttachedAudio: (value: string | null) => void; onSubmit: (event: FormEvent) => void; onShowcase: () => void; onMembership: () => void; onSwitchCommunity: (name: string) => void; onBrowseCommunities: () => void }) {
  const [thread, setThread] = useState<number | null>(null);
  const [threadDraft, setThreadDraft] = useState("");
  const [showCirclePicker, setShowCirclePicker] = useState(false);
  const [showAdminControls, setShowAdminControls] = useState(false);
  const [approvalOnly, setApprovalOnly] = useState(false);
  const [filesEnabled, setFilesEnabled] = useState(true);
  const [messageMenu, setMessageMenu] = useState<number | null>(null);
  const [hiddenMessages, setHiddenMessages] = useState<number[]>([]);
  const [recording, setRecording] = useState(false);
  const [voiceError, setVoiceError] = useState("");
  const recorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [workspacePanel, setWorkspacePanel] = useState<"none" | "messages">("none");
  const [liveRoom, setLiveRoom] = useState(false);
  const [roomJoined, setRoomJoined] = useState(false);
  const [likedMessages, setLikedMessages] = useState<number[]>([]);
  const [buildTokens, setBuildTokens] = useState(124);
  const [channelEditorOpen, setChannelEditorOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [customChannels, setCustomChannels] = useState<Record<string, Array<[string, string]>>>({});
  const [communityProfileOpen, setCommunityProfileOpen] = useState(false);
  const [communityDescriptions, setCommunityDescriptions] = useState<Record<string, string>>({});
  const [channelSettingsOpen, setChannelSettingsOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState("general");
  const [channelTitleDraft, setChannelTitleDraft] = useState("General");
  const [channelReadOnlyDraft, setChannelReadOnlyDraft] = useState(false);
  const [channelLabels, setChannelLabels] = useState<Record<string, string>>({});
  const [readOnlyChannels, setReadOnlyChannels] = useState<Record<string, boolean>>({});
  const [announcementBotEnabled, setAnnouncementBotEnabled] = useState(true);
  const [activeChat, setActiveChat] = useState("Maya Chen");
  const [chatDraft, setChatDraft] = useState("");
  const [directMessages, setDirectMessages] = useState<Record<string, string[]>>({ "Maya Chen": ["Hey! Are you joining the builder room later?"], "Ishaan Rao": ["I added the health-check notes to the resource thread."], "Alina Brooks": ["Would love your eyes on the TraceView flow when you have a minute."] });
  const [threadReplies, setThreadReplies] = useState<Record<number, ThreadReply[]>>({
    1: [{ id: 1001, user: "Hari Menon", shade: "teal", body: "A deploy health-check endpoint is worth adding from day one. It gives you a simple signal when you move providers.", time: "8 min ago" }, { id: 1002, user: "Lena Park", shade: "pink", body: "We use Fly.io with the same Docker setup — very little ceremony for a small API.", time: "4 min ago" }],
    2: [{ id: 1003, user: "Maya Chen", shade: "orange", body: "This is exactly the level of boring I was hoping to find. Thank you!", time: "6 min ago" }],
    3: [{ id: 1004, user: "Nikhil Varma", shade: "teal", body: "The latency branch is especially useful. Would love to try this against a multi-agent trace.", time: "9 min ago" }],
    101: [{ id: 1005, user: "Maya Chen", shade: "orange", body: "I finally made time for a proper evaluation set instead of testing by feel.", time: "3 min ago" }],
    102: [{ id: 1006, user: "Leena Thomas", shade: "blue", body: "That sounds like the kind of quiet automation that pays for itself every week.", time: "7 min ago" }],
    201: [{ id: 1007, user: "Alina Brooks", shade: "pink", body: "I’m looking for a few people with complex tool traces to pressure-test it with.", time: "5 min ago" }],
    202: [{ id: 1008, user: "Rahul K", shade: "yellow", body: "The evidence chain is the part I wish research tools got right more often.", time: "12 min ago" }],
    301: [{ id: 1009, user: "Ishaan Rao", shade: "teal", body: "The rubric section is concise enough to use in a real review.", time: "14 min ago" }],
  });

  const baseLinks: Array<[string, string]> = [["general", "General"], ["help", "Help"], ["projects", "Projects"], ["resources", "Resources"]];
  const allChannelEntries = [...baseLinks, ...(customChannels[communityName] || [])];
  const scopedChannel = `${communityName}:${channel}`;
  const channelLabelFor = (id: string) => channelLabels[`${communityName}:${id}`] || allChannelEntries.find(([entryId]) => entryId === id)?.[1] || (id === "announcements" ? "Announcements" : "Channel");
  const links = allChannelEntries.map(([id, label]) => [id, channelLabels[`${communityName}:${id}`] || label] as [string, string]);
  const customChannel = (customChannels[communityName] || []).find(([id]) => id === channel);
  const baseDetails = channelDetails[channel] || {
    title: customChannel?.[1] || "General",
    description: customChannel ? "A member discussion room for focused collaboration." : channelDetails.general.description,
    welcome: `Welcome to #${customChannel?.[1] || "General"}`,
    welcomeCopy: "Bring a useful question, a work in progress, or a practical lesson for the room.",
    placeholder: `Start a conversation in #${customChannel?.[1] || "General"}`,
    readOnly: false,
  };
  const channelTitle = channelLabelFor(channel);
  const isAnnouncementChannel = channel === "announcements";
  const isReadOnly = Boolean(baseDetails.readOnly || readOnlyChannels[scopedChannel]);
  const actorRole = communityName === "Open Source Kerala" ? "Moderator" : communityName === "AI Agents" ? "Admin" : "Member";
  const canPostAnnouncements = actorRole === "Admin" || actorRole === "Moderator";
  const currentCommunity = communities.find((community) => community.name === communityName);
  const currentCommunityDescription = communityDescriptions[communityName] || currentCommunity?.description || "A focused space for builders to collaborate.";
  const details = isAnnouncementChannel
    ? { ...baseDetails, title: channelTitle, description: `Official updates from the ${communityName} team.`, welcome: "Welcome to #Announcements", welcomeCopy: `Only ${communityName} admins and moderators can post here, so every update stays useful and trustworthy.` }
    : { ...baseDetails, title: channelTitle, welcome: `Welcome to #${channelTitle}`, placeholder: `Start a conversation in #${channelTitle}` };
  const messages = channelMessages[scopedChannel] || communitySeedMessages(communityName, channel);
  const selected = messages.find((message) => message.id === thread);
  const selectedReplies = thread ? threadReplies[thread] || [] : [];  const switchChannel = (next: string) => { setChannel(next); setThread(null); setThreadDraft(""); setDraft(""); setAttached(null); };
  const react = (id: number) => {
    const alreadyLoved = likedMessages.includes(id);
    setLikedMessages((items) => alreadyLoved ? items.filter((item) => item !== id) : [...items, id]);
    setBuildTokens((balance) => Math.max(0, balance + (alreadyLoved ? -1 : 1)));
    setChannelMessages((current) => ({ ...current, [scopedChannel]: (current[scopedChannel] || communitySeedMessages(communityName, channel)).map((item) => item.id === id ? { ...item, reactions: Math.max(0, item.reactions + (alreadyLoved ? -1 : 1)) } : item) }));
  };
  const chooseFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttached(URL.createObjectURL(file));
    setAttachmentName(file.type.startsWith("image/") ? "" : file.name);
    setAttachedAudio(null);
  };
  const startRecording = async () => {
    setVoiceError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];
      recorder.ondataavailable = (event) => { if (event.data.size) audioChunksRef.current.push(event.data); };
      recorder.onstop = () => {
        const audio = new Blob(audioChunksRef.current, { type: recorder.mimeType || "audio/webm" });
        setAttachedAudio(URL.createObjectURL(audio));
        setAttached(null); setAttachmentName(""); setRecording(false);
        stream.getTracks().forEach((track) => track.stop());
      };
      recorderRef.current = recorder;
      recorder.start(); setRecording(true);
    } catch {
      setVoiceError("Microphone access is needed to record a voice message.");
    }
  };
  const stopRecording = () => recorderRef.current?.state === "recording" && recorderRef.current.stop();
  const deleteForMe = (id: number) => { setHiddenMessages((items) => [...items, id]); setMessageMenu(null); };
  const deleteForEveryone = (id: number) => { setChannelMessages((current) => ({ ...current, [scopedChannel]: (current[scopedChannel] || communitySeedMessages(communityName, channel)).filter((message) => message.id !== id) })); setMessageMenu(null); };
  const openThread = (messageId: number) => { setThread(messageId); setThreadDraft(""); };
  const sendThreadReply = (event: FormEvent) => {
    event.preventDefault();
    if (!thread || !threadDraft.trim()) return;
    const reply: ThreadReply = { id: Date.now(), user: profile.name, shade: "violet", body: threadDraft.trim(), time: "Just now" };
    setThreadReplies((current) => ({ ...current, [thread]: [...(current[thread] || []), reply] }));
    setChannelMessages((current) => ({ ...current, [scopedChannel]: (current[scopedChannel] || communitySeedMessages(communityName, channel)).map((message) => message.id === thread ? { ...message, replies: message.replies + 1 } : message) }));
    setThreadDraft("");
  };
  const sendDirectMessage = (event: FormEvent) => {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    setDirectMessages((current) => ({ ...current, [activeChat]: [...(current[activeChat] || []), `You: ${message}`] }));
    setChatDraft("");
  };
  const directContacts = [["Maya Chen", "orange", "Online now"], ["Ishaan Rao", "teal", "Active 12m ago"], ["Alina Brooks", "pink", "Online now"]] as const;

  const createChannel = (event: FormEvent) => { event.preventDefault(); const label = newChannelName.trim(); if (!label) return; const id = label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `room-${Date.now()}`; setCustomChannels((current) => ({ ...current, [communityName]: [...(current[communityName] || []), [id, label]] })); setNewChannelName(""); setChannel(id); setChannelEditorOpen(false); };
  const saveCommunityProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const description = communityDescriptions[communityName]?.trim();
    if (description) setCommunityDescriptions((current) => ({ ...current, [communityName]: description }));
    setCommunityProfileOpen(false);
  };
  const openChannelSettings = (id = channel) => {
    const key = `${communityName}:${id}`;
    setEditingChannel(id);
    setChannelTitleDraft(channelLabelFor(id));
    setChannelReadOnlyDraft(id === "announcements" || Boolean(readOnlyChannels[key]));
    setChannelSettingsOpen(true);
  };
  const selectChannelForSettings = (id: string) => {
    const key = `${communityName}:${id}`;
    setEditingChannel(id);
    setChannelTitleDraft(channelLabelFor(id));
    setChannelReadOnlyDraft(id === "announcements" || Boolean(readOnlyChannels[key]));
  };
  const saveChannelSettings = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const key = `${communityName}:${editingChannel}`;
    if (editingChannel !== "announcements") {
      const name = channelTitleDraft.trim();
      if (name) setChannelLabels((current) => ({ ...current, [key]: name }));
      setReadOnlyChannels((current) => ({ ...current, [key]: channelReadOnlyDraft }));
    }
    switchChannel(editingChannel);
    setChannelSettingsOpen(false);
  };
  const deleteCustomChannel = () => {
    if (!(customChannels[communityName] || []).some(([id]) => id === editingChannel)) return;
    const key = `${communityName}:${editingChannel}`;
    setCustomChannels((current) => ({ ...current, [communityName]: (current[communityName] || []).filter(([id]) => id !== editingChannel) }));
    setChannelLabels((current) => { const next = { ...current }; delete next[key]; return next; });
    setReadOnlyChannels((current) => { const next = { ...current }; delete next[key]; return next; });
    if (channel === editingChannel) switchChannel("general");
    setChannelSettingsOpen(false);
  };
  const publishAnnouncement = (body: string) => {
    const message = body.trim();
    if (!canPostAnnouncements || !message) return;
    const announcementKey = `${communityName}:announcements`;
    setChannelMessages((current) => ({ ...current, [announcementKey]: [...(current[announcementKey] || communitySeedMessages(communityName, "announcements")), { id: Date.now(), user: profile.name, initials: initialsFor(profile.name), shade: "violet", time: "Just now", body: message, tag: "Announcement", replies: 0, reactions: 0, accepted: false }] }));
  };

  return <div className="community-layout">
    <aside className="channel-sidebar"><div className="community-head"><MiniLogo color={communities.find((community) => community.name === communityName)?.color || "teal"}/><div><b>{communityName}</b><small>8,432 members</small></div></div><div className="circle-picker"><button className={`circle-picker-trigger ${showCirclePicker ? "open" : ""}`} onClick={() => setShowCirclePicker((open) => !open)} aria-expanded={showCirclePicker} aria-controls="circle-picker-menu"><span className="circle-logo-stack">{communities.filter((community) => community.access === "public").slice(0, 3).map((community) => <MiniLogo color={community.color} key={community.name}/>)}</span><span>Switch circle</span><Icon name="chevron" size={14}/></button>{showCirclePicker && <div className="circle-picker-menu" id="circle-picker-menu" role="menu"><div className="circle-picker-title"><span>Your communities</span><button onClick={() => setShowCirclePicker(false)} aria-label="Close community switcher"><Icon name="close" size={14}/></button></div>{communities.filter((community) => community.access === "public" || community.name === communityName).map((community) => <button key={community.name} role="menuitem" className={community.name === communityName ? "current" : ""} onClick={() => { onSwitchCommunity(community.name); setShowCirclePicker(false); }}><MiniLogo color={community.color}/><span><b>{community.name}</b><small>{community.members} members</small></span>{community.name === communityName ? <Icon name="check" size={15}/> : <Icon name="chevron" size={15}/>}</button>)}<button className="circle-picker-browse" onClick={() => { setShowCirclePicker(false); onBrowseCommunities(); }}><Icon name="compass" size={15}/> Explore all communities</button></div>}</div><button className="community-admin-button" onClick={() => setShowAdminControls((open) => !open)} aria-expanded={showAdminControls}><Icon name="more" size={14}/><span>Manage community</span><Icon name="chevron" size={13}/></button>{showAdminControls && <div className="community-admin-panel"><div className="community-admin-heading"><div><p>COMMUNITY SETTINGS</p><small>{actorRole} controls for {communityName}</small></div><button type="button" onClick={() => setShowAdminControls(false)} aria-label="Close community settings"><Icon name="close" size={13}/></button></div><button onClick={() => setCommunityProfileOpen((open) => !open)}><span><b>Edit community profile</b><small>Update the description members see</small></span><Icon name="arrow" size={14}/></button>{communityProfileOpen && <form className="community-profile-editor" onSubmit={saveCommunityProfile}><label>ABOUT THIS COMMUNITY<textarea value={communityDescriptions[communityName] ?? currentCommunityDescription} onChange={(event) => setCommunityDescriptions((current) => ({ ...current, [communityName]: event.target.value }))} required minLength={12} maxLength={180}/></label><div className="settings-actions"><button type="submit">Save profile</button><button type="button" onClick={() => setCommunityProfileOpen(false)}>Cancel</button></div></form>}<button onClick={() => setApprovalOnly((value) => !value)}><span><b>Join requests</b><small>{approvalOnly ? "Admin approval required" : "Anyone can join"}</small></span><i className={approvalOnly ? "on" : ""}/></button><button onClick={() => setFilesEnabled((value) => !value)}><span><b>File sharing</b><small>{filesEnabled ? "Members can share files" : "Files are restricted"}</small></span><i className={filesEnabled ? "on" : ""}/></button><button onClick={() => { switchChannel("announcements"); openChannelSettings("announcements"); }}><span><b>Manage announcements</b><small>Review the read-only announcement room</small></span><Icon name="arrow" size={14}/></button><button onClick={() => setChannelEditorOpen((open) => !open)}><span><b>Create a channel</b><small>Add a discussion room for members</small></span><Icon name="plus" size={14}/></button>{channelEditorOpen && <form className="channel-editor" onSubmit={createChannel}><label>NEW CHANNEL<input value={newChannelName} onChange={(event) => setNewChannelName(event.target.value)} placeholder="e.g. design-feedback" required minLength={2} maxLength={32}/></label><button type="submit"><Icon name="plus" size={14}/> Add channel</button><small>New rooms begin as member discussions. Adjust access below.</small></form>}<button onClick={() => openChannelSettings()}><span><b>Edit channel settings</b><small>Rename rooms or change who can post</small></span><Icon name="hash" size={14}/></button>{channelSettingsOpen && <form className="channel-settings" onSubmit={saveChannelSettings}><label>CHANNEL<select value={editingChannel} onChange={(event) => selectChannelForSettings(event.target.value)}>{[...links, ["announcements", "Announcements"] as [string, string]].map(([id, label]) => <option value={id} key={id}>{label}</option>)}</select></label><label>CHANNEL NAME<input value={channelTitleDraft} onChange={(event) => setChannelTitleDraft(event.target.value)} disabled={editingChannel === "announcements"} required minLength={2} maxLength={32}/></label><label className="toggle-setting"><input type="checkbox" checked={channelReadOnlyDraft} onChange={(event) => setChannelReadOnlyDraft(event.target.checked)} disabled={editingChannel === "announcements"}/><span><b>Read-only room</b><small>{editingChannel === "announcements" ? "Announcements are always restricted" : "Only admins and moderators can post"}</small></span></label><div className="settings-actions"><button type="submit">Save channel</button>{(customChannels[communityName] || []).some(([id]) => id === editingChannel) && <button type="button" className="settings-danger" onClick={deleteCustomChannel}>Delete channel</button>}</div></form>}{communityName === "Open Source Kerala" && <button onClick={() => setAnnouncementBotEnabled((enabled) => !enabled)}><span><b>Announcement bot</b><small>{announcementBotEnabled ? "Agent drafts follow the moderator policy" : "Disabled for this community"}</small></span><i className={announcementBotEnabled ? "on" : ""}/></button>}</div>}<button className="community-switcher" onClick={onMembership} aria-label={`Browse ${communityName} members`}><Icon name="people" size={13}/><span>Members</span><Icon name="chevron" size={14}/></button><div className="channel-group"><p>CHANNELS</p>{links.map(([id, label]) => <button className={`channel-link ${channel === id ? "selected" : ""}`} key={id} onClick={() => switchChannel(id)}><Icon name="hash" size={16}/>{label}{id === "help" && <em>4</em>}</button>)}<button className={`channel-link ${channel === "announcements" ? "selected" : ""}`} onClick={() => switchChannel("announcements")}><Icon name="pin" size={15}/>Announcements</button></div><div className="community-mini-event"><p>UPCOMING IN {communityName.toUpperCase()}</p><b>Build your first AI agent</b><small>Sat · 4:00 PM</small></div></aside>
    <section className="channel-main"><header className="channel-head"><div><h2><Icon name={isReadOnly ? "pin" : "hash"} size={21}/>{details.title}</h2><p>{details.description}</p></div><div className="community-utilities"><button className={`workspace-action ${workspacePanel === "messages" ? "active" : ""}`} onClick={() => setWorkspacePanel((panel) => panel === "messages" ? "none" : "messages")} aria-pressed={workspacePanel === "messages"}><Icon name="reply" size={16}/> Messages</button><button className={`workspace-action ${liveRoom ? "live" : ""}`} onClick={() => { if (!liveRoom) { setLiveRoom(true); setRoomJoined(true); } else setRoomJoined((joined) => !joined); }} aria-pressed={roomJoined}><i/>{liveRoom ? roomJoined ? "Leave room" : "Join room" : "Start room"}</button><div className="channel-members">{avatar("Maya", "orange")}{avatar("Ishaan", "teal")}{avatar("Alina", "pink")}<span>8.4k</span></div><span className="token-balance" title="BuildTokens earned from useful participation">◈ {buildTokens}</span></div></header>
      {liveRoom && <div className="live-room-banner"><span><i/> Live builder room</span><p>{roomJoined ? "You are in with Maya, Ishaan and Alina." : "Maya, Ishaan and Alina are in this room."}</p><div className="room-presence">{avatar("Maya", "orange")}{avatar("Ishaan", "teal")}{avatar("Alina", "pink")}<button onClick={() => setRoomJoined((joined) => !joined)}>{roomJoined ? "Leave room" : "Join room"}</button></div></div>}
      <div className="message-list"><div className="date-divider"><span>Today</span></div><div className="channel-welcome"><MiniLogo color="teal"/><h3>{details.welcome}</h3><p>{details.welcomeCopy}</p>{isReadOnly && <span className="announcement-lock"><Icon name="lock" size={12}/> Read-only for members</span>}</div>{messages.filter((message) => !hiddenMessages.includes(message.id)).map((message) => <article className="message" key={message.id}><div className="message-avatar">{avatar(message.user, message.shade)}</div><div className="message-body"><div className="message-meta"><b>{message.user}</b><span>{message.time}</span>{message.tag === "Question" && <i className="message-kind question">Question</i>}{message.tag === "Showcase" && <i className="message-kind showcase">Showcase</i>}{message.tag === "Announcement" && <i className="message-kind announcement">Announcement</i>}</div><p>{message.body}</p>{message.image && <img className="message-image" src={message.image} alt="Shared image" />}{message.audio && <VoiceNote src={message.audio}/>}{message.fileName && message.fileUrl && <a className="shared-file" href={message.fileUrl} target="_blank" rel="noreferrer"><Icon name="file" size={17}/><span><b>{message.fileName}</b><small>Open shared file</small></span><Icon name="arrow" size={14}/></a>}{message.project && <div className="inline-project"><span className="inline-project-icon">⌘</span><div><b>{message.id === 202 ? "Evidence trail" : "TraceView"}</b><small>{message.id === 202 ? "Research assistant for teams" : "Visual debugger for agent runs"}</small></div></div>}{message.accepted && <div className="accepted"><Icon name="check" size={15}/> Accepted answer</div>}<div className="message-actions"><button className={likedMessages.includes(message.id) ? "loved" : ""} onClick={() => react(message.id)} aria-pressed={likedMessages.includes(message.id)}><Icon name="heart" size={15}/>{message.reactions || "Love"}</button>{!isReadOnly && <button onClick={() => openThread(message.id)}><Icon name="reply" size={15}/>{(threadReplies[message.id] || []).length ? `${(threadReplies[message.id] || []).length} ${(threadReplies[message.id] || []).length === 1 ? "reply" : "replies"}` : "Reply"}</button>}<span className="message-menu"><button aria-label="Message actions" onClick={() => setMessageMenu((open) => open === message.id ? null : message.id)}><Icon name="more" size={16}/></button>{messageMenu === message.id && <div className="message-menu-panel" role="menu"><button role="menuitem" onClick={() => deleteForMe(message.id)}>Delete for me</button>{message.user === profile.name && <button role="menuitem" className="danger" onClick={() => deleteForEveryone(message.id)}>Delete for everyone</button>}</div>}</span></div></div></article>)}</div>
      {isAnnouncementChannel ? <AnnouncementComposer communityName={communityName} actorRole={actorRole} botEnabled={announcementBotEnabled} onPublish={publishAnnouncement}/> : isReadOnly ? <div className="read-only-composer"><Icon name="lock" size={15}/> This room is read-only. Update its access in Community settings.</div> : <form className="composer" onSubmit={onSubmit}>{(attached || attachedAudio) && <div className="attachment-preview">{attachedAudio ? <audio controls src={attachedAudio}>Voice message ready</audio> : attachmentName ? <div className="pending-file"><Icon name="file" size={17}/><span>{attachmentName}</span></div> : <img src={attached || ""} alt="Pending image upload"/>}<button type="button" onClick={() => { setAttached(null); setAttachmentName(""); setAttachedAudio(null); }} aria-label="Remove attachment"><Icon name="close" size={13}/></button></div>}{voiceError && <p className="voice-error">{voiceError}</p>}<input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={recording ? "Recording voice message…" : details.placeholder} disabled={recording}/><div className="composer-tools"><label className="tool-button" title="Share image or file"><Icon name="paperclip" size={18}/><input type="file" accept="image/*,.pdf,.doc,.docx,.ppt,.pptx,.zip,.txt" onChange={chooseFile}/></label><button type="button" className={`tool-button voice-button ${recording ? "recording" : ""}`} onClick={recording ? stopRecording : startRecording} title={recording ? "Stop recording" : "Record voice message"}>{recording ? <Icon name="close" size={17}/> : <span className="voice-glyph">●</span>}<span>{recording ? "Stop" : "Voice"}</span></button>{channel === "projects" && <button type="button" className="tool-button" onClick={onShowcase}><Icon name="sparkle" size={17}/><span>Showcase</span></button>}<button className="send-button" type="submit" aria-label="Send message"><Icon name="send" size={17}/></button></div></form>}</section>
    {thread && selected && <aside className="thread-panel"><header><button onClick={() => setThread(null)}><Icon name="close" size={18}/></button><div><b>Thread</b><small>#{channel}</small></div></header><div className="thread-root"><b>{selected.user}</b><p>{selected.body}</p></div><div className="thread-count">{selectedReplies.length} {selectedReplies.length === 1 ? "reply" : "replies"}</div>{selectedReplies.length ? selectedReplies.map((reply) => <div className="thread-reply" key={reply.id}>{avatar(reply.user, reply.shade)}<div><b>{reply.user}</b><p>{reply.body}</p><small>{reply.time}</small></div></div>) : <p className="empty-thread">No replies yet. Be the first to add a useful thought.</p>}<form className="thread-composer" onSubmit={sendThreadReply}><input value={threadDraft} onChange={(event) => setThreadDraft(event.target.value)} placeholder={`Reply to ${selected.user}`}/><button type="submit" aria-label="Send thread reply"><Icon name="send" size={16}/></button></form></aside>}
    {!thread && workspacePanel === "messages" && <aside className="direct-panel"><header><button onClick={() => setWorkspacePanel("none")} aria-label="Close direct messages"><Icon name="close" size={18}/></button><div><b>Messages</b><small>Private conversations</small></div></header><div className="direct-contact-list">{directContacts.map(([name, shade, status]) => <button className={activeChat === name ? "active" : ""} key={name} onClick={() => setActiveChat(name)}>{avatar(name, shade)}<span><b>{name}</b><small>{status}</small></span><i/></button>)}</div><div className="direct-conversation"><p>Private and only visible to this conversation.</p>{(directMessages[activeChat] || []).map((message, index) => <div className={message.startsWith("You:") ? "from-you" : ""} key={`${message}-${index}`}><b>{message.startsWith("You:") ? "You" : activeChat}</b><span>{message.replace(/^You: /, "")}</span></div>)}</div><form className="direct-composer" onSubmit={sendDirectMessage}><input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder={`Message ${activeChat}`}/><button type="submit" aria-label="Send direct message"><Icon name="send" size={16}/></button></form></aside>}
  </div>;}

function AnnouncementComposer({ communityName, actorRole, botEnabled, onPublish }: { communityName: string; actorRole: "Admin" | "Moderator" | "Member"; botEnabled: boolean; onPublish: (body: string) => void }) {
  const [draft, setDraft] = useState("");
  const [status, setStatus] = useState("");
  const [generating, setGenerating] = useState(false);
  const canPost = actorRole === "Admin" || actorRole === "Moderator";
  const generateDraft = async () => {
    if (!botEnabled || generating) return;
    setGenerating(true);
    setStatus("The announcement bot is checking the policy and drafting your update…");
    try {
      const response = await fetch("/api/event-agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: "announcement", context: { title: "Open source community update", date: "This week", time: "Community announcement", location: "BuildCircle", audienceCount: 6100, community: communityName, purpose: draft.trim() || "Share a concise, useful update for contributors and maintainers.", actorRole } }),
      });
      if (!response.ok) throw new Error("Announcement agent request failed");
      const payload = await response.json() as EventAgentPayload;
      setDraft(payload.draft.communityPost);
      setStatus(payload.message || "Draft ready for moderator review.");
    } catch {
      setStatus("The bot could not draft an update right now. You can still write and post one manually.");
    } finally {
      setGenerating(false);
    }
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.trim()) return;
    onPublish(draft);
    setDraft("");
    setStatus("Announcement posted by a verified moderator.");
  };
  if (!canPost) return <div className="read-only-composer"><Icon name="lock" size={16}/><span>Only {communityName} admins and moderators can post announcements.</span></div>;
  return <form className="announcement-composer" onSubmit={submit}><div className="announcement-composer-head"><span><Icon name="lock" size={14}/>{actorRole} composer</span><small>Only admins and moderators can publish</small>{botEnabled && <button type="button" onClick={generateDraft} disabled={generating}><Icon name="wand" size={15}/>{generating ? "Drafting…" : "Draft with bot"}</button>}</div><textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder={`Write an official update for ${communityName}`}/><div className="announcement-composer-actions"><small>{status || (botEnabled ? "The bot drafts; a moderator always reviews and posts." : "Bot drafting is disabled for this community.")}</small><button className="dark-button" type="submit" disabled={!draft.trim()}>Post announcement <Icon name="send" size={15}/></button></div></form>;
}

function ExploreView({ joined, onJoin, onOpen, onCreate }: { joined: string[]; onJoin: (name: string) => void; onOpen: (name: string) => void; onCreate: () => void }) {
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [requestStates, setRequestStates] = useState<Record<string, "pending" | "approved">>({});
  const categories = ["All", "AI", "Software", "Hardware", "Design", "Open source", "Startups"];
  const normalizedQuery = query.trim().toLowerCase();
  const visibleCommunities = communities.filter((community) => {
    const searchable = [community.name, community.description, community.category, ...community.tags].join(" ").toLowerCase();
    return (filter === "All" || community.category === filter) && (!normalizedQuery || searchable.includes(normalizedQuery));
  });
  const openCommunity = (access: "public" | "approval", name: string) => {
    if (access === "public" || joined.includes(name)) onOpen(name);
  };
  const requestJoin = (name: string) => setRequestStates((states) => ({ ...states, [name]: "pending" }));
  const clearSearch = () => { setFilter("All"); setQuery(""); };
  return <div className="page-content explore-page"><section className="explore-hero"><p className="eyebrow">FIND YOUR PEOPLE</p><h1>Explore builder communities</h1><p>Go deep on what you’re building with people who get it.</p><form className="explore-search" onSubmit={(event) => event.preventDefault()}><Icon name="search" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Try ‘robotics’, ‘open source’, ‘Figma’..."/><button type="submit">Search</button></form></section><div className="filter-row">{categories.map((category) => <button key={category} onClick={() => setFilter(category)} className={filter === category ? "selected" : ""}>{category}</button>)}</div><div className="browse-head"><div><h2>{normalizedQuery || filter !== "All" ? `${visibleCommunities.length} matching communities` : "Communities picked for you"}</h2><p>{normalizedQuery ? `Results for “${query.trim()}”${filter !== "All" ? ` in ${filter}` : ""}.` : filter !== "All" ? `Showing ${filter.toLowerCase()} communities.` : "Based on your interests in AI, web and making things."}</p></div><button className="text-button" onClick={clearSearch}>Clear filters <Icon name="close" size={14}/></button></div>{visibleCommunities.length ? <div className="community-grid">{visibleCommunities.map((community, index) => { const requestState = requestStates[community.name]; const isJoined = joined.includes(community.name); const canOpen = community.access === "public" || isJoined; const actionLabel = isJoined ? "Open" : community.access === "approval" ? requestState === "pending" ? "Request sent" : requestState === "approved" ? "Join" : "Request join" : "Join"; return <article className="community-card" key={community.name}><button type="button" className={`community-cover ${community.color}`} aria-label={canOpen ? `Open ${community.name}` : `Request access to ${community.name}`} onClick={() => openCommunity(community.access, community.name)}><div className="cover-pattern"/><MiniLogo color={community.color}/>{index < 2 && <span className="featured-label">Featured</span>}</button><div className="community-card-body"><div className="community-name-row"><div><h3>{community.name}{isJoined && <Icon name="check" size={16}/>}</h3><p>{community.members} members · {community.access === "approval" ? "Private · approval" : "Public"}</p></div><button className={isJoined ? "joined-button" : "join-button"} disabled={requestState === "pending"} onClick={() => { if (isJoined) onOpen(community.name); else if (community.access === "approval") { if (requestState === "approved") { onJoin(community.name); onOpen(community.name); } else requestJoin(community.name); } else onJoin(community.name); }}>{actionLabel}</button></div><p className="community-description">{community.description}</p>{requestState === "pending" && <p className="community-access-note"><Icon name="lock" size={13}/> Request sent — access unlocks after an admin approves it.</p>}<div className="tag-row">{community.tags.map((tag) => <span key={tag}>{tag}</span>)}</div><div className="builder-row"><div className="avatar-stack">{avatar("Priya", "pink")}{avatar("Hari", "teal")}{avatar("Zoya", "orange")}</div><span>Active this week</span></div></div></article>; })}</div> : <div className="explore-empty"><span className="digest-glyph"><Icon name="search" size={20}/></span><h2>No communities match that yet.</h2><p>Try a broader search or clear the selected filter.</p><button className="outline-button" onClick={clearSearch}>Show all communities</button></div>}<section className="request-banner"><div className="request-art"><span>✦</span><span>◌</span><span>+</span></div><div><p className="eyebrow">CAN’T FIND YOUR NICHE?</p><h2>Start the circle you wish existed.</h2><p>Create a dedicated place to build, learn and connect around any craft.</p></div><button className="dark-button" onClick={onCreate}>Create a community <Icon name="arrow" size={16}/></button></section></div>;
}

function CalendarView({ registeredEvents, wishlistedEvents, onOpenEvents, onToggleWishlist, onViewPass }: { registeredEvents: RegisteredEvent[]; wishlistedEvents: RegisteredEvent[]; onOpenEvents: () => void; onToggleWishlist: (event: RegisteredEvent) => void; onViewPass: (event: RegisteredEvent) => void }) {
  const allEvents = [...registeredEvents, ...wishlistedEvents.filter((event) => !registeredEvents.some((registeredEvent) => registeredEvent.id === event.id))].sort((first, second) => first.date.localeCompare(second.date));
  const initialDate = allEvents[0]?.date || featuredRegisteredEvent.date;
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [activeMonth, setActiveMonth] = useState(initialDate.slice(0, 7));
  const [year, month] = activeMonth.split("-").map(Number);
  const daysInMonth = new Date(year, month, 0).getDate();
  const startsOn = new Date(year, month - 1, 1).getDay();
  const selectedEvents = allEvents.filter((event) => event.date === selectedDate);
  const changeMonth = (amount: number) => {
    const date = new Date(year, month - 1 + amount, 1);
    const nextMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    setActiveMonth(nextMonth);
    setSelectedDate(`${nextMonth}-01`);
  };
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "long", year: "numeric" }).format(new Date(year, month - 1, 1));
  const formatDate = (date: string) => new Intl.DateTimeFormat(undefined, { weekday: "long", month: "short", day: "numeric" }).format(new Date(`${date}T12:00:00`));
  return <div className="page-content calendar-page"><section className="calendar-page-hero"><div><p className="eyebrow">YOUR EVENT PLAN</p><h1>Calendar & wishlist</h1><p>Every event you registered for, plus the ones you want to come back to.</p></div><button className="dark-button" onClick={onOpenEvents}><Icon name="compass" size={16}/> Discover events</button></section><div className="calendar-stat-row"><span><Icon name="check" size={15}/><b>{registeredEvents.length}</b> registered</span><span><Icon name="heart" size={15}/><b>{wishlistedEvents.length}</b> wishlisted</span><span><Icon name="bell" size={15}/> Reminders are set for your registrations</span></div><section className="calendar-page-grid"><div className="calendar-board"><div className="calendar-board-head"><button onClick={() => changeMonth(-1)} aria-label="Previous month">‹</button><h2>{monthLabel}</h2><button onClick={() => changeMonth(1)} aria-label="Next month">›</button></div><div className="calendar-weekdays">{"SMTWTFS".split("").map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div><div className="calendar-grid calendar-grid-large">{Array.from({ length: startsOn }, (_, index) => <span className="calendar-empty" key={`blank-${index}`}/>) }{Array.from({ length: daysInMonth }, (_, index) => { const day = index + 1; const date = `${activeMonth}-${String(day).padStart(2, "0")}`; const dayEvents = allEvents.filter((event) => event.date === date); return <button key={date} className={`${selectedDate === date ? "selected" : ""} ${dayEvents.length ? "has-event" : ""}`} aria-pressed={selectedDate === date} onClick={() => setSelectedDate(date)}><b>{day}</b>{dayEvents.length > 0 && <span>{dayEvents.length}</span>}</button>; })}</div></div><aside className="calendar-day-panel"><p className="eyebrow">ON {formatDate(selectedDate).toUpperCase()}</p><h2>{selectedEvents.length ? `${selectedEvents.length} planned event${selectedEvents.length === 1 ? "" : "s"}` : "Nothing planned"}</h2>{selectedEvents.length ? selectedEvents.map((event) => { const isRegistered = registeredEvents.some((registeredEvent) => registeredEvent.id === event.id); return <article className={`calendar-day-card ${isRegistered ? "registered" : "wishlisted"}`} key={event.id}><span className="calendar-card-status">{isRegistered ? <><Icon name="check" size={13}/> Registered</> : <><Icon name="heart" size={13}/> Wishlisted</>}</span><h3>{event.title}</h3><p>{event.time}</p><small>{event.location}</small>{!isRegistered && <button onClick={() => onToggleWishlist(event)}>Remove from wishlist</button>}</article>; }) : <p className="calendar-empty-day">Choose a highlighted date or save an event from the Events page.</p>}</aside></section><section className="event-plan-section"><div className="section-title"><div><p className="eyebrow">UP NEXT</p><h2>Registered events</h2></div><span>{registeredEvents.length} confirmed</span></div>{registeredEvents.length ? <div className="event-plan-list">{registeredEvents.map((event) => <EventPlanRow event={event} status="registered" key={event.id} onViewPass={() => onViewPass(event)}/>)}</div> : <div className="event-plan-empty"><Icon name="calendar" size={21}/><div><b>No registrations yet</b><p>When you register, the event and its reminders appear here.</p></div><button className="outline-button" onClick={onOpenEvents}>Explore events</button></div>}</section><section className="event-plan-section"><div className="section-title"><div><p className="eyebrow">SAVE FOR LATER</p><h2>Your wishlist</h2></div><span>{wishlistedEvents.length} saved</span></div>{wishlistedEvents.length ? <div className="event-plan-list">{wishlistedEvents.map((event) => <EventPlanRow event={event} status="wishlisted" key={event.id} onRemove={() => onToggleWishlist(event)}/>)}</div> : <div className="event-plan-empty"><Icon name="heart" size={21}/><div><b>Your wishlist is ready</b><p>Use Save on any upcoming event and it will appear here.</p></div><button className="outline-button" onClick={onOpenEvents}>Browse events</button></div>}</section></div>;
}

function EventPlanRow({ event, status, onRemove, onViewPass }: { event: RegisteredEvent; status: "registered" | "wishlisted"; onRemove?: () => void; onViewPass?: () => void }) {
  const dateLabel = new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${event.date}T12:00:00`));
  return <article className="event-plan-row"><span className={`event-plan-date ${status}`}><b>{dateLabel.split(" ")[1]}</b><small>{dateLabel.split(" ")[0]}</small></span><div><p><MiniLogo color={event.color || "teal"}/>{event.community}</p><h3>{event.title}</h3><span>{event.time} · {event.location}</span></div><em className={status}>{status === "registered" ? "Registered" : "Wishlisted"}</em>{onViewPass && <button className="event-row-pass" onClick={onViewPass}>View pass</button>}{onRemove && <button className="event-row-remove" onClick={onRemove}>Remove</button>}</article>;
}

function EventsView({ registeredEvents, eventMoved, wishlistedEvents, onRegister, onPass, onCheckin, onImpact, onMove, onToggleWishlist }: { registeredEvents: RegisteredEvent[]; eventMoved: boolean; wishlistedEvents: RegisteredEvent[]; onRegister: (event: RegisteredEvent) => void; onPass: (event: RegisteredEvent) => void; onCheckin: () => void; onImpact: () => void; onMove: () => void; onToggleWishlist: (event: RegisteredEvent) => void }) {
  const [tab, setTab] = useState<"discover" | "hosting">("discover");
  const [eventFilter, setEventFilter] = useState<"All" | "This week" | "Online" | "Near me">("All");
  const moreEvents = upcomingEvents.slice(1).filter((event) => {
    if (eventFilter === "Online") return event.location.toLowerCase().includes("online");
    if (eventFilter === "Near me") return event.location.toLowerCase().includes("kochi");
    if (eventFilter === "This week") {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 6);
      const eventDate = new Date(`${event.date}T12:00:00`);
      return eventDate >= today && eventDate <= weekEnd;
    }
    return true;
  });
  const isWishlisted = (event: RegisteredEvent) => wishlistedEvents.some((savedEvent) => savedEvent.id === event.id);
  const isRegistered = (event: RegisteredEvent) => registeredEvents.some((savedEvent) => savedEvent.id === event.id);
  return <div className="page-content events-page"><div className="events-top"><div><p className="eyebrow">BUILD TOGETHER, IN THE ROOM OR ONLINE</p><h1>Events for builders</h1><p>Find a workshop, bring your people, or make something happen.</p></div><button className="dark-button"><Icon name="plus" size={17}/> Create event</button></div><div className="event-tabs"><button className={tab === "discover" ? "active" : ""} onClick={() => setTab("discover")}>Discover events</button><button className={tab === "hosting" ? "active" : ""} onClick={() => setTab("hosting")}>Hosting <span>1</span></button></div>{tab === "discover" ? <><section className="featured-event"><div className="event-art"><div className="orb one"/><div className="orb two"/><div className="grid-lines"/><span className="event-poster-label">AI AGENTS<br/><b>LAB</b></span><span className="event-poster-type">HANDS-ON<br/>WORKSHOP</span></div><div className="featured-event-info"><span className="pill live">UPCOMING · ONLINE</span><h2>Build your first<br/><em>AI agent</em></h2><p>From an idea to a useful autonomous workflow: build, evaluate and ship a small agent with fellow builders.</p><div className="event-detail-row"><span><Icon name="calendar" size={16}/> Saturday, September 21</span><span><Icon name="grid" size={16}/> 4:00 PM – 6:00 PM IST</span></div><div className="event-host"><MiniLogo color="teal"/><span>Hosted by <b>AI Agents</b></span><div className="host-avatars">{avatar("Rhea", "pink")}{avatar("Adi", "orange")}<small>+2 hosts</small></div></div><div className="event-cta">{isRegistered(featuredRegisteredEvent) ? <><button className="registered-button" onClick={() => onPass(featuredRegisteredEvent)}><Icon name="check" size={16}/> You’re registered</button><button className="pass-link" onClick={() => onPass(featuredRegisteredEvent)}>View QR pass</button></> : <><button className="dark-button" onClick={() => onRegister(featuredRegisteredEvent)}>Register free <Icon name="arrow" size={16}/></button><button className={`event-wishlist-button ${isWishlisted(featuredRegisteredEvent) ? "saved" : ""}`} onClick={() => onToggleWishlist(featuredRegisteredEvent)} aria-pressed={isWishlisted(featuredRegisteredEvent)}><Icon name="heart" size={16}/>{isWishlisted(featuredRegisteredEvent) ? "Wishlisted" : "Save"}</button></>}<span>128 builders are going</span></div></div></section><div className="browse-head event-browse"><div><h2>More to explore</h2><p>Register for any event and it will automatically appear in your Calendar.</p></div><div className="filter-row mini" role="tablist" aria-label="More event filters">{(["All", "This week", "Online", "Near me"] as const).map((filter) => <button key={filter} role="tab" aria-selected={eventFilter === filter} className={eventFilter === filter ? "selected" : ""} onClick={() => setEventFilter(filter)}>{filter}</button>)}</div></div>{moreEvents.length ? <div className="events-grid">{moreEvents.map((event) => <EventListCard event={event} registered={isRegistered(event)} wishlisted={isWishlisted(event)} onRegister={() => onRegister(event)} onPass={() => onPass(event)} onToggleWishlist={() => onToggleWishlist(event)} key={event.id}/>)}</div> : <div className="event-filter-empty"><Icon name="calendar" size={20}/><div><b>No events match this filter yet.</b><p>Try All events or choose a different filter.</p></div><button onClick={() => setEventFilter("All")}>Show all events</button></div>}</> : <HostDashboard eventMoved={eventMoved} onImpact={onImpact} onMove={onMove} onCheckin={onCheckin}/>}</div>;
}

function EventListCard({ event, registered, wishlisted, onRegister, onPass, onToggleWishlist }: { event: RegisteredEvent; registered: boolean; wishlisted: boolean; onRegister: () => void; onPass: () => void; onToggleWishlist: () => void }) {
  const [year, month, day] = event.date.split("-");
  const monthLabel = new Intl.DateTimeFormat(undefined, { month: "short" }).format(new Date(Number(year), Number(month) - 1, Number(day))).toUpperCase();
  return <article className="event-list-card"><div className={`event-list-cover ${event.color || "violet"}`}><span className="list-shape s1"/><span className="list-shape s2"/><p>{event.type || "Event"}</p></div><div className="event-list-body"><div className="event-date-line"><b>{day} {monthLabel}</b><span>· {event.time}</span></div><h3>{event.title}</h3><p>{event.type} · {event.location}</p><div className="event-list-actions"><span className="small-community"><MiniLogo color={event.color || "violet"}/> {event.community}</span>{registered ? <button className="event-card-register registered" onClick={onPass}><Icon name="check" size={14}/> Registered</button> : <button className="event-card-register" onClick={onRegister}>Register</button>}<button className={`event-card-save ${wishlisted ? "saved" : ""}`} onClick={onToggleWishlist} aria-pressed={wishlisted}><Icon name="heart" size={14}/>{wishlisted ? "Saved" : "Save"}</button></div></div></article>;
}

function HostDashboard({ eventMoved, onImpact, onMove, onCheckin }: { eventMoved: boolean; onImpact: () => void; onMove: () => void; onCheckin: () => void }) {
  return <section className="host-dashboard"><div className="host-heading"><div><span className="pill live">HOST CONSOLE</span><h2>Build your first AI agent</h2><p>Saturday, Sep 21 · {eventMoved ? "5:00 PM" : "4:00 PM"} IST · Online</p></div><button className="outline-button" onClick={onMove}><Icon name="calendar" size={16}/>{eventMoved ? "Timing updated" : "Change timing"}</button></div>{eventMoved && <div className="impact-banner"><span className="impact-icon"><Icon name="sparkle" size={18}/></span><div><b>Event Impact Agent found 87 affected attendees</b><p>The time changed from 4:00 PM to 5:00 PM. Review the drafted update before sending.</p></div><button onClick={onImpact}>Review draft <Icon name="arrow" size={15}/></button></div>}<div className="metric-grid"><div><span>Registrations</span><b>327</b><small>+24 this week</small></div><div><span>Checked in</span><b>281</b><small>86% attendance</small></div><div><span>Pending</span><b>46</b><small>Includes no-shows</small></div><div><span>Capacity</span><b>500</b><small>173 spots left</small></div></div><div className="host-panels"><div className="registrations-panel"><div className="panel-title"><div><h3>Recent registrations</h3><p>Internal registration · 327 total</p></div><button>Export CSV</button></div>{[["Maya Chen", "MC", "orange", "Registered 2 min ago", "Checked in"], ["Nikhil Varma", "NV", "teal", "Registered 18 min ago", "Registered"], ["Riya Sharma", "RS", "pink", "Registered 33 min ago", "Registered"]].map(([name, initials, shade, date, status]) => <div className="registration-row" key={name}>{avatar(initials, shade)}<div><b>{name}</b><small>{date}</small></div><span className={status === "Checked in" ? "check-status" : "register-status"}>{status === "Checked in" && <Icon name="check" size={13}/>} {status}</span></div>)}</div><div className="checkin-panel"><div className="scanner-corner tl"/><div className="scanner-corner tr"/><div className="scanner-corner bl"/><div className="scanner-corner br"/><div className="scan-symbol">▦</div><h3>Check in attendees</h3><p>Scan a BuildCircle QR pass to validate registration.</p><button className="dark-button" onClick={onCheckin}>Open QR scanner <Icon name="arrow" size={16}/></button><small>Camera access is requested only when you start scanning.</small></div></div><div className="marketing-row"><span className="impact-icon"><Icon name="wand" size={18}/></span><div><b>Event Marketing Agent</b><p>Generate a polished announcement, social caption, reminder or thank-you. You review every message before it goes out.</p></div><button className="outline-button" onClick={onImpact}>Create communications <Icon name="arrow" size={15}/></button></div></section>;
}

function NotificationsView({ profile, onOpen }: { profile: UserProfile; onOpen: () => void }) {
  return <div className="page-content simple-page"><div className="simple-heading"><p className="eyebrow">YOUR UPDATES</p><h1>Notifications</h1><p>Only the activity that needs your attention.</p></div><div className="notifications-list">{[["Maya Chen", "mentioned you in #Help", `Could @${profile.name} share the Docker setup you used?`, "7 min", "orange"], ["AI Agents", "accepted your registration", "Your QR pass for Build your first AI agent is ready.", "34 min", "teal"], ["Alina Brooks", "replied to your project", "This trace view would be brilliant as a VS Code panel.", "1 hr", "pink"], ["Codex Builders", "posted an announcement", "September build night RSVP is now open.", "3 hr", "violet"]].map(([name, action, text, time, shade], index) => <button className={`notice ${index < 2 ? "unread" : ""}`} key={text} onClick={onOpen}>{avatar(name, shade)}<div><p><b>{name}</b> {action}</p><span>{text}</span><small>{time} ago</small></div>{index < 2 && <i/>}</button>)}</div></div>;
}

function ProfileView({ profile, onSave }: { profile: UserProfile; onSave: (profile: UserProfile) => void }) {
  const [dialog, setDialog] = useState<ProfileDialogType>(null);
  const [projectName, setProjectName] = useState<ProjectName>("Signalboard");
  const [saved, setSaved] = useState(false);

  const saveProfile = (nextProfile: UserProfile) => {
    onSave(nextProfile);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2800);
  };

  return <div className="page-content profile-page"><section className="profile-hero"><div className="profile-cover"><span className="profile-orb one"/><span className="profile-orb two"/></div><div className="profile-core">{avatar(profile.name, "violet")}<div><p className="eyebrow">BUILDER PROFILE</p><h1>{profile.name} <span className="verified">✓</span></h1><p>{profile.bio}</p><div className="profile-meta"><span>⌖ {profile.location}</span><span>◈ {profile.role}</span><span>↗ {profile.website}</span></div></div><button className="outline-button" onClick={() => setDialog("edit")}>Edit profile</button></div></section>{saved && <p className="profile-saved"><Icon name="check" size={15}/> Profile saved</p>}<div className="profile-grid"><section><div className="section-title"><div><p className="eyebrow">ABOUT</p><h2>Building in public, thoughtfully.</h2></div></div><p className="profile-bio">I care about the bridge between an experimental idea and a useful, humane product. Currently exploring practical AI, developer experience and communities that help people ship.</p><div className="profile-tags"><span>AI agents</span><span>TypeScript</span><span>Next.js</span><span>Product design</span><span>Community</span></div><div className="section-title lower"><div><p className="eyebrow">PROJECTS</p><h2>Things I’m building</h2></div><button className="text-button" onClick={() => setDialog("projects")}>View all <Icon name="arrow" size={15}/></button></div><div className="profile-project"><span>◫</span><div><b>Signalboard</b><p>A calmer shared context layer for community teams.</p></div><button aria-label="Open Signalboard" onClick={() => { setProjectName("Signalboard"); setDialog("project"); }}><Icon name="arrow" size={16}/></button></div></section><aside><p className="eyebrow">YOUR CIRCLES</p><button className="profile-community profile-community-button" onClick={() => setDialog("circles")}><MiniLogo color="teal"/><div><b>AI Agents</b><small>Member since Jul 2026</small></div><Icon name="chevron" size={16}/></button><button className="profile-community profile-community-button" onClick={() => setDialog("circles")}><MiniLogo color="violet"/><div><b>Codex Builders</b><small>Member since May 2026</small></div><Icon name="chevron" size={16}/></button><button className="outline-button wide" onClick={() => setDialog("edit")}>Manage your profile</button></aside></div>{dialog && <ProfileDialog type={dialog} profile={profile} projectName={projectName} save={saveProfile} close={() => setDialog(null)} openProject={(nextProject) => { setProjectName(nextProject); setDialog("project"); }}/>}</div>;
}

function ProfileDialog({ type, profile, projectName, save, close, openProject }: { type: Exclude<ProfileDialogType, null>; profile: UserProfile; projectName: ProjectName; save: (profile: UserProfile) => void; close: () => void; openProject: (project: ProjectName) => void }) {
  const [formError, setFormError] = useState("");
  const submitProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextProfile: UserProfile = {
      name: String(data.get("name") || "").trim(),
      email: String(data.get("email") || "").trim(),
      bio: String(data.get("bio") || "").trim(),
      location: String(data.get("location") || "").trim(),
      role: String(data.get("role") || "").trim(),
      website: String(data.get("website") || "").trim(),
    };
    if (nextProfile.name.length < 2) { setFormError("Enter a display name with at least two characters."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextProfile.email)) { setFormError("Enter a valid email address."); return; }
    if (nextProfile.bio.length < 12 || nextProfile.location.length < 2 || nextProfile.role.length < 2) { setFormError("Complete each profile field with the requested detail."); return; }
    try { new URL(nextProfile.website); } catch { setFormError("Use a complete website URL beginning with https://."); return; }
    setFormError("");
    save(nextProfile);
    close();
  };

  const content = type === "edit" ? <form className="profile-edit-modal" onSubmit={submitProfile}><p className="eyebrow">YOUR PROFILE</p><h2>Edit profile</h2><p>These details appear across BuildCircle and are saved on this device.</p><label>DISPLAY NAME<input name="name" defaultValue={profile.name} required minLength={2} maxLength={60} autoComplete="name" title="Enter at least 2 letters."/></label><label>EMAIL<input name="email" type="email" defaultValue={profile.email} required autoComplete="email" title="Enter a valid email address."/></label><label>BIO<textarea name="bio" defaultValue={profile.bio} required minLength={12} maxLength={280} title="Use at least 12 characters."/></label><div className="form-row"><label>LOCATION<input name="location" defaultValue={profile.location} required minLength={2} maxLength={80}/></label><label>ROLE<input name="role" defaultValue={profile.role} required minLength={2} maxLength={80}/></label></div><label>WEBSITE<input name="website" type="url" defaultValue={profile.website} required autoComplete="url" placeholder="https://your-site.com" title="Use a complete URL beginning with https://."/></label>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="profile-dialog-actions"><button className="outline-button" type="button" onClick={close}>Cancel</button><button className="dark-button" type="submit">Save changes <Icon name="check" size={16}/></button></div></form> : type === "projects" ? <div className="profile-projects-modal"><p className="eyebrow">YOUR PROJECTS</p><h2>Things you’re building</h2><button className="project-dialog-card" onClick={() => openProject("Signalboard")}><span>◫</span><div><b>Signalboard</b><p>A calmer shared context layer for community teams.</p></div><Icon name="arrow" size={16}/></button><button className="project-dialog-card" onClick={() => openProject("Field Notes")}><span>✦</span><div><b>Field Notes</b><p>A lightweight research journal for product teams.</p></div><Icon name="arrow" size={16}/></button><button className="outline-button wide" onClick={close}>Done</button></div> : type === "project" ? <div className="project-details-modal"><p className="eyebrow">PROJECT</p><h2>{projectName}</h2><p>{projectName === "Signalboard" ? "A calmer shared context layer for community teams. It gathers updates, decisions and open questions into a shared weekly view." : "A lightweight research journal for product teams, turning interview notes into useful, shareable evidence."}</p><div className="project-detail-list"><span><Icon name="people" size={16}/> 4 collaborators</span><span><Icon name="check" size={16}/> Updated today</span></div><button className="dark-button wide" onClick={close}>Back to profile <Icon name="arrow" size={16}/></button></div> : <div className="profile-circles-modal"><p className="eyebrow">YOUR CIRCLES</p><h2>Communities you follow</h2><div className="circle-dialog-row"><MiniLogo color="teal"/><div><b>AI Agents</b><p>8,432 members · 18 new posts</p></div></div><div className="circle-dialog-row"><MiniLogo color="violet"/><div><b>Codex Builders</b><p>12,800 members · Workshop tomorrow</p></div></div><button className="outline-button wide" onClick={close}>Done</button></div>;

  return <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={close}><section className="modal" onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={close} aria-label="Close profile dialog"><Icon name="close" size={19}/></button>{content}</section></div>;
}
function SearchResults({ query, onNavigate }: { query: string; onNavigate: (page: Page) => void }) {
  const term = query || "ESP32 GPS";
  return <div className="search-results"><p><Icon name="sparkle" size={14}/> Search across BuildCircle</p><button onClick={() => onNavigate("explore")}><MiniLogo color="orange"/><span><small>COMMUNITY</small><b>IoT Builders</b><em>ESP32, GPS, sensors</em></span><Icon name="chevron" size={15}/></button><button onClick={() => onNavigate("community")}><span className="search-hash">#</span><span><small>DISCUSSION</small><b>GPS tracker with ESP32-C3</b><em>IoT Builders · #help</em></span><Icon name="chevron" size={15}/></button><button onClick={() => onNavigate("events")}><span className="search-calendar">21</span><span><small>EVENT</small><b>Build your first AI agent</b><em>Saturday · Online</em></span><Icon name="chevron" size={15}/></button><footer>Press <kbd>↵</kbd> to see all results for “{term}”</footer></div>;
}

function ModalLayer({ type, close, profile, registered, registrationEvent, checkedIn, eventMoved, onNavigate, onRegister, onCheckin, onMove, onShowcase, onCreate }: { type: Modal; close: () => void; profile: UserProfile; registered: boolean; registrationEvent: RegisteredEvent; checkedIn: boolean; eventMoved: boolean; onNavigate: (target: DigestDestination) => void; onRegister: () => void; onCheckin: () => void; onMove: () => void; onShowcase: (project: { name: string; description: string; image?: string }) => void; onCreate: (draft: { name: string; description: string; category: string; access: "public" | "approval" }) => void }) {
  return <div className="modal-backdrop" role="dialog" aria-modal="true" onMouseDown={close}><section className={`modal ${type === "digest" || type === "impact" ? "modal-wide" : ""}`} onMouseDown={(event) => event.stopPropagation()}><button className="modal-close" onClick={close}><Icon name="close" size={19}/></button>{type === "create" && <CreateModal close={close} onCreate={onCreate}/>} {type === "register" && <RegisterModal event={registrationEvent} profile={profile} onRegister={onRegister}/>} {type === "pass" && <PassModal event={registrationEvent} profile={profile} registered={registered} close={close}/>} {type === "checkin" && <CheckinModal profile={profile} checkedIn={checkedIn} onCheckin={onCheckin}/>} {type === "digest" && <DigestModal close={close} onNavigate={onNavigate}/>} {type === "impact" && <ImpactModal eventMoved={eventMoved} onMove={onMove} close={close}/>} {type === "showcase" && <ShowcaseModal publish={onShowcase}/>} {type === "membership" && <MembershipModal profile={profile} close={close}/>}</section></div>;
}

function MembershipModal({ profile, close }: { profile: UserProfile; close: () => void }) {
  const [query, setQuery] = useState("");
  const members = [
    { name: profile.name, role: "Member", note: "You", shade: "violet" },
    { name: "Maya Chen", role: "Owner", note: "ML Engineer", shade: "orange" },
    { name: "Ishaan Rao", role: "Moderator", note: "Developer advocate", shade: "teal" },
    { name: "Alina Brooks", role: "Member", note: "Product designer", shade: "pink" },
    { name: "Leena Thomas", role: "Event Manager", note: "Community builder", shade: "blue" },
    { name: "Rahul K", role: "Member", note: "Independent builder", shade: "yellow" },
  ];
  const visible = members.filter((member) => member.name.toLowerCase().includes(query.toLowerCase()) || member.role.toLowerCase().includes(query.toLowerCase()));
  return <div className="membership-modal member-directory"><div className="membership-hero"><MiniLogo color="teal"/><div><p className="eyebrow">AI AGENTS</p><h2>Community members</h2><p>8,432 builders learning and shipping together</p></div></div><label className="member-search"><Icon name="search" size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Find a member"/></label><div className="member-directory-meta"><span>{query ? `${visible.length} matches` : "People active this week"}</span><span>Role</span></div><div className="member-list">{visible.map((member) => <div className="member-row" key={member.name}>{avatar(member.name, member.shade)}<div><b>{member.name}</b><small>{member.note}</small></div><span className={`role-badge ${member.role.toLowerCase().replace(" ", "-")}`}>{member.role}</span></div>)}{visible.length === 0 && <p className="member-empty">No members match “{query}”.</p>}</div><div className="membership-footer"><span>Showing active community members</span><button className="outline-button" onClick={close}>Done</button></div></div>;
}

function CreateModal({ close, onCreate }: { close: () => void; onCreate: (draft: { name: string; description: string; category: string; access: "public" | "approval" }) => void }) {
  const [mode, setMode] = useState<"community" | "event">("community");
  const [access, setAccess] = useState<"public" | "approval">("public");
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    if (mode === "event") { close(); return; }
    onCreate({ name: String(data.get("name") || ""), description: String(data.get("description") || ""), category: String(data.get("category") || "Community"), access });
  };
  return <form className="create-modal" onSubmit={submit}><p className="eyebrow">START SOMETHING MEANINGFUL</p><h2>Create a {mode}</h2><div className="segmented"><button type="button" className={mode === "community" ? "active" : ""} onClick={() => setMode("community")}><Icon name="people" size={17}/> Community</button><button type="button" className={mode === "event" ? "active" : ""} onClick={() => setMode("event")}><Icon name="calendar" size={17}/> Event</button></div><label>NAME<input name="name" placeholder={mode === "community" ? "e.g. Creative Coders Chennai" : "e.g. Build night #1"} required minLength={3} maxLength={60} title="Use 3–60 characters."/></label><label>{mode === "community" ? "WHAT WILL PEOPLE BUILD OR LEARN HERE?" : "A SHORT DESCRIPTION"}<textarea name="description" placeholder={mode === "community" ? "Give your future members a clear, inviting reason to join." : "What’s special about this gathering?"} required minLength={12} maxLength={500} title="Use at least 12 characters."/></label>{mode === "community" ? <><label>CATEGORY<select name="category" defaultValue="" required><option value="" disabled>Choose a category</option><option>AI</option><option>Software</option><option>Design</option><option>Hardware</option><option>Open source</option><option>Startups</option></select></label><label>JOIN MODE<div className="radio-options"><button type="button" className={access === "public" ? "selected" : ""} onClick={() => setAccess("public")}><span>{access === "public" ? "●" : "○"}</span><div><b>Public</b><small>Anyone can join instantly</small></div></button><button type="button" className={access === "approval" ? "selected" : ""} onClick={() => setAccess("approval")}><span>{access === "approval" ? "●" : "○"}</span><div><b>Approval required</b><small>Review every request</small></div></button></div></label><div className="channel-blueprint"><b>YOUR STARTER CHANNELS</b><span># general</span><span># introductions</span><span># projects</span><span># announcements</span><small>You can add, edit, or restrict channels from community settings.</small></div></> : <label>WHEN<input name="startsAt" type="datetime-local" required/></label>}<div className="profile-dialog-actions"><button className="outline-button" type="button" onClick={close}>Cancel</button><button className="dark-button" type="submit">Create {mode} <Icon name="arrow" size={16}/></button></div></form>;
}

function RegisterModal({ event, profile, onRegister }: { event: RegisteredEvent; profile: UserProfile; onRegister: () => void }) {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "long", month: "long", day: "numeric" }).format(new Date(`${event.date}T12:00:00`));
  const submit = (submission: FormEvent<HTMLFormElement>) => {
    submission.preventDefault();
    const data = new FormData(submission.currentTarget);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const organization = String(data.get("organization") || "").trim();
    const goal = String(data.get("goal") || "").trim();
    if (name.length < 2) { setFormError("Enter your name using at least two characters."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setFormError("Enter a valid registration email address."); return; }
    if (organization.length < 2) { setFormError("Add your college, company, or Independent builder."); return; }
    if (!goal) { setFormError("Choose what you want to get from this event."); return; }
    setFormError("");
    setSubmitted(true);
    window.setTimeout(onRegister, 1800);
  };
  if (submitted) return <div className="success-state"><span className="success-orb"><Icon name="check" size={35}/></span><p className="eyebrow">YOU’RE ON THE LIST</p><h2>Registration confirmed.</h2><p>{event.title} will be added to your Calendar and your event pass is being prepared.</p><div className="loading-line"><i/></div></div>;
  return <form className="register-modal" onSubmit={submit}><span className="pill live">{(event.type || "EVENT").toUpperCase()} · {event.location.includes("Online") ? "ONLINE" : "IN PERSON"}</span><h2>{event.title}</h2><p>{dateLabel} · {event.time}</p><div className="form-row"><label>NAME<input name="name" defaultValue={profile.name} required minLength={2} maxLength={60} autoComplete="name" title="Enter at least 2 letters."/></label><label>EMAIL<input name="email" type="email" defaultValue={profile.email} required autoComplete="email" title="Enter a valid email address."/></label></div><label>COLLEGE OR COMPANY<input name="organization" placeholder="e.g. Independent builder" required minLength={2} maxLength={100}/></label><label>WHAT DO YOU WANT TO GET FROM THIS EVENT?<select name="goal" defaultValue="" required><option value="" disabled>Select one</option><option>Meet collaborators</option><option>Learn something practical</option><option>Share a work in progress</option></select></label>{formError && <p className="form-error" role="alert">{formError}</p>}<p className="form-note"><Icon name="lock" size={14}/> Your registration details are only shared with this event’s hosts.</p><button className="dark-button wide" type="submit">Confirm registration <Icon name="arrow" size={16}/></button></form>;
}
function PassModal({ event, profile, registered, close }: { event: RegisteredEvent; profile: UserProfile; registered: boolean; close: () => void }) {
  const [qr, setQr] = useState("");
  const passId = `BC-${event.id.replace(/[^a-z0-9]/gi, "").slice(0, 10).toUpperCase()}`;
  const dateLabel = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric" }).format(new Date(`${event.date}T12:00:00`));
  useEffect(() => { QRCode.toDataURL(`buildcircle://event/${event.id}/${passId}`, { margin: 1, width: 210, color: { dark: "#161625", light: "#ffffff" } }).then(setQr); }, [event.id, passId]);
  return <div className="pass-modal"><div className="pass-top"><PlatformLogo className="pass-logo"/><span>buildcircle</span><em>EVENT PASS</em></div><div className="pass-community"><MiniLogo color={event.color || "teal"}/> {event.community}</div><h2>{event.title}</h2><div className="pass-info"><div><small>WHEN</small><b>{dateLabel} · {event.time}</b></div><div><small>WHERE</small><b>{event.location}</b></div></div><div className="qr-card">{qr ? <img src={qr} alt="Event check-in QR code"/> : <div className="qr-placeholder">Generating pass...</div>}<div><small>BUILDCIRCLE PASS</small><b>{passId}</b><p>Present this QR at check-in.</p></div></div><div className="pass-person">{avatar(profile.name, "violet")}<div><b>{profile.name}</b><small>Registered builder</small></div><span className="pass-valid"><Icon name="check" size={14}/> VALID</span></div><button className="outline-button wide" onClick={close}>{registered ? "Done" : "Preview pass"}</button></div>;
}
function CheckinModal({ profile, checkedIn, onCheckin }: { profile: UserProfile; checkedIn: boolean; onCheckin: () => void }) {
  const [scanned, setScanned] = useState(checkedIn);
  const scan = () => { setScanned(true); };
  return <div className="checkin-modal">{!scanned ? <><p className="eyebrow">EVENT HOST CONSOLE</p><h2>Scan QR pass</h2><div className="camera"><div className="camera-noise"/><div className="scan-frame"><i/><i/><i/><i/></div><p>Point the camera at a BuildCircle event pass.</p></div><button className="dark-button wide" onClick={scan}>Use demo QR pass <Icon name="arrow" size={16}/></button><p className="form-note center">Use the demo pass to validate {profile.name}’s registration.</p></> : <><div className="valid-mark"><Icon name="check" size={35}/></div><p className="eyebrow">PASS VALID</p><h2>{profile.name}</h2><p className="checkin-id">Registration ID · BC-AGT-9X2A</p><div className="valid-event"><MiniLogo color="teal"/><div><b>Build your first AI agent</b><small>Saturday · 4:00 PM · Online</small></div></div>{checkedIn ? <button className="registered-button wide"><Icon name="check" size={16}/> Checked in at 3:54 PM</button> : <button className="dark-button wide" onClick={onCheckin}>Check in attendee <Icon name="check" size={16}/></button>}<p className="form-note center">Each pass can be checked in only once.</p></>}</div>;
}
function DigestModal({ close, onNavigate }: { close: () => void; onNavigate: (target: DigestDestination) => void }) {
  const [digest, setDigest] = useState<DigestPayload | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    fetch("/api/digest", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Digest request failed");
        return response.json() as Promise<DigestPayload>;
      })
      .then((payload) => {
        if (!Array.isArray(payload.items) || !Array.isArray(payload.stats)) throw new Error("Invalid digest payload");
        setDigest(payload);
      })
      .catch((requestError: unknown) => {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(true);
      });
    return () => controller.abort();
  }, []);

  if (error) return <div className="digest-modal digest-loading"><span className="digest-glyph"><Icon name="sparkle" size={22}/></span><h2>Today’s digest is unavailable.</h2><p>Refresh the page and try again in a moment.</p><button className="outline-button wide" onClick={close}>Close</button></div>;
  if (!digest) return <div className="digest-modal digest-loading"><span className="digest-glyph"><Icon name="sparkle" size={22}/></span><p className="eyebrow">TODAY’S DIGEST</p><h2>Finding the useful momentum…</h2><p>Checking your communities and upcoming events.</p></div>;

  const sourceLabel = digest.source === "openai" ? "OpenAI-curated from community activity" : "Current community snapshot";
  return <div className="digest-modal"><div className="digest-hero"><div><span className="digest-glyph"><Icon name="sparkle" size={22}/></span><p className="eyebrow">AI COMMUNITY DIGEST</p><h2>Your circles, <em>distilled.</em></h2><p>{digest.intro}</p></div><small>{new Date(digest.generatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })} · Today</small></div><p className="digest-source">{sourceLabel}</p>{digest.message && <p className="digest-notice">{digest.message}</p>}<div className="digest-stats">{digest.stats.map((stat) => <div key={stat.label}><b>{stat.value}</b><span>{stat.label}</span></div>)}</div><div className="digest-grid">{digest.items.map((item, index) => <article key={`${item.title}-${index}`}><span className={`digest-icon ${item.tone}`}><Icon name={item.icon} size={18}/></span><div><p className="eyebrow">{item.category}</p><h3>{item.title}</h3><p>{item.summary}</p><button onClick={() => onNavigate(item.destination)}>{item.action} <Icon name="arrow" size={14}/></button></div></article>)}</div><button className="outline-button wide" onClick={close}>Close today’s digest</button></div>;
}

function ImpactModal({ eventMoved, onMove, close }: { eventMoved: boolean; onMove: () => void; close: () => void }) {
  const [channel, setChannel] = useState<"announcement" | "email" | "inapp">("announcement");
  const [draft, setDraft] = useState<EventAgentPayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [queued, setQueued] = useState(false);
  const [error, setError] = useState("");
  const eventTime = eventMoved ? "5:00 PM IST" : "4:00 PM IST";
  const purpose = eventMoved ? "The workshop start time changed from 4:00 PM to 5:00 PM IST. Explain that registrations remain confirmed." : "Prepare a friendly registration confirmation and reminder sequence for every registered attendee.";
  const generate = async () => {
    if (loading) return;
    setLoading(true); setError(""); setQueued(false);
    try {
      const response = await fetch("/api/event-agent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ task: "event-campaign", context: { title: "Build your first AI agent", date: "Saturday, September 21", time: eventTime, location: "Online · Live workshop", audienceCount: eventMoved ? 87 : 327, community: "AI Agents", purpose, actorRole: "Admin" } }) });
      if (!response.ok) throw new Error("Event Operations Agent request failed");
      const payload = await response.json() as EventAgentPayload;
      setDraft(payload);
    } catch {
      setError("The agent could not prepare a kit right now. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };
  const preview = draft ? channel === "announcement" ? { title: draft.draft.headline, body: draft.draft.communityPost } : channel === "email" ? { title: draft.draft.emailSubject, body: draft.draft.emailBody } : { title: "BuildCircle event update", body: draft.draft.inAppMessage } : null;
  return <div className="impact-modal"><div className="impact-top"><span className="impact-icon"><Icon name="sparkle" size={20}/></span><div><p className="eyebrow">EVENT OPERATIONS AGENT</p><h2>{eventMoved ? "Your change has a clear plan." : "Prepare your attendee journey."}</h2><p>The agent checks the event context, writes aligned channel drafts, and keeps every delivery behind your review.</p></div></div><div className="agent-workflow"><span><b>1</b>Audience context</span><span><b>2</b>Cross-channel drafts</span><span><b>3</b>Human approval</span></div>{eventMoved && <div className="impact-count"><b>87</b><div><b>registered attendees affected</b><p>The workshop now begins at 5:00 PM IST. Registrations remain confirmed.</p></div><span>● Needs review</span></div>}{!draft ? <div className="agent-start"><span className="impact-icon"><Icon name="wand" size={19}/></span><div><b>{eventMoved ? "Create the schedule-change kit" : "Create a confirmation and reminder kit"}</b><p>The agent produces a community announcement, email, and in-app notification from the same verified event details.</p></div><button className="dark-button" onClick={generate} disabled={loading}>{loading ? "Preparing…" : "Generate with AI"} <Icon name="arrow" size={15}/></button>{!eventMoved && <button className="outline-button" onClick={onMove}>Simulate timing change</button>}{error && <small className="agent-error">{error}</small>}</div> : <><p className="agent-source"><Icon name="sparkle" size={14}/>{draft.message || "Draft kit ready for review."}</p><div className="impact-tabs"><button className={channel === "announcement" ? "active" : ""} onClick={() => setChannel("announcement")}>Community announcement</button><button className={channel === "email" ? "active" : ""} onClick={() => setChannel("email")}>Email update</button><button className={channel === "inapp" ? "active" : ""} onClick={() => setChannel("inapp")}>In-app message</button></div><div className="draft-card"><div className="draft-head"><span>{draft.source === "openai" ? "AI DRAFT · REVIEW REQUIRED" : "SAFE DRAFT · REVIEW REQUIRED"}</span><button onClick={generate} disabled={loading}><Icon name="wand" size={15}/> {loading ? "Refreshing…" : "Regenerate"}</button></div><h3>{preview?.title}</h3><p>{preview?.body}</p><small>{draft.draft.scheduleNote}</small></div><div className="impact-actions">{queued ? <span className="sent-confirm"><Icon name="check" size={16}/> Communication kit queued for host approval</span> : <button className="dark-button" onClick={() => setQueued(true)}>Queue {eventMoved ? "87" : "327"} attendee updates <Icon name="send" size={15}/></button>}<button className="outline-button" onClick={close}>Save as draft</button></div><p className="delivery-note"><Icon name="lock" size={13}/> BuildCircle stages these messages for review. Connect a verified email delivery provider before external email is released.</p></>}</div>;
}

function ShowcaseModal({ publish }: { publish: (project: { name: string; description: string; image?: string }) => void }) {
  const [cover, setCover] = useState<string | null>(null);
  const chooseCover = (event: ChangeEvent<HTMLInputElement>) => { const file = event.target.files?.[0]; if (file) setCover(URL.createObjectURL(file)); };
  return <form className="showcase-modal" onSubmit={(event) => { event.preventDefault(); const data = new FormData(event.currentTarget); publish({ name: String(data.get("name") || "Your project"), description: String(data.get("description") || "Shared a project update."), image: cover || undefined }); }}><p className="eyebrow">#PROJECTS · AI AGENTS</p><h2>Share what you’re building</h2><p>Give it enough context for the right collaborators to find it.</p><label>PROJECT NAME<input name="name" placeholder="e.g. TraceView" required/></label><label>ONE-SENTENCE DESCRIPTION<input name="description" placeholder="What does it do, for whom?" required/></label><label>TECH STACK<input name="stack" placeholder="e.g. Next.js, OpenAI, Supabase" required minLength={2} maxLength={140}/></label><label>PROJECT LINK<input name="link" type="url" placeholder="https://" required title="Use a complete URL beginning with https://."/></label><label className="upload-drop"><Icon name="image" size={19}/><span>{cover ? "Cover image ready" : "Add a cover image or demo"}</span><small>{cover ? "It will appear in your project post" : "PNG, JPG, WEBP up to 10MB"}</small><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={chooseCover}/></label>{cover && <img className="showcase-preview" src={cover} alt="Selected project cover"/>}<button className="dark-button wide" type="submit">Publish showcase <Icon name="arrow" size={16}/></button></form>;
}
