"use client";

import { ProfileSettingsForm } from "@/components/customer/profile-settings-form";
import { useMockStore } from "@/lib/demo/context";
import type { AuthUser } from "@/lib/types";

export function MockCustomerSettings({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const profile = store.clients.find((c) => c.clientId === user.clientId && !c.deletedAt);
	if (!profile) return null;

	return (
		<ProfileSettingsForm
			key={profile.updatedAt}
			clientId={user.clientId}
			profile={{
				name: profile.name,
				phone: profile.phone,
			}}
		/>
	);
}
