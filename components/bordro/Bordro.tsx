"use client";

import { useCurrentContext } from "@/hooks/use-context";
import BordroListesi from "./BordroListesi";

const BordroPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();

  return (
    <div className="space-y-4">
      <h1 className="mb-0 text-xl font-bold sm:text-2xl">
        Bordro Yönetimi
        <small className="text-gray-400 italic">
          - {savedContext?.AyAdi ?? ""}
        </small>
      </h1>

      <BordroListesi />
    </div>
  );
};

export default BordroPage;
