'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/contexts/auth-context';
import { mentorshipService } from '@/firebase/mentorshipService';
import { getUserById, getUserByUserId } from '@/firebase/userServices';
import { toast } from '@/hooks/use-toast';
import { useMimicProfileBySlug } from '@/queries/useMimicProfiles';
import { Mentorship, Review, User } from '@/types';
import axios from 'axios';
import { AlertCircle, Award, MessageSquare, Send, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import BackToHome from './BackToHome';
import { ProfileHeader } from './ProfileHeader';
import { ReviewCard } from './ReviewCard';
import { StatusBanner } from './StatusBanner';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Textarea } from './ui/textarea';

interface MentorshipProfileProps {
	id?: string;
	hasBackToHome?: boolean;
	isMimic?: boolean;
}

const MentorshipProfile = ({ id, hasBackToHome = false, isMimic = false }: MentorshipProfileProps) => {
	const router = useRouter();
	const { user } = useAuth();

	// State
	const [mentorShipData, setMentorShipData] = useState<Mentorship | null>(null);
	const [loading, setLoading] = useState(false);
	const [creators, setCreators] = useState<Record<string, User | null>>({});
	const [visibleReviews, setVisibleReviews] = useState(6);
	const [reviews, setReviews] = useState<Review[] | null>(null);

	// Dialog state
	const [isChatOpen, setIsChatOpen] = useState(false);
	const [isReviewOpen, setIsReviewOpen] = useState(false);
	const [loadingSend, setLoadingSend] = useState(false);
	const [loadingReview, setLoadingReview] = useState(false);
	const [message, setMessage] = useState('');
	const [reviewComment, setReviewComment] = useState('');
	const [reviewRating, setReviewRating] = useState<string>('');
	const [MentorId, setMentorId] = useState('');
	const [mentorData, setMentorData] = useState<User | null>(null);

	const { data: mimicProfile, isLoading: mimicProfileLoading } = useMimicProfileBySlug(id || '', isMimic);

	const currentUserId = user?.userId;
	const isSameUser = id === currentUserId;

	// Fetch data
	const fetchData = async () => {
		try {
			const targetId = id;
			if (!targetId || isMimic) return;

			setLoading(true);

			const res = await getUserByUserId(targetId);
			setMentorData(res);
			setMentorId(res?.id || '');

			const data = await mentorshipService.getMentorshipsByUserId(
				targetId,
				!isSameUser ? true : undefined,
				!isSameUser ? 'approved' : undefined
			);

			if (data?.[0]) {
				const mentorship = data[0] as Mentorship;
				setMentorShipData(mentorship);
				const rev = [...(mentorship.reviews || [])].reverse();
				setReviews(rev);
			}
		} catch (err) {
			console.error('Error loading mentorship:', err);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchData();
	}, [id, currentUserId, isSameUser]);

	// Fetch review creators
	useEffect(() => {
		async function fetchCreators() {
			if (!mentorShipData?.reviews || isMimic) return;
			const creatorMap: Record<string, User | null> = {};
			for (const msg of mentorShipData.reviews) {
				if (msg.reviewerId && !creatorMap[msg.reviewerId]) {
					creatorMap[msg.reviewerId] = await getUserById(msg.reviewerId);
				}
			}
			setCreators(creatorMap);
		}
		fetchCreators();
	}, [mentorShipData]);

	// Track views
	useEffect(() => {
		if (!isSameUser && mentorShipData?.id && !isMimic) {
			mentorshipService.updateMentorship(mentorShipData.id, {
				views: (mentorShipData.views || 0) + 1,
			});
		}
	}, [isSameUser, mentorShipData?.id]);

	// Handlers
	const handleMessageSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		try {
			setLoadingSend(true);
			if (mentorShipData?.id && user?.uid) {
				await mentorshipService.sendMessage(mentorShipData.id, user.uid, message.trim());
				await fetchData();
				// Send email notification after successful message creation
				try {
					await axios.post('/api/send-message', {
						name: user.displayName,
						email: user.email,
						receiver: mentorData?.email || mentorShipData.userId,
						mentor_dashboard_url: `${appConfig.mainUrl}/merchant/sessions`,
						mentorName: mentorShipData.name,
						userName: user.displayName,
						userEmail: user.email,
						message: message.trim(),
					});
				} catch (error) {
					console.error('Failed to send message email notification:', error);
				}

				setIsChatOpen(false);
				setMessage('');
				toast.success('Success', 'Message sent successfully!');
			}
		} catch (error) {
			console.error('Error sending message:', error);
			toast.error('Error', 'Failed to send message.');
		} finally {
			setLoadingSend(false);
		}
	};

	const handleReviewSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!reviewRating || !reviewComment.trim()) return;

		try {
			setLoadingReview(true);
			if (mentorShipData?.id && user?.uid) {
				await mentorshipService.sendReview(mentorShipData.id, user.uid, Number(reviewRating), reviewComment.trim());
				await fetchData();
				setReviewRating('');
				setReviewComment('');
				setIsReviewOpen(false);
				toast.success('Success', 'Review submitted successfully!');
			}
		} catch (error) {
			console.error('Error adding review:', error);
			toast.error('Error', 'Failed to submit review.');
		} finally {
			setLoadingReview(false);
		}
	};

	const hasSentMessage = mentorShipData?.messages?.some((msg) => msg.senderId === user?.uid) ?? false;
	const hasPendingMessage =
		mentorShipData?.messages?.some((msg) => msg.senderId === user?.uid && msg.status === 'pending') ?? false;

	const averageRating = reviews?.length
		? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
		: '0.0';
	const showLoadMore = reviews && visibleReviews < reviews.length;

	// Loading state
	if (loading || mimicProfileLoading) {
		return (
			<div className="flex min-h-screen items-center justify-center">
				<div className="flex flex-col items-center gap-4">
					<div className="h-12 w-12 animate-spin rounded-full border-4 border-neutral-200 border-t-blue-600" />
					<p className="text-sm font-medium text-neutral-500">Loading profile...</p>
				</div>
			</div>
		);
	}

	// Not found state
	if (!isMimic && !mentorShipData) {
		return (
			<div className="min-h-screen bg-neutral-50 px-6 py-20">
				<div className="mx-auto max-w-2xl space-y-6 text-center">
					<div className="flex justify-center">
						<div className="rounded-full bg-neutral-100 p-6">
							<AlertCircle className="h-12 w-12 text-neutral-400" />
						</div>
					</div>
					<h1 className="text-3xl font-bold text-neutral-900">Profile Not Found</h1>
					<p className="text-lg text-neutral-600">We couldn't find an active mentorship profile for this account.</p>
					<div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
						<BackToHome pathName="Browse Mentors" path="/mentors/browse" />
						{isSameUser && (
							<Link href="/merchant/mentorship-setup">
								<Button className="gap-2 rounded-xl">
									<Award size={18} />
									Setup Mentorship Profile
								</Button>
							</Link>
						)}
					</div>
				</div>
			</div>
		);
	}

	if (isMimic && !mimicProfile) {
		return (
			<div className="min-h-screen bg-neutral-50 px-6 py-20">
				<div className="mx-auto max-w-2xl space-y-6 text-center">
					<div className="flex justify-center">
						<div className="rounded-full bg-neutral-100 p-6">
							<AlertCircle className="h-12 w-12 text-neutral-400" />
						</div>
					</div>
					<h1 className="text-3xl font-bold text-neutral-900">
						This promotional profile could not be found or has been removed.
					</h1>
				</div>
			</div>
		);
	}

	// Main render
	return (
		<div className="min-h-screen bg-neutral-50">
			<div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
				{/* Back button */}
				{hasBackToHome && (
					<div className="mb-6">
						<BackToHome pathName="Browse Mentors" path="/mentors/browse" />
					</div>
				)}

				{/* Status Banner (if applicable) */}
				{isSameUser && mentorShipData?.status !== 'approved' && (
					<div className="mb-6">
						<StatusBanner status={mentorShipData?.status || ''} rejectionMessage={mentorShipData?.rejectionMessage || ''} />
					</div>
				)}

				{/* Main Content */}
				<div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
					{/* Left Sidebar - Profile Header */}
					<div className="lg:col-span-3">
						<ProfileHeader
							mentorShipData={isMimic ? mimicProfile! : mentorShipData!}
							averageRating={averageRating}
							reviewCount={reviews?.length || 0}
							isSameUser={isSameUser}
							onEditClick={() => router.push('/merchant/mentorship/edit-mentorship')}
							onBookClick={() => setIsChatOpen(true)}
							hasSentMessage={hasSentMessage}
							hasPendingMessage={hasPendingMessage}
							user={user}
							MentorId={MentorId}
							isMimic={isMimic}
						/>
					</div>

					{/* Main Content Area */}
					<div className="lg:col-span-3">
						<Tabs defaultValue="about" className="w-full">
							<TabsList className="mb-6 inline-flex rounded-xl bg-neutral-100 p-1">
								<TabsTrigger
									value="about"
									className="rounded-lg px-6 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
								>
									About
								</TabsTrigger>
								<TabsTrigger
									value="reviews"
									className="rounded-lg px-6 py-2 text-sm font-semibold data-[state=active]:bg-white data-[state=active]:shadow-sm"
								>
									Reviews ({reviews?.length || 0})
								</TabsTrigger>
							</TabsList>

							{/* About Tab */}
							<TabsContent value="about" className="mt-0">
								<div className="rounded-2xl border border-neutral-200 bg-white p-6 sm:p-8">
									<h2 className="mb-6 text-2xl font-bold text-neutral-900">About Me</h2>
									<p className="whitespace-pre-wrap leading-relaxed text-neutral-700">
										{isMimic ? mimicProfile?.bio : mentorShipData?.bio}
									</p>
								</div>
							</TabsContent>

							{/* Reviews Tab */}
							<TabsContent value="reviews" className="mt-0 space-y-6">
								{/* Review Header */}
								<div className="flex flex-col items-start justify-between gap-4 rounded-2xl border border-neutral-200 bg-white p-6 sm:flex-row sm:items-center">
									<div>
										<h2 className="mb-1 text-2xl font-bold text-neutral-900">Community Reviews</h2>
										<p className="text-neutral-600">See what others have experienced</p>
									</div>
									{!isSameUser && user && (
										<Button onClick={() => setIsReviewOpen(true)} className="shrink-0 gap-2 rounded-xl">
											<Star size={18} />
											Write Review
										</Button>
									)}
								</div>

								{/* Reviews Grid */}
								{reviews?.length ? (
									<>
										<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
											{reviews.slice(0, visibleReviews).map((review, i) => (
												<ReviewCard key={i} review={review} creator={creators[review.reviewerId]} />
											))}
										</div>

										{showLoadMore && (
											<div className="flex justify-center pt-4">
												<Button onClick={() => setVisibleReviews((prev) => prev + 6)} variant="outline" className="rounded-xl">
													Load More Reviews
												</Button>
											</div>
										)}
									</>
								) : (
									<div className="rounded-2xl border-2 border-dashed border-neutral-200 bg-white p-12 text-center">
										<div className="mb-4 flex justify-center">
											<div className="rounded-full bg-neutral-100 p-4">
												<MessageSquare className="h-8 w-8 text-neutral-400" />
											</div>
										</div>
										<p className="mb-2 text-lg font-semibold text-neutral-900">No reviews yet</p>
										<p className="text-neutral-600">
											Be the first to share your experience with {isMimic ? mimicProfile?.name : mentorShipData?.name}
										</p>
									</div>
								)}
							</TabsContent>
						</Tabs>
					</div>
				</div>
			</div>

			{/* Message Dialog */}
			<Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
				<DialogContent className="gap-0 p-0 sm:max-w-[500px]">
					<DialogHeader className="border-b px-6 pb-4 pt-6">
						<DialogTitle className="text-xl font-bold">Send Mentorship Request</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleMessageSubmit} className="space-y-4 p-6">
						<div className="space-y-2">
							<label className="text-sm font-medium text-neutral-700">Your Message</label>
							<Textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder={`Introduce yourself to ${mentorShipData?.name}. Share your background, goals, and what you hope to learn...`}
								className="min-h-[180px] resize-none rounded-xl"
								required
							/>
							<p className="text-xs text-neutral-500">Be specific about what you're looking for in this mentorship</p>
						</div>
						<div className="flex gap-3 pt-2">
							<Button type="button" variant="outline" onClick={() => setIsChatOpen(false)} className="flex-1 rounded-xl">
								Cancel
							</Button>
							<Button type="submit" disabled={!message.trim() || loadingSend} className="flex-1 gap-2 rounded-xl">
								{loadingSend ? (
									<>
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
										Sending...
									</>
								) : (
									<>
										<Send size={18} />
										Send Request
									</>
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Review Dialog */}
			<Dialog open={isReviewOpen} onOpenChange={setIsReviewOpen}>
				<DialogContent className="gap-0 p-0 sm:max-w-[500px]">
					<DialogHeader className="border-b px-6 pb-4 pt-6">
						<DialogTitle className="text-xl font-bold">Write Your Review</DialogTitle>
					</DialogHeader>
					<form onSubmit={handleReviewSubmit} className="space-y-6 p-6">
						{/* Rating */}
						<div className="space-y-3">
							<label className="text-sm font-medium text-neutral-700">Your Rating</label>
							<div className="flex gap-2">
								{[1, 2, 3, 4, 5].map((star) => (
									<button
										key={star}
										type="button"
										onClick={() => setReviewRating(star.toString())}
										className="transition-transform hover:scale-110"
									>
										<Star
											size={32}
											className={
												Number(reviewRating) >= star ? 'fill-amber-400 text-amber-400' : 'text-neutral-300 hover:text-neutral-400'
											}
										/>
									</button>
								))}
							</div>
						</div>

						{/* Comment */}
						<div className="space-y-2">
							<label className="text-sm font-medium text-neutral-700">Your Experience</label>
							<Textarea
								value={reviewComment}
								onChange={(e) => setReviewComment(e.target.value)}
								placeholder="Share your experience with this mentorship..."
								className="min-h-[140px] resize-none rounded-xl"
								required
							/>
						</div>

						<div className="flex gap-3">
							<Button type="button" variant="outline" onClick={() => setIsReviewOpen(false)} className="flex-1 rounded-xl">
								Cancel
							</Button>
							<Button
								type="submit"
								disabled={!reviewRating || !reviewComment.trim() || loadingReview}
								className="flex-1 gap-2 rounded-xl"
							>
								{loadingReview ? (
									<>
										<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
										Submitting...
									</>
								) : (
									<>
										<Star size={18} />
										Submit Review
									</>
								)}
							</Button>
						</div>
					</form>
				</DialogContent>
			</Dialog>

			{/* Floating button for mimic profiles */}
			{isMimic && !user && (
				<div className="fixed bottom-8 right-8 z-50">
					<Button
						onClick={() => router.push(`/getStarted?name=${encodeURIComponent(mimicProfile?.name || '')}`)}
						className="animate-bounce-gentle rounded-full bg-primaryColor-600 px-4 py-2 text-white shadow-2xl transition-all duration-300 ease-in-out hover:scale-110 hover:bg-primaryColor-700 active:scale-100"
						aria-label="Create your profile"
					>
						<p className="font-semibold">Create Profile Now</p>
					</Button>
				</div>
			)}
		</div>
	);
};

export default MentorshipProfile;
