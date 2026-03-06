'use client';

import { Check, ChevronDown, MapPin } from 'lucide-react';
import { useMemo, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { City } from 'country-state-city';

interface LocationSearchProps {
	country: string;
	value: string;
	onValueChange: (value: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	className?: string;
	error?: boolean;
	disabled?: boolean;
}

export function LocationSearch({
	country,
	value,
	onValueChange,
	onBlur,
	placeholder = 'Select location...',
	className,
	error = false,
	disabled = false,
}: LocationSearchProps) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState('');

	const cities = useMemo(() => {
		return City.getCitiesOfCountry(country) || [];
	}, [country]);

	const filteredLocations = useMemo(() => {
		if (!searchValue) return cities.slice(0, 20);

		return cities.filter((location) => location.name.toLowerCase().includes(searchValue.toLowerCase())).slice(0, 20); // cap results
	}, [cities, searchValue]);

	const handleSelect = (selectedValue: string) => {
		if (value === selectedValue) {
			onValueChange('');
		} else {
			onValueChange(selectedValue);
		}
		setOpen(false);
		setSearchValue('');
	};

	const handleOpenChange = (newOpen: boolean) => {
		setOpen(newOpen);
		if (!newOpen) {
			setSearchValue('');
			onBlur?.();
		}
	};

	return (
		<Popover open={open} onOpenChange={handleOpenChange}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className={cn(
						'w-full justify-between border-gray-300 bg-white text-black hover:bg-gray-100',
						error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
						className,
						disabled && 'cursor-not-allowed opacity-50'
					)}
					disabled={disabled}
				>
					<div className="flex items-center">
						<MapPin className="mr-2 h-4 w-4 text-gray-400" />
						<span className={cn('truncate', !value && 'text-gray-400')}>{value || placeholder}</span>
					</div>
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
						placeholder="Search locations..."
						value={searchValue}
						onValueChange={setSearchValue}
						className="border-gray-300 bg-white text-black"
					/>
					<CommandList className="bg-white">
						<CommandEmpty className="text-gray-600">No location found.</CommandEmpty>
						<CommandGroup className="bg-white">
							{filteredLocations.map((location) => (
								<CommandItem
									key={location.latitude}
									value={location.name + ' (' + location.stateCode + ')'}
									onSelect={() => handleSelect(location.name + ' (' + location.stateCode + ')')}
									className="cursor-pointer p-2 text-black hover:bg-gray-100 focus:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-black"
								>
									<Check className={cn('mr-2 h-4 w-4', value === location.name ? 'opacity-100' : 'opacity-0')} />
									{location.name} ({location.stateCode})
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
