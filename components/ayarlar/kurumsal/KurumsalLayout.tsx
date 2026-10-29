"use client";

import { useState } from "react";
import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import KurumsalNav from "./KurumsalNav";

const KurumsalLayout = ({ children }: { children: React.ReactNode }) => {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex flex-col gap-4 lg:h-[calc(100svh-12.5rem)] lg:min-h-96 lg:flex-row">
      <aside
        className={cn(
          "bg-sidebar/60 flex flex-col gap-3 overflow-hidden rounded-xl border border-border/80 p-2 transition-[width] duration-200 lg:shrink-0",
          collapsed ? "lg:w-14" : "lg:w-56",
        )}
      >
        <div
          className={cn(
            "hidden items-center lg:flex mb-12",
            collapsed ? "justify-center" : "justify-between pl-2",
          )}
        >
          {!collapsed && (
            <span className="text-muted-foreground text-xs font-medium">
              Kurumsal Ayarlar
            </span>
          )}
          <Button
            type="button"
            variant="secondary"
            appearance="outline"
            size="icon"
            onClick={() => setCollapsed((c) => !c)}
            aria-label="Menüyü daralt veya genişlet"
          >
            <PanelLeft />
          </Button>
        </div>
        <KurumsalNav collapsed={collapsed} />
      </aside>

      <div className="bg-card min-w-0 flex-1 rounded-xl border border-border/80 p-5 shadow-sm lg:overflow-y-auto">
        {children}
      </div>
    </div>
  );
};

export default KurumsalLayout;
