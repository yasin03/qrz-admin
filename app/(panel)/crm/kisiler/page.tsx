import { Suspense } from "react";
import KisilerPage from "@/modules/crm/components/kisiler/Kisiler";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <KisilerPage />
    </Suspense>
  );
};

export default Page;
