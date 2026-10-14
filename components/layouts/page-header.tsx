export function PageHeader({
	title,
	description,
	actions,
}: {
	title: string;
	description?: React.ReactNode;
	actions?: React.ReactNode;
}) {
	return (
		<header className="flex flex-wrap items-start justify-between gap-4">
			<div className="min-w-0 space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
				{description && <p className="text-muted-foreground">{description}</p>}
			</div>
			{actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
		</header>
	);
}

export function EmptyState({
	title,
	description,
	action,
}: {
	title: string;
	description?: string;
	action?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center justify-center gap-3 rounded-[12px] border border-dashed bg-white px-6 py-12 text-center">
			<p className="text-lg font-semibold text-foreground">{title}</p>
			{description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
			{action}
		</div>
	);
}
