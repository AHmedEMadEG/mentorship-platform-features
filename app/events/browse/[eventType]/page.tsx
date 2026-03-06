'use client';

import BackToHome from '@/components/BackToHome';
import { EventCard } from '@/components/cards/EventCard';
import { useEventAutoRefetch } from '@/hooks/useEventAutoRefetch';
import { eventQueryKeys, useInfinitePublicEvents } from '@/queries/useEvents';
import { EventStatus } from '@/types';
import { AnimatePresence, motion, useInView } from 'framer-motion';
import { Loader2, Search } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

const categoryConfig: Record<string, { title: string; description: string }> = {
	live: {
		title: 'Live Events',
		description: 'These events are happening right now. Join in!',
	},
	upcoming: {
		title: 'Upcoming Events',
		description: 'Get ready for these exciting upcoming sessions and workshops.',
	},
	ended: {
		title: 'Past Events',
		description: 'Browse our archive of past events and recordings.',
	},
};

export default function BrowseAllEventsPage() {
	const params = useParams();
	const eventType = params.eventType as EventStatus;

	const ref = useRef<HTMLDivElement>(null);

	const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, isError } = useInfinitePublicEvents({
		status: eventType,
	});

	useEventAutoRefetch(data?.pages.flatMap((page) => page.events) || [], eventQueryKeys.public(eventType));

	const inView = useInView(ref, { margin: '50px' });

	useEffect(() => {
		if (inView && hasNextPage && !isFetchingNextPage) {
			fetchNextPage();
		}
	}, [inView, hasNextPage, isFetchingNextPage, fetchNextPage]);

	const allEvents = data?.pages.flatMap((page) => page.events) ?? [];
	const config = categoryConfig[eventType] || { title: 'Events', description: '' };

	return (
		<div className="min-h-screen bg-slate-50/50">
			{/* Header Section */}
			<div className="mb-8 border-b border-slate-100 bg-white shadow-sm">
				<div className="container-modern py-6">
					<BackToHome pathName="All Events" path="/events" />
					<h1 className="mt-4 w-full text-center text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
						{config.title}
					</h1>
					<p className="mx-auto mt-2 w-full max-w-lg text-center text-lg font-medium text-slate-500">{config.description}</p>
				</div>
			</div>

			{/* Results Section */}
			<div className="container-modern pb-20">
				<AnimatePresence mode="wait">
					{isLoading ? (
						<motion.div
							key="loading"
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
						>
							{[...Array(6)].map((_, i) => (
								<div key={i} className="h-[300px] animate-pulse rounded-2xl border border-slate-100 bg-white shadow-sm" />
							))}
						</motion.div>
					) : isError || allEvents.length === 0 ? (
						<motion.div
							key="no-results"
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center justify-center space-y-6 rounded-[3rem] border border-dashed border-slate-200 bg-white p-20 text-center"
						>
							<div className="rounded-full bg-slate-50 p-6 text-slate-300">
								<Search size={48} strokeWidth={1.5} />
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-black tracking-tight text-slate-900">No Events Found</h3>
								<p className="mx-auto max-w-xs font-medium text-slate-500">There are currently no {eventType} events.</p>
							</div>
						</motion.div>
					) : (
						<>
							<motion.div
								key="results"
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
							>
								{allEvents.map((event) => (
									<EventCard key={event.id} event={event} />
								))}
							</motion.div>

							{/* Loading More Indicator */}
							{isFetchingNextPage && (
								<div className="mt-12 flex justify-center">
									<Loader2 className="h-8 w-8 animate-spin text-primaryColor-500" />
								</div>
							)}

							{/* No More Data */}
							{!hasNextPage && !!allEvents.length && (
								<div className="py-8 text-center text-sm text-gray-500">You've reached the end.</div>
							)}
						</>
					)}
				</AnimatePresence>
				{/* Intersection target to trigger loading more */}
				<div ref={ref} className="h-0" />
			</div>
		</div>
	);
}
