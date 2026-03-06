import { toast } from '@/hooks/use-toast';
import { Conversation, Mentorship, User } from '@/types';
import { countries, USA_LOCATIONS_DATA } from './constants';

// DATE HELPERS
export const formatChatTimestamp = (timestamp: any) => {
	if (!timestamp) return '';
	try {
		const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
		const now = new Date();
		const diffInDays = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

		if (diffInDays < 1) {
			return date.toLocaleTimeString('en-US', {
				hour: '2-digit',
				minute: '2-digit',
				hour12: true,
			});
		} else if (diffInDays < 7) {
			return date.toLocaleDateString('en-US', { weekday: 'short' });
		} else {
			return date.toLocaleDateString('en-US', {
				month: 'short',
				day: 'numeric',
			});
		}
	} catch {
		return '';
	}
};

export function formatTimeTo12Hour(time: string) {
	const [hours, minutes] = time.split(':').map(Number);

	const suffix = hours >= 12 ? 'PM' : 'AM';
	const hour12 = ((hours + 11) % 12) + 1;

	return `${hour12}:${minutes.toString().padStart(2, '0')} ${suffix}`;
}

export const getInitials = (user: User) => {
	if (user.displayName) {
		return user.displayName
			.split(' ')
			.map((n) => n[0])
			.join('')
			.toUpperCase()
			.substring(0, 2);
	} else {
	}
	return user.email ? user.email[0].toUpperCase() : 'U';
};

export const getAllZipCodes = (): string[] => {
	return USA_LOCATIONS_DATA.flatMap((location) => location.zipCodes);
};

export const getAllNeighborhoods = (): string[] => {
	return USA_LOCATIONS_DATA.flatMap((location) => location.neighborhoods);
};

export const handleCopy = async (id: string | undefined, setCopiedId: (id: string | null) => void, src: string) => {
	try {
		const link = id ? `${location.origin}/${src}/${id}` : `${location.origin}/${src}`;

		await navigator.clipboard.writeText(link);
		toast.success('Link copied to clipboard successfully');

		if (id) {
			setCopiedId(id);
			setTimeout(() => setCopiedId(null), 1000);
		}
	} catch (err) {
		console.error('Failed to copy text: ', err);
		toast.error('Failed to copy link');
	}
};

export function getStatusBadgeClasses(status?: string) {
	if (!status) return 'bg-secondaryColor-100 text-secondaryColor-800 border-secondaryColor-200 border'; // default

	switch (status.toLowerCase()) {
		case 'available':
			return 'bg-green-100 text-green-800 border-green-200 border';
		case 'almost full':
			return 'bg-yellow-100 text-yellow-800 border-yellow-200 border';
		case 'sold out':
			return 'bg-red-100 text-red-800 border-red-200 border';
		case 'ends soon':
			return 'bg-orange-100 text-orange-800 border-orange-200 border';
		default:
			return 'bg-secondaryColor-100 text-secondaryColor-800 border-secondaryColor-200 border';
	}
}

export const getCountryCode = (countryName: string): string => {
	if (!countryName) return '';
	const match = countries.find((c) => c.name.toLowerCase() === countryName.toLowerCase());
	return match ? match.code : '';
};

export const getStatusBadge = (status: Mentorship['status']) => {
	switch (status) {
		case 'approved':
			return {
				label: 'Active',
				className: 'bg-green-100 text-green-800',
				variant: 'default' as const,
			};
		case 'rejected':
			return {
				label: 'Rejected',
				className: 'bg-red-100 text-red-800',
				variant: 'destructive' as const,
			};
		case 'deactivated':
			return {
				label: 'Deactivated',
				className: 'bg-red-100 text-red-800',
				variant: 'destructive' as const,
			};
		default:
			return {
				label: 'Pending',
				className: 'bg-yellow-100 text-yellow-800',
				variant: 'secondary' as const,
			};
	}
};

const codes: Record<number, string> = {
	1: '/',
	2: '/categories/[slug]',
	3: '/event/[id]',
	4: '/getStarted',
	5: '/leads/[id]',
	6: '/mentorships/browse',
	7: '/mentorships/mentorship/[id]',
	8: '/product/[id]',
	9: '/search',
	11: '/wishlist',

	// Merchant section
	12: '/merchant/dashboard',
	13: '/merchant/account',
	14: '/merchant/manage-products',
	15: '/merchant/calender',
	16: '/merchant/edit-product/[id]',
	17: '/merchant/add-product',
	18: '/merchant/herosection',
	19: '/merchant/login',
	20: '/merchant/manage-ads',
	21: '/merchant/manage-ads/request-ads',
	22: '/merchant/manage-categories',
	23: '/merchant/manage-courses',
	24: '/merchant/manage-courses/request-courses',
	25: '/merchant/manage-events',
	26: '/merchant/manage-events/request-events',
	27: '/merchant/manage-featured-deals',
	28: '/merchant/manage-featured-deals/request-featured-deals',
	29: '/merchant/mange-leads',
	30: '/merchant/mange-users',
	31: '/merchant/mange-users/edit-user/[id]',
	32: '/merchant/mentorship-setup',
	33: '/merchant/mentorships/edit-mentorship',
	34: '/merchant/mentorships/mentorship-chats',
	35: '/merchant/mentorships/mentorship--profile',
};

export function getPathByCode(code: number, param?: string): string | null {
	const path = codes[code];
	if (!path) return null;

	if (param) {
		return path.replace('[id]', param).replace('[slug]', param);
	}

	return path;
}

// Chat helpers
export const getOtherParticipantId = (conversation: Conversation, currentUserId: string) => {
	const otherUserId = conversation.participantIds.find((id) => id !== currentUserId);
	return otherUserId!;
};
