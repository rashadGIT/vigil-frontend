'use client';
import { useEffect } from 'react';

export function PwaRegister() {
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_ENABLE_PWA === 'true' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js');
    }
  }, []);
  return null;
}
