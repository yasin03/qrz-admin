"use client";
import { Trash2 } from "lucide-react";

import { SideDrawer, useLastDefined } from "@/components/customs/SideDrawer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { PersonelListItem } from "@/modules/bordro/types/personel";
import { PersonelDetayContent } from "./PersonelDetayDialog";

type Props = {
  personel: PersonelListItem | null;
  grupAdi?: string;
  onOpenChange: (open: boolean) => void;
  onDelete: (id: string) => void;
};

const PersonelDrawer = ({
  personel: seciliPersonel,
  grupAdi,
  onOpenChange,
  onDelete,
}: Props) => {
  const personel = useLastDefined(seciliPersonel);
  if (!personel) return null;

  return (
    <SideDrawer
      open={!!seciliPersonel}
      onOpenChange={onOpenChange}
      title={personel.AdSoyad}
      badge={
        <Badge variant={personel.Durum ? "success" : "danger"}>
          {personel.Durum ? "Aktif" : "Pasif"}
        </Badge>
      }
      description={[`Sicil No: ${personel.SicilNo}`, personel.BolumAdi]
        .filter(Boolean)
        .join(" · ")}
      bodyClassName="space-y-3"
      footer={
        <Button
          type="button"
          variant="danger"
          appearance="outline"
          className="flex-1"
          onClick={() => onDelete(personel.IDSubePersonel)}
        >
          <Trash2 className="size-4" />
          Sil
        </Button>
      }
    >
      <div className="flex flex-wrap gap-1.5">
        <Badge variant={personel.CalismaDurumu === "ÇALISIYOR" ? "success" : "gray"}>
          {personel.CalismaDurumu}
        </Badge>
        <Badge variant={personel.Cinsiyet === "ERKEK" ? "blue" : "pink"}>
          {personel.Cinsiyet}
        </Badge>
        {(grupAdi || personel.PersonelGrubu) && (
          <Badge variant="secondary">{grupAdi || personel.PersonelGrubu}</Badge>
        )}
      </div>

      <PersonelDetayContent id={personel.IDSubePersonel} hideSummary />
    </SideDrawer>
  );
};

export default PersonelDrawer;
