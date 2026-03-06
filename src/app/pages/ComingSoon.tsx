export function ComingSoon() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center p-8">
      <div className="text-center">
        <div className="mb-6 inline-flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <svg
            className="h-12 w-12 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
        </div>
        <h1 className="mb-3 text-3xl font-semibold text-foreground">
          Coming Soon
        </h1>
        <p className="mb-2 text-muted-foreground">
          This feature is under development.
        </p>
        <p className="text-sm text-muted-foreground">
          We're working hard to bring you this functionality soon!
        </p>
      </div>
    </div>
  );
}
