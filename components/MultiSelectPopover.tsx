'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

export interface MultiSelectPopoverProps {
	label?: string;
	options: string[];
	value: string[];
	onChange: (value: string[]) => void;
	error?: string;
	notAstrek?: boolean;
	placeholder?: string;
	className?: string;
}

export const MultiSelectPopover = ({
	label,
	options,
	value,
	onChange,
	notAstrek,
	error,
	placeholder,
	className,
}: MultiSelectPopoverProps) => {
	const [open, setOpen] = useState(false);
	const [search, setSearch] = useState('');

	const handleSelect = (option: string) => {
		if (value.includes(option)) {
			onChange(value.filter((item) => item !== option));
		} else {
			onChange([...value, option]);
		}
	};

	const filteredOptions = options.filter((option) => option.toLowerCase().includes(search.toLowerCase()));

	return (
		<div className="space-y-1">
			{label && (
				<Label className="text-gray-700">
					{label}
					{!notAstrek && ' *'}
				</Label>
			)}
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						role="combobox"
						aria-expanded={open}
						className={cn(
							'w-full justify-between border-gray-300 bg-white text-black hover:bg-gray-100',
							error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
							className
						)}
					>
						<span className={cn('truncate', value.length === 0 && 'text-gray-400')}>
							{value.length > 0 ? value.join(', ') : placeholder || 'Select...'}
						</span>
						<ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent
					className="w-[var(--radix-popover-trigger-width)] border-gray-300 bg-white p-0"
					align="start"
					sideOffset={4}
				>
					<Command className="border-0 bg-white">
						<CommandInput
							placeholder="Search..."
							value={search}
							onValueChange={setSearch}
							className="border-gray-300 bg-white text-black"
						/>
						<CommandList className="bg-white">
							<CommandEmpty className="text-gray-600">No option found.</CommandEmpty>
							<CommandGroup className="bg-white">
								{filteredOptions.map((option) => (
									<CommandItem
										key={option}
										value={option}
										onSelect={() => handleSelect(option)}
										className="cursor-pointer p-2 text-black hover:bg-gray-100 focus:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-black"
									>
										<Check className={cn('mr-2 h-4 w-4', value.includes(option) ? 'opacity-100' : 'opacity-0')} />
										{option}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
			{error && <p className="text-sm text-red-600">{error}</p>}
		</div>
	);
};
