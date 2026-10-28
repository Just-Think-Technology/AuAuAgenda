import "server-only";

import type { AppointmentStatus } from "@/lib/domain/appointment-status";
import type { BusyInterval } from "@/lib/domain/availability";
import { db, type Tx } from "@/lib/server/db";

/** New-agenda rows only; legacy clinic appointments have no service. */
const BOOKING = { service_id: { not: null }, deleted_at: null } as const;

const bookingSelect = {
	appointment_id: true,
	starts_at: true,
	ends_at: true,
	status: true,
	station: true,
	notes: true,
	service: { select: { service_id: true, name: true, duration_minutes: true } },
	pet: {
		select: {
			pet_id: true,
			name: true,
			size: true,
			notes: true,
			species: { select: { name: true } },
			breed: { select: { name: true } },
		},
	},
} as const;

type BookingRow = {
	appointment_id: number;
	starts_at: Date | null;
	ends_at: Date | null;
	status: AppointmentStatus | null;
	station: number | null;
	notes: string | null;
	service: { service_id: string; name: string; duration_minutes: number } | null;
	pet: {
		pet_id: string;
		name: string;
		size: "SMALL" | "MEDIUM" | "LARGE" | null;
		notes: string | null;
		species: { name: string } | null;
		breed: { name: string } | null;
	} | null;
};

/** The booking shape check constraint guarantees these columns for service rows. */
function toBooking(row: BookingRow) {
	return {
		id: row.appointment_id,
		startsAt: row.starts_at as Date,
		endsAt: row.ends_at as Date,
		status: row.status as AppointmentStatus,
		station: row.station as number,
		notes: row.notes,
		serviceId: row.service?.service_id ?? "",
		serviceName: row.service?.name ?? "Serviço removido",
		petId: row.pet?.pet_id ?? "",
		petName: row.pet?.name ?? "Pet removido",
		petSize: row.pet?.size ?? null,
		petNotes: row.pet?.notes ?? null,
		speciesName: row.pet?.species?.name ?? null,
		breedName: row.pet?.breed?.name ?? null,
	};
}

export type Booking = ReturnType<typeof toBooking>;

export async function listBusyIntervals(
	tx: Tx,
	range: { start: Date; end: Date },
	excludeId?: number,
): Promise<BusyInterval[]> {
	const rows = await tx.appointment.findMany({
		where: {
			...BOOKING,
			status: { not: "CANCELED" },
			starts_at: { lt: range.end },
			ends_at: { gt: range.start },
			...(excludeId !== undefined && { appointment_id: { not: excludeId } }),
		},
		select: { station: true, starts_at: true, ends_at: true },
	});
	return rows.map((r) => ({
		station: r.station as number,
		startsAt: r.starts_at as Date,
		endsAt: r.ends_at as Date,
	}));
}

export async function insertBooking(
	tx: Tx,
	data: {
		clientId: string;
		petId: string;
		serviceId: string;
		startsAt: Date;
		endsAt: Date;
		station: number;
		notes: string | null;
	},
) {
	return tx.appointment.create({
		data: {
			client_id: data.clientId,
			pet_id: data.petId,
			service_id: data.serviceId,
			starts_at: data.startsAt,
			ends_at: data.endsAt,
			station: data.station,
			status: "SCHEDULED",
			status_updated_at: new Date(),
			notes: data.notes,
		},
		select: { appointment_id: true },
	});
}

export async function findClientBooking(id: number, clientId: string, tx: Tx = db) {
	const row = await tx.appointment.findFirst({
		where: { ...BOOKING, appointment_id: id, client_id: clientId },
		select: bookingSelect,
	});
	return row && toBooking(row);
}

export async function listClientBookings(clientId: string): Promise<Booking[]> {
	const rows = await db.appointment.findMany({
		where: { ...BOOKING, client_id: clientId },
		orderBy: { starts_at: "desc" },
		take: 100,
		select: bookingSelect,
	});
	return rows.map(toBooking);
}

/** Changes status only if it still equals `from`, so concurrent edits are detected. */
export async function updateStatusIfCurrent(
	id: number,
	from: AppointmentStatus,
	to: AppointmentStatus,
	tx: Tx = db,
): Promise<boolean> {
	const now = new Date();
	const result = await tx.appointment.updateMany({
		where: { ...BOOKING, appointment_id: id, status: from },
		data: { status: to, status_updated_at: now, updated_at: now },
	});
	return result.count === 1;
}

export async function findBookingStatus(id: number) {
	const row = await db.appointment.findFirst({
		where: { ...BOOKING, appointment_id: id },
		select: { status: true, starts_at: true },
	});
	return row && { status: row.status as AppointmentStatus, startsAt: row.starts_at as Date };
}

export async function listDayAgenda(filter: {
	start: Date;
	end: Date;
	status: AppointmentStatus | null;
	serviceId: string | null;
}) {
	const rows = await db.appointment.findMany({
		where: {
			...BOOKING,
			starts_at: { gte: filter.start, lt: filter.end },
			...(filter.status && { status: filter.status }),
			...(filter.serviceId && { service_id: filter.serviceId }),
		},
		orderBy: [{ starts_at: "asc" }, { station: "asc" }],
		select: {
			...bookingSelect,
			client: { select: { name: true, phone: true } },
		},
	});
	return rows.map((row) => ({
		...toBooking(row),
		clientName: row.client?.name ?? "—",
		clientPhone: row.client?.phone ?? null,
	}));
}

export type AgendaEntry = Awaited<ReturnType<typeof listDayAgenda>>[number];

export async function hasUpcomingBooking(
	owner: { petId: string } | { clientId: string },
	now: Date,
): Promise<boolean> {
	const count = await db.appointment.count({
		where: {
			...BOOKING,
			...("petId" in owner ? { pet_id: owner.petId } : { client_id: owner.clientId }),
			status: { in: ["SCHEDULED", "CONFIRMED", "IN_SERVICE"] },
			ends_at: { gt: now },
		},
	});
	return count > 0;
}

/** Highest station used by future active bookings; capacity cannot drop below it. */
export async function maxFutureStation(tx: Tx, now: Date): Promise<number> {
	const result = await tx.appointment.aggregate({
		where: {
			...BOOKING,
			status: { in: ["SCHEDULED", "CONFIRMED", "IN_SERVICE"] },
			ends_at: { gt: now },
		},
		_max: { station: true },
	});
	return result._max.station ?? 0;
}
