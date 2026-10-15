import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MockCustomerSettings } from "@/components/mock/pages/customer-settings";
import { ProfileSettingsForm } from "@/components/customer/profile-settings-form";
import { isMocksEnabled } from "@/lib/config/mocks";
import { findClientProfile } from "@/lib/dal/accounts";
import { isValidCpf } from "@/lib/domain/cpf";
import { requireClient } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Configurações" };

export default async function CustomerSettingsPage() {
	const user = await requireClient();
	if (isMocksEnabled()) return <MockCustomerSettings user={user} />;
	const profile = await findClientProfile(user.cpf);
	if (!profile) redirect("/session/expired");

	return (
		<ProfileSettingsForm
			key={profile.updated_at.toISOString()}
			profile={{
				name: profile.name,
				email: profile.email,
				phone: profile.phone,
				cpf: isValidCpf(profile.cpf) ? profile.cpf : null,
			}}
		/>
	);
}
