"use client";

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ fontFamily: "monospace", padding: "2rem", background: "#1a1a2e", color: "#e0e0e0" }}>
        <h1 style={{ color: "#ff6b6b" }}>Erreur client</h1>
        <pre style={{ whiteSpace: "pre-wrap", background: "#0d0d1a", padding: "1rem", borderRadius: "8px", border: "1px solid #333" }}>
          {error.message}
        </pre>
        <pre style={{ whiteSpace: "pre-wrap", background: "#0d0d1a", padding: "1rem", borderRadius: "8px", border: "1px solid #333", marginTop: "1rem", fontSize: "12px", color: "#888" }}>
          {error.stack}
        </pre>
        <button
          onClick={() => window.location.reload()}
          style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#4243C4", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
        >
          Recharger
        </button>
      </body>
    </html>
  );
}
