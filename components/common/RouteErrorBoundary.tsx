"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
  segment?: string;
};

export function RouteErrorBoundary({ error, reset, segment }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[RouteErrorBoundary]", segment, error);
    }
  }, [error, segment]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6">
      <div className="mx-auto max-w-md text-center">
        <div className="bg-destructive/10 mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full">
          <AlertTriangle size={28} className="text-destructive" />
        </div>
        <h2 className="text-foreground text-xl font-semibold">
          {segment ? `Couldn't load ${segment}` : "Something went wrong"}
        </h2>
        <p className="text-muted-foreground mt-2 text-sm">
          A page-level error stopped this section from rendering. The rest of the app should still
          work.
        </p>
        {error.digest ? (
          <p className="text-muted-foreground/80 mt-3 font-mono text-xs">ref: {error.digest}</p>
        ) : null}
        <div className="mt-6">
          <Button onClick={reset} className="cursor-pointer">
            <RotateCcw size={14} className="mr-2" />
            Try again
          </Button>
        </div>
      </div>
    </div>
  );
}
