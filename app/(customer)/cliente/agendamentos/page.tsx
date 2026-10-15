import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon } from "lucide-react";

import { MockCustomerAppointments } from "@/components/mock/pages/customer-appointments";
import { AppointmentList } from "@/components/customer/appointment-list";
import { isMocksEnabled } from "@/lib/config/mocks";
import { EmptyState, PageHeader } from "@/components/layouts/page-header";
import { Button } from "@/components/ui/button";
import { requireClient } from "@/lib/server/current-user";
import { getClientBookings } from "@/lib/use-cases/booking/client-bookings";

export const metadata: Metadata = { title: "Agendamentos" };

type Props = { searchParams: Promise<{ criado?: string; remarcado?: string }> };

export default async function CustomerAppointmentsPage({ searchParams }: Props) {
	const user = await requireClient();
	if (isMocksEnabled()) return <MockCustomerAppointments user={user} />;
	const params = await searchParams;
	const now = new Date();
	const { upcoming, history, timeZone } = await getClientBookings(user.cpf, now);
	const confirmation = params.criado
		? "Agendamento confirmado! Você pode acompanhar o status por aqui."
		: params.remarcado
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
					<AppointmentList appointments={upcoming} timeZone={timeZone} now={now} withActions />
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
