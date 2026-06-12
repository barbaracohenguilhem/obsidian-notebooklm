import { Plugin, PluginSettingTab, App, Setting, WorkspaceLeaf, ItemView } from 'obsidian';
import * as React from 'react';
import { createRoot, Root } from 'react-dom/client';
import { NotebookSettings } from './types';
import { GeminiClient } from './GeminiClient';
import { NotebookView } from './NotebookView';

export const VIEW_TYPE_NOTEBOOKLM = 'notebooklm-view';

const DEFAULT_SETTINGS: NotebookSettings = {
  apiKey: '',
  model: 'gemini-2.5-flash',
  systemPrompt: 'You are a helpful research assistant.'
};

export default class NotebookLMPlugin extends Plugin {
  declare settings: NotebookSettings;

  async onload() {
    await this.loadSettings();

    // Register custom leaf view
    this.registerView(
      VIEW_TYPE_NOTEBOOKLM,
      (leaf) => new NotebookLMView(leaf, this)
    );

    // Add ribbon icon to open the view
    this.addRibbonIcon('book-open', 'Open NotebookLM', () => {
      this.activateView();
    });

    // Add a command to open the view
    this.addCommand({
      id: 'open-notebooklm',
      name: 'Open NotebookLM Panel',
      callback: () => this.activateView(),
    });

    // Add settings tab
    this.addSettingTab(new NotebookLMSettingsTab(this.app, this));
  }

  async onunload() {
    this.app.workspace.detachLeavesOfType(VIEW_TYPE_NOTEBOOKLM);
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
    
    // Notify open views to update settings (e.g. by refreshing/re-rendering)
    this.app.workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOKLM).forEach(leaf => {
      if (leaf.view instanceof NotebookLMView) {
        leaf.view.refreshView();
      }
    });
  }

  async activateView() {
    const { workspace } = this.app;
    
    let leaf = workspace.getLeavesOfType(VIEW_TYPE_NOTEBOOKLM)[0];
    if (!leaf) {
      // Create a leaf on the right sidebar if not already open
      const rightLeaf = workspace.getRightLeaf(false);
      if (!rightLeaf) return;
      leaf = rightLeaf;
      await leaf.setViewState({
        type: VIEW_TYPE_NOTEBOOKLM,
        active: true,
      });
    }
    
    workspace.revealLeaf(leaf);
  }
}

export class NotebookLMView extends ItemView {
  root: Root | null = null;
  plugin: NotebookLMPlugin;

  constructor(leaf: WorkspaceLeaf, plugin: NotebookLMPlugin) {
    super(leaf);
    this.plugin = plugin;
  }

  getViewType(): string {
    return VIEW_TYPE_NOTEBOOKLM;
  }

  getDisplayText(): string {
    return 'NotebookLM';
  }

  getIcon(): string {
    return 'book-open';
  }

  async onOpen() {
    this.refreshView();
  }

  refreshView() {
    if (this.root) {
      this.root.unmount();
    }
    
    this.contentEl.empty();
    this.contentEl.addClass('notebooklm-view-container');
    
    this.root = createRoot(this.contentEl);
    this.root.render(
      React.createElement(NotebookView, {
        plugin: this.plugin,
        app: this.app,
      })
    );
  }

  async onClose() {
    if (this.root) {
      this.root.unmount();
      this.root = null;
    }
  }
}

class NotebookLMSettingsTab extends PluginSettingTab {
  plugin: NotebookLMPlugin;

  constructor(app: App, plugin: NotebookLMPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'NotebookLM Settings' });

    // API Key setting
    const apiKeySetting = new Setting(containerEl)
      .setName('Google Gemini API Key')
      .setDesc('Enter your personal Gemini API key from Google AI Studio.')
      .addText(text => text
        .setPlaceholder('AIzaSy...')
        .setValue(this.plugin.settings.apiKey)
        .onChange(async (value) => {
          this.plugin.settings.apiKey = value.trim();
          await this.plugin.saveSettings();
        }));

    // Status indicator container
    const statusEl = containerEl.createDiv({ cls: 'notebooklm-settings-status' });
    this.updateKeyStatus(statusEl);

    // Model setting
    new Setting(containerEl)
      .setName('Gemini Model')
      .setDesc('Choose which model to use. Pro is smarter, Flash is faster.')
      .addDropdown(dropdown => dropdown
        .addOption('gemini-2.5-flash', 'Gemini 2.5 Flash (Recommended)')
        .addOption('gemini-2.5-pro', 'Gemini 2.5 Pro (Best quality)')
        .addOption('gemini-2.0-flash-exp', 'Gemini 2.0 Flash')
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value;
          await this.plugin.saveSettings();
        }));

    // System Prompt setting
    new Setting(containerEl)
      .setName('System Prompt')
      .setDesc('Customize the default system prompt instructions.')
      .addTextArea(text => text
        .setPlaceholder('You are a helpful research assistant.')
        .setValue(this.plugin.settings.systemPrompt)
        .onChange(async (value) => {
          this.plugin.settings.systemPrompt = value;
          await this.plugin.saveSettings();
        }));

    // Add a button to test the key
    new Setting(containerEl)
      .setName('Test API Connection')
      .setDesc('Check if your API key works and can communicate with Gemini.')
      .addButton(btn => btn
        .setButtonText('Test Connection')
        .onClick(async () => {
          btn.setDisabled(true);
          btn.setButtonText('Testing...');
          statusEl.setText('Testing connection...');
          statusEl.className = 'notebooklm-settings-status loading';
          
          const isValid = await GeminiClient.validateApiKey(
            this.plugin.settings.apiKey,
            this.plugin.settings.model
          );
          
          btn.setDisabled(false);
          btn.setButtonText('Test Connection');
          
          if (isValid) {
            statusEl.setText('✓ API Connection Successful!');
            statusEl.className = 'notebooklm-settings-status success';
          } else {
            statusEl.setText('✗ Connection failed. Please check your API key.');
            statusEl.className = 'notebooklm-settings-status error';
          }
        }));
  }

  private updateKeyStatus(el: HTMLElement) {
    if (!this.plugin.settings.apiKey) {
      el.setText('API key is empty. Please enter a key.');
      el.className = 'notebooklm-settings-status warning';
    } else {
      el.setText('API key saved. Click "Test Connection" to verify.');
      el.className = 'notebooklm-settings-status';
    }
  }
}
