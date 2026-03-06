import { BookSessionButton } from '@/components/BookSessionButton';
import { appConfig } from '@/config/appConfig';
import { getCountryCode } from '@/lib/helpers';
import { cn } from '@/lib/utils';
import { Mentorship } from '@/types';
import { Briefcase, Clock, Languages } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface MentorshipCardProps {
	mentorship: Mentorship;
	MentorId: string;
	bookSessionDisabled?: boolean;
}

const MentorshipCard = ({ mentorship, MentorId, bookSessionDisabled }: MentorshipCardProps) => {
	return (
		<div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-500 hover:shadow-2xl">
			{/* Image Container with Overlay */}
			<div className="relative aspect-[3/1] overflow-hidden sm:aspect-[4/5] md:aspect-[16/9] lg:aspect-[4/5]">
				<Image
					src={mentorship.profileImage || '/mentor-placeholder.png'}
					alt={mentorship.name}
					fill
					className="object-cover transition-transform duration-700 group-hover:scale-110"
				/>
				<div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 transition-opacity duration-500 group-hover:opacity-80" />

				{/* Floating Badges on Image */}
				<div className="absolute left-4 top-4 flex flex-col gap-2">
					<div className="flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-900 shadow-sm backdrop-blur-md">
						<Clock size={12} className="text-primaryColor-600" />
						{mentorship.availability}
					</div>
				</div>

				<div className="absolute bottom-4 left-4 right-4">
					<h3 title={mentorship.name} className="text-xl font-bold leading-tight text-white drop-shadow-md">
						{mentorship.name} {getCountryCode(mentorship.country)}
					</h3>
					<p title={mentorship.title} className="mt-1 line-clamp-1 text-sm font-medium text-gray-200">
						{mentorship.title}
					</p>
				</div>
			</div>

			{/* Content Section */}
			<div className="flex flex-grow flex-col p-5">
				<div className="mb-4 flex items-center gap-2 text-gray-600">
					<Briefcase size={14} className="text-primaryColor-500" />
					<span className="text-sm font-medium">{mentorship.company}</span>
				</div>

				{/* Key Metrics */}
				<div className="mb-5 grid grid-cols-2 gap-3">
					<div className="group-hover:bg-primaryColor-50/50 flex flex-col rounded-xl bg-gray-50 p-3 transition-colors">
						<span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Experience</span>
						<span className="text-sm font-bold text-gray-900">{mentorship.experience}+ Years</span>
					</div>
					<div className="group-hover:bg-primaryColor-50/50 flex flex-col rounded-xl bg-gray-50 p-3 transition-colors">
						<span className="mb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">Sessions</span>
						<span className="text-sm font-bold text-primaryColor-600">{mentorship.sessions} Hosted</span>
					</div>
				</div>

				{/* Tags with limited display */}
				<div className="mb-6 flex flex-wrap gap-1.5">
					<Tag label={mentorship.careerStage} />
					<Tag label={mentorship.experienceLevel} />
					{mentorship.languages.slice(0, 1).map((lang, i) => (
						<Tag key={i} label={lang} icon={<Languages size={10} />} />
					))}
					{mentorship.languages.length > 1 && (
						<span className="py-1 text-[10px] font-medium text-gray-400">+{mentorship.languages.length - 1} more</span>
					)}
				</div>

				{/* CTA Button */}
				<div className="mt-auto flex flex-col gap-2">
					<BookSessionButton
						disabled={bookSessionDisabled}
						mentor={mentorship}
						MentorId={MentorId}
						isProfilePage={false}
						className="w-full"
					/>
					<Link
						href={`/mentors/mentor/${mentorship.userId}`}
						className={cn(
							'flex w-full items-center justify-center gap-2 rounded-xl py-3 font-bold text-white transition-all duration-300 hover:shadow-lg active:scale-[0.98]',
							appConfig.isRebusAIMentors
								? 'bg-primaryColor-800 hover:bg-primaryColor-600'
								: 'bg-gray-900 hover:bg-primaryColor-600'
						)}
					>
						View Profile
					</Link>
				</div>
			</div>
		</div>
	);
};

const Tag = ({ label, icon }: { label: string; icon?: React.ReactNode }) => (
	<span className="flex items-center gap-1 rounded-lg border border-gray-100 bg-white px-2.5 py-1 text-[11px] font-semibold text-gray-600 shadow-sm">
		{icon}
		{label}
	</span>
);

export default MentorshipCard;
