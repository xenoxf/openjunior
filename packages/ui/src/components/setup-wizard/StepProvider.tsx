import React from 'react';
import { useI18n } from '@/lib/i18n';
import { useSetupStore } from '@/stores/useSetupStore';
import { cn } from '@/lib/utils';
import { Icon } from '@/components/icon/Icon';

const PROVIDERS = [
  { id: 'anthropic', icon: 'brain', label: 'Anthropic (Claude)', models: 'Claude 3.5 Sonnet, Opus', color: 'text-[var(--status-warning)]' },
  { id: 'openai', icon: 'ai-generate-2', label: 'OpenAI', models: 'GPT-4o, GPT-4o mini', color: 'text-green-500' },
  { id: 'gemini', icon: 'star', label: 'Google (Gemini)', models: 'Gemini 1.5 Pro, Flash', color: 'text-blue-500' },
  { id: 'local', icon: 'database-2', label: 'Local / Ollama', models: 'Llama, CodeLlama, Mistral...', color: 'text-purple-500' },
] as const;

export const StepProvider: React.FC = () => {
  const { t } = useI18n();
  const { provider, setProvider, apiKey, setApiKey } = useSetupStore();

  const handleProviderSelect = (id: typeof provider) => {
    setProvider(id);
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-1">
        <h2 className="typography-ui-header font-semibold text-foreground">{t('setupWizard.step2.title')}</h2>
        <p className="typography-ui text-muted-foreground">{t('setupWizard.step2.subtitle')}</p>
      </div>

      <div className="space-y-3">
        {PROVIDERS.map(({ id, icon, label, models, color }) => (
          <button
            key={id}
            type="button"
            onClick={() => handleProviderSelect(id)}
            className={cn(
              'relative w-full p-4 text-left rounded-lg border-2 transition-all',
              provider === id
                ? 'border-[var(--primary-base)] bg-[var(--primary-base)]/5'
                : 'border-[var(--interactive-border)] hover:border-[var(--primary-base)]/40'
            )}
          >
            <div className="flex items-center gap-3">
              <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', provider === id ? 'bg-[var(--primary-base)] text-[var(--primary-foreground)]' : 'bg-[var(--surface-muted)]')}>
                <Icon name={icon} className={cn('h-5 w-5', color)} />
              </div>
              <div className="flex-1">
                <h3 className="typography-ui-label font-medium text-foreground">{label}</h3>
                <p className="typography-micro text-muted-foreground">{models}</p>
              </div>
              {provider === id && <Icon name="check" className="h-5 w-5 text-[var(--primary-base)]" />}
            </div>
          </button>
        ))}
      </div>

      {(provider && provider !== 'local') && (
        <div className="space-y-2 rounded-lg border bg-[var(--surface-elevated)] p-4 animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <Icon name="key" className="h-4 w-4 text-muted-foreground" />
            <label className="typography-ui-label font-medium text-foreground">{t('setupWizard.step2.apiKey')}</label>
          </div>
          <p className="typography-micro text-muted-foreground pl-6">{t('setupWizard.step2.apiKeyHint')}</p>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={t('setupWizard.step2.apiKeyPlaceholder')}
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm text-foreground border-[var(--interactive-border)] focus:outline-none focus:ring-2 focus:ring-[var(--primary-base)]/50"
          />
        </div>
      )}

      {provider === 'local' && (
        <div className="rounded-lg border bg-[var(--surface-elevated)] p-4">
          <div className="flex items-center gap-2 text-[var(--status-info)]">
            <Icon name="information" className="h-4 w-4" />
            <p className="typography-ui text-[var(--status-info)]">{t('setupWizard.step2.localInfo')}</p>
          </div>
        </div>
      )}
    </div>
  );
};