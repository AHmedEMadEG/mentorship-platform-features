'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { formatChatTimestamp, getOtherParticipantId } from '@/lib/helpers';
import { Conversation, User } from '@/types';
import { MoreVertical, Search } from 'lucide-react';
import { memo, useCallback, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Skeleton } from '../ui/skeleton';

interface ChatSidebarProps {
	conversations: Conversation[];
	selectedConversationId?: string;
	onSelectConversation: (conversationId: string) => void;
	onDeleteConversation: (conversationId: string) => void;
	isLoading: boolean;
	searchQuery: string;
	onSearchChange: (query: string) => void;
	currentUserId: string;
	userMap: Record<string, User>;
	otherUserDataLoading: boolean;
	isDeleteLoading?: boolean;
}

export function ChatSidebar({
	conversations,
	selectedConversationId,
	onSelectConversation,
	onDeleteConversation,
	isDeleteLoading,
	isLoading,
	searchQuery,
	onSearchChange,
	currentUserId,
	userMap,
	otherUserDataLoading,
}: ChatSidebarProps) {
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const [conversationToDeleteId, setConversationToDeleteId] = useState<string | null>(null);

	const handleDeleteClick = useCallback((conversationId: string) => {
		setConversationToDeleteId(conversationId);
		setIsDeleteModalOpen(true);
	}, []);

	return (
		<div className="flex h-full flex-col border-r border-border bg-background">
			{/* Header */}
			<div className="border-b border-border p-4">
				<div className="mb-4 flex items-center justify-between">
					<h1 className="text-2xl font-bold">Messages</h1>
				</div>

				{/* Search */}
				<div className="relative">
					<Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
					<Input
						placeholder="Search members..."
						className="border-0 bg-secondary pl-9"
						value={searchQuery}
						onChange={(e) => onSearchChange(e.target.value)}
						onKeyDown={(e) => {
							if (e.key === 'Escape') {
								onSearchChange('');
								e.currentTarget.value = '';
							}
						}}
					/>
				</div>
			</div>

			{/* Conversations List */}
			<ScrollArea className="flex-1">
				<div className="max-w-80 overflow-hidden p-4">
					{isLoading ? (
						<div className="py-8 text-center text-muted-foreground">Loading conversations...</div>
					) : conversations.length === 0 ? (
						searchQuery ? (
							<div className="px-4 py-8 text-center text-muted-foreground">No conversations found.</div>
						) : (
							<div className="px-4 py-8 text-center text-muted-foreground">No conversations yet. Start a new message!</div>
						)
					) : (
						conversations.map((conversation) => (
							<ConversationItem
								key={conversation.id}
								conversation={conversation}
								isSelected={selectedConversationId === conversation.id}
								onSelect={onSelectConversation}
								onDeleteClick={handleDeleteClick}
								otherUser={userMap[getOtherParticipantId(conversation, currentUserId)]}
								isLoading={otherUserDataLoading}
								currentUserId={currentUserId}
							/>
						))
					)}
				</div>
			</ScrollArea>

			<Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Delete Conversation</DialogTitle>
						<DialogDescription>Are you sure you want to delete this conversation?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								onDeleteConversation?.(conversationToDeleteId!);
								setIsDeleteModalOpen(false);
							}}
							disabled={isDeleteLoading}
						>
							{isDeleteLoading ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}

const ConversationItem = memo(
	({
		conversation,
		isSelected,
		onSelect,
		onDeleteClick,
		otherUser,
		isLoading,
		currentUserId,
	}: {
		conversation: Conversation;
		isSelected: boolean;
		onSelect: (id: string) => void;
		onDeleteClick: (id: string) => void;
		otherUser: User | undefined;
		isLoading: boolean;
		currentUserId: string;
	}) => {
		return (
			<div
				className={`group mb-2 flex cursor-pointer items-center justify-between gap-2 rounded-lg p-3 transition-colors hover:bg-secondary ${
					isSelected ? 'bg-secondary' : ''
				}`}
				onClick={() => onSelect(conversation.id)}
			>
				{isLoading ? (
					<div className="flex min-w-0 flex-1 items-center gap-3">
						<Avatar className="h-10 w-10 flex-shrink-0">
							<Skeleton className="size-12 rounded-md" />
						</Avatar>
						<div className="flex min-w-0 flex-1 flex-col gap-1">
							<div className="truncate text-sm font-medium">
								<Skeleton className="h-4 w-28 rounded-md" />
							</div>
							<div className="truncate text-xs text-muted-foreground">
								<Skeleton className="h-4 w-24 rounded-md" />
							</div>
						</div>
					</div>
				) : (
					<div className="flex min-w-0 flex-1 items-center gap-3 overflow-hidden">
						<Avatar className="h-10 w-10 shrink-0">
							<AvatarImage src={otherUser?.photoURL || '/mentor-placeholder.png'} className="object-cover" />
						</Avatar>

						<div className="min-w-0 flex-1">
							<div title={otherUser?.displayName} className="truncate text-sm font-medium">
								{otherUser?.displayName}
							</div>
							<div title={conversation.lastMessage} className="truncate text-xs text-muted-foreground">
								{conversation.lastMessage || 'No messages yet'}
							</div>
						</div>
					</div>
				)}

				<div className="flex shrink-0 items-center gap-2">
					{conversation.unreadCount?.[currentUserId] > 0 &&
						!isSelected && ( // don't show unread count for the current active conversation
							<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
								{conversation.unreadCount[currentUserId] > 99 ? '99+' : conversation.unreadCount[currentUserId]}
							</span>
						)}
					<span className="whitespace-nowrap text-xs text-muted-foreground">
						{formatChatTimestamp(conversation.lastMessageTime)}
					</span>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								size="icon"
								variant="ghost"
								className="h-8 w-8 opacity-0 group-hover:opacity-100"
								onClick={(e) => e.stopPropagation()}
							>
								<MoreVertical className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem
								className="text-destructive"
								onClick={(e) => {
									e.stopPropagation();
									onDeleteClick(conversation.id);
								}}
							>
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	}
);
ConversationItem.displayName = 'ConversationItem';
