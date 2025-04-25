'use client';
import React from 'react';
import Modal from './Modal'; // Assuming Modal component is in the same directory or adjust path
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
export default function ConfirmationModal(_a) {
    var isOpen = _a.isOpen, onClose = _a.onClose, onConfirm = _a.onConfirm, title = _a.title, message = _a.message, _b = _a.confirmButtonText, confirmButtonText = _b === void 0 ? 'Confirmer' : _b, _c = _a.cancelButtonText, cancelButtonText = _c === void 0 ? 'Annuler' : _c, _d = _a.isLoading, isLoading = _d === void 0 ? false : _d;
    return (<Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" aria-hidden="true"/>
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <p className="text-sm text-gray-500">
                        {message}
                    </p>
                </div>
            </div>
            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button type="button" className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto disabled:opacity-50" onClick={onConfirm} disabled={isLoading}>
                    {isLoading ? 'Chargement...' : confirmButtonText}
                </button>
                <button type="button" className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto disabled:opacity-50" onClick={onClose} disabled={isLoading}>
                    {cancelButtonText}
                </button>
            </div>
        </Modal>);
}
