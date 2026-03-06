import { AppEvent, AttendeeStatus, EventAttendee, EventStatus } from '@/types';
import {
	DocumentData,
	QueryDocumentSnapshot,
	QuerySnapshot,
	Timestamp,
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	increment,
	limit,
	onSnapshot,
	orderBy,
	query,
	startAfter,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import { db } from './firabase';

// ============================================================================
// HELPERS
// ============================================================================

function getEventStatus(event: AppEvent): EventStatus {
	const now = Date.now();
	const start = event.startDate.toMillis();
	const end = event.endDate.toMillis();

	if (now < start) return 'upcoming';
	if (now >= start && now <= end) return 'live';
	return 'ended';
}

// ============================================================================
// EVENT CRUD
// ============================================================================

export type CreateEventData = Omit<
	AppEvent,
	'id' | 'attendeeCount' | 'requestsCount' | 'createdAt' | 'updatedAt' | 'status'
>;

export async function createEvent(data: CreateEventData): Promise<AppEvent> {
	try {
		const eventsRef = collection(db, 'events');
		const now = Timestamp.now();

		const docRef = await addDoc(eventsRef, {
			...data,
			attendeeCount: 0,
			requestsCount: 0,
			createdAt: now,
			updatedAt: now,
		});

		const snap = await getDoc(docRef);
		return { ...(snap.data() as AppEvent), id: docRef.id };
	} catch (error) {
		console.error('Error creating event:', error);
		throw error;
	}
}

export type UpdateEventData = Partial<
	Omit<AppEvent, 'id' | 'createdAt' | 'updatedAt' | 'attendeeCount' | 'requestsCount'>
>;

export async function updateEvent(eventId: string, data: UpdateEventData): Promise<void> {
	try {
		const eventRef = doc(db, 'events', eventId);

		await updateDoc(eventRef, {
			...data,
			updatedAt: Timestamp.now(),
		});
	} catch (error) {
		console.error('Error updating event:', error);
		throw error;
	}
}

export async function deleteEvent(eventId: string): Promise<void> {
	try {
		// Delete all attendees first
		const attendeesRef = collection(db, 'events', eventId, 'attendees');
		const attendeesSnap = await getDocs(attendeesRef);
		const batch = writeBatch(db);
		attendeesSnap.docs.forEach((d) => batch.delete(d.ref));
		batch.delete(doc(db, 'events', eventId));
		await batch.commit();
	} catch (error) {
		console.error('Error deleting event:', error);
		throw error;
	}
}

export async function getEventById(eventId: string): Promise<AppEvent | null> {
	try {
		const snap = (await getDoc(doc(db, 'events', eventId))) as QueryDocumentSnapshot<AppEvent>;
		if (!snap.exists()) return null;
		return { ...snap.data(), id: snap.id, status: getEventStatus(snap.data()) };
	} catch (error) {
		console.error('Error getting event:', error);
		throw error;
	}
}

export async function getPublicEventsInfinite(
	status: EventStatus,
	pageSize = 10,
	lastDoc?: QueryDocumentSnapshot<DocumentData> | null
) {
	try {
		const eventsRef = collection(db, 'events');
		let q = query(eventsRef, where('visibility', '==', 'public'), orderBy('startDate', 'desc'), limit(pageSize));

		if (status === 'live') {
			q = query(q, where('startDate', '<=', Timestamp.now()), where('endDate', '>=', Timestamp.now()));
		} else if (status === 'upcoming') {
			q = query(q, where('startDate', '>', Timestamp.now()));
		} else if (status === 'ended') {
			q = query(q, where('endDate', '<', Timestamp.now()));
		}

		if (lastDoc) {
			q = query(q, startAfter(lastDoc));
		}

		const snapshot = (await getDocs(q)) as QuerySnapshot<AppEvent>;
		const events = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id, status: getEventStatus(doc.data()) }));
		const nextLastDoc = snapshot.docs[snapshot.docs.length - 1];

		return {
			events,
			hasNextPage: !!nextLastDoc,
			lastDoc: nextLastDoc,
		};
	} catch (error) {
		console.error('Error getting public events:', error);
		throw error;
	}
}

export async function getRecentPublicEvents(queryText?: string) {
	try {
		const eventsRef = collection(db, 'events');

		const fetchByStatus = async (status: EventStatus) => {
			let q = query(eventsRef, where('visibility', '==', 'public'), orderBy('startDate', 'desc'), limit(4));

			if (status === 'live') {
				q = query(q, where('startDate', '<=', Timestamp.now()), where('endDate', '>=', Timestamp.now()));
			} else if (status === 'upcoming') {
				q = query(q, where('startDate', '>', Timestamp.now()));
			} else if (status === 'ended') {
				q = query(q, where('endDate', '<', Timestamp.now()));
			}

			if (queryText && queryText.trim()) {
				const searchTerm = queryText.trim().toLowerCase();
				q = query(q, where('title', '>=', searchTerm), where('title', '<=', searchTerm + '\uf8ff'));
			}

			const snapshot = (await getDocs(q)) as QuerySnapshot<AppEvent>;
			const events = snapshot.docs.map((doc) => ({
				...(doc.data() as AppEvent),
				id: doc.id,
				status: getEventStatus(doc.data()),
			}));

			return {
				events: events.slice(0, 3),
				hasMore: events.length > 3,
			};
		};

		const [live, upcoming, ended] = await Promise.all([
			fetchByStatus('live'),
			fetchByStatus('upcoming'),
			fetchByStatus('ended'),
		]);

		return {
			live,
			upcoming,
			ended,
		};
	} catch (error) {
		console.error('Error getting public events:', error);
		throw error;
	}
}

