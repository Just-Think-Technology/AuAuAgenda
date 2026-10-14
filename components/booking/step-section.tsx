import Link from "next/link";
import { CheckIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export function StepSection({
	step,
	title,
	children,
}: {
	step: number;
	title: string;
	children: React.ReactNode;
}) {
	const id = `etapa-${step}`;
	return (
		<section aria-labelledby={id} className="space-y-3">
			<h2 id={id} className="flex items-center gap-2 text-lg font-semibold tracking-tight">
				<span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
					{step}
				</span>
				{title}
			</h2>
			{children}
		</section>
	);
}

/** Selectable option rendered as a link; unavailable options explain why. */
export function ChoiceLink({
	href,
	selected,
	title,
	details,
	unavailableReason,
}: {
	href: string;
	selected: boolean;
	title: string;
	details?: string;
	unavailableReason?: string | null;
}) {
	const body = (
		<>
			<span className="flex items-center justify-between gap-2 font-medium text-foreground">
				{title}
				{selected && <CheckIcon className="size-4 text-primary" aria-hidden />}
			</span>
			{details && <span className="text-sm text-muted-foreground">{details}</span>}
			{unavailableReason && <span className="text-sm text-amber-800">{unavailableReason}</span>}
		</>
	);
	const base = "flex flex-col gap-1 rounded-[12px] border bg-white p-3 text-left";

	if (unavailableReason) {
		return (
			<div aria-disabled className={cn(base, "opacity-70")}>
				{body}
			</div>
		);
	}
	return (
		<Link
			href={href}
			scroll={false}
			aria-current={selected ? "true" : undefined}
			className={cn(
				base,
				"transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-primary",
				selected && "border-primary ring-1 ring-primary",
			)}
		>
			{body}
		</Link>
	);
}

export function ChoiceGrid({ children }: { children: React.ReactNode }) {
	return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}
