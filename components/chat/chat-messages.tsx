'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatChatTimestamp } from '@/lib/helpers';
import { ChatMessage, User } from '@/types';
import { useEffect, useRef } from 'react';

interface ChatMessagesProps {
	messages: ChatMessage[];
	otherUserData: User;
	isLoading?: boolean;
}

export function ChatMessages({ messages, otherUserData, isLoading = false }: ChatMessagesProps) {
	const scrollRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		// Scroll to bottom when new messages arrive
		if (scrollRef.current) {
			const scrollElement = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
			if (scrollElement) {
				scrollElement.scrollTop = scrollElement.scrollHeight;
			}
		}
	}, [messages]);

	const isCurrentUserMessage = (senderId: string) => {
		return senderId !== otherUserData?.id;
	};

	if (isLoading) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground">Loading messages...</p>
			</div>
		);
	}

	if (messages.length === 0) {
		return (
			<div className="flex flex-1 items-center justify-center">
				<p className="text-muted-foreground">No messages yet. Start the conversation!</p>
			</div>
		);
	}

	return (
		<ScrollArea ref={scrollRef} className="flex-1 bg-background">
			<div className="space-y-4 p-4">
				{messages.map((message) => {
					const isOwn = isCurrentUserMessage(message.senderId);
					return (
						<div key={message?.id} className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}>
							{!isOwn && (
								<Avatar className="h-8 w-8 flex-shrink-0">
									<AvatarImage src={otherUserData?.photoURL || '/mentor-placeholder.png'} className="object-cover" />
								</Avatar>
							)}

							<div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}>
								{!isOwn && <p className="mb-1 text-xs font-medium text-muted-foreground">{otherUserData.displayName}</p>}

								<div
									className={`max-w-xs rounded-2xl px-4 py-2 lg:max-w-md xl:max-w-lg ${
										isOwn ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-secondary text-foreground'
									} ${message.id.startsWith('temp-') ? 'opacity-70' : ''}`}
								>
									<p className="break-words text-sm">{message.content}</p>
								</div>

								<p className={`mt-1 text-xs text-muted-foreground ${isOwn ? 'text-right' : 'text-left'}`}>
									{message.id.startsWith('temp-') ? 'Sending...' : formatChatTimestamp(message.createdAt)}
								</p>
							</div>
						</div>
					);
				})}
			</div>
		</ScrollArea>
	);
}
