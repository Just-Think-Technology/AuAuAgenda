"use client";

import { useActionState, useState } from "react";

import { updateClientProfileAction } from "@/app/actions/profile";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { formatCpf } from "@/lib/domain/cpf";
import { formatPhone } from "@/lib/format";

function maskCpf(value: string): string {
	const digits = value.replace(/\D/g, "").slice(0, 11);
	return digits
		.replace(/^(\d{3})(\d)/, "$1.$2")
		.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
		.replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

export type ProfileData = {
	cpf: string | null;
	name: string;
	email: string | null;
	phone: string | null;
};

export function ProfileSettingsForm({ profile }: { profile: ProfileData }) {
	const [state, formAction, isPending] = useActionState(updateClientProfileAction, undefined);
	const [cpf, setCpf] = useState(profile.cpf ? formatCpf(profile.cpf) : "");
	useActionFeedback(state);

	return (
		<form action={formAction} className="space-y-10">
			<PageHeader
				title="Configurações"
				description="Seus dados de contato. O telefone continua sendo a chave para entrar."
			/>

			<div className="grid gap-4 sm:grid-cols-2">
				<Field htmlFor="name" label="Nome">
					<Input id="name" name="name" required maxLength={255} defaultValue={profile.name} autoComplete="name" />
				</Field>
				<Field htmlFor="phone" label="Telefone" hint="É com este número que você acessa seus pets e agendamentos.">
					<Input
						id="phone"
						name="phone"
						type="tel"
						inputMode="tel"
						autoComplete="tel"
						placeholder="(11) 91234-5678"
						required
						defaultValue={profile.phone ? formatPhone(profile.phone) : ""}
					/>
				</Field>
				<Field htmlFor="cpf" label="CPF" hint="Opcional. A equipe usa para identificar o tutor.">
					<Input
						id="cpf"
						name="cpf"
						inputMode="numeric"
						autoComplete="off"
						placeholder="000.000.000-00"
						value={cpf}
						onChange={(event) => setCpf(maskCpf(event.target.value))}
					/>
				</Field>
				<Field htmlFor="email" label="E-mail" hint="Opcional. Serve para a equipe entrar em contato.">
					<Input
						id="email"
						name="email"
						type="email"
						autoComplete="email"
						placeholder="seuemail@gmail.com"
						maxLength={255}
						defaultValue={profile.email ?? ""}
					/>
				</Field>
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={isPending}>
					{isPending ? "Salvando…" : "Salvar alterações"}
				</Button>
			</div>
		</form>
	);
}
