"use client";

import { useActionState, useState } from "react";

import { saveShopSettingsAction } from "@/app/actions/shop-settings";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import type { OpeningDay } from "@/lib/domain/availability";
import { formatMinuteOfDay } from "@/lib/domain/time-zone";

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
const TIME_ZONES = [
	"America/Sao_Paulo",
	"America/Bahia",
	"America/Fortaleza",
	"America/Recife",
	"America/Belem",
	"America/Manaus",
	"America/Cuiaba",
	"America/Campo_Grande",
	"America/Porto_Velho",
	"America/Boa_Vista",
	"America/Rio_Branco",
	"America/Noronha",
];

export type ShopSettingsValues = {
	name: string;
	timeZone: string;
	capacity: number;
	slotIntervalMinutes: number;
	openingHours: OpeningDay[];
};

function timeValue(minute: number | null, fallback: string): string {
	if (minute === null) return fallback;
	return minute === 1440 ? "23:59" : formatMinuteOfDay(minute);
}

function DayRow({ day }: { day: OpeningDay }) {
	const [open, setOpen] = useState(!day.isClosed);
	const w = day.weekday;
	return (
		<div className="grid grid-cols-[6.5rem_minmax(0,1fr)] items-center gap-3 sm:grid-cols-[8rem_auto_1fr]">
			<label className="flex items-center gap-2 text-sm font-medium">
				<input
					type="checkbox"
					name={`open_${w}`}
					checked={open}
					onChange={(e) => setOpen(e.target.checked)}
					className="accent-primary"
				/>
				{WEEKDAYS[w]}
			</label>
			<div className="flex min-w-0 items-center gap-2">
				<Input
					aria-label={`Abertura de ${WEEKDAYS[w]}`}
					type="time"
					name={`start_${w}`}
					step={300}
					required={open}
					disabled={!open}
					defaultValue={timeValue(day.openMinute, "09:00")}
					className="min-w-0 flex-1 sm:w-32 sm:flex-none"
				/>
				<span className="text-sm text-muted-foreground">às</span>
				<Input
					aria-label={`Fechamento de ${WEEKDAYS[w]}`}
					type="time"
					name={`end_${w}`}
					step={300}
					required={open}
					disabled={!open}
					defaultValue={timeValue(day.closeMinute, "18:00")}
					className="min-w-0 flex-1 sm:w-32 sm:flex-none"
				/>
			</div>
			{!open && <span className="col-span-2 text-sm text-muted-foreground sm:col-span-1">Fechado</span>}
		</div>
	);
}

export function ShopSettingsForm({ settings }: { settings: ShopSettingsValues }) {
	const [state, formAction, isPending] = useActionState(saveShopSettingsAction, undefined);
	useActionFeedback(state);
	const zones = TIME_ZONES.includes(settings.timeZone) ? TIME_ZONES : [settings.timeZone, ...TIME_ZONES];

	return (
		<form action={formAction} className="space-y-10">
			<PageHeader title="Configurações do pet shop" description="Regras usadas para calcular os horários livres." />

			<section className="grid max-w-3xl gap-4 sm:grid-cols-2" aria-label="Dados gerais">
				<Field htmlFor="shop-name" label="Nome do pet shop" className="sm:col-span-2">
					<Input id="shop-name" name="name" required maxLength={120} defaultValue={settings.name} />
				</Field>
				<Field htmlFor="shop-tz" label="Fuso horário">
					<NativeSelect id="shop-tz" name="time_zone" defaultValue={settings.timeZone}>
						{zones.map((zone) => (
							<option key={zone} value={zone}>
								{zone.replace("America/", "").replace("_", " ")}
							</option>
						))}
					</NativeSelect>
				</Field>
				<Field
					htmlFor="shop-capacity"
					label="Estações simultâneas"
					hint="Quantos pets podem ser atendidos ao mesmo tempo."
				>
					<Input id="shop-capacity" name="capacity" type="number" min={1} max={50} required defaultValue={settings.capacity} />
				</Field>
				<Field htmlFor="shop-interval" label="Intervalo entre horários" hint="De quanto em quanto tempo um horário começa.">
					<NativeSelect id="shop-interval" name="slot_interval_minutes" defaultValue={String(settings.slotIntervalMinutes)}>
						{[10, 15, 20, 30, 60].map((minutes) => (
							<option key={minutes} value={minutes}>
								{minutes} minutos
							</option>
						))}
					</NativeSelect>
				</Field>
			</section>

			<fieldset className="max-w-3xl space-y-3">
				<legend className="mb-3 text-lg font-semibold tracking-tight">Expediente</legend>
				{Array.from({ length: 7 }, (_, weekday) => {
					const day = settings.openingHours.find((d) => d.weekday === weekday) ?? {
						weekday,
						isClosed: true,
						openMinute: null,
						closeMinute: null,
					};
					return <DayRow key={weekday} day={day} />;
				})}
			</fieldset>

			<Button type="submit" disabled={isPending}>
				{isPending ? "Salvando…" : "Salvar configurações"}
			</Button>
		</form>
	);
}
