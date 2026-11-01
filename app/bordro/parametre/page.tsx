import { Suspense } from "react";
import ParametrePage from "@/components/bordro/parametre/Parametre";

// useTabParam (useSearchParams) prerender için Suspense ister.
const Page = () => {
  return (
    <Suspense>
      <ParametrePage />
    </Suspense>
  );
};

export default Page;
