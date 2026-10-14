import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";

import "@/styles/globals.css";

import { ViewTransitions } from "next-view-transitions";
import { Toaster } from "sonner";

import { cn } from "@/lib/utils";

const sans = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: {
		default: "AuAu Agenda",
		template: "%s · AuAu Agenda",
	},
	description: "Agendamento de banho, tosa e cuidados para pets.",
	icons: {
		icon: "/favicon.png",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<ViewTransitions>
			<html lang="pt-BR">
				<body
					className={cn(
						"antialiased font-sans",
						sans.variable,
						geistMono.variable,
					)}
				>
					{children}
					<Toaster richColors position="bottom-right" />
				</body>
			</html>
		</ViewTransitions>
	);
}
