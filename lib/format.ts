import { formatMinuteOfDay, parseDateKey, type DateKey } from "@/lib/domain/time-zone";

/** Display helpers for pt-BR; every instant is shown in the shop time zone. */

export function formatTime(instant: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		timeZone,
		hour: "2-digit",
		minute: "2-digit",
	}).format(instant);
}

export function formatDateTime(instant: Date, timeZone: string): string {
	return new Intl.DateTimeFormat("pt-BR", {
		timeZone,
		weekday: "short",
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	}).format(instant);
}

/** Formats a local calendar day without shifting it through the server time zone. */
export function formatDateKey(key: DateKey, style: "long" | "short" = "long"): string {
	const parts = parseDateKey(key);
	if (!parts) return key;
	const utcNoon = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
	return new Intl.DateTimeFormat("pt-BR", {
		timeZone: "UTC",
		...(style === "long"
			? { weekday: "long", day: "2-digit", month: "long", year: "numeric" }
			: { weekday: "short", day: "2-digit", month: "2-digit" }),
	}).format(utcNoon);
}

export function formatPrice(cents: number | null): string {
	if (cents === null) return "Sob consulta";
	return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

export function formatDuration(minutes: number): string {
	const hours = Math.floor(minutes / 60);
	const rest = minutes % 60;
	if (hours === 0) return `${rest} min`;
	return rest === 0 ? `${hours} h` : `${hours} h ${rest} min`;
}

export function formatPhone(digits: string | null): string {
	if (!digits) return "—";
	if (digits.length === 11) return digits.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
	if (digits.length === 10) return digits.replace(/(\d{2})(\d{4})(\d{4})/, "($1) $2-$3");
	return digits;
}

export function formatOpeningRange(open: number | null, close: number | null): string {
	if (open === null || close === null) return "Fechado";
	return `${formatMinuteOfDay(open)} às ${formatMinuteOfDay(close)}`;
}

/** Age from a calendar birth date stored at UTC midnight. */
export function formatAge(birthDate: Date | null, now: Date = new Date()): string {
	if (!birthDate) return "Não informada";
	let months =
		(now.getUTCFullYear() - birthDate.getUTCFullYear()) * 12 +
		(now.getUTCMonth() - birthDate.getUTCMonth());
	if (now.getUTCDate() < birthDate.getUTCDate()) months -= 1;
	if (months < 1) return "Menos de 1 mês";
	const years = Math.floor(months / 12);
	const rest = months % 12;
	const y = years > 0 ? `${years} ano${years > 1 ? "s" : ""}` : "";
	const m = rest > 0 ? `${rest} ${rest > 1 ? "meses" : "mês"}` : "";
	return [y, m].filter(Boolean).join(" e ");
}

/** `YYYY-MM-DD` value for a date input from a date stored at UTC midnight. */
export function dateInputValue(date: Date | null): string {
	return date ? date.toISOString().slice(0, 10) : "";
}

/** Price as typed in a form field, e.g. 4990 → "49,90". */
export function priceInputValue(cents: number | null): string {
	return cents === null ? "" : (cents / 100).toFixed(2).replace(".", ",");
}
