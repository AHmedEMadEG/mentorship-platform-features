'use client';

import { DashboardEventCard } from '@/components/cards/DashboardEventCard';
import { EventFormModal } from '@/components/modals/EventFormModal';
import { EventRequestsModal } from '@/components/modals/EventRequestsModal';
import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { useEventAutoRefetch } from '@/hooks/useEventAutoRefetch';
import { eventQueryKeys, useDeleteEvent, useMentorEvents } from '@/queries/useEvents';
import { AppEvent } from '@/types';
import { CalendarDays, Clock, Loader2, Plus, Users } from 'lucide-react';
import { redirect } from 'next/navigation';
import { useState } from 'react';

export default function ManageEventsPage() {
	if (!appConfig.isRebusAIMentors) redirect('/');

	const { user } = useAuth();

	const isMentorOnly = user?.role?.includes('mentor') && !user?.role?.includes('admin');

	const { data: events, isLoading } = useMentorEvents(user?.id || '', !!user && isMentorOnly);
	const { mutate: deleteEvent, isPending: isDeleting } = useDeleteEvent();

	useEventAutoRefetch(events || [], eventQueryKeys.mentorEvents(user?.id || ''));

	const [isFormOpen, setIsFormOpen] = useState(false);
	const [editingEvent, setEditingEvent] = useState<AppEvent | null>(null);
	const [deletingEvent, setDeletingEvent] = useState<AppEvent | null>(null);
	const [requestsEvent, setRequestsEvent] = useState<AppEvent | null>(null);

	const handleEdit = (event: AppEvent) => {
		setEditingEvent(event);
		setIsFormOpen(true);
	};

	const handleDeleteConfirm = () => {
		if (!deletingEvent) return;
		deleteEvent(deletingEvent.id, {
			onSuccess: () => {
				toast.success('Event deleted');
				setDeletingEvent(null);
			},
			onError: () => toast.error('Failed to delete event. Please try again.'),
		});
	};

	const openCreate = () => {
		setEditingEvent(null);
		setIsFormOpen(true);
	};

	if (!user) return null;

	return (
		<div className="animate-fade-in space-y-8 p-1 pb-20">
			{/* Page Header */}
			<div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 p-8 text-white shadow-xl">
				<div className="pointer-events-none absolute right-0 top-0 -mr-10 -mt-10 h-52 w-52 rounded-full bg-white/10 blur-3xl" />
				<div className="relative z-10 flex flex-col justify-between gap-6 md:flex-row md:items-center">
					<div>
						<h1 className="mb-2 flex items-center gap-3 text-3xl font-black tracking-tight">
							<CalendarDays className="h-8 w-8 opacity-80" />
							Manage Events
						</h1>
						<p className="max-w-xl text-lg text-white/80">Create, manage, and track all your events in one place.</p>
					</div>
					<Button
						onClick={openCreate}
						className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3 text-sm font-black text-primaryColor-600 shadow-lg transition-all hover:scale-105 hover:bg-white/90 hover:shadow-xl"
					>
						<Plus className="h-5 w-5" /> Create Event
					</Button>
				</div>
			</div>

			{/* Stats */}
			<div className="grid gap-4 sm:grid-cols-3">
				{[
					{ label: 'Total Events', value: events?.length, icon: CalendarDays, color: 'text-primaryColor-500' },
					{
						label: 'Upcoming',
						value: events?.filter((e) => e.status === 'upcoming').length,
						icon: Clock,
						color: 'text-blue-500',
					},
					{
						label: 'Total Attendees',
						value: events?.reduce((s, e) => s + e.attendeeCount, 0),
						icon: Users,
						color: 'text-secondaryColor-500',
					},
				].map((stat) => (
					<div key={stat.label} className="rounded-2xl bg-white p-5 shadow-sm">
						<div className={`mb-2 ${stat.color}`}>
							<stat.icon className="h-6 w-6" />
						</div>
						<p className="text-2xl font-black text-slate-900">{stat.value}</p>
						<p className="text-sm text-slate-500">{stat.label}</p>
					</div>
				))}
			</div>

			{/* Events List */}
			{isLoading ? (
				<div className="flex justify-center py-20">
					<Loader2 className="h-10 w-10 animate-spin text-primaryColor-500" />
				</div>
			) : events?.length === 0 ? (
				<div className="rounded-3xl border border-dashed border-slate-200 bg-white p-16 text-center">
					<CalendarDays className="mx-auto mb-4 h-12 w-12 text-slate-300" />
					<p className="text-xl font-bold text-slate-500">No events yet</p>
					<p className="mt-2 text-sm text-slate-400">Click "Create Event" to get started.</p>
					<Button
						onClick={openCreate}
						className="mt-6 rounded-2xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 font-bold text-white"
					>
						<Plus className="mr-2 h-4 w-4" /> Create your first event
					</Button>
				</div>
			) : (
				<div className="grid gap-4 md:grid-cols-2">
					{events?.map((event) => (
						<DashboardEventCard
							key={event.id}
							event={event}
							onEdit={handleEdit}
							onDelete={setDeletingEvent}
							onManageRequests={setRequestsEvent}
						/>
					))}
				</div>
			)}

			{/* Create/Edit Modal */}
			{isFormOpen && (
				<EventFormModal
					isOpen={isFormOpen}
					onClose={() => {
						setIsFormOpen(false);
						setEditingEvent(null);
					}}
					mentorId={user.id}
					mentorName={user.displayName || 'Mentor'}
					mentorImage={user.photoURL || ''}
					event={editingEvent}
				/>
			)}

			{/* Attendee Requests Modal */}
			{requestsEvent && (
				<EventRequestsModal isOpen={!!requestsEvent} onClose={() => setRequestsEvent(null)} event={requestsEvent} />
			)}

			{/* Delete Confirmation */}
			<Dialog open={!!deletingEvent} onOpenChange={(open) => !open && setDeletingEvent(null)}>
				<DialogContent className="rounded-3xl sm:max-w-md">
					<DialogHeader>
						<DialogTitle>Delete Event</DialogTitle>
						<DialogDescription>
							Are you sure you want to delete <strong>{deletingEvent?.title}</strong>? This action cannot be undone and will
							remove all attendees.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setDeletingEvent(null)} className="rounded-2xl">
							Cancel
						</Button>
						<Button variant="destructive" disabled={isDeleting} onClick={handleDeleteConfirm} className="rounded-2xl">
							{isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete Event'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