export async function getMentorEvents(mentorId: string): Promise<AppEvent[]> {
	try {
		const q = query(collection(db, 'events'), where('creatorId', '==', mentorId), orderBy('startDate', 'asc'));

		const snapshot = await getDocs(q);

		return snapshot.docs.map((d) => {
			const data = d.data() as AppEvent;

			return {
				...data,
				id: d.id,
				status: getEventStatus(data),
			};
		});
	} catch (error) {
		console.error('Error fetching mentor events:', error);
		throw error;
	}
}

// ============================================================================
// ATTENDEE OPERATIONS
// ============================================================================

export interface JoinEventData {
	eventId: string;
	userId: string;
	userName: string;
	userEmail: string;
	userImage?: string;
	requireApproval: boolean;
}

export async function joinEvent(data: JoinEventData): Promise<EventAttendee> {
	try {
		const { eventId, requireApproval, ...attendeeBase } = data;
		const now = Timestamp.now();
		const status: AttendeeStatus = requireApproval ? 'pending_approval' : 'registered';

		const batch = writeBatch(db);

		const attendeesRef = collection(db, 'events', eventId, 'attendees');
		const newAttendeeRef = doc(attendeesRef);

		batch.set(newAttendeeRef, {
			eventId,
			...attendeeBase,
			status,
			createdAt: now,
			updatedAt: now,
		});

		// Only increment count for immediately registered attendees, else increment requests count
		if (!requireApproval) {
			const eventRef = doc(db, 'events', eventId);
			batch.update(eventRef, { attendeeCount: increment(1) });
		} else {
			const eventRef = doc(db, 'events', eventId);
			batch.update(eventRef, { requestsCount: increment(1) });
		}

		await batch.commit();

		const snap = await getDoc(newAttendeeRef);
		return { ...(snap.data() as EventAttendee), id: newAttendeeRef.id };
	} catch (error) {
		console.error('Error joining event:', error);
		throw error;
	}
}

export async function updateAttendeeStatus(
	eventId: string,
	attendeeId: string,
	status: AttendeeStatus,
	previousStatus: AttendeeStatus
): Promise<void> {
	try {
		const batch = writeBatch(db);
		const attendeeRef = doc(db, 'events', eventId, 'attendees', attendeeId);

		batch.update(attendeeRef, { status, updatedAt: Timestamp.now() });

		// Manage attendeeCount: +1 when approving pending, -1 when declining approved
		const eventRef = doc(db, 'events', eventId);
		if (status === 'approved' && previousStatus === 'pending_approval') {
			batch.update(eventRef, { attendeeCount: increment(1) });
		} else if (status === 'declined' && previousStatus === 'approved') {
			batch.update(eventRef, { attendeeCount: increment(-1) });
		}

		await batch.commit();
	} catch (error) {
		console.error('Error updating attendee status:', error);
		throw error;
	}
}

export async function getUserAttendance(eventId: string, userId: string): Promise<EventAttendee | null> {
	try {
		const q = query(collection(db, 'events', eventId, 'attendees'), where('userId', '==', userId));
		const snap = await getDocs(q);
		if (snap.empty) return null;
		const d = snap.docs[0];
		return { ...(d.data() as EventAttendee), id: d.id };
	} catch (error) {
		console.error('Error getting user attendance:', error);
		throw error;
	}
}

export function subscribeToEventAttendees(
	eventId: string,
	onUpdate: (attendees: EventAttendee[]) => void,
	onError?: (error: Error) => void
): () => void {
	const q = query(collection(db, 'events', eventId, 'attendees'), orderBy('createdAt', 'asc'));

	return onSnapshot(
		q,
		(snapshot) => {
			const attendees = snapshot.docs.map((d) => ({ ...(d.data() as EventAttendee), id: d.id }));
			onUpdate(attendees);
		},
		(error) => {
			console.error('Error subscribing to attendees:', error);
			if (onError) onError(error as Error);
		}
	);
}

export async function getEventAttendees(eventId: string): Promise<EventAttendee[]> {
	try {
		const q = query(collection(db, 'events', eventId, 'attendees'), orderBy('createdAt', 'asc'));
		const snap = await getDocs(q);
		return snap.docs.map((d) => ({ ...(d.data() as EventAttendee), id: d.id }));
	} catch (error) {
		console.error('Error getting attendees:', error);
		throw error;
	}
}
