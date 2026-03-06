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
import { toast } from '@/hooks/use-toast';
import { useSendSessionMessage, useUpdateSessionStatus } from '@/queries/useSessions';
import { SessionRequest } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const acceptSessionSchema = z.object({
	calendlyUrl: z.string().url('Please enter a valid URL').min(1, 'Calendly URL is required'),
});

type AcceptSessionFormValues = z.infer<typeof acceptSessionSchema>;

interface AcceptSessionModalProps {
	isOpen: boolean;
	onClose: () => void;
	session: SessionRequest;
}

export const AcceptSessionModal = ({ isOpen, onClose, session }: AcceptSessionModalProps) => {
	const { mutate: updateStatus, isPending: isUpdating } = useUpdateSessionStatus();
	const { mutate: sendMessage, isPending: isSending } = useSendSessionMessage();

	const isPending = isUpdating || isSending;

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<AcceptSessionFormValues>({
		resolver: zodResolver(acceptSessionSchema),
		defaultValues: {
			calendlyUrl: session.calendlyUrl || '',
		},
	});

	const onSubmit = async (data: AcceptSessionFormValues) => {
		// 1. Update session status to accepted and save calendly URL
		updateStatus(
			{
				sessionId: session.id,
				status: 'accepted',
				calendlyUrl: data.calendlyUrl,
			},
			{
				onSuccess: () => {
					// 2. Send message to mentee
					sendMessage(
						{
							menteeId: session.menteeId,
							mentorId: session.mentorId,
							calendlyUrl: data.calendlyUrl,
						},
						{
							onSuccess: () => {
								toast.success('Session accepted!', 'Message sent to mentee with booking link.');
								reset();
								onClose();
							},
							onError: (err) => {
								console.error(err);
								toast.error('Session accepted but failed to send message.');
								onClose();
							},
						}
					);
				},
				onError: (err) => {
					toast.error('Failed to accept session', err.message);
				},
			}
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<DialogTitle>Accept Session Request</DialogTitle>
					<DialogDescription>
						Provide your Calendly (or other booking) link for the mentee to schedule their time.
					</DialogDescription>
				</DialogHeader>
				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
					<div className="space-y-2">
						<Label htmlFor="calendlyUrl">Booking Link (Calendly)</Label>
						<Input id="calendlyUrl" placeholder="https://calendly.com/your-link" {...register('calendlyUrl')} />
						{errors.calendlyUrl && <p className="text-sm text-red-500">{errors.calendlyUrl.message}</p>}
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending}>
							{isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
							Accept & Send Link
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
