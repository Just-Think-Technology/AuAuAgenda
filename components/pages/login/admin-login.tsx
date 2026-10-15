"use client";

import { useActionState, useEffect, useState, useTransition } from "react";

import { Link } from "next-view-transitions";

import { toast } from "sonner";

import { loginAction, mockAdminLoginAction } from "@/app/actions/auth";
import { AuthLayout } from "@/components/layouts/auth-layout";
import { isMocksPublic } from "@/lib/config/mocks-public";
import { ensureSeed } from "@/lib/mock/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

function MockAdminLogin() {
	const [pending, startLogin] = useTransition();

	function enterDemo() {
		startLogin(async () => {
			const store = ensureSeed();
			const response = await mockAdminLoginAction({
				adminId: store.admin.adminId,
				name: store.admin.name,
				email: store.admin.email,
				sessionVersion: store.admin.sessionVersion,
			});
			if (response?.error) toast.error(response.error);
		});
	}

	return (
		<AuthLayout
			title="Acesso da equipe"
			description="Veja a agenda do dia, serviços e clientes nesta demonstração."
		>
			<div className="flex flex-col gap-6">
				<Button type="button" size="lg" disabled={pending} onClick={enterDemo}>
					{pending ? "Entrando..." : "Entrar na gestão"}
				</Button>
				<div className="flex items-center justify-center">
					<Link
						href="/"
						className="text-sm text-foreground/60 transition-colors hover:text-foreground"
					>
						Voltar ao acesso do cliente
					</Link>
				</div>
			</div>
		</AuthLayout>
	);
}

function ProductionAdminLogin() {
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

export function AdminLogin() {
	if (isMocksPublic()) return <MockAdminLogin />;
	return <ProductionAdminLogin />;
}
