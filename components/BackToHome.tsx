import { appConfig } from '@/config/appConfig';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const BackToHome = ({ mb, path, pathName }: { mb?: string; path?: string; pathName?: string }) => {
	return (
		<div className={cn('animate-fade-in', mb ? mb : 'mb-8')}>
			<Link
				href={path || '/'}
				className={cn(
					'group relative inline-flex items-center gap-2 rounded-full py-2.5 pl-3 pr-5 text-sm font-medium text-white shadow-md transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95 active:shadow-sm',
					appConfig.isRebusAIMentors
						? 'bg-gradient-to-r from-primaryColor-700 to-secondaryColor-700 hover:from-primaryColor-600 hover:to-secondaryColor-600'
						: 'gradient-primary'
				)}
			>
				<div className="rounded-full bg-white/20 p-1 transition-colors duration-300 group-hover:bg-white/30">
					<ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-0.5" />
				</div>
				<span className="tracking-wide">Back to {pathName || 'Home'}</span>
			</Link>
		</div>
	);
};

export default BackToHome;
