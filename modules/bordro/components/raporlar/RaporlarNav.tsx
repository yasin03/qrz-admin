"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ContactRound, Fingerprint, HandCoins, Parasol } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Yeni rapor sayfaları buraya eklenir.
const NAV_ITEMS = [
  {
    href: "/raporlar/pdks-raporu",
    label: "PDKS Raporu",
    icon: Fingerprint,
  },
  {
    href: "/raporlar/izin-raporu",
    label: "İzin Raporları",
    icon: Parasol,
  },
  {
    href: "/raporlar/avans-raporu",
    label: "Avans Raporları",
    icon: HandCoins,
  },
  {
    href: "/raporlar/bordro-raporu",
    label: "Bordro Raporları",
    icon: ContactRound,
  },
];

const RaporlarNav = ({ collapsed = false }: { collapsed?: boolean }) => {
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

export default RaporlarNav;
