'use client';

import { useAuth } from '@/contexts/auth-context';
import { usePendingSessionRequests } from '@/queries/useSessions';
import { Mentorship } from '@/types';
import Link from 'next/link';
import { useState } from 'react';
import { BookSessionModal } from './modals/BookSessionModal';
import { Button } from './ui/button';

interface BookSessionButtonProps {
	mentor: Mentorship;
	MentorId: string;
	className?: string;
	disabled?: boolean; // disabled by browse/home page
	isProfilePage?: boolean;
	isMimic?: boolean;
}

export const BookSessionButton = ({
	mentor,
	MentorId,
	className = '',
	disabled = false,
	isProfilePage = true,
	isMimic,
}: BookSessionButtonProps) => {
	const { user } = useAuth();
	const [isBookSessionOpen, setIsBookSessionOpen] = useState(false);

	const { data: pendingSessionResult, isLoading: isLoadingPendingSessionRequest } = usePendingSessionRequests(
		user?.uid || '',
		MentorId,
		!disabled && isProfilePage
	);

	const isSameUser = user?.uid === MentorId;

	if (isSameUser) return null;

	if (!user) {
		return (
			<Link href="/auth/login" className={className}>
				<Button className="w-full gap-2 rounded-xl bg-green-600 px-8 text-white shadow-sm hover:bg-green-700">
					Book Session
				</Button>
			</Link>
		);
	}

	return (
		<>
			{isBookSessionOpen && (
				<BookSessionModal
					isOpen={isBookSessionOpen}
					onClose={() => setIsBookSessionOpen(false)}
					mentor={mentor}
					MentorId={MentorId}
					isMimic={isMimic}
				/>
			)}
			<Button
				onClick={() => setIsBookSessionOpen(true)}
				className={`gap-2 rounded-xl bg-green-600 px-8 text-white shadow-sm hover:bg-green-700 ${className}`}
				disabled={!!pendingSessionResult || isLoadingPendingSessionRequest || disabled}
				title={(isProfilePage && pendingSessionResult) || disabled ? 'You have a pending request' : 'Book Session'}
			>
				Book Session
			</Button>
		</>
	);
};
