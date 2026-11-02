"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Binary, Calculator, Landmark, Percent, Wallet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// Yeni sistem parametre sayfaları buraya eklenir.
const NAV_ITEMS = [
  {
    href: "/sistem/sgk-bordro-parametreleri",
    label: "SGK Bordro Parametreleri",
    icon: Landmark,
  },
  {
    href: "/sistem/muhasebe-parametreleri",
    label: "Muhasebe Parametreleri",
    icon: Calculator,
  },
  {
    href: "/sistem/personel-tahakkuk-parametreleri",
    label: "Personel Tahakkuk Parametreleri",
    icon: Wallet,
  },
  {
    href: "/sistem/vergi-oranlari",
    label: "Vergi Oranları",
    icon: Percent,
  },
  {
    href: "/sistem/nace-kodlari",
    label: "NACE Kodları",
    icon: Binary,
  },
];
const SistemNav = ({ collapsed = false }: { collapsed?: boolean }) => {
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
              "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground shrink-0 justify-start lg:min-w-0 lg:shrink",
              "lg:h-auto lg:min-h-8 lg:py-1.5 lg:whitespace-normal",
              collapsed && "lg:justify-center lg:px-0",
              isActive &&
                "bg-sidebar-accent text-sidebar-accent-foreground font-medium",
            )}
          >
            <item.icon />
            <span
              className={cn(
                "min-w-0 pl-1 text-left wrap-break-word",
                collapsed && "lg:hidden",
              )}
            >
              {item.label}
            </span>
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

export default SistemNav;
