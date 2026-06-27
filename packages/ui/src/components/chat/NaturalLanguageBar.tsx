import React from 'react';
import { Icon } from '@/components/icon/Icon';
import { cn } from '@/lib/utils';

interface NaturalLanguageBarProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

export const NaturalLanguageBar: React.FC<NaturalLanguageBarProps> = ({
  value,
  onChange,
  onSubmit,
  placeholder = 'Ask me anything... (e.g., "help me fix the login bug")',
  disabled = false,
  className,
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition-colors focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20',
        disabled && 'opacity-50 pointer-events-none',
        className
      )}
    >
      <Icon name="sparkling" className="h-4 w-4 shrink-0 text-primary/60" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
      />
      {value.trim() && (
        <button
          type="button"
          onClick={onSubmit}
          className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Icon name="arrow-right" className="h-3 w-3" />
        </button>
      )}
    </div>
  );
};
