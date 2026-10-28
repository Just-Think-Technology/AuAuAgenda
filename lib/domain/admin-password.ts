import bcrypt from "bcryptjs";

/** Compared when no account matches so response time does not reveal which e-mails exist. */
const DUMMY_HASH = "$2b$10$1RBzoalrvk.VwHlndExZiurqPcvXG0NpsjfgRDftoVTPgMYc37S4i";

/** Always runs one bcrypt compare. Missing hash still compares against a dummy. */
export async function verifyAdminPassword(password: string, storedHash: string | null): Promise<boolean> {
	if (storedHash) return bcrypt.compare(password, storedHash);
	await bcrypt.compare(password, DUMMY_HASH);
	return false;
}
