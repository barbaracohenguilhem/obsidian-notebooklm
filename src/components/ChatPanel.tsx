import * as React from 'react';
import { App } from 'obsidian';
import { Send, FileSearch, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';
import { ChatMessage, SourceNote } from '../types';
import { GeminiClient } from '../GeminiClient';
import { ObsidianMarkdown } from './ObsidianMarkdown';

interface ChatPanelProps {
  app: App;
  apiKey: string;
  model: string;
  activeSources: SourceNote[];
  messages: ChatMessage[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  systemPrompt: string;
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const ChatPanel: React.FC<ChatPanelProps> = ({
  app,
  apiKey,
  model,
  activeSources,
  messages,
  setMessages,
  systemPrompt,
  isLoading,
  setIsLoading,
}) => {
  const [input, setInput] = React.useState('');
  const chatEndRef = React.useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of chat
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const countTotalWords = () => {
    return activeSources.reduce((sum, src) => sum + src.wordCount, 0);
  };

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const response = await GeminiClient.chat(
        apiKey,
        model,
        updatedMessages,
        activeSources,
        systemPrompt
      );

      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: response,
        timestamp: Date.now(),
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (e) {
      console.error('Chat error:', e);
      const errorMessage: ChatMessage = {
        role: 'assistant',
        content: `Error: Failed to connect to Gemini API. Please check your API key in settings or verify connection status.\n\nDetails: ${e instanceof Error ? e.message : 'Unknown error'}`,
        timestamp: Date.now(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
    }
  };

  const handleQuickPrompt = (promptType: 'summary' | 'questions' | 'gaps') => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note first.');
      return;
    }

    let prompt = '';
    if (promptType === 'summary') {
      prompt = 'Provide a brief, high-level summary of the key themes in our sources.';
    } else if (promptType === 'questions') {
      prompt = 'What are 3 interesting questions we can answer using these sources?';
    } else if (promptType === 'gaps') {
      prompt = 'Are there any apparent contradictions or gaps in information across these sources?';
    }

    handleSend(prompt);
  };

  return (
    <div className="notebooklm-chat-pane">
      {/* Grounding Banner */}
      <div className="notebooklm-grounding-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="notebooklm-grounding-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <FileSearch size={14} />
          {activeSources.length > 0 ? (
            <span>Grounded in {activeSources.length} sources (~{Math.round(countTotalWords() * 1.35).toLocaleString()} tokens)</span>
          ) : (
            <span style={{ color: 'var(--text-warning)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertCircle size={14} /> No sources added (using general knowledge)
            </span>
          )}
        </div>
        {messages.length > 0 && (
          <button 
            className="notebooklm-collapse-btn" 
            onClick={() => setMessages([])} 
            title="Clear Chat History"
            style={{ padding: '2px 6px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px', height: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Messages History */}
      <div className="notebooklm-chat-history">
        {messages.length === 0 ? (
          <div className="notebooklm-empty-state" style={{ marginTop: '40px' }}>
            <Sparkles size={32} className="notebooklm-empty-state-icon" style={{ color: 'var(--interactive-accent)' }} />
            <h3>Ask questions about your sources</h3>
            <p style={{ maxWidth: '280px', fontSize: '0.85em' }}>
              Your queries are grounded in the active notes. You can summarize, extract information, or search for connections.
            </p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`notebooklm-chat-msg ${msg.role}`}>
              {msg.role === 'user' ? (
                <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.45' }}>{msg.content}</div>
              ) : (
                <ObsidianMarkdown app={app} markdown={msg.content} />
              )}
              <div className="notebooklm-chat-msg-meta">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Prompt Suggestions */}
      {activeSources.length > 0 && !isLoading && (
        <div className="notebooklm-quick-prompts">
          <button className="notebooklm-quick-prompt-btn" onClick={() => handleQuickPrompt('summary')}>
            <Sparkles size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Summarize Themes
          </button>
          <button className="notebooklm-quick-prompt-btn" onClick={() => handleQuickPrompt('questions')}>
            <HelpCircle size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Key Questions
          </button>
          <button className="notebooklm-quick-prompt-btn" onClick={() => handleQuickPrompt('gaps')}>
            <AlertCircle size={11} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
            Contradictions/Gaps
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="notebooklm-chat-input-bar">
        <textarea
          className="notebooklm-chat-textarea"
          placeholder={activeSources.length > 0 ? "Ask a question about your sources..." : "Add sources or ask a general question..."}
          value={input}
          disabled={isLoading}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button
          className="notebooklm-chat-send-btn"
          disabled={!input.trim() || isLoading}
          onClick={() => handleSend(input)}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
};
