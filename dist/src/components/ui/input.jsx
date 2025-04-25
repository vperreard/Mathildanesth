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
// Définir les variantes d'input basées sur les classes Tailwind existantes
export var inputVariants = cva("px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 sm:text-sm", {
    variants: {
        variant: {
            default: "",
            filled: "bg-gray-50 border-gray-200",
            outline: "bg-transparent border-2",
            error: "border-red-500 focus:ring-red-500 focus:border-red-500",
        },
        size: {
            sm: "px-2 py-1 text-xs",
            md: "px-3 py-2 text-sm",
            lg: "px-4 py-3 text-base",
        },
        fullWidth: {
            true: "w-full",
        },
        isDisabled: {
            true: "opacity-50 cursor-not-allowed bg-gray-100",
        },
    },
    defaultVariants: {
        variant: "default",
        size: "md",
    },
});
var Input = forwardRef(function (_a, ref) {
    var className = _a.className, variant = _a.variant, size = _a.size, fullWidth = _a.fullWidth, disabled = _a.disabled, error = _a.error, label = _a.label, icon = _a.icon, props = __rest(_a, ["className", "variant", "size", "fullWidth", "disabled", "error", "label", "icon"]);
    // Si une erreur est présente, utilisez la variante d'erreur
    var variantToUse = error ? "error" : variant;
    // Wrapper pour formulaire
    return (<div className="flex flex-col gap-1">
                {label && (<label htmlFor={props.id} className="block text-sm font-medium text-gray-700">
                        {label}
                    </label>)}

                <div className="relative">
                    {icon && (<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {icon}
                        </div>)}

                    <input className={cn(inputVariants({
            variant: variantToUse,
            size: size,
            fullWidth: fullWidth,
            isDisabled: disabled,
            className: className
        }), icon && "pl-10")} ref={ref} disabled={disabled} {...props}/>
                </div>

                {error && (<p className="mt-1 text-sm text-red-600">{error}</p>)}
            </div>);
});
Input.displayName = 'Input';
export default Input;
