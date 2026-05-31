'use client';
import React from 'react';

export function useStaticBody(conditionValue = false) {
  React.useEffect(() => {
    if (conditionValue) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [conditionValue]);
}
