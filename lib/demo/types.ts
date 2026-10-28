import type { AppointmentStatus } from "../domain/appointment-status.ts";
import type { OpeningDay } from "../domain/availability.ts";
import type { PetSize } from "../domain/pet-size.ts";

export type MockClient = {
	clientId: string;
	name: string;
	phone: string;
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
	clientId: string;
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
	clientId: string;
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
	version: 2;
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
