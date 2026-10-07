"use client";

import PersonelDashboard from "@/components/dashboard/PersonelDashboard";
import YoneticiDashboard from "@/components/dashboard/YoneticiDashboard";
import { useCurrentContext } from "@/hooks/use-context";
import { useRole } from "@/stores/auth-store";

export default function Home() {
  const { isPersonel } = useRole();
  const { data: context } = useCurrentContext();

  return (
    <div className="space-y-4">
      <h1 className="mb-0 text-xl font-bold sm:text-2xl">
        {isPersonel ? "Ana Sayfa" : "Dashboard"}
        {!isPersonel && context?.AyAdi ? (
          <small className="text-gray-400 italic"> - {context.AyAdi}</small>
        ) : null}
      </h1>

      {isPersonel ? <PersonelDashboard /> : <YoneticiDashboard />}
    </div>
  );
}
