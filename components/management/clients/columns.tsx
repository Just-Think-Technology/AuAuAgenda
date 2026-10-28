"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontalIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { listClientsWithPets } from "@/lib/dal/accounts";
import { formatPhone } from "@/lib/format";

export type ManagedClient = Awaited<ReturnType<typeof listClientsWithPets>>[number];

export function buildColumns({ onDelete }: { onDelete: (clientId: string) => void }): ColumnDef<ManagedClient>[] {
	return [
		{
			accessorKey: "name",
			header: "Nome",
			cell: ({ row }) => <span className="font-medium text-foreground">{row.original.name}</span>,
		},
		{
			accessorKey: "phone",
			header: "Telefone",
			cell: ({ row }) => (
				<span className="whitespace-nowrap text-muted-foreground">{formatPhone(row.original.phone)}</span>
			),
		},
		{
			id: "pets",
			header: "Pets",
			cell: ({ row }) => (
				<span className="text-muted-foreground">
					{row.original.pet.length ? row.original.pet.map((p) => p.name).join(", ") : "—"}
				</span>
			),
		},
		{
			id: "actions",
			header: () => null,
			cell: ({ row }) => (
				<div
					className="text-right"
					onClick={(e) => e.stopPropagation()}
					onKeyDown={(e) => e.stopPropagation()}
					role="presentation"
				>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button type="button" variant="ghost" size="icon" aria-label={`Ações para ${row.original.name}`}>
								<MoreHorizontalIcon className="size-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-40">
							<DropdownMenuItem
								className="!text-destructive focus:bg-destructive/10"
								onClick={() => onDelete(row.original.client_id)}
							>
								<Trash2Icon className="text-inherit" />
								Remover
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			),
			enableSorting: false,
		},
	];
}
