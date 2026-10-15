import "server-only";

import { db } from "@/lib/server/db";

/** Credentials are only read for login checks and never leave the server layer. */
export async function findClientCredentialsByEmail(email: string) {
	return db.client.findFirst({
		where: { email: { equals: email, mode: "insensitive" }, deleted_at: null },
		select: { cpf: true, name: true, email: true, password: true },
	});
}

export async function findAdminCredentialsByEmail(email: string) {
	return db.admin.findFirst({
		where: { email: { equals: email, mode: "insensitive" }, deleted_at: null },
		select: { admin_id: true, password: true },
	});
}

export async function findActiveClientIdentity(cpf: string) {
	return db.client.findFirst({
		where: { cpf, deleted_at: null },
		select: { cpf: true, name: true, email: true, session_version: true },
	});
}

export async function getClientSessionVersion(cpf: string): Promise<number | null> {
	const row = await db.client.findFirst({
		where: { cpf, deleted_at: null },
		select: { session_version: true },
	});
	return row?.session_version ?? null;
}

export async function bumpClientSessionVersion(cpf: string): Promise<number | null> {
	const row = await db.client.updateMany({
		where: { cpf, deleted_at: null },
		data: { session_version: { increment: 1 }, updated_at: new Date() },
	});
	if (row.count !== 1) return null;
	return getClientSessionVersion(cpf);
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
		select: { cpf: true },
	});
}

export async function findClientByCpf(cpf: string) {
	return db.client.findUnique({ where: { cpf }, select: { cpf: true } });
}

/** Includes soft-deleted rows: the e-mail unique constraint does too. */
export async function findClientByEmail(email: string) {
	return db.client.findFirst({
		where: { email: { equals: email, mode: "insensitive" } },
		select: { cpf: true },
	});
}

export async function findActiveAdminIdentity(adminId: string) {
	return db.admin.findFirst({
		where: { admin_id: adminId, deleted_at: null },
		select: { admin_id: true, name: true, email: true, session_version: true },
	});
}

/** Includes soft-deleted rows so a removed account cannot be re-registered with the same CPF or e-mail. */
export async function findClientConflicts(cpf: string, email: string) {
	const [byCpf, byEmail] = await Promise.all([
		db.client.findUnique({ where: { cpf }, select: { cpf: true } }),
		db.client.findFirst({
			where: { email: { equals: email, mode: "insensitive" } },
			select: { cpf: true },
		}),
	]);
	return { cpfTaken: Boolean(byCpf), emailTaken: Boolean(byEmail) };
}

export async function insertClient(data: {
	cpf: string;
	name: string;
	email: string;
	birthDate: Date;
	passwordHash: string;
	phone: string | null;
}) {
	return db.client.create({
		data: {
			cpf: data.cpf,
			name: data.name,
			email: data.email,
			birth_date: data.birthDate,
			password: data.passwordHash,
			phone: data.phone,
		},
		select: { cpf: true },
	});
}

/** Account opened from a phone number: no e-mail, password, birth date or real CPF. */
export async function insertPhoneClient(data: { cpf: string; name: string; phone: string }) {
	return db.client.create({
		data: {
			cpf: data.cpf,
			name: data.name,
			phone: data.phone,
			email: null,
			password: null,
			birth_date: null,
		},
		select: { cpf: true },
	});
}

export async function findClientProfile(cpf: string) {
	return db.client.findFirst({
		where: { cpf, deleted_at: null },
		select: {
			cpf: true,
			name: true,
			email: true,
			phone: true,
			birth_date: true,
			updated_at: true,
		},
	});
}

export async function updateClientProfile(
	cpf: string,
	data: { name: string; phone: string; email: string | null },
) {
	const result = await db.client.updateMany({
		where: { cpf, deleted_at: null },
		data: { name: data.name, phone: data.phone, email: data.email, updated_at: new Date() },
	});
	return result.count === 1;
}

/**
 * Replaces the account id. Phone-only accounts store an opaque id in `cpf`
 * until the tutor informs a real document number. Relations move with it.
 */
export async function moveClientIdentity(
	from: string,
	to: string,
	data: { name: string; phone: string; email: string | null },
) {
	return db.$transaction(async (tx) => {
		const current = await tx.client.findFirst({
			where: { cpf: from, deleted_at: null },
			select: { password: true, birth_date: true, created_at: true },
		});
		if (!current) return false;

		await tx.client.update({
			where: { cpf: from },
			data: { phone: null, email: null },
		});
		await tx.client.create({
			data: {
				cpf: to,
				name: data.name,
				email: data.email,
				phone: data.phone,
				password: current.password,
				birth_date: current.birth_date,
				created_at: current.created_at,
			},
		});
		await tx.pet.updateMany({ where: { client_cpf: from }, data: { client_cpf: to } });
		await tx.appointment.updateMany({ where: { client_cpf: from }, data: { client_cpf: to } });
		await tx.recipe.updateMany({ where: { client_cpf: from }, data: { client_cpf: to } });
		await tx.password_reset_token.updateMany({
			where: { client_cpf: from },
			data: { client_cpf: to },
		});
		await tx.client.delete({ where: { cpf: from } });
		return true;
	});
}

export async function listClientsWithPets() {
	return db.client.findMany({
		where: { deleted_at: null },
		orderBy: { name: "asc" },
		select: {
			cpf: true,
			name: true,
			email: true,
			phone: true,
			birth_date: true,
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

/** Soft delete keeps appointment history intact. */
export async function softDeleteClient(cpf: string) {
	const now = new Date();
	const result = await db.client.updateMany({
		where: { cpf, deleted_at: null },
		data: { deleted_at: now, updated_at: now },
	});
	return result.count === 1;
}
