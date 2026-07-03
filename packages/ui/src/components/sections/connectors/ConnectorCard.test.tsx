import { describe, expect, test } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { I18nProvider } from '@/lib/i18n';
import { ConnectorCard } from './ConnectorCard';

describe('ConnectorCard', () => {
  test('renders title', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Test Server" />
      </I18nProvider>,
    );
    expect(markup).toContain('Test Server');
  });

  test('renders description', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Test" description="A test server" />
      </I18nProvider>,
    );
    expect(markup).toContain('A test server');
  });

  test('shows installed badge when installed', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="integration" title="Google" isInstalled />
      </I18nProvider>,
    );
    expect(markup).toContain('Installed');
  });

  test('shows popular badge when popular', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Popular Server" isPopular />
      </I18nProvider>,
    );
    expect(markup).toContain('Popular');
  });

  test('renders tags', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="skill" title="My Skill" tags={['v1.0', 'owner']} />
      </I18nProvider>,
    );
    expect(markup).toContain('v1.0');
    expect(markup).toContain('owner');
  });

  test('type badge shows Integration for integration type', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="integration" title="Google" tags={['test']} />
      </I18nProvider>,
    );
    expect(markup).toContain('Integration');
  });

  test('type badge shows MCP for mcp type', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Server" tags={['test']} />
      </I18nProvider>,
    );
    expect(markup).toContain('MCP');
  });

  test('type badge shows Skill for skill type', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="skill" title="My Skill" />
      </I18nProvider>,
    );
    expect(markup).toContain('Skill');
  });

  test('renders custom icon when provided', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Server" icon={<span data-testid="custom-icon">C</span>} />
      </I18nProvider>,
    );
    expect(markup).toContain('C');
  });

  test('renders action node', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Server" action={<button>Install</button>} />
      </I18nProvider>,
    );
    expect(markup).toContain('Install');
  });

  test('has button role for clickability', () => {
    const markup = renderToStaticMarkup(
      <I18nProvider>
        <ConnectorCard type="mcp" title="Server" />
      </I18nProvider>,
    );
    expect(markup).toContain('role="button"');
    expect(markup).toContain('tabindex="0"');
  });
});
