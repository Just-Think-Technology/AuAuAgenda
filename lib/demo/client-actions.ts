"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { ActionResult, FormState } from "@/lib/types";
import type { AppointmentStatus } from "@/lib/domain/appointment-status";

import { useOptionalMockStore, type MockStoreContextValue } from "./context";
import { isMocksPublic } from "./enabled-public";
import * as ops from "./operations";
import type { PetInput, ServiceInput } from "./operations";
import type { MockShopSettings } from "./types";

const DEMO_OFF = "Modo demonstração desligado.";

function requireDemoStore(demo: boolean, ctx: MockStoreContextValue | null): MockStoreContextValue {
	if (!demo || !ctx) throw new Error(DEMO_OFF);
	return ctx;
}

export function useMockDomainActions() {
	const demo = isMocksPublic();
	const ctx = useOptionalMockStore();
	const router = useRouter();

	const refreshRoutes = useCallback(() => {
		router.refresh();
	}, [router]);

	const actions = {
		savePet: useCallback(
			(cpf: string, petId: string | null, input: PetInput): FormState => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.savePet(store, cpf, petId, input));
					refreshRoutes();
					return { ok: true, message: petId ? "Pet atualizado." : "Pet cadastrado." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar pet." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		deletePet: useCallback(
			(cpf: string, petId: string): ActionResult => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.deletePet(store, cpf, petId));
					refreshRoutes();
					return { ok: true, message: "Pet excluído." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao excluir pet." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		createAppointment: useCallback(
			(
				cpf: string,
				input: Omit<Parameters<typeof ops.createBooking>[1], "clientId">,
			): FormState => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.createBooking(store, { ...input, clientId: cpf }).store);
					refreshRoutes();
					return { ok: true };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao agendar." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		rescheduleAppointment: useCallback(
			(
				cpf: string,
				appointmentId: number,
				startsAt: Date,
				notes: string | null,
			): FormState => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.rescheduleBooking(store, cpf, appointmentId, startsAt, notes).store);
					refreshRoutes();
					return { ok: true };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remarcar." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		cancelAppointment: useCallback(
			(cpf: string, appointmentId: number): ActionResult => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.cancelBooking(store, cpf, appointmentId));
					refreshRoutes();
					return { ok: true, message: "Agendamento cancelado." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao cancelar." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		changeStatus: useCallback(
			(appointmentId: number, from: AppointmentStatus, to: AppointmentStatus): ActionResult => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.changeBookingStatus(store, appointmentId, from, to));
					refreshRoutes();
					return { ok: true, message: "Status atualizado." };
				} catch (error) {
					return {
						ok: false,
						error: error instanceof Error ? error.message : "Erro ao atualizar status.",
					};
				}
			},
			[ctx, demo, refreshRoutes],
		),
		updateProfile: useCallback(
			(
				cpf: string,
				input: Parameters<typeof ops.updateClientProfile>[2],
			): FormState & { sessionVersion?: number } => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					const result = ops.updateClientProfile(store, cpf, input);
					commit(result.store);
					refreshRoutes();
					return {
						ok: true,
						message: "Perfil atualizado.",
						sessionVersion: result.sessionVersion,
					};
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		saveService: useCallback(
			(serviceId: string | null, input: ServiceInput): ActionResult & { serviceId?: string } => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					const result = ops.saveService(store, serviceId, input);
					commit(result.store);
					refreshRoutes();
					return { ok: true, message: "Serviço salvo.", serviceId: result.serviceId };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar serviço." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		removeService: useCallback(
			(serviceId: string): ActionResult => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.removeService(store, serviceId));
					refreshRoutes();
					return { ok: true, message: "Serviço removido." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		saveShopSettings: useCallback(
			(input: MockShopSettings): FormState => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.saveShopSettings(store, input));
					refreshRoutes();
					return { ok: true, message: "Configurações salvas." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
		createClientAccount: useCallback(
			(input: Parameters<typeof ops.createClientAccount>[1]): FormState => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.createClientAccount(store, input));
					refreshRoutes();
					return { ok: true, message: "Cliente cadastrado." };
				} catch (error) {
					return {
						ok: false,
						error: error instanceof Error ? error.message : "Erro ao cadastrar cliente.",
					};
				}
			},
			[ctx, demo, refreshRoutes],
		),
		removeClient: useCallback(
			(cpf: string): ActionResult => {
				try {
					const { store, commit } = requireDemoStore(demo, ctx);
					commit(ops.softDeleteClient(store, cpf));
					refreshRoutes();
					return { ok: true, message: "Cliente removido." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover cliente." };
				}
			},
			[ctx, demo, refreshRoutes],
		),
	};

	if (demo && !ctx) {
		throw new Error("useMockStore must be used within MockStoreProvider");
	}

	return actions;
}
