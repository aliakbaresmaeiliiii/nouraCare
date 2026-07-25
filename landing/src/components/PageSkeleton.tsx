"use client";

/** Full-page skeleton shown while the landing shell hydrates */
export function PageSkeleton() {
  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading…</span>

      {/* Header */}
      <div className="page-skeleton__header">
        <div className="container-page flex h-full items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="skel size-9 rounded-lg" />
            <div className="skel h-5 w-20 rounded-md" />
          </div>
          <div className="hidden items-center gap-2 xl:flex">
            <div className="skel h-4 w-14 rounded-full" />
            <div className="skel h-4 w-16 rounded-full" />
            <div className="skel h-4 w-14 rounded-full" />
            <div className="skel h-4 w-12 rounded-full" />
          </div>
          <div className="skel h-9 w-24 rounded-full" />
        </div>
      </div>

      <div className="container-page pt-[calc(var(--header-h)+1.5rem)]">
        {/* Hero */}
        <div className="grid items-center gap-8 pb-10 lg:grid-cols-2 lg:gap-14">
          <div className="space-y-4 text-center lg:text-start">
            <div className="skel mx-auto h-10 w-[90%] max-w-md rounded-xl lg:mx-0" />
            <div className="skel mx-auto h-10 w-[70%] max-w-sm rounded-xl lg:mx-0" />
            <div className="skel mx-auto mt-2 h-4 w-full max-w-md rounded-md lg:mx-0" />
            <div className="skel mx-auto h-4 w-[85%] max-w-sm rounded-md lg:mx-0" />
            <div className="mt-6 flex justify-center gap-3 lg:justify-start">
              <div className="skel h-11 w-36 rounded-full" />
              <div className="skel size-11 rounded-full" />
            </div>
          </div>
          <div className="mx-auto w-full max-w-[280px] sm:max-w-[320px]">
            <div className="skel aspect-square w-full rounded-[1.75rem] sm:rounded-[42%_58%_52%_48%/52%_42%_58%_48%]" />
          </div>
        </div>

        {/* About strip */}
        <div className="grid items-center gap-8 py-10 lg:grid-cols-2 lg:gap-14">
          <div className="order-2 mx-auto w-full max-w-[240px] lg:order-1 lg:max-w-[280px]">
            <div className="skel aspect-square w-full rounded-[1.75rem]" />
          </div>
          <div className="order-1 space-y-3 text-center lg:order-2 lg:text-start">
            <div className="skel mx-auto h-8 w-56 rounded-lg lg:mx-0" />
            <div className="skel mx-auto h-4 w-full max-w-md rounded-md lg:mx-0" />
            <div className="skel mx-auto h-4 w-[90%] max-w-sm rounded-md lg:mx-0" />
            <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
              <div className="skel h-20 rounded-2xl" />
              <div className="skel h-20 rounded-2xl" />
              <div className="skel h-20 rounded-2xl" />
            </div>
          </div>
        </div>

        {/* Features cards */}
        <div className="space-y-6 py-8">
          <div className="mx-auto max-w-md space-y-3 text-center">
            <div className="skel mx-auto h-8 w-64 rounded-lg" />
            <div className="skel mx-auto h-4 w-full rounded-md" />
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="soft-card overflow-hidden !p-0">
                <div className="skel aspect-square w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <div className="skel size-9 rounded-xl" />
                  <div className="skel h-5 w-28 rounded-md" />
                  <div className="skel h-3 w-full rounded-md" />
                  <div className="skel h-3 w-[80%] rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
