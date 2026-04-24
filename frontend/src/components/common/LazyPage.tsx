// src/components/common/LazyPage.tsx
import { lazy, Suspense, type ComponentType } from "react";

export function lazyPage(
  importFn: () => Promise<{ default: ComponentType<unknown> }>,
) {
  const LazyComponent = lazy(importFn);
  return (
    <Suspense fallback={<div className="p-4 text-center">Carregando...</div>}>
      <LazyComponent />
    </Suspense>
  );
}
