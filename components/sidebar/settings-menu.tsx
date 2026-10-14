"use client";

import { Link } from "next-view-transitions";
import { LogOutIcon, SettingsIcon } from "lucide-react";

import { logoutAction } from "@/app/actions/auth";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function SettingsMenu({
	children,
	settingsHref,
	signOut = logoutAction,
}: {
	children: React.ReactNode;
	settingsHref: string;
	signOut?: () => Promise<void>;
}) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
			<DropdownMenuContent className="w-48" align="start">
				<DropdownMenuItem asChild>
					<Link href={settingsHref} className="flex cursor-pointer items-center gap-2">
						<SettingsIcon />
						Configurações
					</Link>
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<form action={signOut}>
					<DropdownMenuItem asChild className="!text-destructive focus:bg-destructive/10">
						<button type="submit" className="w-full">
							<LogOutIcon className="text-inherit" />
							Sair
						</button>
					</DropdownMenuItem>
				</form>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
