import { AppEvent } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export function useEventAutoRefetch(events: AppEvent[], queryKey: any) {
	const queryClient = useQueryClient();
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		if (!events?.length) return;

		const nextTransition = getNextTransitionTime(events);
		if (!nextTransition) return;

		const delay = nextTransition - Date.now();
		if (delay <= 0) return;

		// Clear previous timeout
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			queryClient.invalidateQueries({ queryKey });
		}, delay);

		return () => {
			if (timeoutRef.current) {
				clearTimeout(timeoutRef.current);
			}
		};
	}, [events, queryClient, queryKey]);
}

function getNextTransitionTime(events: AppEvent[]) {
	const now = Date.now();

	let closest: number | null = null;

	for (const event of events) {
		const start = event.startDate.toMillis();
		const end = event.endDate.toMillis();

		// Upcoming → watch start time
		if (start > now) {
			if (!closest || start < closest) {
				closest = start;
			}
		}

		// Live → watch end time
		if (start <= now && end > now) {
			if (!closest || end < closest) {
				closest = end;
			}
		}
	}

	return closest;
}
