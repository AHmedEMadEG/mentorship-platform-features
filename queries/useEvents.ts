import { AppEvent, EventAttendee } from '@/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import * as eventService from '../firebase/eventServices';

// ============================================================================
// QUERY KEYS
// ============================================================================

export const eventQueryKeys = {
	all: ['events'] as const,
	mentorEvents: (mentorId: string) => [...eventQueryKeys.all, 'mentor', mentorId] as const,
	public: (status: AppEvent['status']) => [...eventQueryKeys.all, 'public', status] as const,
	recentPublic: (queryText?: string) => ['events', 'recent-public', queryText] as const,
	detail: (eventId: string) => [...eventQueryKeys.all, 'detail', eventId] as const,
	attendees: (eventId: string) => [...eventQueryKeys.all, 'attendees', eventId] as const,
	attendance: (eventId: string, userId: string) => [...eventQueryKeys.attendees(eventId), userId] as const,
};

// ============================================================================
// EVENT QUERY HOOKS
// ============================================================================

export function useMentorEvents(mentorId: string, enabled = true) {
	return useQuery({
		queryKey: eventQueryKeys.mentorEvents(mentorId),
		queryFn: () => eventService.getMentorEvents(mentorId),
		enabled: !!mentorId && enabled,
	});
}

export function useEventById(eventId: string, enabled = true) {
	return useQuery({
		queryKey: eventQueryKeys.detail(eventId),
		queryFn: () => eventService.getEventById(eventId),
		enabled: enabled && !!eventId,
	});
}

export function useInfinitePublicEvents({ status, pageSize = 10 }: { status: AppEvent['status']; pageSize?: number }) {
	return useInfiniteQuery({
		queryKey: eventQueryKeys.public(status),
		initialPageParam: null as QueryDocumentSnapshot<DocumentData> | null,
		queryFn: ({ pageParam }) => eventService.getPublicEventsInfinite(status, pageSize, pageParam),
		getNextPageParam: (lastPage) => lastPage.lastDoc,
		staleTime: 1000 * 60 * 5,
		gcTime: 1000 * 60 * 10,
	});
}

export function useRecentPublicEvents(queryText?: string) {
	return useQuery({
		queryKey: eventQueryKeys.recentPublic(queryText),
		queryFn: () => eventService.getRecentPublicEvents(queryText),
	});
}

// ============================================================================
// EVENT MUTATION HOOKS
// ============================================================================

export function useCreateEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: eventService.CreateEventData) => eventService.createEvent(data),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
		},
	});
}

export function useUpdateEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({ eventId, data }: { eventId: string; data: eventService.UpdateEventData }) =>
			eventService.updateEvent(eventId, data),
		onSuccess: (_, { eventId }) => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
		},
	});
}

export function useDeleteEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (eventId: string) => eventService.deleteEvent(eventId),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.all });
		},
	});
}

// ============================================================================
// ATTENDEE HOOKS
// ============================================================================

export function useEventAttendees(eventId: string, enabled = true) {
	const [attendees, setAttendees] = useState<EventAttendee[]>([]);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<Error | null>(null);

	useEffect(() => {
		if (!enabled || !eventId) {
			setIsLoading(false);
			return;
		}

		const unsubscribe = eventService.subscribeToEventAttendees(
			eventId,
			(data) => {
				setAttendees(data);
				setIsLoading(false);
				setError(null);
			},
			(err) => {
				setError(err);
				setIsLoading(false);
			}
		);
		return () => unsubscribe();
	}, [eventId, enabled]);

	return { data: attendees, isLoading, error };
}

export function useUserAttendance(eventId: string, userId: string, enabled = true) {
	return useQuery({
		queryKey: eventQueryKeys.attendance(eventId, userId),
		queryFn: () => eventService.getUserAttendance(eventId, userId),
		enabled: enabled && !!eventId && !!userId,
	});
}

export function useJoinEvent() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: (data: eventService.JoinEventData) => eventService.joinEvent(data),
		onSuccess: (_, variables) => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendees(variables.eventId) });
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendance(variables.eventId, variables.userId) });
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(variables.eventId) });
		},
	});
}

export function useUpdateAttendeeStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: ({
			eventId,
			attendeeId,
			status,
			previousStatus,
		}: {
			eventId: string;
			attendeeId: string;
			status: import('@/types').AttendeeStatus;
			previousStatus: import('@/types').AttendeeStatus;
		}) => eventService.updateAttendeeStatus(eventId, attendeeId, status, previousStatus),
		onSuccess: (_, { eventId }) => {
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.attendees(eventId) });
			queryClient.invalidateQueries({ queryKey: eventQueryKeys.detail(eventId) });
		},
	});
}
