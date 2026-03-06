import { cn } from '@/lib/utils';
import React from 'react';

interface LiveIndicatorProps extends React.HTMLAttributes<HTMLDivElement> {
	text?: string;
}

/**
 * A simple, pulsing "live" indicator component.
 * Uses Tailwind's animate-ping for a subtle, attention-grabbing effect.
 */
export function LiveIndicator({ className, text, ...props }: LiveIndicatorProps) {
	return (
		<div className={cn('flex items-center gap-2', className)} {...props}>
			<span className="relative h-3 w-3 animate-ping rounded-full bg-red-400 opacity-75"></span>
			<span className="absolute h-3 w-3 rounded-full bg-red-500"></span>
			{text && <span>{text}</span>}
		</div>
	);
}
