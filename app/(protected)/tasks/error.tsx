"use client";

import { RouteErrorBoundary } from "@/components/common/RouteErrorBoundary";

export default function TasksError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary {...props} segment="tasks" />;
}
