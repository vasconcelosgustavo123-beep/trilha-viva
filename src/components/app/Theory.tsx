/** Minimal markdown: paragraphs, **bold**, "- " lists. Rendered as React nodes (no HTML injection). */
export function Theory({ text }: { text: string }) {
  const blocks = text.split(/\n{2,}/);
  const inline = (s: string) => s.split(/(\*\*[^*]+\*\*)/g).map((p, i) => (p.startsWith("**") ? <strong key={i}>{p.slice(2, -2)}</strong> : p));
  return (
    <div className="space-y-3 leading-relaxed">
      {blocks.map((b, i) => {
        const lines = b.split("\n");
        if (lines.every((l) => /^(- |\d+\. )/.test(l)))
          return <ul key={i} className="list-disc space-y-1 pl-6">{lines.map((l, j) => <li key={j}>{inline(l.replace(/^(- |\d+\. )/, ""))}</li>)}</ul>;
        return <p key={i}>{lines.map((l, j) => <span key={j}>{inline(l)}{j < lines.length - 1 && <br />}</span>)}</p>;
      })}
    </div>
  );
}
