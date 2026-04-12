"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateInvoiceDialog } from "./CreateInvoiceDialog";

type ClientOption = { id: string; name: string };

export function CreateInvoiceButton({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button className="cursor-pointer" onClick={() => setOpen(true)}>
        <Plus className="h-4 w-4" />
        New Invoice
      </Button>
      <CreateInvoiceDialog
        open={open}
        onClose={() => setOpen(false)}
        onCreated={() => {
          setOpen(false);
          router.refresh();
        }}
        clients={clients}
      />
    </>
  );
}
