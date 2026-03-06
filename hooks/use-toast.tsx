'use client';

import type { Toast } from '@/components/ui/toast';
import { useCallback, useState } from 'react';

let toastCounter = 0;

export function useToast() {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
		const id = `toast-${++toastCounter}`;
		const newToast: Toast = { ...toast, id };

		setToasts((prev) => [...prev, newToast]);

		return id;
	}, []);

	const removeToast = useCallback((id: string) => {
		setToasts((prev) => prev.filter((toast) => toast.id !== id));
	}, []);

	const clearAllToasts = useCallback(() => {
		setToasts([]);
	}, []);

	// Convenience methods for different toast types
	const success = useCallback(
		(title: string, description?: string, duration?: number) => {
			return addToast({ type: 'success', title, description, duration });
		},
		[addToast]
	);

	const error = useCallback(
		(title: string, description?: string, duration?: number) => {
			return addToast({ type: 'error', title, description, duration });
		},
		[addToast]
	);

	const info = useCallback(
		(title: string, description?: string, duration?: number) => {
			return addToast({ type: 'info', title, description, duration });
		},
		[addToast]
	);

	const warning = useCallback(
		(title: string, description?: string, duration?: number) => {
			return addToast({ type: 'warning', title, description, duration });
		},
		[addToast]
	);

	return {
		toasts,
		addToast,
		removeToast,
		clearAllToasts,
		success,
		error,
		info,
		warning,
	};
}

// Global toast instance for use outside of React components
let globalToastHandler: ReturnType<typeof useToast> | null = null;

export function setGlobalToastHandler(handler: ReturnType<typeof useToast>) {
	globalToastHandler = handler;
}

// Global toast functions that can be used anywhere
export const toast = {
	success: (title: string, description?: string, duration?: number) => {
		globalToastHandler?.success(title, description, duration);
	},
	error: (title: string, description?: string, duration?: number) => {
		globalToastHandler?.error(title, description, duration);
	},
	info: (title: string, description?: string, duration?: number) => {
		globalToastHandler?.info(title, description, duration);
	},
	warning: (title: string, description?: string, duration?: number) => {
		globalToastHandler?.warning(title, description, duration);
	},
};
