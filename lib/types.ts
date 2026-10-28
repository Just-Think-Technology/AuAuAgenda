export type AuthUser =
	| { clientId: string; name: string; role: "client" }
	| { admin_id: string; name: string; email: string; role: "admin" };

export type ActionResult = { ok: true; message?: string } | { ok: false; error: string };

export type FormState = ActionResult | undefined;
