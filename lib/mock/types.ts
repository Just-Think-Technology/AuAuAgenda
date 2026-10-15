import type { AppointmentStatus } from "@/lib/domain/appointment-status";
import type { OpeningDay } from "@/lib/domain/availability";
import type { PetSize } from "@/lib/domain/pet-size";

export type MockClient = {
	cpf: string;
	name: string;
	email: string | null;
	phone: string | null;
	sessionVersion: number;
	updatedAt: string;
	deletedAt: string | null;
};

export type MockAdmin = {
	adminId: string;
	name: string;
	email: string;
	sessionVersion: number;
};

export type MockSpecies = { speciesId: string; name: string };

export type MockBreed = {
	breedId: string;
	name: string;
	speciesId: string;
	deletedAt: string | null;
};

export type MockPet = {
	petId: string;
	clientCpf: string;
	name: string;
	speciesId: string;
	breedId: string | null;
	size: PetSize | null;
	sex: "male" | "female" | null;
	birthDate: string | null;
	notes: string | null;
	imageUrl: string | null;
	deletedAt: string | null;
};

export type MockService = {
	serviceId: string;
	name: string;
	description: string | null;
	durationMinutes: number;
	priceCents: number | null;
	isActive: boolean;
	sizes: PetSize[];
	speciesIds: string[];
	deletedAt: string | null;
};

export type MockAppointment = {
	appointmentId: number;
	clientCpf: string;
	petId: string;
	serviceId: string;
	startsAt: string;
	endsAt: string;
	station: number;
	status: AppointmentStatus;
	notes: string | null;
	statusUpdatedAt: string;
	deletedAt: string | null;
};

export type MockShopSettings = {
	name: string;
	timeZone: string;
	capacity: number;
	slotIntervalMinutes: number;
	openingHours: OpeningDay[];
};

export type MockDatabase = {
	version: 1;
	nextAppointmentId: number;
	admin: MockAdmin;
	clients: MockClient[];
	species: MockSpecies[];
	breeds: MockBreed[];
	pets: MockPet[];
	services: MockService[];
	appointments: MockAppointment[];
	shopSettings: MockShopSettings;
};
