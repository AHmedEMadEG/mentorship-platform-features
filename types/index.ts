import { User as FirebaseAuthUser } from 'firebase/auth';
import { FieldValue, Timestamp } from 'firebase/firestore';

export type Role = 'admin' | 'mentor' | 'user';

export interface User extends FirebaseAuthUser {
	id: string;
	userId?: string;
	displayName: string;
	firebase_token?: string;
	lastUpdateToken?: Date;
	activated?: boolean;
	title?: string | null;
	email: string;
	bio: string;
	profileLink?: string | null;
	facebook?: string | null;
	twitter?: string | null;
	linkedin?: string | null;
	instagram?: string | null;
	wishlist?: string[];
	role: Role[];
	permissions?: string[];
	createdAt?: any;
	phoneNumber: string | null;
	address?: string | null;
	zipCode?: string | null;
	country?: string | null;
	businessName?: string | null;
	businessCategory?: string[];
	city?: string | null;
	mentorShip: boolean;
	businessLicense?: string | null;
	commercialInsurancePolicy?: string | null;
}

export enum UserRole {
	Admin = 'admin',
	Merchant = 'merchant',
}

export type permission =
	| 'add product'
	| 'edit product'
	| 'delete product'
	| 'manage ads'
	| 'manage events'
	| 'manage courses';

export interface PaginatedUsers {
	users: User[];
	hasMore: boolean;
	lastDoc: any;
}

export type UserData = {
	id: string;
	userId?: string;
	displayName: string;
	activated?: boolean;
	email: string;
	photoURL?: string;
	emailVerified?: boolean;
	role: Role[];
	permissions: string[];
	wishlist: string[];
	bio?: string;
	title?: string;
	phoneNumber?: string;
	address?: string;
	zipCode?: string;
	country?: string;
	city?: string;
	businessName?: string;
	businessCategory?: string[];
	mentorShip: boolean;
	businessLicense?: string;
	commercialInsurancePolicy?: string;
	profileLink?: string;
	facebook?: string;
	twitter?: string;
	linkedin?: string;
	instagram?: string;
	createdAt?: any;
	updatedAt?: any;
	firebase_token?: string;
	lastUpdateToken?: Date;
	odoo_token?: string;
};

export interface DateRange {
	from?: Date;
	to?: Date;
}

export interface HeroSection {
	id: string;
	logoTitle: string;
	logo: string;
	bannerImage: string;
	bannerTitle: string;
	bannerText: string;
	createdAt?: number;
	updatedAt?: number;
}

export interface AnalysisData {
	id?: string;
	creatorId?: string;
	events: number | FieldValue;
	ads: number | FieldValue;
	views: number | FieldValue;
	products: number | FieldValue;
	featured?: number;
	[key: string]: number | string | FieldValue | undefined;
	createdAt?: any;
	updatedAt?: any;
}

export interface CardContentHeader {
	title: string;
	id: string;
	image: string;
	isActive: boolean;
}

export interface MessageRequest {
	senderId: string;
	content: string;
	createdAt: Date | Timestamp;
	status: 'pending' | 'accepted' | 'rejected';
}

export interface Review {
	reviewerId: string;
	comment: string;
	createdAt: Date | Timestamp;
	rating: number;
}

export interface Mentorship {
	id: string;
	profileImage: string;
	coverImage: string;
	title: string;
	company: string;
	name: string;
	bio: string;
	experience: number;
	sessions: number;
	country: string;
	calendlyLink: string;
	linkedin?: string;
	facebook?: string;
	instagram?: string;
	youtube?: string;
	twitter?: string;
	reviews: Review[];
	messages: MessageRequest[];
	userId: string;
	isActive: boolean;
	status: 'pending' | 'approved' | 'rejected' | 'deactivated';
	rejectionMessage?: string;
	expertise: string[];
	industry: string;
	location: string;
	timeZone: string;
	experienceLevel: string;
	mentorshipType: string[];
	availability: string;
	languages: string[];
	careerStage: string;
	views: number;
	createdAt: Date;
	updatedAt: Date;
	searchIndex?: string[];
}

export interface Appointment {
	id: string;
	title: string;
	description: string;
	date: Date | string;
	time: Date | string;
	creatorId: string;
	createdAt: Date;
	updatedAt: Date;
}

export interface UserIds {
	id: string;
	userId: string;
}

export interface LocationData {
	city: string;
	state: string;
	zipCodes: string[];
	neighborhoods: string[];
	displayName: string;
}

// CHAT TYPES
export interface ChatMessage {
	id: string;
	conversationId: string;
	senderId: string;
	content: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	isRead: boolean;
}

export interface Conversation {
	id: string;
	participantIds: string[];
	lastMessage: string;
	lastMessageTime: Timestamp;
	lastMessageSenderId: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	unreadCount: Record<string, number>;
}

export type SessionStatus = 'pending' | 'accepted' | 'rejected' | 'cancelled';

export interface SessionRequest {
	id: string;
	menteeId: string;
	mentorId: string;
	topic: string;
	description: string;
	status: SessionStatus;
	calendlyUrl?: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
	menteeName: string;
	menteeEmail: string;
	menteeImage?: string;
	mentorName: string;
	mentorImage?: string;
}

// EVENT TYPES
export type EventStatus = 'upcoming' | 'live' | 'ended';
export type EventVisibility = 'public' | 'private';
export type AttendeeStatus = 'registered' | 'pending_approval' | 'approved' | 'declined';

export interface AppEvent {
	id: string;
	title: string;
	description: string;
	location: string;
	startDate: Timestamp;
	endDate: Timestamp;
	visibility: EventVisibility;
	status: EventStatus;
	creatorId: string;
	creatorName: string;
	creatorImage?: string;
	ticketPrice: number;
	requireApproval: boolean;
	capacity: number | null;
	attendeeCount: number;
	requestsCount: number;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

export interface EventAttendee {
	id: string;
	eventId: string;
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	status: AttendeeStatus;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}

// Mimic Profile Types
export interface MimicProfile {
	id: string;
	slug: string;
	name: string;
	title: string;
	location: string;
	bio: string;
	profileImage: string;
	coverImage: string;
	linkedinUrl: string;
	createdAt: Timestamp;
	updatedAt: Timestamp;
}
