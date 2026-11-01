import { Suspense } from "react";
import AvansPage from "@/components/avans/Avans";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <AvansPage />
    </Suspense>
  );
};

export default Page;
