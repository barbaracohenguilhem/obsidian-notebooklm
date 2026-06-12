import { requestUrl } from 'obsidian';
import { ChatMessage, SourceNote, PodcastTranscript } from './types';

export class GeminiClient {
  private static getApiUrl(model: string, apiKey: string): string {
    return `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  }

  static async validateApiKey(apiKey: string, model: string = 'gemini-2.5-flash'): Promise<boolean> {
    try {
      const url = this.getApiUrl(model, apiKey);
      const payload = {
        contents: [{ role: 'user', parts: [{ text: 'ping' }] }]
      };

      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        throw: false,
      });

      return response.status === 200;
    } catch (e) {
      console.error('API key validation error:', e);
      return false;
    }
  }

  private static formatSourcesContext(sources: SourceNote[]): string {
    if (sources.length === 0) return '';
    
    let context = "Here are the source documents provided by the user for grounding:\n\n";
    sources.forEach((source, index) => {
      context += `=== SOURCE #${index + 1} ===\n`;
      context += `Title: ${source.title}\n`;
      context += `Path: ${source.path}\n`;
      context += `Content:\n${source.content}\n`;
      context += `=== END OF SOURCE #${index + 1} ===\n\n`;
    });
    
    return context;
  }

  static async chat(
    apiKey: string,
    model: string,
    messages: ChatMessage[],
    sources: SourceNote[],
    systemPrompt?: string
  ): Promise<string> {
    const url = this.getApiUrl(model, apiKey);
    
    // Set up standard system instructions
    const sourcesContext = this.formatSourcesContext(sources);
    const fullSystemInstruction = (systemPrompt || "You are a helpful research assistant.") + 
      (sourcesContext ? `\n\n${sourcesContext}\n\nCRITICAL: Answer the user's questions based ONLY on the source documents provided above. If the answer cannot be found in the sources, state that clearly rather than inventing facts.\n\nCitation instruction: Cite the source note you are referencing by using Obsidian wiki-links (e.g. [[Source Title]]) so the user can click them to navigate directly to their note. Only reference the source titles exactly as listed in the context, without extensions.` : "");

    // Format chat history for Gemini API
    // User is 'user', assistant is 'model'
    const contents = messages.map(msg => ({
      role: msg.role === 'user' ? 'user' : 'model',
      parts: [{ text: msg.content }]
    }));

    const payload = {
      contents,
      systemInstruction: {
        parts: [{ text: fullSystemInstruction }]
      },
      generationConfig: {
        temperature: 0.3,
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API returned error code ${response.status}: ${response.text}`);
      }

      const responseJson = response.json;
      const textResponse = responseJson.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!textResponse) {
        throw new Error('No response content returned from Gemini API');
      }

      return textResponse;
    } catch (error) {
      console.error('Gemini chat error:', error);
      throw error;
    }
  }

  static async generateSummary(
    apiKey: string,
    model: string,
    sources: SourceNote[]
  ): Promise<string> {
    const url = this.getApiUrl(model, apiKey);
    const sourcesContext = this.formatSourcesContext(sources);

    const prompt = `You are a research expert. Provide a highly detailed, professional, and comprehensive executive summary and structured outline based ONLY on the sources below. Organize your response in clear sections using Markdown.

${sourcesContext}

Summary and Outline:`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.2,
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      return response.json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Error generating summary:', e);
      throw e;
    }
  }

  static async generateFAQ(
    apiKey: string,
    model: string,
    sources: SourceNote[]
  ): Promise<string> {
    const url = this.getApiUrl(model, apiKey);
    const sourcesContext = this.formatSourcesContext(sources);

    const prompt = `Based ONLY on the sources provided below, compile a list of the most important Frequently Asked Questions (FAQs) and their corresponding answers. The FAQs should cover the key facts, themes, and details in the sources. Format the output in Markdown with bold questions and clean bullet points or paragraphs for answers.

${sourcesContext}

Frequently Asked Questions:`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      return response.json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Error generating FAQ:', e);
      throw e;
    }
  }

  static async generatePodcast(
    apiKey: string,
    model: string,
    sources: SourceNote[]
  ): Promise<PodcastTranscript> {
    const url = this.getApiUrl(model, apiKey);
    const sourcesContext = this.formatSourcesContext(sources);

    const prompt = `You are an AI podcast producer. Create a highly engaging, professional podcast transcript where two speakers, Sofia (the inquisitive host) and Lucas (the domain expert), discuss the source materials provided.
    
Guidelines:
1. Make the conversation flow naturally, with banter, verbal agreements (like "exactly", "wow", "right"), and intuitive explanations.
2. Translate complex topics from the sources into digestible metaphors and analogies.
3. The conversation should have a clear structure: introduction, exploration of key concepts from the sources, practical implications, and a concluding wrap-up.
4. Ensure the content is grounded STRICTLY in the source text.
5. Format the output strictly as a JSON object with a 'title' key and a 'transcript' key containing an array of dialogue entries.

${sourcesContext}

Remember: You MUST return a valid JSON object matching the schema below. Do not include markdown codeblocks or thinking blocks in the output, just the raw JSON object.
JSON Schema:
{
  "title": "Podcast Title",
  "transcript": [
    {
      "speaker": "Sofia",
      "dialogue": "Welcome to the show. Today we're diving into..."
    },
    {
      "speaker": "Lucas",
      "dialogue": "Thanks, Sofia. Yes, this material is fascinating because..."
    }
  ]
}`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.6,
        responseMimeType: "application/json"
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}: ${response.text}`);
      }

      const parsed: PodcastTranscript = JSON.parse(response.json.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      
      if (!parsed.transcript || !Array.isArray(parsed.transcript)) {
        throw new Error('Invalid podcast JSON structure returned');
      }

      return parsed;
    } catch (e) {
      console.error('Error generating podcast script:', e);
      throw e;
    }
  }

  static async generatePresentation(
    apiKey: string,
    model: string,
    sources: SourceNote[]
  ): Promise<string> {
    const url = this.getApiUrl(model, apiKey);
    const sourcesContext = this.formatSourcesContext(sources);

    const prompt = `Based ONLY on the sources provided below, generate a professional slide presentation in Markdown.
    Use Obsidian's slide separator "---" on a new line to separate each slide.
    Each slide should have:
    1. A clear header (e.g. "# Slide Title")
    2. Bullet points outlining key facts, arguments, or examples.
    Keep slides concise and focused. Do not add conversational text, just the slide content.

${sourcesContext}

Slide Presentation in Markdown:`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.4,
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      return response.json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Error generating presentation:', e);
      throw e;
    }
  }

  static async generateMindMap(
    apiKey: string,
    model: string,
    sources: SourceNote[]
  ): Promise<string> {
    const url = this.getApiUrl(model, apiKey);
    const sourcesContext = this.formatSourcesContext(sources);

    const prompt = `Based ONLY on the sources provided below, construct a visual Mind Map using Mermaid.js syntax.
    Use the Mermaid.js "mindmap" keyword. For example:
    \`\`\`mermaid
    mindmap
      root((Central Topic))
        Topic A
          Subtopic A1
          Subtopic A2
        Topic B
          Subtopic B1
    \`\`\`
    Make it highly detailed, capturing all primary themes and branches from the sources. Return ONLY the mermaid code block. Do not write introductory or explanatory text.

${sourcesContext}

Mermaid Mind Map:`;

    const payload = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
      }
    };

    try {
      const response = await requestUrl({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.status !== 200) {
        throw new Error(`Gemini API error ${response.status}`);
      }

      return response.json.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (e) {
      console.error('Error generating mind map:', e);
      throw e;
    }
  }
}

