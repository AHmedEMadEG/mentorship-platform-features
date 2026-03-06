'use client';

import React from 'react';

import { Button } from '@/components/ui/button';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { useEventAutoRefetch } from '@/hooks/useEventAutoRefetch';
import { eventQueryKeys, useEventById, useJoinEvent, useUserAttendance } from '@/queries/useEvents';
import { format } from 'date-fns';
import { ArrowLeft, Calendar, Check, Clock, Loader2, Lock, MapPin, Ticket, Users } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

function getStatusBadge(status: string) {
	const map: Record<string, { label: string | React.ReactNode; cls: string }> = {
		upcoming: { label: 'Upcoming', cls: 'bg-blue-100 text-blue-700' },
		live: { label: <LiveIndicator text="Live Now" />, cls: 'bg-green-100 text-green-700' },
		ended: { label: 'Ended', cls: 'bg-slate-100 text-slate-500' },
	};
	return map[status] ?? { label: status, cls: 'bg-slate-100 text-slate-500' };
}

function getAttendeeBadge(status: string) {
	const map: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
		registered: { label: "You're registered", cls: 'bg-green-100 text-green-700', icon: <Check className="h-4 w-4" /> },
		pending_approval: {
			label: 'Request pending',
			cls: 'bg-amber-100 text-amber-700',
			icon: <Clock className="h-4 w-4" />,
		},
		approved: { label: 'Approved', cls: 'bg-green-100 text-green-700', icon: <Check className="h-4 w-4" /> },
		declined: { label: 'Request declined', cls: 'bg-red-100 text-red-700', icon: null },
	};
	return map[status];
}

