import { redirect } from "next/navigation";

/** Old address. Opening /gestao is enough: that route asks for login when needed. */
export default function AdminLoginRedirectPage() {
	redirect("/gestao");
}
