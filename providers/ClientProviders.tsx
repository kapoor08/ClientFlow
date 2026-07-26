"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LazyMotion } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Toaster } from "@/components/ui/sonner";

// framer-motion feature bundle, loaded lazily as one shared async chunk.
// See lib/motion-features.ts. All animated UI uses the `m` component under this
// provider, so no route bundles the full `motion` featureset.
const loadMotionFeatures = () => import("@/lib/motion-features").then((mod) => mod.default);

type ClientProvidersProps = {
  children: ReactNode;
  /** Per-request CSP nonce (P2-2), threaded to next-themes' inline script. */
  nonce?: string;
};

export default function ClientProviders({ children, nonce }: ClientProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            refetchOnWindowFocus: false,
            staleTime: 1000 * 60,
          },
        },
      }),
  );

  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        {/*
          Mounts next-themes so `useTheme()` resolves (it was orphaned -> always
          `undefined`, e.g. in TurnstileWidget). Intentionally LIGHT-LOCKED for
          now (defaultTheme="light", enableSystem=false): the `.dark` token block
          exists but has never been visually QA'd and there is no theme toggle,
          so auto-enabling system dark would risk shipping broken dark styling.
          To roll out dark mode: add a toggle, flip enableSystem, and QA. (P2-11)
        */}
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
          nonce={nonce}
        >
          <LazyMotion features={loadMotionFeatures}>{children}</LazyMotion>
          <Toaster position="bottom-right" richColors />
        </ThemeProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
