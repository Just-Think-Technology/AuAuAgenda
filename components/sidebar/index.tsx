"use client";

import { useState } from "react";
import Image from "next/image";
import { Link } from "next-view-transitions";
import { usePathname } from "next/navigation";

import { motion } from "motion/react";

import {
	CalendarDaysIcon,
	CalendarIcon,
	EllipsisIcon,
	HomeIcon,
	MenuIcon,
	PawPrintIcon,
	ScissorsIcon,
	SlidersHorizontalIcon,
	UserRoundIcon,
} from "lucide-react";

import logo from "@/assets/logo.png";

import { cn } from "@/lib/utils";
import type { AuthUser } from "@/lib/types";

import { Button } from "@/components/ui/button";
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { SettingsMenu } from "./settings-menu";

const ICONS = {
	home: HomeIcon,
	calendar: CalendarIcon,
	agenda: CalendarDaysIcon,
	pets: PawPrintIcon,
	services: ScissorsIcon,
	clients: UserRoundIcon,
	settings: SlidersHorizontalIcon,
} as const;

export type NavItem = {
	name: string;
	path: string;
	icon: keyof typeof ICONS;
	/** Only highlight on an exact path match (area home pages). */
	exact?: boolean;
};

type SidebarProps = {
	user: AuthUser;
	items: NavItem[];
	settingsHref: string;
	signOut?: () => Promise<void>;
};

function SidebarContent({
	user,
	items,
	settingsHref,
	signOut,
	onClickItem,
}: SidebarProps & { onClickItem?: () => void }) {
	const pathname = usePathname();

	return (
		<div className="flex flex-col flex-1 min-h-screen md:min-h-0 md:h-full justify-between bg-white">
			<header className="p-4">
				<Image src={logo} alt="AuAu Agenda" width={140} />
			</header>

			<nav aria-label="Navegação principal" className="px-3 flex-grow mt-30">
				<ul className="flex flex-col gap-3">
					{items.map((item) => {
						const Icon = ICONS[item.icon];
						const isActive = item.exact
							? pathname === item.path
							: pathname === item.path || pathname.startsWith(`${item.path}/`);

						return (
							<li key={item.path}>
								<Link
									href={item.path}
									onClick={onClickItem}
									aria-current={isActive ? "page" : undefined}
									className={cn(
										"relative w-full flex py-1.5 px-2.5 rounded-[6px] items-center",
										isActive
											? "text-foreground"
											: "text-muted-foreground transition-colors hover:text-foreground",
									)}
								>
									<div className="relative z-1 flex items-center gap-[11px]">
										<Icon size={20} aria-hidden />
										<span className="text-base font-medium">{item.name}</span>
									</div>

									{isActive && (
										<motion.div
											layoutId="active-pill"
											className="absolute inset-0 bg-[#EFF1F3] rounded-[8px] z-0"
											transition={{ type: "spring", duration: 0.4, bounce: 0 }}
										/>
									)}
								</Link>
							</li>
						);
					})}
				</ul>
			</nav>

			<footer className="h-16 pl-4 py-4 pr-2.5 border-t border-gray-200 flex items-center justify-between">
				<div className="flex items-center gap-1.5 min-w-0">
					<p className="text-sm font-medium truncate">{user.name}</p>
					{user.role === "admin" && (
						<span className="text-primary text-[10px] -mb-0.75 uppercase tracking-[1px]">
							Gestão
						</span>
					)}
				</div>
				<SettingsMenu settingsHref={settingsHref} signOut={signOut}>
					<Button
						variant="ghost"
						size="icon"
						aria-label="Abrir menu da conta"
						className="data-[state=open]:bg-accent focus-visible:ring-0 focus-visible:border-transparent"
					>
						<EllipsisIcon className="text-muted-foreground size-4.5" />
					</Button>
				</SettingsMenu>
			</footer>
		</div>
	);
}

export function Sidebar(props: SidebarProps) {
	const [open, setOpen] = useState(false);

	return (
		<>
			<aside className="hidden md:flex sticky top-0 w-68 h-screen border-r border-gray-200 flex-col bg-white">
				<SidebarContent {...props} />
			</aside>

			<header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white sticky top-0 z-50 w-full">
				<Image src={logo} alt="AuAu Agenda" width={36} />

				<Sheet open={open} onOpenChange={setOpen}>
					<SheetTrigger asChild>
						<Button variant="ghost" size="icon" aria-label="Abrir menu">
							<MenuIcon className="size-6 text-foreground" />
						</Button>
					</SheetTrigger>
					<SheetContent side="left" className="p-0 w-68 border-none flex flex-col bg-white">
						<SheetHeader className="sr-only">
							<SheetTitle>Menu de navegação</SheetTitle>
						</SheetHeader>
						<SidebarContent {...props} onClickItem={() => setOpen(false)} />
					</SheetContent>
				</Sheet>
			</header>
		</>
	);
}
