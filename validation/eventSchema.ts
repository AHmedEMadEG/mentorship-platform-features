import { z } from 'zod';

export const eventSchema = z
	.object({
		title: z.string().min(1, 'Event name is required').max(120, 'Event name is too long'),
		description: z.string().min(1, 'Description is required').max(2000, 'Description is too long'),
		location: z.string().min(1, 'Location is required').max(200, 'Location is too long'),
		startDate: z.string().min(1, 'Start date is required'),
		endDate: z.string().min(1, 'End date is required'),
		visibility: z.enum(['public', 'private']),
		ticketPrice: z.coerce.number().min(0, 'Ticket price cannot be negative'),
		requireApproval: z.boolean(),
		unlimitedCapacity: z.boolean(),
		capacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional(),
	})
	.refine((data) => new Date(data.endDate) > new Date(data.startDate), {
		message: 'End date must be after start date',
		path: ['endDate'],
	})
	.refine((data) => data.unlimitedCapacity || (data.capacity !== undefined && data.capacity >= 1), {
		message: 'Please set a valid capacity or enable unlimited',
		path: ['capacity'],
	});

export type EventFormData = z.infer<typeof eventSchema>;
