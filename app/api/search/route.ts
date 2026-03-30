import { NextResponse } from "next/server";
import { requireAuth, apiErrorResponse } from "@/lib/api-helpers";
import { listClientsForUser } from "@/lib/clients";
import { listProjectsForUser } from "@/lib/projects";
import { listTasksForUser } from "@/lib/tasks";

export async function GET(request: Request) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() ?? "";

    if (!q || q.length < 2) {
      return NextResponse.json({ clients: [], projects: [], tasks: [] });
    }

    const [clientsResult, projectsResult, tasksResult] = await Promise.all([
      listClientsForUser(userId, { query: q, pageSize: 5 }),
      listProjectsForUser(userId, { query: q, pageSize: 5 }),
      listTasksForUser(userId, { q, pageSize: 5 }),
    ]);

    return NextResponse.json({
      clients: (clientsResult?.clients ?? []).map((c) => ({
        id: c.id,
        name: c.name,
        company: c.company,
      })),
      projects: (projectsResult?.projects ?? []).map((p) => ({
        id: p.id,
        name: p.name,
        clientName: p.clientName,
        status: p.status,
      })),
      tasks: (tasksResult?.tasks ?? []).map((t) => ({
        id: t.id,
        title: t.title,
        projectName: t.projectName,
        status: t.status,
        refNumber: t.refNumber,
      })),
    });
  } catch (err) {
    return apiErrorResponse(err);
  }
}
