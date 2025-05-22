import { App, PluginSettingTab, Setting } from 'obsidian';
import SemanticSearchPlugin from './main';

export interface SemanticSearchSettings {
  astraToken: string;
  astraEndpoint: string;
	astraKeyspace: string;
}

export const DEFAULT_SETTINGS: SemanticSearchSettings = {
  astraToken: '',
  astraEndpoint: '',
  astraKeyspace: 'default_keyspace'
};

export class SemanticSearchSettingTab extends PluginSettingTab {
  plugin: SemanticSearchPlugin;

  constructor(app: App, plugin: SemanticSearchPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;
    const settings = this.plugin.settings;

    containerEl.empty();
    containerEl.createEl('h2', { text: 'Semantic Search Settings' });

    new Setting(containerEl)
      .setName('Astra Token')
      .setDesc('Your Astra DB access token (starts with `AstraCS:`)')
      .addText(text =>
        text
          .setPlaceholder('AstraCS:...')
          .setValue(settings.astraToken)
          .onChange(async(value) => {
            settings.astraToken = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Astra Endpoint')
      .setDesc('Your Astra DB endpoint (e.g. https://...apps.astra.datastax.com)')
      .addText(text =>
        text
          .setPlaceholder('https://...apps.astra.datastax.com')
          .setValue(settings.astraEndpoint)
          .onChange(async(value) => {
            settings.astraEndpoint = value;
            await this.plugin.saveSettings();
          })
      );

    new Setting(containerEl)
      .setName('Keyspace')
      .setDesc('Keyspace to store notes in (e.g. `default_keyspace`)')
      .addText(text =>
        text
          .setPlaceholder('e.g. default_keyspace')
          .setValue(settings.astraKeyspace)
          .onChange(async(value) => {
            settings.astraKeyspace = value;
            await this.plugin.saveSettings();
          })
      );
  }
}

