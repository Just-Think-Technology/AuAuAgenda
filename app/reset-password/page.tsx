import type { Metadata } from "next";

import { NovaSenha } from "@/components/pages/forget";
import { blockDemoRoute } from "@/lib/mock/demo-route-block";

export const metadata: Metadata = {
	title: "Nova senha",
};

type ResetPasswordPageProps = {
	searchParams: Promise<{ token?: string }>;
};

export default async function ResetPasswordPage({
	searchParams,
}: ResetPasswordPageProps) {
	blockDemoRoute("/");
	const { token } = await searchParams;

	return <NovaSenha token={token} />;
}
