import * as React from 'react';
import { App } from 'obsidian';
import { BookOpen, MessageSquare, Sparkles, SidebarOpen, SidebarClose, Key, AlertTriangle } from 'lucide-react';
import NotebookLMPlugin from './main';
import { SourceNote, ChatMessage } from './types';
import { SourcesPanel } from './components/SourcesPanel';
import { ChatPanel } from './components/ChatPanel';
import { StudioPanel } from './components/StudioPanel';

interface NotebookViewProps {
  plugin: NotebookLMPlugin;
  app: App;
}

export const NotebookView: React.FC<NotebookViewProps> = ({ plugin, app }) => {
  const [apiKey, setApiKey] = React.useState(plugin.settings.apiKey);
  const [model, setModel] = React.useState(plugin.settings.model);
  const [systemPrompt, setSystemPrompt] = React.useState(plugin.settings.systemPrompt);

  const [activeSources, setActiveSources] = React.useState<SourceNote[]>([]);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [activeTab, setActiveTab] = React.useState<'chat' | 'studio'>('chat');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [loadingText, setLoadingText] = React.useState('Loading...');

  // Update local settings if settings are updated inside Obsidian
  React.useEffect(() => {
    setApiKey(plugin.settings.apiKey);
    setModel(plugin.settings.model);
    setSystemPrompt(plugin.settings.systemPrompt);
  }, [plugin.settings.apiKey, plugin.settings.model, plugin.settings.systemPrompt]);

  const handleAddSource = (note: SourceNote) => {
    setActiveSources(prev => {
      // Prevent duplicates
      if (prev.some(src => src.path === note.path)) return prev;
      return [...prev, note];
    });
  };

  const handleRemoveSource = (path: string) => {
    setActiveSources(prev => prev.filter(src => src.path !== path));
  };

  const handleOpenSettings = () => {
    try {
      const setting = (app as any).setting;
      if (setting) {
        setting.open();
        setting.openTabById(plugin.manifest.id);
      }
    } catch (e) {
      console.error('Failed to open plugin settings programmatically:', e);
      alert('Please open Obsidian Settings -> Community Plugins -> Obsidian NotebookLM to set your API Key.');
    }
  };

  // If no API key is specified, show warning panel
  if (!apiKey) {
    return (
      <div className="notebooklm-api-warning">
        <AlertTriangle size={36} style={{ color: 'var(--text-warning)' }} />
        <div className="notebooklm-warning-box">
          <div className="notebooklm-warning-title">API Key Required</div>
          <div className="notebooklm-warning-desc">
            To use Obsidian NotebookLM, you must configure your Google Gemini API Key in the plugin settings page.
          </div>
        </div>
        <button className="notebooklm-settings-link-btn" onClick={handleOpenSettings}>
          <Key size={14} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
          Configure API Key
        </button>
      </div>
    );
  }

  // Orchestrate loading messages depending on active operations
  const triggerLoading = (loading: boolean, text: string = 'Loading...') => {
    setLoadingText(text);
    setIsLoading(loading);
  };

  return (
    <div className="notebooklm-main-layout">
      {/* Left Sidebar: Sources list */}
      <div className={`notebooklm-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="notebooklm-sidebar-header">
          <span>Sources Context</span>
          <button 
            className="notebooklm-collapse-btn" 
            onClick={() => setIsSidebarCollapsed(true)}
            title="Collapse Sidebar"
          >
            <SidebarClose size={14} />
          </button>
        </div>
        <SourcesPanel
          app={app}
          activeSources={activeSources}
          onAddSource={handleAddSource}
          onRemoveSource={handleRemoveSource}
        />
      </div>

      {/* Main Panel Content */}
      <div className="notebooklm-content">
        {/* Header toolbar */}
        <div className="notebooklm-header">
          <div className="notebooklm-title-section">
            {isSidebarCollapsed && (
              <button 
                className="notebooklm-collapse-btn" 
                onClick={() => setIsSidebarCollapsed(false)}
                title="Expand Sidebar"
              >
                <SidebarOpen size={14} />
              </button>
            )}
            <span style={{ fontWeight: 600, fontSize: '0.95em', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <BookOpen size={16} style={{ color: 'var(--interactive-accent)' }} />
              NotebookLM
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="notebooklm-nav-tabs">
            <button 
              className={`notebooklm-tab ${activeTab === 'chat' ? 'active' : ''}`}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare size={13} />
              Chat
            </button>
            <button 
              className={`notebooklm-tab ${activeTab === 'studio' ? 'active' : ''}`}
              onClick={() => setActiveTab('studio')}
            >
              <Sparkles size={13} />
              Studio
            </button>
          </div>
        </div>

        {/* Tab views */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
          {activeTab === 'chat' ? (
            <ChatPanel
              app={app}
              apiKey={apiKey}
              model={model}
              activeSources={activeSources}
              messages={messages}
              setMessages={setMessages}
              systemPrompt={systemPrompt}
              isLoading={isLoading}
              setIsLoading={(loading) => triggerLoading(loading, 'Thinking...')}
            />
          ) : (
            <StudioPanel
              app={app}
              apiKey={apiKey}
              model={model}
              activeSources={activeSources}
              isLoading={isLoading}
              setIsLoading={(loading) => triggerLoading(loading, 'Generating content from sources...')}
            />
          )}

          {/* Beautiful Glassmorphic Loader Overlay */}
          {isLoading && (
            <div className="notebooklm-loading-overlay">
              <div className="notebooklm-spinner" />
              <div className="notebooklm-loading-text">{loadingText}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
