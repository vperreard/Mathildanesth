'use client';
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
// Définir les variantes de badge basées sur les classes Tailwind existantes
export var badgeVariants = cva("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium", {
    variants: {
        variant: {
            default: "bg-primary-100 text-primary-700",
            secondary: "bg-secondary-100 text-secondary-700",
            tertiary: "bg-tertiary-100 text-tertiary-700",
            success: "bg-green-100 text-green-800",
            info: "bg-blue-100 text-blue-800",
            warning: "bg-yellow-100 text-yellow-800",
            danger: "bg-red-100 text-red-800",
            outline: "bg-transparent border border-current",
            gray: "bg-gray-100 text-gray-800",
        },
        size: {
            sm: "px-2 py-0.25 text-xs",
            md: "px-2.5 py-0.5 text-xs",
            lg: "px-3 py-1 text-sm",
        },
        dotted: {
            true: "pl-1.5", // Plus petit padding à gauche pour faire de la place pour le point
        },
        outline: {
            true: "bg-transparent border",
        },
        removable: {
            true: "pr-1", // Padding réduit à droite pour le bouton de suppression
        },
    },
    compoundVariants: [
        {
            variant: 'default',
            outline: true,
            className: "border-primary-500 text-primary-700",
        },
        {
            variant: 'secondary',
            outline: true,
            className: "border-secondary-500 text-secondary-700",
        },
        {
            variant: 'success',
            outline: true,
            className: "border-green-500 text-green-700",
        },
        {
            variant: 'info',
            outline: true,
            className: "border-blue-500 text-blue-700",
        },
        {
            variant: 'warning',
            outline: true,
            className: "border-yellow-500 text-yellow-700",
        },
        {
            variant: 'danger',
            outline: true,
            className: "border-red-500 text-red-700",
        },
    ],
    defaultVariants: {
        variant: 'default',
        size: 'md',
    },
});
export function Badge(_a) {
    var className = _a.className, variant = _a.variant, size = _a.size, dotted = _a.dotted, outline = _a.outline, removable = _a.removable, onRemove = _a.onRemove, children = _a.children, props = __rest(_a, ["className", "variant", "size", "dotted", "outline", "removable", "onRemove", "children"]);
    return (<span className={cn(badgeVariants({ variant: variant, size: size, dotted: dotted, outline: outline, removable: removable }), className)} {...props}>
            {dotted && (<span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-current"/>)}
            {children}
            {removable && onRemove && (<button type="button" className="ml-1 -mr-1 h-3.5 w-3.5 rounded-full inline-flex items-center justify-center text-current hover:bg-white/30 focus:outline-none" onClick={function (e) {
                e.stopPropagation();
                onRemove();
            }}>
                    <span className="sr-only">Supprimer</span>
                    <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
                    </svg>
                </button>)}
        </span>);
}
