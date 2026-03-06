import { sessionsServices } from '@/firebase/sessionsServices';
import { SessionStatus } from '@/types';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const useCreateSession = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: sessionsServices.createSessionRequest,
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessionRequests'] });
		},
	});
};

export const useMentorSessions = (mentorId: string, status?: SessionStatus) => {
	return useInfiniteQuery({
		queryKey: ['sessionRequests', mentorId, status],
		queryFn: ({ pageParam }) => sessionsServices.getSessionRequestsForMentor(mentorId, 10, pageParam, status),
		initialPageParam: null as any,
		getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.lastDoc : undefined),
		enabled: !!mentorId,
	});
};

export const usePendingSessionRequests = (userId: string, mentorId: string, enabled?: boolean) => {
	return useQuery({
		queryKey: ['sessionRequests', userId, mentorId],
		queryFn: () => sessionsServices.getPendingSessionRequestsByUserIds(userId, mentorId),
		enabled: !!userId && !!mentorId && enabled,
	});
};

export const useAllPendingSessionsForUserAsMentee = (userId: string) => {
	return useQuery({
		queryKey: ['sessionRequests', userId, 'all-pending'],
		queryFn: () => sessionsServices.getAllPendingSessionRequestsForUserAsMentee(userId),
		enabled: !!userId,
		staleTime: 30_000,
	});
};

export const useUpdateSessionStatus = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			sessionId,
			status,
			calendlyUrl,
		}: {
			sessionId: string;
			status: SessionStatus;
			calendlyUrl?: string;
		}) => sessionsServices.updateSessionStatus(sessionId, status, calendlyUrl),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessionRequests'] });
		},
	});
};

export const useSendSessionMessage = () => {
	return useMutation({
		mutationFn: ({ menteeId, mentorId, calendlyUrl }: { menteeId: string; mentorId: string; calendlyUrl: string }) =>
			sessionsServices.sendSessionMessage(menteeId, mentorId, calendlyUrl),
	});
};

export const useBulkAcceptSessions = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: ({
			sessions,
			calendlyUrl,
		}: {
			sessions: { id: string; menteeId: string; mentorId: string }[];
			calendlyUrl: string;
		}) => sessionsServices.bulkAcceptSessions(sessions, calendlyUrl),
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['sessionRequests'] });
		},
	});
};
