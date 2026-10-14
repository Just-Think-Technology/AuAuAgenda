"use client";

import { useActionState, useEffect, useState } from "react";

import { Link } from "next-view-transitions";

import { toast } from "sonner";

import { continueWithPhoneAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login() {
	const [state, formAction, isPending] = useActionState(continueWithPhoneAction, undefined);
	const [phone, setPhone] = useState("");

	useEffect(() => {
		if (state?.error) toast.error(state.error);
	}, [state]);

	return (
		<AuthLayout
			title="Agende um horário"
			description="Informe seu telefone para continuar. Na primeira vez, o acesso é criado na hora."
		>
			<form action={formAction} className="flex flex-col gap-6">
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
						onChange={(event) => setPhone(event.target.value)}
						required
					/>
				</div>

				<Button type="submit" disabled={isPending || !phone.trim()}>
					{isPending ? "Entrando..." : "Continuar"}
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
