"use client"

import * as React from "react"
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    useReactTable,
    getPaginationRowModel,
    SortingState,
    getSortedRowModel,
    ColumnFiltersState,
    getFilteredRowModel,
} from "@tanstack/react-table"
import { useVirtualizer } from "@tanstack/react-virtual"

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import Button from "@/components/ui/button"
import Input from "@/components/ui/input"

interface VirtualTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[]
    data: TData[]
    searchKey?: string
    pagination?: boolean
    pageSize?: number
    height?: number
    rowHeight?: number
    estimateSize?: boolean
    overscan?: number
}

/**
 * Table virtualisée pour afficher de grandes quantités de données avec des performances optimales
 * Utilise @tanstack/react-virtual pour ne rendre que les lignes visibles, peu importe la taille du dataset
 */
export function VirtualTable<TData, TValue>({
    columns,
    data,
    searchKey,
    pagination = true,
    pageSize = 10,
    height = 400,
    rowHeight = 40,
    estimateSize = true,
    overscan = 10,
}: VirtualTableProps<TData, TValue>) {
    const [sorting, setSorting] = React.useState<SortingState>([])
    const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])

    const tableContainerRef = React.useRef<HTMLDivElement>(null)

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onSortingChange: setSorting,
        getSortedRowModel: getSortedRowModel(),
        onColumnFiltersChange: setColumnFilters,
        getFilteredRowModel: getFilteredRowModel(),
        state: {
            sorting,
            columnFilters,
        },
        initialState: {
            pagination: {
                pageSize: pagination ? pageSize : data.length,
            },
        },
    })

    // Configuration du virtualizer pour les lignes
    const { rows } = table.getRowModel()
    const rowVirtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => tableContainerRef.current,
        estimateSize: (index: number) => rowHeight,
        overscan,
    })

    return (
        <div>
            {searchKey && (
                <div className="flex items-center py-4">
                    <Input
                        placeholder="Rechercher..."
                        value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
                            table.getColumn(searchKey)?.setFilterValue(event.target.value)
                        }
                        className="max-w-sm"
                    />
                </div>
            )}
            <div className="rounded-md border">
                <div
                    ref={tableContainerRef}
                    className="w-full overflow-auto"
                    style={{ height }}
                >
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => {
                                        return (
                                            <TableHead key={header.id}>
                                                {header.isPlaceholder
                                                    ? null
                                                    : flexRender(
                                                        header.column.columnDef.header,
                                                        header.getContext()
                                                    )}
                                            </TableHead>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableHeader>
                        <TableBody>
                            {/* Placeholder pour la hauteur virtualisée */}
                            <tr style={{ height: `${rowVirtualizer.getTotalSize()}px` }}>
                                <td style={{ padding: 0 }} colSpan={columns.length}>
                                    {/* Container virtualisé pour les lignes visibles uniquement */}
                                    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
                                        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                                            const row = rows[virtualRow.index]
                                            return (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                    style={{
                                                        position: 'absolute',
                                                        top: 0,
                                                        left: 0,
                                                        width: '100%',
                                                        transform: `translateY(${virtualRow.start}px)`,
                                                    }}
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id}>
                                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            )
                                        })}
                                    </div>
                                </td>
                            </tr>
                            {rows.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={columns.length} className="h-24 text-center">
                                        Aucun résultat.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>
            {pagination && (
                <div className="flex items-center justify-end space-x-2 py-4">
                    <div className="text-sm text-muted-foreground">
                        Page {table.getState().pagination.pageIndex + 1} sur{" "}
                        {table.getPageCount()}
                    </div>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.previousPage()}
                        disabled={!table.getCanPreviousPage()}
                    >
                        Précédent
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => table.nextPage()}
                        disabled={!table.getCanNextPage()}
                    >
                        Suivant
                    </Button>
                </div>
            )}
        </div>
    )
} 