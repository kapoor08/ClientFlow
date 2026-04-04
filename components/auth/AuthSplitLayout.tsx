import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

type AuthSplitLayoutProps = {
  title: string;
  description: string;
  panelTitle: string;
  panelDescription: string;
  children: ReactNode;
};

export default function AuthSplitLayout({
  title,
  description,
  panelTitle,
  panelDescription,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden w-1/2 flex-col justify-between bg-primary p-12 lg:flex">
        <Link href="/" className="flex items-center gap-2 w-fit">
          <Image
            src="/logo-light.png"
            alt="ClientFlow"
            width={130}
            height={28}
            className="h-auto w-auto"
            priority
            draggable={false}
          />
        </Link>
        <div>
          <h2 className="text-3xl font-bold text-primary-foreground">
            {panelTitle}
          </h2>
          <p className="mt-3 max-w-sm text-primary-foreground/80">
            {panelDescription}
          </p>
        </div>
        <p className="text-xs text-primary-foreground/60">
          &copy; {new Date().getFullYear()} ClientFlow, Inc.
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/app-logo.png"
                alt="ClientFlow"
                width={130}
                height={28}
                className="h-auto w-auto"
                priority
                draggable={false}
              />
            </Link>
          </div>

          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>

          {children}
        </div>
      </div>
    </div>
  );
}
