"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import {
  ACTIVE_MODULE_COOKIE,
  DEFAULT_MODULE_ID,
  getModule,
  getModuleIdFromPath,
  type AppModule,
  type ModuleId,
} from "@/modules/registry";

const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

type ActiveModuleContextValue = {
  activeModule: AppModule;
  selectModule: (id: ModuleId) => void;
};

const ActiveModuleContext = createContext<ActiveModuleContextValue | null>(
  null,
);

type ActiveModuleProviderProps = {
  children: React.ReactNode;
  /** Server'da cookie'den okunan son modül; ilk render'da menü yanıp sönmesin. */
  lastModule?: ModuleId;
};

export function ActiveModuleProvider({
  children,
  lastModule,
}: ActiveModuleProviderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const pathModuleId = getModuleIdFromPath(pathname);
  const [lastModuleId, setLastModuleId] = useState<ModuleId>(
    pathModuleId ?? lastModule ?? DEFAULT_MODULE_ID,
  );

  // Bir modülün sayfasına (seçici dışında, link/URL ile) gidilince de son
  // modül güncellensin; ortak sayfalara geçince o modülün menüsü kalsın.
  if (pathModuleId && pathModuleId !== lastModuleId) {
    setLastModuleId(pathModuleId);
  }

  useEffect(() => {
    document.cookie = `${ACTIVE_MODULE_COOKIE}=${lastModuleId}; path=/; max-age=${COOKIE_MAX_AGE}`;
  }, [lastModuleId]);

  const selectModule = (id: ModuleId) => {
    setLastModuleId(id);
    router.push(getModule(id).homeHref);
  };

  return (
    <ActiveModuleContext.Provider
      value={{ activeModule: getModule(lastModuleId), selectModule }}
    >
      {children}
    </ActiveModuleContext.Provider>
  );
}

export function useActiveModule() {
  const context = useContext(ActiveModuleContext);
  if (!context) {
    throw new Error("useActiveModule, ActiveModuleProvider içinde kullanılmalı");
  }
  return context;
}
