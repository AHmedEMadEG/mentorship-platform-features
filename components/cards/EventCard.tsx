import { AppEvent } from '@/types';
import { format } from 'date-fns';
import { Calendar, Lock, MapPin, Ticket, Users } from 'lucide-react';
import Link from 'next/link';
import { LiveIndicator } from '../ui/LiveIndicator';

function getStatusBadge(event: AppEvent) {
	const map = {
		upcoming: { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700' },
		live: { label: <LiveIndicator text="Live Now" />, cls: 'bg-green-100 text-green-700' },
		ended: { label: 'Ended', cls: 'bg-slate-100 text-slate-500' },
	};
	return map[event.status];
}

export function EventCard({ event }: { event: AppEvent }) {
	const badge = getStatusBadge(event);
	const isFree = event.ticketPrice === 0;

	return (
		<Link href={`/events/${event.id}`} className="group block">
			<div className="relative overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
				{/* Gradient Banner */}
				<div className="relative h-32 bg-gradient-to-br from-primaryColor-500 via-secondaryColor-500 to-pink-500">
					<div className="absolute inset-0 bg-black/10" />
					<div className="absolute bottom-4 left-4 flex items-center gap-2">
						<span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>
							{badge.label}
						</span>
						{event.visibility === 'private' && (
							<span className="inline-flex items-center gap-1 rounded-full bg-slate-900/70 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
								<Lock className="h-3 w-3" /> Private
							</span>
						)}
					</div>
				</div>

				<div className="p-5">
					<h3 className="mb-3 line-clamp-2 text-lg font-bold text-slate-900 transition-colors group-hover:text-primaryColor-600">
						{event.title}
					</h3>

					<div className="space-y-2 text-sm text-slate-500">
						<div className="flex items-center gap-2">
							<Calendar className="h-4 w-4 text-primaryColor-400" />
							<span>{format(event.startDate.toDate(), 'EEE, MMM d · h:mm a')}</span>
						</div>
						<div className="flex items-center gap-2">
							<MapPin className="h-4 w-4 text-secondaryColor-400" />
							<span className="line-clamp-1">{event.location}</span>
						</div>
					</div>

					<div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
						<div className="flex items-center gap-2 text-sm text-slate-500">
							<Users className="h-4 w-4" />
							<span>
								{event.attendeeCount}
								{event.capacity ? ` / ${event.capacity}` : ''} attending
							</span>
						</div>
						<div className="flex items-center gap-1 text-sm font-bold">
							{isFree ? (
								<span className="text-green-600">Free</span>
							) : (
								<>
									<Ticket className="h-4 w-4 text-primaryColor-500" />
									<span className="text-primaryColor-600">${event.ticketPrice}</span>
								</>
							)}
						</div>
					</div>
				</div>
			</div>
		</Link>
	);
}
