import type { StaticImageData } from "next/image";

import beagle from "@/assets/dogs/beagle.png";
import boxer from "@/assets/dogs/boxer.png";
import buldogue from "@/assets/dogs/buldogue.png";
import dachshund from "@/assets/dogs/dachshund.png";
import golden from "@/assets/dogs/golden.png";
import husky from "@/assets/dogs/husky.png";
import labrador from "@/assets/dogs/labrador.png";
import pastorAlemao from "@/assets/dogs/pastor-alemao.png";
import poodle from "@/assets/dogs/poodle.png";
import rottweiler from "@/assets/dogs/rottweiler.png";
import yorkshire from "@/assets/dogs/yorkshire.png";
import bengal from "@/assets/cats/bengal.png";
import maineCoon from "@/assets/cats/maniecoon.png";
import ragdoll from "@/assets/cats/ragdoll.png";
import sphynx from "@/assets/cats/sphynx.png";

const DOG_BREEDS: Record<string, string> = {
	"labrador retriever": "Labrador Retriever",
	"golden retriever": "Golden Retriever",
	"german shepherd": "Pastor Alemão",
	bulldog: "Buldogue",
	"french bulldog": "Buldogue Francês",
	"english bulldog": "Buldogue Inglês",
	poodle: "Poodle",
	beagle: "Beagle",
	rottweiler: "Rottweiler",
	"yorkshire terrier": "Yorkshire Terrier",
	boxer: "Boxer",
	dachshund: "Dachshund",
	"siberian husky": "Husky Siberiano",
	chihuahua: "Chihuahua",
	pug: "Pug",
	"shih tzu": "Shih Tzu",
	"border collie": "Border Collie",
	"australian shepherd": "Pastor Australiano",
	"cocker spaniel": "Cocker Spaniel",
	maltese: "Maltês",
	pomeranian: "Lulu da Pomerânia",
	doberman: "Dobermann",
	"great dane": "Dogue Alemão",
	"saint bernard": "São Bernardo",
	"jack russell terrier": "Jack Russell Terrier",
	"bernese mountain dog": "Boiadeiro de Berna",
	akita: "Akita",
	"shiba inu": "Shiba Inu",
	"basset hound": "Basset Hound",
	"chow chow": "Chow Chow",
	dalmatian: "Dálmata",
	"english mastiff": "Mastim Inglês",
	"pit bull": "Pit Bull",
	"american pit bull terrier": "American Pit Bull Terrier",
	"staffordshire bull terrier": "Staffordshire Bull Terrier",
	"cavalier king charles spaniel": "Cavalier King Charles Spaniel",
	"shetland sheepdog": "Pastor de Shetland",
	weimaraner: "Weimaraner",
	"belgian malinois": "Pastor Belga Malinois",
	"english springer spaniel": "Springer Spaniel Inglês",
	collie: "Collie",
	"old english sheepdog": "Pastor Inglês Antigo",
	mongrel: "Vira-lata",
	mutt: "Vira-lata",
	"mixed breed": "Vira-lata",
};

const CAT_BREEDS: Record<string, string> = {
	persian: "Persa",
	siamese: "Siamês",
	"maine coon": "Maine Coon",
	ragdoll: "Ragdoll",
	"british shorthair": "British Shorthair",
	sphynx: "Sphynx",
	bengal: "Bengal",
	"russian blue": "Azul Russo",
	"scottish fold": "Scottish Fold",
	abyssinian: "Abissínio",
	"american shorthair": "American Shorthair",
	burmese: "Burmês",
	"norwegian forest cat": "Floresta da Noruega",
	siberian: "Siberiano",
	"oriental shorthair": "Oriental de Pelo Curto",
	"exotic shorthair": "Exótico de Pelo Curto",
	"turkish angora": "Angorá Turco",
	"turkish van": "Van Turco",
	birman: "Sagrado da Birmânia",
	himalayan: "Himalaio",
	manx: "Manx",
	devon: "Devon Rex",
	"devon rex": "Devon Rex",
	"cornish rex": "Cornish Rex",
	"selkirk rex": "Selkirk Rex",
};

const BREED_IMAGES: Record<string, StaticImageData> = {
	"labrador retriever": labrador,
	"golden retriever": golden,
	"german shepherd": pastorAlemao,
	bulldog: buldogue,
	poodle,
	beagle,
	rottweiler,
	"yorkshire terrier": yorkshire,
	boxer,
	dachshund,
	"siberian husky": husky,
	bengal,
	"maine coon": maineCoon,
	ragdoll,
	sphynx,
};

export type BreedSpecies = "dog" | "cat";

export function translateBreedName(name: string): string {
	const key = name.trim().toLowerCase();
	return DOG_BREEDS[key] ?? CAT_BREEDS[key] ?? name;
}

export function getBreedImage(
	name: string | null | undefined,
): StaticImageData | null {
	if (!name) return null;
	return BREED_IMAGES[name.trim().toLowerCase()] ?? null;
}

export function getBreedSpecies(name: string): BreedSpecies | null {
	const key = name.trim().toLowerCase();
	if (key in DOG_BREEDS) return "dog";
	if (key in CAT_BREEDS) return "cat";
	return null;
}
