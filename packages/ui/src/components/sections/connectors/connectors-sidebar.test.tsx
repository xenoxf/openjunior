import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '@/lib/i18n';
import { ConnectorsSidebar } from './connectors-sidebar';

describe('ConnectorsSidebar', () => {
  test('renders all three tabs', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="integrations"
          onTabChange={() => {}}
          collapsed={false}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('role="tablist"');
    expect(markup).toContain('role="tab"');
  });

  test('highlights active tab with aria-selected', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="mcp"
          onTabChange={() => {}}
          collapsed={false}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('aria-selected="true"');
  });

  test('collapsed mode adds reduced width', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="skills"
          onTabChange={() => {}}
          collapsed={true}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('justify-center');
  });

  test('expand button visible in collapsed mode', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="integrations"
          onTabChange={() => {}}
          collapsed={true}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('arrow-right-s');
  });

  test('collapse button visible in expanded mode', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="integrations"
          onTabChange={() => {}}
          collapsed={false}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('arrow-left-s');
  });

  test('collapsed mode shows aria-label on expand button', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorsSidebar
          activeTab="integrations"
          onTabChange={() => {}}
          collapsed={true}
          onCollapseToggle={() => {}}
        />
      </I18nProvider>,
    );
    expect(markup).toContain('aria-label');
    expect(markup).toContain('Expand sidebar');
  });
});
