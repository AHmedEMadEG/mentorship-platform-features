'use client';

import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { mentorshipService } from '@/firebase/mentorshipService';
import { useGetUsersByIds } from '@/firebase/userServices';
import { useToast } from '@/hooks/use-toast';
import {
	useCreateConversationWithDefaultMessage,
	useGetConversationByParticipantIds,
	useSendMessage,
} from '@/queries/useChat';
import { MessageRequest, User } from '@/types';
import { motion } from 'framer-motion';
import { Clock, Inbox, Mail, MessageSquare } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const Page = () => {
	const { user } = useAuth();
	const [messages, setMessages] = useState<MessageRequest[]>([]);
	const [mentorshipId, setMentorshipId] = useState('');
	const [loading, setLoading] = useState(true);
	const router = useRouter();
	const toast = useToast();

	const [acceptModalOpen, setAcceptModalOpen] = useState(false);
	const [requestToAccept, setRequestToAccept] = useState<MessageRequest | null>(null);

	const { data: users } = useGetUsersByIds(messages.map((msg) => msg.senderId));

	const { mutateAsync: createConversationWithDefaultMessage, isPending: isCreating } =
		useCreateConversationWithDefaultMessage();
	const { data: conversation } = useGetConversationByParticipantIds(user?.id || '', requestToAccept?.senderId || '');
	const { mutateAsync: sendMessageMutation, isPending: isSending } = useSendMessage();

	const creatorMap = useMemo(() => {
		if (!users) return {};
		const map: Record<string, User | null> = {};
		users.forEach((user) => {
			map[user.id] = user;
		});
		return map;
	}, [users]);

	// Fetch messages
	useEffect(() => {
		const fetchMessages = async () => {
			if (!user?.uid) return;

			try {
				const data = await mentorshipService.getMentorshipsByUserId(user?.userId!);
				if (data.length > 0) {
					setMessages(data[0].messages.filter((msg) => msg.status === 'pending'));
					setMentorshipId(data[0].id);
				}
			} catch (err) {
				console.error('Error loading mentorship:', err);
			} finally {
				setLoading(false);
			}
		};
		fetchMessages();
	}, [user?.uid]);

	const handleAcceptRequest = async () => {
		try {
			if (!requestToAccept) return;
			let conversationData;
			if (conversation) {
				conversationData = conversation;
				await sendMessageMutation({
					conversationId: conversation.id,
					senderId: requestToAccept.senderId,
					receiverId: user?.id!,
					content: requestToAccept.content,
					incrementSenderUnreadCount: true,
					createdAt: requestToAccept.createdAt,
				});
			} else {
				conversationData = await createConversationWithDefaultMessage({
					currentUserId: user?.id!,
					otherUserId: requestToAccept.senderId,
					content: requestToAccept.content,
					senderId: requestToAccept.senderId,
					incrementSenderUnreadCount: true,
					createdAt: requestToAccept.createdAt,
				});
			}

			await mentorshipService.updateMentorship(mentorshipId, {
				messages: messages.map((msg) => (msg.senderId === requestToAccept.senderId ? { ...msg, status: 'accepted' } : msg)),
			});

			router.push(`/messages?conversationId=${conversationData.id}`);
		} catch (error: any) {
			toast.error(error.message);
		}
	};

	const containerVariants = {
		hidden: { opacity: 0 },
		visible: {
			opacity: 1,
			transition: {
				staggerChildren: 0.1,
			},
		},
	};

	const itemVariants = {
		hidden: { y: 20, opacity: 0 },
		visible: { y: 0, opacity: 1 },
	};

	return (
		<div className="min-h-screen pb-20">
			{/* Header Section */}
			<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-12">
				<div className="flex flex-col justify-between gap-6 rounded-[2.5rem] border border-slate-100 bg-white p-8 shadow-sm md:flex-row md:items-end">
					<div className="space-y-2">
						<div className="mb-2 flex items-center gap-3 text-primaryColor-600">
							<div className="rounded-xl bg-primaryColor-50 p-2">
								<Inbox size={24} />
							</div>
							<span className="text-xs font-bold uppercase tracking-widest">Management Hub</span>
						</div>
						<h1 className="text-4xl font-black tracking-tight text-slate-900">Message Requests</h1>
						<p className="max-w-lg font-medium text-slate-500">
							Review and manage incoming mentorship inquiries from potential mentees.
						</p>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50 px-6 py-4">
							<div className="text-right">
								<p className="text-xs font-bold uppercase tracking-tighter text-slate-400">Total Requests</p>
								<p className="text-2xl font-black text-slate-900">{messages?.length || 0}</p>
							</div>
							<div className="mx-2 h-10 w-px bg-slate-200" />
							<div className="rounded-xl bg-primaryColor-600 p-3 text-white shadow-lg shadow-primaryColor-100">
								<MessageSquare size={20} />
							</div>
						</div>
					</div>
				</div>
			</motion.div>

			{loading ? (
				<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
					{[...Array(6)].map((_, i) => (
						<div key={i} className="animate-pulse space-y-6 rounded-[2rem] border border-slate-100 bg-white p-8">
							<div className="flex items-center gap-4">
								<div className="h-12 w-12 rounded-full bg-slate-100" />
								<div className="flex-1 space-y-2">
									<div className="h-4 w-24 rounded-full bg-slate-100" />
									<div className="h-3 w-32 rounded-full bg-slate-100" />
								</div>
							</div>
							<div className="space-y-3">
								<div className="h-3 w-full rounded-full bg-slate-100" />
								<div className="h-3 w-full rounded-full bg-slate-100" />
								<div className="h-3 w-2/3 rounded-full bg-slate-100" />
							</div>
							<div className="flex justify-between pt-4">
								<div className="h-3 w-20 rounded-full bg-slate-100" />
								<div className="h-3 w-12 rounded-full bg-slate-100" />
							</div>
						</div>
					))}
				</div>
			) : messages.length > 0 ? (
				<motion.div
					variants={containerVariants}
					initial="hidden"
					animate="visible"
					className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
				>
					{messages.map((message, i) => {
						const creator = creatorMap[message.senderId];
						return (
							<motion.div key={i} variants={itemVariants}>
								<Card className="group h-full overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2">
									<CardContent className="flex h-full flex-col p-0">
										{/* Header: User Info */}
										<div className="flex items-center gap-4 p-8 pb-4">
											<div className="relative">
												<Avatar className="h-16 w-16 border-2 border-slate-50 shadow-md">
													<AvatarImage
														src={creator?.photoURL || '/mentor-placeholder.png'}
														alt={creator?.displayName || 'Prospective Mentee'}
														className="object-cover"
													/>
												</Avatar>
												<div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full border-4 border-white bg-green-500" />
											</div>
											<div className="min-w-0 flex-1">
												<h3 className="truncate text-lg font-black text-slate-900">
													{creator?.displayName || 'Prospective Mentee'}
												</h3>
												<div className="flex items-center gap-1 text-slate-400 transition-colors group-hover:text-primaryColor-600">
													<Mail size={12} />
													<span className="truncate text-xs font-bold">{creator?.email || 'Contact details secured'}</span>
												</div>
											</div>
										</div>

										{/* Message Body */}
										<div className="flex-1 px-8">
											<div className="group-hover:bg-primaryColor-50/30 h-full rounded-[2rem] border border-slate-100/50 bg-slate-50/80 p-6 transition-colors">
												<p className="line-clamp-6 text-sm font-medium italic leading-relaxed text-slate-600">
													"{message.content}"
												</p>
											</div>
										</div>

										{/* Footer: Metadata & Actions */}
										<div className="mt-auto flex items-center justify-between p-8 pt-6">
											<div className="flex items-center gap-2 text-slate-400">
												<Clock size={14} className="transition-colors group-hover:text-primaryColor-600" />
												<span className="text-[10px] font-black uppercase tracking-widest">
													{message.createdAt
														? message.createdAt instanceof Date
															? message.createdAt.toLocaleDateString()
															: message.createdAt.toDate().toLocaleDateString()
														: 'New Request'}
												</span>
											</div>
											<Button
												className="rounded-full bg-primaryColor-600 px-6 py-3 font-bold text-white shadow-lg shadow-primaryColor-100 transition-all duration-300 hover:bg-primaryColor-700 hover:shadow-xl hover:shadow-primaryColor-200"
												onClick={() => {
													setRequestToAccept(message);
													setAcceptModalOpen(true);
												}}
												disabled={isCreating || isSending}
											>
												{isCreating || isSending ? 'Accepting...' : 'Accept Request'}
											</Button>
										</div>
									</CardContent>
								</Card>
							</motion.div>
						);
					})}
				</motion.div>
			) : (
				<motion.div
					initial={{ opacity: 0, scale: 0.9 }}
					animate={{ opacity: 1, scale: 1 }}
					className="mx-auto max-w-2xl rounded-[4rem] border-2 border-dashed border-slate-200 bg-white py-32 text-center"
				>
					<div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-slate-50">
						<Inbox size={40} className="text-slate-300" />
					</div>
					<h2 className="mb-2 text-3xl font-black text-slate-900">Inbox Empty</h2>
					<p className="px-8 font-medium leading-relaxed text-slate-400">
						Your mentorship profile is active and waiting for its first artifact. Once users send you requests, they will
						appear here in chronological order.
					</p>
					<button
						onClick={() => router.push('/merchant/mentorship/mentorship-profile')}
						className={
							appConfig.isRebusAIMentors
								? 'mt-10 rounded-2xl bg-primaryColor-800 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-primaryColor-700'
								: 'mt-10 rounded-2xl bg-slate-900 px-10 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-slate-200 transition-all hover:bg-black'
						}
					>
						Update Mentorship
					</button>
				</motion.div>
			)}

			<Dialog open={acceptModalOpen} onOpenChange={setAcceptModalOpen}>
				<DialogContent className="sm:max-w-[425px]">
					<DialogHeader>
						<DialogTitle>Accept Request</DialogTitle>
						<DialogDescription>Are you sure you want to accept this request?</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setAcceptModalOpen(false);
								setRequestToAccept(null);
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={() => {
								handleAcceptRequest();
								setRequestToAccept(null);
							}}
							disabled={isCreating || isSending}
						>
							{isCreating || isSending ? 'Accepting...' : 'Accept'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
};

export default Page;
