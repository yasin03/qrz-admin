import { Suspense } from "react";
import SgkBordroParametreleri from "@/modules/core/components/sistem/sgk-bordro-parametreleri/SgkBordroParametreleri";

// useSearchParams kullanan bileşen prerender için Suspense ile sarılmalı.
const Page = () => {
  return (
    <Suspense>
      <SgkBordroParametreleri />
    </Suspense>
  );
};

export default Page;
