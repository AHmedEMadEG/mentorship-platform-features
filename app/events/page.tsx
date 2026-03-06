'use client';

import BackToHome from '@/components/BackToHome';
import { EventCard } from '@/components/cards/EventCard';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LiveIndicator } from '@/components/ui/LiveIndicator';
import { useDebounce } from '@/hooks/use-debounce';
import { useEventAutoRefetch } from '@/hooks/useEventAutoRefetch';
import { eventQueryKeys, useRecentPublicEvents } from '@/queries/useEvents';
import { AppEvent, EventStatus } from '@/types';
import { Loader2, RotateCcw, Search } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

const categoryConfig = {
	live: {
		title: 'Happening Now',
		icon: <LiveIndicator />,
		className: 'bg-green-100 text-green-600',
	},
	upcoming: {
		title: 'Upcoming Events',
		icon: '🕒',
		className: 'bg-blue-100 text-blue-600',
	},
	ended: {
		title: 'Past Events',
		icon: '🏁',
		className: 'bg-slate-100 text-slate-400',
	},
};

export default function EventsBrowsePage() {
	const [searchQuery, setSearchQuery] = useState('');
	const debouncedQuery = useDebounce(searchQuery, 300);

	const { data, isLoading, isError } = useRecentPublicEvents(debouncedQuery);

	const events = data?.live.events.concat(data?.upcoming.events, data?.ended.events);

	useEventAutoRefetch(events || [], eventQueryKeys.recentPublic(debouncedQuery));

	return (
		<div className="min-h-screen bg-slate-50/50">
			{/* Hero Section */}
			<div className="mb-8 border-b border-slate-100 bg-white shadow-sm">
				<div className="container-modern py-6">
					<div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
						<div className="w-full space-y-1">
							<BackToHome pathName="Home" path="/" />
							<h1 className="flex items-center justify-center gap-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
								Discover Events
							</h1>
							<p className="mx-auto text-center text-lg font-medium text-slate-500">
								Join live sessions, workshops, and networking events from top mentors.
							</p>
						</div>
					</div>

					{/* Search Bar */}
					<div className="group relative flex-1">
						<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primaryColor-500" />
						<Input
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search by event title, location, or creator..."
							className="focus:ring-primaryColor-500/5 h-14 w-full rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-4 text-base shadow-inner transition-all focus:border-primaryColor-500 focus:bg-white focus:ring-4"
						/>
					</div>
				</div>
			</div>

			{/* Results Section */}
			<div className="container-modern pb-20">
				{isLoading ? (
					<div className="flex justify-center py-24">
						<Loader2 className="h-10 w-10 animate-spin text-primaryColor-500" />
					</div>
				) : isError || !data ? (
					<div className="py-24 text-center text-slate-500">Could not load events.</div>
				) : (
					<div className="space-y-12">
						{(Object.keys(data) as EventStatus[]).map((status) => {
							const category = data[status];
							if (!category || category.events.length === 0) return null;

							const config = categoryConfig[status];

							return (
								<section key={status}>
									<div className="mb-5 flex items-center justify-between">
										<h2 className="flex items-center gap-3 text-2xl font-black text-slate-900">
											<span className={`flex h-10 w-10 items-center justify-center rounded-full text-xl ${config.className}`}>
												{config.icon}
											</span>
											{config.title}
											{!category.hasMore && (
												<Badge className="font-bold">
													only {category.events.length} Event{category.events.length === 1 ? '' : 's'}
												</Badge>
											)}
										</h2>
										{category.hasMore && (
											<Button asChild variant="link" className="font-bold text-primaryColor-600">
												<Link href={`/events/browse/${status}`}>Browse all</Link>
											</Button>
										)}
									</div>
									<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
										{category.events.slice(0, 3).map((event: AppEvent) => (
											<EventCard key={event.id} event={event} />
										))}
									</div>
								</section>
							);
						})}

						{Object.values(data).every((cat) => cat.events.length === 0) && (
							<div className="flex flex-col items-center justify-center space-y-6 rounded-[3rem] border border-dashed border-slate-200 bg-white p-20 text-center">
								<div className="rounded-full bg-slate-50 p-6 text-slate-300">
									{searchQuery.length === 0 ? <Search size={48} strokeWidth={1.5} /> : <RotateCcw size={48} strokeWidth={1.5} />}
								</div>
								<div className="space-y-2">
									<h3 className="text-2xl font-black tracking-tight text-slate-900">No Events Found</h3>
									{searchQuery.length > 0 && (
										<>
											<p className="mx-auto max-w-xs font-medium text-slate-500">
												Try adjusting your filters or search query to find more events.
											</p>
											<Button onClick={() => setSearchQuery('')} variant="link" className="font-bold text-primaryColor-600">
												Clear all filters
											</Button>
										</>
									)}
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
