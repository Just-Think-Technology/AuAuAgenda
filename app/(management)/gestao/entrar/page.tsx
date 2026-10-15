import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AdminLogin } from "@/components/pages/login/admin-login";
import { getCurrentAdmin, MANAGEMENT_HOME } from "@/lib/server/current-user";

export const metadata: Metadata = { title: "Acesso da equipe" };

export default async function AdminLoginPage() {
	if (await getCurrentAdmin()) redirect(MANAGEMENT_HOME);
	return <AdminLogin />;
}
