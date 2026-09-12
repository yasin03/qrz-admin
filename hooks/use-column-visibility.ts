"use client";

import { useEffect, useState } from "react";
import type { VisibilityState } from "@tanstack/react-table";

/**
 * Kolon görünürlük state'ini yönetir, opsiyonel olarak localStorage'a kalıcı hale getirir.
 * `CustomDataTable` ve `CustomColumnVisibility` arasında paylaşılacak tek state kaynağı budur.
 */
export function useColumnVisibility(storageKey?: string) {
  const [visibility, setVisibility] = useState<VisibilityState>(() => {
    if (!storageKey || typeof window === "undefined") return {};
    try {
      const raw = window.localStorage.getItem(storageKey);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(visibility));
  }, [visibility, storageKey]);

  return [visibility, setVisibility] as const;
}
