"use client";

import { isMocksPublic } from "@/lib/config/mocks-public";

export function DemoBanner() {
	if (!isMocksPublic()) return null;
	return (
		<p
			role="status"
			className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-sm text-amber-950"
		>
			Modo demonstração — os dados ficam salvos neste navegador (localStorage).
		</p>
	);
}
