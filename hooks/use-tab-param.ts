"use client";

import { usePathname, useSearchParams } from "next/navigation";

/**
 * Aktif tab'ı adreste (?tab=...) tutar; sayfa yenilenince veya link
 * paylaşılınca aynı tab açılır. Adreste tab yoksa veya listede olmayan
 * bir değer varsa ilk tab döner.
 *
 *   const [activeTab, setActiveTab] = useTabParam(["izin", "talepler"] as const);
 *
 * Adres native history.replaceState ile güncellenir: Next.js router'a
 * entegre olduğu için useSearchParams güncellenir ama router.replace gibi
 * sunucuya RSC isteği atmaz (tab geçişi tamamen istemcide). Bu yüzden
 * server component'ler `tab` parametresine göre render edilmemeli.
 *
 * Aynı sayfada ikinci bir seviye gerekirse farklı parametre adı verilir:
 *   useTabParam(["alacaklar", "tahsilatlar"] as const, "gorunum")
 *
 * useSearchParams kullandığı için bileşen page.tsx'te <Suspense> ile
 * sarılmalı, yoksa build prerender sırasında hata verir.
 */
export function useTabParam<T extends string>(tabs: readonly T[], param = "tab") {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const tabParam = searchParams.get(param);
  const activeTab = tabs.find((t) => t === tabParam) ?? tabs[0];

  const setActiveTab = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(param, value);
    window.history.replaceState(null, "", `${pathname}?${params.toString()}`);
  };

  return [activeTab, setActiveTab] as const;
}
