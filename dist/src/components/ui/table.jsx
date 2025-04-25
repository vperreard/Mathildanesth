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
import { cn } from '@/lib/utils';
var Table = forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.striped, striped = _b === void 0 ? false : _b, _c = _a.hover, hover = _c === void 0 ? false : _c, _d = _a.bordered, bordered = _d === void 0 ? false : _d, _e = _a.compact, compact = _e === void 0 ? false : _e, props = __rest(_a, ["className", "striped", "hover", "bordered", "compact"]);
    return (<div className="w-full overflow-auto">
                <table ref={ref} className={cn("min-w-full divide-y divide-gray-200", bordered && "border-collapse border border-gray-200", className)} {...props}/>
            </div>);
});
Table.displayName = 'Table';
var TableHeader = forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<thead ref={ref} className={cn("bg-gray-50", className)} {...props}/>);
});
TableHeader.displayName = 'TableHeader';
var TableBody = forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.striped, striped = _b === void 0 ? false : _b, _c = _a.hover, hover = _c === void 0 ? false : _c, props = __rest(_a, ["className", "striped", "hover"]);
    return (<tbody ref={ref} className={cn("bg-white divide-y divide-gray-200", striped && "[&>tr:nth-child(odd)]:bg-gray-50", hover && "[&>tr:hover]:bg-gray-100", className)} {...props}/>);
});
TableBody.displayName = 'TableBody';
var TableRow = forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.selected, selected = _b === void 0 ? false : _b, props = __rest(_a, ["className", "selected"]);
    return (<tr ref={ref} className={cn(selected && "bg-primary-50", className)} {...props}/>);
});
TableRow.displayName = 'TableRow';
var TableHead = forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.sortable, sortable = _b === void 0 ? false : _b, _c = _a.sorted, sorted = _c === void 0 ? false : _c, props = __rest(_a, ["className", "sortable", "sorted"]);
    return (<th ref={ref} className={cn("px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", sortable && "cursor-pointer select-none", sorted === 'asc' && "text-primary-600 [&>svg]:rotate-0", sorted === 'desc' && "text-primary-600 [&>svg]:rotate-180", className)} {...props}>
                <div className="flex items-center space-x-1">
                    <span>{props.children}</span>
                    {sortable && (<svg xmlns="http://www.w3.org/2000/svg" className={cn("h-4 w-4 transition-transform", sorted ? "opacity-100" : "opacity-0 group-hover:opacity-50")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7"/>
                        </svg>)}
                </div>
            </th>);
});
TableHead.displayName = 'TableHead';
var TableCell = forwardRef(function (_a, ref) {
    var className = _a.className, _b = _a.compact, compact = _b === void 0 ? false : _b, props = __rest(_a, ["className", "compact"]);
    return (<td ref={ref} className={cn("px-6 py-4 whitespace-nowrap text-sm text-gray-700", compact && "px-4 py-2", className)} {...props}/>);
});
TableCell.displayName = 'TableCell';
var TableFooter = forwardRef(function (_a, ref) {
    var className = _a.className, props = __rest(_a, ["className"]);
    return (<tfoot ref={ref} className={cn("bg-gray-50 border-t border-gray-200", className)} {...props}/>);
});
TableFooter.displayName = 'TableFooter';
export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, };
