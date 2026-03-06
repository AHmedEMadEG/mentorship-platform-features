'use client';

import BackToHome from '@/components/BackToHome';
import MentorshipCard from '@/components/cards/MentorshipCard';
import { CountrySearch } from '@/components/CountrySearch';
import { LocationSearch } from '@/components/location-search';
import { MultiSelectPopover } from '@/components/MultiSelectPopover';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/contexts/auth-context';
import { mentorshipService } from '@/firebase/mentorshipService';
import { useGetUsersByUserIds } from '@/firebase/userServices';
import { useDebounce } from '@/hooks/use-debounce';
import { toast } from '@/hooks/use-toast';
import { availabilityOptions, careerStageOptions, experienceLevelOptions, languageOptions } from '@/lib/constants';
import { cn } from '@/lib/utils';
import { useAllPendingSessionsForUserAsMentee } from '@/queries/useSessions';
import { Mentorship } from '@/types';
import { DocumentData, QueryDocumentSnapshot } from 'firebase/firestore';
import { AnimatePresence, motion } from 'framer-motion';
import { RotateCcw, Search, SlidersHorizontal } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

const MentorshipPage = () => {
	const [mentorships, setMentorships] = useState<Mentorship[] | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadingMore, setLoadingMore] = useState(false);
	const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
	const [hasMore, setHasMore] = useState(true);

	const [query, setQuery] = useState('');
	const [languageFilter, setLanguageFilter] = useState<string[]>([]);
	const [availabilityFilter, setAvailabilityFilter] = useState<string>('');
	const [experienceLevelFilter, setExperienceLevelFilter] = useState<string>('');
	const [locationFilter, setLocationFilter] = useState<string>('');
	const [selectedCountryCode, setSelectedCountryCode] = useState('');

	const [countryFilter, setCountryFilter] = useState<string>('');
	const [careerStageFilter, setCareerStageFilter] = useState<string>('');

	const [isSidebarOpen, setIsSidebarOpen] = useState(false);

	const { user } = useAuth();

	const { data: allPendingSessions } = useAllPendingSessionsForUserAsMentee(user?.uid || '');

	const uniqueUserIds = useMemo(() => {
		if (!mentorships) return [];
		return Array.from(new Set(mentorships.map((m) => m.userId)));
	}, [mentorships]);

	const { data: mentorsUserData } = useGetUsersByUserIds(uniqueUserIds);

	const userIdToUidMap = useMemo(() => {
		const map: Record<string, string> = {};
		mentorsUserData?.forEach((u) => {
			if (u.userId) {
				map[u.userId] = u.id;
			}
		});
		return map;
	}, [mentorsUserData]);

	const debouncedQuery = useDebounce(query, 300);

	const clearFilters = useCallback(() => {
		setQuery('');
		setLanguageFilter([]);
		setAvailabilityFilter('');
		setExperienceLevelFilter('');
		setLocationFilter('');
		setCountryFilter('');
		setCareerStageFilter('');
		setLastDoc(null);
		setHasMore(true);
		fetchInitialMentorships();
	}, []);

	const activeFilterCount = [
		languageFilter.length > 0,
		availabilityFilter && availabilityFilter !== 'all',
		experienceLevelFilter && experienceLevelFilter !== 'all',
		locationFilter,
		countryFilter,
		careerStageFilter && careerStageFilter !== 'all',
	].filter(Boolean).length;

	// Fetch initial mentorships with filters
	const fetchInitialMentorships = useCallback(async () => {
		try {
			setLoading(true);

			const res = await mentorshipService.getMentorships(
				8, // pageSize
				null, // lastDoc
				debouncedQuery || undefined, // searchQuery
				countryFilter || undefined, // countryFilter
				careerStageFilter || undefined, // careerStageFilter
				languageFilter.length > 0 ? languageFilter : undefined, // languages
				availabilityFilter === 'all' ? undefined : availabilityFilter, // availability
				experienceLevelFilter === 'all' ? undefined : experienceLevelFilter, // experienceLevel
				locationFilter || undefined // location
			);

			setMentorships(res.mentorships);
			setLastDoc(res.lastDoc);
			setHasMore(res.hasMore);
		} catch (error: any) {
			toast.error(`${error.message || error}`);
			console.error(error);
		} finally {
			setLoading(false);
		}
	}, [
		debouncedQuery,
		countryFilter,
		careerStageFilter,
		languageFilter,
		availabilityFilter,
		experienceLevelFilter,
		locationFilter,
	]);

	// Load more mentorships
	const loadMoreMentorships = useCallback(async () => {
		if (!hasMore || loadingMore) return;
		setLoadingMore(true);

		try {
			const res = await mentorshipService.getMentorships(
				8, // pageSize
				lastDoc, // lastDoc for pagination
				debouncedQuery || undefined, // searchQuery
				countryFilter || undefined, // countryFilter
				careerStageFilter || undefined, // careerStageFilter
				languageFilter.length > 0 ? languageFilter : undefined, // languages
				availabilityFilter === 'all' ? undefined : availabilityFilter, // availability
				experienceLevelFilter === 'all' ? undefined : experienceLevelFilter, // experienceLevel
				locationFilter || undefined // location
			);

			// Add deduplication to be safe
			const existingIds = new Set(mentorships?.map((m) => m.id) || []);
			const newMentorships = res.mentorships.filter((m) => !existingIds.has(m.id));

			if (newMentorships.length > 0) {
				setMentorships((prev) => (prev ? [...prev, ...newMentorships] : newMentorships));
			}

			setLastDoc(res.lastDoc);
			setHasMore(res.hasMore);
		} catch (error: any) {
			console.error(error);
		} finally {
			setLoadingMore(false);
		}
	}, [
		hasMore,
		loadingMore,
		lastDoc,
		debouncedQuery,
		countryFilter,
		careerStageFilter,
		languageFilter,
		availabilityFilter,
		experienceLevelFilter,
		locationFilter,
		mentorships,
	]);

	// Debounce fetch to prevent rapid calls
	useEffect(() => {
		fetchInitialMentorships();
	}, [debouncedQuery]);

	// Infinite scroll
	const handleScroll = useCallback(() => {
		if (
			!hasMore ||
			loadingMore ||
			debouncedQuery ||
			languageFilter.length > 0 ||
			availabilityFilter ||
			experienceLevelFilter ||
			locationFilter
		)
			return;

		const scrollTop = window.scrollY;
		const windowHeight = window.innerHeight;
		const documentHeight = document.documentElement.scrollHeight;
		const scrollThreshold = 200;

		if (scrollTop + windowHeight >= documentHeight - scrollThreshold) {
			loadMoreMentorships();
		}
	}, [
		hasMore,
		loadingMore,
		debouncedQuery,
		languageFilter,
		availabilityFilter,
		experienceLevelFilter,
		locationFilter,
		loadMoreMentorships,
	]);

	useEffect(() => {
		window.addEventListener('scroll', handleScroll);
		return () => window.removeEventListener('scroll', handleScroll);
	}, [handleScroll]);

	const handleCountryChange = (value: string, countryCode: string) => {
		setCountryFilter(value);
		setLocationFilter('');
		setSelectedCountryCode(countryCode);
	};

	return (
		<div className="min-h-screen bg-slate-50/50">
			{/* Premium Header Section */}
			<div className="mb-8 border-b border-slate-100 bg-white shadow-sm">
				<div className="container-modern py-6">
					<div className="mb-8 flex flex-col justify-between gap-6 md:flex-row md:items-center">
						<div className="w-full space-y-1">
							<BackToHome pathName="Home" path="/" />
							<h1 className="flex items-center justify-center gap-3 text-4xl font-black tracking-tight text-slate-900 md:text-5xl">
								Meet Mentors
							</h1>
							<p className="mx-auto text-center text-lg font-medium text-slate-500">
								Who Got You- Learn from real experiences and grow with genuine support.
							</p>
						</div>
					</div>

					<div className="flex flex-col gap-3 md:flex-row">
						{/* Search Bar */}
						<div className="group relative flex-1">
							<Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-primaryColor-500" />
							<Input
								value={query}
								onChange={(e) => setQuery(e.target.value)}
								placeholder="Search by name, role, or company..."
								className="focus:ring-primaryColor-500/5 h-14 w-full rounded-2xl border-slate-200 bg-slate-50 pl-12 pr-4 text-base shadow-inner transition-all focus:border-primaryColor-500 focus:bg-white focus:ring-4"
							/>
						</div>

						{/* Action Buttons */}
						<div className="flex gap-3">
							<Sheet open={isSidebarOpen} onOpenChange={setIsSidebarOpen}>
								<SheetTrigger asChild>
									<Button className="flex h-14 items-center gap-2 rounded-2xl border-2 border-slate-200 bg-white px-6 text-[10px] font-black uppercase tracking-widest text-slate-900 shadow-sm transition-all hover:bg-slate-50">
										<SlidersHorizontal size={16} className="text-primaryColor-600" />
										Filters
										{activeFilterCount > 0 && (
											<span className="flex h-5 w-5 items-center justify-center rounded-full bg-primaryColor-600 text-[10px] text-white">
												{activeFilterCount}
											</span>
										)}
									</Button>
								</SheetTrigger>
								<SheetContent
									side="right"
									className="w-full overflow-hidden border-l border-slate-100 p-0 shadow-2xl sm:max-w-md"
								>
									<div className="flex h-full flex-col bg-white">
										{/* Sidebar Header */}
										<div className={cn('p-8 text-white', appConfig.isRebusAIMentors ? 'bg-primaryColor-900' : 'bg-slate-900')}>
											<SheetHeader className="text-left">
												<SheetTitle className="flex items-center justify-between text-3xl font-black tracking-tight text-white">
													Refine Results
												</SheetTitle>
												<p className="mt-2 font-medium text-slate-400">
													Customize your search to find the perfect professional match.
												</p>
											</SheetHeader>
										</div>

										{/* Filter Scroll Area */}
										<div className="flex-1 space-y-8 overflow-y-auto p-8">
											<div className="space-y-6">
												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Availability</Label>
													<Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
														<SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 transition-colors hover:bg-slate-50">
															<SelectValue placeholder="All Schedules" />
														</SelectTrigger>
														<SelectContent className="rounded-xl border-slate-100 shadow-xl">
															<SelectItem value="all">All Schedules</SelectItem>
															{availabilityOptions.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Career Stage</Label>
													<Select value={careerStageFilter} onValueChange={setCareerStageFilter}>
														<SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 transition-colors hover:bg-slate-50">
															<SelectValue placeholder="Any Stage" />
														</SelectTrigger>
														<SelectContent className="rounded-xl border-slate-100 shadow-xl">
															<SelectItem value="all">Any Stage</SelectItem>
															{careerStageOptions.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Experience Level</Label>
													<Select value={experienceLevelFilter} onValueChange={setExperienceLevelFilter}>
														<SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50/50 transition-colors hover:bg-slate-50">
															<SelectValue placeholder="Years of Expertise" />
														</SelectTrigger>
														<SelectContent className="rounded-xl border-slate-100 shadow-xl">
															<SelectItem value="all">Any Experience</SelectItem>
															{experienceLevelOptions.map((option) => (
																<SelectItem key={option} value={option}>
																	{option}
																</SelectItem>
															))}
														</SelectContent>
													</Select>
												</div>

												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Country</Label>
													<div className="h-12 [&>button]:h-full [&>button]:rounded-xl [&>button]:border-slate-100 [&>button]:bg-slate-50/50">
														<CountrySearch value={countryFilter} onValueChange={handleCountryChange} placeholder="Select Country" />
													</div>
												</div>

												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
														Detailed Location
													</Label>
													<div className="h-12 [&>button]:h-full [&>button]:rounded-xl [&>button]:border-slate-100 [&>button]:bg-slate-50/50">
														<LocationSearch
															country={selectedCountryCode}
															value={locationFilter}
															onValueChange={setLocationFilter}
															placeholder={selectedCountryCode ? 'Select city...' : 'Select country first...'}
															disabled={!selectedCountryCode}
														/>
													</div>
												</div>

												<div className="space-y-3">
													<Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Languages</Label>
													<MultiSelectPopover
														options={languageOptions}
														value={languageFilter}
														onChange={setLanguageFilter}
														placeholder="Select Languages"
														className="h-12 rounded-xl border-slate-100 bg-slate-50/50"
													/>
												</div>
											</div>
										</div>

										{/* Sidebar Footer */}
										<div className="flex items-center gap-4 border-t border-slate-50 bg-slate-50/30 p-8">
											<Button
												variant="ghost"
												onClick={clearFilters}
												className="flex h-12 items-center gap-2 rounded-xl px-6 font-bold text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
												disabled={activeFilterCount === 0 && query.length === 0}
											>
												<RotateCcw size={14} />
												Reset
											</Button>
											<Button
												onClick={() => {
													setIsSidebarOpen(false);
													fetchInitialMentorships();
												}}
												className={cn(
													'h-12 flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-lg transition-all',
													appConfig.isRebusAIMentors
														? 'bg-primaryColor-800 hover:bg-primaryColor-700'
														: 'bg-slate-900 hover:bg-black'
												)}
											>
												Show Results
											</Button>
										</div>
									</div>
								</SheetContent>
							</Sheet>

							{(activeFilterCount > 0 || query.length > 0) && (
								<Button
									variant="outline"
									onClick={clearFilters}
									className={cn(
										'h-full font-bold text-white hover:text-white',
										appConfig.isRebusAIMentors
											? 'bg-primaryColor-800 hover:bg-primaryColor-700'
											: 'bg-slate-900 hover:bg-slate-800'
									)}
								>
									Clear Filters
								</Button>
							)}
						</div>
					</div>
				</div>
			</div>

			{/* Results Section */}
			<div className="container-modern pb-20">
				<AnimatePresence mode="wait">
					{loading ? (
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
						>
							{[...Array(8)].map((_, i) => (
								<div key={i} className="h-[450px] animate-pulse rounded-[2rem] border border-slate-100 bg-white shadow-sm" />
							))}
						</motion.div>
					) : (mentorships || []).length === 0 ? (
						<motion.div
							initial={{ opacity: 0, y: 20 }}
							animate={{ opacity: 1, y: 0 }}
							className="flex flex-col items-center justify-center space-y-6 rounded-[3rem] border border-dashed border-slate-200 bg-white p-20 text-center"
						>
							<div className="rounded-full bg-slate-50 p-6 text-slate-300">
								{activeFilterCount > 0 || query.length > 0 ? (
									<Search size={48} strokeWidth={1.5} />
								) : (
									<RotateCcw size={48} strokeWidth={1.5} />
								)}
							</div>
							<div className="space-y-2">
								<h3 className="text-2xl font-black tracking-tight text-slate-900">No Mentors Found</h3>
								{(activeFilterCount > 0 || query.length > 0) && (
									<>
										<p className="mx-auto max-w-xs font-medium text-slate-500">
											Try adjusting your filters or search query to find more professionals.
										</p>
										<Button onClick={clearFilters} variant="link" className="font-bold text-primaryColor-600">
											Clear all filters
										</Button>
									</>
								)}
							</div>
						</motion.div>
					) : (
						<>
							<motion.div
								initial={{ opacity: 0 }}
								animate={{ opacity: 1 }}
								className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
							>
								{(mentorships || []).map((m) => {
									const actualUid = userIdToUidMap[m.userId];
									const isBookSessionDisabled = actualUid ? allPendingSessions?.some((s) => s.mentorId === actualUid) : false;
									return (
										<MentorshipCard
											key={m.userId}
											mentorship={m}
											MentorId={actualUid}
											bookSessionDisabled={isBookSessionDisabled}
										/>
									);
								})}
							</motion.div>

							{/* Loading More Indicator */}
							{loadingMore && (
								<div className="mt-12 text-center">
									<div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
										{[...Array(4)].map((_, i) => (
											<div key={i} className="h-[450px] animate-pulse rounded-[2rem] border border-slate-100 bg-white shadow-sm" />
										))}
									</div>
								</div>
							)}

							{/* No More Data */}
							{!hasMore && !!mentorships?.length && (
								<div className="py-8 text-center text-sm text-gray-500">No more mentors to load</div>
							)}
						</>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
};

export default MentorshipPage;
