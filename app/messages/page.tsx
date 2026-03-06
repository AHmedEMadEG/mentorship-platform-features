'use client';

import { ChatEmptyState } from '@/components/chat/chat-empty-state';
import { ChatRoom } from '@/components/chat/chat-room';
import { ChatSidebar } from '@/components/chat/chat-sidebar';
import { useAuth } from '@/contexts/auth-context';
import { useGetUsersByIds } from '@/firebase/userServices';
import { useToast } from '@/hooks/use-toast';
import { getOtherParticipantId } from '@/lib/helpers';
import {
	useConversationMessages,
	useDeleteConversation,
	useMarkConversationAsRead,
	useUserConversations,
} from '@/queries/useChat';
import { User } from '@/types';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

export default function MessagesPage() {
	const toast = useToast();
	const { user } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const conversationId = searchParams.get('conversationId');

	// State
	const [selectedConversationId, setSelectedConversationId] = useState<string | undefined>();
	const [searchQuery, setSearchQuery] = useState('');

	// Hooks
	const { data: conversations = [], isLoading: conversationsLoading } = useUserConversations(user?.id || '', !!user);
	const { data: selectedMessages = [], isLoading: messagesLoading } = useConversationMessages(
		selectedConversationId || '',
		!!selectedConversationId
	);
	const deleteConversationMutation = useDeleteConversation();
	const markConversationAsReadMutation = useMarkConversationAsRead();

	const userIds = useMemo(() => {
		const set = new Set<string>();

		conversations.forEach((c) => {
			c.participantIds.forEach((id) => set.add(id));
		});

		return [...set];
	}, [conversations]);

	const { data: users = [], isLoading: usersLoading } = useGetUsersByIds(userIds);

	const userMap = useMemo(() => {
		const map: Record<string, User> = {};
		users.forEach((u) => (map[u.id] = u));
		return map;
	}, [users]);

	const userMapByName = useMemo(() => {
		const map: Record<string, User> = {};
		users.forEach((u) => (map[u.displayName.toLowerCase()] = u));
		return map;
	}, [users]);

	const filteredConversations = useMemo(() => {
		if (!searchQuery.trim()) return conversations;

		const resultUsers = Object.entries(userMapByName).filter(([key]) => key.includes(searchQuery.toLowerCase()));

		return conversations.filter((conv) => resultUsers.some((u) => conv.participantIds.includes(u[1].id)));
	}, [searchQuery, conversations, userMapByName]);

	// Redirect to home if user is not logged in
	useEffect(() => {
		if (!user) {
			router.push('/');
		}
	}, [user]);

	// Open conversation from URL
	useEffect(() => {
		if (conversationId) {
			setSelectedConversationId(conversationId);
		}
	}, [conversationId]);

	// Update URL with selected conversation ID
	useEffect(() => {
		const params = new URLSearchParams(searchParams);
		if (!selectedConversationId) {
			params.delete('conversationId');
		} else {
			params.set('conversationId', selectedConversationId);
		}

		router.replace(`?${params.toString()}`);
	}, [selectedConversationId]);

	// Handle press esc
	useEffect(() => {
		const handleEsc = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setSelectedConversationId(undefined);
			}
		};

		document.addEventListener('keydown', handleEsc);

		return () => {
			document.removeEventListener('keydown', handleEsc);
		};
	}, []);

	const handleDeleteConversation = useCallback(
		(conversationId: string) => {
			deleteConversationMutation.mutate(conversationId, {
				onSuccess: () => {
					if (selectedConversationId === conversationId) {
						setSelectedConversationId(undefined);
					}
					toast.success('Success', 'Conversation deleted');
				},
				onError: () => {
					toast.error('Error', 'Failed to delete conversation');
				},
			});
		},
		[deleteConversationMutation, selectedConversationId, toast]
	);

	// Mark messages as read when conversation is opened
	useEffect(() => {
		if (!selectedConversationId || !user?.id || selectedMessages.length === 0 || markConversationAsReadMutation.isPending)
			return;

		const unreadMessages = selectedMessages.filter((msg) => !msg.isRead && msg.senderId !== user.id);

		if (unreadMessages.length === 0) return;

		const unreadMessageIds = unreadMessages.map((msg) => msg.id);

		markConversationAsReadMutation.mutate({
			conversationId: selectedConversationId,
			userId: user.id,
			messageIds: unreadMessageIds,
		});
	}, [selectedConversationId, selectedMessages, markConversationAsReadMutation, user?.id]);

	const selectedConversation = conversations.find((conv) => conv.id === selectedConversationId);

	return (
		<div className="flex h-[calc(100vh-4rem)] bg-background">
			{/* Sidebar */}
			<div
				className={`w-full flex-col border-r border-border md:flex md:w-80 ${selectedConversationId ? 'hidden' : 'flex'} md:flex`}
			>
				{user && (
					<ChatSidebar
						conversations={filteredConversations}
						selectedConversationId={selectedConversationId}
						onSelectConversation={setSelectedConversationId}
						onDeleteConversation={handleDeleteConversation}
						isDeleteLoading={deleteConversationMutation.isPending}
						isLoading={conversationsLoading}
						searchQuery={searchQuery}
						onSearchChange={setSearchQuery}
						currentUserId={user.id}
						userMap={userMap}
						otherUserDataLoading={usersLoading}
					/>
				)}
			</div>

			{/* Main Chat Area */}
			<div className={`flex-1 flex-col ${selectedConversationId ? 'flex' : 'hidden'} md:flex`}>
				{selectedConversation && user ? (
					<ChatRoom
						conversation={selectedConversation}
						closeChat={() => setSelectedConversationId(undefined)}
						otherUserData={userMap[getOtherParticipantId(selectedConversation, user.id)]}
						onDelete={handleDeleteConversation}
						isDeleteLoading={deleteConversationMutation.isPending}
						messages={selectedMessages}
						messagesLoading={messagesLoading}
					/>
				) : (
					<ChatEmptyState />
				)}
			</div>
		</div>
	);
}
