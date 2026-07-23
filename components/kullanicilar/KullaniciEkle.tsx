import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { forwardRef, useImperativeHandle, useState } from "react";

export interface KullaniciEkleRef {
  open: () => void;
  close: () => void;
}

const KullaniciEkle = forwardRef<KullaniciEkleRef>((_, ref) => {
  const [open, setOpen] = useState(false);

  useImperativeHandle(ref, () => ({
    open: () => setOpen(true),
    close: () => setOpen(false),
  }));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <form>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Yeni Kullanıcı Ekle</DialogTitle>
            <DialogDescription>
              Yeni kullanıcı bilgilerini girin ve kaydedin.
            </DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="name-1">Ad Soyad</Label>
              <Input id="name-1" name="name" placeholder="Ad Soyad" />
            </Field>
            <Field>
              <Label htmlFor="username-1">Kullanıcı Adı</Label>
              <Input
                id="username-1"
                name="username"
                placeholder="Kullanıcı Adı"
              />
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button appearance="outline">İptal</Button>
            </DialogClose>

            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
});

KullaniciEkle.displayName = "KullaniciEkle";

export default KullaniciEkle;
