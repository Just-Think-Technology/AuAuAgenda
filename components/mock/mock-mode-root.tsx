"use client";

import { isMocksPublic } from "@/lib/config/mocks-public";
import { MockStoreProvider } from "@/lib/mock/context";

import { DemoBanner } from "./demo-banner";

export function MockModeRoot({ children }: { children: React.ReactNode }) {
	if (!isMocksPublic()) return children;
	return (
		<MockStoreProvider>
			<DemoBanner />
			{children}
		</MockStoreProvider>
	);
}
