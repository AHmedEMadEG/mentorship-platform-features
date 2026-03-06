'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Conversation, User } from '@/types';
import { ArrowLeft, MoreVertical } from 'lucide-react';
import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

interface ChatHeaderProps {
	conversation: Conversation;
	closeChat: () => void;
	otherUserData: User;
	onDelete?: (conversationId: string) => void;
	isDeleteLoading?: boolean;
}

export function ChatHeader({ conversation, closeChat, otherUserData, onDelete, isDeleteLoading }: ChatHeaderProps) {
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	return (
		<div className="flex items-center justify-between border-b border-border bg-background p-4">
			<div className="flex items-center gap-3">
				<Button size="icon" variant="ghost" onClick={closeChat}>
					<ArrowLeft className="h-5 w-5" />
				</Button>
				<Avatar className="h-10 w-10">
					<AvatarImage src={otherUserData?.photoURL || '/mentor-placeholder.png'} className="object-cover" />
				</Avatar>
				<div>
					<h2 className="font-semibold">{otherUserData?.displayName}</h2>
					<p className="text-xs text-muted-foreground">Active now (TODO)</p>
				</div>
			</div>

			{onDelete && (
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button size="icon" variant="ghost">
							<MoreVertical className="h-5 w-5" />
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuItem className="text-destructive" onClick={() => setIsDeleteModalOpen(true)}>
							Delete Conversation
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			)}

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
						<Button variant="destructive" onClick={() => onDelete?.(conversation.id)} disabled={isDeleteLoading}>
							{isDeleteLoading ? 'Deleting...' : 'Delete'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
