import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Label + control + optional hint, stacked. `htmlFor` must match the control id. */
export function Field({
	htmlFor,
	label,
	hint,
	className,
	children,
}: {
	htmlFor: string;
	label: string;
	hint?: string;
	className?: string;
	children: React.ReactNode;
}) {
	return (
		<div className={cn("flex flex-col gap-2", className)}>
			<Label htmlFor={htmlFor}>{label}</Label>
			{children}
			{hint && <p className="text-xs text-muted-foreground">{hint}</p>}
		</div>
	);
}
