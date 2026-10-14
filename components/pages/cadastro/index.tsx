"use client";

import { useActionState, useEffect, useState } from "react";

import { ChevronDownIcon } from "lucide-react";

import { Link } from "next-view-transitions";

import { toast } from "sonner";

import { signupAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { TermsModal } from "@/components/modals/terms-modal";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";

function formatCpf(value: string) {
	const digits = value.replace(/\D/g, "").slice(0, 11);
	const parts = [
		digits.slice(0, 3),
		digits.slice(3, 6),
		digits.slice(6, 9),
		digits.slice(9, 11),
	];

	if (digits.length <= 3) return parts[0];
	if (digits.length <= 6) return `${parts[0]}.${parts[1]}`;
	if (digits.length <= 9) return `${parts[0]}.${parts[1]}.${parts[2]}`;
	return `${parts[0]}.${parts[1]}.${parts[2]}-${parts[3]}`;
}

// Serialize to a local YYYY-MM-DD (avoids the UTC day-shift of toISOString()).
function toDateValue(date: Date) {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, "0");
	const day = String(date.getDate()).padStart(2, "0");
	return `${year}-${month}-${day}`;
}

export function Cadastro() {
	const [state, formAction, isPending] = useActionState(
		signupAction,
		undefined,
	);
	const [termsOpen, setTermsOpen] = useState(false);
	const [acceptedTerms, setAcceptedTerms] = useState(false);
	const [name, setName] = useState("");
	const [cpf, setCpf] = useState("");
	const [birthDate, setBirthDate] = useState<Date | undefined>(undefined);
	const [datePickerOpen, setDatePickerOpen] = useState(false);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (state?.error) toast.error(state.error);
	}, [state]);

	return (
		<AuthLayout
			title="Novo por aqui?"
			description="Crie sua conta para continuar"
		>
			<form action={formAction} className="flex flex-col gap-6">
				<div className="flex flex-col gap-2">
					<Label htmlFor="nome">Nome</Label>
					<Input
						type="text"
						id="nome"
						name="name"
						placeholder="John Doe"
						value={name}
						onChange={(event) => setName(event.target.value)}
						required
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="cpf">CPF</Label>
					<Input
						type="text"
						id="cpf"
						name="cpf"
						placeholder="000.000.000-00"
						inputMode="numeric"
						maxLength={14}
						pattern="\d{3}\.\d{3}\.\d{3}-\d{2}"
						title="Digite um CPF no formato 000.000.000-00"
						value={cpf}
						onChange={(event) => setCpf(formatCpf(event.target.value))}
						required
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						type="email"
						id="email"
						name="email"
						placeholder="johndoe@gmail.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						required
					/>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="nascimento">Data de nascimento</Label>
					<input
						type="hidden"
						name="birth_date"
						value={birthDate ? toDateValue(birthDate) : ""}
					/>
					<Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
						<PopoverTrigger asChild>
							<Button
								type="button"
								variant="outline"
								id="nascimento"
								className="w-full justify-between font-normal text-muted-foreground"
							>
								{birthDate
									? birthDate.toLocaleDateString("pt-BR")
									: "Selecionar"}
								<ChevronDownIcon className="size-5 opacity-50" />
							</Button>
						</PopoverTrigger>
						<PopoverContent
							className="w-auto overflow-hidden p-0"
							align="start"
						>
							<Calendar
								mode="single"
								selected={birthDate}
								captionLayout="dropdown"
								onSelect={(date) => {
									setBirthDate(date);
									setDatePickerOpen(false);
								}}
							/>
						</PopoverContent>
					</Popover>
				</div>
				<div className="flex flex-col gap-2">
					<Label htmlFor="senha">Senha</Label>
					<PasswordInput
						id="senha"
						name="password"
						placeholder="••••••••••"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						required
					/>
				</div>
				<div className="flex item-center gap-2 py-1">
					<Checkbox
						id="termos"
						name="terms"
						checked={acceptedTerms}
						onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
					/>
					<div className="flex flex-col gap-1">
						<Label htmlFor="termos">Termos de uso</Label>
						<span className="text-sm text-muted-foreground">
							Continuando, você concorda com os nossos {""}
							<button
								type="button"
								onClick={() => setTermsOpen(true)}
								className="block underline underline-offset-4 decoration-1 decoration-neutral-400 text-left hover:text-foreground"
							>
								termos de serviço e política de privacidade
							</button>
						</span>
					</div>
				</div>
				<Button
					type="submit"
					disabled={
						isPending ||
						!name.trim() ||
						!cpf.trim() ||
						!birthDate ||
						!email.trim() ||
						!password ||
						!acceptedTerms
					}
				>
					{isPending ? "Cadastrando..." : "Cadastrar"}
				</Button>

				<div className="flex items-center justify-center">
					<p className="text-sm">
						Já tem uma conta?{" "}
						<Link
							href="/"
							className="underline underline-offset-4 decoration-neutral-400"
						>
							Fazer login
						</Link>
					</p>
				</div>
			</form>
			<TermsModal
				isOpen={termsOpen}
				onOpenChange={setTermsOpen}
				onAccept={() => setAcceptedTerms(true)}
			/>
		</AuthLayout>
	);
}
