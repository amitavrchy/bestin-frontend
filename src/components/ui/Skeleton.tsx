/** Placeholder for content whose dimensions are not known yet. */
export function Skeleton({ label = "Loading" }: { label?: string }) {
  return (
    <div className="skeleton-grid" role="status" aria-label={label}>
      {[0, 1, 2, 3].map((item) => (
        <div className="skeleton-card" key={item}>
          <div />
          <span />
          <span />
        </div>
      ))}
    </div>
  );
}
