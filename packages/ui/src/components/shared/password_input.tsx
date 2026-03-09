'use client';

import { EyeIcon, EyeOffIcon } from 'lucide-react';

import { InputGroup, InputGroupAddon, InputGroupInput } from '@ui/components/atoms';
import { useState } from 'react';

function PasswordInput({ className, ...props }: Omit<React.ComponentProps<'input'>, 'type'>) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <InputGroup>
      <InputGroupInput type={showPassword ? 'text' : 'password'} className={className} {...props} />
      <InputGroupAddon
        className="cursor-pointer bg-transparent"
        align="inline-end"
        onClick={() => setShowPassword(!showPassword)}
      >
        {showPassword ? <EyeIcon className="size-4" /> : <EyeOffIcon className="size-4" />}
      </InputGroupAddon>
    </InputGroup>
  );
}

export { PasswordInput };
