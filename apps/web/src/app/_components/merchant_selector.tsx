'use client';

import * as React from 'react';
import {
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@ui/components';
import { api_client } from '@/lib/trpc_app/api_client';

const OTHER_VALUE = '__other__';

interface MerchantSelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MerchantSelector({
  value,
  onChange,
  placeholder = 'e.g. Netflix, Shoprite',
}: MerchantSelectorProps) {
  const { data } = api_client.merchant.getAll.useQuery(undefined, {
    staleTime: 24 * 60 * 60 * 1000,
  });
  const merchants = data?.data ?? [];

  const isKnown = merchants.some((m) => m.name === value);
  const [isOther, setIsOther] = React.useState(false);

  // When merchants load, if current value isn't a known merchant, enter other mode
  React.useEffect(() => {
    if (merchants.length > 0 && value && !isKnown) setIsOther(true);
  }, [merchants.length]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectValue = isOther ? OTHER_VALUE : isKnown ? value : '';

  const handleSelectChange = (v: string) => {
    if (v === OTHER_VALUE) {
      setIsOther(true);
      onChange('');
    } else {
      setIsOther(false);
      onChange(v);
    }
  };

  const showInput = isOther;

  return (
    <div className="flex flex-col gap-2">
      <Select value={selectValue} onValueChange={handleSelectChange}>
        <SelectTrigger size="default" className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {merchants.map((m) => (
            <SelectItem key={m.id} value={m.name}>
              {m.name}
            </SelectItem>
          ))}
          <SelectItem value={OTHER_VALUE}>OTHER</SelectItem>
        </SelectContent>
      </Select>

      {showInput && (
        <Input
          autoFocus
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
