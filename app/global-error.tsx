"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-zinc-950 text-white flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4 p-8">
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-zinc-400 text-sm">
            An unexpected error occurred. The team has been notified.
          </p>
          <button
            onClick={reset}
            className="px-4 py-2 bg-[#FF4D15] hover:bg-[#e0440f] text-white rounded-lg text-sm font-medium transition-colors"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
