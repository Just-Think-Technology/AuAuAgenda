import Image from "next/image";

import labradorFallback from "@/assets/dogs/labrador.png";
import { getBreedImage, translateBreedName } from "@/lib/breed-translations";
import { PET_SIZE_LABELS, type PetSize } from "@/lib/domain/pet-size";
import { formatAge } from "@/lib/format";

export type PetCardData = {
	name: string;
	size: PetSize | null;
	sex: string | null;
	birth_date: Date | null;
	notes: string | null;
	image_url: string | null;
	species: { name: string } | null;
	breed: { name: string } | null;
};

const SEX_LABELS: Record<string, string> = { male: "Macho", female: "Fêmea" };

function PetCover({ pet }: { pet: PetCardData }) {
	const url = pet.image_url?.trim();
	if (url && /^https:\/\//i.test(url)) {
		return (
			// Legacy uploads live on arbitrary hosts, so next/image remote patterns cannot list them.
			// eslint-disable-next-line @next/next/no-img-element
			<img src={url} alt="" className="h-40 w-full object-cover" loading="lazy" decoding="async" />
		);
	}
	return (
		<Image
			src={getBreedImage(pet.breed?.name ?? null) ?? labradorFallback}
			alt=""
			width={320}
			height={160}
			className="h-40 w-full object-cover"
		/>
	);
}

function Detail({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col">
			<dt className="text-xs font-medium text-muted-foreground">{label}</dt>
			<dd className="text-sm font-semibold text-foreground">{value}</dd>
		</div>
	);
}

export function PetCard({ pet, actions }: { pet: PetCardData; actions?: React.ReactNode }) {
	return (
		<article className="flex flex-col overflow-hidden rounded-[12px] border bg-white">
			<PetCover pet={pet} />
			<div className="flex flex-1 flex-col gap-4 p-4">
				<h3 className="text-lg font-semibold">{pet.name}</h3>
				<dl className="grid grid-cols-2 gap-3">
					<Detail label="Espécie" value={pet.species?.name ?? "—"} />
					<Detail label="Raça" value={pet.breed ? translateBreedName(pet.breed.name) : "—"} />
					<Detail label="Porte" value={pet.size ? PET_SIZE_LABELS[pet.size] : "Não informado"} />
					<Detail label="Idade" value={formatAge(pet.birth_date)} />
					<Detail label="Sexo" value={(pet.sex && SEX_LABELS[pet.sex]) || "—"} />
				</dl>
				{pet.notes && <p className="text-sm text-muted-foreground">{pet.notes}</p>}
				{actions && <div className="mt-auto flex flex-wrap gap-2">{actions}</div>}
			</div>
		</article>
	);
}
