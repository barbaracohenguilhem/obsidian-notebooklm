import * as React from 'react';
import { App, Component, MarkdownRenderer } from 'obsidian';

interface ObsidianMarkdownProps {
  app: App;
  markdown: string;
}

export const ObsidianMarkdown: React.FC<ObsidianMarkdownProps> = ({ app, markdown }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const componentRef = React.useRef<Component | null>(null);

  React.useEffect(() => {
    if (!containerRef.current) return;

    // Clear previous contents
    containerRef.current.empty();

    // Create a new component to bind lifecycle
    const component = new Component();
    component.load();
    componentRef.current = component;

    // Render markdown asynchronously
    const renderContent = async () => {
      try {
        if (containerRef.current) {
          await MarkdownRenderer.render(
            app,
            markdown,
            containerRef.current,
            '',
            component
          );
        }
      } catch (e) {
        console.error('Error rendering markdown natively in Obsidian:', e);
        if (containerRef.current) {
          containerRef.current.setText(markdown);
        }
      }
    };

    renderContent();

    // Cleanup component on unmount or updates
    return () => {
      if (componentRef.current) {
        componentRef.current.unload();
        componentRef.current = null;
      }
    };
  }, [app, markdown]);

  return <div ref={containerRef} className="markdown-rendered-panel" style={{ width: '100%' }} />;
};
