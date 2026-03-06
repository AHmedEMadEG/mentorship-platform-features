'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { getStatusBadge } from '@/lib/helpers';
import { Mentorship } from '@/types';
import { motion } from 'framer-motion';
import {
	Award,
	Briefcase,
	Check,
	Clock,
	Edit,
	Globe,
	HeartCrackIcon,
	HeartIcon,
	MapPin,
	MessageSquare,
	Sparkles,
	Star,
	Trash2,
	X,
} from 'lucide-react';
import Image from 'next/image';

interface MentorshipCardProps {
	mentorship: Mentorship;
	isRequest?: boolean;
	onEdit?: (mentorship: Mentorship) => void;
	onToggleStatus: (mentorship: Mentorship) => void;
	onDelete: (mentorship: Mentorship) => void;
	onApprove?: (mentorship: Mentorship) => void;
	onReject?: (mentorship: Mentorship) => void;
	showActions?: boolean;
}

export default function MentorshipCard({
	mentorship,
	isRequest = false,
	onEdit,
	onToggleStatus,
	onDelete,
	onApprove,
	onReject,
	showActions = true,
}: MentorshipCardProps) {
	const badge = getStatusBadge(mentorship.status);

	return (
		<motion.div layout className="group relative">
			<Card className="overflow-hidden rounded-[2.5rem] border-none bg-white shadow-xl shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2">
				{/* Header Image Area */}
				<div className="relative h-44 w-full">
					<div className="absolute inset-0 overflow-hidden rounded-t-[2.5rem]">
						<Image
							src={mentorship.coverImage || '/mentor-cover-placeholder.png'}
							alt="Cover"
							fill
							className="object-cover transition-transform duration-700 group-hover:scale-110"
						/>
						<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
					</div>

					{/* Status Badge */}
					<div className="absolute left-6 top-6">
						<Badge
							className={`${badge.className} rounded-full border-none px-4 py-1.5 text-[10px] font-black uppercase tracking-widest shadow-lg backdrop-blur-md`}
						>
							{badge.label}
						</Badge>
					</div>

					<div className="absolute -bottom-10 left-8">
						<div className="relative h-24 w-24 overflow-hidden rounded-[2rem] border-4 border-white bg-slate-100 shadow-2xl transition-transform duration-500 group-hover:scale-105">
							<Image
								src={mentorship.profileImage || '/mentor-placeholder.png'}
								alt="Profile"
								fill
								className="object-cover"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.src = '/mentor-placeholder.png';
								}}
							/>
						</div>
					</div>
				</div>

				<CardContent className="space-y-8 px-8 pb-8 pt-14">
					{/* Name & Company */}
					<div className="space-y-1">
						<h3 className="text-3xl font-black leading-none tracking-tight text-slate-900 transition-colors group-hover:text-primaryColor-600">
							{mentorship.name}
						</h3>
						<p className="text-sm font-bold uppercase tracking-widest text-slate-400">
							{mentorship.company || 'Independent'}
						</p>
					</div>

					{/* Identity & Bio */}
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<span className="text-xl font-black tracking-tight text-slate-900">{mentorship.title}</span>
							<div className="flex items-center gap-4 text-slate-400">
								<div className="flex items-center gap-1.5">
									<Star size={16} className="text-primaryColor-500" />
									<span className="text-sm font-black text-slate-700">{mentorship.reviews?.length || 0}</span>
								</div>
								<div className="flex items-center gap-1.5">
									<MessageSquare size={16} className="text-secondaryColor-500" />
									<span className="text-sm font-black text-slate-700">{mentorship.messages?.length || 0}</span>
								</div>
							</div>
						</div>
						<p className="line-clamp-2 text-sm font-medium italic leading-relaxed text-slate-500">"{mentorship.bio}"</p>
					</div>

					{/* Technical Specs Grid */}
					<div className="grid grid-cols-2 gap-x-6 gap-y-4">
						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-50 p-2 text-slate-400">
								<Briefcase size={14} />
							</div>
							<div className="flex flex-col">
								<span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
									Industry
								</span>
								<span className="truncate text-xs font-bold text-slate-700">{mentorship.industry || 'General'}</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-50 p-2 text-slate-400">
								<Award size={14} />
							</div>
							<div className="flex flex-col">
								<span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
									Experience
								</span>
								<span className="text-xs font-bold text-slate-700">{mentorship.experience} Years</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-50 p-2 text-slate-400">
								<MapPin size={14} />
							</div>
							<div className="flex flex-col">
								<span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
									Global Base
								</span>
								<span className="truncate text-xs font-bold text-slate-700">{mentorship.country}</span>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<div className="rounded-xl bg-slate-50 p-2 text-slate-400">
								<Clock size={14} />
							</div>
							<div className="flex flex-col">
								<span className="mb-1 text-[10px] font-black uppercase leading-none tracking-widest text-slate-400">
									Availability
								</span>
								<span className="truncate text-xs font-bold text-slate-700">{mentorship.availability}</span>
							</div>
						</div>
					</div>

					{/* Social & Contact */}
					<div className="flex items-center justify-between border-t border-slate-50 pt-6">
						<div className="flex items-center gap-2">
							{mentorship.linkedin && <SocialIcon href={mentorship.linkedin} icon={Globe} />}
							{mentorship.twitter && <SocialIcon href={mentorship.twitter} icon={Sparkles} />}
						</div>

						{showActions && (
							<div className="flex items-center gap-2">
								{!isRequest ? (
									<>
										{onEdit && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onEdit(mentorship)}
												className="h-10 rounded-xl px-4 text-xs font-bold text-slate-500 hover:text-slate-900"
											>
												<Edit size={14} className="mr-2" /> Edit
											</Button>
										)}
										{mentorship.status !== 'deactivated' && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onToggleStatus(mentorship)}
												className="h-10 rounded-xl px-4 text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-500"
											>
												<HeartCrackIcon size={14} className="mr-2" /> Deactivate
											</Button>
										)}
										{mentorship.status !== 'approved' && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onToggleStatus(mentorship)}
												className="h-10 rounded-xl px-4 text-xs font-bold text-green-400 hover:bg-green-50 hover:text-green-500"
											>
												<HeartIcon size={14} className="mr-2" /> Activate
											</Button>
										)}
										{onDelete && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onDelete(mentorship)}
												className="h-10 rounded-xl px-4 text-xs font-bold text-red-400 hover:bg-red-50 hover:text-red-500"
											>
												<Trash2 size={14} className="mr-2" /> Delete
											</Button>
										)}
									</>
								) : (
									<>
										{onApprove && (
											<Button
												size="sm"
												className="h-10 rounded-xl bg-green-500 px-5 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-green-200 hover:bg-green-600"
												onClick={() => onApprove(mentorship)}
											>
												<Check size={14} className="mr-2" /> Approve
											</Button>
										)}
										{onReject && (
											<Button
												size="sm"
												variant="ghost"
												onClick={() => onReject(mentorship)}
												className="h-10 rounded-xl px-5 text-[10px] font-black uppercase tracking-widest text-red-400 hover:bg-red-50 hover:text-red-500"
											>
												<X size={14} className="mr-2" /> Reject
											</Button>
										)}
									</>
								)}
							</div>
						)}
					</div>

					{/* Status Warnings */}
					{mentorship.status === 'rejected' && mentorship.rejectionMessage && (
						<div className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 p-4">
							<X size={16} className="mt-1 shrink-0 text-red-500" />
							<p className="text-[13px] font-medium leading-relaxed text-red-600">
								<span className="mb-0.5 block font-black uppercase tracking-tighter">Rejection Reason</span>
								{mentorship.rejectionMessage}
							</p>
						</div>
					)}
				</CardContent>
			</Card>
		</motion.div>
	);
}

function SocialIcon({ href, icon: Icon }: any) {
	return (
		<a
			href={href}
			target="_blank"
			rel="noopener noreferrer"
			className="rounded-xl border border-transparent bg-slate-50 p-2.5 text-slate-400 transition-all hover:border-primaryColor-100 hover:bg-primaryColor-50 hover:text-primaryColor-600"
		>
			<Icon size={16} />
		</a>
	);
}
