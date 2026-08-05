/**
 * A hairline that fills while the next route streams in.
 *
 * Deliberately *not* mounted at `[locale]/loading.tsx`. A `loading` file wraps
 * every descendant in a Suspense boundary, and once a boundary starts streaming
 * the response has already been committed as `200` — so `notFound()` in a page
 * below it could no longer set a real `404`. Mounting it per-segment keeps the
 * indicator on the list views that benefit from it while leaving the routes
 * that resolve a record (product, collection, order, the catch-all) able to
 * answer with a proper status. See `next/dist/docs/.../loading#status-codes`.
 */
export function RouteLoading() {
  return (
    <div className="container-x py-32">
      <div className="h-px w-full overflow-hidden bg-line">
        <div className="h-px w-1/3 animate-marquee bg-accent" />
      </div>
    </div>
  );
}
