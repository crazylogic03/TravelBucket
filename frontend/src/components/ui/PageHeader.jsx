export function PageHeader({ title, subtitle, actions }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-8">
      <div>
        <h1 className="text-3xl md:text-4xl font-display font-semibold text-[var(--text-primary)]">
          {title}
        </h1>
        {subtitle && <p className="mt-2 text-[var(--text-secondary)]">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
    </div>
  );
}
