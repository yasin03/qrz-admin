"use client";
import { AY_DATA } from "@/constants/data";
import { useCurrentContext } from "@/hooks/use-context";
import BordroListesi from "./BordroListesi";

const BordroPage = () => {
  const { data: savedContext } = useCurrentContext();

  const sessionMonth =
    AY_DATA.find((ay) => ay.value === savedContext?.Ay)?.label || "";

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">
          Bordro Yönetimi
          <small className="text-gray-400 italic">- {sessionMonth}</small>
        </h1>
      </div>
      <BordroListesi />
    </div>
  );
};

export default BordroPage;
