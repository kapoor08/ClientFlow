"use client";

import { Download } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

export function AuditExportButton() {
  const searchParams = useSearchParams();

  function handleExport() {
    const params = new URLSearchParams();
    const q = searchParams.get("q");
    const dateFrom = searchParams.get("dateFrom");
    const dateTo = searchParams.get("dateTo");
    if (q) params.set("q", q);
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    window.location.href = `/api/audit-logs/export?${params.toString()}`;
  }

  return (
    <Button variant="outline" size="sm" onClick={handleExport}>
      <Download size={14} className="mr-1.5" />
      Export CSV
    </Button>
  );
}
