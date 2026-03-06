'use client';

import { db } from '@/firebase/firabase';
import { getUsersCount, getUsersPaginated, searchUsers } from '@/firebase/userServices';
import { User } from '@/types';
import { DocumentData, QueryDocumentSnapshot, collection, getDocs } from 'firebase/firestore';
import { useEffect, useState } from 'react';

export const useUsers = (search: string, pageSize = 5, roleFilter = 'all') => {
	const [users, setUsers] = useState<User[]>([]);
	const [lastDocs, setLastDocs] = useState<Record<number, QueryDocumentSnapshot<DocumentData>>>({});
	const [loading, setLoading] = useState(false);
	const [page, setPage] = useState(1);
	const [totalPages, setTotalPages] = useState(1);
	const [hasMore, setHasMore] = useState(true);
	const [totalUsers, setTotalUsers] = useState(0);
	const [allUsersCount, setAllUsersCount] = useState({
		admins: 0,
		mentors: 0,
		total: 0,
	});

	// Reset pagination when search changes
	useEffect(() => {
		setPage(1);
		setLastDocs({});
		setHasMore(true);
	}, [search, roleFilter]);

	useEffect(() => {
		const fetchData = async () => {
			setLoading(true);

			try {
				if (search.trim().length > 0) {
					const res = await searchUsers({ search, page, pageSize, roleFilter });
					setUsers(res.users);
					setTotalPages(res.pages);
					setHasMore(page < res.pages);
					setTotalUsers(res.total);
				} else {
					// Standard Pagination
					let cursor = null;
					if (page > 1) {
						cursor = lastDocs[page - 1];
					}

					// Fetch users and count in parallel
					const [res, count] = await Promise.all([
						getUsersPaginated({ pageSize, lastDoc: cursor, roleFilter }),
						getUsersCount(roleFilter),
					]);

					setUsers(res.users);
					setTotalUsers(count);
					setTotalPages(Math.ceil(count / pageSize));

					// Update hasMore based on whether we received a full page
					if (res.users.length < pageSize) {
						setHasMore(false);
					} else {
						setHasMore(true);
					}

					if (res.lastDoc) {
						setLastDocs((prev) => ({ ...prev, [page]: res.lastDoc }));
					}
				}

				// Fetch overall stats for the cards (admins/mentors regardless of current filter)
				// This is optional - you could also fetch this once or separately
				const allSnap = await getDocs(collection(db, 'users'));
				const allUsers = allSnap.docs.map((d) => d.data());
				setAllUsersCount({
					total: allUsers.length,
					admins: allUsers.filter((u: any) => Array.isArray(u.role) && u.role.includes('admin')).length,
					mentors: allUsers.filter((u: any) => Array.isArray(u.role) && u.role.includes('mentor')).length,
				});
			} catch (error) {
				console.error('Error fetching users:', error);
			} finally {
				setLoading(false);
			}
		};

		fetchData();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [search, page, roleFilter]); // Depend on page and search triggers

	return {
		users,
		setUsers,
		loading,
		page,
		setPage,
		totalPages,
		hasMore,
		totalUsers,
		allUsersCount,
	};
};
