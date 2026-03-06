'use client';

import { useAuth } from '@/contexts/auth-context';

export function usePermissions() {
	const { user } = useAuth();

	const permissions = user?.permissions || [];

	return {
		add: permissions.includes('add'),
		edit: permissions.includes('edit'),
		delete: permissions.includes('delete'),
		isAdmin: user?.role?.includes('admin'),
	};
}
