'use client';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import { useCreateEvent, useUpdateEvent } from '@/queries/useEvents';
import { AppEvent } from '@/types';
import { EventFormData, eventSchema } from '@/validation/eventSchema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Timestamp } from 'firebase/firestore';
import { Calendar, DollarSign, Loader2, MapPin, Users } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';

interface EventFormModalProps {
	isOpen: boolean;
	onClose: () => void;
	mentorId: string;
	mentorName: string;
	mentorImage?: string;
	event?: AppEvent | null;
}

function toDatetimeLocal(ts: Timestamp) {
	const d = ts.toDate();
	const pad = (n: number) => String(n).padStart(2, '0');
	return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function getDefaultStart() {
	const d = new Date();
	d.setHours(d.getHours() + 3, 0, 0, 0);
	return d.toISOString().slice(0, 16);
}

function getDefaultEnd() {
	const d = new Date();
	d.setHours(d.getHours() + 5, 0, 0, 0);
	return d.toISOString().slice(0, 16);
}

export function EventFormModal({ isOpen, onClose, mentorId, mentorName, mentorImage, event }: EventFormModalProps) {
	const isEdit = !!event;

	const {
		register,
		handleSubmit,
		control,
		reset,
		formState: { errors },
	} = useForm<EventFormData>({
		resolver: zodResolver(eventSchema),
		defaultValues: {
			title: event?.title ?? '',
			description: event?.description ?? '',
			location: event?.location ?? '',
			startDate: event ? toDatetimeLocal(event.startDate) : getDefaultStart(),
			endDate: event ? toDatetimeLocal(event.endDate) : getDefaultEnd(),
			visibility: event?.visibility ?? 'public',
			ticketPrice: event?.ticketPrice ?? 0,
			requireApproval: event?.requireApproval ?? false,
			unlimitedCapacity: event?.capacity === null,
			capacity: event?.capacity ?? 50,
		},
	});

	const { mutate: createEvent, isPending: isCreating } = useCreateEvent();
	const { mutate: updateEvent, isPending: isUpdating } = useUpdateEvent();

	const onSubmit = (data: EventFormData) => {
		const payload = {
			title: data.title,
			description: data.description,
			location: data.location,
			startDate: Timestamp.fromDate(new Date(data.startDate)),
			endDate: Timestamp.fromDate(new Date(data.endDate)),
			visibility: data.visibility,
			ticketPrice: data.ticketPrice,
			requireApproval: data.requireApproval,
			capacity: data.unlimitedCapacity ? null : (data.capacity ?? 50),
			creatorId: mentorId,
			creatorName: mentorName,
			creatorImage: mentorImage,
		};

		if (isEdit && event) {
			updateEvent(
				{ eventId: event.id, data: payload },
				{
					onSuccess: () => {
						toast.success('Event updated!');
						onClose();
					},
					onError: () => toast.error('Failed to update event. Please try again.'),
				}
			);
		} else {
			createEvent(payload, {
				onSuccess: () => {
					toast.success('Event created!', 'Your event is now live.');
					onClose();
				},
				onError: (error) => toast.error(`Failed to create event. Please try again.${error.message}`),
			});
		}
	};

	return (
		<Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
			<DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto rounded-3xl p-0">
				<div className="sticky top-0 z-10 rounded-t-3xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 px-8 py-6">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-3 text-2xl font-black text-white">
							<Calendar className="h-6 w-6" />
							{isEdit ? 'Edit Event' : 'Create Event'}
						</DialogTitle>
					</DialogHeader>
				</div>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-8">
					{/* Event Name */}
					<div className="space-y-2">
						<Label htmlFor="title" className="text-sm font-bold text-slate-700">
							Event Name <span className="text-red-500">*</span>
						</Label>
						<Input
							id="title"
							placeholder="e.g. Career Growth Masterclass"
							className="rounded-2xl border-slate-200 text-base font-semibold"
							{...register('title')}
						/>
						{errors.title && <p className="text-xs font-medium text-red-500">{errors.title.message}</p>}
					</div>

					{/* Visibility Toggle */}
					<Controller
						name="visibility"
						control={control}
						render={({ field }) => (
							<div className="flex items-center justify-between rounded-2xl border border-slate-200 p-4">
								<div>
									<p className="font-bold text-slate-800">{field.value === 'public' ? '🌍 Public' : '🔒 Private'} Event</p>
									<p className="text-sm text-slate-500">
										{field.value === 'public'
											? 'Listed on the browse page and discoverable by all.'
											: 'Only accessible via a direct link — not listed publicly.'}
									</p>
								</div>
								<Switch checked={field.value === 'public'} onCheckedChange={(v) => field.onChange(v ? 'public' : 'private')} />
							</div>
						)}
					/>

					{/* Dates */}
					<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="startDate" className="text-sm font-bold text-slate-700">
								Start Date & Time <span className="text-red-500">*</span>
							</Label>
							<Input
								id="startDate"
								type="datetime-local"
								className="rounded-2xl border-slate-200"
								{...register('startDate')}
							/>
							{errors.startDate && <p className="text-xs font-medium text-red-500">{errors.startDate.message}</p>}
						</div>
						<div className="space-y-2">
							<Label htmlFor="endDate" className="text-sm font-bold text-slate-700">
								End Date & Time <span className="text-red-500">*</span>
							</Label>
							<Input id="endDate" type="datetime-local" className="rounded-2xl border-slate-200" {...register('endDate')} />
							{errors.endDate && <p className="text-xs font-medium text-red-500">{errors.endDate.message}</p>}
						</div>
					</div>

					{/* Location */}
					<div className="space-y-2">
						<Label htmlFor="location" className="flex items-center gap-2 text-sm font-bold text-slate-700">
							<MapPin className="h-4 w-4 text-secondaryColor-500" /> Location <span className="text-red-500">*</span>
						</Label>
						<Input
							id="location"
							placeholder="Online, New York, or leave blank"
							className="rounded-2xl border-slate-200"
							{...register('location')}
						/>
						{errors.location && <p className="text-xs font-medium text-red-500">{errors.location.message}</p>}
					</div>

					{/* Description */}
					<div className="space-y-2">
						<Label htmlFor="description" className="text-sm font-bold text-slate-700">
							Description <span className="text-red-500">*</span>
						</Label>
						<Textarea
							id="description"
							placeholder="Tell attendees what to expect..."
							rows={4}
							className="rounded-2xl border-slate-200"
							{...register('description')}
						/>
						{errors.description && <p className="text-xs font-medium text-red-500">{errors.description.message}</p>}
					</div>

					{/* ─── Event Options ─── */}
					<div className="rounded-2xl border border-slate-200 p-5">
						<h3 className="mb-5 text-sm font-black uppercase tracking-widest text-slate-500">Event Options</h3>

						<div className="space-y-5">
							{/* Ticket Price */}
							<div className="flex items-center gap-4">
								<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primaryColor-50">
									<DollarSign className="h-5 w-5 text-primaryColor-600" />
								</div>
								<div className="flex-1">
									<p className="font-bold text-slate-800">Ticket Price</p>
									<p className="text-xs text-slate-500">Set to 0 for free events</p>
								</div>
								<div className="flex items-center gap-1">
									<span className="text-sm font-bold text-slate-500">$</span>
									<Input
										type="number"
										min={0}
										step={0.01}
										className="w-24 rounded-xl border-slate-200 text-right"
										{...register('ticketPrice')}
									/>
								</div>
							</div>
							{errors.ticketPrice && <p className="text-xs font-medium text-red-500">{errors.ticketPrice.message}</p>}

							<div className="h-px bg-slate-100" />

							{/* Require Approval */}
							<Controller
								name="requireApproval"
								control={control}
								render={({ field }) => (
									<div className="flex items-center gap-4">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
											<svg className="h-5 w-5 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
												<path
													strokeLinecap="round"
													strokeLinejoin="round"
													strokeWidth={2}
													d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
												/>
											</svg>
										</div>
										<div className="flex-1">
											<p className="font-bold text-slate-800">Require Approval</p>
											<p className="text-xs text-slate-500">Review and approve requests manually</p>
										</div>
										<Switch checked={field.value} onCheckedChange={field.onChange} />
									</div>
								)}
							/>

							<div className="h-px bg-slate-100" />

							{/* Capacity */}
							<Controller
								name="unlimitedCapacity"
								control={control}
								render={({ field }) => (
									<div className="flex items-center gap-4">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-secondaryColor-50">
											<Users className="h-5 w-5 text-secondaryColor-600" />
										</div>
										<div className="flex-1">
											<p className="font-bold text-slate-800">Capacity</p>
											<p className="text-xs text-slate-500">Maximum number of attendees</p>
										</div>
										<div className="flex items-center gap-3">
											{!field.value && (
												<Input
													type="number"
													min={1}
													className="w-20 rounded-xl border-slate-200 text-right"
													{...register('capacity')}
												/>
											)}
											<span className="text-xs font-semibold text-slate-500">{field.value ? 'Unlimited' : 'Limited'}</span>
											<Switch checked={field.value} onCheckedChange={field.onChange} />
										</div>
									</div>
								)}
							/>
							{errors.capacity && <p className="text-xs font-medium text-red-500">{errors.capacity.message}</p>}
						</div>
					</div>

					{/* Actions */}
					<div className="flex gap-3 pt-2">
						<Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-2xl border-slate-200">
							Cancel
						</Button>
						<Button
							type="submit"
							disabled={isCreating || isUpdating}
							className="flex-1 rounded-2xl bg-gradient-to-r from-primaryColor-600 to-secondaryColor-600 font-bold text-white shadow-lg"
						>
							{isCreating || isUpdating ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : isEdit ? (
								'Save Changes'
							) : (
								'Create Event'
							)}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
}
