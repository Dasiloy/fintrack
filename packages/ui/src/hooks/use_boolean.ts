import { useCallback, useState } from 'react';

type UseBoolean = [
  boolean,
  {
    on: VoidFunction;
    off: VoidFunction;
    set: (value: boolean) => void;
  },
];

/**
 * @description Handle toggle state
 *
 * @param {boolean} defaultstate  defaults to false
 * @returns {UseBoolean} boolean state manager
 */

export function useBoolean(defaultstate = false): UseBoolean {
  const [isOpen, setIsOpen] = useState(defaultstate);

  const on = useCallback(() => {
    setIsOpen(true);
  }, []);

  const off = useCallback(() => {
    setIsOpen(false);
  }, []);

  return [
    isOpen,
    {
      on,
      off,
      set: setIsOpen,
    },
  ];
}
