import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { isMocksEnabled } from "@/lib/config/mocks";
import { findActiveAdminIdentity, findActiveClientIdentity } from "@/lib/dal/accounts";
import { PHONE_ACCOUNT_NAME } from "@/lib/domain/account-id";
import { readAdminSession, readClientSession } from "@/lib/server/session";
import type { AuthUser } from "@/lib/types";

export const CUSTOMER_HOME = "/cliente";
export const MANAGEMENT_HOME = "/gestao";
export const MANAGEMENT_LOGIN = "/gestao/entrar";

export function homeFor(user: Pick<AuthUser, "role">): string {
	return user.role === "admin" ? MANAGEMENT_HOME : CUSTOMER_HOME;
}

/** Customer re-checked against the database once per request. Ignores the admin cookie. */
export const getCurrentUser = cache(async (): Promise<Extract<AuthUser, { role: "client" }> | null> => {
	const claims = await readClientSession();
	if (!claims) return null;
	if (isMocksEnabled()) {
		return {
			role: "client",
			cpf: claims.cpf,
			name: claims.name ?? PHONE_ACCOUNT_NAME,
			email: claims.email ?? null,
		};
	}
	const client = await findActiveClientIdentity(claims.cpf);
	if (!client || client.session_version !== claims.sv) return null;
	return { role: "client", cpf: client.cpf, name: client.name, email: client.email };
});

/** Admin re-checked against the database once per request. Ignores the customer cookie. */
export const getCurrentAdmin = cache(async (): Promise<Extract<AuthUser, { role: "admin" }> | null> => {
	const claims = await readAdminSession();
	if (!claims) return null;
	if (isMocksEnabled()) {
		if (!claims.name || !claims.email) return null;
		return { role: "admin", admin_id: claims.admin_id, name: claims.name, email: claims.email };
	}
	const admin = await findActiveAdminIdentity(claims.admin_id);
	if (!admin || admin.session_version !== claims.sv) return null;
	return { role: "admin", admin_id: admin.admin_id, name: admin.name, email: admin.email };
});

export async function requireClient(): Promise<Extract<AuthUser, { role: "client" }>> {
	const user = await getCurrentUser();
	if (!user) redirect("/session/expired");
	return user;
}

/** Valid admin cookie required. Otherwise redirect to /gestao/entrar. */
export async function requireAdmin(): Promise<Extract<AuthUser, { role: "admin" }>> {
	const admin = await getCurrentAdmin();
	if (!admin) redirect(MANAGEMENT_LOGIN);
	return admin;
}
