import type { Metadata } from "next";

import { Cadastro } from "@/components/pages/cadastro";

export const metadata: Metadata = {
	title: "Cadastro",
};

export default function CadastroPage() {
	return <Cadastro />;
}
