import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ShieldCheck, ExternalLink, MailCheck, KeyRound, Users } from "lucide-react";
import { listAdminUsers } from "@/lib/admin-data";
import { AdminUserActions } from "./AdminUserActions";
import { PageHeader } from "@/components/ui/page-header";
import { EmptyState } from "@/components/common/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminUsersPage() {
  const users = await listAdminUsers();

  return (
    <div>
      <PageHeader
        title="Users"
        description={`${users.length} registered users`}
      />

      {users.length === 0 ? (
        <EmptyState icon={Users} title="No users found." />
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-cf-1">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead className="hidden sm:table-cell">Orgs</TableHead>
                <TableHead className="hidden md:table-cell">Verified</TableHead>
                <TableHead className="hidden md:table-cell">MFA</TableHead>
                <TableHead className="hidden lg:table-cell">Joined</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2.5">
                      {u.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={u.image}
                          alt={u.name}
                          className="h-7 w-7 rounded-full object-cover shrink-0"
                        />
                      ) : (
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[10px] font-bold text-primary">
                          {u.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground truncate">{u.name}</p>
                          {u.isPlatformAdmin && (
                            <ShieldCheck size={12} className="text-danger shrink-0" aria-label="Platform Admin" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground">
                    {u.orgCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <MailCheck
                      size={14}
                      className={u.emailVerified ? "text-success" : "text-muted-foreground/40"}
                    />
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <KeyRound
                      size={14}
                      className={u.twoFactorEnabled ? "text-success" : "text-muted-foreground/40"}
                    />
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(u.createdAt), { addSuffix: true })}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/users/${u.id}`}
                        className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                        title="View profile"
                      >
                        <ExternalLink size={13} />
                      </Link>
                      <AdminUserActions userId={u.id} userName={u.name} />
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
