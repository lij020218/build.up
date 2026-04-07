"use client";

import { SurfaceError } from "../lib/components/SurfaceError";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <SurfaceError error={error} reset={reset} />;
}
