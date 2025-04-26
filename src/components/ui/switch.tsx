"use client";

import React from "react";
import { cn } from "@/lib/utils";

type SwitchProps = {
    checked: boolean;
    onChange: () => void;
    className?: string;
    children?: React.ReactNode;
    label?: string;
    disabled?: boolean;
    ariaLabel?: string;
};

const Switch: React.FC<SwitchProps> = ({
    checked,
    onChange,
    className,
    children,
    label,
    disabled,
    ariaLabel
}) => {
    return (
        <div className="flex items-center gap-2">
            {label && (
                <label
                    className="text-sm font-medium text-gray-700"
                    htmlFor={ariaLabel}
                >
                    {label}
                </label>
            )}
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                aria-label={ariaLabel || label}
                onClick={onChange}
                disabled={disabled}
                className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
                    checked ? "bg-blue-600" : "bg-gray-200",
                    disabled && "opacity-50 cursor-not-allowed",
                    className
                )}
            >
                <span
                    className={cn(
                        "inline-block h-4 w-4 rounded-full bg-white transition-transform",
                        checked ? "translate-x-6" : "translate-x-1"
                    )}
                    aria-hidden="true"
                />
                {children}
            </button>
        </div>
    );
};

export default Switch; 