import { Button } from '@/components/ui/button';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { appConfig } from '@/config/appConfig';
import { useAuth } from '@/contexts/auth-context';
import { getUserById } from '@/firebase/userServices';
import { toast } from '@/hooks/use-toast';
import { useCreateSession } from '@/queries/useSessions';
import { Mentorship, User } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import axios from 'axios';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const sessionSchema = z.object({
	topic: z.string().min(3, 'Topic is required'),
	description: z.string().min(10, 'Description must be at least 10 characters'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface BookSessionModalProps {
	isOpen: boolean;
	onClose: () => void;
	mentor: Mentorship;
	MentorId: string;
	isMimic?: boolean;
}

export const BookSessionModal = ({ isOpen, onClose, mentor, MentorId, isMimic }: BookSessionModalProps) => {
	const { user } = useAuth();
	const { mutate: createSession, isPending } = useCreateSession();
	const [customTopic, setCustomTopic] = useState(false);

	const [mentorData, setMentorData] = useState<User | null>(null);

	useEffect(() => {
		const getMentor = async () => {
			if (!MentorId) return;
			const mentor = await getUserById(MentorId);
			setMentorData(mentor);
		};
		getMentor();
	}, [MentorId]);

	const {
		register,
		handleSubmit,
		setValue,
		watch,
		formState: { errors },
		reset,
	} = useForm<SessionFormValues>({
		resolver: zodResolver(sessionSchema),
	});

	const selectedTopic = watch('topic');

	const onSubmit = async (data: SessionFormValues) => {
		if (!user || isMimic) return;

		createSession(
			{
				menteeId: user.uid,
				mentorId: MentorId,
				topic: data.topic,
				description: data.description,
				menteeName: user.displayName || 'Mentee',
				menteeEmail: user.email || '',
				menteeImage: user.photoURL || '',
				mentorName: mentor.name,
				mentorImage: mentor.profileImage,
			},
			{
				onSuccess: async () => {
					toast.success('Session request sent!', 'The mentor will review your request.');
					try {
						await axios.post('/api/send-book-session', {
							name: user.displayName,
							email: user.email,
							receiver: mentorData?.email || mentor.userId, // fallback if mentorData not yet loaded
							admin_dashboard_url: `${appConfig.mainUrl}/merchant/sessions`,
							mentor_dashboard_url: `${appConfig.mainUrl}/merchant/sessions`,
							mentorName: mentor.name,
							userName: user.displayName,
							userEmail: user.email,
							topic: data.topic,
							description: data.description,
						});
					} catch (error) {
						console.error('Failed to send mail notification:', error);
					}
					reset();
					onClose();
				},
				onError: (error) => {
					toast.error('Failed to send request', error.message);
				},
			}
		);
	};

	// Determine topics to show
	const availableTopics = [...(mentor.expertise || []), mentor.industry].filter(Boolean);

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Book a Session with {mentor.name}</DialogTitle>
					<DialogDescription>Send a request to book a session. Mention your goals and preferred times.</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="topic">Topic</Label>
						{availableTopics.length > 0 && !customTopic ? (
							<Select
								onValueChange={(val) => {
									if (val === 'other') {
										setCustomTopic(true);
										setValue('topic', '');
									} else {
										setValue('topic', val);
									}
								}}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select a topic" />
								</SelectTrigger>
								<SelectContent>
									{availableTopics.map((topic, idx) => (
										<SelectItem key={idx} value={topic}>
											{topic}
										</SelectItem>
									))}
									<SelectItem value="other">Other</SelectItem>
								</SelectContent>
							</Select>
						) : (
							<Input id="topic" placeholder="e.g. Career Advice, Code Review" {...register('topic')} />
						)}
						{errors.topic && <p className="text-sm text-red-500">{errors.topic.message}</p>}
					</div>
					<div className="space-y-2">
						<Label htmlFor="description">Message</Label>
						<Textarea
							id="description"
							placeholder="Describe what you'd like to discuss..."
							className="h-32"
							{...register('description')}
						/>
						{errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
					</div>
					<DialogFooter>
						<Button
							type="button"
							variant="outline"
							onClick={() => {
								onClose();
								setCustomTopic(false);
							}}
							disabled={isPending}
						>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Send Request
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
