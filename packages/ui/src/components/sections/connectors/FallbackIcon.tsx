import React from 'react';
import { cn } from '@/lib/utils';

function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 55%, 45%)`;
}

function getInitials(name: string): string {
  const clean = name.replace(/[._\-/]/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

interface FallbackIconProps {
  name: string;
  className?: string;
}

export const FallbackIcon: React.FC<FallbackIconProps> = ({ name, className }) => {
  const color = React.useMemo(() => hashStringToColor(name), [name]);
  const initials = React.useMemo(() => getInitials(name), [name]);

  return (
    <div
      className={cn(
        'flex items-center justify-center rounded-xl text-white font-bold select-none',
        className
      )}
      style={{ backgroundColor: color }}
      aria-hidden="true"
    >
      {initials}
    </div>
  );
};
