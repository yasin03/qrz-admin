"use client";

import { useCurrentContext } from "@/hooks/use-context";
import BordroListesi from "./BordroListesi";

const BordroPage = () => {
  const { data: savedContext, isPending: isContextPending } =
    useCurrentContext();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold mb-0">
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
