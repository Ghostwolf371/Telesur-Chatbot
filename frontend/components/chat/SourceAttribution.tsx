export type SourceItem = {
  id: string;
  title: string;
};

type SourceAttributionProps = {
  sources: SourceItem[];
};

export function SourceAttribution({ sources }: SourceAttributionProps) {
  return (
    <div className="mt-2.5 rounded-xl border border-slate-100 bg-slate-50 p-2.5">
      <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
        Sources
      </p>
      <ul className="mt-1.5 flex flex-wrap gap-1.5">
        {sources.map((source) => (
          <li
            key={source.id}
            className="rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600"
          >
            {source.title}
          </li>
        ))}
      </ul>
    </div>
  );
}
