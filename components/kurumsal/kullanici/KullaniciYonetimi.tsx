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
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold sm:text-2xl">
              Kullanıcı Yönetimi
            </h1>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="w-full sm:w-48 sm:shrink-0">
              <Input
                startIcon={<Search className="h-4 w-4" />}
                placeholder="Kullanıcı Ara..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>
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
