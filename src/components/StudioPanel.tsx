import * as React from 'react';
import { App } from 'obsidian';
import { BookOpen, HelpCircle, Radio, Play, Pause, Copy, Check, FileDown, Presentation, Workflow } from 'lucide-react';
import { SourceNote, PodcastTranscript } from '../types';
import { GeminiClient } from '../GeminiClient';
import { ObsidianMarkdown } from './ObsidianMarkdown';

interface StudioPanelProps {
  app: App;
  apiKey: string;
  model: string;
  activeSources: SourceNote[];
  isLoading: boolean;
  setIsLoading: (isLoading: boolean) => void;
}

export const StudioPanel: React.FC<StudioPanelProps> = ({
  app,
  apiKey,
  model,
  activeSources,
  isLoading,
  setIsLoading,
}) => {
  const [resultType, setResultType] = React.useState<'none' | 'summary' | 'faq' | 'presentation' | 'mindmap' | 'podcast'>('none');
  const [textContent, setTextContent] = React.useState('');
  const [podcastScript, setPodcastScript] = React.useState<PodcastTranscript | null>(null);
  
  // Audio Playback states
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [currentTurnIdx, setCurrentTurnIdx] = React.useState(0);
  const [playbackRate, setPlaybackRate] = React.useState(1.0);
  const [copied, setCopied] = React.useState(false);
  const [exported, setExported] = React.useState(false);
  
  const synthRef = React.useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' ? window.speechSynthesis : null
  );
  
  // Clean up speech synthesis when component unmounts
  React.useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleGenerateSummary = async () => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note.');
      return;
    }
    
    setIsLoading(true);
    setResultType('summary');
    setTextContent('Generating summary...');
    setPodcastScript(null);
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      const summary = await GeminiClient.generateSummary(apiKey, model, activeSources);
      setTextContent(summary);
    } catch (e) {
      console.error(e);
      setTextContent(`Error generating summary: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateFAQ = async () => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note.');
      return;
    }
    
    setIsLoading(true);
    setResultType('faq');
    setTextContent('Generating FAQ...');
    setPodcastScript(null);
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      const faq = await GeminiClient.generateFAQ(apiKey, model, activeSources);
      setTextContent(faq);
    } catch (e) {
      console.error(e);
      setTextContent(`Error generating FAQ: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note.');
      return;
    }
    
    setIsLoading(true);
    setResultType('presentation');
    setTextContent('Generating presentation slides...');
    setPodcastScript(null);
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      const slides = await GeminiClient.generatePresentation(apiKey, model, activeSources);
      setTextContent(slides);
    } catch (e) {
      console.error(e);
      setTextContent(`Error generating slides: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateMindMap = async () => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note.');
      return;
    }
    
    setIsLoading(true);
    setResultType('mindmap');
    setTextContent('Generating visual mind map...');
    setPodcastScript(null);
    setIsPlaying(false);
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      const mindmap = await GeminiClient.generateMindMap(apiKey, model, activeSources);
      setTextContent(mindmap);
    } catch (e) {
      console.error(e);
      setTextContent(`Error generating mind map: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePodcast = async () => {
    if (activeSources.length === 0) {
      alert('Please add at least one source note.');
      return;
    }
    
    setIsLoading(true);
    setResultType('podcast');
    setTextContent('');
    setPodcastScript(null);
    setIsPlaying(false);
    setCurrentTurnIdx(0);
    if (synthRef.current) synthRef.current.cancel();
    
    try {
      const script = await GeminiClient.generatePodcast(apiKey, model, activeSources);
      setPodcastScript(script);
    } catch (e) {
      console.error(e);
      setTextContent(`Error generating podcast script: ${e instanceof Error ? e.message : 'Unknown error'}`);
      setResultType('summary'); // Show error inside normal container
    } finally {
      setIsLoading(false);
    }
  };

  // Speech Synthesis Control
  const playTurn = (idx: number, rate: number, shouldContinue: boolean) => {
    if (!synthRef.current || !podcastScript || idx >= podcastScript.transcript.length) {
      setIsPlaying(false);
      setCurrentTurnIdx(0);
      return;
    }

    synthRef.current.cancel();

    const turn = podcastScript.transcript[idx];
    const utterance = new SpeechSynthesisUtterance(turn.dialogue);

    const voices = synthRef.current.getVoices();
    
    let sofiaVoice = voices.find(v => v.name.toLowerCase().includes('samantha') || v.name.toLowerCase().includes('karen') || v.name.toLowerCase().includes('susan')) || voices[0];
    let lucasVoice = voices.find(v => v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('alex') || v.name.toLowerCase().includes('moira')) || voices[1] || voices[0];

    const ptSofia = voices.find(v => v.lang.startsWith('pt') && (v.name.toLowerCase().includes('maria') || v.name.toLowerCase().includes('luciana') || v.name.toLowerCase().includes('joana')));
    const ptLucas = voices.find(v => v.lang.startsWith('pt') && (v.name.toLowerCase().includes('daniel') || v.name.toLowerCase().includes('felipe') || v.name.toLowerCase().includes('helio')));
    
    if (ptSofia) sofiaVoice = ptSofia;
    if (ptLucas) lucasVoice = ptLucas;

    const isSofia = turn.speaker.toLowerCase() === 'sofia';
    utterance.voice = isSofia ? sofiaVoice : lucasVoice;
    
    utterance.pitch = isSofia ? 1.15 : 0.9;
    utterance.rate = rate;

    utterance.onend = () => {
      if (shouldContinue) {
        const nextIdx = idx + 1;
        if (nextIdx < podcastScript.transcript.length) {
          setCurrentTurnIdx(nextIdx);
          playTurn(nextIdx, rate, true);
        } else {
          setIsPlaying(false);
          setCurrentTurnIdx(0);
        }
      }
    };

    utterance.onerror = (e) => {
      console.error('Speech error:', e);
      setIsPlaying(false);
    };

    synthRef.current.speak(utterance);
  };

  const handleTogglePlay = () => {
    if (!podcastScript) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    } else {
      setIsPlaying(true);
      playTurn(currentTurnIdx, playbackRate, true);
    }
  };

  const handleRateChange = (newRate: number) => {
    setPlaybackRate(newRate);
    if (isPlaying) {
      playTurn(currentTurnIdx, newRate, true);
    }
  };

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(textContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyToNewNote = async () => {
    let typeName = 'Summary';
    if (resultType === 'faq') typeName = 'FAQ';
    if (resultType === 'presentation') typeName = 'Presentation';
    if (resultType === 'mindmap') typeName = 'MindMap';

    const title = `NotebookLM - ${typeName} (${new Date().toLocaleDateString().replace(/\//g, '-')})`;
    try {
      let filename = `${title}.md`;
      let fileExists = await checkFileExists(filename);
      let count = 1;
      while (fileExists) {
        filename = `${title} (${count}).md`;
        fileExists = await checkFileExists(filename);
        count++;
      }

      const fileContent = `# ${title}\n\n${textContent}\n\n*Generated with Obsidian NotebookLM*`;
      await app.vault.create(filename, fileContent);
      setExported(true);
      setTimeout(() => setExported(false), 2000);
    } catch (e) {
      console.error(e);
      alert('Failed to create note in vault: ' + (e instanceof Error ? e.message : String(e)));
    }
  };

  const checkFileExists = async (path: string): Promise<boolean> => {
    try {
      const files = app.vault.getFiles();
      return files.some((f: any) => f.path === path);
    } catch (e) {
      return false;
    }
  };

  const getResultTitle = () => {
    switch(resultType) {
      case 'summary': return 'Summary & Guide';
      case 'faq': return 'Frequently Asked Questions';
      case 'presentation': return 'Presentation Slides';
      case 'mindmap': return 'Concept Mind Map';
      default: return 'Result';
    }
  };

  return (
    <div className="notebooklm-studio-pane">
      {/* Studio Tools Grid */}
      <div className="notebooklm-studio-grid">
        <button className="notebooklm-studio-btn" onClick={handleGenerateSummary} disabled={isLoading}>
          <BookOpen size={20} style={{ color: 'var(--text-accent)' }} />
          <div className="notebooklm-studio-btn-title">Summary Guide</div>
          <div className="notebooklm-studio-btn-desc">Concise structured overview</div>
        </button>

        <button className="notebooklm-studio-btn" onClick={handleGenerateFAQ} disabled={isLoading}>
          <HelpCircle size={20} style={{ color: 'var(--text-accent)' }} />
          <div className="notebooklm-studio-btn-title">FAQ Sheet</div>
          <div className="notebooklm-studio-btn-desc">Key questions & answers</div>
        </button>

        <button className="notebooklm-studio-btn" onClick={handleGeneratePresentation} disabled={isLoading}>
          <Presentation size={20} style={{ color: 'var(--text-accent)' }} />
          <div className="notebooklm-studio-btn-title">Slides Brief</div>
          <div className="notebooklm-studio-btn-desc">Create slide deck structure</div>
        </button>

        <button className="notebooklm-studio-btn" onClick={handleGenerateMindMap} disabled={isLoading}>
          <Workflow size={20} style={{ color: 'var(--text-accent)' }} />
          <div className="notebooklm-studio-btn-title">Concept Map</div>
          <div className="notebooklm-studio-btn-desc">Generate Mermaid.js mindmap</div>
        </button>

        <button className="notebooklm-studio-btn" onClick={handleGeneratePodcast} disabled={isLoading} style={{ gridColumn: 'span 2' }}>
          <Radio size={20} style={{ color: 'var(--text-accent)' }} />
          <div className="notebooklm-studio-btn-title">Audio Brief</div>
          <div className="notebooklm-studio-btn-desc">Generate Sofia & Lucas synthetic podcast conversation</div>
        </button>
      </div>

      {/* Result Display: Summary / FAQ / Slides / Mind Map */}
      {resultType !== 'none' && resultType !== 'podcast' && (
        <div className="notebooklm-studio-result">
          <div className="notebooklm-studio-result-header">
            <span className="notebooklm-studio-result-title">
              {getResultTitle()}
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button 
                className="notebooklm-collapse-btn" 
                onClick={handleCopyToClipboard}
                title="Copy to Clipboard"
                style={{ padding: '4px 8px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {copied ? <Check size={12} style={{ color: '#00b450' }} /> : <Copy size={12} />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button 
                className="notebooklm-collapse-btn" 
                onClick={handleCopyToNewNote}
                title="Save as New Note"
                style={{ padding: '4px 8px', fontSize: '0.8em', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {exported ? <Check size={12} style={{ color: '#00b450' }} /> : <FileDown size={12} />}
                {exported ? 'Saved' : 'Save Note'}
              </button>
            </div>
          </div>
          
          <div className="notebooklm-studio-result-content">
            <ObsidianMarkdown app={app} markdown={textContent} />
          </div>
        </div>
      )}

      {/* Result Display: Podcast Player */}
      {resultType === 'podcast' && podcastScript && (
        <div className="notebooklm-audio-player">
          <div className="notebooklm-audio-player-main">
            <button className="notebooklm-play-btn" onClick={handleTogglePlay}>
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '3px' }} />}
            </button>

            <div className="notebooklm-audio-player-info">
              <div className="notebooklm-audio-player-title">{podcastScript.title}</div>
              <div className="notebooklm-audio-player-speakers">
                Hosts: Sofia (Inquisitive Co-host) & Lucas (Domain Expert)
              </div>
            </div>

            <div className={`podcast-wave ${isPlaying ? 'playing' : ''}`}>
              <div className="podcast-wave-bar" />
              <div className="podcast-wave-bar" />
              <div className="podcast-wave-bar" />
              <div className="podcast-wave-bar" />
              <div className="podcast-wave-bar" />
            </div>
          </div>

          <div className="notebooklm-audio-subtitle-box">
            <div className="notebooklm-audio-subtitle-speaker">
              {podcastScript.transcript[currentTurnIdx]?.speaker}
            </div>
            <div className="notebooklm-audio-subtitle-text">
              "{podcastScript.transcript[currentTurnIdx]?.dialogue}"
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8em', borderTop: '1px solid rgba(var(--mono-rgb-100), 0.08)', paddingTop: '10px' }}>
            <span style={{ color: 'var(--text-muted)' }}>
              Turn {currentTurnIdx + 1} of {podcastScript.transcript.length}
            </span>
            <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-muted)' }}>Speed:</span>
              {[1.0, 1.25, 1.5].map(rate => (
                <button
                  key={rate}
                  onClick={() => handleRateChange(rate)}
                  style={{
                    padding: '2px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--border-color)',
                    background: playbackRate === rate ? 'var(--interactive-accent)' : 'none',
                    color: playbackRate === rate ? 'var(--text-on-accent)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.95em'
                  }}
                >
                  {rate}x
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