export default function EventDetailPage({ params }: { params: Promise<{ eventId: string }> }) {
	if (!appConfig.isRebusAIMentors) redirect('/');

	const { eventId } = React.use(params);

	const { user } = useAuth();
	const { data: event, isLoading } = useEventById(eventId);
	const { data: attendance, isLoading: isAttendanceLoading } = useUserAttendance(eventId, user?.id || '', !!user);
	const { mutate: joinEvent, isPending: isJoining } = useJoinEvent();

	useEventAutoRefetch(event ? [event] : [], eventQueryKeys.detail(eventId));

	if (isLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<Loader2 className="h-10 w-10 animate-spin text-primaryColor-500" />
			</div>
		);
	}

	if (!event) return notFound();

	const badge = getStatusBadge(event.status);
	const isFree = event.ticketPrice === 0;
	const isEnded = event.status === 'ended';
	const isFull = event.capacity !== null && event.attendeeCount >= event.capacity;

	const handleJoin = () => {
		if (!user) return;
		joinEvent(
			{
				eventId: event.id,
				userId: user.id,
				userName: user.displayName || 'Anonymous',
				userEmail: user.email || '',
				userImage: user.photoURL || '',
				requireApproval: event.requireApproval,
			},
			{
				onSuccess: () => {
					if (event.requireApproval) {
						toast.success('Request sent!', 'The mentor will review your request.');
					} else {
						toast.success("You're in!", "You've successfully registered for this event.");
					}
				},
				onError: () => toast.error('Failed to join', 'Please try again later.'),
			}
		);
	};

	const attendeeBadge = attendance ? getAttendeeBadge(attendance.status) : null;

	return (
		<div className="min-h-screen bg-slate-50 pb-20">
			{/* Hero Banner */}
			<div className="relative overflow-hidden bg-gradient-to-br from-primaryColor-600 via-secondaryColor-600 to-pink-600">
				<div className="pointer-events-none absolute inset-0 bg-black/20" />
				<div className="relative mx-auto max-w-4xl px-4 py-16 sm:px-6 lg:px-8">
					<Link
						href="/events"
						className="mb-6 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
					>
						<ArrowLeft className="h-4 w-4" /> All Events
					</Link>

					<div className="flex flex-wrap items-center gap-2">
						<span className={`rounded-full px-3 py-1 text-xs font-bold ${badge.cls}`}>{badge.label}</span>
						{event.visibility === 'private' && (
							<span className="flex items-center gap-1 rounded-full bg-black/30 px-3 py-1 text-xs font-bold text-white">
								<Lock className="h-3 w-3" /> Private Event
							</span>
						)}
					</div>

					<h1 className="mt-4 text-4xl font-black tracking-tight text-white sm:text-5xl">{event.title}</h1>

					<div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-white/80">
						<span className="flex items-center gap-2">
							<Calendar className="h-4 w-4" />
							{format(event.startDate.toDate(), 'EEE, MMM d, yyyy')}
						</span>
						<span className="flex items-center gap-2">
							<Clock className="h-4 w-4" />
							{format(event.startDate.toDate(), 'h:mm a')} &ndash; {format(event.endDate.toDate(), 'h:mm a')}
						</span>
						{event.location && (
							<span className="flex items-center gap-2">
								<MapPin className="h-4 w-4" />
								{event.location}
							</span>
						)}
					</div>
				</div>
			</div>

			<div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
				<div className="mt-10 grid gap-8 md:grid-cols-3">
					{/* Description */}
					<div className="md:col-span-2">
						<div className="rounded-3xl bg-white p-8 shadow-sm">
							<h2 className="mb-4 text-xl font-black text-slate-900">About this event</h2>
							<p className="whitespace-pre-wrap leading-relaxed text-slate-600">{event.description}</p>
						</div>
					</div>

					{/* Sidebar — Registration Card */}
					<div className="space-y-4">
						<div className="rounded-3xl bg-white p-6 shadow-sm">
							<div className="mb-4 flex items-center justify-between">
								<div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
									<Users className="h-4 w-4" />
									{event.attendeeCount}
									{event.capacity ? ` / ${event.capacity}` : ''} attending
								</div>
								<div className="flex items-center gap-1 font-bold">
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

							{/* CTA */}
							{isEnded ? (
								<div className="rounded-2xl bg-slate-100 p-4 text-center text-sm font-semibold text-slate-500">
									This event has ended
								</div>
							) : isFull && !attendance ? (
								<div className="rounded-2xl bg-amber-50 p-4 text-center text-sm font-semibold text-amber-600">
									Event is at full capacity
								</div>
							) : !user ? (
								<div className="space-y-3">
									<p className="text-center text-sm text-slate-500">You need to be logged in to join this event.</p>
									<Link href={`/auth/login?redirect=/events/${event.id}`} className="block">
										<Button className="w-full rounded-2xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 font-bold text-white">
											Login to Join
										</Button>
									</Link>
								</div>
							) : attendeeBadge ? (
								<div
									className={`flex items-center justify-center gap-2 rounded-2xl p-4 text-sm font-bold ${attendeeBadge.cls}`}
								>
									{attendeeBadge.icon}
									{attendeeBadge.label}
								</div>
							) : (
								<Button
									onClick={handleJoin}
									disabled={isJoining || isAttendanceLoading}
									className="w-full rounded-2xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 py-3 font-bold text-white shadow-lg transition-all hover:scale-[1.02] hover:shadow-xl"
								>
									{isJoining ? (
										<Loader2 className="h-4 w-4 animate-spin" />
									) : event.requireApproval ? (
										'Request to Join'
									) : (
										'Join Event'
									)}
								</Button>
							)}

							{event.requireApproval && !attendance && !isEnded && (
								<p className="mt-3 text-center text-xs text-slate-400">
									Approval required — the organiser will review your request.
								</p>
							)}
						</div>

						{/* Organiser info */}
						<div className="rounded-3xl bg-white p-6 shadow-sm">
							<p className="mb-3 text-xs font-bold uppercase tracking-widest text-slate-400">Organiser</p>
							<div className="flex items-center gap-3">
								{event.creatorImage ? (
									<Image
										src={event.creatorImage}
										alt={event.creatorName}
										height={40}
										width={40}
										className="h-10 w-10 rounded-full object-cover"
									/>
								) : (
									<div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primaryColor-400 to-secondaryColor-400 font-bold text-white">
										{event.creatorName[0]}
									</div>
								)}
								<span className="font-bold text-slate-900">{event.creatorName}</span>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
