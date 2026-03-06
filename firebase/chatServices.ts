import { ChatMessage, Conversation } from '@/types';
import {
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	increment,
	onSnapshot,
	orderBy,
	query,
	Timestamp,
	where,
	writeBatch,
} from 'firebase/firestore';
import { db } from './firabase';

// ============================================================================
// CONVERSATION OPERATIONS
// ============================================================================

export async function createConversationWithDefaultMessage(
	currentUserId: string,
	otherUserId: string,
	content: string,
	senderId: string,
	incrementSenderUnreadCount = false, // for message requests to inform mentee that mentor accepted the request
	createdAt?: Date | Timestamp
): Promise<Conversation> {
	try {
		const receiverId = senderId === currentUserId ? otherUserId : currentUserId;
		const conversationsRef = collection(db, 'conversations');

		const newConversation = await addDoc(conversationsRef, {
			participantIds: [currentUserId, otherUserId],
			lastMessage: content,
			lastMessageTime: createdAt || Timestamp.now(),
			lastMessageSenderId: senderId,
			createdAt: createdAt || Timestamp.now(),
			updatedAt: createdAt || Timestamp.now(),
			unreadCount: {
				[senderId]: incrementSenderUnreadCount ? 1 : 0,
				[receiverId]: incrementSenderUnreadCount ? 0 : 1,
			},
		});
		const conversationData = (await getDoc(newConversation)).data() as Conversation;

		const messagesRef = collection(db, 'conversations', newConversation.id, 'messages');
		await addDoc(messagesRef, {
			conversationId: newConversation.id,
			senderId,
			content,
			createdAt: createdAt || Timestamp.now(),
			updatedAt: createdAt || Timestamp.now(),
			isRead: false,
		});
		return { ...conversationData, id: newConversation.id };
	} catch (error) {
		console.error('Error creating conversation:', error);
		throw error;
	}
}

export async function getConversationByParticipantIds(
	currentUserId: string,
	otherUserId: string
): Promise<Conversation | null> {
	try {
		// Query for existing conversation between these two users
		const conversationsRef = collection(db, 'conversations');
		const q = query(conversationsRef, where('participantIds', 'array-contains', currentUserId));

		const querySnapshot = await getDocs(q);

		for (const docSnapshot of querySnapshot.docs) {
			const conv = docSnapshot.data() as Conversation;
			if (conv.participantIds.length === 2 && conv.participantIds.includes(otherUserId)) {
				return { ...conv, id: docSnapshot.id };
			}
		}
		return null;
	} catch (error) {
		console.error('Error getting or creating conversation:', error);
		throw error;
	}
}

export function subscribeToUserConversations(
	userId: string,
	onUpdate: (conversations: Conversation[]) => void,
	onError?: (error: Error) => void
): () => void {
	try {
		const conversationsRef = collection(db, 'conversations');
		const q = query(conversationsRef, where('participantIds', 'array-contains', userId), orderBy('updatedAt', 'desc'));

		const unsubscribe = onSnapshot(
			q,
			(querySnapshot) => {
				const conversations = querySnapshot.docs.map((docSnapshot) => ({
					...(docSnapshot.data() as Conversation),
					id: docSnapshot.id,
				}));
				onUpdate(conversations);
			},
			(error) => {
				console.error('Error subscribing to conversations:', error);
				if (onError) onError(error as Error);
			}
		);

		return unsubscribe;
	} catch (error) {
		console.error('Error setting up conversation subscription:', error);
		throw error;
	}
}

export async function deleteConversation(conversationId: string): Promise<void> {
	try {
		// Delete all messages in conversation
		const messagesRef = collection(db, 'conversations', conversationId, 'messages');
		const messagesSnapshot = await getDocs(messagesRef);

		const batch = writeBatch(db);
		messagesSnapshot.docs.forEach((docSnapshot) => {
			batch.delete(docSnapshot.ref);
		});

		// Delete conversation
		const conversationRef = doc(db, 'conversations', conversationId);
		batch.delete(conversationRef);

		await batch.commit();
	} catch (error) {
		console.error('Error deleting conversation:', error);
		throw error;
	}
}

