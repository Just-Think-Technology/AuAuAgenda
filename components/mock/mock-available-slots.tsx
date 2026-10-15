"use client";

import type { DateKey } from "@/lib/domain/time-zone";
import { formatDateKey, formatTime } from "@/lib/format";
import { useMockStore } from "@/lib/mock/context";
import { getAvailableSlots } from "@/lib/mock/operations";

import { SlotPickerForm } from "../booking/slot-picker-form";

export function MockAvailableSlots({
	mode,
	clientCpf,
	dateKey,
	durationMinutes,
	hiddenFields,
	excludeId,
	defaultNotes,
}: {
	mode: "create" | "reschedule";
	clientCpf: string;
	dateKey: DateKey;
	durationMinutes: number;
	hiddenFields: Record<string, string>;
	excludeId?: number;
	defaultNotes?: string | null;
}) {
	const { store } = useMockStore();
	const { slots, timeZone } = getAvailableSlots(store, { dateKey, durationMinutes, excludeId });

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
				clientCpf={clientCpf}
				hiddenFields={hiddenFields}
				defaultNotes={defaultNotes}
				excludeId={excludeId}
				slots={slots.map((slot) => ({
					value: slot.startsAt.toISOString(),
					label: formatTime(slot.startsAt, timeZone),
					freeStations: slot.freeStations,
				}))}
			/>
		</div>
	);
}
