import { ChatMessage, Conversation } from '@/types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Timestamp } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import * as firebaseService from '../firebase/chatServices';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const chatQueryKeys = {
	conversations: ['chat', 'conversations'] as const,
	userConversations: (userId: string) => [...chatQueryKeys.conversations, userId] as const,
	conversationByParticipantIds: (currentUserId: string, otherUserId: string) =>
		[...chatQueryKeys.conversations, currentUserId, otherUserId] as const,
	conversation: (conversationId: string) => ['chat', 'conversation', conversationId] as const,
	messages: (conversationId: string) => ['chat', 'messages', conversationId] as const,
	message: (conversationId: string, messageId: string) =>
		[...chatQueryKeys.messages(conversationId), messageId] as const,
};

// ============================================================================
// CONVERSATION HOOKS
// ============================================================================

export function useUserConversations(userId: string, enabled = true) {
	const [conversations, setConversations] = useState<Conversation[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!enabled || !userId) {
			setIsLoading(false);
			return;
		}

		try {
			const unsubscribe = firebaseService.subscribeToUserConversations(
				userId,
				(data) => {
					setConversations(data);
					setIsLoading(false);
					setError(null);
				},
				(err) => {
					setError(err);
					setIsLoading(false);
				}
			);

			return () => unsubscribe();
		} catch (err) {
			setError(err as Error);
			setIsLoading(false);
		}
	}, [userId, enabled]);

	return { data: conversations, isLoading, error };
}

export function useGetConversationByParticipantIds(currentUserId: string, otherUserId: string) {
	return useQuery({
		queryKey: chatQueryKeys.conversationByParticipantIds(currentUserId, otherUserId),
		queryFn: () => firebaseService.getConversationByParticipantIds(currentUserId, otherUserId),
	});
}

export function useCreateConversationWithDefaultMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			currentUserId,
			otherUserId,
			content,
			senderId,
			incrementSenderUnreadCount,
			createdAt,
		}: {
			currentUserId: string;
			otherUserId: string;
			content: string;
			senderId: string;
			incrementSenderUnreadCount?: boolean;
			createdAt?: Date | Timestamp;
		}) =>
			firebaseService.createConversationWithDefaultMessage(
				currentUserId,
				otherUserId,
				content,
				senderId,
				incrementSenderUnreadCount,
				createdAt
			),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
		},
	});
}

export function useDeleteConversation() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (conversationId: string) => firebaseService.deleteConversation(conversationId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
		},
	});
}

// ============================================================================
// MESSAGE HOOKS
// ============================================================================

export function useConversationMessages(conversationId: string, enabled = true) {
	const queryClient = useQueryClient();

	useEffect(() => {
		if (!enabled || !conversationId) return;

		const unsubscribe = firebaseService.subscribeToMessages(
			conversationId,
			(data) => {
				queryClient.setQueryData<ChatMessage[]>(chatQueryKeys.messages(conversationId), (old) => {
					// Keep existing optimistic messages
					const existingOptimistic = (old || []).filter((msg) => msg.id.startsWith('temp-'));

					// Filter out optimistic messages that have likely been confirmed by the server
					// Match by sender, content, and approximate timestamp
					const remainingOptimistic = existingOptimistic.filter((optMsg) => {
						return !data.some((serverMsg) => {
							const isSameDecl = serverMsg.senderId === optMsg.senderId && serverMsg.content === optMsg.content;
							if (!isSameDecl) return false;

							// Check time difference (within 100 milliseconds)
							const serverTime = serverMsg.createdAt.toMillis ? serverMsg.createdAt.toMillis() : 0;
							const optTime = optMsg.createdAt.toMillis ? optMsg.createdAt.toMillis() : 0;
							return Math.abs(serverTime - optTime) < 100;
						});
					});

					return [...data, ...remainingOptimistic];
				});
			},
			(err) => {
				console.error('Error subscribing to messages:', err);
			}
		);

		return () => unsubscribe();
	}, [conversationId, enabled, queryClient]);

	return useQuery({
		queryKey: chatQueryKeys.messages(conversationId),
		enabled: enabled && !!conversationId,
		staleTime: Infinity,
		queryFn: () => firebaseService.getMessages(conversationId),
		initialData: [],
	});
}

export function useSendMessage() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			conversationId,
			senderId,
			receiverId,
			content,
			incrementSenderUnreadCount,
			createdAt,
		}: {
			conversationId: string;
			senderId: string;
			receiverId: string;
			content: string;
			incrementSenderUnreadCount?: boolean;
			createdAt?: Date | Timestamp;
		}) =>
			firebaseService.sendMessage(conversationId, senderId, receiverId, content, incrementSenderUnreadCount, createdAt),
		onMutate: async ({ conversationId, senderId, receiverId, content, incrementSenderUnreadCount, createdAt }) => {
			// Cancel any outgoing refetches (so they don't overwrite our optimistic update)
			await queryClient.cancelQueries({ queryKey: chatQueryKeys.messages(conversationId) });

			// Snapshot the previous value
			const previousMessages = queryClient.getQueryData<ChatMessage[]>(chatQueryKeys.messages(conversationId)) || [];

			const tempId = `temp-${Date.now()}`;

			// Optimistically update to the new value
			const optimisticMessage: ChatMessage = {
				id: tempId, // Temporary ID
				conversationId,
				senderId,
				content,
				createdAt: (createdAt as Timestamp) || Timestamp.now(),
				updatedAt: Timestamp.now(),
				isRead: false,
			};

			queryClient.setQueryData<ChatMessage[]>(chatQueryKeys.messages(conversationId), (old = []) => [
				...old,
				optimisticMessage,
			]);

			// Return context with the tempId so we can remove it later
			return { previousMessages, tempId, incrementSenderUnreadCount };
		},
		onSuccess: (data, variables, context) => {
			// No action needed here, cleanup is handled in onSettled
		},
		onError: (err, newTodo, context) => {
			// No action needed here, cleanup is handled in onSettled indicating failure removal as well
		},
		onSettled: (data, error, variables, context) => {
			// Always remove the optimistic message using the specific tempId
			// If success: The real message will come via subscription.
			// If error: We remove the failed optimistic message.
			if (context?.tempId) {
				queryClient.setQueryData<ChatMessage[]>(chatQueryKeys.messages(variables.conversationId), (old = []) => {
					return old.filter((msg) => msg.id !== context.tempId);
				});
			}

			// We CAN invalidate conversations to update the sidebar snippets/unread counts
			queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
		},
	});
}

// ============================================================================
// MESSAGE READ STATUS HOOKS
// ============================================================================

export function useMarkConversationAsRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			conversationId,
			userId,
			messageIds,
		}: {
			conversationId: string;
			userId: string;
			messageIds?: string[];
		}) => firebaseService.markConversationAsRead(conversationId, userId, messageIds),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: chatQueryKeys.conversations });
		},
	});
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { firebaseService };
export type { ChatMessage, Conversation };
