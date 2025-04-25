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
import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
// Définir les variantes de carte basées sur les classes Tailwind existantes
export var cardVariants = cva("rounded-xl shadow-soft border border-gray-100 p-6 bg-white", {
    variants: {
        variant: {
            default: "",
            outline: "shadow-none border-2 border-gray-200",
            filled: "bg-primary-50 border-primary-100",
            elevated: "shadow-lg hover:shadow-xl transition-shadow duration-300",
        },
        size: {
            sm: "p-4",
            md: "p-6",
            lg: "p-8",
        },
        fullWidth: {
            true: "w-full",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "md",
    },
});
// Composant Card
var Card = forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, fullWidth = _a.fullWidth, children = _a.children, props = __rest(_a, ["className", "variant", "size", "fullWidth", "children"]);
    return (<div className={cn(cardVariants({ variant: variant, size: size, fullWidth: fullWidth, className: className }))} ref={ref} {...props}>
                {children}
            </div>);
});
Card.displayName = 'Card';
var CardHeader = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<div className={cn("mb-4", className)} ref={ref} {...props}>
                {children}
            </div>);
});
CardHeader.displayName = 'CardHeader';
var CardTitle = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<h3 className={cn("text-lg font-semibold text-gray-900", className)} ref={ref} {...props}>
                {children}
            </h3>);
});
CardTitle.displayName = 'CardTitle';
var CardDescription = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<p className={cn("text-sm text-gray-600 mt-1", className)} ref={ref} {...props}>
                {children}
            </p>);
});
CardDescription.displayName = 'CardDescription';
var CardContent = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<div className={cn("py-2", className)} ref={ref} {...props}>
                {children}
            </div>);
});
CardContent.displayName = 'CardContent';
var CardFooter = forwardRef(function (_a, ref) {
    var className = _a.className, children = _a.children, props = __rest(_a, ["className", "children"]);
    return (<div className={cn("pt-4 flex justify-end items-center gap-2", className)} ref={ref} {...props}>
                {children}
            </div>);
});
CardFooter.displayName = 'CardFooter';
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
