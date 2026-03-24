"use client";
import Link from "next/link";
import { ServerCrash, RotateCcw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const ServerError = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/5" />
          <div className="absolute inset-3 rounded-full bg-destructive/10" />
          <ServerCrash size={48} className="relative text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Something went wrong
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          We&apos;re experiencing a temporary issue. Our team has been notified
          and is working on a fix.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button size="lg" onClick={() => window.location.reload()} className="cursor-pointer">
            <RotateCcw size={16} className="mr-2" />
            Try Again
          </Button>
          <Button asChild variant="outline" size="lg" className="cursor-pointer">
            <Link href="/">
              <Home size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          If the problem persists,{" "}
          <Link
            href="/contact"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            contact support
          </Link>
        </p>
      </div>
    </div>
  );
};
export default ServerError;
