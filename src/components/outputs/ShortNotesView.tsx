export const ShortNotesView = ({ notes }: { notes: string[] }) => (
  <div className="glass-strong p-6 rounded-xl">
    <h3 className="font-display text-lg font-semibold mb-4 text-gradient">Short Notes</h3>
    <ul className="space-y-2.5">
      {notes.map((n, i) => (
        <li key={i} className="flex gap-3 text-foreground/90">
          <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-gradient-to-r from-primary to-primary-glow shrink-0" />
          <span className="leading-relaxed">{n}</span>
        </li>
      ))}
    </ul>
  </div>
);
