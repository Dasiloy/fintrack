'use client';
import React from 'react';
import { cn } from '@ui/lib/utils/cn';
import { Spinner } from '@ui/components/atoms/spinner';
import { PencilIcon, UploadIcon, XIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage, DefaultAvatarIcon } from '@ui/components';

export interface ProfileUploaderProps {
  /** Profile image URL; when absent, shows the default avatar icon. */
  src?: string | null;
  alt?: string;
  file?: File | null;
  className?: string;
  loading?: boolean;
  /**
   * Called when the user selects a file.
   * @param file The selected file.
   */
  onSelect?: (file: File | null) => void;
  onUpload?: () => void;
}

export function ProfileUploader({
  src,
  file,
  alt = 'Profile',
  className,
  onSelect,
  loading = false,
  onUpload,
}: ProfileUploaderProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const [url, setUrl] = React.useState<string | null>(null);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('file', file);
    if (file) {
      onSelect?.(file);
      setUrl(URL.createObjectURL(file));
    }
  };

  const handleClick = () => {
    inputRef.current?.click();
  };

  const onClear = (e: React.MouseEvent<SVGSVGElement>) => {
    e.stopPropagation();
    onSelect?.(null);
    if (url) {
      setUrl(null);
    }
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  };

  React.useEffect(() => {
    if (src && !file) {
      return setUrl(src);
    }
  }, [src, file]);

  return (
    <React.Fragment>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
        aria-label="Upload profile photo"
      />
      <div className="relative inline-block">
        <div
          className={cn(
            'ring-border-subtle relative size-32 overflow-hidden rounded-full ring-1',
            'focus-visible:ring-primary/50 focus-visible:ring-2 focus-visible:outline-none',
            'duration-smooth transition-shadow',
            className,
          )}
          aria-label="Change profile photo"
        >
          <Avatar size="lg" className="size-full rounded-full">
            {url ? <AvatarImage src={url} alt={alt} className="object-top" /> : null}
            <AvatarFallback className="bg-bg-surface-hover text-text-secondary [&>svg]:size-16">
              <DefaultAvatarIcon />
            </AvatarFallback>
          </Avatar>
          <span className="bg-bg-deep/60 duration-smooth absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity hover:opacity-100 focus-visible:opacity-100">
            <button type="button" onClick={handleClick}>
              <PencilIcon className="text-text-primary size-5 cursor-pointer" aria-hidden />
            </button>
            <XIcon
              className="text-error size-5 cursor-pointer"
              aria-hidden
              onClick={onClear}
              aria-label="Clear profile photo"
            />
          </span>
        </div>
        {file && (
          <button
            type="button"
            onClick={onUpload?.bind(null)}
            className="bg-primary-dark text-text-primary absolute right-0 bottom-0 z-2 cursor-pointer rounded-full p-1.5"
          >
            {loading ? (
              <Spinner speed={'fast'} data-icon="inline-center" />
            ) : (
              <UploadIcon className="size-4" aria-hidden />
            )}
          </button>
        )}
      </div>
    </React.Fragment>
  );
}
