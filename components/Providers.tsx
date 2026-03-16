"use client";

import ErrorBoundary from "./ErrorBoundary";
import { ToastProvider } from "./ToastProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ToastProvider>{children}</ToastProvider>
    </ErrorBoundary>
  );
}
