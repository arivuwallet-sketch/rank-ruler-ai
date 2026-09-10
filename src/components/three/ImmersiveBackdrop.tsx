import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy } from "react";

const SeoGlobeScene = lazy(() => import("./SeoGlobeScene"));

/**
 * Full-bleed 3D layer for the hero. Purely decorative: never blocks pointer
 * events, and renders only in the browser.
 */
export default function ImmersiveBackdrop({ className = "" }: { className?: string }) {
  return (
    <div className={`pointer-events-none absolute inset-0 ${className}`} aria-hidden="true">
      <ClientOnly fallback={null}>
        <Suspense fallback={null}>
          <SeoGlobeScene />
        </Suspense>
      </ClientOnly>
    </div>
  );
}
