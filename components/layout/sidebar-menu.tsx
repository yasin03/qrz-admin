"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Users, MapPinned, Fingerprint } from "lucide-react";

import { cn } from "@/lib/utils";

type SidebarMenuProps = {
  onNavigate?: () => void;
};

const menuItems = [
  {
    href: "/kullanicilar",
    label: "Kullanicilar",
    icon: Users,
  },
  {
    href: "/lokasyonlar",
    label: "Lokasyonlar",
    icon: MapPinned,
  },
  {
    href: "/pdks",
    label: "PDKS",
    icon: Fingerprint,
  },
];

export function SidebarMenu({ onNavigate }: SidebarMenuProps) {
  const pathname = usePathname();

  return (
    <nav className="space-y-2" aria-label="Yan menu">
      {menuItems.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <Icon className="size-4 transition-transform duration-300 group-hover:scale-110" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
