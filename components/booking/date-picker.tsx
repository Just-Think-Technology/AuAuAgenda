import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BOOKING_WINDOW_DAYS, type OpeningDay } from "@/lib/domain/availability";
import { addDays, weekdayOf, type DateKey } from "@/lib/domain/time-zone";
import { formatDateKey } from "@/lib/format";
import { cn } from "@/lib/utils";

const QUICK_DAYS = 14;

/** Day shortcuts plus a native date field; both navigate with query params so slots render on the server. */
export function DatePicker({
	today,
	selected,
	openingHours,
	path,
	params,
}: {
	today: DateKey;
	selected: DateKey | null;
	openingHours: readonly OpeningDay[];
	path: string;
	params: Record<string, string>;
}) {
	const isOpen = (key: DateKey) =>
		openingHours.some((d) => d.weekday === weekdayOf(key) && !d.isClosed);
	const hrefFor = (key: DateKey) => `${path}?${new URLSearchParams({ ...params, date: key })}`;
	const days = Array.from({ length: QUICK_DAYS }, (_, i) => addDays(today, i));

	return (
		<div className="space-y-4">
			<ul className="flex gap-2 overflow-x-auto pb-1" aria-label="Próximos dias">
				{days.map((key) => {
					const open = isOpen(key);
					const label = formatDateKey(key, "short");
					const classes = cn(
						"flex min-w-20 flex-col items-center rounded-[10px] border bg-white px-3 py-2 text-sm capitalize",
						key === selected && "border-primary ring-1 ring-primary",
						!open && "opacity-50",
					);
					return (
						<li key={key}>
							{open ? (
								<Link
									href={hrefFor(key)}
									scroll={false}
									aria-current={key === selected ? "date" : undefined}
									className={cn(classes, "hover:border-primary")}
								>
									{label}
								</Link>
							) : (
								<span className={classes} aria-disabled>
									{label}
									<span className="text-xs normal-case">fechado</span>
								</span>
							)}
						</li>
					);
				})}
			</ul>

			<form method="get" action={path} className="flex flex-wrap items-end gap-2">
				{Object.entries(params).map(([name, value]) => (
					<input key={name} type="hidden" name={name} value={value} />
				))}
				<div className="flex flex-col gap-1.5">
					<Label htmlFor="date">Outra data</Label>
					<Input
						id="date"
						name="date"
						type="date"
						required
						min={today}
						max={addDays(today, BOOKING_WINDOW_DAYS)}
						defaultValue={selected ?? undefined}
						className="w-48"
					/>
				</div>
				<Button type="submit" variant="outline">
					Ver horários
				</Button>
			</form>
		</div>
	);
}
