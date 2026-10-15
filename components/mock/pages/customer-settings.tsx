"use client";

import { ProfileSettingsForm } from "@/components/customer/profile-settings-form";
import { isValidCpf } from "@/lib/domain/cpf";
import { useMockStore } from "@/lib/mock/context";
import type { AuthUser } from "@/lib/types";

export function MockCustomerSettings({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const profile = store.clients.find((c) => c.cpf === user.cpf && !c.deletedAt);
	if (!profile) return null;

	return (
		<ProfileSettingsForm
			key={profile.updatedAt}
			clientCpf={user.cpf}
			profile={{
				name: profile.name,
				email: profile.email,
				phone: profile.phone,
				cpf: isValidCpf(profile.cpf) ? profile.cpf : null,
			}}
		/>
	);
}
