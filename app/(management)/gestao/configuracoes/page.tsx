import type { Metadata } from "next";

import { ShopSettingsForm } from "@/components/management/shop-settings-form";
import { getShopSettings } from "@/lib/dal/shop";
import { requireAdmin } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Configurações do pet shop" };

export default async function ShopSettingsPage() {
	await requireAdmin();
	const settings = await getShopSettings();
	return <ShopSettingsForm settings={settings} />;
}
