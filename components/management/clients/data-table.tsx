"use client";

import { useState } from "react";

import {
	type ColumnDef,
	type ColumnFiltersState,
	type FilterFn,
	type PaginationState,
	type SortingState,
	type VisibilityState,
	flexRender,
	getCoreRowModel,
	getFilteredRowModel,
	getPaginationRowModel,
	getSortedRowModel,
	useReactTable,
} from "@tanstack/react-table";
import { ArrowLeftIcon, ArrowRightIcon, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	onRowClick?: (row: TData) => void;
	isRowActive?: (row: TData) => boolean;
}

const globalFilterFn: FilterFn<unknown> = (row, _columnId, filterValue) => {
	const raw = String(filterValue ?? "")
		.trim()
		.toLowerCase();
	if (!raw) return true;

	const r = row.original as { name?: string; cpf?: string; email?: string | null; phone?: string | null };
	const digits = raw.replace(/\D/g, "");

	if (
		String(r.name ?? "")
			.toLowerCase()
			.includes(raw)
	)
		return true;
	if (
		String(r.email ?? "")
			.toLowerCase()
			.includes(raw)
	)
		return true;
	if (
		digits &&
		String(r.cpf ?? "")
			.replace(/\D/g, "")
			.includes(digits)
	)
		return true;
	if (
		digits &&
		String(r.phone ?? "")
			.replace(/\D/g, "")
			.includes(digits)
	)
		return true;

	return false;
};

export function DataTable<TData, TValue>({
	columns,
	data,
	onRowClick,
	isRowActive,
}: DataTableProps<TData, TValue>) {
	const [sorting, setSorting] = useState<SortingState>([]);
	const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
	const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
	const [rowSelection, setRowSelection] = useState({});
	const [globalFilter, setGlobalFilter] = useState("");
	const [pagination, setPagination] = useState<PaginationState>({
		pageIndex: 0,
		pageSize: 14,
	});

	const table = useReactTable({
		data,
		columns,
		getCoreRowModel: getCoreRowModel(),
		getPaginationRowModel: getPaginationRowModel(),
		getSortedRowModel: getSortedRowModel(),
		getFilteredRowModel: getFilteredRowModel(),
		globalFilterFn: globalFilterFn as FilterFn<TData>,
		onSortingChange: setSorting,
		onColumnFiltersChange: setColumnFilters,
		onColumnVisibilityChange: setColumnVisibility,
		onRowSelectionChange: setRowSelection,
		onGlobalFilterChange: setGlobalFilter,
		onPaginationChange: setPagination,
		state: {
			sorting,
			columnFilters,
			columnVisibility,
			rowSelection,
			globalFilter,
			pagination,
		},
	});

	return (
		<div className="space-y-4">
			<div className="flex items-center justify-between gap-2">
				<InputGroup className="w-full sm:w-[270px]">
					<InputGroupAddon>
						<Search className="size-3.5" />
					</InputGroupAddon>
					<InputGroupInput
						placeholder="Buscar por nome, CPF ou e-mail"
						value={globalFilter}
						onChange={(event) => setGlobalFilter(event.target.value)}
					/>
				</InputGroup>
			</div>

			<div className="overflow-x-auto rounded-md border bg-background">
				<Table>
					<TableHeader>
						{table.getHeaderGroups().map((headerGroup) => (
							<TableRow key={headerGroup.id}>
								{headerGroup.headers.map((header) => (
									<TableHead key={header.id} className="px-4">
										{header.isPlaceholder
											? null
											: flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
									</TableHead>
								))}
							</TableRow>
						))}
					</TableHeader>
					<TableBody>
						{table.getRowModel().rows?.length ? (
							table.getRowModel().rows.map((row) => {
								const active = isRowActive?.(row.original) ?? false;

								return (
									<TableRow
										key={row.id}
										data-state={row.getIsSelected() && "selected"}
										onClick={() => onRowClick?.(row.original)}
										onKeyDown={(e) => {
											if (onRowClick && (e.key === "Enter" || e.key === " ")) {
												e.preventDefault();
												onRowClick(row.original);
											}
										}}
										tabIndex={onRowClick ? 0 : undefined}
										role={onRowClick ? "button" : undefined}
										className={cn(
											onRowClick && "cursor-pointer hover:bg-neutral-50/80",
											active && "bg-neutral-50/70",
										)}
									>
										{row.getVisibleCells().map((cell) => (
											<TableCell key={cell.id} className="px-4">
												{flexRender(
													cell.column.columnDef.cell,
													cell.getContext(),
												)}
											</TableCell>
										))}
									</TableRow>
								);
							})
						) : (
							<TableRow>
								<TableCell
									colSpan={columns.length}
									className="h-24 text-center"
								>
									Nenhum cliente encontrado.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</div>

			<div className="flex items-center justify-end gap-2">
				<Button
					variant="outline"
					size="icon"
					aria-label="Página anterior"
					onClick={() => table.previousPage()}
					disabled={!table.getCanPreviousPage()}
				>
					<ArrowLeftIcon className="w-4 h-4" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					aria-label="Próxima página"
					onClick={() => table.nextPage()}
					disabled={!table.getCanNextPage()}
				>
					<ArrowRightIcon className="w-4 h-4" />
				</Button>
			</div>
		</div>
	);
}
