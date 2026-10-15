import type { Metadata } from "next";

import { Cadastro } from "@/components/pages/cadastro";
import { blockDemoRoute } from "@/lib/mock/demo-route-block";

export const metadata: Metadata = {
	title: "Cadastro",
};

export default function CadastroPage() {
	blockDemoRoute("/");
	return <Cadastro />;
}
