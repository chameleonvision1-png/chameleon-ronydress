"use client";

import * as React from "react";
import type { Dress } from "@/lib/types";

export interface ShortlistItem {
  code: string;
  nameAr: string;
  nameEn: string;
  image: string;
  status: Dress["status"];
  occasionLabel: string;
}

interface ShortlistContextValue {
  items: ShortlistItem[];
  drawerOpen: boolean;
  setDrawerOpen: (open: boolean) => void;
  toggleItem: (item: ShortlistItem) => void;
  hasItem: (code: string) => boolean;
  removeItem: (code: string) => void;
  clear: () => void;
}

const STORAGE_KEY = "ronydress_shortlist_v1";
const SERVER_SNAPSHOT: ShortlistItem[] = [];

const ShortlistContext = React.createContext<ShortlistContextValue>({
  items: [],
  drawerOpen: false,
  setDrawerOpen: () => {},
  toggleItem: () => {},
  hasItem: () => false,
  removeItem: () => {},
  clear: () => {},
});

let listeners: Array<() => void> = [];
let cachedRaw = "[]";
let cachedItems: ShortlistItem[] = [];

function emitChange() {
  for (const fn of listeners) fn();
}

function readSnapshot(): ShortlistItem[] {
  if (typeof window === "undefined") return SERVER_SNAPSHOT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || "[]";
    if (raw !== cachedRaw) {
      cachedRaw = raw;
      const parsed = JSON.parse(raw);
      cachedItems = Array.isArray(parsed) ? parsed : [];
    }
  } catch {
    cachedItems = [];
  }
  return cachedItems;
}

function getServerSnapshot(): ShortlistItem[] {
  return SERVER_SNAPSHOT;
}

function subscribeShortlist(listener: () => void) {
  listeners = [...listeners, listener];
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  if (typeof window !== "undefined") window.addEventListener("storage", onStorage);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
    if (typeof window !== "undefined") window.removeEventListener("storage", onStorage);
  };
}

function writeSnapshot(next: ShortlistItem[]) {
  if (typeof window === "undefined") return;
  try {
    const raw = JSON.stringify(next);
    cachedRaw = raw;
    cachedItems = next;
    localStorage.setItem(STORAGE_KEY, raw);
    emitChange();
  } catch {
    // Ignore storage quota errors
  }
}

export function ShortlistProvider({ children }: { children: React.ReactNode }) {
  const items = React.useSyncExternalStore(subscribeShortlist, readSnapshot, getServerSnapshot);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const toggleItem = React.useCallback((item: ShortlistItem) => {
    const current = readSnapshot();
    const exists = current.some((x) => x.code === item.code);
    const next = exists ? current.filter((x) => x.code !== item.code) : [item, ...current];
    writeSnapshot(next);
  }, []);

  const removeItem = React.useCallback((code: string) => {
    writeSnapshot(readSnapshot().filter((x) => x.code !== code));
  }, []);

  const hasItem = React.useCallback(
    (code: string) => items.some((x) => x.code === code),
    [items],
  );

  const clear = React.useCallback(() => {
    writeSnapshot([]);
  }, []);

  const value = React.useMemo(
    () => ({ items, drawerOpen, setDrawerOpen, toggleItem, hasItem, removeItem, clear }),
    [items, drawerOpen, toggleItem, hasItem, removeItem, clear],
  );

  return <ShortlistContext.Provider value={value}>{children}</ShortlistContext.Provider>;
}

export function useShortlist() {
  return React.useContext(ShortlistContext);
}
