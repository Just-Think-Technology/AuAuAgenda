"use client";

import { isMocksPublic } from "@/lib/demo/enabled-public";
import { MockStoreProvider } from "@/lib/demo/context";

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
