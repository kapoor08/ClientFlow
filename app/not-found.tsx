"use client";
import { Home, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePathname } from "next/navigation";
import Link from "next/link";

const NotFoundPage = () => {
  const location = usePathname();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-primary/5" />
          <div className="absolute inset-3 rounded-full bg-primary/10" />
          <span className="relative font-display text-5xl font-extrabold text-primary">
            404
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Page not found
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          The page{" "}
          <code className="rounded bg-muted px-1.5 py-0.5 text-sm font-medium text-foreground">
            {location}
          </code>{" "}
          doesn&apos;t exist or has been moved.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/">
              <Home size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/app/dashboard">
              <ArrowLeft size={16} className="mr-2" />
              Go to Dashboard
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Need help?{" "}
          <Link
            href="/contact"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Contact support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
