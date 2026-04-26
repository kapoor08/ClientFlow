"use client";

import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

export default function FilesError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary {...props} segment="files" />;
}
