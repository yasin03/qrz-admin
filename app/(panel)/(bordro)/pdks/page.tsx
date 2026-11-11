import { Suspense } from "react";
import PdksPage from "@/modules/bordro/components/pdks/Pdks";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <PdksPage />
    </Suspense>
  );
};

export default Page;
