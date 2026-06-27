import React from 'react';
import { NaturalLanguageBar } from './NaturalLanguageBar';
import { useUIStore } from '@/stores/useUIStore';
import { useInputStore } from '@/sync/input-store';

export const NaturalLanguageModeBar: React.FC = () => {
  const naturalLanguageMode = useUIStore((s) => s.naturalLanguageMode);
  const [value, setValue] = React.useState('');

  if (!naturalLanguageMode) return null;

  const handleSubmit = () => {
    if (!value.trim()) return;
    useInputStore.getState().setPendingInputText(value.trim());
    setValue('');
  };

  return (
    <div className="px-4 pb-2">
      <NaturalLanguageBar
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder="Ask me anything... (e.g., &quot;help me fix the login bug&quot;)"
      />
    </div>
  );
};
