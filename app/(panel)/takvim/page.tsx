import { Suspense } from "react";

import DetayliTakvim from "@/modules/core/components/takvim/DetayliTakvim";

const Page = () => {
  return (
    <Suspense>
      <DetayliTakvim />
    </Suspense>
  );
};

export default Page;
