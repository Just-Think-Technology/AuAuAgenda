import "server-only";

import { db } from "@/lib/server/db";

export async function findAdminCredentialsByEmail(email: string) {
	return db.admin.findFirst({
		where: { email: { equals: email, mode: "insensitive" }, deleted_at: null },
		select: { admin_id: true, password: true },
	});
}

export async function findActiveClientIdentity(clientId: string) {
	return db.client.findFirst({
		where: { client_id: clientId, deleted_at: null },
		select: { client_id: true, name: true, session_version: true },
	});
}

export async function getClientSessionVersion(clientId: string): Promise<number | null> {
	const row = await db.client.findFirst({
		where: { client_id: clientId, deleted_at: null },
		select: { session_version: true },
	});
	return row?.session_version ?? null;
}

export async function bumpClientSessionVersion(clientId: string): Promise<number | null> {
	const row = await db.client.updateMany({
		where: { client_id: clientId, deleted_at: null },
		data: { session_version: { increment: 1 }, updated_at: new Date() },
	});
	if (row.count !== 1) return null;
	return getClientSessionVersion(clientId);
}

export async function getAdminSessionVersion(adminId: string): Promise<number | null> {
	const row = await db.admin.findFirst({
		where: { admin_id: adminId, deleted_at: null },
		select: { session_version: true },
	});
	return row?.session_version ?? null;
}

export async function bumpAdminSessionVersion(adminId: string): Promise<number | null> {
	const row = await db.admin.updateMany({
		where: { admin_id: adminId, deleted_at: null },
		data: { session_version: { increment: 1 }, updated_at: new Date() },
	});
	if (row.count !== 1) return null;
	return getAdminSessionVersion(adminId);
}

export async function updateAdminPasswordHash(adminId: string, passwordHash: string): Promise<void> {
	await db.admin.updateMany({
		where: { admin_id: adminId, deleted_at: null },
		data: { password: passwordHash, updated_at: new Date() },
	});
}

export async function findActiveClientByPhone(phone: string) {
	return db.client.findFirst({
		where: { phone, deleted_at: null },
		select: { client_id: true },
	});
}

export async function findActiveAdminIdentity(adminId: string) {
	return db.admin.findFirst({
		where: { admin_id: adminId, deleted_at: null },
		select: { admin_id: true, name: true, email: true, session_version: true },
	});
}

/** Account opened from a phone number. The tutor sets a name later. */
export async function insertPhoneClient(data: { name: string; phone: string }) {
	return db.client.create({
		data: {
			name: data.name,
			phone: data.phone,
		},
		select: { client_id: true },
	});
}

/** Account created by the shop. The tutor signs in with the phone. */
export async function insertClient(data: { name: string; phone: string }) {
	return db.client.create({
		data: {
			name: data.name,
			phone: data.phone,
		},
		select: { client_id: true },
	});
}

export async function findClientProfile(clientId: string) {
	return db.client.findFirst({
		where: { client_id: clientId, deleted_at: null },
		select: {
			client_id: true,
			name: true,
			phone: true,
			updated_at: true,
		},
	});
}

export async function updateClientProfile(clientId: string, data: { name: string; phone: string }) {
	const result = await db.client.updateMany({
		where: { client_id: clientId, deleted_at: null },
		data: { name: data.name, phone: data.phone, updated_at: new Date() },
	});
	return result.count === 1;
}

export async function listClientsWithPets() {
	return db.client.findMany({
		where: { deleted_at: null },
		orderBy: { name: "asc" },
		select: {
			client_id: true,
			name: true,
			phone: true,
			pet: {
				where: { deleted_at: null },
				orderBy: { name: "asc" },
				select: {
					pet_id: true,
					name: true,
					size: true,
					sex: true,
					birth_date: true,
					notes: true,
					image_url: true,
					species: { select: { name: true } },
					breed: { select: { name: true } },
				},
			},
		},
	});
}

/**
 * Soft-deletes the account and everything that belongs to it.
 * Rows stay in the database; active queries ignore `deleted_at`.
 * The session version changes so an existing cookie stops working.
 */
export async function softDeleteClient(clientId: string) {
	const now = new Date();
	return db.$transaction(async (tx) => {
		const pets = await tx.pet.findMany({
			where: { client_id: clientId },
			select: { pet_id: true },
		});
		const petIds = pets.map((pet) => pet.pet_id);
		const result = await tx.client.updateMany({
			where: { client_id: clientId, deleted_at: null },
			data: {
				deleted_at: now,
				updated_at: now,
				session_version: { increment: 1 },
			},
		});
		if (result.count !== 1) return false;

		if (petIds.length > 0) {
			await tx.pet.updateMany({
				where: { pet_id: { in: petIds }, deleted_at: null },
				data: { deleted_at: now, updated_at: now },
			});
		}
		await tx.appointment.updateMany({
			where: {
				deleted_at: null,
				OR: [{ client_id: clientId }, ...(petIds.length > 0 ? [{ pet_id: { in: petIds } }] : [])],
			},
			data: { deleted_at: now, updated_at: now },
		});
		return true;
	});
}
