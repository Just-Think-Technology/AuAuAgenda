export type AuthUser =
	| { cpf: string; name: string; email: string | null; role: "client" }
	| { admin_id: string; name: string; email: string; role: "admin" };
