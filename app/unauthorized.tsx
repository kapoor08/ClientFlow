"use client";
import Link from "next/link";
import { ShieldAlert, ArrowLeft, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";

const Unauthorized = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="mx-auto max-w-lg text-center">
        <div className="relative mx-auto mb-8 flex h-32 w-32 items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-destructive/5" />
          <div className="absolute inset-3 rounded-full bg-destructive/10" />
          <ShieldAlert size={48} className="relative text-destructive" />
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          Access denied
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          You don&apos;t have permission to view this page. Please sign in with
          an authorized account or contact your administrator.
        </p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Button asChild size="lg">
            <Link href="/auth/sign-in">
              <LogIn size={16} className="mr-2" />
              Sign In
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg">
            <Link href="/">
              <ArrowLeft size={16} className="mr-2" />
              Back to Home
            </Link>
          </Button>
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Think this is a mistake?{" "}
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
export default Unauthorized;
