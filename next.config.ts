import type { NextConfig } from "next";

const securityHeaders = [
	{ key: "X-Frame-Options", value: "DENY" },
	{ key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
	{ key: "X-Content-Type-Options", value: "nosniff" },
	{ key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
	{ key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
	turbopack: { root: __dirname },
	experimental: {
		// Run PostCSS in a worker thread so the publish build does not
		// depend on a loopback connection from a child process.
		turbopackPluginRuntimeStrategy: "workerThreads",
	},
	env: {
		NEXT_PUBLIC_MOCKS: process.env.MOCKS === "true" ? "true" : "false",
	},
	async headers() {
		return [{ source: "/:path*", headers: securityHeaders }];
	},
};

export default nextConfig;
