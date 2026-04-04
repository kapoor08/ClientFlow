import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Calendar,
  Edit,
  FolderKanban,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/layout/ListPageLayout";
import { getServerSession } from "@/lib/get-session";
import { getClientDetailForUser } from "@/lib/clients";
import { getClientNotes } from "@/lib/client-notes";
import { ClientDetailCard } from "./ClientDetailCard";
import { ClientLinkedProjects } from "./ClientLinkedProjects";
import { ClientNotesSection } from "@/components/clients/ClientNotesSection";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

const statusBadge: Record<string, string> = {
  active: "bg-success/10 text-success",
  inactive: "bg-neutral-300/50 text-neutral-700",
  archived: "bg-neutral-300/50 text-neutral-500",
};

const ClientDetailsPage = async ({ params }: ClientDetailPageProps) => {
  const session = await getServerSession();
  const { id } = await params;
  const result = await getClientDetailForUser(session!.user.id, id);

  if (!result.access) {
    return (
      <div className="rounded-card border border-border bg-card p-6 shadow-cf-1">
        <p className="text-sm text-muted-foreground">
          Complete workspace bootstrap before managing clients.
        </p>
      </div>
    );
  }

  if (!result.client) notFound();
  const client = result.client;
  const notes = await getClientNotes(client.id, result.access.organizationId);

  return (
    <div>
      <Link
        href="/clients"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} /> Back to Clients
      </Link>

      <ListPageLayout
        title={
          <span className="flex flex-wrap items-center gap-2">
            {client.name}
            <span
              className={`rounded-pill px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge[client.status]}`}
            >
              {client.status}
            </span>
          </span>
        }
        description={client.company || "No company linked"}
        action={
          result.access.canWrite ? (
            <Button variant="default" size="sm" asChild>
              <Link href={`/clients/${client.id}/edit`}>
                <Edit size={14} /> Edit Client
              </Link>
            </Button>
          ) : undefined
        }
      >
        <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <ClientDetailCard
            icon={UserRound}
            label="Contact"
            value={client.contactName || "No primary contact"}
          />
          <ClientDetailCard
            icon={Mail}
            label="Email"
            value={client.contactEmail || "No contact email"}
          />
          <ClientDetailCard
            icon={Phone}
            label="Phone"
            value={client.contactPhone || "No contact phone"}
          />
          <ClientDetailCard
            icon={Calendar}
            label="Client Since"
            value={formatDate(client.createdAt)}
          />
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Building2 size={16} /> Organization Fit
            </div>
            <p className="mt-3 text-sm text-foreground">
              {client.company
                ? `${client.name} is tracked under ${client.company}.`
                : `${client.name} does not have a company specified yet.`}
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Last updated {formatDate(client.updatedAt)}
            </p>
          </div>
          <div className="rounded-card border border-border bg-card p-5 shadow-cf-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FolderKanban size={16} /> Linked Projects
            </div>
            <div className="mt-3 font-display text-3xl font-bold text-foreground">
              {client.projectCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Active and archived projects associated with this client.
            </p>
          </div>
        </div>

        <ClientNotesSection
          clientId={client.id}
          initialNotes={notes}
          canWrite={result.access.canWrite}
        />

        <div>
          <h2 className="mb-4 font-display text-lg font-semibold text-foreground">
            Linked Projects
          </h2>
          <ClientLinkedProjects linkedProjects={result.linkedProjects} />
        </div>
      </ListPageLayout>
    </div>
  );
};

export default ClientDetailsPage;
