import type { Metadata } from "next";

import { MockManagementSettings } from "@/components/demo/pages/management-settings";
import { ShopSettingsForm } from "@/components/management/shop-settings-form";
import { isMocksEnabled } from "@/lib/demo/enabled";
import { getShopSettings } from "@/lib/dal/shop";
import { requireAdmin } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Configurações do pet shop" };

export default async function ShopSettingsPage() {
	await requireAdmin();
	if (isMocksEnabled()) return <MockManagementSettings />;
	const settings = await getShopSettings();
	return <ShopSettingsForm settings={settings} />;
}