// ============================================================================
// MESSAGE OPERATIONS
// ============================================================================

export async function sendMessage(
	conversationId: string,
	senderId: string,
	receiverId: string,
	content: string,
	incrementSenderUnreadCount = false,
	createdAt?: Date | Timestamp
): Promise<void> {
	const now = createdAt || Timestamp.now();

	try {
		const batch = writeBatch(db);

		const messagesRef = collection(db, 'conversations', conversationId, 'messages');
		const newMessageRef = doc(messagesRef);

		// 1. Create the message
		batch.set(newMessageRef, {
			conversationId,
			senderId,
			content,
			createdAt: now,
			updatedAt: now,
			isRead: false,
		});

		// 2. Update the conversation metadata
		// We use 'increment' for atomic updates without reading the doc, preventing contention errors
		const conversationRef = doc(db, 'conversations', conversationId);
		batch.update(conversationRef, {
			lastMessage: content,
			lastMessageTime: now,
			lastMessageSenderId: senderId,
			...(incrementSenderUnreadCount
				? { [`unreadCount.${receiverId}`]: 0 }
				: { [`unreadCount.${receiverId}`]: increment(1) }),
			...(incrementSenderUnreadCount ? { [`unreadCount.${senderId}`]: increment(1) } : { [`unreadCount.${senderId}`]: 0 }),
			updatedAt: now,
		});

		await batch.commit();
	} catch (error) {
		console.error('Error sending message:', error);
		throw error;
	}
}

export async function getMessages(conversationId: string): Promise<ChatMessage[]> {
	try {
		const messagesRef = collection(db, 'conversations', conversationId, 'messages');
		const q = query(messagesRef, orderBy('createdAt', 'asc'));

		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnapshot) => ({
			...(docSnapshot.data() as ChatMessage),
			id: docSnapshot.id,
		}));
	} catch (error) {
		console.error('Error getting messages:', error);
		throw error;
	}
}

export function subscribeToMessages(
	conversationId: string,
	onUpdate: (messages: ChatMessage[]) => void,
	onError?: (error: Error) => void
): () => void {
	try {
		const messagesRef = collection(db, 'conversations', conversationId, 'messages');
		const q = query(messagesRef, orderBy('createdAt', 'asc'));

		const unsubscribe = onSnapshot(
			q,
			(querySnapshot) => {
				const messages = querySnapshot.docs.map((docSnapshot) => ({
					...(docSnapshot.data() as ChatMessage),
					id: docSnapshot.id,
				}));
				onUpdate(messages);
			},
			(error) => {
				console.error('Error subscribing to messages:', error);
				if (onError) onError(error as Error);
			}
		);

		return unsubscribe;
	} catch (error) {
		console.error('Error setting up messages subscription:', error);
		throw error;
	}
}

export async function markConversationAsRead(conversationId: string, userId: string, messageIds?: string[]) {
	try {
		const conversationRef = doc(db, 'conversations', conversationId);
		const batch = writeBatch(db);

		// If we have the message IDs, use them directly (Optimized path)
		if (messageIds && messageIds.length > 0) {
			messageIds.forEach((messageId) => {
				const messageRef = doc(db, 'conversations', conversationId, 'messages', messageId);
				batch.update(messageRef, { isRead: true });
			});
		} else {
			// Fallback: Query for unread messages
			const messagesCollectionRef = collection(db, 'conversations', conversationId, 'messages');
			const unreadMessagesQuery = query(messagesCollectionRef, where('isRead', '==', false));
			const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

			unreadMessagesSnapshot.docs.forEach((docSnapshot) => {
				batch.update(docSnapshot.ref, { isRead: true });
			});
		}

		// Reset unread count for the user
		batch.update(conversationRef, {
			[`unreadCount.${userId}`]: 0,
		});

		await batch.commit();
	} catch (error) {
		console.error('Error marking conversation as read:', error);
		throw error;
	}
}
