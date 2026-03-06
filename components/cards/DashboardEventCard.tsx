'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AppEvent } from '@/types';
import { format } from 'date-fns';
import { Calendar, Clock, Edit, Lock, MapPin, Ticket, Trash2, Users } from 'lucide-react';
import { LiveIndicator } from '../ui/LiveIndicator';

function getStatusConfig(status: AppEvent['status']) {
	return {
		upcoming: { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700' },
		live: { label: <LiveIndicator text="Live" />, cls: 'bg-green-100 text-green-700' },
		ended: { label: 'Ended', cls: 'bg-slate-100 text-slate-500' },
	}[status];
}

export function DashboardEventCard({
	event,
	onEdit,
	onDelete,
	onManageRequests,
}: {
	event: AppEvent;
	onEdit: (e: AppEvent) => void;
	onDelete: (e: AppEvent) => void;
	onManageRequests: (e: AppEvent) => void;
}) {
	const statusConfig = getStatusConfig(event.status);
	const isFree = event.ticketPrice === 0;

	return (
		<Card className="overflow-hidden rounded-3xl border-0 bg-white shadow-sm transition-all hover:shadow-lg">
			{/* Card top gradient */}
			<div className="h-2 bg-gradient-to-r from-primaryColor-400 to-secondaryColor-400" />

			<CardContent className="p-6">
				<div className="flex items-start justify-between gap-4">
					<div className="flex-1 overflow-hidden">
						<div className="mb-2 flex flex-wrap items-center gap-2">
							<Badge className={`rounded-full px-3 py-1 text-xs font-bold ${statusConfig.cls}`}>{statusConfig.label}</Badge>
							{event.visibility === 'private' && (
								<Badge className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-xs font-bold text-slate-500">
									<Lock className="h-3 w-3" /> Private
								</Badge>
							)}
							{event.requireApproval && (
								<Badge className="rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-600">
									Approval Required
								</Badge>
							)}
						</div>
						<h3 className="line-clamp-2 text-lg font-black text-slate-900">{event.title}</h3>
					</div>

					<div className="flex gap-2">
						{event.requireApproval && (
							<Button
								size="sm"
								variant="outline"
								onClick={() => onManageRequests(event)}
								className="h-9 rounded-xl border-slate-200 px-3 text-xs font-bold"
							>
								<Users className="me-1 h-3.5 w-3.5" />
								{event.attendeeCount}
								{event.requestsCount > 0 && (
									<Badge className="ms-1 rounded-full bg-red-100 px-1 py-0.5 text-xs font-bold text-red-600">
										{event.requestsCount}
									</Badge>
								)}
							</Button>
						)}
						<Button
							size="sm"
							variant="outline"
							onClick={() => onEdit(event)}
							className="h-9 rounded-xl border-slate-200 px-3"
						>
							<Edit className="h-4 w-4 text-slate-500" />
						</Button>
						<Button
							size="sm"
							variant="outline"
							onClick={() => onDelete(event)}
							className="h-9 rounded-xl border-slate-200 px-3 hover:border-red-200 hover:bg-red-50"
						>
							<Trash2 className="h-4 w-4 text-red-400" />
						</Button>
					</div>
				</div>

				<div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-500 sm:grid-cols-4">
					<div className="flex items-center gap-2">
						<Calendar className="h-4 w-4 text-primaryColor-400" />
						<span className="truncate">{format(event.startDate.toDate(), 'MMM d, yyyy')}</span>
					</div>
					<div className="flex items-center gap-2">
						<Clock className="h-4 w-4 text-secondaryColor-400" />
						<span>{format(event.startDate.toDate(), 'h:mm a')}</span>
					</div>
					{event.location && (
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-pink-400" />
							<span className="truncate">{event.location}</span>
						</div>
					)}
					<div className="flex items-center gap-2">
						<Ticket className="h-4 w-4 text-amber-400" />
						<span>{isFree ? 'Free' : `$${event.ticketPrice}`}</span>
					</div>
				</div>

				<div className="mt-3 flex items-center gap-2 border-t border-slate-100 pt-3 text-sm text-slate-500">
					<Users className="h-4 w-4" />
					<span>{event.attendeeCount}</span>
					{event.capacity && <span className="text-slate-300">/ {event.capacity} capacity</span>}
				</div>
			</CardContent>
		</Card>
	);
}
