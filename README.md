# Obsidian NotebookLM Plugin

An AI-powered research assistant for your notes, inspired by Google NotebookLM and powered by Google Gemini API. Ground your AI assistant in notes, chat, and generate presentations, concept mind maps, and audio briefs (podcasts) directly inside Obsidian using your own API key.

![Obsidian NotebookLM UI](https://raw.githubusercontent.com/google-deepmind/obsidian-notebooklm/main/logo.png)

## Features

- **Sources Context Management**: 
  - **Current Note**: Add the active note to your grounding sources.
  - **Active Folder**: Add all markdown files inside the active note's folder as grounding sources with one click.
  - **Search Vault**: Search and select any notes from your vault to build a notebook context.
- **Grounded Chat**: 
  - Chat with an AI assistant that answers questions *only* using your selected source documents.
  - **Estimated Token Count**: Displays estimated token usage in the grounding status, similar to Google NotebookLM.
  - **Clear Chat**: Easily clear chat history to start a new session.
  - **Obsidian Citations**: Gemini is instructed to cite references using standard wiki-links, e.g. `[[Source Note]]`. Since the chat renders using Obsidian's native rendering engine, these citations appear as active links that open the source note instantly in your editor when clicked!
- **Studio Guides**:
  - **Summary Guide**: Generates comprehensive summaries and outlines of your sources.
  - **FAQ Sheet**: Extracts frequently asked questions and answers from your notes.
  - **Slides Brief**: Generates slide layouts in Markdown (separated by `---` slide dividers) based on your notes, perfect for Obsidian's presentation mode.
  - **Concept Map**: Generates detailed visual Mind Maps using Mermaid.js syntax. Thanks to Obsidian's native renderer integration, the mind maps are displayed visually directly in the plugin panel!
  - **Save to Vault**: Export summaries, FAQs, slides, or mind maps back into your Obsidian vault as new markdown notes with a single click.
- **Audio Briefs (Podcast Player)**:
  - Generates a simulated host/guest (Sofia & Lucas) conversation based on your sources.
  - Custom audio player with play/pause, speed controls (1x, 1.25x, 1.5x), and live subtitle highlight.
  - Uses browser **Speech Synthesis (Web Speech API)** to read the dialogue turns in real-time with two distinct system voices, synced with an animated sound wave.
- **Personal API Keys**: Full privacy and flexibility by using your own Google Gemini API key (e.g. `gemini-2.5-flash`, `gemini-2.5-pro`). No middleman server.

## Installation

### Manual Installation
1. Download the release files: `main.js`, `manifest.json`, and `styles.css`.
2. Locate your Obsidian vault's plugin directory: `<vault-folder>/.obsidian/plugins/`.
3. Create a new folder named `obsidian-notebooklm`.
4. Place the three downloaded files inside that folder.
5. In Obsidian, go to **Settings** -> **Community Plugins**, click the refresh icon, and enable **Obsidian NotebookLM**.

## Configuration

1. Get a Gemini API key from [Google AI Studio](https://aistudio.google.com/).
2. Open Obsidian settings and navigate to **Obsidian NotebookLM** under Community Plugins.
3. Paste your API key.
4. Select your model (`gemini-2.5-flash` or `gemini-2.5-pro`).
5. Click **Test Connection** to verify connection status.

## Development

If you want to modify or compile this plugin:

### Dependencies
Install the package dependencies:
```bash
npm install
```

### Dev Mode
To compile the TypeScript/React code and watch for changes:
```bash
npm run dev
```

### Build Production
To create a production-optimized build:
```bash
npm run build
```

This compiles your code into `main.js` and `styles.css`. Make sure to copy `main.js`, `manifest.json`, and `styles.css` into your Obsidian vault's plugin directory to test your changes.

## License

This project is licensed under the MIT License.
