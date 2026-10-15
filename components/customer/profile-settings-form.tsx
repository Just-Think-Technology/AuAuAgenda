"use client";

import { useActionState, useState, useTransition } from "react";

import { toast } from "sonner";

import { mockSyncClientSessionAction } from "@/app/actions/auth";
import { updateClientProfileAction } from "@/app/actions/profile";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { normalizePhone } from "@/lib/domain/phone";
import { useMockDomainActions } from "@/lib/mock/client-actions";
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

export function ProfileSettingsForm({
	profile,
	clientCpf,
}: {
	profile: ProfileData;
	clientCpf?: string;
}) {
	const mocks = isMocksPublic() && Boolean(clientCpf);
	const mockActions = useMockDomainActions();
	const [state, formAction, isPending] = useActionState(updateClientProfileAction, undefined);
	const [mockPending, startMock] = useTransition();
	const [cpf, setCpf] = useState(profile.cpf ? formatCpf(profile.cpf) : "");
	useActionFeedback(state);

	function submitMock(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!clientCpf) return;
		const formData = new FormData(event.currentTarget);
		startMock(async () => {
			const name = String(formData.get("name") ?? "").trim();
			const phone = normalizePhone(String(formData.get("phone") ?? ""));
			const emailRaw = String(formData.get("email") ?? "").trim();
			const cpfRaw = String(formData.get("cpf") ?? "").replace(/\D/g, "");
			const result = mockActions.updateProfile(clientCpf, {
				name,
				phone: phone ?? "",
				email: emailRaw || null,
				cpfDocument: cpfRaw || null,
			});
			if (!result?.ok) {
				toast.error(result?.error ?? "Erro ao salvar.");
				return;
			}
			const sync = await mockSyncClientSessionAction({
				cpf: clientCpf,
				name,
				email: emailRaw || null,
				sessionVersion: result.sessionVersion ?? 0,
			});
			if (sync.error) toast.error(sync.error);
			else toast.success(result.message);
		});
	}

	const pending = mocks ? mockPending : isPending;

	return (
		<form
			action={mocks ? undefined : formAction}
			onSubmit={mocks ? submitMock : undefined}
			className="space-y-10"
		>
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
				<Button type="submit" disabled={pending}>
					{pending ? "Salvando…" : "Salvar alterações"}
				</Button>
			</div>
		</form>
	);
}
