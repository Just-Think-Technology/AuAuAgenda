import "server-only";

import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

/** Customer session. Name kept from the previous app so existing client sessions stay valid. */
export const CLIENT_COOKIE = "pet-connect:token";
/** Management session. Independent from the customer cookie. */
export const ADMIN_COOKIE = "pet-connect:admin";

const CLIENT_TTL_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_TTL_SECONDS = 60 * 60 * 24;

export type ClientClaims = { role: "client"; cpf: string; sv: number; name?: string; email?: string | null };
export type AdminClaims = { role: "admin"; admin_id: string; sv: number; name?: string; email?: string };

function secret(): string {
	const value = process.env.JWT_SECRET;
	if (!value) throw new Error("JWT_SECRET is not configured.");
	return value;
}

function cookieOptions(maxAge: number) {
	return {
		httpOnly: true,
		secure: process.env.NODE_ENV === "production",
		sameSite: "lax" as const,
		path: "/",
		maxAge,
	};
}

function readVerified<T>(token: string | undefined, accept: (payload: jwt.JwtPayload) => T | null): T | null {
	if (!token) return null;
	try {
		const payload = jwt.verify(token, secret(), { algorithms: ["HS256"] });
		if (typeof payload !== "object" || payload === null) return null;
		return accept(payload);
	} catch {
		return null;
	}
}

function sessionVersion(payload: jwt.JwtPayload): number | null {
	if (typeof payload.sv !== "number" || !Number.isInteger(payload.sv) || payload.sv < 0) return null;
	return payload.sv;
}

export async function createClientSession(
	cpf: string,
	sessionVersion: number,
	profile?: { name: string; email?: string | null },
): Promise<void> {
	const token = jwt.sign(
		{
			role: "client",
			cpf,
			sv: sessionVersion,
			...(profile && { name: profile.name, email: profile.email ?? null }),
		} satisfies ClientClaims,
		secret(),
		{ expiresIn: CLIENT_TTL_SECONDS, algorithm: "HS256" },
	);
	const cookieStore = await cookies();
	cookieStore.set(CLIENT_COOKIE, token, cookieOptions(CLIENT_TTL_SECONDS));
}

export async function createAdminSession(
	adminId: string,
	sessionVersion: number,
	profile?: { name: string; email: string },
): Promise<void> {
	const token = jwt.sign(
		{
			role: "admin",
			admin_id: adminId,
			sv: sessionVersion,
			...(profile && { name: profile.name, email: profile.email }),
		} satisfies AdminClaims,
		secret(),
		{ expiresIn: ADMIN_TTL_SECONDS, algorithm: "HS256" },
	);
	const cookieStore = await cookies();
	cookieStore.set(ADMIN_COOKIE, token, cookieOptions(ADMIN_TTL_SECONDS));
}

export async function deleteClientSession(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(CLIENT_COOKIE);
}

export async function deleteAdminSession(): Promise<void> {
	const cookieStore = await cookies();
	cookieStore.delete(ADMIN_COOKIE);
}

/** Client claims, or `null` when the cookie is absent, expired or tampered. */
export async function readClientSession(): Promise<ClientClaims | null> {
	const cookieStore = await cookies();
	return readVerified(cookieStore.get(CLIENT_COOKIE)?.value, (payload) => {
		const sv = sessionVersion(payload);
		if (payload.role === "client" && typeof payload.cpf === "string" && sv !== null) {
			return {
				role: "client",
				cpf: payload.cpf,
				sv,
				...(typeof payload.name === "string" && { name: payload.name }),
				...(payload.email === null || typeof payload.email === "string"
					? { email: payload.email as string | null }
					: {}),
			};
		}
		return null;
	});
}

/** Admin claims, or `null` when the cookie is absent, expired or tampered. */
export async function readAdminSession(): Promise<AdminClaims | null> {
	const cookieStore = await cookies();
	return readVerified(cookieStore.get(ADMIN_COOKIE)?.value, (payload) => {
		const sv = sessionVersion(payload);
		if (payload.role === "admin" && typeof payload.admin_id === "string" && sv !== null) {
			return {
				role: "admin",
				admin_id: payload.admin_id,
				sv,
				...(typeof payload.name === "string" && { name: payload.name }),
				...(typeof payload.email === "string" && { email: payload.email }),
			};
		}
		return null;
	});
}
