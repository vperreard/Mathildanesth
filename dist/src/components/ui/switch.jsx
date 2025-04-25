"use client";
import React from "react";
import { cn } from "@/lib/utils";
var Switch = function (_a) {
    var checked = _a.checked, onChange = _a.onChange, className = _a.className, children = _a.children;
    return (<button type="button" role="switch" aria-checked={checked} onClick={onChange} className={cn("relative inline-flex h-6 w-11 items-center rounded-full transition-colors", checked ? "bg-blue-600" : "bg-gray-200", className)}>
            <span className={cn("inline-block h-4 w-4 rounded-full bg-white transition-transform", checked ? "translate-x-6" : "translate-x-1")}/>
            {children}
        </button>);
};
export default Switch;
