'use client';

import { getCountryCode } from '@/lib/helpers';
import { useGetConversationByParticipantIds } from '@/queries/useChat';
import { Mentorship, MimicProfile, User } from '@/types';
import { Edit, Eye, Facebook, Instagram, Linkedin, MessageSquare, Star, Youtube } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { BookSessionButton } from './BookSessionButton';
import { Button } from './ui/button';

export const ProfileHeader = ({
	mentorShipData,
	averageRating,
	reviewCount,
	isSameUser,
	onEditClick,
	onBookClick,
	hasSentMessage,
	hasPendingMessage,
	user,
	MentorId,
	isMimic,
}: {
	mentorShipData: Mentorship | MimicProfile;
	averageRating: string;
	reviewCount: number;
	isSameUser: boolean;
	onEditClick: () => void;
	onBookClick: () => void;
	hasSentMessage: boolean;
	hasPendingMessage: boolean;
	user: User | null;
	MentorId: string;
	isMimic?: boolean;
}) => {
	const router = useRouter();

	const [conversationId, setConversationId] = useState<string | undefined>(undefined);

	const { data: conversation } = useGetConversationByParticipantIds(user?.uid || '', MentorId);

	useEffect(() => {
		if (conversation?.id) {
			setConversationId(conversation.id);
		}
	}, [conversation?.id]);

	const getActionButton = () => {
		if (isSameUser) {
			return {
				label: 'Edit Profile',
				icon: Edit,
				onClick: onEditClick,
				variant: 'outline' as const,
				className: 'gap-2 rounded-xl border-2 px-6',
				disabled: false,
			};
		}

		if (hasSentMessage && hasPendingMessage) {
			return {
				label: 'Message Request Pending',
				icon: MessageSquare,
				onClick: undefined,
				disabled: true,
			};
		}

		if (hasSentMessage && conversationId) {
			return {
				label: 'Chat with Mentor',
				icon: MessageSquare,
				onClick: () => router.push(`/messages?conversationId=${conversationId}`),
				disabled: false,
			};
		}

		return {
			label: 'Send Message Request',
			icon: MessageSquare,
			onClick: onBookClick,
			disabled: false,
		};
	};

	const action = getActionButton();
	const Icon = action.icon;

	return (
		<div className="relative overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-sm">
			{/* Cover Image */}
			<div className="relative h-48 overflow-hidden sm:h-64">
				<Image src={mentorShipData.coverImage || '/mentor-placeholder.png'} alt="Cover" fill className="object-cover" />
				<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
			</div>

			{/* Profile Content */}
			<div className="relative px-6 pb-8 sm:px-8">
				{/* Profile Image - Overlapping cover */}
				<div className="-mt-16 mb-6 flex items-end justify-between">
					<div className="relative">
						<div className="h-32 w-32 overflow-hidden rounded-2xl border-4 border-white bg-white shadow-lg">
							<Image
								src={mentorShipData.profileImage || '/mentor-cover-placeholder.png'}
								alt={mentorShipData.name}
								fill
								className="object-cover"
							/>
						</div>
						{'country' in mentorShipData && mentorShipData.country && (
							<div className="absolute -bottom-2 -right-2 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-neutral-200 bg-white text-xl shadow-sm">
								{getCountryCode(mentorShipData.country)}
							</div>
						)}
					</div>
					{/* Desktop Action Button */}
					<div className="hidden gap-2 sm:flex">
						<BookSessionButton mentor={mentorShipData as Mentorship} MentorId={MentorId} isMimic={isMimic} />

						{!isSameUser && user ? (
							<Button
								onClick={action.onClick}
								disabled={action.disabled}
								variant={action.variant ?? 'default'}
								className={`gap-2 rounded-xl bg-blue-600 px-8 text-white shadow-sm hover:bg-blue-700 ${action.className ?? ''}`}
							>
								{action.label}
							</Button>
						) : !user ? (
							<Link href="/auth/login">
								<Button
									className={`gap-2 rounded-xl bg-blue-600 px-8 text-white shadow-sm hover:bg-blue-700 ${action.className ?? ''}`}
								>
									{action.label}
								</Button>
							</Link>
						) : null}
					</div>
				</div>

				{/* Name & Title */}
				<div className="mb-6 space-y-3">
					<div>
						<h1 className="mb-1 text-2xl font-bold text-neutral-900 sm:text-3xl">{mentorShipData.name}</h1>
						<p className="text-base text-neutral-600 sm:text-lg">
							{mentorShipData.title}{' '}
							{'company' in mentorShipData && <span className="font-medium text-blue-600">@ {mentorShipData.company}</span>}
						</p>
					</div>

					{/* Stats Row */}
					<div className="flex flex-wrap gap-3">
						<div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-2">
							<Star size={16} className="fill-amber-600 text-amber-600" />
							<span className="font-semibold text-amber-900">{averageRating}</span>
						</div>
						<div className="flex items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2">
							<MessageSquare size={16} className="text-blue-600" />
							<span className="font-semibold text-blue-900">{reviewCount} Reviews</span>
						</div>
						<div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-2">
							<Eye size={16} className="text-neutral-600" />
							<span className="font-semibold text-neutral-900">
								{('views' in mentorShipData && mentorShipData.views) || 0} Views
							</span>
						</div>
					</div>
				</div>

				{/* Social Links */}
				<div className="mb-6 flex gap-2">
					{[
						{ icon: Linkedin, href: 'linkedin' in mentorShipData && mentorShipData.linkedin, label: 'LinkedIn' },
						{ icon: Youtube, href: 'youtube' in mentorShipData && mentorShipData.youtube, label: 'YouTube' },
						{ icon: Facebook, href: 'facebook' in mentorShipData && mentorShipData.facebook, label: 'Facebook' },
						{ icon: Instagram, href: 'instagram' in mentorShipData && mentorShipData.instagram, label: 'Instagram' },
					].map((social, i) =>
						social.href ? (
							<a
								key={i}
								href={social.href}
								target="_blank"
								rel="noopener noreferrer"
								className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-neutral-900"
								aria-label={social.label}
							>
								<social.icon size={18} />
							</a>
						) : null
					)}
				</div>

				{/* Mobile Action Button */}
				<div className="flex flex-col gap-2 sm:hidden">
					<BookSessionButton
						mentor={mentorShipData as Mentorship}
						MentorId={MentorId}
						isMimic={isMimic}
						className="w-full"
					/>

					{!isSameUser && user ? (
						<Button
							onClick={action.onClick}
							disabled={action.disabled}
							variant={action.variant ?? 'default'}
							className={`w-full gap-2 rounded-xl bg-blue-600 px-8 text-white shadow-sm hover:bg-blue-700 ${action.className ?? ''}`}
						>
							<Icon size={18} />
							{action.label}
						</Button>
					) : !user ? (
						<Link href="/auth/login">
							<Button
								className={`w-full gap-2 rounded-xl bg-blue-600 px-8 text-white shadow-sm hover:bg-blue-700 ${action.className ?? ''}`}
							>
								<Icon size={18} />
								{action.label}
							</Button>
						</Link>
					) : null}
				</div>
			</div>
		</div>
	);
};
