'use client';

import React, { useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send } from 'lucide-react';
import { useRef, useState } from 'react';

interface ChatInputProps {
	onSendMessage: (message: string) => void;
}

export function ChatInput({ onSendMessage }: ChatInputProps) {
	const [message, setMessage] = useState('');
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Focus on mount
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.focus();
		}
	}, []);

	const handleSendMessage = () => {
		if (!message.trim()) return;

		try {
			onSendMessage(message.trim());
			setMessage('');
			// Keep focus
			if (textareaRef.current) {
				textareaRef.current.focus();
			}
		} catch (error) {
			console.error('Error sending message:', error);
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			handleSendMessage();
		}
	};

	const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		const textarea = e.target;
		setMessage(textarea.value);

		// Auto-grow textarea
		textarea.style.height = 'auto';
		textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
	};

	return (
		<div className="border-t border-border bg-background p-4">
			<div className="flex items-end gap-3">
				<Textarea
					ref={textareaRef}
					placeholder="Enter Message..."
					className="max-h-32 min-h-12 resize-none border-0 bg-secondary"
					value={message}
					onChange={handleInputChange}
					onKeyDown={handleKeyDown}
					rows={1}
				/>
				<Button size="icon" onClick={handleSendMessage} disabled={!message.trim()} className="h-10 w-10 flex-shrink-0">
					<Send className="h-4 w-4" />
				</Button>
			</div>
		</div>
	);
}
