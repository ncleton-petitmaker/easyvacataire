"use client";

export default function Error({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h2 style={{ color: "#ff6b6b" }}>Erreur</h2>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd" }}>
        {error.message}
      </pre>
      <pre style={{ whiteSpace: "pre-wrap", background: "#f5f5f5", padding: "1rem", borderRadius: "8px", border: "1px solid #ddd", marginTop: "0.5rem", fontSize: "12px", color: "#888" }}>
        {error.stack}
      </pre>
      <button
        onClick={() => window.location.reload()}
        style={{ marginTop: "1rem", padding: "0.5rem 1rem", background: "#4243C4", color: "white", border: "none", borderRadius: "6px", cursor: "pointer" }}
      >
        Recharger
      </button>
    </div>
  );
}
