"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Aktif tab'ı adreste (?tab=...) tutar; sayfa yenilenince veya link
 * paylaşılınca aynı tab açılır. Adreste tab yoksa veya listede olmayan
 * bir değer varsa ilk tab döner.
 *
 *   const [activeTab, setActiveTab] = useTabParam(["izin", "talepler"] as const);
 *
 * useSearchParams kullandığı için bileşen page.tsx'te <Suspense> ile
 * sarılmalı, yoksa build prerender sırasında hata verir.
 */
export function useTabParam<T extends string>(tabs: readonly T[]) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get("tab");
  const activeTab = tabs.find((t) => t === tabParam) ?? tabs[0];

  const setActiveTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", value);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return [activeTab, setActiveTab] as const;
}
