"use client";

import { useActionState, useEffect, useState } from "react";

import { Link } from "next-view-transitions";

import { toast } from "sonner";

import { loginAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

export function AdminLogin() {
	const [state, formAction, isPending] = useActionState(loginAction, undefined);
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	useEffect(() => {
		if (state?.error) toast.error(state.error);
	}, [state]);

	return (
		<AuthLayout title="Acesso da equipe" description="Entre com o e-mail e a senha da gestão.">
			<form action={formAction} className="flex flex-col gap-6">
				<div className="flex flex-col gap-3">
					<Label htmlFor="email">E-mail</Label>
					<Input
						type="email"
						id="email"
						name="email"
						autoComplete="username"
						placeholder="gestao@petshop.com"
						value={email}
						onChange={(event) => setEmail(event.target.value)}
						required
					/>
				</div>
				<div className="flex flex-col gap-3">
					<Label htmlFor="senha">Senha</Label>
					<PasswordInput
						id="senha"
						name="password"
						autoComplete="current-password"
						placeholder="••••••••••"
						value={password}
						onChange={(event) => setPassword(event.target.value)}
						required
					/>
				</div>

				<Button type="submit" disabled={isPending || !email.trim() || !password}>
					{isPending ? "Entrando..." : "Entrar"}
				</Button>

				<div className="flex items-center justify-center">
					<Link
						href="/"
						className="text-sm text-foreground/60 transition-colors hover:text-foreground"
					>
						Voltar ao acesso do cliente
					</Link>
				</div>
			</form>
		</AuthLayout>
	);
}
