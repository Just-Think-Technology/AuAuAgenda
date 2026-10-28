import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MockCustomerSettings } from "@/components/demo/pages/customer-settings";
import { ProfileSettingsForm } from "@/components/customer/profile-settings-form";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { findClientProfile } from "@/lib/dal/accounts";
import { requireClient } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Configurações" };

export default async function CustomerSettingsPage() {
	const user = await requireClient();
	if (isMocksEnabled()) return <MockCustomerSettings user={user} />;
	const profile = await findClientProfile(user.clientId);
	if (!profile) redirect("/session/expired");

	return (
		<ProfileSettingsForm
			key={profile.updated_at.toISOString()}
			profile={{
				name: profile.name,
				phone: profile.phone,
			}}
		/>
	);
}
