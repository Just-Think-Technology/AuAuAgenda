"use client";

import { ShopSettingsForm } from "@/components/management/shop-settings-form";
import { useMockStore } from "@/lib/mock/context";
import { toShopSettings } from "@/lib/mock/mappers";

export function MockManagementSettings() {
	const { store } = useMockStore();
	return <ShopSettingsForm settings={toShopSettings(store)} />;
}
