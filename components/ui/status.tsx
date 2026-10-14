import { cva } from "class-variance-authority";
import {
	BanIcon,
	CalendarCheckIcon,
	CheckIcon,
	ClockIcon,
	ScissorsIcon,
	UserXIcon,
} from "lucide-react";

import { STATUS_LABELS, type AppointmentStatus } from "@/lib/domain/appointment-status";
import { cn } from "@/lib/utils";

const statusVariants = cva(
	"inline-flex border-[0.5px] items-center gap-1.5 rounded-sm px-2 py-0.5 text-sm select-none whitespace-nowrap",
	{
		variants: {
			status: {
				SCHEDULED: "bg-orange-100 text-orange-800 border-orange-200",
				CONFIRMED: "bg-blue-100 text-blue-800 border-blue-200",
				IN_SERVICE: "bg-violet-100 text-violet-800 border-violet-200",
				COMPLETED: "bg-green-100 text-green-800 border-green-200",
				CANCELED: "bg-neutral-100 text-neutral-600 border-neutral-200",
				NO_SHOW: "bg-red-100 text-red-800 border-red-200",
			},
		},
	},
);

const ICONS = {
	SCHEDULED: ClockIcon,
	CONFIRMED: CalendarCheckIcon,
	IN_SERVICE: ScissorsIcon,
	COMPLETED: CheckIcon,
	CANCELED: BanIcon,
	NO_SHOW: UserXIcon,
} as const;

export function Status({ status, className }: { status: AppointmentStatus; className?: string }) {
	const Icon = ICONS[status];
	return (
		<span className={cn(statusVariants({ status }), className)}>
			<Icon className="size-3.5" aria-hidden />
			<span>{STATUS_LABELS[status]}</span>
		</span>
	);
}
