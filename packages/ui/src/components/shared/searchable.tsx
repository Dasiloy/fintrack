'use client';

import { useMemo } from 'react';

import {
  Combobox,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  useComboboxAnchor,
} from '@ui/components/atoms';

type BaseProps = {
  placeholder: string;
  ariaLabel: string;
  noItemsFound: string;
  showClear?: boolean;
  disabled?: boolean;
};

/** String mode: value and items are strings, display is the string itself */
export interface SearchableStringProps extends BaseProps {
  value: string | null;
  items: string[];
  onValueChange: (value: string | null) => void;
}

/** Object mode: value is the key, items are objects; use getValue/getLabel for key and display */
export interface SearchableObjectProps<T> extends BaseProps {
  value: string | null;
  items: T[];
  getValue: (item: T) => string;
  getLabel: (item: T) => string;
  onValueChange: (value: string | null) => void;
}

export type SearchableProps<T> =
  | (SearchableStringProps & { items: string[] })
  | (SearchableObjectProps<T> & { items: T[] });

function isObjectProps<T>(props: SearchableProps<T>): props is SearchableObjectProps<T> {
  return 'getValue' in props && 'getLabel' in props;
}

export function Searchable<T>(props: SearchableProps<T>): React.ReactElement {
  const {
    value,
    onValueChange,
    items,
    placeholder,
    ariaLabel,
    noItemsFound,
    disabled = false,
    showClear = false,
  } = props;

  const anchor = useComboboxAnchor();

  const isObject = isObjectProps(props as SearchableStringProps | SearchableObjectProps<unknown>);

  const comboboxItems: string[] = useMemo(
    () =>
      isObject
        ? (items as unknown[]).map((item) =>
            (props as SearchableObjectProps<unknown>).getValue(item),
          )
        : (items as string[]),
    [isObject, items, props],
  );

  const labelByValue = useMemo(() => {
    if (!isObject) return null;
    const { getValue, getLabel } = props as SearchableObjectProps<unknown>;
    return new Map((items as unknown[]).map((item) => [getValue(item), getLabel(item)]));
  }, [isObject, items, props]);

  return (
    <Combobox value={value} onValueChange={onValueChange} items={comboboxItems} disabled={disabled}>
      <ComboboxInput
        ref={anchor}
        showClear={showClear}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      <ComboboxContent anchor={anchor}>
        <ComboboxEmpty>{noItemsFound}</ComboboxEmpty>
        <ComboboxList>
          <ComboboxCollection>
            {(itemValue: string) => (
              <ComboboxItem key={itemValue} value={itemValue}>
                {labelByValue ? (labelByValue.get(itemValue) ?? itemValue) : itemValue}
              </ComboboxItem>
            )}
          </ComboboxCollection>
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
