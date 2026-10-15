"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Link } from "next-view-transitions";

import { toast } from "sonner";

import { continueWithPhoneAction, mockContinueWithPhoneAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { maskPhoneInput } from "@/lib/format";
import { persistMockStore } from "@/lib/mock/context";
import { continueWithPhone } from "@/lib/mock/operations";
import { ensureSeed } from "@/lib/mock/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
	const mocks = isMocksPublic();
	const [state, formAction, isPending] = useActionState(continueWithPhoneAction, undefined);
	const [phone, setPhone] = useState("");
	const [mockPending, startMock] = useTransition();
	const phoneDigits = phone.replace(/\D/g, "");

	useEffect(() => {
		if (state?.error) toast.error(state.error);
	}, [state?.error]);

	function submitMock(event: React.FormEvent) {
		event.preventDefault();
		startMock(async () => {
			try {
				const store = ensureSeed();
				const result = continueWithPhone(store, phone);
				persistMockStore(result.store);
				const response = await mockContinueWithPhoneAction({
					cpf: result.cpf,
					name: result.name,
					sessionVersion: result.sessionVersion,
				});
				if (response?.error) toast.error(response.error);
			} catch (error) {
				toast.error(error instanceof Error ? error.message : "Não foi possível entrar.");
			}
		});
	}

	const pending = mocks ? mockPending : isPending;

	return (
		<AuthLayout
			title="Agende um horário"
			description="Informe seu telefone para continuar. Na primeira vez, o acesso é criado na hora."
		>
			<form
				action={mocks ? undefined : formAction}
				onSubmit={mocks ? submitMock : undefined}
				className="flex flex-col gap-6"
			>
				<div className="flex flex-col gap-3">
					<Label htmlFor="phone">Telefone</Label>
					<Input
						type="tel"
						id="phone"
						name="phone"
						inputMode="tel"
						autoComplete="tel"
						placeholder="(11) 91234-5678"
						value={phone}
						onChange={(event) => setPhone(maskPhoneInput(event.target.value))}
						required
					/>
				</div>

				<Button type="submit" disabled={pending || phoneDigits.length < 10}>
					{pending ? "Entrando..." : "Continuar"}
				</Button>

				<div className="flex items-center justify-center">
					<Link
						href="/gestao"
						className="text-sm text-foreground/60 transition-colors hover:text-foreground"
					>
						Acesso da equipe
					</Link>
				</div>
			</form>
		</AuthLayout>
	);
}
