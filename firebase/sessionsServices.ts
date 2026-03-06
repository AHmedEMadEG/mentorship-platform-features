import { SessionRequest, SessionStatus } from '@/types';
import {
	addDoc,
	collection,
	doc,
	DocumentData,
	getDocs,
	limit,
	orderBy,
	query,
	QueryDocumentSnapshot,
	serverTimestamp,
	startAfter,
	updateDoc,
	where,
	writeBatch,
} from 'firebase/firestore';
import { createConversationWithDefaultMessage, getConversationByParticipantIds, sendMessage } from './chatServices';
import { db } from './firabase';

export const sessionsServices = {
	async createSessionRequest(data: Omit<SessionRequest, 'id' | 'createdAt' | 'updatedAt' | 'status'>) {
		try {
			const docRef = await addDoc(collection(db, 'session_requests'), {
				...data,
				status: 'pending',
				createdAt: serverTimestamp(),
				updatedAt: serverTimestamp(),
			});

			await updateDoc(docRef, { id: docRef.id });
			return docRef.id;
		} catch (error) {
			console.error('Error creating session request:', error);
			throw error;
		}
	},

	async getSessionRequestsForMentor(
		mentorId: string,
		pageSize: number = 10,
		lastDoc?: QueryDocumentSnapshot<DocumentData> | null,
		status?: SessionStatus
	) {
		try {
			let q = query(
				collection(db, 'session_requests'),
				where('mentorId', '==', mentorId),
				orderBy('createdAt', 'desc'),
				limit(pageSize)
			);

			if (status) {
				q = query(
					collection(db, 'session_requests'),
					where('mentorId', '==', mentorId),
					where('status', '==', status),
					orderBy('createdAt', 'desc'),
					limit(pageSize)
				);
			}

			if (lastDoc) {
				q = query(q, startAfter(lastDoc));
			}

			const snapshot = await getDocs(q);

			const sessions = snapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						...doc.data(),
					}) as SessionRequest
			);

			return {
				sessions,
				lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
				hasMore: snapshot.docs.length === pageSize,
			};
		} catch (error) {
			console.error('Error getting session requests:', error);
			throw error;
		}
	},

	async getPendingSessionRequestsByUserIds(userId: string, mentorId: string) {
		try {
			const q = query(
				collection(db, 'session_requests'),
				where('menteeId', '==', userId),
				where('mentorId', '==', mentorId),
				where('status', '==', 'pending'),
				limit(1)
			);

			const snapshot = await getDocs(q);

			if (snapshot.empty) return null;

			return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as SessionRequest;
		} catch (error) {
			console.error('Error getting session requests:', error);
			throw error;
		}
	},

	async getAllPendingSessionRequestsForUserAsMentee(userId: string): Promise<SessionRequest[]> {
		try {
			const q = query(
				collection(db, 'session_requests'),
				where('menteeId', '==', userId),
				where('status', '==', 'pending')
			);

			const snapshot = await getDocs(q);
			const sessions = snapshot.docs.map(
				(doc) =>
					({
						id: doc.id,
						...doc.data(),
					}) as SessionRequest
			);
			return sessions;
		} catch (error) {
			console.error('Error getting all pending session requests:', error);
			throw error;
		}
	},

	async updateSessionStatus(sessionId: string, status: SessionStatus, calendlyUrl?: string) {
		try {
			const updateData: any = {
				status,
				updatedAt: serverTimestamp(),
			};

			if (calendlyUrl) {
				updateData.calendlyUrl = calendlyUrl;
			}

			await updateDoc(doc(db, 'session_requests', sessionId), updateData);
		} catch (error) {
			console.error('Error updating session status:', error);
			throw error;
		}
	},

	async sendSessionMessage(menteeId: string, mentorId: string, calendlyUrl: string) {
		try {
			let conversation = await getConversationByParticipantIds(menteeId, mentorId);
			const message = `Hello! I've accepted your mentorship session request. Please book a time that works for you using this link: \n\n ${calendlyUrl}`;

			if (!conversation) {
				conversation = await createConversationWithDefaultMessage(mentorId, menteeId, message, mentorId);
			} else {
				await sendMessage(conversation.id, mentorId, menteeId, message);
			}
		} catch (error) {
			console.error('Error sending session message:', error);
			throw error;
		}
	},

	async bulkAcceptSessions(sessions: Pick<SessionRequest, 'id' | 'menteeId' | 'mentorId'>[], calendlyUrl: string) {
		try {
			// 1. Batch-update all session statuses
			const batch = writeBatch(db);
			for (const session of sessions) {
				const ref = doc(db, 'session_requests', session.id);
				batch.update(ref, {
					status: 'accepted',
					calendlyUrl,
					updatedAt: serverTimestamp(),
				});
			}
			await batch.commit();

			// 2. Send a message to each unique mentee
			const seen = new Set<string>();
			for (const session of sessions) {
				// Avoid duplicate messages when the same mentee has multiple sessions selected
				const key = `${session.mentorId}_${session.menteeId}`;
				if (seen.has(key)) continue;
				seen.add(key);
				await sessionsServices.sendSessionMessage(session.menteeId, session.mentorId, calendlyUrl);
			}
		} catch (error) {
			console.error('Error bulk accepting sessions:', error);
			throw error;
		}
	},
};
