import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { ConvexProvider, ConvexReactClient, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Download,
  FileText,
  Guitar,
  History,
  Lightbulb,
  Lock,
  Mail,
  Mic2,
  Phone,
  Plus,
  Search,
  Settings,
  Share2,
  Star,
  Clipboard,
  Trash2,
  Unlock,
  Users,
} from "lucide-react";
import "./styles.css";

type Tab = "calendar" | "band" | "guests" | "ideas" | "history" | "settings";

type Song = {
  id: string;
  title: string;
  artist?: string;
  key?: string;
  youtubeUrl?: string;
  chordsUrl?: string;
  notes?: string;
  rating?: number;
};

type Person = {
  id: string;
  name: string;
  kind: "member" | "solo" | "band" | "showcase";
  instruments?: string;
  phone?: string;
  email?: string;
  notes?: string;
  singer?: boolean;
  active?: boolean;
};

type EventGuest = {
  id: string;
  personId: string;
  order: number;
  songs: Song[];
  notes?: string;
};

type JamEvent = {
  id: string;
  date: string;
  title: string;
  status: EventStatus;
  bandMemberIds: string[];
  guests: EventGuest[];
  notes?: string;
};

type EventStatus = "draft" | "in_progress" | "ready" | "published" | "complete" | "saved";

type SongSuggestion = {
  title: string;
  artist?: string;
  key?: string;
};

type AppSettings = {
  songsPerGuest: number;
  jamDay: number;
};

type ActivityEntry = {
  id: string;
  createdAt: string;
  label: string;
  detail?: string;
  eventId?: string;
};

type AppData = {
  people: Person[];
  events: JamEvent[];
  songBank?: Song[];
  settings?: AppSettings;
  activityLog?: ActivityEntry[];
  chartOrder?: string[];
  event?: JamEvent;
};

type BackupSummary = {
  id: string;
  label: string;
  source: "manual" | "daily" | "pre-restore";
  createdAt: number;
  eventCount: number;
  peopleCount: number;
  songIdeaCount: number;
  eventSongCount: number;
};

const defaultSettings: AppSettings = {
  songsPerGuest: 3,
  jamDay: 2,
};

const weekDays = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const eventStatuses: { id: Exclude<EventStatus, "saved">; label: string; helper: string }[] = [
  { id: "draft", label: "Draft", helper: "Still being arranged" },
  { id: "in_progress", label: "In Progress", helper: "Songs and guests are being added" },
  { id: "ready", label: "Ready", helper: "Lineup looks good" },
  { id: "complete", label: "Complete", helper: "Night has finished" },
];

const initialPeople: Person[] = [
  { id: "mark", name: "Mark Eustace", kind: "member", instruments: "Lead guitar, vocals", singer: true, active: true },
  { id: "rich", name: "Rich Parsons", kind: "member", instruments: "Guitar, vocals", singer: true, active: true },
  { id: "vish", name: "Vish", kind: "member", instruments: "Bass", singer: true, active: true },
  { id: "nathan", name: "Nathan", kind: "member", instruments: "Keys", active: true },
  { id: "gary", name: "Gary Curley", kind: "member", instruments: "Drums", active: true },
  { id: "mike", name: "Mike", kind: "solo" },
  { id: "tilly", name: "Tilly", kind: "solo" },
  { id: "graham", name: "Graham", kind: "solo" },
  { id: "maisie", name: "Maisie", kind: "solo" },
  { id: "hot-press", name: "Hot Off The Press", kind: "showcase" },
];

const defaultBlankEventBandMemberIds = ["rich", "vish"];

const initialEvent: JamEvent = {
  id: "2026-05-05",
  date: "2026-05-05",
  title: "Tuesday Jam Night",
  status: "saved",
  bandMemberIds: ["mark", "rich", "vish", "nathan", "gary"],
  guests: [
    {
      id: "slot-rich",
      personId: "rich",
      order: 1,
      songs: [
        { id: "rich-1", title: "Gonna Make You A Star", key: "F", artist: "David Essex" },
        { id: "rich-2", title: "Walk This Way", key: "E", artist: "Aerosmith" },
      ],
    },
    {
      id: "slot-vish",
      personId: "vish",
      order: 2,
      songs: [
        { id: "vish-1", title: "Steal Away", key: "A", artist: "Robbie Dupree" },
        { id: "vish-2", title: "Life's Been Good", key: "A", artist: "Joe Walsh" },
        { id: "vish-3", title: "Don't Dream It's Over", key: "Eb", artist: "Crowded House" },
      ],
    },
    {
      id: "slot-mark",
      personId: "mark",
      order: 3,
      songs: [
        { id: "mark-1", title: "One Of These Nights", key: "E", artist: "The Eagles" },
        { id: "mark-2", title: "China Grove", key: "E", artist: "The Doobie Brothers" },
      ],
    },
    {
      id: "slot-mike",
      personId: "mike",
      order: 4,
      songs: [
        { id: "mike-1", title: "Desperado", key: "G", artist: "Eagles" },
        { id: "mike-2", title: "Hungry Heart", key: "C", artist: "Bruce Springsteen" },
        { id: "mike-3", title: "Dignity", key: "F", artist: "Deacon Blue" },
      ],
    },
    {
      id: "slot-tilly",
      personId: "tilly",
      order: 5,
      songs: [
        { id: "tilly-1", title: "Don't Speak", artist: "No Doubt" },
        { id: "tilly-2", title: "Hate Myself For Loving You" },
        { id: "tilly-3", title: "Hot n Cold", key: "D", artist: "Katy Perry" },
      ],
    },
  ],
};

const songKeys = [
  "-",
  "A",
  "Bb",
  "B",
  "C",
  "C#",
  "Db",
  "D",
  "Eb",
  "E",
  "F",
  "F#",
  "Gb",
  "G",
  "Ab",
  "Am",
  "Bbm",
  "Bm",
  "Cm",
  "C#m",
  "Dbm",
  "Dm",
  "Ebm",
  "Em",
  "Fm",
  "F#m",
  "Gbm",
  "Gm",
  "G#m",
  "Abm",
  "Other",
];

const storageKey = "feathers-jam-night-data-v1";
const editUnlockKey = "feathers-jam-night-edit-unlocked";
const localFallbackPin = "2468";
const convexUrl = import.meta.env.VITE_CONVEX_URL as string | undefined;
const convexClient = convexUrl ? new ConvexReactClient(convexUrl) : null;

function capitaliseSongTitle(value: string) {
  return value.replace(/\S+/g, (word) => {
    if (/^[A-Z0-9&/.'-]+$/.test(word) && /[A-Z]{2,}/.test(word)) return word;
    return word
      .split(/([/-])/)
      .map((part) => (part === "/" || part === "-" || !part ? part : part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()))
      .join("");
  });
}

function normalizeSong(song: Song): Song {
  const rating = Number(song.rating);
  return {
    ...song,
    title: capitaliseSongTitle(song.title || ""),
    artist: song.artist ? capitaliseSongTitle(song.artist) : song.artist,
    rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.max(1, Math.round(rating))) : undefined,
  };
}

function normalizeSongPatch(patch: Partial<Song>): Partial<Song> {
  const rating = Number(patch.rating);
  return {
    ...patch,
    ...("title" in patch ? { title: capitaliseSongTitle(patch.title || "") } : {}),
    ...("artist" in patch ? { artist: patch.artist ? capitaliseSongTitle(patch.artist) : patch.artist } : {}),
    ...("rating" in patch ? { rating: Number.isFinite(rating) && rating > 0 ? Math.min(5, Math.max(1, Math.round(rating))) : undefined } : {}),
  };
}

function normalizePerson(person: Person): Person {
  return {
    ...person,
    name: capitaliseSongTitle(person.name.trim()),
  };
}

function getSongChartKey(title: string, artist?: string) {
  return `${title.trim().toLowerCase()}|${(artist || "").trim().toLowerCase()}`;
}

function normalizeEventStatus(status: EventStatus | string | undefined): Exclude<EventStatus, "saved"> {
  if (status === "published") return "ready";
  if (status === "in_progress" || status === "ready" || status === "complete") return status;
  return "draft";
}

function getEventStatusMeta(status: EventStatus | string | undefined) {
  const normalized = normalizeEventStatus(status);
  return eventStatuses.find((candidate) => candidate.id === normalized) || eventStatuses[0];
}

function normalizeEventSongs(event: JamEvent): JamEvent {
  return {
    ...event,
    status: normalizeEventStatus(event.status),
    guests: event.guests.map((guest) => ({
      ...guest,
      songs: guest.songs.map(normalizeSong),
    })),
  };
}

function normalizeAppData(data: Partial<AppData> | null | undefined): AppData {
  const events = data?.events?.length ? data.events : data?.event ? [data.event] : [initialEvent];
  const songsPerGuest = Number(data?.settings?.songsPerGuest ?? defaultSettings.songsPerGuest);
  const jamDay = Number(data?.settings?.jamDay ?? defaultSettings.jamDay);
  return {
    people: (data?.people?.length ? data.people : initialPeople).map(normalizePerson),
    events: events.map(normalizeEventSongs),
    songBank: (data?.songBank || []).map(normalizeSong),
    settings: {
      songsPerGuest: Number.isFinite(songsPerGuest) ? Math.min(10, Math.max(1, Math.round(songsPerGuest))) : defaultSettings.songsPerGuest,
      jamDay: Number.isFinite(jamDay) ? Math.min(6, Math.max(0, Math.round(jamDay))) : defaultSettings.jamDay,
    },
    activityLog: (data?.activityLog || []).slice(0, 150),
    chartOrder: Array.isArray(data?.chartOrder) ? data.chartOrder.filter((key) => typeof key === "string") : [],
  };
}

function getAppDataSignature(data: AppData) {
  return JSON.stringify({
    people: data.people,
    events: data.events,
    songBank: data.songBank || [],
    settings: data.settings || defaultSettings,
    activityLog: data.activityLog || [],
    chartOrder: data.chartOrder || [],
  });
}

function getEventContentScore(event: JamEvent) {
  const songCount = event.guests.reduce((total, guest) => total + guest.songs.length, 0);
  const noteScore = event.notes?.trim() ? 1 : 0;
  return songCount * 10 + event.guests.length * 3 + noteScore;
}

function mergeEventsPreferContent(primaryEvents: JamEvent[], fallbackEvents: JamEvent[]) {
  const merged = new Map<string, JamEvent>();
  primaryEvents.forEach((event) => merged.set(event.id, event));
  fallbackEvents.forEach((event) => {
    const existing = merged.get(event.id);
    if (!existing) {
      if (getEventContentScore(event) > 0) merged.set(event.id, event);
      return;
    }
    if (getEventContentScore(event) > getEventContentScore(existing)) {
      merged.set(event.id, event);
    }
  });
  return [...merged.values()].sort((a, b) => a.date.localeCompare(b.date));
}

function mergeAppDataPreferContent(primary: AppData, fallback: AppData): AppData {
  return {
    ...primary,
    events: mergeEventsPreferContent(primary.events, fallback.events),
    people: primary.people.length >= fallback.people.length ? primary.people : fallback.people,
    songBank: (primary.songBank || []).length >= (fallback.songBank || []).length ? primary.songBank : fallback.songBank,
    activityLog: [...(primary.activityLog || []), ...(fallback.activityLog || [])]
      .filter((entry, index, entries) => entries.findIndex((candidate) => candidate.id === entry.id) === index)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 150),
    chartOrder: primary.chartOrder?.length ? primary.chartOrder : fallback.chartOrder,
  };
}

function getWeekdayLabel(day: number) {
  return weekDays.find((candidate) => candidate.value === day)?.label || "Tuesday";
}

function createBlankEvent(date: string, people: Person[] = initialPeople, jamDay = defaultSettings.jamDay): JamEvent {
  const defaultBandMemberIds = defaultBlankEventBandMemberIds.filter((id) =>
    people.some((person) => person.id === id && person.kind === "member" && person.active !== false),
  );

  return {
    id: date,
    date,
    title: `${getWeekdayLabel(jamDay)} Jam Night`,
    status: "draft",
    bandMemberIds: defaultBandMemberIds,
    guests: [],
  };
}

function formatEventDate(date: string) {
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function formatMonth(month: string) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "long",
    year: "numeric",
  }).format(new Date(`${month}-01T12:00:00`));
}

function formatActivityTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} at ${date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
}

function shiftMonth(month: string, delta: number) {
  const next = new Date(`${month}-01T12:00:00`);
  next.setMonth(next.getMonth() + delta);
  return next.toISOString().slice(0, 7);
}

function getTodayDateStamp() {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
}

function getCurrentMonth() {
  return getTodayDateStamp().slice(0, 7);
}

