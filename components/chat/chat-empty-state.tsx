'use client';

import { MessageCircle } from 'lucide-react';

export function ChatEmptyState() {
	return (
		<div className="flex flex-1 flex-col items-center justify-center bg-background">
			<MessageCircle className="mb-4 h-16 w-16 text-muted-foreground" />
			<h2 className="mb-2 text-xl font-semibold">Start a conversation</h2>
			<p className="mb-6 max-w-md text-center text-muted-foreground">
				Select a conversation or create a new message to get started
			</p>
		</div>
	);
}
