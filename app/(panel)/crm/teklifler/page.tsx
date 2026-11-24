import { Suspense } from "react";
import TekliflerPage from "@/modules/crm/components/teklifler/Teklifler";

// Açık teklif adreste (?teklif=ID) tutulur; useSearchParams prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <TekliflerPage />
    </Suspense>
  );
};

export default Page;
