'use client';

import * as React from 'react';
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Field,
  Input,
  Label,
  toast,
} from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { Usage } from '@fintrack/types/constants/plan.constants';
import { api_client } from '@/lib/trpc_app/api_client';
import { UsageBanner } from '@/app/_components/usage_banner';
import { usePlan } from '@/app/providers/plan_usage_provider';

const PRESET_COLORS = [
  '#7c7aff',
  '#f87171',
  '#34d399',
  '#fbbf24',
  '#60a5fa',
  '#f472b6',
  '#a78bfa',
  '#2dd4bf',
  '#fb923c',
  '#e879f9',
  '#4ade80',
  '#38bdf8',
] as const;

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass to put the dialog in edit mode. */
  editCategory?: { slug: string; name: string; color: string } | null;
}

export function CategoryDialog({ open, onOpenChange, editCategory }: CategoryDialogProps) {
  const plan = usePlan();
  const isEditing = !!editCategory;

  const [name, setName] = React.useState('');
  const [color, setColor] = React.useState<string>(PRESET_COLORS[0]);
  const [description, setDescription] = React.useState('');

  const utils = api_client.useUtils();

  React.useEffect(() => {
    if (!open) return;
    if (isEditing && editCategory) {
      setName(editCategory.name);
      setColor(editCategory.color || PRESET_COLORS[0]);
      setDescription('');
    } else {
      setName('');
      setColor(PRESET_COLORS[0]);
      setDescription('');
    }
  }, [open, isEditing, editCategory]);

  const createMutation = api_client.category.create.useMutation({
    onSuccess: () => {
      toast.success('Category created');
      void utils.category.getAll.invalidate();
      void utils.budget.getAll.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to create category', { description: err.message }),
  });

  const updateMutation = api_client.category.update.useMutation({
    onSuccess: () => {
      toast.success('Category updated');
      void utils.category.getAll.invalidate();
      void utils.budget.getAll.invalidate();
      onOpenChange(false);
    },
    onError: (err) => toast.error('Failed to update category', { description: err.message }),
  });

  const descriptionValid = description.trim() === '' || description.trim().length >= 10;
  const canSubmit = !!name.trim() && !!color && (isEditing || descriptionValid);
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (isEditing && editCategory) {
      updateMutation.mutate({ slug: editCategory.slug, name: name.trim(), color });
    } else {
      createMutation.mutate({
        feature: Usage.MAX_CUSTOM_CATEGORIES,
        name: name.trim(),
        color,
        description: description.trim() || undefined,
      });
    }
  };

  const isCustomColor = !(PRESET_COLORS as readonly string[]).includes(color);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Category' : 'New Category'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isEditing && (
            <UsageBanner
              used={plan?.resourceCounts.categories ?? 0}
              limit={(plan?.limits?.[Usage.MAX_CUSTOM_CATEGORIES] ?? 3) as number}
              variant="slot"
              label="custom categories"
            />
          )}
          <Field>
            <Label>Name</Label>
            <Input
              placeholder="e.g. Groceries, Entertainment"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Label>Color</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Select color ${c}`}
                  onClick={() => setColor(c)}
                  className="size-7 cursor-pointer rounded-full transition-transform hover:scale-110"
                  style={{
                    background: c,
                    outline: color === c ? `2px solid ${c}` : '2px solid transparent',
                    outlineOffset: '2px',
                  }}
                />
              ))}

              {/* Custom color swatch */}
              <label
                title="Custom color"
                className={cn(
                  'relative size-7 cursor-pointer overflow-hidden rounded-full transition-transform hover:scale-110',
                  isCustomColor ? '' : 'border-border-light border border-dashed',
                )}
                style={{
                  background: isCustomColor ? color : undefined,
                  outline: isCustomColor ? `2px solid ${color}` : '2px solid transparent',
                  outlineOffset: '2px',
                }}
              >
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                />
                {!isCustomColor && (
                  <span className="text-text-disabled flex h-full w-full items-center justify-center text-[13px] font-light">
                    +
                  </span>
                )}
              </label>
            </div>
          </Field>

          {!isEditing && (
            <Field>
              <Label>
                Description <span className="text-text-disabled font-normal">(optional)</span>
              </Label>
              <Input
                placeholder="Short note about this category"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              {description.trim().length > 0 && !descriptionValid && (
                <p className="text-error mt-1 text-[11px]">Must be at least 10 characters.</p>
              )}
            </Field>
          )}

          <DialogFooter showCloseButton>
            <Button type="submit" loading={isPending} disabled={!canSubmit}>
              {isEditing ? 'Save Changes' : 'Create Category'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
