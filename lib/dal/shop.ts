import "server-only";

import type { OpeningDay } from "@/lib/domain/availability";
import { db, type Tx } from "@/lib/server/db";

export type ShopSettings = {
	name: string;
	timeZone: string;
	capacity: number;
	slotIntervalMinutes: number;
	openingHours: OpeningDay[];
};

const FALLBACK_NAME = "AuAu Agenda";
const FALLBACK_TIME_ZONE = "America/Sao_Paulo";

export async function getShopSettings(tx: Tx = db): Promise<ShopSettings> {
	const [settings, hours] = await Promise.all([
		tx.shop_settings.findUnique({
			where: { shop_settings_id: 1 },
			select: { name: true, time_zone: true, capacity: true, slot_interval_minutes: true },
		}),
		tx.opening_hours.findMany({ orderBy: { weekday: "asc" } }),
	]);

	return {
		name: settings?.name ?? FALLBACK_NAME,
		timeZone: settings?.time_zone ?? FALLBACK_TIME_ZONE,
		capacity: settings?.capacity ?? 1,
		slotIntervalMinutes: settings?.slot_interval_minutes ?? 30,
		openingHours: hours.map((h) => ({
			weekday: h.weekday,
			isClosed: h.is_closed,
			openMinute: h.open_minute,
			closeMinute: h.close_minute,
		})),
	};
}

export async function saveShopSettings(
	tx: Tx,
	input: Omit<ShopSettings, "openingHours"> & { openingHours: OpeningDay[] },
): Promise<void> {
	const settings = {
		name: input.name,
		time_zone: input.timeZone,
		capacity: input.capacity,
		slot_interval_minutes: input.slotIntervalMinutes,
		updated_at: new Date(),
	};
	await tx.shop_settings.upsert({
		where: { shop_settings_id: 1 },
		create: { shop_settings_id: 1, ...settings },
		update: settings,
	});
	for (const day of input.openingHours) {
		const columns = {
			is_closed: day.isClosed,
			open_minute: day.isClosed ? null : day.openMinute,
			close_minute: day.isClosed ? null : day.closeMinute,
			updated_at: new Date(),
		};
		await tx.opening_hours.upsert({
			where: { weekday: day.weekday },
			create: { weekday: day.weekday, ...columns },
			update: columns,
		});
	}
}
