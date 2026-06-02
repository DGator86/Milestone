"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 24, fontFamily: "system-ui, sans-serif", background: "#07111F", color: "#fff", minHeight: "100vh" }}>
        <div style={{ maxWidth: 540, margin: "60px auto" }}>
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#EA4335", marginBottom: 16, wordBreak: "break-all" }}>
            {error?.message || "Unknown error"}
          </p>
          {error?.digest && (
            <p style={{ fontSize: 12, color: "#8899aa", marginBottom: 16 }}>
              Digest: {error.digest}
            </p>
          )}
          <pre style={{ fontSize: 11, color: "#88aacc", whiteSpace: "pre-wrap", wordBreak: "break-all", background: "#0d1f36", padding: 12, borderRadius: 8, marginBottom: 20 }}>
            {error?.stack || "No stack trace"}
          </pre>
          <button
            onClick={reset}
            style={{ padding: "10px 20px", background: "#1769FF", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 14, fontWeight: 600 }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
