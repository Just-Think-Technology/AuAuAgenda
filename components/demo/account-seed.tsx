"use client";

import { useLayoutEffect } from "react";

import { useMockStore } from "@/lib/demo/context";
import { attachPersonalDemo } from "@/lib/demo/seed";

/** Gives the signed-in phone the sample pets and bookings, whichever number was used. */
export function DemoAccountSeed({ cpf }: { cpf: string }) {
	const { store, commit } = useMockStore();

	useLayoutEffect(() => {
		const next = attachPersonalDemo(store, cpf);
		if (next !== store) commit(next);
	}, [store, cpf, commit]);

	return null;
}
