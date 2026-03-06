'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { useEventAttendees, useUpdateAttendeeStatus } from '@/queries/useEvents';
import { AppEvent, AttendeeStatus, EventAttendee } from '@/types';
import { Check, Loader2, Users, X } from 'lucide-react';

interface EventRequestsModalProps {
	isOpen: boolean;
	onClose: () => void;
	event: AppEvent;
}

function statusBadge(status: AttendeeStatus) {
	const map: Record<AttendeeStatus, { label: string; cls: string }> = {
		registered: { label: 'Registered', cls: 'bg-green-100 text-green-700' },
		pending_approval: { label: 'Pending', cls: 'bg-amber-100 text-amber-700' },
		approved: { label: 'Approved', cls: 'bg-green-100 text-green-700' },
		declined: { label: 'Declined', cls: 'bg-red-100 text-red-700' },
	};
	return map[status];
}

function AttendeeRow({ attendee, eventId }: { attendee: EventAttendee; eventId: string }) {
	const { mutate: updateStatus, isPending } = useUpdateAttendeeStatus();
	const badge = statusBadge(attendee.status);

	const handle = (newStatus: AttendeeStatus) => {
		updateStatus(
			{
				eventId,
				attendeeId: attendee.id,
				status: newStatus,
				previousStatus: attendee.status,
			},
			{
				onSuccess: () => toast.success(`Attendee ${newStatus}`),
				onError: () => toast.error('Action failed', 'Please try again.'),
			}
		);
	};

	return (
		<div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-white p-4 transition-shadow hover:shadow-md">
			<Avatar className="h-10 w-10 rounded-xl">
				<AvatarImage src={attendee.userImage} />
				<AvatarFallback className="rounded-xl bg-gradient-to-br from-primaryColor-400 to-secondaryColor-400 font-bold text-white">
					{attendee.userName?.[0] || '?'}
				</AvatarFallback>
			</Avatar>

			<div className="flex-1 overflow-hidden">
				<p className="truncate font-bold text-slate-900">{attendee.userName}</p>
				<p className="truncate text-xs text-slate-500">{attendee.userEmail}</p>
			</div>

			<Badge className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.label}</Badge>

			{attendee.status === 'pending_approval' && (
				<div className="flex gap-2">
					<Button
						size="sm"
						disabled={isPending}
						onClick={() => handle('approved')}
						className="h-8 rounded-xl bg-green-600 px-3 text-xs font-bold text-white hover:bg-green-700"
					>
						{isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
					</Button>
					<Button
						size="sm"
						variant="outline"
						disabled={isPending}
						onClick={() => handle('declined')}
						className="h-8 rounded-xl border-slate-200 px-3 text-xs font-bold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
					>
						<X className="h-3 w-3" />
					</Button>
				</div>
			)}
		</div>
	);
}

export function EventRequestsModal({ isOpen, onClose, event }: EventRequestsModalProps) {
	const { data: attendees, isLoading } = useEventAttendees(event.id, isOpen);

	const pending = attendees.filter((a) => a.status === 'pending_approval');
	const others = attendees.filter((a) => a.status !== 'pending_approval');

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[85vh] max-w-xl overflow-y-auto rounded-3xl p-0">
				<div className="sticky top-0 z-10 rounded-t-3xl bg-gradient-to-r from-slate-800 to-slate-900 px-8 py-6">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3 text-xl font-black text-white">
							<Users className="h-5 w-5" /> Attendees — {event.title}
						</DialogTitle>
						<DialogDescription className="text-secondaryColor-100">Manage attendees for this event.</DialogDescription>
					</DialogHeader>
					<div className="mt-2 flex items-center gap-4 text-sm text-white/60">
						<span>{event.attendeeCount} attending</span>
						{event.capacity && <span className="text-white/30">/ {event.capacity} capacity</span>}
						{pending.length > 0 && (
							<span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs font-bold text-white">
								{pending.length} pending
							</span>
						)}
					</div>
				</div>

				<div className="space-y-6 p-6">
					{isLoading ? (
						<div className="flex justify-center py-12">
							<Loader2 className="h-8 w-8 animate-spin text-primaryColor-500" />
						</div>
					) : attendees.length === 0 ? (
						<div className="py-12 text-center text-slate-500">
							<Users className="mx-auto mb-3 h-10 w-10 text-slate-300" />
							<p className="font-semibold">No attendees yet</p>
						</div>
					) : (
						<>
							{pending.length > 0 && (
								<section>
									<h3 className="mb-3 text-xs font-black uppercase tracking-widest text-amber-500">
										Pending Approval ({pending.length})
									</h3>
									<div className="space-y-2">
										{pending.map((a) => (
											<AttendeeRow key={a.id} attendee={a} eventId={event.id} />
										))}
									</div>
								</section>
							)}

							{others.length > 0 && (
								<section>
									<h3 className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">
										All Attendees ({others.length})
									</h3>
									<div className="space-y-2">
										{others.map((a) => (
											<AttendeeRow key={a.id} attendee={a} eventId={event.id} />
										))}
									</div>
								</section>
							)}
						</>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
