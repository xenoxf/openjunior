import React from 'react';
import { ConnectorsSidebar, type ConnectorTab } from './connectors-sidebar';
import { IntegrationsTab } from './IntegrationsTab';
import { MCPTab } from './MCPTab';
import { SkillsTab } from './SkillsTab';

const TAB_COMPONENTS: Record<ConnectorTab, React.FC> = {
  integrations: IntegrationsTab,
  mcp: MCPTab,
  skills: SkillsTab,
};

export const ConnectorsPage: React.FC = () => {
  const [activeTab, setActiveTab] = React.useState<ConnectorTab>('integrations');
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);

  const TabContent = TAB_COMPONENTS[activeTab];

  return (
    <div className="flex h-full">
      <ConnectorsSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        collapsed={sidebarCollapsed}
        onCollapseToggle={() => setSidebarCollapsed((prev) => !prev)}
      />

      <div className="flex flex-1 flex-col min-w-0">

        <TabContent />
      </div>
    </div>
  );
};
