'use client';

import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Country } from 'country-state-city';
import { Check, ChevronDown, Globe } from 'lucide-react';
import { useMemo, useState } from 'react';

interface CountrySearchProps {
	value: string;
	onValueChange: (value: string, code: string) => void;
	onBlur?: () => void;
	placeholder?: string;
	className?: string;
	error?: boolean;
}

export function CountrySearch({
	value,
	onValueChange,
	onBlur,
	placeholder = 'Select country...',
	className,
	error = false,
}: CountrySearchProps) {
	const [open, setOpen] = useState(false);
	const [searchValue, setSearchValue] = useState('');

	const countries = useMemo(() => Country.getAllCountries(), []);

	const filteredCountries = useMemo(() => {
		const q = searchValue.trim().toLowerCase();
		if (!q) return countries.slice(0, 20);

		const isoMatches: typeof countries = [];
		const nameMatches: typeof countries = [];

		for (const c of countries) {
			const iso = c.isoCode.toLowerCase();
			const name = c.name.toLowerCase();

			if (iso.startsWith(q)) {
				isoMatches.push(c); // highest priority
			} else if (name.includes(q)) {
				nameMatches.push(c);
			}
		}

		return [...isoMatches, ...nameMatches].slice(0, 20);
	}, [countries, searchValue]);

	const handleSelect = (selectedValue: string, code: string) => {
		onValueChange(selectedValue, code);
		if (value === selectedValue) {
			onValueChange('', '');
		} else {
			onValueChange(selectedValue, code);
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
						className
					)}
				>
					<div className="flex items-center">
						<Globe className="mr-2 h-4 w-4 text-gray-400" />
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
						placeholder="Search countries..."
						value={searchValue}
						onValueChange={setSearchValue}
						className="border-gray-300 bg-white text-black"
					/>
					<CommandList className="bg-white">
						<CommandEmpty className="cursor-pointer p-2 text-black hover:bg-gray-100 focus:bg-gray-100">
							No country found.
						</CommandEmpty>
						<CommandGroup className="max-h-60 overflow-auto bg-white">
							{filteredCountries.map((country) => (
								<CommandItem
									key={country.isoCode}
									value={country.name}
									onSelect={() => handleSelect(country.name, country.isoCode)}
									className="cursor-pointer p-2 text-black hover:bg-gray-100 focus:bg-gray-100 data-[selected=true]:bg-gray-100 data-[selected=true]:text-black"
								>
									<Check className={cn('mr-2 h-4 w-4', value === country.name ? 'opacity-100' : 'opacity-0')} />
									{country.name} ({country.isoCode})
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
