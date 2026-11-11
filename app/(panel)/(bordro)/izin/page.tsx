import { Suspense } from "react";
import IzinPage from "@/modules/bordro/components/izin/Izin";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <IzinPage />
    </Suspense>
  );
};

export default Page;
