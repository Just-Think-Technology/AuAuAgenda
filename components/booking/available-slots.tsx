import type { DateKey } from "@/lib/domain/time-zone";
import { formatDateKey, formatTime } from "@/lib/format";
import { getAvailableSlots } from "@/lib/use-cases/booking/available-slots";

import { SlotPickerForm } from "./slot-picker-form";

/** Server-computed slots for the chosen day, handed to the client form as plain options. */
export async function AvailableSlots({
	mode,
	dateKey,
	durationMinutes,
	hiddenFields,
	excludeId,
	defaultNotes,
}: {
	mode: "create" | "reschedule";
	dateKey: DateKey;
	durationMinutes: number;
	hiddenFields: Record<string, string>;
	excludeId?: number;
	defaultNotes?: string | null;
}) {
	const { slots, timeZone } = await getAvailableSlots({ dateKey, durationMinutes, excludeId });

	if (slots.length === 0) {
		return (
			<p className="rounded-[12px] border border-dashed bg-white px-4 py-6 text-center text-sm text-muted-foreground">
				Não há horários livres em {formatDateKey(dateKey)}. Tente outro dia.
			</p>
		);
	}

	return (
		<div className="space-y-3">
			<p className="text-sm text-muted-foreground">
				Horários livres em {formatDateKey(dateKey)}, no horário local do pet shop.
			</p>
			<SlotPickerForm
				mode={mode}
				hiddenFields={hiddenFields}
				defaultNotes={defaultNotes}
				slots={slots.map((slot) => ({
					value: slot.startsAt.toISOString(),
					label: formatTime(slot.startsAt, timeZone),
					freeStations: slot.freeStations,
				}))}
			/>
		</div>
	);
}
