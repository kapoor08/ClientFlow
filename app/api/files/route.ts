import { NextRequest, NextResponse } from "next/server";
import {
  listFilesForProject,
  listAllFilesForUser,
  saveFileForUser,
} from "@/lib/files";
import { requireAuth, apiErrorResponse, ApiError } from "@/lib/api-helpers";
import { DEFAULT_PAGE_SIZE } from "@/lib/pagination";
import { z } from "zod";

const saveFileSchema = z.object({
  projectId: z.string().min(1),
  storageKey: z.string().min(1),
  storageUrl: z.string().url(),
  fileName: z.string().min(1),
  mimeType: z.string().nullable(),
  sizeBytes: z.number().int().positive().nullable(),
});

export async function GET(request: NextRequest) {
  try {
    const { userId } = await requireAuth();
    const { searchParams } = request.nextUrl;
    const projectId = searchParams.get("projectId");

    if (projectId) {
      const { access, files } = await listFilesForProject(userId, projectId);
      if (!access) throw new ApiError("No active organization found.", 403);
      return NextResponse.json({ files });
    }

    // Org-wide listing
    const query = searchParams.get("q") ?? "";
    const page = Math.max(1, Number(searchParams.get("page")) || 1);
    const pageSize = Math.max(
      1,
      Number(searchParams.get("pageSize")) || DEFAULT_PAGE_SIZE,
    );

    const result = await listAllFilesForUser(userId, { query, page, pageSize });
    if (!result.access) throw new ApiError("No active organization found.", 403);

    return NextResponse.json({
      files: result.files,
      pagination: result.pagination,
    });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await requireAuth();

    const body = await request.json();
    const parsed = saveFileSchema.safeParse(body);
    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid request.";
      throw new ApiError(firstError, 422);
    }

    const result = await saveFileForUser(userId, parsed.data);

    return NextResponse.json({ fileId: result.fileId }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}
