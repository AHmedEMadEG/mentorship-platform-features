'use client';

import { AcceptSessionModal } from '@/components/modals/AcceptSessionModal';
import { BulkAcceptSessionModal } from '@/components/modals/BulkAcceptSessionModal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { useMentorSessions, useUpdateSessionStatus } from '@/queries/useSessions';
import { SessionRequest, SessionStatus } from '@/types';
import { format } from 'date-fns';
import { Calendar, Check, CheckSquare2, Clock, Filter, Loader2, Users, X } from 'lucide-react';
import { useState } from 'react';

export default function SessionRequestsPage() {
	const { user } = useAuth();
	const [statusFilter, setStatusFilter] = useState<SessionStatus | 'all'>('all');
	const [selectedSession, setSelectedSession] = useState<SessionRequest | null>(null);
	const [isAcceptModalOpen, setIsAcceptModalOpen] = useState(false);
	const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);

	// ── Bulk selection state ──
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
	const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);

	const {
		data,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
		isLoading,
		error: mentorSessionsError,
	} = useMentorSessions(user?.id || '', statusFilter === 'all' ? undefined : statusFilter);

	if (mentorSessionsError) {
		toast.error('Failed to fetch session requests: ' + mentorSessionsError.message);
	}

	const { mutate: updateStatus, isPending: isUpdatePending } = useUpdateSessionStatus();

	const sessions = data?.pages.flatMap((page) => page.sessions) || [];
	const pendingSessions = sessions.filter((s) => s.status === 'pending');
	const selectedSessions = pendingSessions.filter((s) => selectedIds.has(s.id));

	// ── Selection helpers ──
	const toggleSelectSession = (id: string) => {
		setSelectedIds((prev) => {
			const next = new Set(prev);
			next.has(id) ? next.delete(id) : next.add(id);
			return next;
		});
	};

	const allPendingSelected = pendingSessions.length > 0 && pendingSessions.every((s) => selectedIds.has(s.id));

	const toggleSelectAll = () => {
		if (allPendingSelected) {
			setSelectedIds(new Set());
		} else {
			setSelectedIds(new Set(pendingSessions.map((s) => s.id)));
		}
	};

	const clearSelection = () => setSelectedIds(new Set());

	// ── Single accept / reject ──
	const handleAcceptClick = (session: SessionRequest) => {
		setSelectedSession(session);
		setIsAcceptModalOpen(true);
	};

	const handleRejectClick = (session: SessionRequest) => {
		setSelectedSession(session);
		setIsRejectModalOpen(true);
	};

	const handleRejectConfirm = () => {
		if (selectedSession) {
			updateStatus(
				{ sessionId: selectedSession.id, status: 'rejected' },
				{
					onSuccess: () => toast.success('Session rejected'),
					onError: () => toast.error('Failed to reject session, please try again later'),
				}
			);
		}
	};

	if (!user) return <div className="p-8">Please log in to view session requests.</div>;

	return (
		<div className="animate-fade-in space-y-8 p-1 pb-20">
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 p-8 text-white shadow-xl">
				<div className="pointer-events-none absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
				<div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
					<div>
						<h1 className="mb-2 flex items-center gap-3 text-3xl font-bold tracking-tight">
							<Calendar className="h-8 w-8 opacity-80" />
							Session Requests
						</h1>
						<p className="max-w-xl text-lg text-blue-100 opacity-90">
							Manage your mentorship sessions and incoming requests.
						</p>
					</div>
				</div>
			</div>

			{/* Filters + Select All */}
			<div className="flex flex-wrap items-center gap-4">
				<div className="flex items-center gap-2">
					<Filter className="h-5 w-5 text-slate-400" />
					<span className="font-semibold text-slate-700">Filter Status:</span>
				</div>
				<Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as SessionStatus | 'all')}>
					<SelectTrigger className="w-[180px] rounded-xl bg-white">
						<SelectValue placeholder="All Status" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all">All</SelectItem>
						<SelectItem value="pending">Pending</SelectItem>
						<SelectItem value="accepted">Accepted</SelectItem>
						<SelectItem value="rejected">Rejected</SelectItem>
					</SelectContent>
				</Select>

				{/* Select all pending — only shown when there are pending sessions */}
				{pendingSessions.length > 0 && (
					<Button
						variant="outline"
						size="sm"
						className="ml-auto flex items-center gap-2 rounded-xl border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700"
						onClick={toggleSelectAll}
					>
						<CheckSquare2 className="h-4 w-4" />
						{allPendingSelected ? 'Deselect All' : `Select All Pending (${pendingSessions.length})`}
					</Button>
				)}
			</div>

			{/* ── Bulk action toolbar ── */}
			{selectedIds.size > 0 && (
				<div className="flex items-center justify-between rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3 shadow-sm">
					<div className="flex items-center gap-2 text-sm font-semibold text-blue-800">
						<Users className="h-4 w-4" />
						{selectedIds.size} request{selectedIds.size > 1 ? 's' : ''} selected
					</div>
					<div className="flex items-center gap-3">
						<Button
							variant="outline"
							size="sm"
							onClick={clearSelection}
							className="rounded-xl border-blue-200 text-slate-600 hover:bg-white"
						>
							Clear
						</Button>
						<Button
							size="sm"
							onClick={() => setIsBulkModalOpen(true)}
							className="rounded-xl bg-blue-600 font-bold text-white hover:bg-blue-700"
						>
							<Check className="mr-2 h-4 w-4" />
							Bulk Accept ({selectedIds.size})
						</Button>
					</div>
				</div>
			)}

			{/* List */}
			{isLoading ? (
				<div className="flex justify-center p-12">
					<Loader2 className="h-8 w-8 animate-spin text-blue-600" />
				</div>
			) : sessions.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-12 text-center text-slate-500">
					No session requests found.
				</div>
			) : (
				<div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
					{sessions.map((session) => {
						const isSelected = selectedIds.has(session.id);
						const isPending = session.status === 'pending';

						return (
							<Card
								key={session.id}
								onClick={() => isPending && toggleSelectSession(session.id)}
								className={`overflow-hidden rounded-3xl border-0 bg-white shadow-lg transition-all hover:shadow-xl ${
									isPending ? 'cursor-pointer' : ''
								} ${isSelected ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}
							>
								<CardContent className="p-6">
									<div className="flex items-start justify-between">
										<div className="flex items-center gap-4">
											{/* Checkbox for pending sessions */}
											{isPending && (
												<Checkbox
													checked={isSelected}
													onCheckedChange={() => toggleSelectSession(session.id)}
													onClick={(e) => e.stopPropagation()}
													className="mt-1 h-5 w-5 shrink-0"
												/>
											)}
											<Avatar className="h-12 w-12 border-2 border-slate-100">
												<AvatarImage src={session.menteeImage} />
												<AvatarFallback>{session.menteeName?.charAt(0) || 'U'}</AvatarFallback>
											</Avatar>
											<div>
												<h3 className="font-bold text-slate-900">{session.menteeName}</h3>
												<p className="text-sm text-slate-500">{session.menteeEmail}</p>
											</div>
										</div>
										<Badge
											className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${session.status === 'pending' ? 'bg-amber-100 text-amber-700' : ''} ${session.status === 'accepted' ? 'bg-green-100 text-green-700' : ''} ${session.status === 'rejected' ? 'bg-red-100 text-red-700' : ''} `}
										>
											{session.status}
										</Badge>
									</div>

									<div className="mt-6 flex flex-col gap-4">
										<div className="rounded-xl bg-slate-50 p-4">
											<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
												Topic
											</div>
											<p className="font-medium text-slate-800">{session.topic}</p>
										</div>

										<div className="rounded-xl bg-slate-50 p-4">
											<div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
												Message
											</div>
											<p className="text-sm leading-relaxed text-slate-600">{session.description}</p>
										</div>

										<div className="flex items-center gap-2 text-xs text-slate-400">
											<Clock className="h-3 w-3" />
											Requested {session.createdAt?.toDate ? format(session.createdAt.toDate(), 'PP p') : 'Just now'}
										</div>
									</div>

									{session.status === 'pending' && (
										<div className="mt-6 flex gap-3 border-t border-slate-100 pt-6">
											<Button
												className="flex-1 rounded-xl bg-green-600 font-bold text-white hover:bg-green-700"
												onClick={(e) => {
													e.stopPropagation();
													handleAcceptClick(session);
												}}
											>
												<Check className="mr-2 h-4 w-4" /> Accept
											</Button>
											<Button
												variant="outline"
												className="flex-1 rounded-xl border-slate-200 font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
												onClick={(e) => {
													e.stopPropagation();
													handleRejectClick(session);
												}}
											>
												<X className="mr-2 h-4 w-4" /> Reject
											</Button>
										</div>
									)}

									{session.status === 'accepted' && session.calendlyUrl && (
										<div className="mt-6 break-all rounded-xl bg-green-50 p-4 font-mono text-xs text-green-700">
											Link sent: {session.calendlyUrl}
										</div>
									)}
								</CardContent>
							</Card>
						);
					})}
				</div>
			)}

			{hasNextPage && (
				<div className="flex justify-center pt-8">
					<Button
						variant="ghost"
						onClick={() => fetchNextPage()}
						disabled={isFetchingNextPage}
						className="text-slate-500 hover:bg-slate-50"
					>
						{isFetchingNextPage ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Load More Requests'}
					</Button>
				</div>
			)}

			{/* Reject dialog */}
			<Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Reject Session</DialogTitle>
						<DialogDescription>Are you sure you want to reject this session?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setIsRejectModalOpen(false)}>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								handleRejectConfirm();
								setIsRejectModalOpen(false);
							}}
							disabled={isUpdatePending}
						>
							{isUpdatePending ? 'Rejecting...' : 'Reject'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Single accept modal */}
			{isAcceptModalOpen && (
				<AcceptSessionModal
					isOpen={isAcceptModalOpen}
					onClose={() => setIsAcceptModalOpen(false)}
					session={selectedSession!}
				/>
			)}

			{/* Bulk accept modal */}
			{isBulkModalOpen && (
				<BulkAcceptSessionModal
					isOpen={isBulkModalOpen}
					onClose={() => {
						setIsBulkModalOpen(false);
						clearSelection();
					}}
					sessions={selectedSessions}
				/>
			)}
		</div>
	);
}
