"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import React, { useState } from "react";

const KullaniciYonetimi = () => {
  const [searchText, setSearchText] = useState<string>("");
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Kullanıcı Yönetimi</h1>
          </div>
          <div className="flex items-center gap-2">
            <Input
              startIcon={<Search className="h-4 w-4" />}
              placeholder="Kullanıcı Ara..."
              className="w-48"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button type="button" size="sm" onClick={() => setOpen(true)}>
              <Plus className="size-4" />
              Yeni Kullanıcı Ekle
            </Button>
          </div>
        </div>
      </div>
    </>
  );
};

export default KullaniciYonetimi;
