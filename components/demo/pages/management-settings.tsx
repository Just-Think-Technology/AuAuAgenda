"use client";

import { ShopSettingsForm } from "@/components/management/shop-settings-form";
import { useMockStore } from "@/lib/demo/context";
import { toShopSettings } from "@/lib/demo/mappers";

export function MockManagementSettings() {
	const { store } = useMockStore();
	return <ShopSettingsForm settings={toShopSettings(store)} />;
}