function getEventDates(month: string, jamDay: number) {
  const cursor = new Date(`${month}-01T12:00:00`);
  const dates: string[] = [];
  const targetDay = Math.min(6, Math.max(0, Math.round(jamDay)));

  while (cursor.getMonth() === Number(month.slice(5, 7)) - 1) {
    if (cursor.getDay() === targetDay) {
      dates.push(cursor.toISOString().slice(0, 10));
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return dates;
}

function loadInitialData(): AppData {
  try {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) return normalizeAppData(JSON.parse(stored) as AppData);
  } catch {
    // Fall back to seeded data if local storage is unavailable or malformed.
  }
  return normalizeAppData({ people: initialPeople, events: [initialEvent] });
}

function getPerson(people: Person[], id: string) {
  return people.find((person) => person.id === id) || {
    id,
    name: "Unknown performer",
    kind: "solo" as const,
  };
}

function copyEventToDate(source: JamEvent, date: string): JamEvent {
  const copyStamp = Date.now();
  return {
    ...source,
    id: date,
    date,
    status: "draft",
    guests: source.guests.map((guest, guestIndex) => {
      const guestId = `slot-${guest.personId}-${date}-${copyStamp}-${guestIndex}`;
      return {
        ...guest,
        id: guestId,
        songs: guest.songs.map((song, songIndex) => ({
          ...song,
          id: `${guestId}-song-${songIndex + 1}`,
        })),
      };
    }),
  };
}

function downloadTextFile(filename: string, contents: string, type = "text/plain;charset=utf-8") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function getBackupSourceLabel(source: BackupSummary["source"]) {
  if (source === "daily") return "Daily backup";
  if (source === "pre-restore") return "Before restore";
  return "Manual backup";
}

function formatBackupDate(createdAt: number) {
  return new Date(createdAt).toLocaleString([], {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function csvCell(value: unknown) {
  const text = String(value ?? "");
  return `"${text.replace(/"/g, '""')}"`;
}

function csvRows(headers: string[], rows: unknown[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}

function exportDateStamp() {
  return new Date().toISOString().slice(0, 10);
}

type SaveStatus = "saved" | "saving" | "error";

type AppContentProps = {
  remoteData?: AppData | null;
  remoteReady: boolean;
  saveRemote?: (args: { value: AppData }) => Promise<unknown>;
  verifyEditPin?: (args: { pin: string }) => Promise<boolean>;
  changeEditPin?: (args: { currentPin: string; nextPin: string }) => Promise<boolean>;
  backups?: BackupSummary[];
  createBackup?: () => Promise<unknown>;
  restoreBackup?: (backupId: string) => Promise<AppData | false | null>;
  syncMode: "local" | "convex";
};

function AppContent({
  remoteData,
  remoteReady,
  saveRemote,
  verifyEditPin,
  changeEditPin,
  backups,
  createBackup,
  restoreBackup,
  syncMode,
}: AppContentProps) {
  const initialData = useMemo(loadInitialData, []);
  const [tab, setTab] = useState<Tab>("calendar");
  const [people, setPeople] = useState(initialData.people);
  const [events, setEvents] = useState(initialData.events);
  const [songBank, setSongBank] = useState(initialData.songBank || []);
  const [settings, setSettings] = useState(initialData.settings || defaultSettings);
  const [activityLog, setActivityLog] = useState(initialData.activityLog || []);
  const [chartOrder, setChartOrder] = useState(initialData.chartOrder || []);
  const [currentMonth, setCurrentMonth] = useState(getCurrentMonth);
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<string>("");
  const [syncNotice, setSyncNotice] = useState("");
  const [isEditUnlocked, setIsEditUnlocked] = useState(() => window.localStorage.getItem(editUnlockKey) === "true");
  const [isUnlockOpen, setIsUnlockOpen] = useState(false);
  const [pendingEventDate, setPendingEventDate] = useState<string | null>(null);
  const [copiedEvent, setCopiedEvent] = useState<JamEvent | null>(null);
  const initialSignature = useMemo(() => getAppDataSignature(initialData), [initialData]);
  const hasSeededRemote = React.useRef(false);
  const latestLocalData = React.useRef<AppData>({
    people: initialData.people,
    events: initialData.events,
    songBank: initialData.songBank || [],
    settings: initialData.settings || defaultSettings,
    activityLog: initialData.activityLog || [],
    chartOrder: initialData.chartOrder || [],
  });
  const latestLocalSignature = React.useRef(initialSignature);
  const lastSavedSignature = React.useRef(initialSignature);
  const lastAppliedRemoteSignature = React.useRef("");
  const lastAutoMonth = React.useRef(getCurrentMonth());
  const hasHandledRemote = React.useRef(syncMode === "local");

  const event = events.find((candidate) => candidate.id === selectedEventId) || events[0] || initialEvent;
  const selectedEvent = selectedEventId !== null;
  const editingGuest = event.guests.find((guest) => guest.id === editingGuestId);

  function setEvent(updater: React.SetStateAction<JamEvent>) {
    setEvents((current) =>
      current.map((candidate) =>
        candidate.id === event.id ? (typeof updater === "function" ? updater(candidate) : updater) : candidate,
      ),
    );
  }

  React.useEffect(() => {
    latestLocalData.current = { people, events, songBank, settings, activityLog, chartOrder };
    latestLocalSignature.current = getAppDataSignature(latestLocalData.current);
  }, [activityLog, chartOrder, events, people, settings, songBank]);

  React.useEffect(() => {
    function syncCurrentMonth() {
      const nextMonth = getCurrentMonth();
      if (nextMonth === lastAutoMonth.current) return;
      setCurrentMonth((month) => (month === lastAutoMonth.current ? nextMonth : month));
      lastAutoMonth.current = nextMonth;
    }

    syncCurrentMonth();
    const timer = window.setInterval(syncCurrentMonth, 60 * 60 * 1000);
    return () => window.clearInterval(timer);
  }, []);

  React.useEffect(() => {
    if (!remoteReady) return;

    if (!remoteData) {
      if (!saveRemote || hasSeededRemote.current) return;
      hasSeededRemote.current = true;
      hasHandledRemote.current = true;
      const value = latestLocalData.current;
      const signature = latestLocalSignature.current;
      void saveRemote({ value })
        .then(() => {
          lastSavedSignature.current = signature;
          lastAppliedRemoteSignature.current = signature;
        })
        .catch(() => setSaveStatus("error"));
      return;
    }

    const nextData = normalizeAppData(remoteData);
    const nextLocalData = latestLocalData.current;
    const mergedData = mergeAppDataPreferContent(nextData, nextLocalData);
    const remoteSignature = getAppDataSignature(mergedData);
    const localSignature = latestLocalSignature.current;
    const hasUnsavedLocalChanges = localSignature !== lastSavedSignature.current;

    hasHandledRemote.current = true;
    if (remoteSignature === localSignature || remoteSignature === lastAppliedRemoteSignature.current) return;
    if (saveStatus === "saving" || hasUnsavedLocalChanges) return;

    lastAppliedRemoteSignature.current = remoteSignature;
    lastSavedSignature.current = remoteSignature;
    setPeople(mergedData.people);
    setEvents(mergedData.events);
    setSongBank(mergedData.songBank || []);
    setSettings(mergedData.settings || defaultSettings);
    setActivityLog(mergedData.activityLog || []);
    setChartOrder(mergedData.chartOrder || []);
    setSyncNotice("Updated from another device");
    window.setTimeout(() => setSyncNotice(""), 3000);
  }, [remoteData, remoteReady, saveRemote, saveStatus]);

  React.useEffect(() => {
    if (!remoteReady || (syncMode === "convex" && !isEditUnlocked)) return;
    if (syncMode === "convex" && !hasHandledRemote.current) return;
    setSaveStatus("saving");
    const timer = window.setTimeout(() => {
      const value = { people, events, songBank, settings, activityLog, chartOrder };
      const signature = getAppDataSignature(value);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(value));
      } catch {
        setSaveStatus("error");
        return;
      }

      const remoteSave = saveRemote ? saveRemote({ value }) : Promise.resolve();
      void remoteSave
        .then(() => {
          lastSavedSignature.current = signature;
          lastAppliedRemoteSignature.current = signature;
          setSaveStatus("saved");
          setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
        })
        .catch(() => setSaveStatus("error"));
    }, 450);

    return () => window.clearTimeout(timer);
  }, [people, events, settings, songBank, activityLog, chartOrder, isEditUnlocked, remoteReady, saveRemote, syncMode]);

  function saveNow() {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const value = { people, events, songBank, settings, activityLog, chartOrder };
    const signature = getAppDataSignature(value);
    setSaveStatus("saving");
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      setSaveStatus("error");
      return;
    }

    if (!saveRemote) {
      lastSavedSignature.current = signature;
      setSaveStatus("saved");
      setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      return;
    }

    void saveRemote({ value })
      .then(() => {
        lastSavedSignature.current = signature;
        lastAppliedRemoteSignature.current = signature;
        setSaveStatus("saved");
        setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
      })
      .catch(() => setSaveStatus("error"));
  }

  function addActivity(label: string, detail?: string, eventId: string = event.id) {
    const entry: ActivityEntry = {
      id: `activity-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      createdAt: new Date().toISOString(),
      label,
      detail,
      eventId,
    };
    setActivityLog((current) => [entry, ...current].slice(0, 150));
  }

  function importAppData(nextData: AppData) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const normalized = normalizeAppData(nextData);
    const shouldImport = window.confirm("Import this backup? It will replace the current people, events, song ideas, settings and activity log.");
    if (!shouldImport) return;
    setPeople(normalized.people);
    setEvents(normalized.events);
    setSongBank(normalized.songBank || []);
    setSettings(normalized.settings || defaultSettings);
    setChartOrder(normalized.chartOrder || []);
    setActivityLog([
      {
        id: `activity-${Date.now()}`,
        createdAt: new Date().toISOString(),
        label: "Imported backup",
        detail: "Data was restored from a JSON backup file.",
        eventId: "settings",
      },
      ...(normalized.activityLog || []),
    ].slice(0, 150));
    setSyncNotice("Backup imported");
    window.setTimeout(() => setSyncNotice(""), 3000);
  }

  const songSuggestions = useMemo(() => {
    const seen = new Map<string, SongSuggestion>();
    songBank.forEach((song) => {
      const title = song.title.trim();
      if (!title) return;
      seen.set(`${title.toLowerCase()}|${(song.artist || "").toLowerCase()}`, {
        title,
        artist: song.artist,
        key: song.key,
      });
    });
    events.forEach((candidate) => {
      candidate.guests.forEach((guest) => {
        guest.songs.forEach((song) => {
          const title = song.title.trim();
          if (!title) return;
          const key = `${title.toLowerCase()}|${(song.artist || "").toLowerCase()}`;
          if (!seen.has(key)) {
            seen.set(key, {
              title,
              artist: song.artist,
              key: song.key,
            });
          }
        });
      });
    });
    return [...seen.values()].sort((a, b) => a.title.localeCompare(b.title));
  }, [events, songBank]);

  function openEvent(date: string) {
    setEditingGuestId(null);
    const eventExists = events.some((candidate) => candidate.id === date);
    if (!eventExists && syncMode === "convex" && !hasHandledRemote.current) {
      setSyncNotice("Still loading saved events. Please try again in a moment.");
      window.setTimeout(() => setSyncNotice(""), 3000);
      return;
    }
    if (!eventExists && !isEditUnlocked) {
      setPendingEventDate(date);
      setIsUnlockOpen(true);
      setSyncNotice(`Unlock editing to create ${formatEventDate(date)}`);
      window.setTimeout(() => setSyncNotice(""), 3000);
      return;
    }
    setEvents((current) => (current.some((candidate) => candidate.id === date) ? current : [...current, createBlankEvent(date, people, settings.jamDay)]));
    setSelectedEventId(date);
  }

  function copyCurrentEvent() {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    setCopiedEvent(event);
    setSyncNotice(`Copied ${formatEventDate(event.date)}`);
    window.setTimeout(() => setSyncNotice(""), 3000);
  }

  function pasteCopiedEvent() {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    if (!copiedEvent) return;
    if (copiedEvent.date === event.date) {
      setSyncNotice("Choose a different date to paste into");
      window.setTimeout(() => setSyncNotice(""), 3000);
      return;
    }

    const hasCurrentPlan = event.bandMemberIds.length > 0 || event.guests.length > 0 || Boolean(event.notes);
    const shouldCopy =
      !hasCurrentPlan ||
      window.confirm(
        `Paste the full event from ${formatEventDate(copiedEvent.date)} into ${formatEventDate(event.date)}? This will replace the current band lineup, guests, songs and notes for this date.`,
      );

    if (!shouldCopy) return;

    const nextEvent = copyEventToDate(copiedEvent, event.date);
    setEditingGuestId(null);
    setEvents((current) => current.map((candidate) => (candidate.id === event.id ? nextEvent : candidate)));
    addActivity("Pasted event", `Copied ${formatEventDate(copiedEvent.date)} into ${formatEventDate(event.date)}.`);
  }

  function resetCurrentEvent() {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const shouldReset = window.confirm(
      `Reset ${formatEventDate(event.date)}? This will clear the current band lineup, guests, songs and notes for this date.`,
    );
    if (!shouldReset) return;
    setEditingGuestId(null);
    setEvents((current) =>
      current.map((candidate) =>
        candidate.id === event.id
          ? {
              ...createBlankEvent(event.date, people),
              bandMemberIds: [],
              notes: "",
            }
          : candidate,
      ),
    );
    addActivity("Reset event", `${formatEventDate(event.date)} was cleared.`);
  }

  function moveGuest(guestId: string, direction: -1 | 1) {
    if (!isEditUnlocked) return;
    setEvent((current) => {
      const guests = [...current.guests].sort((a, b) => a.order - b.order);
      const index = guests.findIndex((guest) => guest.id === guestId);
      const target = index + direction;
      if (target < 0 || target >= guests.length) return current;
      [guests[index], guests[target]] = [guests[target], guests[index]];
      return {
        ...current,
        guests: guests.map((guest, nextIndex) => ({ ...guest, order: nextIndex + 1 })),
      };
    });
  }

  function moveSong(guestId: string, songId: string, direction: -1 | 1) {
    if (!isEditUnlocked) return;
    setEvent((current) => ({
      ...current,
      guests: current.guests.map((guest) => {
        if (guest.id !== guestId) return guest;
        const songs = [...guest.songs];
        const index = songs.findIndex((song) => song.id === songId);
        const target = index + direction;
        if (target < 0 || target >= songs.length) return guest;
        [songs[index], songs[target]] = [songs[target], songs[index]];
        return { ...guest, songs };
      }),
    }));
  }

  function updateSong(guestId: string, songId: string, patch: Partial<Song>) {
    if (!isEditUnlocked) return;
    const nextPatch = normalizeSongPatch(patch);
    setEvent((current) => ({
      ...current,
      guests: current.guests.map((guest) =>
        guest.id === guestId
          ? { ...guest, songs: guest.songs.map((song) => (song.id === songId ? { ...song, ...nextPatch } : song)) }
          : guest,
      ),
    }));
  }

  function deleteSong(guestId: string, songId: string) {
    if (!isEditUnlocked) return;
    const guest = event.guests.find((candidate) => candidate.id === guestId);
    const person = guest ? getPerson(people, guest.personId) : null;
    const song = guest?.songs.find((candidate) => candidate.id === songId);
    setEvent((current) => ({
      ...current,
      guests: current.guests.map((guest) =>
        guest.id === guestId ? { ...guest, songs: guest.songs.filter((song) => song.id !== songId) } : guest,
      ),
    }));
    addActivity("Deleted song", `${song?.title || "A song"} was removed${person ? ` from ${person.name}` : ""}.`);
  }

  function addSong(guestId: string, songId?: string) {
    if (!isEditUnlocked) return;
    const guest = event.guests.find((candidate) => candidate.id === guestId);
    const person = guest ? getPerson(people, guest.personId) : null;
    let didAdd = false;
    setEvent((current) => ({
      ...current,
      guests: current.guests.map((guest) =>
        guest.id === guestId
          ? guest.songs.length >= settings.songsPerGuest
            ? guest
            : {
              ...guest,
              songs: [
                ...guest.songs,
                {
                  id: songId || `${guestId}-${Date.now()}`,
                  title: "",
                  key: "",
                  artist: "",
                  chordsUrl: "",
                },
              ],
            }
          : guest,
      ),
    }));
    if (guest && guest.songs.length < settings.songsPerGuest) didAdd = true;
    if (didAdd) addActivity("Added song slot", person ? `New song added for ${person.name}.` : "New song added.");
  }

  function updateSettings(patch: Partial<AppSettings>) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    setSettings((current) => {
      const songsPerGuest = Number(patch.songsPerGuest ?? current.songsPerGuest);
      return {
        ...current,
        ...patch,
        songsPerGuest: Number.isFinite(songsPerGuest) ? Math.min(10, Math.max(1, Math.round(songsPerGuest))) : current.songsPerGuest,
        jamDay: Number.isFinite(Number(patch.jamDay ?? current.jamDay))
          ? Math.min(6, Math.max(0, Math.round(Number(patch.jamDay ?? current.jamDay))))
          : current.jamDay,
      };
    });
    if (patch.songsPerGuest) addActivity("Changed song limit", `Songs per guest set to ${Math.min(10, Math.max(1, Math.round(Number(patch.songsPerGuest))))}.`, "settings");
    if (patch.jamDay !== undefined) addActivity("Changed jam night day", `Calendar now shows ${getWeekdayLabel(Number(patch.jamDay))} events.`, "settings");
  }

  async function restoreBackupSnapshot(backupId: string) {
    if (!restoreBackup) return false;
    const restored = await restoreBackup(backupId);
    if (!restored) return false;

    const normalized = normalizeAppData(restored);
    const signature = getAppDataSignature(normalized);
    setPeople(normalized.people);
    setEvents(normalized.events);
    setSongBank(normalized.songBank || []);
    setSettings(normalized.settings || defaultSettings);
    setActivityLog(normalized.activityLog || []);
    setChartOrder(normalized.chartOrder || []);
    lastSavedSignature.current = signature;
    lastAppliedRemoteSignature.current = signature;
    setSaveStatus("saved");
    setLastSavedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }));
    setSyncNotice("Backup restored");
    window.setTimeout(() => setSyncNotice(""), 3000);
    return true;
  }

  function savePerson(person: Person) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const nextPerson = normalizePerson(person);
    setPeople((current) => {
      const exists = current.some((candidate) => candidate.id === nextPerson.id);
      return exists ? current.map((candidate) => (candidate.id === nextPerson.id ? nextPerson : candidate)) : [...current, nextPerson];
    });
    addActivity(nextPerson.name ? "Saved person" : "Added person", nextPerson.name || "Person details updated.", "people");
  }

  function deletePerson(personId: string) {
    if (!isEditUnlocked) return;
    const person = getPerson(people, personId);
    setPeople((current) => current.filter((person) => person.id !== personId));
    setEvents((current) =>
      current.map((candidate) => ({
        ...candidate,
        bandMemberIds: candidate.bandMemberIds.filter((id) => id !== personId),
        guests: candidate.guests.filter((guest) => guest.personId !== personId),
      })),
    );
    addActivity("Deleted person", `${person.name} was removed from people and events.`, "people");
  }

  function updateBandLineup(memberIds: string[]) {
    if (!isEditUnlocked) return;
    setEvent((current) => ({ ...current, bandMemberIds: memberIds }));
    addActivity("Updated band lineup", `${formatEventDate(event.date)} now has ${memberIds.length} band members.`);
  }

  function updateEventStatus(status: Exclude<EventStatus, "saved">) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    setEvent((current) => ({ ...current, status }));
    addActivity("Changed event status", `${formatEventDate(event.date)} marked as ${getEventStatusMeta(status).label}.`);
  }

  function updateEventNotes(notes: string) {
    if (!isEditUnlocked) return;
    setEvent((current) => ({ ...current, notes }));
  }

  function addEventGuests(personIds: string[], displayNames: Record<string, string> = {}) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const newPersonIds = personIds.filter((personId) => !event.guests.some((guest) => guest.personId === personId));
    if (!newPersonIds.length) return;
    const stamp = Date.now();
    setEvent((current) => {
      const existingPersonIds = new Set(current.guests.map((guest) => guest.personId));
      const guestsToAdd = newPersonIds.filter((personId) => !existingPersonIds.has(personId));
      if (!guestsToAdd.length) return current;
      const nextOrder = current.guests.reduce((highest, guest) => Math.max(highest, guest.order), 0) + 1;
      return {
        ...current,
        guests: [
          ...current.guests,
          ...guestsToAdd.map((personId, index) => ({
            id: `slot-${personId}-${stamp}-${index}`,
            personId,
            order: nextOrder + index,
            songs: [],
          })),
        ],
      };
    });
    const names = newPersonIds.map((personId) => displayNames[personId] || getPerson(people, personId).name);
    addActivity("Added guest", `${names.join(", ")} added to ${formatEventDate(event.date)}.`);
  }

  function addEventGuest(personId: string, displayName?: string) {
    addEventGuests([personId], displayName ? { [personId]: displayName } : {});
  }

  function removeEventGuest(guestId: string) {
    if (!isEditUnlocked) return;
    const guest = event.guests.find((candidate) => candidate.id === guestId);
    const person = guest ? getPerson(people, guest.personId) : null;
    setEditingGuestId((current) => (current === guestId ? null : current));
    setEvent((current) => ({
      ...current,
      guests: current.guests
        .filter((guest) => guest.id !== guestId)
        .sort((a, b) => a.order - b.order)
        .map((guest, index) => ({ ...guest, order: index + 1 })),
    }));
    addActivity("Removed guest", `${person?.name || "A guest"} was removed from ${formatEventDate(event.date)}.`);
  }

  function createAndAddEventGuest(name: string) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const trimmedName = capitaliseSongTitle(name.trim());
    if (!trimmedName) return;
    const personId = `person-${Date.now()}`;
    savePerson({
      id: personId,
      name: trimmedName,
      kind: "solo",
      singer: false,
    });
    addEventGuest(personId, trimmedName);
  }

  function saveSongBankSong(song: Song) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const nextSong = normalizeSong(song);
    setSongBank((current) => {
      const exists = current.some((candidate) => candidate.id === nextSong.id);
      return exists ? current.map((candidate) => (candidate.id === nextSong.id ? nextSong : candidate)) : [...current, nextSong];
    });
  }

  function deleteSongBankSong(songId: string) {
    if (!isEditUnlocked) return;
    const song = songBank.find((candidate) => candidate.id === songId);
    setSongBank((current) => current.filter((song) => song.id !== songId));
    addActivity("Deleted song idea", `${song?.title || "A song idea"} was removed.`, "ideas");
  }

  function moveSongBankSong(songId: string, direction: -1 | 1) {
    if (!isEditUnlocked) return;
    setSongBank((current) => {
      const songs = [...current];
      const index = songs.findIndex((song) => song.id === songId);
      const target = index + direction;
      if (target < 0 || target >= songs.length) return current;
      [songs[index], songs[target]] = [songs[target], songs[index]];
      return songs;
    });
  }

  function addSongIdeaToEvent(songId: string, eventId: string, guestId: string) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const idea = songBank.find((candidate) => candidate.id === songId);
    if (!idea) return;
    const targetEvent = events.find((candidate) => candidate.id === eventId);
    const targetGuest = targetEvent?.guests.find((guest) => guest.id === guestId);
    if (!targetEvent || !targetGuest) return;
    if (targetGuest.songs.length >= settings.songsPerGuest) {
      setSyncNotice(`${getPerson(people, targetGuest.personId).name} already has ${settings.songsPerGuest} songs`);
      window.setTimeout(() => setSyncNotice(""), 3000);
      return;
    }

    const targetPerson = getPerson(people, targetGuest.personId);
    setEvents((current) =>
      current.map((candidate) =>
        candidate.id === eventId
          ? {
              ...candidate,
              guests: candidate.guests.map((guest) =>
                guest.id === guestId
                  ? {
                      ...guest,
                      songs: [
                        ...guest.songs,
                        {
                          ...idea,
                          id: `${guestId}-idea-${Date.now()}`,
                        },
                      ],
                    }
                  : guest,
              ),
            }
          : candidate,
      ),
    );
    addActivity("Added idea to event", `${idea.title || "Song idea"} added to ${targetPerson.name} on ${formatEventDate(eventId)}.`, eventId);
  }

  function moveChartSong(songKey: string, visibleSongKeys: string[], direction: -1 | 1) {
    if (!isEditUnlocked) {
      setIsUnlockOpen(true);
      return;
    }
    const index = visibleSongKeys.indexOf(songKey);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= visibleSongKeys.length) return;
    const nextVisibleOrder = [...visibleSongKeys];
    [nextVisibleOrder[index], nextVisibleOrder[target]] = [nextVisibleOrder[target], nextVisibleOrder[index]];
    setChartOrder((current) => {
      const visibleSet = new Set(visibleSongKeys);
      return [
        ...nextVisibleOrder,
        ...current.filter((key) => !visibleSet.has(key)),
      ];
    });
    addActivity("Updated chart order", "Top Songs chart order changed.", "history");
  }

  const members = useMemo(
    () =>
      people
        .filter((person) => person.kind === "member")
        .filter((person) => person.name.toLowerCase().includes(search.toLowerCase())),
    [people, search],
  );

  const guests = useMemo(
    () =>
      people
        .filter((person) => person.kind !== "member")
        .filter((person) => person.name.toLowerCase().includes(search.toLowerCase())),
    [people, search],
  );

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand-mark">🎸</div>
        <div>
          <h1>The Feathers Inn</h1>
          <p>Jam Night Manager</p>
        </div>
        <button
          className={`lock-button ${isEditUnlocked ? "is-unlocked" : ""}`}
          onClick={() => {
            if (isEditUnlocked) {
              setIsEditUnlocked(false);
              window.localStorage.removeItem(editUnlockKey);
              return;
            }
            setIsUnlockOpen(true);
          }}
        >
          {isEditUnlocked ? <Unlock size={16} /> : <Lock size={16} />}
          <span>{isEditUnlocked ? "Edit" : "View"}</span>
        </button>
      </header>

      <main className="main-panel">
        {selectedEvent ? (
          editingGuest ? (
            <GuestSongEditor
              guest={editingGuest}
              onBack={() => setEditingGuestId(null)}
              onMoveSong={moveSong}
              onUpdateSong={updateSong}
              onAddSong={addSong}
              onDeleteSong={deleteSong}
              people={people}
              songSuggestions={songSuggestions}
              maxSongsPerGuest={settings.songsPerGuest}
              canEdit={isEditUnlocked}
              onRequestUnlock={() => setIsUnlockOpen(true)}
            />
          ) : (
            <EventDetail
              event={event}
              people={people}
              onBack={() => {
                setEditingGuestId(null);
                setSelectedEventId(null);
              }}
              onMoveGuest={moveGuest}
              onEditGuest={setEditingGuestId}
              onUpdateStatus={updateEventStatus}
              onUpdateNotes={updateEventNotes}
              onUpdateBandLineup={updateBandLineup}
              onAddEventGuest={addEventGuests}
              onCreateAndAddEventGuest={createAndAddEventGuest}
              onRemoveEventGuest={removeEventGuest}
              copiedEvent={copiedEvent}
              onCopyEvent={copyCurrentEvent}
              onPasteEvent={pasteCopiedEvent}
              onResetEvent={resetCurrentEvent}
              saveStatus={saveStatus}
              lastSavedAt={lastSavedAt}
              syncMode={syncMode}
              syncNotice={syncNotice}
              onSaveNow={saveNow}
              canEdit={isEditUnlocked}
              onRequestUnlock={() => setIsUnlockOpen(true)}
            />
          )
        ) : (
          <>
            {tab === "calendar" && (
              <CalendarView
                currentMonth={currentMonth}
                jamDay={settings.jamDay}
                events={events}
                people={people}
                onOpenEvent={openEvent}
                onChangeMonth={(delta) => setCurrentMonth((month) => shiftMonth(month, delta))}
                onSetMonth={setCurrentMonth}
              />
            )}
            {tab === "band" && (
              <PeopleView
                title="Band Members"
                defaultKind="member"
                search={search}
                setSearch={setSearch}
                people={members}
                onSave={savePerson}
                onDelete={deletePerson}
                canEdit={isEditUnlocked}
                onRequestUnlock={() => setIsUnlockOpen(true)}
              />
            )}
            {tab === "guests" && (
              <PeopleView
                title="Guests"
                defaultKind="solo"
                search={search}
                setSearch={setSearch}
                people={guests}
                onSave={savePerson}
                onDelete={deletePerson}
                canEdit={isEditUnlocked}
                onRequestUnlock={() => setIsUnlockOpen(true)}
              />
            )}
            {tab === "history" && (
              <HistoryView
                events={events}
                people={people}
                activityLog={activityLog}
                chartOrder={chartOrder}
                canEdit={isEditUnlocked}
                onMoveChartSong={moveChartSong}
              />
            )}
            {tab === "ideas" && (
              <SongBankView
                songs={songBank}
                events={events}
                people={people}
                suggestions={songSuggestions}
                canEdit={isEditUnlocked}
                onRequestUnlock={() => setIsUnlockOpen(true)}
                onSave={saveSongBankSong}
                onDelete={deleteSongBankSong}
                onMove={moveSongBankSong}
                onAddToEvent={addSongIdeaToEvent}
              />
            )}
            {tab === "settings" && (
              <SettingsView
                syncMode={syncMode}
                remoteReady={remoteReady}
                saveStatus={saveStatus}
                people={people}
                events={events}
                songBank={songBank}
                settings={settings}
                activityLog={activityLog}
                chartOrder={chartOrder}
                canEdit={isEditUnlocked}
                onUpdateSettings={updateSettings}
                onImportData={importAppData}
                onChangePin={changeEditPin}
                backups={backups}
                onCreateBackup={createBackup}
                onRestoreBackup={restoreBackupSnapshot}
              />
            )}
          </>
        )}
      </main>

      {!selectedEvent && <BottomNav tab={tab} setTab={setTab} />}
      {isUnlockOpen && (
        <UnlockModal
          onClose={() => {
            setIsUnlockOpen(false);
            setPendingEventDate(null);
          }}
          onUnlock={async (pin) => {
            const isValid = verifyEditPin ? await verifyEditPin({ pin }) : pin.trim() === localFallbackPin;
            if (!isValid) return false;
            setIsEditUnlocked(true);
            window.localStorage.setItem(editUnlockKey, "true");
            setIsUnlockOpen(false);
            if (pendingEventDate) {
              const date = pendingEventDate;
              setEvents((current) => (current.some((candidate) => candidate.id === date) ? current : [...current, createBlankEvent(date, people, settings.jamDay)]));
              setSelectedEventId(date);
              setPendingEventDate(null);
            }
            return true;
          }}
        />
      )}
    </div>
  );
}

function CalendarView({
  currentMonth,
  jamDay,
  events,
  people,
  onOpenEvent,
  onChangeMonth,
  onSetMonth,
}: {
  currentMonth: string;
  jamDay: number;
  events: JamEvent[];
  people: Person[];
  onOpenEvent: (date: string) => void;
  onChangeMonth: (delta: number) => void;
  onSetMonth: (month: string) => void;
}) {
  const eventDates = getEventDates(currentMonth, jamDay);
  const today = getTodayDateStamp();
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [jumpYear, setJumpYear] = useState(currentMonth.slice(0, 4));
  const [jumpMonth, setJumpMonth] = useState(currentMonth.slice(5, 7));
  const currentYear = Number(currentMonth.slice(0, 4));
  const yearOptions = Array.from({ length: 9 }, (_, index) => currentYear - 2 + index);

  function openMonthPicker() {
    setJumpYear(currentMonth.slice(0, 4));
    setJumpMonth(currentMonth.slice(5, 7));
    setIsJumpOpen(true);
  }

  function applyJump() {
    onSetMonth(`${jumpYear}-${jumpMonth}`);
    setIsJumpOpen(false);
  }

  return (
    <section className="screen">
      <div className="month-header">
        <button className="icon-button" aria-label="Previous month" onClick={() => onChangeMonth(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h2>{formatMonth(currentMonth)}</h2>
        <span className="month-actions">
          <button className="ghost-button compact-action" onClick={openMonthPicker}>
            Jump
          </button>
          <button className="icon-button" aria-label="Next month" onClick={() => onChangeMonth(1)}>
            <ChevronRight size={20} />
          </button>
        </span>
      </div>

      <div className="event-list">
        {eventDates.map((date) => {
          const event = events.find((candidate) => candidate.id === date);
          const isSaved = Boolean(event);
          const isPast = date < today;
          const songCount = event?.guests.reduce((total, guest) => total + guest.songs.length, 0) || 0;
          const bandMembers = event?.bandMemberIds.map((id) => getPerson(people, id)) || [];
          const status = getEventStatusMeta(event?.status);
          return (
            <button className={`event-card ${isSaved ? "is-active" : ""} ${isPast ? "is-past" : ""}`} key={date} onClick={() => onOpenEvent(date)}>
              <span>
                <strong>{formatEventDate(date)}</strong>
                <small>{isPast ? "Past event" : `${getWeekdayLabel(jamDay)} Jam Night`}</small>
              </span>
              {isSaved ? (
                <span className="event-card-meta">
                  <span className={`pill status-pill status-${status.id}`}>{status.label}</span>
                  <small>{event?.guests.length || 0} guests · {songCount} songs</small>
                </span>
              ) : (
                <small>{isPast ? "No saved event" : "Tap to create"}</small>
              )}
              {isSaved && (
                <span className="calendar-summary">
                  <span>
                    {bandMembers.slice(0, 4).map((member) => (
                      <em key={member.id}>{member.name}</em>
                    ))}
                    {bandMembers.length > 4 && <em>+{bandMembers.length - 4}</em>}
                  </span>
                  <strong>{songCount} songs planned</strong>
                </span>
              )}
            </button>
          );
        })}
      </div>
      {isJumpOpen && (
        <div className="app-modal" role="dialog" aria-modal="true" aria-label="Jump to month">
          <div className="modal-card compact-modal month-jump-modal">
            <div className="detail-header modal-header">
              <button className="icon-button" onClick={() => setIsJumpOpen(false)} aria-label="Close jump to month">
                <ArrowLeft size={20} />
              </button>
              <span>
                <h2>Jump To Month</h2>
                <small>Choose where the Dates screen should go</small>
              </span>
            </div>
            <div className="field-row month-jump-fields">
              <label>
                Month
                <select value={jumpMonth} onChange={(event) => setJumpMonth(event.target.value)}>
                  {monthNames.map((month, index) => {
                    const value = String(index + 1).padStart(2, "0");
                    return (
                      <option value={value} key={value}>
                        {month}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label>
                Year
                <select value={jumpYear} onChange={(event) => setJumpYear(event.target.value)}>
                  {yearOptions.map((year) => (
                    <option value={year} key={year}>
                      {year}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <button className="primary-button" onClick={applyJump}>
              <Check size={16} />
              Go to {monthNames[Number(jumpMonth) - 1]} {jumpYear}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function EventDetail({
  event,
  people,
  onBack,
  onMoveGuest,
  onEditGuest,
  onUpdateStatus,
  onUpdateNotes,
  onUpdateBandLineup,
  onAddEventGuest,
  onCreateAndAddEventGuest,
  onRemoveEventGuest,
  copiedEvent,
  onCopyEvent,
  onPasteEvent,
  onResetEvent,
  saveStatus,
  lastSavedAt,
  syncMode,
  syncNotice,
  onSaveNow,
  canEdit,
  onRequestUnlock,
}: {
  event: JamEvent;
  people: Person[];
  onBack: () => void;
  onMoveGuest: (guestId: string, direction: -1 | 1) => void;
  onEditGuest: (guestId: string) => void;
  onUpdateStatus: (status: Exclude<EventStatus, "saved">) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateBandLineup: (memberIds: string[]) => void;
  onAddEventGuest: (personIds: string[]) => void;
  onCreateAndAddEventGuest: (name: string) => void;
  onRemoveEventGuest: (guestId: string) => void;
  copiedEvent: JamEvent | null;
  onCopyEvent: () => void;
  onPasteEvent: () => void;
  onResetEvent: () => void;
  saveStatus: SaveStatus;
  lastSavedAt: string;
  syncMode: "local" | "convex";
  syncNotice: string;
  onSaveNow: () => void;
  canEdit: boolean;
  onRequestUnlock: () => void;
}) {
  const [isEditingBand, setIsEditingBand] = useState(false);
  const [isPdfOpen, setIsPdfOpen] = useState(false);
  const [isAddingGuest, setIsAddingGuest] = useState(false);
  const sortedGuests = [...event.guests].sort((a, b) => a.order - b.order);
  const availableMembers = people.filter((person) => person.kind === "member");
  const currentStatus = normalizeEventStatus(event.status);

  return (
    <section className="screen event-detail">
      <div className="detail-header">
        <button className="icon-button" onClick={onBack} aria-label="Back to calendar">
          <ArrowLeft size={20} />
        </button>
        <span>
          <h2>{event.title}</h2>
          <small>
            {formatEventDate(event.date)} ·{" "}
            {syncNotice ||
              (saveStatus === "saving"
              ? "Saving..."
              : saveStatus === "error"
                ? "Save failed"
                : syncMode === "convex"
                  ? "Synced online"
                  : "Saved locally")}
            {lastSavedAt ? ` at ${lastSavedAt}` : ""}
          </small>
        </span>
        <button className="ghost-button compact-action" onClick={canEdit ? onSaveNow : onRequestUnlock}>
          {saveStatus === "saving" ? "Saving" : saveStatus === "saved" ? "Saved" : "Retry"}
        </button>
        <button className="primary-button compact" onClick={() => setIsPdfOpen(true)}>
          <Download size={16} />
          PDF
        </button>
      </div>

      <section className="panel status-panel">
        <h3>Event Status</h3>
        <div className="status-grid">
          {eventStatuses.map((status) => (
            <button
              className={`status-option status-${status.id} ${currentStatus === status.id ? "is-selected" : ""}`}
              key={status.id}
              onClick={() => (canEdit ? onUpdateStatus(status.id) : onRequestUnlock())}
            >
              {status.label}
            </button>
          ))}
        </div>
      </section>

      {canEdit && (
        <section className="panel copy-week-panel">
          <span>
            <h3>Copy / Paste Event</h3>
            <small>
              {copiedEvent
                ? `Copied: ${formatEventDate(copiedEvent.date)} · ${copiedEvent.guests.length} guests`
                : "Copy this full event, then open another date and paste it."}
            </small>
          </span>
          <div className="copy-actions">
            <button className="ghost-button compact-action" onClick={onCopyEvent}>
              <Copy size={16} />
              Copy
            </button>
            <button className="primary-button compact-action" disabled={!copiedEvent || copiedEvent.date === event.date} onClick={onPasteEvent}>
              <Clipboard size={16} />
              Paste
            </button>
            <button className="ghost-button compact-action danger-action" onClick={onResetEvent}>
              <Trash2 size={16} />
              Reset
            </button>
          </div>
        </section>
      )}

      <section className="panel">
        <div className="section-title">
          <h3>Band Lineup</h3>
          <button className="ghost-button" onClick={() => canEdit ? setIsEditingBand((current) => !current) : onRequestUnlock()}>
            {isEditingBand ? "Done" : canEdit ? "Edit" : "Unlock"}
          </button>
        </div>
        {isEditingBand && (
          <div className="lineup-editor">
            {availableMembers.map((member) => {
              const isChecked = event.bandMemberIds.includes(member.id);
              return (
                <label className="check-card" key={member.id}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={(changeEvent) => {
                      const nextIds = changeEvent.target.checked
                        ? [...event.bandMemberIds, member.id]
                        : event.bandMemberIds.filter((id) => id !== member.id);
                      onUpdateBandLineup(nextIds);
                    }}
                  />
                  <span>
                    <strong>{member.name}</strong>
                    <small>{member.instruments || "Band member"}</small>
                  </span>
                </label>
              );
            })}
          </div>
        )}
        <div className="chip-wrap">
          {event.bandMemberIds.map((id) => {
            const member = getPerson(people, id);
            return (
              <span className="chip" key={id}>
                <Guitar size={14} />
                {member.name}
                <small>{member.instruments}</small>
              </span>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <div className="section-title">
          <h3>Running Order</h3>
          <button className="primary-button compact" onClick={() => canEdit ? setIsAddingGuest(true) : onRequestUnlock()}>
            <Plus size={16} />
            Guest
          </button>
        </div>
        <p className="helper">Move guests or open a guest to reorder songs before PDF export.</p>

        <div className="running-order">
          {sortedGuests.map((guest, index) => {
            const person = getPerson(people, guest.personId);
            return (
              <article className="slot-card" key={guest.id}>
                <div className="slot-order">
                  <strong>{index + 1}</strong>
                  <button aria-label="Move guest up" disabled={!canEdit || index === 0} onClick={() => onMoveGuest(guest.id, -1)}>
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label="Move guest down"
                    disabled={!canEdit || index === sortedGuests.length - 1}
                    onClick={() => onMoveGuest(guest.id, 1)}
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button aria-label="Remove guest from event" disabled={!canEdit} onClick={() => onRemoveEventGuest(guest.id)}>
                    <Trash2 size={14} />
                  </button>
                </div>
                <div className="slot-body">
                  <button className="slot-name-button" onClick={() => onEditGuest(guest.id)}>
                    <span className="slot-name">
                      {person.name}
                      <small>{person.kind === "member" ? "Band member" : person.kind}</small>
                    </span>
                  </button>
                  <ol>
                    {guest.songs.map((song) => {
                      const hasNotes = Boolean(song.notes?.trim());
                      const youtubeUrl = song.youtubeUrl?.trim();
                      const safeYoutubeUrl = youtubeUrl && /^https?:\/\//i.test(youtubeUrl) ? youtubeUrl : youtubeUrl ? `https://${youtubeUrl}` : "";

                      return (
                        <li key={song.id}>
                          <div className="song-line">
                            {safeYoutubeUrl ? (
                              <a
                                className="song-line-main has-youtube"
                                href={safeYoutubeUrl}
                                target="_blank"
                                rel="noreferrer"
                                aria-label={`Open YouTube link for ${song.title || "song"}`}
                                title="Open YouTube link"
                              >
                                <span>{song.title || "Untitled song"}</span>
                                <small>{song.key || "-"} {song.artist ? `· ${song.artist}` : ""}</small>
                              </a>
                            ) : (
                              <button className="song-line-main" onClick={() => onEditGuest(guest.id)}>
                                <span>{song.title || "Untitled song"}</span>
                                <small>{song.key || "-"} {song.artist ? `· ${song.artist}` : ""}</small>
                              </button>
                            )}
                            {hasNotes && (
                              <span className="song-line-icons">
                                <span className="song-extra-badge" aria-label="Song has notes" title="Song has notes">
                                  <FileText size={13} />
                                </span>
                              </span>
                            )}
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="panel">
        <h3>Event Notes</h3>
        <textarea
          value={event.notes || ""}
          placeholder={canEdit ? "General notes for this week's event..." : "Unlock editing to add event notes."}
          disabled={!canEdit}
          onChange={(changeEvent) => onUpdateNotes(changeEvent.target.value)}
        />
      </section>

      {isPdfOpen && <PdfPreviewModal event={event} people={people} onClose={() => setIsPdfOpen(false)} />}
      {isAddingGuest && (
        <AddEventGuestModal
          event={event}
          people={people}
          onClose={() => setIsAddingGuest(false)}
          onAdd={(personIds) => {
            onAddEventGuest(personIds);
            setIsAddingGuest(false);
          }}
          onCreate={(name) => {
            onCreateAndAddEventGuest(name);
            setIsAddingGuest(false);
          }}
        />
      )}
    </section>
  );
}

function GuestSongEditor({
  guest,
  people,
  onBack,
  onMoveSong,
  onUpdateSong,
  onAddSong,
  onDeleteSong,
  songSuggestions,
  maxSongsPerGuest,
  canEdit,
  onRequestUnlock,
}: {
  guest: EventGuest;
  people: Person[];
  onBack: () => void;
  onMoveSong: (guestId: string, songId: string, direction: -1 | 1) => void;
  onUpdateSong: (guestId: string, songId: string, patch: Partial<Song>) => void;
  onAddSong: (guestId: string, songId?: string) => void;
  onDeleteSong: (guestId: string, songId: string) => void;
  songSuggestions: SongSuggestion[];
  maxSongsPerGuest: number;
  canEdit: boolean;
  onRequestUnlock: () => void;
}) {
  const person = getPerson(people, guest.personId);
  const [expandedSongId, setExpandedSongId] = useState(guest.songs[0]?.id || "");
  const hasReachedSongLimit = guest.songs.length >= maxSongsPerGuest;

  return (
    <section className="screen song-editor">
      <div className="detail-header sticky">
        <button className="icon-button" onClick={onBack} aria-label="Back to event">
          <ArrowLeft size={20} />
        </button>
        <span>
          <h2>{person.name}</h2>
          <small>Reorder and edit songs</small>
        </span>
        <button className="primary-button compact" onClick={onBack}>
          <Check size={16} />
          Done
        </button>
      </div>

      <div className="song-list">
        {guest.songs.map((song, index) => {
          const isExpanded = expandedSongId === song.id;
          return (
          <article className={`song-card ${isExpanded ? "is-expanded" : "is-collapsed"}`} key={song.id}>
            <button className="song-accordion-toggle" onClick={() => setExpandedSongId(isExpanded ? "" : song.id)}>
              <span>
                <strong>{song.title || "New song"}</strong>
                <small>
                  {song.artist || "Artist not set"}
                  {song.key ? ` · Key of ${song.key}` : ""}
                </small>
              </span>
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </button>
            <div className="song-order">
              <strong>Song {index + 1}</strong>
              <button aria-label="Move song up" disabled={!canEdit || index === 0} onClick={() => onMoveSong(guest.id, song.id, -1)}>
                <ArrowUp size={14} />
              </button>
              <button
                aria-label="Move song down"
                disabled={!canEdit || index === guest.songs.length - 1}
                onClick={() => onMoveSong(guest.id, song.id, 1)}
              >
                <ArrowDown size={14} />
              </button>
              <button aria-label="Delete song" disabled={!canEdit} onClick={() => onDeleteSong(guest.id, song.id)}>
                <Trash2 size={14} />
              </button>
            </div>
            {isExpanded && (
              <div className="song-fields">
                <SongTitleField
                  song={song}
                  suggestions={songSuggestions}
                  disabled={!canEdit}
                  autoFocus={isExpanded && !song.title.trim()}
                  onUpdate={(patch) => onUpdateSong(guest.id, song.id, patch)}
                />
                <div className="field-row">
                  <label>
                    Key
                    <select disabled={!canEdit} value={song.key || "-"} onChange={(event) => onUpdateSong(guest.id, song.id, { key: event.target.value === "-" ? "" : event.target.value })}>
                      {songKeys.map((key) => (
                        <option value={key} key={key}>
                          {key}
                        </option>
                      ))}
                    </select>
                  </label>
                  <ArtistField song={song} suggestions={songSuggestions} disabled={!canEdit} onUpdate={(patch) => onUpdateSong(guest.id, song.id, patch)} />
                </div>
                <label>
                  YouTube URL
                  <div className="url-input-row">
                    <input
                      type="url"
                      disabled={!canEdit}
                      value={song.youtubeUrl || ""}
                      onChange={(event) => onUpdateSong(guest.id, song.id, { youtubeUrl: event.target.value })}
                      placeholder="https://youtube.com/..."
                    />
                    {song.youtubeUrl && (
                      <a className="ghost-button compact-action" href={song.youtubeUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                </label>
                <label>
                  Chords / Lyrics URL
                  <div className="url-input-row">
                    <input
                      type="url"
                      disabled={!canEdit}
                      value={song.chordsUrl || ""}
                      onChange={(event) => onUpdateSong(guest.id, song.id, { chordsUrl: event.target.value })}
                      placeholder="https://tabs.ultimate-guitar.com/..."
                    />
                    {song.chordsUrl && (
                      <a className="ghost-button compact-action" href={song.chordsUrl} target="_blank" rel="noreferrer">
                        Open
                      </a>
                    )}
                  </div>
                </label>
                <label>
                  Notes
                  <input disabled={!canEdit} value={song.notes || ""} onChange={(event) => onUpdateSong(guest.id, song.id, { notes: event.target.value })} />
                </label>
                <div className="rating-field">
                  <span>Performance Rating</span>
                  <div className="rating-buttons" aria-label={`Rate ${song.title || "song"}`}>
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <button
                        type="button"
                        key={rating}
                        disabled={!canEdit}
                        className={Number(song.rating || 0) >= rating ? "is-selected" : ""}
                        aria-label={`${rating} star rating`}
                        onClick={() => onUpdateSong(guest.id, song.id, { rating: song.rating === rating ? undefined : rating })}
                      >
                        <Star size={18} />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </article>
          );
        })}
      </div>

      <button
        className="add-wide"
        disabled={canEdit && hasReachedSongLimit}
        onClick={() => {
          const songId = `${guest.id}-${Date.now()}`;
          if (!canEdit) {
            onRequestUnlock();
            return;
          }
          if (hasReachedSongLimit) return;
          onAddSong(guest.id, songId);
          setExpandedSongId(songId);
        }}
      >
        <Plus size={18} />
        {hasReachedSongLimit ? `Song limit reached (${maxSongsPerGuest})` : "Add song"}
      </button>
      {hasReachedSongLimit && <p className="helper">This guest already has the current maximum of {maxSongsPerGuest} songs.</p>}
    </section>
  );
}

function AddEventGuestModal({
  event,
  people,
  onClose,
  onAdd,
  onCreate,
}: {
  event: JamEvent;
  people: Person[];
  onClose: () => void;
  onAdd: (personIds: string[]) => void;
  onCreate: (name: string) => void;
}) {
  const [query, setQuery] = useState("");
  const [newGuestName, setNewGuestName] = useState("");
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [kindFilter, setKindFilter] = useState<"all" | Person["kind"]>("all");
  const bookedPersonIds = new Set(event.guests.map((guest) => guest.personId));
  const filters: { id: "all" | Person["kind"]; label: string }[] = [
    { id: "all", label: "All" },
    { id: "member", label: "Regulars" },
    { id: "solo", label: "Solo" },
    { id: "band", label: "Band" },
    { id: "showcase", label: "Showcase" },
  ];
  const matches = people
    .filter((person) => kindFilter === "all" || person.kind === kindFilter)
    .filter((person) => person.name.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const aBooked = bookedPersonIds.has(a.id);
      const bBooked = bookedPersonIds.has(b.id);
      if (aBooked !== bBooked) return aBooked ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label="Add guest">
      <div className="modal-card">
        <div className="detail-header modal-header">
          <button className="icon-button" onClick={onClose} aria-label="Close add guest">
            <ArrowLeft size={20} />
          </button>
          <span>
            <h2>Add Guest</h2>
            <small>Select one or more people, then update the event</small>
          </span>
        </div>

        <div className="quick-add">
          <label>
            Quick add new guest
            <input value={newGuestName} onChange={(event) => setNewGuestName(event.target.value)} placeholder="Guest name" />
          </label>
          <button className="primary-button" onClick={() => onCreate(newGuestName)}>
            <Plus size={16} />
            Add to event
          </button>
        </div>

        <label className="search-box">
          <Search size={18} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search guests or members..." />
        </label>

        <div className="filter-chips" aria-label="Filter guests">
          {filters.map((filter) => (
            <button className={kindFilter === filter.id ? "is-selected" : ""} key={filter.id} onClick={() => setKindFilter(filter.id)}>
              {filter.label}
            </button>
          ))}
        </div>

        <div className="modal-list">
          {matches.map((person) => {
            const isBooked = bookedPersonIds.has(person.id);
            const isSelected = selectedPersonIds.includes(person.id);
            return (
              <button
                className={`picker-row ${isBooked ? "is-booked" : ""} ${isSelected ? "is-selected" : ""}`}
                key={person.id}
                disabled={isBooked}
                onClick={() =>
                  setSelectedPersonIds((current) =>
                    current.includes(person.id) ? current.filter((id) => id !== person.id) : [...current, person.id],
                  )
                }
              >
                <span className="avatar">{person.kind === "member" ? <Guitar size={19} /> : <Mic2 size={19} />}</span>
                <span>
                  <strong>{person.name}</strong>
                  <small>{person.kind === "member" ? person.instruments || "Band member" : person.kind}</small>
                </span>
                {isBooked ? <span className="booked-badge">Added</span> : isSelected ? <Check size={18} /> : <Plus size={18} />}
              </button>
            );
          })}
          {matches.length === 0 && <p className="helper">No matching guests or members.</p>}
        </div>

        <button className="primary-button" disabled={selectedPersonIds.length === 0} onClick={() => onAdd(selectedPersonIds)}>
          <Check size={16} />
          Update event{selectedPersonIds.length ? ` (${selectedPersonIds.length})` : ""}
        </button>
      </div>
    </div>
  );
}

function UnlockModal({
  onClose,
  onUnlock,
}: {
  onClose: () => void;
  onUnlock: (pin: string) => Promise<boolean>;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  async function submit() {
    if (!pin.trim()) return;
    setIsChecking(true);
    setError("");
    const isValid = await onUnlock(pin);
    setIsChecking(false);
    if (!isValid) setError("That PIN did not match.");
  }

  return (
    <div className="app-modal" role="dialog" aria-modal="true" aria-label="Unlock editing">
      <div className="modal-card compact-modal">
        <div className="detail-header modal-header">
          <button className="icon-button" onClick={onClose} aria-label="Close unlock">
            <ArrowLeft size={20} />
          </button>
          <span>
            <h2>Unlock Editing</h2>
            <small>View-only until the band PIN is entered</small>
          </span>
        </div>

        <label>
          Band PIN
          <input
            inputMode="numeric"
            type="password"
            value={pin}
            onChange={(event) => setPin(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void submit();
            }}
            placeholder="Enter PIN"
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="primary-button" disabled={isChecking || !pin.trim()} onClick={() => void submit()}>
          <Unlock size={16} />
          {isChecking ? "Checking..." : "Unlock"}
        </button>
      </div>
    </div>
  );
}

function SongTitleField({
  song,
  suggestions,
  disabled,
  autoFocus,
  onUpdate,
}: {
  song: Song;
  suggestions: SongSuggestion[];
  disabled?: boolean;
  autoFocus?: boolean;
  onUpdate: (patch: Partial<Song>) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const matches = suggestions
    .filter((suggestion) => suggestion.title.toLowerCase().includes(song.title.trim().toLowerCase()))
    .filter((suggestion) => suggestion.title !== song.title || suggestion.artist !== song.artist)
    .slice(0, 4);

  React.useEffect(() => {
    if (!autoFocus || disabled) return;
    inputRef.current?.focus();
  }, [autoFocus, disabled]);

  return (
    <label className="suggest-field">
      Song title
      <input ref={inputRef} disabled={disabled} value={song.title} onChange={(event) => onUpdate({ title: event.target.value })} placeholder="Start typing a song..." />
      {!disabled && song.title.trim() && matches.length > 0 && (
        <span className="suggestions">
          {matches.map((suggestion) => (
            <button
              type="button"
              key={`${suggestion.title}-${suggestion.artist || ""}`}
              onClick={() =>
                onUpdate({
                  title: suggestion.title,
                  artist: suggestion.artist || "",
                  key: suggestion.key || song.key || "",
                })
              }
            >
              <strong>{suggestion.title}</strong>
              <small>{suggestion.artist || "Unknown artist"}{suggestion.key ? ` · ${suggestion.key}` : ""}</small>
            </button>
          ))}
        </span>
      )}
    </label>
  );
}

function ArtistField({
  song,
  suggestions,
  disabled,
  onUpdate,
}: {
  song: Song;
  suggestions: SongSuggestion[];
  disabled?: boolean;
  onUpdate: (patch: Partial<Song>) => void;
}) {
  const query = (song.artist || "").trim().toLowerCase();
  const artists = [...new Set(suggestions.map((suggestion) => suggestion.artist).filter(Boolean) as string[])]
    .filter((artist) => query && artist.toLowerCase().includes(query) && artist !== song.artist)
    .slice(0, 4);

  return (
    <label className="suggest-field">
      Artist
      <input disabled={disabled} value={song.artist || ""} onChange={(event) => onUpdate({ artist: event.target.value })} placeholder="Artist" />
      {!disabled && artists.length > 0 && (
        <span className="suggestions compact-suggestions">
          {artists.map((artist) => (
            <button type="button" key={artist} onClick={() => onUpdate({ artist })}>
              <strong>{artist}</strong>
            </button>
          ))}
        </span>
      )}
    </label>
  );
}

function PdfPreviewModal({ event, people, onClose }: { event: JamEvent; people: Person[]; onClose: () => void }) {
  const sortedGuests = [...event.guests].sort((a, b) => a.order - b.order);
  const bandMembers = event.bandMemberIds.map((id) => getPerson(people, id));
  const totalSongs = sortedGuests.reduce((total, guest) => total + guest.songs.length, 0);

  return (
    <div className="pdf-modal" role="dialog" aria-modal="true" aria-label="PDF preview">
      <div className="pdf-toolbar">
        <button className="ghost-button" onClick={onClose}>Close</button>
        <button className="ghost-button compact" onClick={() => shareRunningOrder(event, people)}>
          <Share2 size={16} />
          Share
        </button>
        <button className="primary-button compact" onClick={() => printPdfDocument(event, people)}>
          <Download size={16} />
          Print / Save PDF
        </button>
      </div>

      <div className="pdf-scroll">
        <article className="pdf-document">
          <header className="pdf-header">
            <h1>The Feathers Inn</h1>
            <p>Tuesday Jam Night</p>
            <em>{formatEventDate(event.date)}</em>
          </header>

          <section className="pdf-section">
            <h2>Band</h2>
            <div className="pdf-band-list">
              {bandMembers.map((member) => (
                <React.Fragment key={member.id}>
                  <strong>{member.name}</strong>
                  <span>{member.instruments || ""}</span>
                </React.Fragment>
              ))}
            </div>
          </section>

          <section className="pdf-section pdf-guests">
            <h2>Guests</h2>
            {sortedGuests.map((guest, guestIndex) => {
              const person = getPerson(people, guest.personId);
              return (
                <div className="pdf-guest" key={guest.id}>
                  <div className="pdf-guest-heading">
                    <h3>{guestIndex + 1}. {person.name}</h3>
                    {person.kind === "member" && <em>[Band Member]</em>}
                  </div>
                  <div className="pdf-song-list">
                    {guest.songs.map((song, songIndex) => (
                      <p key={song.id}>
                        <span>Song {songIndex + 1}:</span>
                        {song.title}
                        {song.key ? <> - Key of {song.key}</> : null}
                        {song.artist ? <> ({song.artist})</> : null}
                      </p>
                    ))}
                  </div>
                </div>
              );
            })}
          </section>

          <footer className="pdf-footer">
            <span>Generated: {formatEventDate(event.date)}</span>
            <span>The Feathers Inn - Jam Night Manager</span>
            <span>{sortedGuests.length} guests · {totalSongs} songs</span>
          </footer>
        </article>
      </div>
    </div>
  );
}

function getRunningOrderText(event: JamEvent, people: Person[]) {
  const sortedGuests = [...event.guests].sort((a, b) => a.order - b.order);
  const bandMembers = event.bandMemberIds.map((id) => getPerson(people, id));
  const totalSongs = sortedGuests.reduce((total, guest) => total + guest.songs.length, 0);
  const status = getEventStatusMeta(event.status);
  const appUrl = `${window.location.origin}/?v=latest`;
  const guestLines = sortedGuests
    .map((guest, guestIndex) => {
      const person = getPerson(people, guest.personId);
      const songs = guest.songs
        .map((song, songIndex) => {
          const key = song.key ? ` - Key of ${song.key}` : "";
          const artist = song.artist ? ` (${song.artist})` : "";
          const youtube = song.youtubeUrl?.trim() ? `\n     YouTube: ${song.youtubeUrl.trim()}` : "";
          const chords = song.chordsUrl?.trim() ? `\n     Chords/Lyrics: ${song.chordsUrl.trim()}` : "";
          const notes = song.notes?.trim() ? `\n     Notes: ${song.notes.trim()}` : "";
          return `  ${songIndex + 1}. ${song.title || "Untitled song"}${key}${artist}${youtube}${chords}${notes}`;
        })
        .join("\n");
      const guestNotes = guest.notes?.trim() ? `\n  Guest notes: ${guest.notes.trim()}` : "";
      return `${guestIndex + 1}. ${person.name}\n${songs || "  No songs added yet."}${guestNotes}`;
    })
    .join("\n\n");

  return [
    "The Feathers Inn - Jam Night Manager",
    formatEventDate(event.date),
    `Status: ${status.label}`,
    `${sortedGuests.length} guests · ${totalSongs} songs`,
    `Open the app: ${appUrl}`,
    "",
    "Band:",
    bandMembers.length ? bandMembers.map((member) => `- ${member.name}${member.instruments ? ` - ${member.instruments}` : ""}`).join("\n") : "No band lineup set.",
    "",
    "Running order:",
    guestLines || "No guests booked yet.",
    event.notes?.trim() ? `\nEvent notes:\n${event.notes.trim()}` : "",
    "",
    "Shared from the Feathers Jam Night app.",
  ].join("\n");
}

async function shareRunningOrder(event: JamEvent, people: Person[]) {
  const title = `Feathers Jam Night - ${formatEventDate(event.date)}`;
  const text = getRunningOrderText(event, people);

  if (navigator.share) {
    try {
      await navigator.share({ title, text });
      return;
    } catch {
      // Fall back to WhatsApp link if native sharing is cancelled or unavailable.
    }
  }

  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
}

function printPdfDocument(event: JamEvent, people: Person[]) {
  const sortedGuests = [...event.guests].sort((a, b) => a.order - b.order);
  const bandMembers = event.bandMemberIds.map((id) => getPerson(people, id));
  const totalSongs = sortedGuests.reduce((total, guest) => total + guest.songs.length, 0);
  const bandRows = bandMembers
    .map((member) => `<strong>${escapeHtml(member.name)}</strong><span>${escapeHtml(member.instruments || "")}</span>`)
    .join("");
  const guestRows = sortedGuests
    .map((guest, guestIndex) => {
      const person = getPerson(people, guest.personId);
      const badge = person.kind === "member" ? "<em>[Band Member]</em>" : "";
      const songs = guest.songs
        .map((song, songIndex) => {
          const key = song.key ? ` - Key of ${escapeHtml(song.key)}` : "";
          const artist = song.artist ? ` (${escapeHtml(song.artist)})` : "";
          return `<p><span>Song ${songIndex + 1}:</span> ${escapeHtml(song.title || "Untitled song")}${key}${artist}</p>`;
        })
        .join("");

      return `
        <section class="guest">
          <div class="guest-heading">
            <h3>${guestIndex + 1}. ${escapeHtml(person.name)}</h3>
            ${badge}
          </div>
          <div class="songs">${songs}</div>
        </section>
      `;
    })
    .join("");

  const iframe = document.createElement("iframe");
  iframe.title = "Jam night PDF print frame";
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const printWindow = iframe.contentWindow;
  const doc = printWindow?.document;
  if (!printWindow || !doc) {
    iframe.remove();
    return;
  }

  doc.open();
  doc.write(`
    <!doctype html>
    <html>
      <head>
        <title>The Feathers Inn - ${escapeHtml(event.title)}</title>
        <style>
          @page { size: A4; margin: 12mm; }
          * { box-sizing: border-box; }
          body { margin: 0; color: #222; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 14px; }
          header { padding: 22px 32px 16px; color: white; background: linear-gradient(180deg, #7d4406, #bd690c); text-align: center; }
          header h1 { margin: 0; color: #fff; font-size: 28px; font-weight: 800; }
          header p { margin: 8px 0 0; font-size: 15px; }
          header em { display: block; margin-top: 18px; font-size: 13px; }
          main { width: 86%; margin: 22px auto 0; }
          h2 { margin: 0 0 10px; padding: 8px 10px; color: #111; background: #eee; font-size: 17px; text-transform: uppercase; }
          .band-grid { display: grid; grid-template-columns: 220px 1fr; gap: 9px 18px; margin-bottom: 34px; }
          .rule { border-top: 2px solid #bd690c; padding-top: 16px; }
          .guest { break-inside: avoid; padding: 8px 0 20px; border-bottom: 1px solid #ccc; }
          .guest-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 14px; }
          .guest h3 { margin: 0 0 10px; color: #111; font-size: 16px; }
          .guest em { color: #514aa0; font-size: 12px; }
          .songs { display: grid; gap: 7px; padding-left: 24px; }
          .songs p { margin: 0; }
          .songs span { display: inline-block; min-width: 62px; color: #222; }
          footer { position: fixed; right: 12mm; bottom: 7mm; left: 12mm; display: flex; justify-content: space-between; gap: 12px; padding-top: 10px; border-top: 1px solid #ddd; color: #555; font-size: 11px; }
        </style>
      </head>
      <body>
        <header>
          <h1>The Feathers Inn</h1>
          <p>${escapeHtml(event.title)}</p>
          <em>${escapeHtml(formatEventDate(event.date))}</em>
        </header>
        <main>
          <section>
            <h2>Band</h2>
            <div class="band-grid">${bandRows}</div>
          </section>
          <section class="rule">
            <h2>Guests</h2>
            ${guestRows}
          </section>
        </main>
        <footer>
          <span>Generated: ${escapeHtml(formatEventDate(event.date))}</span>
          <span>The Feathers Inn - Jam Night Manager</span>
          <span>${sortedGuests.length} guests · ${totalSongs} songs</span>
        </footer>
      </body>
    </html>
  `);
  doc.close();

  window.setTimeout(() => {
    printWindow.focus();
    printWindow.print();
    window.setTimeout(() => iframe.remove(), 1000);
  }, 250);
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[char];
  });
}

function PeopleView({
  title,
  defaultKind,
  search,
  setSearch,
  people,
  onSave,
  onDelete,
  canEdit,
  onRequestUnlock,
}: {
  title: string;
  defaultKind: Person["kind"];
  search: string;
  setSearch: (value: string) => void;
  people: Person[];
  onSave: (person: Person) => void;
  onDelete: (personId: string) => void;
  canEdit: boolean;
  onRequestUnlock: () => void;
}) {
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);

  if (editingPerson) {
    return <PersonEditor person={editingPerson} onCancel={() => setEditingPerson(null)} onSave={onSave} />;
  }

  return (
    <section className="screen">
      <div className="section-title">
        <h2>{title}</h2>
        <button
          className="primary-button"
          onClick={() =>
            canEdit ? setEditingPerson({
              id: `person-${Date.now()}`,
              name: "",
              kind: defaultKind,
              instruments: defaultKind === "member" ? "" : undefined,
              active: defaultKind === "member" ? true : undefined,
              singer: false,
            }) : onRequestUnlock()
          }
        >
          <Plus size={16} />
          Add
        </button>
      </div>
      <label className="search-box">
        <Search size={18} />
        <input placeholder={`Search ${title.toLowerCase()}...`} value={search} onChange={(event) => setSearch(event.target.value)} />
      </label>
      <div className="person-list">
        {people.map((person) => (
          <article className="person-card" key={person.id}>
            <span className="avatar">{person.kind === "member" ? <Guitar size={20} /> : <Mic2 size={20} />}</span>
            <span className="person-main">
              <button className="person-summary" onClick={() => canEdit ? setEditingPerson(person) : undefined}>
                <strong>{person.name}</strong>
                <small>{person.instruments || person.notes || "No notes"}</small>
                <em>{person.kind === "member" ? "Band member" : person.kind}</em>
              </button>
              {(person.phone || person.email) && (
                <span className="contact-links">
                  {person.phone && (
                    <a href={`tel:${person.phone.replace(/\s+/g, "")}`}>
                      <Phone size={14} />
                      {person.phone}
                    </a>
                  )}
                  {person.email && (
                    <a href={`mailto:${person.email}`}>
                      <Mail size={14} />
                      {person.email}
                    </a>
                  )}
                </span>
              )}
            </span>
            {canEdit ? (
              <button className="icon-button danger" aria-label={`Delete ${person.name}`} onClick={() => onDelete(person.id)}>
                <Trash2 size={18} />
              </button>
            ) : (
              <button className="icon-button" aria-label="Unlock editing" onClick={onRequestUnlock}>
                <Lock size={18} />
              </button>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

function PersonEditor({
  person,
  onCancel,
  onSave,
}: {
  person: Person;
  onCancel: () => void;
  onSave: (person: Person) => void;
}) {
  const [draft, setDraft] = useState(person);
  const isMember = draft.kind === "member";

  function update(patch: Partial<Person>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  return (
    <section className="screen editor-screen">
      <div className="detail-header">
        <button className="icon-button" onClick={onCancel} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <span>
          <h2>{person.name ? `Edit ${person.name}` : "Add Person"}</h2>
          <small>{isMember ? "Band member details" : "Guest details"}</small>
        </span>
        <button
          className="primary-button compact"
          onClick={() => {
            if (!draft.name.trim()) return;
            onSave(normalizePerson(draft));
            onCancel();
          }}
        >
          <Check size={16} />
          Save
        </button>
      </div>

      <section className="panel">
        <label>
          Name
          <input value={draft.name} onChange={(event) => update({ name: event.target.value })} placeholder="Full name" />
        </label>

        <label>
          Type
          <select value={draft.kind} onChange={(event) => update({ kind: event.target.value as Person["kind"] })}>
            <option value="member">Band member</option>
            <option value="solo">Solo guest</option>
            <option value="band">Guest band</option>
            <option value="showcase">Showcase band</option>
          </select>
        </label>

        {isMember && (
          <label>
            Instrument(s)
            <input
              value={draft.instruments || ""}
              onChange={(event) => update({ instruments: event.target.value })}
              placeholder="e.g. Guitar, vocals"
            />
          </label>
        )}

        <div className="contact-row">
          <label>
            Phone
            <input
              type="tel"
              value={draft.phone || ""}
              onChange={(event) => update({ phone: event.target.value })}
              placeholder="Optional"
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={draft.email || ""}
              onChange={(event) => update({ email: event.target.value })}
              placeholder="Optional"
            />
          </label>
        </div>

        <label>
          Notes
          <textarea value={draft.notes || ""} onChange={(event) => update({ notes: event.target.value })} placeholder="Optional notes..." />
        </label>

        {isMember && (
          <div className="toggle-list">
            <label className="toggle-row">
              <input type="checkbox" checked={Boolean(draft.singer)} onChange={(event) => update({ singer: event.target.checked })} />
              Singer
            </label>
            <label className="toggle-row">
              <input type="checkbox" checked={draft.active !== false} onChange={(event) => update({ active: event.target.checked })} />
              Active member
            </label>
          </div>
        )}
      </section>
    </section>
  );
}

function HistoryView({
  events,
  people,
  activityLog,
  chartOrder,
  canEdit,
  onMoveChartSong,
}: {
  events: JamEvent[];
  people: Person[];
  activityLog: ActivityEntry[];
  chartOrder: string[];
  canEdit: boolean;
  onMoveChartSong: (songKey: string, visibleSongKeys: string[], direction: -1 | 1) => void;
}) {
  const [historyTab, setHistoryTab] = useState<"guest" | "event" | "songs" | "top" | "activity">("guest");
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [expandedSongKey, setExpandedSongKey] = useState<string | null>(null);
  const sortedEvents = [...events].sort((a, b) => b.date.localeCompare(a.date));
  const totalSongs = sortedEvents.reduce(
    (sum, event) => sum + event.guests.reduce((guestSum, guest) => guestSum + guest.songs.length, 0),
    0,
  );
  const uniqueGuests = new Set(sortedEvents.flatMap((event) => event.guests.map((guest) => guest.personId))).size;
  const guestStats = [...sortedEvents.reduce((stats, event) => {
    event.guests.forEach((guest) => {
      const person = getPerson(people, guest.personId);
      const current = stats.get(guest.personId) || {
        id: guest.personId,
        name: person.name,
        eventCount: 0,
        songCount: 0,
        lastDate: event.date,
        songs: new Set<string>(),
      };
      current.eventCount += 1;
      current.songCount += guest.songs.length;
      current.lastDate = current.lastDate > event.date ? current.lastDate : event.date;
      guest.songs.forEach((song) => {
        if (song.title.trim()) current.songs.add(song.title.trim());
      });
      stats.set(guest.personId, current);
    });
    return stats;
  }, new Map<string, { id: string; name: string; eventCount: number; songCount: number; lastDate: string; songs: Set<string> }>()).values()].sort(
    (a, b) => b.eventCount - a.eventCount || b.songCount - a.songCount || a.name.localeCompare(b.name),
  );
  const songStats = [...sortedEvents.reduce((stats, event) => {
    event.guests.forEach((guest) => {
      const person = getPerson(people, guest.personId);
      guest.songs.forEach((song) => {
        const title = song.title.trim() || "Untitled song";
        const key = `${title.toLowerCase()}|${(song.artist || "").toLowerCase()}`;
        const current = stats.get(key) || {
          title,
          artist: song.artist || "",
          count: 0,
          performers: new Set<string>(),
          dates: new Set<string>(),
          keys: new Set<string>(),
          plays: [] as { date: string; performer: string; key: string }[],
        };
        current.count += 1;
        current.performers.add(person.name);
        current.dates.add(event.date);
        current.plays.push({
          date: event.date,
          performer: person.name,
          key: song.key || "",
        });
        if (song.key) current.keys.add(song.key);
        stats.set(key, current);
      });
    });
    return stats;
  }, new Map<string, { title: string; artist: string; count: number; performers: Set<string>; dates: Set<string>; keys: Set<string>; plays: { date: string; performer: string; key: string }[] }>()).values()].sort(
    (a, b) => b.count - a.count || a.title.localeCompare(b.title),
  );
  const topSongs = [...sortedEvents.reduce((stats, event) => {
    event.guests.forEach((guest) => {
      const person = getPerson(people, guest.personId);
      guest.songs.forEach((song) => {
        if (!song.rating) return;
        const title = song.title.trim() || "Untitled song";
        const key = getSongChartKey(title, song.artist);
        const current = stats.get(key) || {
          key,
          title,
          artist: song.artist || "",
          ratingTotal: 0,
          ratingCount: 0,
          plays: [] as { date: string; performer: string; key: string; rating: number }[],
        };
        current.ratingTotal += song.rating;
        current.ratingCount += 1;
        current.plays.push({
          date: event.date,
          performer: person.name,
          key: song.key || "",
          rating: song.rating,
        });
        stats.set(key, current);
      });
    });
    return stats;
  }, new Map<string, { key: string; title: string; artist: string; ratingTotal: number; ratingCount: number; plays: { date: string; performer: string; key: string; rating: number }[] }>()).values()]
    .map((song) => ({
      ...song,
      averageRating: song.ratingTotal / song.ratingCount,
      latestPlay: [...song.plays].sort((a, b) => b.date.localeCompare(a.date))[0],
    }))
    .sort((a, b) => {
      const aOrder = chartOrder.indexOf(a.key);
      const bOrder = chartOrder.indexOf(b.key);
      if (aOrder !== -1 || bOrder !== -1) return (aOrder === -1 ? Number.MAX_SAFE_INTEGER : aOrder) - (bOrder === -1 ? Number.MAX_SAFE_INTEGER : bOrder);
      return b.averageRating - a.averageRating || b.ratingCount - a.ratingCount || a.title.localeCompare(b.title);
    })
    .slice(0, 10);
  const topSongKeys = topSongs.map((song) => song.key);

  return (
    <section className="screen">
      <h2>History & Reports</h2>
      <div className="tabs">
        <button className={historyTab === "guest" ? "is-selected" : ""} onClick={() => setHistoryTab("guest")}>Guest</button>
        <button className={historyTab === "event" ? "is-selected" : ""} onClick={() => setHistoryTab("event")}>Event</button>
        <button className={historyTab === "songs" ? "is-selected" : ""} onClick={() => setHistoryTab("songs")}>Song</button>
        <button className={historyTab === "top" ? "is-selected" : ""} onClick={() => setHistoryTab("top")}>Chart</button>
        <button className={historyTab === "activity" ? "is-selected" : ""} onClick={() => setHistoryTab("activity")}>Activity</button>
      </div>
      <div className="stats-grid">
        <article>
          <strong>{sortedEvents.length}</strong>
          <small>Events</small>
        </article>
        <article>
          <strong>{totalSongs}</strong>
          <small>Song slots</small>
        </article>
        <article>
          <strong>{uniqueGuests}</strong>
          <small>Guests</small>
        </article>
      </div>

      {historyTab === "guest" && (
        <div className="history-list">
          {guestStats.map((guest) => (
            <article className="history-card" key={guest.id}>
              <strong>{guest.name}</strong>
              <small>{guest.eventCount} events · {guest.songCount} songs · last played {formatEventDate(guest.lastDate)}</small>
              <span>{[...guest.songs].slice(0, 8).join(", ") || "No songs listed"}</span>
            </article>
          ))}
          {guestStats.length === 0 && <p className="helper">No guest history yet.</p>}
        </div>
      )}

      {historyTab === "event" && (
        <div className="history-list">
          {sortedEvents.map((event) => {
            const eventSongCount = event.guests.reduce((sum, guest) => sum + guest.songs.length, 0);
            const isExpanded = expandedEventId === event.id;
            return (
              <article className="history-card" key={event.id}>
                <button className="history-event-button" onClick={() => setExpandedEventId(isExpanded ? null : event.id)}>
                  <span>
                    <strong>{formatEventDate(event.date)}</strong>
                    <small>{event.guests.length} guests · {eventSongCount} songs · {event.bandMemberIds.length} band members</small>
                  </span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {isExpanded && (
                  <div className="history-event-detail">
                    {[...event.guests].sort((a, b) => a.order - b.order).map((guest, index) => {
                      const person = getPerson(people, guest.personId);
                      return (
                        <div className="history-performance" key={guest.id}>
                          <strong>{index + 1}. {person.name}</strong>
                          <span>
                            {guest.songs.map((song) => {
                              const key = song.key ? ` - ${song.key}` : "";
                              const artist = song.artist ? ` (${song.artist})` : "";
                              return `${song.title || "Untitled song"}${key}${artist}`;
                            }).join(", ") || "No songs listed"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}

      {historyTab === "songs" && (
        <div className="song-stats-list">
          {songStats.map((song, index) => {
            const songKey = `${song.title}-${song.artist}`;
            const isExpanded = expandedSongKey === songKey;
            return (
              <article className={`song-stat-row ${isExpanded ? "is-expanded" : ""}`} key={songKey}>
                <button className="song-stat-summary" onClick={() => setExpandedSongKey(isExpanded ? null : songKey)}>
                  <strong className="song-rank">{index + 1}</strong>
                  <span className="song-stat-main">
                    <strong>{song.title}</strong>
                    <small>{song.artist || "Unknown artist"}</small>
                    <em>{song.keys.size ? `Keys: ${[...song.keys].join(", ")}` : "Keys: -"}</em>
                  </span>
                  <span className="song-count-badge">{song.count}x</span>
                  {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                {isExpanded && (
                  <div className="song-play-list">
                    {[...song.plays].sort((a, b) => b.date.localeCompare(a.date)).map((play, playIndex) => (
                      <div className="song-play-row" key={`${play.date}-${play.performer}-${playIndex}`}>
                        <strong>{formatEventDate(play.date)}</strong>
                        <span>{play.performer}</span>
                        <em>{play.key || "-"}</em>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          {songStats.length === 0 && <p className="helper">No song history yet.</p>}
        </div>
      )}

      {historyTab === "top" && (
        <div className="song-stats-list top-song-list">
          {topSongs.map((song, index) => {
            const songKey = `top-${song.key}`;
            const isExpanded = expandedSongKey === songKey;
            return (
              <article className={`song-stat-row ${isExpanded ? "is-expanded" : ""}`} key={songKey}>
                <div className="song-stat-summary top-song-summary">
                  <strong className="song-rank">{index + 1}</strong>
                  <button className="song-stat-main top-song-open" onClick={() => setExpandedSongKey(isExpanded ? null : songKey)}>
                    <strong>{song.title}</strong>
                    <small>{song.artist || "Unknown artist"}</small>
                    <em>
                      Last: {song.latestPlay?.performer || "-"} · {song.latestPlay ? formatEventDate(song.latestPlay.date) : "-"}
                    </em>
                  </button>
                  <span className="chart-order-actions">
                    <button type="button" aria-label="Move chart song up" disabled={!canEdit || index === 0} onClick={() => onMoveChartSong(song.key, topSongKeys, -1)}>
                      <ArrowUp size={13} />
                    </button>
                    <button type="button" aria-label="Move chart song down" disabled={!canEdit || index === topSongs.length - 1} onClick={() => onMoveChartSong(song.key, topSongKeys, 1)}>
                      <ArrowDown size={13} />
                    </button>
                  </span>
                  <span className="rating-score">
                    <Star size={16} />
                    {song.averageRating.toFixed(1)}
                    <small>{song.ratingCount} rated</small>
                  </span>
                  <button className="chart-expand-button" aria-label="Show chart song history" onClick={() => setExpandedSongKey(isExpanded ? null : songKey)}>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                </div>
                {isExpanded && (
                  <div className="song-play-list">
                    {[...song.plays].sort((a, b) => b.date.localeCompare(a.date)).map((play, playIndex) => (
                      <div className="song-play-row top-play-row" key={`${play.date}-${play.performer}-${playIndex}`}>
                        <strong>{formatEventDate(play.date)}</strong>
                        <span>{play.performer}</span>
                        <em>{play.key || "-"}</em>
                        <span className="mini-rating">
                          <Star size={13} />
                          {play.rating}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </article>
            );
          })}
          {topSongs.length === 0 && <p className="helper">No rated songs yet. Add stars to songs after a performance and they will appear here.</p>}
        </div>
      )}

      {historyTab === "activity" && (
        <div className="history-list">
          {activityLog.map((entry) => (
            <article className="history-card activity-card" key={entry.id}>
              <strong>{entry.label}</strong>
              {entry.detail && <span>{entry.detail}</span>}
              <small>{formatActivityTime(entry.createdAt)}</small>
            </article>
          ))}
          {activityLog.length === 0 && <p className="helper">No activity logged yet. Bigger edits will appear here from now on.</p>}
        </div>
      )}
    </section>
  );
}

function SongBankView({
  songs,
  events,
  people,
  suggestions,
  canEdit,
  onRequestUnlock,
  onSave,
  onDelete,
  onMove,
  onAddToEvent,
}: {
  songs: Song[];
  events: JamEvent[];
  people: Person[];
  suggestions: SongSuggestion[];
  canEdit: boolean;
  onRequestUnlock: () => void;
  onSave: (song: Song) => void;
  onDelete: (songId: string) => void;
  onMove: (songId: string, direction: -1 | 1) => void;
  onAddToEvent: (songId: string, eventId: string, guestId: string) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const sortedSongs = songs;

  function createSong() {
    if (!canEdit) {
      onRequestUnlock();
      return;
    }
    const song: Song = { id: `bank-song-${Date.now()}`, title: "", artist: "", key: "", youtubeUrl: "", chordsUrl: "", notes: "" };
    onSave(song);
    setEditingId(song.id);
  }

  return (
    <section className="screen">
      <h2>Song Ideas</h2>
      <div className="history-list">
      <div className="section-title">
        <span>
          <h3>Potential Songs</h3>
          <small>Potential songs to learn before adding them to an event.</small>
        </span>
        <button className="primary-button compact" onClick={createSong}>
          <Plus size={16} />
          Song
        </button>
      </div>
      {sortedSongs.map((song, index) => {
        const isEditing = editingId === song.id;
        return (
          <SongBankCard
            key={song.id}
            song={song}
            events={events}
            people={people}
            suggestions={suggestions}
            isEditing={isEditing}
            canEdit={canEdit}
            onEdit={() => (canEdit ? setEditingId(isEditing ? null : song.id) : onRequestUnlock())}
            onSave={onSave}
            onDelete={onDelete}
            onMove={onMove}
            canMoveUp={index > 0}
            canMoveDown={index < sortedSongs.length - 1}
            onAddToEvent={onAddToEvent}
          />
        );
      })}
      {sortedSongs.length === 0 && <p className="helper">No song ideas yet.</p>}
      </div>
    </section>
  );
}

function SongBankCard({
  song,
  events,
  people,
  suggestions,
  isEditing,
  canEdit,
  onEdit,
  onSave,
  onDelete,
  onMove,
  canMoveUp,
  canMoveDown,
  onAddToEvent,
}: {
  song: Song;
  events: JamEvent[];
  people: Person[];
  suggestions: SongSuggestion[];
  isEditing: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onSave: (song: Song) => void;
  onDelete: (songId: string) => void;
  onMove: (songId: string, direction: -1 | 1) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onAddToEvent: (songId: string, eventId: string, guestId: string) => void;
}) {
  const sortedEvents = [...events].filter((event) => event.guests.length > 0).sort((a, b) => b.date.localeCompare(a.date));
  const [targetEventId, setTargetEventId] = useState(sortedEvents[0]?.id || "");
  const targetEvent = sortedEvents.find((event) => event.id === targetEventId) || sortedEvents[0];
  const sortedGuests = targetEvent ? [...targetEvent.guests].sort((a, b) => a.order - b.order) : [];
  const [targetGuestId, setTargetGuestId] = useState(sortedGuests[0]?.id || "");
  const selectedGuestId = sortedGuests.some((guest) => guest.id === targetGuestId) ? targetGuestId : sortedGuests[0]?.id || "";

  React.useEffect(() => {
    if (!sortedEvents.length) {
      setTargetEventId("");
      setTargetGuestId("");
      return;
    }
    if (!targetEventId || !sortedEvents.some((event) => event.id === targetEventId)) {
      setTargetEventId(sortedEvents[0].id);
    }
  }, [sortedEvents, targetEventId]);

  React.useEffect(() => {
    const nextGuests = targetEvent ? [...targetEvent.guests].sort((a, b) => a.order - b.order) : [];
    if (!nextGuests.length) {
      setTargetGuestId("");
      return;
    }
    if (!targetGuestId || !nextGuests.some((guest) => guest.id === targetGuestId)) {
      setTargetGuestId(nextGuests[0].id);
    }
  }, [targetEvent, targetGuestId]);

  return (
    <article className={`song-card song-bank-card idea-song-card ${isEditing ? "is-expanded" : "is-collapsed"}`}>
      <div className="idea-card-top">
        <button className="song-accordion-toggle" onClick={onEdit}>
          <span>
            <strong>{song.title || "New song idea"}</strong>
            <small>
              {song.artist || "Artist not set"}
              {song.key ? ` · Key of ${song.key}` : ""}
            </small>
          </span>
          {isEditing ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
        </button>
        <div className="idea-move-actions">
          <button aria-label="Move idea up" disabled={!canEdit || !canMoveUp} onClick={() => onMove(song.id, -1)}>
            <ArrowUp size={14} />
          </button>
          <button aria-label="Move idea down" disabled={!canEdit || !canMoveDown} onClick={() => onMove(song.id, 1)}>
            <ArrowDown size={14} />
          </button>
        </div>
      </div>
      {isEditing && (
        <div className="song-fields">
          <SongTitleField
            song={song}
            suggestions={suggestions}
            disabled={!canEdit}
            autoFocus={isEditing && !song.title.trim()}
            onUpdate={(patch) => onSave({ ...song, ...patch })}
          />
          <div className="field-row">
            <label>
              Key
              <select disabled={!canEdit} value={song.key || "-"} onChange={(event) => onSave({ ...song, key: event.target.value === "-" ? "" : event.target.value })}>
                {songKeys.map((key) => (
                  <option value={key} key={key}>
                    {key}
                  </option>
                ))}
              </select>
            </label>
            <ArtistField song={song} suggestions={suggestions} disabled={!canEdit} onUpdate={(patch) => onSave({ ...song, ...patch })} />
          </div>
          <label>
            YouTube URL
            <div className="url-input-row">
              <input disabled={!canEdit} value={song.youtubeUrl || ""} onChange={(event) => onSave({ ...song, youtubeUrl: event.target.value })} placeholder="https://youtube.com/..." />
              {song.youtubeUrl && (
                <a className="ghost-button compact-action" href={song.youtubeUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              )}
            </div>
          </label>
          <label>
            Chords / Lyrics URL
            <div className="url-input-row">
              <input disabled={!canEdit} value={song.chordsUrl || ""} onChange={(event) => onSave({ ...song, chordsUrl: event.target.value })} placeholder="https://tabs.ultimate-guitar.com/..." />
              {song.chordsUrl && (
                <a className="ghost-button compact-action" href={song.chordsUrl} target="_blank" rel="noreferrer">
                  Open
                </a>
              )}
            </div>
          </label>
          <label>
            Notes
            <textarea disabled={!canEdit} value={song.notes || ""} onChange={(event) => onSave({ ...song, notes: event.target.value })} placeholder="Learning notes..." />
          </label>
          <div className="idea-add-panel">
            <strong>Add to event</strong>
            <div className="field-row">
              <label>
                Event
                <select disabled={!canEdit || sortedEvents.length === 0} value={targetEvent?.id || ""} onChange={(event) => setTargetEventId(event.target.value)}>
                  {sortedEvents.map((event) => (
                    <option value={event.id} key={event.id}>
                      {formatEventDate(event.date)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Guest
                <select disabled={!canEdit || sortedGuests.length === 0} value={selectedGuestId} onChange={(event) => setTargetGuestId(event.target.value)}>
                  {sortedGuests.map((guest) => (
                    <option value={guest.id} key={guest.id}>
                      {getPerson(people, guest.personId).name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {sortedEvents.length === 0 || sortedGuests.length === 0 ? (
              <p className="helper">Create or open an event and add a guest first, then this selector will show them.</p>
            ) : (
              <button className="primary-button" disabled={!canEdit || !targetEvent || !selectedGuestId} onClick={() => onAddToEvent(song.id, targetEvent.id, selectedGuestId)}>
                <Plus size={16} />
                Add idea to guest
              </button>
            )}
          </div>
          <button className="ghost-button danger-action" disabled={!canEdit} onClick={() => onDelete(song.id)}>
            <Trash2 size={16} />
            Delete idea
          </button>
        </div>
      )}
    </article>
  );
}

function SettingsView({
  syncMode,
  remoteReady,
  saveStatus,
  people,
  events,
  songBank,
  settings,
  activityLog,
  chartOrder,
  canEdit,
  onUpdateSettings,
  onImportData,
  onChangePin,
  backups,
  onCreateBackup,
  onRestoreBackup,
}: {
  syncMode: "local" | "convex";
  remoteReady: boolean;
  saveStatus: SaveStatus;
  people: Person[];
  events: JamEvent[];
  songBank: Song[];
  settings: AppSettings;
  activityLog: ActivityEntry[];
  chartOrder: string[];
  canEdit: boolean;
  onUpdateSettings: (patch: Partial<AppSettings>) => void;
  onImportData: (data: AppData) => void;
  onChangePin?: (args: { currentPin: string; nextPin: string }) => Promise<boolean>;
  backups?: BackupSummary[];
  onCreateBackup?: () => Promise<unknown>;
  onRestoreBackup?: (backupId: string) => Promise<boolean>;
}) {
  const [currentPin, setCurrentPin] = useState("");
  const [nextPin, setNextPin] = useState("");
  const [pinMessage, setPinMessage] = useState("");
  const [songLimit, setSongLimit] = useState(String(settings.songsPerGuest));
  const [backupMessage, setBackupMessage] = useState("");
  const [backupBusyId, setBackupBusyId] = useState<string | null>(null);

  React.useEffect(() => {
    setSongLimit(String(settings.songsPerGuest));
  }, [settings.songsPerGuest]);

  const exportData: AppData = { people, events, songBank, settings, activityLog, chartOrder };

  async function changePin() {
    if (!canEdit || !nextPin.trim()) return;
    const didChange = onChangePin
      ? await onChangePin({ currentPin, nextPin })
      : currentPin.trim() === localFallbackPin && nextPin.trim().length >= 4;
    setPinMessage(didChange ? "PIN updated." : "PIN could not be updated.");
    if (didChange) {
      setCurrentPin("");
      setNextPin("");
    }
  }

  function exportJson() {
    downloadTextFile(`feathers-jam-night-backup-${exportDateStamp()}.json`, JSON.stringify(exportData, null, 2), "application/json;charset=utf-8");
  }

  function exportPeopleCsv() {
    const rows = people.map((person) => [
      person.id,
      person.name,
      person.kind,
      person.instruments || "",
      person.phone || "",
      person.email || "",
      person.notes || "",
      person.active === false ? "No" : "Yes",
      person.singer ? "Yes" : "No",
    ]);
    downloadTextFile(
      `feathers-people-${exportDateStamp()}.csv`,
      csvRows(["ID", "Name", "Type", "Instruments", "Phone", "Email", "Notes", "Active", "Singer"], rows),
      "text/csv;charset=utf-8",
    );
  }

  function exportEventSongsCsv() {
    const rows = events.flatMap((event) =>
      [...event.guests].sort((a, b) => a.order - b.order).flatMap((guest, guestIndex) => {
        const person = people.find((candidate) => candidate.id === guest.personId);
        return guest.songs.map((song, songIndex) => [
          event.date,
          formatEventDate(event.date),
          getEventStatusMeta(event.status).label,
          guestIndex + 1,
          person?.name || "Unknown performer",
          songIndex + 1,
          song.title || "",
          song.artist || "",
          song.key || "",
          song.youtubeUrl || "",
          song.chordsUrl || "",
          song.notes || "",
          event.notes || "",
        ]);
      }),
    );
    downloadTextFile(
      `feathers-event-songs-${exportDateStamp()}.csv`,
      csvRows(["Date", "Event", "Status", "Guest Order", "Guest", "Song Order", "Song", "Artist", "Key", "YouTube URL", "Chords/Lyrics URL", "Song Notes", "Event Notes"], rows),
      "text/csv;charset=utf-8",
    );
  }

  function exportIdeasCsv() {
    const rows = songBank.map((song) => [song.id, song.title || "", song.artist || "", song.key || "", song.youtubeUrl || "", song.chordsUrl || "", song.notes || ""]);
    downloadTextFile(
      `feathers-song-ideas-${exportDateStamp()}.csv`,
      csvRows(["ID", "Song", "Artist", "Key", "YouTube URL", "Chords/Lyrics URL", "Notes"], rows),
      "text/csv;charset=utf-8",
    );
  }

  async function createServerBackup() {
    if (!canEdit || !onCreateBackup) return;
    setBackupBusyId("create");
    setBackupMessage("");
    try {
      await onCreateBackup();
      setBackupMessage("Backup created.");
    } catch {
      setBackupMessage("Backup could not be created.");
    } finally {
      setBackupBusyId(null);
    }
  }

  async function restoreServerBackup(backup: BackupSummary) {
    if (!canEdit || !onRestoreBackup) return;
    const didConfirm = window.confirm(`Restore this backup?\n\n${formatBackupDate(backup.createdAt)}\n\nThis will replace the live app data. A safety backup will be made first.`);
    if (!didConfirm) return;

    setBackupBusyId(backup.id);
    setBackupMessage("");
    try {
      const didRestore = await onRestoreBackup(backup.id);
      setBackupMessage(didRestore ? "Backup restored." : "Backup could not be restored.");
    } catch {
      setBackupMessage("Backup could not be restored.");
    } finally {
      setBackupBusyId(null);
    }
  }

  async function importJsonFile(file: File | undefined) {
    if (!file) return;
    try {
      const text = await file.text();
      onImportData(JSON.parse(text) as AppData);
    } catch {
      window.alert("That file could not be imported. Please choose a Feathers Jam Night JSON backup.");
    }
  }

  return (
    <section className="screen">
      <h2>Settings & Data</h2>
      <div className="panel">
        <h3>Online Sync</h3>
        <p className="helper">
          {syncMode === "convex"
            ? remoteReady
              ? `Convex sync is connected. Current status: ${saveStatus === "saved" ? "saved" : saveStatus}.`
              : "Connecting to Convex..."
            : "Local-only mode is active until a Convex URL is configured."}
        </p>
      </div>
      <div className="panel">
        <h3>Backup & Export</h3>
        <p className="helper">JSON is the full backup for restoring the app. CSV files open in Excel, Numbers and Google Sheets.</p>
        <div className="export-grid">
          <button className="primary-button" onClick={exportJson}>
            <Download size={16} />
            Export JSON backup
          </button>
          <label className="import-button">
            Import JSON backup
            <input
              disabled={!canEdit}
              type="file"
              accept="application/json,.json"
              onChange={(event) => {
                void importJsonFile(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </label>
          <button className="ghost-button" onClick={exportEventSongsCsv}>Event songs CSV</button>
          <button className="ghost-button" onClick={exportPeopleCsv}>People CSV</button>
          <button className="ghost-button" onClick={exportIdeasCsv}>Song ideas CSV</button>
        </div>
      </div>
      <div className="panel">
        <h3>Automatic Backups</h3>
        <p className="helper">
          Convex keeps a daily snapshot at 2am and stores the latest 90 backups. Create a manual backup before big edits or before copying/resetting events.
        </p>
        <button className="primary-button" disabled={!canEdit || !onCreateBackup || backupBusyId === "create"} onClick={() => void createServerBackup()}>
          <Download size={16} />
          {backupBusyId === "create" ? "Creating..." : "Create Backup Now"}
        </button>
        {backupMessage && <p className="helper">{backupMessage}</p>}
        <div className="backup-list">
          {(backups || []).length === 0 && <p className="helper">No server backups yet. The first daily backup will appear after the next scheduled run.</p>}
          {(backups || []).map((backup) => (
            <div className="backup-item" key={backup.id}>
              <div>
                <strong>{getBackupSourceLabel(backup.source)}</strong>
                <span>{formatBackupDate(backup.createdAt)}</span>
                <small>
                  {backup.eventCount} events · {backup.eventSongCount} event songs · {backup.peopleCount} people · {backup.songIdeaCount} ideas
                </small>
              </div>
              <button className="ghost-button compact-action" disabled={!canEdit || !onRestoreBackup || backupBusyId === backup.id} onClick={() => void restoreServerBackup(backup)}>
                {backupBusyId === backup.id ? "Restoring..." : "Restore"}
              </button>
            </div>
          ))}
        </div>
      </div>
      <UserManual />
      <div className="panel">
        <h3>Edit PIN</h3>
        <p className="helper">{canEdit ? "Change the shared band PIN for editing access." : "Unlock editing before changing the PIN."}</p>
        <div className="pin-grid">
          <label>
            Current PIN
            <input disabled={!canEdit} type="password" inputMode="numeric" value={currentPin} onChange={(event) => setCurrentPin(event.target.value)} />
          </label>
          <label>
            New PIN
            <input disabled={!canEdit} type="password" inputMode="numeric" value={nextPin} onChange={(event) => setNextPin(event.target.value)} />
          </label>
        </div>
        {pinMessage && <p className="helper">{pinMessage}</p>}
        <button className="ghost-button" disabled={!canEdit || !currentPin.trim() || nextPin.trim().length < 4} onClick={() => void changePin()}>
          <Lock size={16} />
          Update PIN
        </button>
      </div>
      <div className="panel">
        <h3>Jam Night Day</h3>
        <p className="helper">Choose which weekday the Calendar should show. It will keep rolling month by month for that day.</p>
        <div className="setting-row">
          <select disabled={!canEdit} value={settings.jamDay} onChange={(event) => onUpdateSettings({ jamDay: Number(event.target.value) })}>
            {weekDays.map((day) => (
              <option value={day.value} key={day.value}>
                {day.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="panel">
        <h3>Songs Per Guest</h3>
        <p className="helper">Controls the maximum number of songs each guest can add to an event.</p>
        <div className="setting-row">
          <input disabled={!canEdit} type="number" min="1" max="10" value={songLimit} onChange={(event) => setSongLimit(event.target.value)} />
          <button className="primary-button" disabled={!canEdit || !songLimit.trim()} onClick={() => onUpdateSettings({ songsPerGuest: Number(songLimit) })}>
            <Check size={16} />
            Save
          </button>
        </div>
      </div>
      <div className="panel">
        <h3>Planned Permissions</h3>
        <p className="helper">Admins can publish events. Members can add songs. Guests can submit requests for approval.</p>
      </div>
    </section>
  );
}

function UserManual() {
  const sections = [
    {
      title: "Viewing The App",
      body: "Anyone with the link can view the calendar, running orders, band list, guests and PDF preview. Editing is locked until the band PIN is entered.",
    },
    {
      title: "Unlocking Editing",
      body: "Tap the View/Lock button in the top bar, enter the band PIN, then the app changes to Edit mode. Lock it again from the same button when you are finished.",
    },
    {
      title: "Creating An Event",
      body: "Open Dates, choose the month, then tap the shown jam night date. If the date is empty, unlock editing first and the app will create a blank event for that date.",
    },
    {
      title: "Adding Guests And Songs",
      body: "Open an event, tap Guest, then choose an existing person or quick-add a new guest. Tap a guest in the running order to edit songs, keys, artists, YouTube links and notes.",
    },
    {
      title: "Changing The Jam Night Day",
      body: "Open Setup, change Jam Night Day, and the Dates screen will show that weekday instead. Existing event data stays available in History and reports.",
    },
    {
      title: "Copying An Event",
      body: "Open the event you want to copy and tap Copy. Go back to Calendar, open the target date, then tap Paste. This copies the full event: band, guests, songs, keys, links and notes.",
    },
    {
      title: "Resetting An Event",
      body: "Open the event and tap Reset in the Copy / Paste Event panel. This clears that date back to a blank event after confirmation.",
    },
    {
      title: "PDF And WhatsApp",
      body: "Open an event and tap PDF. Use Print / Save PDF for the print view, or Share to send the running order through your phone share sheet, including WhatsApp where available.",
    },
    {
      title: "Sync Across Devices",
      body: "Changes save online through Convex. Other devices should update in the background. If a phone looks out of date, refresh the browser or close and reopen the app.",
    },
  ];

  return (
    <div className="panel manual-panel">
      <h3>User Manual</h3>
      <p className="helper">A quick guide for running the jam night from a phone.</p>
      <div className="manual-list">
        {sections.map((section) => (
          <details className="manual-item" key={section.title}>
            <summary>{section.title}</summary>
            <p>{section.body}</p>
          </details>
        ))}
      </div>
    </div>
  );
}

function BottomNav({ tab, setTab }: { tab: Tab; setTab: (tab: Tab) => void }) {
  const items = [
    { id: "calendar" as const, label: "Dates", icon: CalendarDays },
    { id: "band" as const, label: "Band", icon: Guitar },
    { id: "guests" as const, label: "Guests", icon: Users },
    { id: "ideas" as const, label: "Ideas", icon: Lightbulb },
    { id: "history" as const, label: "Stats", icon: History },
    { id: "settings" as const, label: "Setup", icon: Settings },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button className={tab === item.id ? "is-active" : ""} key={item.id} onClick={() => setTab(item.id)}>
            <Icon size={20} />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {convexClient ? (
      <ConvexProvider client={convexClient}>
        <ConvexApp />
      </ConvexProvider>
    ) : (
      <AppContent remoteReady={true} syncMode="local" />
    )}
  </React.StrictMode>,
);

function ConvexApp() {
  const remoteData = useQuery(api.appData.get) as AppData | null | undefined;
  const backups = useQuery(api.appData.listBackups) as BackupSummary[] | undefined;
  const saveRemote = useMutation(api.appData.save);
  const verifyEditPin = useMutation(api.appData.verifyEditPin);
  const changeEditPin = useMutation(api.appData.changeEditPin);
  const createBackupRemote = useMutation(api.appData.createBackup);
  const restoreBackupRemote = useMutation(api.appData.restoreBackup);

  return (
    <AppContent
      remoteData={remoteData}
      remoteReady={remoteData !== undefined}
      saveRemote={saveRemote}
      verifyEditPin={verifyEditPin}
      changeEditPin={changeEditPin}
      backups={backups}
      createBackup={() => createBackupRemote({})}
      restoreBackup={(backupId) => restoreBackupRemote({ backupId: backupId as never }) as Promise<AppData | false | null>}
      syncMode="convex"
    />
  );
}
