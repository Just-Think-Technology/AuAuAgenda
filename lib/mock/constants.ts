export const MOCK_STORAGE_KEY = "auauagenda:mock:v1";

export const MOCK_DEMO_ADMIN_EMAIL = "demo@auauagenda.local";
export const MOCK_DEMO_ADMIN_PASSWORD = "demo123456";

export const MOCK_ADMIN_ID = "b0000001-0001-4000-8000-000000000001";
export const MOCK_ADMIN_NAME = "Equipe Demo";
export const MOCK_ADMIN_SESSION_VERSION = 0;

/** Server-side demo admin. Never accept these fields from the browser. */
export const DEMO_ADMIN_IDENTITY = {
	adminId: MOCK_ADMIN_ID,
	name: MOCK_ADMIN_NAME,
	email: MOCK_DEMO_ADMIN_EMAIL,
	sessionVersion: MOCK_ADMIN_SESSION_VERSION,
} as const;
