import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { Building2, Calendar, Edit, FolderKanban, Mail, Phone, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ListPageLayout } from "@/components/layout/templates/ListPageLayout";
import { getServerSession } from "@/server/auth/session";
import { getClientDetailForUser } from "@/server/clients";
import { getClientNotes } from "@/server/client-notes";
import { ClientDetailCard, ClientLinkedProjects, ClientNotesSection } from "@/components/clients";
import { formatDate } from "@/utils/date";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

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
      <div className="rounded-card border-border bg-card shadow-cf-1 border p-6">
        <p className="text-muted-foreground text-sm">
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
      <Breadcrumbs
        items={[{ label: "Clients", href: "/clients" }, { label: client.name }]}
        className="mb-4"
      />

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
          <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <Building2 size={16} /> Organization Fit
            </div>
            <p className="text-foreground mt-3 text-sm">
              {client.company
                ? `${client.name} is tracked under ${client.company}.`
                : `${client.name} does not have a company specified yet.`}
            </p>
            <p className="text-muted-foreground mt-2 text-xs">
              Last updated {formatDate(client.updatedAt)}
            </p>
          </div>
          <div className="rounded-card border-border bg-card shadow-cf-1 border p-5">
            <div className="text-muted-foreground flex items-center gap-2 text-sm">
              <FolderKanban size={16} /> Linked Projects
            </div>
            <div className="font-display text-foreground mt-3 text-3xl font-bold">
              {client.projectCount}
            </div>
            <p className="text-muted-foreground text-xs">
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
          <h2 className="font-display text-foreground mb-4 text-lg font-semibold">
            Linked Projects
          </h2>
          <ClientLinkedProjects linkedProjects={result.linkedProjects} />
        </div>
      </ListPageLayout>
    </div>
  );
};

export default ClientDetailsPage;
