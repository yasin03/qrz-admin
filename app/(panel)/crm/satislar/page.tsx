import { Suspense } from "react";
import SatislarPage from "@/modules/crm/components/satislar/Satislar";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <SatislarPage />
    </Suspense>
  );
};

export default Page;
