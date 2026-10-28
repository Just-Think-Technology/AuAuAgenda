"use client";

import Link from "next/link";
import { PlusIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { AppointmentList } from "@/components/customer/appointment-list";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { useMockStore } from "@/lib/demo/context";
import { splitClientBookings } from "@/lib/demo/operations";
import type { AuthUser } from "@/lib/types";

export function MockCustomerAppointments({ user }: { user: Extract<AuthUser, { role: "client" }> }) {
	const { store } = useMockStore();
	const params = useSearchParams();
	const now = new Date();
	const { upcoming, history, timeZone } = splitClientBookings(store, user.clientId, now);
	const confirmation = params.get("criado")
		? "Agendamento confirmado! Você pode acompanhar o status por aqui."
		: params.get("remarcado")
			? "Agendamento remarcado com sucesso."
			: null;

	return (
		<div className="space-y-8">
			<PageHeader
				title="Agendamentos"
				actions={
					<Button asChild>
						<Link href="/cliente/agendamentos/novo">
							<PlusIcon />
							Novo agendamento
						</Link>
					</Button>
				}
			/>

			{confirmation && (
				<p role="status" className="rounded-[12px] border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-900">
					{confirmation}
				</p>
			)}

			<section className="space-y-3" aria-labelledby="proximos">
				<h2 id="proximos" className="text-lg font-semibold tracking-tight">
					Próximos
				</h2>
				{upcoming.length > 0 ? (
					<AppointmentList appointments={upcoming} timeZone={timeZone} now={now} withActions clientId={user.clientId} />
				) : (
					<EmptyState title="Nenhum agendamento futuro" />
				)}
			</section>

			<section className="space-y-3" aria-labelledby="historico">
				<h2 id="historico" className="text-lg font-semibold tracking-tight">
					Histórico
				</h2>
				{history.length > 0 ? (
					<AppointmentList appointments={history} timeZone={timeZone} now={now} withActions={false} />
				) : (
					<p className="text-sm text-muted-foreground">Sem atendimentos anteriores.</p>
				)}
			</section>
		</div>
	);
}
