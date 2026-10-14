"use client";

import { useActionState, useEffect, useState } from "react";

import { Link, useTransitionRouter } from "next-view-transitions";

import { toast } from "sonner";

import { resetPasswordAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

type NovaSenhaProps = {
	token?: string;
};

export function NovaSenha({ token }: NovaSenhaProps) {
	const router = useTransitionRouter();
	const [state, formAction, isPending] = useActionState(
		resetPasswordAction,
		undefined,
	);
	const [password, setPassword] = useState("");
	const [passwordConfirm, setPasswordConfirm] = useState("");

	useEffect(() => {
		if (state?.error) toast.error(state.error);
		if (state?.success) {
			toast.success("Senha alterada com sucesso. Faça login para continuar.");
			router.push("/");
		}
	}, [state, router]);

	if (!token) {
		return (
			<AuthLayout
				title="Link inválido"
				description="Não foi possível redefinir a senha"
			>
				<div className="flex flex-col gap-6">
					<p className="text-sm text-muted-foreground">
						Este link de recuperação é inválido ou está incompleto. Solicite um
						novo para continuar.
					</p>
					<Button asChild>
						<Link href="/senha">Solicitar novo link</Link>
					</Button>
				</div>
			</AuthLayout>
		);
	}

	return (
		<AuthLayout
			title="Criar nova senha"
			description="Defina a nova senha de sua conta"
		>
			<form action={formAction} className="flex flex-col gap-6">
				<input type="hidden" name="token" value={token} />

				<div className="flex flex-col gap-3">
					<Label htmlFor="nova-senha">Nova Senha</Label>
					<PasswordInput
						id="nova-senha"
						name="password"
						placeholder="••••••••••"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						minLength={8}
						required
					/>
				</div>
				<div className="flex flex-col gap-3">
					<Label htmlFor="confirmar-senha">Confirmar Senha</Label>
					<PasswordInput
						id="confirmar-senha"
						name="password_confirm"
						placeholder="••••••••••"
						value={passwordConfirm}
						onChange={(event) => setPasswordConfirm(event.target.value)}
						minLength={8}
						required
					/>
				</div>

				<Button
					type="submit"
					disabled={isPending || !password || !passwordConfirm}
				>
					{isPending ? "Alterando..." : "Alterar Senha"}
				</Button>

				<div className="flex items-center justify-center">
					<p className="text-sm">
						Lembrou a senha?{" "}
						<Link
							href="/"
							className="underline underline-offset-4 decoration-neutral-400"
						>
							Fazer login
						</Link>
					</p>
				</div>
			</form>
		</AuthLayout>
	);
}
