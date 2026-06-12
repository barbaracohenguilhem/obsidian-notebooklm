import * as React from 'react';
import { App, TFile } from 'obsidian';
import { Plus, Trash2, FileText, Search, FolderPlus } from 'lucide-react';
import { SourceNote } from '../types';

interface SourcesPanelProps {
  app: App;
  activeSources: SourceNote[];
  onAddSource: (note: SourceNote) => void;
  onRemoveSource: (path: string) => void;
}

export const SourcesPanel: React.FC<SourcesPanelProps> = ({
  app,
  activeSources,
  onAddSource,
  onRemoveSource,
}) => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<TFile[]>([]);
  const [showSuggestions, setShowSuggestions] = React.useState(false);

  // Filter vault notes based on search query
  React.useEffect(() => {
    if (!searchQuery) {
      setSuggestions([]);
      return;
    }

    const allFiles = app.vault.getMarkdownFiles();
    const query = searchQuery.toLowerCase();
    
    // Filter out files that are already added
    const filtered = allFiles.filter(file => {
      const isAlreadyAdded = activeSources.some(src => src.path === file.path);
      return !isAlreadyAdded && file.basename.toLowerCase().includes(query);
    });

    setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
  }, [searchQuery, activeSources, app]);

  const countWords = (text: string): number => {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const handleAddActiveNote = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
      alert('No active note open in Obsidian.');
      return;
    }

    // Check if already added
    if (activeSources.some(src => src.path === activeFile.path)) {
      alert('This note is already added as a source.');
      return;
    }

    try {
      const content = await app.vault.read(activeFile);
      const wordCount = countWords(content);
      
      onAddSource({
        path: activeFile.path,
        title: activeFile.basename,
        content,
        wordCount,
      });
    } catch (e) {
      console.error('Failed to read active note:', e);
    }
  };

  const handleAddActiveFolder = async () => {
    const activeFile = app.workspace.getActiveFile();
    if (!activeFile) {
      alert('No active note open in Obsidian.');
      return;
    }

    const parentFolder = activeFile.parent;
    if (!parentFolder) {
      alert('No active folder found.');
      return;
    }

    // Get markdown files directly inside this folder (non-recursive)
    const filesInFolder: TFile[] = [];
    parentFolder.children.forEach(child => {
      if (child instanceof TFile && child.extension === 'md') {
        const isAlreadyAdded = activeSources.some(src => src.path === child.path);
        if (!isAlreadyAdded) {
          filesInFolder.push(child);
        }
      }
    });

    if (filesInFolder.length === 0) {
      alert('No new markdown notes found in the active folder.');
      return;
    }

    try {
      let addedCount = 0;
      for (const file of filesInFolder) {
        const content = await app.vault.read(file);
        const wordCount = countWords(content);
        
        onAddSource({
          path: file.path,
          title: file.basename,
          content,
          wordCount,
        });
        addedCount++;
      }
    } catch (e) {
      console.error('Failed to read folder notes:', e);
    }
  };

  const handleSelectSuggestion = async (file: TFile) => {
    setSearchQuery('');
    setShowSuggestions(false);

    try {
      const content = await app.vault.read(file);
      const wordCount = countWords(content);
      
      onAddSource({
        path: file.path,
        title: file.basename,
        content,
        wordCount,
      });
    } catch (e) {
      console.error('Failed to read selected note:', e);
    }
  };

  return (
    <div className="notebooklm-sidebar-content">
      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button 
          className="mod-cta" 
          onClick={handleAddActiveNote}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 4px', fontSize: '0.85em' }}
        >
          <Plus size={14} />
          Current Note
        </button>
        <button 
          className="mod-cta" 
          onClick={handleAddActiveFolder}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '8px 4px', fontSize: '0.85em' }}
        >
          <FolderPlus size={14} />
          Active Folder
        </button>
      </div>

      {/* Note Search Box */}
      <div className="notebooklm-search-container">
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <Search size={14} style={{ position: 'absolute', left: '10px', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="notebooklm-search-input"
            style={{ paddingLeft: '32px' }}
            placeholder="Search notes in vault..."
            value={searchQuery}
            onFocus={() => setShowSuggestions(true)}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {showSuggestions && suggestions.length > 0 && (
          <div className="notebooklm-suggestions">
            {suggestions.map(file => (
              <div
                key={file.path}
                className="notebooklm-suggestion-item"
                onClick={() => handleSelectSuggestion(file)}
              >
                {file.basename}
              </div>
            ))}
          </div>
        )}
        
        {showSuggestions && searchQuery && suggestions.length === 0 && (
          <div className="notebooklm-suggestions" style={{ padding: '10px', fontSize: '0.85em', color: 'var(--text-muted)' }}>
            No matching notes found
          </div>
        )}
      </div>

      {/* Active Sources List */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
        <div style={{ fontSize: '0.8em', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Sources ({activeSources.length})
        </div>

        {activeSources.length === 0 ? (
          <div className="notebooklm-empty-state" style={{ padding: '20px 10px', border: '1px dashed var(--border-color)', borderRadius: '8px' }}>
            <FileText size={24} className="notebooklm-empty-state-icon" />
            <p style={{ fontSize: '0.8em', margin: 0 }}>No sources added yet. Add the active note or search vault notes.</p>
          </div>
        ) : (
          activeSources.map(source => (
            <div key={source.path} className="notebooklm-source-card">
              <div className="notebooklm-source-card-header">
                <div className="notebooklm-source-card-title">{source.title}</div>
                <button
                  className="notebooklm-source-card-remove"
                  onClick={() => onRemoveSource(source.path)}
                  title="Remove Source"
                >
                  <Trash2 size={13} />
                </button>
              </div>
              <div className="notebooklm-source-card-meta">
                {source.wordCount.toLocaleString()} words
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
