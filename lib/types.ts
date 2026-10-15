export type AuthUser =
	| { cpf: string; name: string; email: string | null; role: "client" }
	| { admin_id: string; name: string; email: string; role: "admin" };

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export type FormState = ActionResult | undefined;
