"use client";

import { useActionState, useState, useTransition } from "react";
import { PlusIcon } from "lucide-react";

import { toast } from "sonner";

import { createClientAction } from "@/app/actions/admin-clients";
import { isMocksPublic } from "@/lib/demo/enabled-public";
import { normalizePhone } from "@/lib/domain/phone";
import { useMockDomainActions } from "@/lib/demo/client-actions";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useActionFeedback } from "@/hooks/use-action-feedback";

function NewClientForm({ onDone }: { onDone: () => void }) {
	const mocks = isMocksPublic();
	const mockActions = useMockDomainActions();
	const [state, formAction, isPending] = useActionState(createClientAction, undefined);
	const [mockPending, startMock] = useTransition();
	useActionFeedback(state, onDone);

	function submitMock(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		const formData = new FormData(event.currentTarget);
		startMock(() => {
			const phone = normalizePhone(String(formData.get("phone") ?? ""));
			if (!phone) {
				toast.error("Telefone inválido.");
				return;
			}
			const result = mockActions.createClientAccount({
				name: String(formData.get("name") ?? "").trim(),
				phone,
			});
			if (result?.ok) {
				toast.success(result.message);
				onDone();
			} else {
				toast.error(result?.error ?? "Erro ao cadastrar.");
			}
		});
	}

	const pending = mocks ? mockPending : isPending;

	return (
		<form
			action={mocks ? undefined : formAction}
			onSubmit={mocks ? submitMock : undefined}
			className="flex flex-col gap-4"
		>
			<Field htmlFor="client-name" label="Nome">
				<Input id="client-name" name="name" required maxLength={255} autoComplete="off" />
			</Field>
			<Field htmlFor="client-phone" label="Telefone" hint="O cliente entra na área dele com este número.">
				<Input
					id="client-phone"
					name="phone"
					type="tel"
					inputMode="tel"
					autoComplete="tel"
					placeholder="(11) 91234-5678"
					required
				/>
			</Field>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onDone} disabled={pending}>
					Cancelar
				</Button>
				<Button type="submit" disabled={pending}>
					{pending ? "Cadastrando…" : "Cadastrar"}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function NewClientDialog() {
	const [open, setOpen] = useState(false);
	return (
		<>
			<Button onClick={() => setOpen(true)}>
				<PlusIcon />
				Novo cliente
			</Button>
			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Cadastrar cliente</DialogTitle>
						<DialogDescription>
							O cliente entra informando o telefone. O nome aparece na agenda e no perfil.
						</DialogDescription>
					</DialogHeader>
					{open && <NewClientForm onDone={() => setOpen(false)} />}
				</DialogContent>
			</Dialog>
		</>
	);
}
