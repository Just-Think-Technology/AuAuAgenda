"use client";

import { useActionState, useState } from "react";
import { PlusIcon } from "lucide-react";

import { createClientAction } from "@/app/actions/admin-clients";
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
import { PasswordInput } from "@/components/ui/password-input";
import { useActionFeedback } from "@/hooks/use-action-feedback";

function maskCpf(value: string): string {
	const d = value.replace(/\D/g, "").slice(0, 11);
	return d
		.replace(/^(\d{3})(\d)/, "$1.$2")
		.replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
		.replace(/\.(\d{3})(\d{1,2})$/, ".$1-$2");
}

function NewClientForm({ onDone }: { onDone: () => void }) {
	const [state, formAction, isPending] = useActionState(createClientAction, undefined);
	const [cpf, setCpf] = useState("");
	useActionFeedback(state, onDone);

	return (
		<form action={formAction} className="flex flex-col gap-4">
			<Field htmlFor="client-name" label="Nome">
				<Input id="client-name" name="name" required maxLength={255} autoComplete="off" />
			</Field>
			<Field htmlFor="client-cpf" label="CPF">
				<Input
					id="client-cpf"
					name="cpf"
					required
					inputMode="numeric"
					placeholder="000.000.000-00"
					value={cpf}
					onChange={(e) => setCpf(maskCpf(e.target.value))}
				/>
			</Field>
			<Field htmlFor="client-email" label="E-mail">
				<Input id="client-email" name="email" type="email" required autoComplete="off" />
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
			<Field htmlFor="client-password" label="Senha provisória">
				<PasswordInput id="client-password" name="password" required minLength={8} autoComplete="new-password" />
			</Field>
			<Field htmlFor="client-password-confirm" label="Confirmar senha">
				<PasswordInput id="client-password-confirm" name="password_confirm" required minLength={8} autoComplete="new-password" />
			</Field>
			<DialogFooter>
				<Button type="button" variant="outline" onClick={onDone} disabled={isPending}>
					Cancelar
				</Button>
				<Button type="submit" disabled={isPending}>
					{isPending ? "Cadastrando…" : "Cadastrar"}
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
							O cliente entra informando o telefone. CPF, e-mail e senha ficam no cadastro interno.
						</DialogDescription>
					</DialogHeader>
					{open && <NewClientForm onDone={() => setOpen(false)} />}
				</DialogContent>
			</Dialog>
		</>
	);
}
