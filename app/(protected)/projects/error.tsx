"use client";

import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

export default function ProjectsError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary {...props} segment="projects" />;
}
