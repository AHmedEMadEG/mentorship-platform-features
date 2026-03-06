'use client';

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
import { useBulkAcceptSessions } from '@/queries/useSessions';
import { SessionRequest } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, CheckCircle2, Info, Loader2, Users } from 'lucide-react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const schema = z.object({
	calendlyUrl: z.string().url('Please enter a valid URL').min(1, 'Calendly URL is required'),
});

type FormValues = z.infer<typeof schema>;

interface BulkAcceptSessionModalProps {
	isOpen: boolean;
	onClose: () => void;
	sessions: SessionRequest[];
}

export const BulkAcceptSessionModal = ({ isOpen, onClose, sessions }: BulkAcceptSessionModalProps) => {
	const { mutate: bulkAccept, isPending } = useBulkAcceptSessions();

	const {
		register,
		handleSubmit,
		formState: { errors },
		reset,
	} = useForm<FormValues>({
		resolver: zodResolver(schema),
	});

	const onSubmit = (data: FormValues) => {
		const sessionData = sessions.map((s) => ({
			id: s.id,
			menteeId: s.menteeId,
			mentorId: s.mentorId,
		}));

		bulkAccept(
			{ sessions: sessionData, calendlyUrl: data.calendlyUrl },
			{
				onSuccess: () => {
					toast.success(
						'Sessions accepted!',
						`Booking link sent to ${sessions.length} mentee${sessions.length > 1 ? 's' : ''}.`
					);
					reset();
					onClose();
				},
				onError: (err) => {
					toast.error('Failed to bulk accept sessions', err.message);
				},
			}
		);
	};

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[560px]">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2 text-lg">
						<Users className="h-5 w-5 text-blue-600" />
						Bulk Accept Requests
					</DialogTitle>
					<DialogDescription>
						You are about to accept <span className="font-semibold text-slate-800">{sessions.length}</span> session request
						{sessions.length > 1 ? 's' : ''} with a single booking link.
					</DialogDescription>
				</DialogHeader>

				{/* ── Calendly Event Type Warning ── */}
				<div className="my-2 rounded-xl border border-amber-200 bg-amber-50 p-4">
					<div className="mb-2 flex items-center gap-2 font-semibold text-amber-800">
						<AlertTriangle className="h-4 w-4 shrink-0" />
						Important: Calendly Event Type Matters
					</div>
					<p className="mb-3 text-sm leading-relaxed text-amber-700">
						Make sure you are sharing the correct Calendly event type:
					</p>
					<div className="space-y-2">
						<div className="flex items-start gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
							<CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" />
							<div className="text-sm text-green-800">
								<span className="font-semibold">✅ One-on-One Event</span> — Each mentee books their own individual slot. The
								slot becomes unavailable after one booking. <span className="font-semibold">This is what you want.</span>
							</div>
						</div>
						<div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
							<AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
							<div className="text-sm text-red-800">
								<span className="font-semibold">⚠️ Group Event</span> — Multiple people can book the same time slot (has a seat
								capacity). This can cause scheduling overlap between your mentees.{' '}
								<span className="font-semibold">Avoid this for individual mentoring.</span>
							</div>
						</div>
					</div>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="calendlyUrl">Your Booking Link (Calendly)</Label>
						<Input
							id="calendlyUrl"
							placeholder="https://calendly.com/your-name/30min"
							{...register('calendlyUrl')}
							disabled={isPending}
						/>
						{errors.calendlyUrl && <p className="text-sm text-red-500">{errors.calendlyUrl.message}</p>}
						<p className="flex items-center gap-1 text-xs text-slate-400">
							<Info className="h-3 w-3" />
							This link will be sent to all selected mentees via chat.
						</p>
					</div>

					{/* Selected mentees preview */}
					<div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
						<p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
							Selected Mentees ({sessions.length})
						</p>
						<ul className="max-h-32 space-y-1 overflow-y-auto">
							{sessions.map((s) => (
								<li key={s.id} className="flex items-center gap-2 text-sm text-slate-700">
									<div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
									<span className="font-medium">{s.menteeName}</span>
									<span className="text-slate-400">— {s.topic}</span>
								</li>
							))}
						</ul>
					</div>

					<DialogFooter>
						<Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
							Cancel
						</Button>
						<Button type="submit" disabled={isPending} className="bg-blue-600 text-white hover:bg-blue-700">
							{isPending ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Accepting...
								</>
							) : (
								<>
									<CheckCircle2 className="mr-2 h-4 w-4" />
									Accept All & Send Link
								</>
							)}
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
};
