"use client";

import type { GroupDef } from "./types";

const STORAGE_KEY = "auralis:groups:v2";

function readGroups(): GroupDef[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const list = JSON.parse(raw) as GroupDef[];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeGroups(list: GroupDef[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    window.dispatchEvent(new Event("auralis:groups:changed"));
  } catch {
    // localStorage unavailable
  }
}

export function loadAllGroups(): GroupDef[] {
  return readGroups();
}

export function findGroup(id: string): GroupDef | null {
  return readGroups().find((g) => g.id === id) ?? null;
}

export function saveGroup(g: GroupDef) {
  const next = readGroups().filter((x) => x.id !== g.id);
  next.unshift(g);
  writeGroups(next);
}

export function deleteGroup(id: string) {
  const next = readGroups().filter((x) => x.id !== id);
  writeGroups(next);
}

export function updateGroup(id: string, patch: Partial<GroupDef>) {
  const next = readGroups().map((g) =>
    g.id === id ? { ...g, ...patch } : g
  );
  writeGroups(next);
}

export function newGroupId(): string {
  const suffix = Math.random().toString(36).slice(2, 8);
  return `g_${Date.now().toString(36)}_${suffix}`;
}

export function onGroupsChanged(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const local = () => callback();
  const cross = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) callback();
  };
  window.addEventListener("auralis:groups:changed", local);
  window.addEventListener("storage", cross);
  return () => {
    window.removeEventListener("auralis:groups:changed", local);
    window.removeEventListener("storage", cross);
  };
}
