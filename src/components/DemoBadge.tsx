// A small fixed badge shown on the public demo, so visitors know this is a live,
// read-only sample of COS — not their own workspace. No "exit" door here: the
// demo IS the public experience; the real account is reached privately (?me=1).
export function DemoBadge() {
  return (
    <div className="cos-demo-badge" role="status" aria-label="Live demo">
      <span className="cos-demo-dot" />
      <span className="cos-demo-text">
        Live demo of <strong>COS</strong> · sample data, read-only
      </span>
    </div>
  );
}
