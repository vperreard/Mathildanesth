'use client';

import React, { HTMLAttributes, TdHTMLAttributes, ThHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

// Composant Table principal
interface TableProps extends HTMLAttributes<HTMLTableElement> {
    striped?: boolean;
    hover?: boolean;
    bordered?: boolean;
    compact?: boolean;
}

const Table = forwardRef<HTMLTableElement, TableProps>(
    ({ className, striped = false, hover = false, bordered = false, compact = false, ...props }, ref) => {
        return (
            <div className="w-full overflow-auto">
                <table
                    ref={ref}
                    className={cn(
                        "min-w-full divide-y divide-gray-200",
                        bordered && "border-collapse border border-gray-200",
                        className
                    )}
                    {...props}
                />
            </div>
        );
    }
);

Table.displayName = 'Table';

// Composant TableHeader
interface TableHeaderProps extends HTMLAttributes<HTMLTableSectionElement> { }

const TableHeader = forwardRef<HTMLTableSectionElement, TableHeaderProps>(
    ({ className, ...props }, ref) => {
        return (
            <thead
                ref={ref}
                className={cn("bg-gray-50", className)}
                {...props}
            />
        );
    }
);

TableHeader.displayName = 'TableHeader';

// Composant TableBody
interface TableBodyProps extends HTMLAttributes<HTMLTableSectionElement> {
    striped?: boolean;
    hover?: boolean;
}

const TableBody = forwardRef<HTMLTableSectionElement, TableBodyProps>(
    ({ className, striped = false, hover = false, ...props }, ref) => {
        return (
            <tbody
                ref={ref}
                className={cn(
                    "bg-white divide-y divide-gray-200",
                    striped && "[&>tr:nth-child(odd)]:bg-gray-50",
                    hover && "[&>tr:hover]:bg-gray-100",
                    className
                )}
                {...props}
            />
        );
    }
);

TableBody.displayName = 'TableBody';

// Composant TableRow
interface TableRowProps extends HTMLAttributes<HTMLTableRowElement> {
    selected?: boolean;
}

const TableRow = forwardRef<HTMLTableRowElement, TableRowProps>(
    ({ className, selected = false, ...props }, ref) => {
        return (
            <tr
                ref={ref}
                className={cn(
                    selected && "bg-primary-50",
                    className
                )}
                {...props}
            />
        );
    }
);

TableRow.displayName = 'TableRow';

// Composant TableHead
interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
    sortable?: boolean;
    sorted?: 'asc' | 'desc' | false;
}

const TableHead = forwardRef<HTMLTableCellElement, TableHeadProps>(
    ({ className, sortable = false, sorted = false, ...props }, ref) => {
        return (
            <th
                ref={ref}
                className={cn(
                    "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider",
                    sortable && "cursor-pointer select-none",
                    sorted === 'asc' && "text-primary-600 [&>svg]:rotate-0",
                    sorted === 'desc' && "text-primary-600 [&>svg]:rotate-180",
                    className
                )}
                {...props}
            >
                <div className="flex items-center space-x-1">
                    <span>{props.children}</span>
                    {sortable && (
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={cn(
                                "h-4 w-4 transition-transform",
                                sorted ? "opacity-100" : "opacity-0 group-hover:opacity-50"
                            )}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M5 15l7-7 7 7"
                            />
                        </svg>
                    )}
                </div>
            </th>
        );
    }
);

TableHead.displayName = 'TableHead';

// Composant TableCell
interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
    compact?: boolean;
}

const TableCell = forwardRef<HTMLTableCellElement, TableCellProps>(
    ({ className, compact = false, ...props }, ref) => {
        return (
            <td
                ref={ref}
                className={cn(
                    "px-6 py-4 whitespace-nowrap text-sm text-gray-700",
                    compact && "px-4 py-2",
                    className
                )}
                {...props}
            />
        );
    }
);

TableCell.displayName = 'TableCell';

// Composant TableFooter
interface TableFooterProps extends HTMLAttributes<HTMLTableSectionElement> { }

const TableFooter = forwardRef<HTMLTableSectionElement, TableFooterProps>(
    ({ className, ...props }, ref) => {
        return (
            <tfoot
                ref={ref}
                className={cn("bg-gray-50 border-t border-gray-200", className)}
                {...props}
            />
        );
    }
);

TableFooter.displayName = 'TableFooter';

export {
    Table,
    TableHeader,
    TableBody,
    TableFooter,
    TableHead,
    TableRow,
    TableCell,
}; 