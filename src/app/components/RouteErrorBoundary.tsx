import { useEffect } from "react";
import { isRouteErrorResponse, useRouteError } from "react-router";
import * as Sentry from "@sentry/react";

/**
 * React Router catches errors thrown while rendering a route before any outer
 * error boundary sees them, so this is where crashes get reported. Replaces
 * the router's default "Unexpected Application Error" screen.
 */
export function RouteErrorBoundary() {
  const error = useRouteError();
  const notFound = isRouteErrorResponse(error) && error.status === 404;

  useEffect(() => {
    if (!notFound) Sentry.captureException(error);
  }, [error, notFound]);

  return <ErrorScreen notFound={notFound} />;
}

/**
 * The error page itself, with no router dependency — also used as the
 * app-level Sentry.ErrorBoundary fallback, which renders outside the router.
 */
export function ErrorScreen({ notFound = false }: { notFound?: boolean }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-white px-6 text-center">
      <h1 className="text-xl font-semibold text-[#1e2d5a]">
        {notFound ? "Page not found" : "Something went wrong"}
      </h1>
      <p className="max-w-md text-sm text-gray-500">
        {notFound
          ? "That page doesn't exist."
          : "This page hit an error and couldn't be shown. It has been reported. Reloading usually fixes it."}
      </p>
      <div className="flex gap-3">
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-[#1e2d5a] px-5 py-2 text-sm text-white hover:bg-[#162048]"
        >
          Reload
        </button>
        <a href="/" className="rounded-lg border border-gray-300 px-5 py-2 text-sm text-gray-600 hover:bg-gray-50">
          Go to dashboard
        </a>
      </div>
    </div>
  );
}
