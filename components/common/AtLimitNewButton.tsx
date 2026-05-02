import Link from "next/link";
import { Lock, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  href: string;
  label: string;
  capStatus: { atLimit: boolean; limit: number | null; used: number };
};

/**
 * "New <thing>" CTA that is aware of the org's plan cap. When the cap is hit
 * the button is rendered as disabled with a tooltip pointing to the upgrade
 * page; otherwise it links to `href`. Mirrors the API-side guard
 * (PlanLimitError → 402) so users find out at click time rather than after
 * filling the form.
 */
export function AtLimitNewButton({ href, label, capStatus }: Props) {
  if (!capStatus.atLimit) {
    return (
      <Button asChild>
        <Link href={href}>
          <Plus size={16} /> {label}
        </Link>
      </Button>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button asChild variant="outline">
            <Link href="/plans">
              <Lock size={14} /> {label}
            </Link>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs">
          You&apos;ve reached the {capStatus.limit}-{label.toLowerCase().replace(/^add /, "")} limit
          on your current plan. Click to upgrade.
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
