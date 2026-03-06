import { Review, User } from '@/types';
import { motion } from 'framer-motion';
import { Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';

export const ReviewCard = ({ review, creator }: { review: Review; creator?: User | null }) => (
	<motion.div
		initial={{ opacity: 0, y: 20 }}
		whileInView={{ opacity: 1, y: 0 }}
		viewport={{ once: true }}
		className="rounded-2xl border border-neutral-200 bg-white p-6 transition-shadow hover:shadow-md"
	>
		{/* Rating */}
		<div className="mb-4 flex gap-1">
			{Array.from({ length: 5 }).map((_, idx) => (
				<Star key={idx} size={16} className={idx < review.rating ? 'fill-amber-400 text-amber-400' : 'text-neutral-200'} />
			))}
		</div>

		{/* Comment */}
		<p className="mb-6 leading-relaxed text-neutral-700">"{review.comment}"</p>

		{/* Author */}
		<div className="flex items-center gap-3 border-t border-neutral-100 pt-4">
			<Avatar className="h-10 w-10 border-2 border-neutral-200">
				<AvatarImage src={creator?.photoURL || ''} />
				<AvatarFallback className="bg-blue-600 text-sm font-semibold text-white">
					{(creator?.displayName || 'U').charAt(0).toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<div className="flex-1">
				<span className="text-sm font-semibold text-neutral-900">{creator?.displayName || 'Anonymous User'}</span>
				<p className="text-xs text-neutral-500">
					{review.createdAt
						? review.createdAt instanceof Date
							? review.createdAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
							: review.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
						: 'Recently'}
				</p>
			</div>
		</div>
	</motion.div>
);
