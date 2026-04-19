"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Download,
  ExternalLink,
  Eye,
  Loader2,
  Pencil,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export { TooltipProvider };

// ─── Types ────────────────────────────────────────────────────────────────────

export type RowActionsProps = {
  /** Eye icon - navigates to view/detail page */
  viewHref?: string;
  /** Eye icon - opens a preview modal (use instead of viewHref for in-page previews) */
  onPreview?: () => void;
  /** Pencil icon - navigates to edit page */
  editHref?: string;
  /** ExternalLink icon - opens URL in a new tab */
  openHref?: string;
  /** Download icon - downloads a file */
  downloadHref?: string;
  /** Suggested filename for the downloaded file */
  downloadFileName?: string;
  /** RefreshCw icon - resends an invitation or retries an action */
  onResend?: () => void;
  isResending?: boolean;
  /** XCircle icon - revokes with a confirmation dialog */
  onRevoke?: () => void;
  isRevoking?: boolean;
  /** Name shown in revoke confirmation: "Revoke invitation for {revokeLabel}?" */
  revokeLabel?: string;
  /** Trash icon - deletes with a confirmation dialog */
  onDelete?: () => void;
  isDeleting?: boolean;
  /** Name shown in delete confirmation: 'Delete "{deleteLabel}"?' */
  deleteLabel?: string;
};

// ─── Shared helpers (exported for reuse in admin action components) ───────────

export const BASE_BTN =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

export const DANGER_BTN =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-danger/10 hover:text-danger disabled:pointer-events-none disabled:opacity-40";

export const WARNING_BTN =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-warning/10 hover:text-warning disabled:pointer-events-none disabled:opacity-40";

export const SUCCESS_BTN =
  "flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-success/10 hover:text-success disabled:pointer-events-none disabled:opacity-40";

export type TipLinkProps = {
  href: string;
  label: string;
  target?: string;
  rel?: string;
  download?: string;
  children: React.ReactNode;
};

export function TipLink({ href, label, target, rel, download, children }: TipLinkProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          href={href}
          target={target}
          rel={rel}
          download={download}
          className={BASE_BTN}
        >
          {children}
        </Link>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

export type TipButtonProps = {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "default" | "danger" | "warning" | "success";
  children: React.ReactNode;
};

const VARIANT_CLS: Record<NonNullable<TipButtonProps["variant"]>, string> = {
  default: BASE_BTN,
  danger: DANGER_BTN,
  warning: WARNING_BTN,
  success: SUCCESS_BTN,
};

export function TipButton({ label, onClick, disabled, variant = "default", children }: TipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={VARIANT_CLS[variant]}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
  variant?: "destructive" | "default";
};

function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  variant = "destructive",
}: ConfirmDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">{description}</p>
        <DialogFooter>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant={variant}
            size="sm"
            onClick={onConfirm}
            className="cursor-pointer"
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── RowActions ───────────────────────────────────────────────────────────────

export function RowActions({
  viewHref,
  onPreview,
  editHref,
  openHref,
  downloadHref,
  downloadFileName,
  onResend,
  isResending = false,
  onRevoke,
  isRevoking = false,
  revokeLabel,
  onDelete,
  isDeleting = false,
  deleteLabel,
}: RowActionsProps) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [revokeOpen, setRevokeOpen] = useState(false);

  return (
    <TooltipProvider>
      <div className="flex items-center gap-0.5">

        {/* View - Eye as navigation link */}
        {viewHref && (
          <TipLink href={viewHref} label="View">
            <Eye size={14} />
          </TipLink>
        )}

        {/* Preview - Eye as button (in-page modal) */}
        {onPreview && (
          <TipButton label="Preview" onClick={onPreview}>
            <Eye size={14} />
          </TipButton>
        )}

        {/* Edit - Pencil as navigation link */}
        {editHref && (
          <TipLink href={editHref} label="Edit">
            <Pencil size={14} />
          </TipLink>
        )}

        {/* Open - ExternalLink opens in new tab */}
        {openHref && (
          <TipLink href={openHref} label="Open" target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} />
          </TipLink>
        )}

        {/* Download */}
        {downloadHref && (
          <TipLink
            href={downloadHref}
            label="Download"
            download={downloadFileName ?? "true"}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Download size={14} />
          </TipLink>
        )}

        {/* Resend - RefreshCw */}
        {onResend && (
          <TipButton label="Resend" onClick={onResend} disabled={isResending}>
            {isResending ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <RefreshCw size={14} />
            )}
          </TipButton>
        )}

        {/* Revoke - XCircle (destructive, confirmation required) */}
        {onRevoke && (
          <TipButton
            label="Revoke"
            onClick={() => setRevokeOpen(true)}
            disabled={isRevoking}
            variant="danger"
          >
            {isRevoking ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <XCircle size={14} />
            )}
          </TipButton>
        )}

        {/* Delete - Trash2 (destructive, confirmation required) */}
        {onDelete && (
          <TipButton
            label="Delete"
            onClick={() => setDeleteOpen(true)}
            disabled={isDeleting}
            variant="danger"
          >
            {isDeleting ? (
              <Loader2 size={14} className="animate-spin" />
            ) : (
              <Trash2 size={14} />
            )}
          </TipButton>
        )}

      </div>

      {/* Revoke confirmation */}
      {onRevoke && (
        <ConfirmDialog
          open={revokeOpen}
          onOpenChange={setRevokeOpen}
          title="Revoke invitation"
          description={
            revokeLabel
              ? `Are you sure you want to revoke the invitation for "${revokeLabel}"? This action cannot be undone.`
              : "Are you sure you want to revoke this invitation? This action cannot be undone."
          }
          confirmLabel="Revoke"
          onConfirm={() => {
            setRevokeOpen(false);
            onRevoke();
          }}
        />
      )}

      {/* Delete confirmation */}
      {onDelete && (
        <ConfirmDialog
          open={deleteOpen}
          onOpenChange={setDeleteOpen}
          title="Confirm delete"
          description={
            deleteLabel
              ? `Are you sure you want to delete "${deleteLabel}"? This action cannot be undone.`
              : "Are you sure you want to delete this record? This action cannot be undone."
          }
          confirmLabel="Delete"
          onConfirm={() => {
            setDeleteOpen(false);
            onDelete();
          }}
        />
      )}
    </TooltipProvider>
  );
}
