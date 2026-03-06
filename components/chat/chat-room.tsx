'use client';

import { useToast } from '@/hooks/use-toast';
import { getOtherParticipantId } from '@/lib/helpers';
import { useSendMessage } from '@/queries/useChat';
import { ChatMessage, Conversation, User } from '@/types';
import { ChatHeader } from './chat-header';
import { ChatInput } from './chat-input';
import { ChatMessages } from './chat-messages';

interface ChatRoomProps {
	conversation: Conversation;
	closeChat: () => void;
	otherUserData: User;
	onDelete?: (conversationId: string) => void;
	isDeleteLoading?: boolean;
	messages: ChatMessage[];
	messagesLoading: boolean;
}

export function ChatRoom({
	conversation,
	closeChat,
	otherUserData,
	onDelete,
	isDeleteLoading,
	messages,
	messagesLoading,
}: ChatRoomProps) {
	const sendMessageMutation = useSendMessage();
	const { error: toastError } = useToast();

	const handleSendMessage = (content: string) => {
		sendMessageMutation.mutate(
			{
				conversationId: conversation.id,
				senderId: getOtherParticipantId(conversation, otherUserData.id),
				receiverId: otherUserData.id,
				content,
			},
			{
				onError: (error) => {
					console.error('Error sending message:', error);
					toastError('Error', 'Failed to send message. Please try again.');
				},
			}
		);
	};

	return (
		<div className="flex h-full flex-col bg-background">
			<ChatHeader
				conversation={conversation}
				closeChat={closeChat}
				otherUserData={otherUserData}
				onDelete={onDelete}
				isDeleteLoading={isDeleteLoading}
			/>
			<ChatMessages messages={messages} otherUserData={otherUserData} isLoading={messagesLoading} />
			<ChatInput onSendMessage={handleSendMessage} />
		</div>
	);
}
