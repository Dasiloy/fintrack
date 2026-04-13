'use client';

import * as React from 'react';
import dayjs from 'dayjs';
import { ChevronDownIcon } from 'lucide-react';

import { cn } from '@ui/lib/utils/cn';
import { Button } from '@ui/components/atoms/button';
import { Calendar } from '@ui/components/atoms/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@ui/components/atoms/popover';

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  className,
}: {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          data-empty={!value}
          className={cn(
            'w-[212px] justify-between text-left font-normal',
            'data-[empty=true]:text-text-tertiary',
            className,
          )}
        >
          {value ? dayjs(value).format('PPP') : <span>{placeholder}</span>}
          <ChevronDownIcon className="size-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar mode="single" selected={value} onSelect={onChange} defaultMonth={value} />
      </PopoverContent>
    </Popover>
  );
}

export function DatePickerDemo() {
  const [date, setDate] = React.useState<Date>();
  return <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />;
}
