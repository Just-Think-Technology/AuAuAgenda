import type { Metadata } from "next";

import { RecuperarSenha } from "@/components/pages/senha";

export const metadata: Metadata = {
	title: "Recuperar senha",
};

export default function SenhaPage() {
	return <RecuperarSenha />;
}
