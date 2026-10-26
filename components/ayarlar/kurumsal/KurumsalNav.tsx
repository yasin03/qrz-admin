"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ShieldCheck } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Yeni kurumsal ayar sayfaları buraya eklenir.
const NAV_ITEMS = [
  {
    href: "/ayarlar/kurumsal/sirket-bilgileri",
    label: "Şirket Bilgileri",
    icon: Building2,
  },
  {
    href: "/ayarlar/kurumsal/yetki-ayarlari",
    label: "Yetki Ayarları",
    icon: ShieldCheck,
  },
];

const KurumsalNav = ({ collapsed = false }: { collapsed?: boolean }) => {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto lg:flex-col">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);

        const link = (
          <Link
            key={item.href}
            href={item.href}
            aria-label={item.label}
            className={cn(
              buttonVariants({ variant: "secondary", appearance: "ghost" }),
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0 justify-start",
              collapsed && "lg:justify-center lg:px-0",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <item.icon />
            <span className={cn(collapsed && "lg:hidden")}>{item.label}</span>
          </Link>
        );

        if (!collapsed) return link;

        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>{link}</TooltipTrigger>
            <TooltipContent side="right">{item.label}</TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
};

export default KurumsalNav;
