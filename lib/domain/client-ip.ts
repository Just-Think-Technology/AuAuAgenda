import { isIP } from "node:net";

export const UNKNOWN_CLIENT_IP = "unknown";

export function resolveClientIp(input: {
	trustPlatformIp: boolean;
	realIp: string | null | undefined;
	forwardedFor: string | null | undefined;
}): string {
	if (!input.trustPlatformIp) return UNKNOWN_CLIENT_IP;
	return firstValidIp(input.realIp) ?? firstValidIp(input.forwardedFor) ?? UNKNOWN_CLIENT_IP;
}

function firstValidIp(raw: string | null | undefined): string | null {
	if (!raw) return null;
	const hop = raw.split(",")[0]?.trim();
	if (!hop) return null;
	const candidate = stripPort(hop);
	return isIP(candidate) ? candidate : null;
}

function stripPort(value: string): string {
	if (value.startsWith("[")) {
		const end = value.indexOf("]");
		if (end > 1) return value.slice(1, end);
	}
	const ipv4WithPort = /^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/;
	const match = value.match(ipv4WithPort);
	return match?.[1] ?? value;
}
