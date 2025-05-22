import { Plugin, WorkspaceLeaf } from 'obsidian';
import { SemanticSearchSettingTab, DEFAULT_SETTINGS, SemanticSearchSettings } from './settings';
import { SemanticSearchPanel, VIEW_TYPE_SEMANTIC_SEARCH } from './SemanticSearchView';

// Hack for CORS requests
import nfetch, { Headers, Request, Response } from 'node-fetch';
// @ts-ignore
globalThis.fetch = nfetch;
// @ts-ignore
globalThis.Headers = Headers;
// @ts-ignore
globalThis.Request = Request;
// @ts-ignore
globalThis.Response = Response;

export default class SemanticSearchPlugin extends Plugin {
  settings: SemanticSearchSettings;

  async onload() {
    await this.loadSettings();

    this.addSettingTab(new SemanticSearchSettingTab(this.app, this));

    this.registerView(
      VIEW_TYPE_SEMANTIC_SEARCH,
      (leaf) => new SemanticSearchPanel(leaf, this.settings)
    );

    this.addRibbonIcon('search', 'Open Semantic Search', async() => {
      await this.activateView();
    });
		
    this.addCommand({
      id: 'open-semantic-search-ui',
      name: 'Open Semantic Search Panel',
      callback: async() => {
        await this.activateView();
      }
    });
		
  }

  async activateView() {
    const { workspace } = this.app;
	
    workspace.detachLeavesOfType(VIEW_TYPE_SEMANTIC_SEARCH);
	
    const leaf = workspace.getRightLeaf(false);
    await leaf!.setViewState({
      type: VIEW_TYPE_SEMANTIC_SEARCH,
      active: true
    });
	
    workspace.revealLeaf(leaf as WorkspaceLeaf);
  }
	

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}

