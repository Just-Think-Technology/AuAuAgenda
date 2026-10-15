"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";

import type { ActionResult, FormState } from "@/lib/types";
import type { AppointmentStatus } from "@/lib/domain/appointment-status";

import { useMockStore } from "./context";
import * as ops from "./operations";
import type { PetInput, ServiceInput } from "./operations";
import type { MockShopSettings } from "./types";

export function useMockDomainActions() {
	const { store, commit } = useMockStore();
	const router = useRouter();

	const refreshRoutes = useCallback(() => {
		router.refresh();
	}, [router]);

	return {
		savePet: useCallback(
			(cpf: string, petId: string | null, input: PetInput): FormState => {
				try {
					commit(ops.savePet(store, cpf, petId, input));
					refreshRoutes();
					return { ok: true, message: petId ? "Pet atualizado." : "Pet cadastrado." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar pet." };
				}
			},
			[commit, refreshRoutes, store],
		),
		deletePet: useCallback(
			(cpf: string, petId: string): ActionResult => {
				try {
					commit(ops.deletePet(store, cpf, petId));
					refreshRoutes();
					return { ok: true, message: "Pet excluído." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao excluir pet." };
				}
			},
			[commit, refreshRoutes, store],
		),
		createAppointment: useCallback(
			(
				cpf: string,
				input: Omit<Parameters<typeof ops.createBooking>[1], "cpf">,
			): FormState => {
				try {
					commit(ops.createBooking(store, { ...input, cpf }).store);
					refreshRoutes();
					return { ok: true };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao agendar." };
				}
			},
			[commit, refreshRoutes, store],
		),
		rescheduleAppointment: useCallback(
			(
				cpf: string,
				appointmentId: number,
				startsAt: Date,
				notes: string | null,
			): FormState => {
				try {
					commit(ops.rescheduleBooking(store, cpf, appointmentId, startsAt, notes).store);
					refreshRoutes();
					return { ok: true };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remarcar." };
				}
			},
			[commit, refreshRoutes, store],
		),
		cancelAppointment: useCallback(
			(cpf: string, appointmentId: number): ActionResult => {
				try {
					commit(ops.cancelBooking(store, cpf, appointmentId));
					refreshRoutes();
					return { ok: true, message: "Agendamento cancelado." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao cancelar." };
				}
			},
			[commit, refreshRoutes, store],
		),
		changeStatus: useCallback(
			(appointmentId: number, from: AppointmentStatus, to: AppointmentStatus): ActionResult => {
				try {
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
			[commit, refreshRoutes, store],
		),
		updateProfile: useCallback(
			(
				cpf: string,
				input: Parameters<typeof ops.updateClientProfile>[2],
			): FormState & { sessionVersion?: number } => {
				try {
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
			[commit, refreshRoutes, store],
		),
		saveService: useCallback(
			(serviceId: string | null, input: ServiceInput): ActionResult & { serviceId?: string } => {
				try {
					const result = ops.saveService(store, serviceId, input);
					commit(result.store);
					refreshRoutes();
					return { ok: true, message: "Serviço salvo.", serviceId: result.serviceId };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar serviço." };
				}
			},
			[commit, refreshRoutes, store],
		),
		removeService: useCallback(
			(serviceId: string): ActionResult => {
				try {
					commit(ops.removeService(store, serviceId));
					refreshRoutes();
					return { ok: true, message: "Serviço removido." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover." };
				}
			},
			[commit, refreshRoutes, store],
		),
		saveShopSettings: useCallback(
			(input: MockShopSettings): FormState => {
				try {
					commit(ops.saveShopSettings(store, input));
					refreshRoutes();
					return { ok: true, message: "Configurações salvas." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao salvar." };
				}
			},
			[commit, refreshRoutes, store],
		),
		createClientAccount: useCallback(
			(input: Parameters<typeof ops.createClientAccount>[1]): FormState => {
				try {
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
			[commit, refreshRoutes, store],
		),
		removeClient: useCallback(
			(cpf: string): ActionResult => {
				try {
					commit(ops.softDeleteClient(store, cpf));
					refreshRoutes();
					return { ok: true, message: "Cliente removido." };
				} catch (error) {
					return { ok: false, error: error instanceof Error ? error.message : "Erro ao remover cliente." };
				}
			},
			[commit, refreshRoutes, store],
		),
	};
}
