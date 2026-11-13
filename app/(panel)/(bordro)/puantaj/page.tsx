import { Suspense } from "react";
import PuantajPage from "@/modules/bordro/components/puantaj/Puantaj";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <PuantajPage />
    </Suspense>
  );
};

export default Page;
