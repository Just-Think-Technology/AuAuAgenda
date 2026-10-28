"use client";

import { useActionState, useTransition } from "react";

import { toast } from "sonner";

import { mockSyncClientSessionAction } from "@/app/actions/auth";
import { updateClientProfileAction } from "@/app/actions/profile";
import { isMocksPublic } from "@/lib/demo/enabled-public";
import { normalizePhone } from "@/lib/domain/phone";
import { useMockDomainActions } from "@/lib/demo/client-actions";
import { PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/use-action-feedback";
import { formatPhone } from "@/lib/format";

export type ProfileData = {
	name: string;
	phone: string | null;
};

export function ProfileSettingsForm({
	profile,
	clientId,
}: {
	profile: ProfileData;
	clientId?: string;
}) {
	const mocks = isMocksPublic() && Boolean(clientId);
	const mockActions = useMockDomainActions();
	const [state, formAction, isPending] = useActionState(updateClientProfileAction, undefined);
	const [mockPending, startMock] = useTransition();
	useActionFeedback(state);

	function submitMock(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		if (!clientId) return;
		const formData = new FormData(event.currentTarget);
		startMock(async () => {
			const name = String(formData.get("name") ?? "").trim();
			const phone = normalizePhone(String(formData.get("phone") ?? ""));
			const result = mockActions.updateProfile(clientId, {
				name,
				phone: phone ?? "",
			});
			if (!result?.ok) {
				toast.error(result?.error ?? "Erro ao salvar.");
				return;
			}
			const sync = await mockSyncClientSessionAction({
				clientId,
				name,
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
			</div>

			<div className="flex justify-end">
				<Button type="submit" disabled={pending}>
					{pending ? "Salvando…" : "Salvar alterações"}
				</Button>
			</div>
		</form>
	);
}
