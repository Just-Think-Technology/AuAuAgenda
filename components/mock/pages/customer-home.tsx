"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { AppointmentList } from "@/components/customer/appointment-list";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { PHONE_ACCOUNT_NAME } from "@/lib/domain/account-id";
import { listPetsByOwner } from "@/lib/mock/mappers";
import { splitClientBookings } from "@/lib/mock/operations";
import { useMockStore } from "@/lib/mock/context";
import type { AuthUser } from "@/lib/types";

export function MockCustomerHome({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const now = new Date();
	const pets = listPetsByOwner(store, user.cpf);
	const { upcoming, timeZone } = splitClientBookings(store, user.cpf, now);
	const petsWithoutSize = pets.filter((pet) => !pet.size);

	return (
		<div className="space-y-10">
			<PageHeader
				title={`Olá, ${user.name.split(" ")[0]}!`}
				description="Agende banho, tosa e outros cuidados para o seu pet."
				actions={
					<Button asChild>
						<Link href="/cliente/agendamentos/novo">
							<PlusIcon />
							Agendar serviço
						</Link>
					</Button>
				}
			/>

			{user.name === PHONE_ACCOUNT_NAME && (
				<p role="status" className="rounded-[12px] border border-border bg-muted/40 px-4 py-3 text-sm">
					Complete seu nome em{" "}
					<Link href="/cliente/configuracoes" className="font-medium underline underline-offset-4">
						Configurações
					</Link>{" "}
					para a equipe te reconhecer no atendimento.
				</p>
			)}

			{petsWithoutSize.length > 0 && (
				<p role="status" className="rounded-[12px] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
					Informe o porte de {petsWithoutSize.map((p) => p.name).join(", ")} para liberar o agendamento.{" "}
					<Link href="/cliente/pets" className="font-medium underline underline-offset-4">
						Atualizar pets
					</Link>
				</p>
			)}

			<section className="space-y-3" aria-labelledby="proximos">
				<h2 id="proximos" className="text-lg font-semibold tracking-tight">
					Próximos agendamentos
				</h2>
				{upcoming.length > 0 ? (
					<AppointmentList
						appointments={upcoming.slice(0, 3)}
						timeZone={timeZone}
						now={now}
						withActions
						clientCpf={user.cpf}
					/>
				) : pets.length === 0 ? (
					<EmptyState
						title="Cadastre seu primeiro pet"
						description="Com o pet cadastrado você escolhe o serviço e o melhor horário."
						action={
							<Button asChild>
								<Link href="/cliente/pets">Cadastrar pet</Link>
							</Button>
						}
					/>
				) : (
					<EmptyState
						title="Nenhum agendamento futuro"
						description="Escolha um serviço e veja os horários livres."
						action={
							<Button asChild>
								<Link href="/cliente/agendamentos/novo">Agendar serviço</Link>
							</Button>
						}
					/>
				)}
				{upcoming.length > 3 && (
					<Button asChild variant="link" className="px-0">
						<Link href="/cliente/agendamentos">Ver todos os agendamentos</Link>
					</Button>
				)}
			</section>
		</div>
	);
}
