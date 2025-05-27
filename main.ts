import { Notice, Plugin, TFile, WorkspaceLeaf } from 'obsidian';
import { SemanticSearchSettingTab, DEFAULT_SETTINGS, SemanticSearchSettings } from './settings';
import { SemanticSearchPanel, VIEW_TYPE_SEMANTIC_SEARCH } from './SemanticSearchView';
import { syncNote, deleteNote } from './backend';

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
    
    this.registerEvent(
      this.app.vault.on('modify', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          const path = file.path;
    
          debouncePerPath(path, () => {
            if (!this.app.vault.getAbstractFileByPath(path)) {
              console.log(`[SKIPPED] File ${path} was deleted before sync`);
              return;
            }
    
            this.app.vault.read(file)
              .then((content) => syncNote({ path, content }, this.settings))
              .catch(err => {
                console.log('[SYNC ERROR]', path, err);
              });
          });
        }
      })
    );
    

    this.registerEvent(
      this.app.vault.on(
        'rename',
        (file, oldPath) => {
          if (file instanceof TFile && file.extension === 'md') {
            const path = file.path;

            deleteNote(oldPath, this.settings)
              .then(() => this.app.vault.read(file))
              .then((content) => syncNote({ path, content }, this.settings))
              .catch(err => {
                console.log('[SYNC ERROR]', 'Error syncing note', file.path, ':', err);
                new Notice(`Failed to sync note: ${file.path}`);
              });
          }
        }
      )
    );

    this.registerEvent(
      this.app.vault.on('create', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          const path = file.path;
            this.app.vault.read(file)
              .then((content) => syncNote({ path, content }, this.settings))
              .catch(err => {
                console.log('[SYNC ERROR]', 'Error syncing note', file.path, ':', err);
                new Notice(`Failed to sync note: ${file.path}`);
              });
        }
      })
    );


    this.registerEvent(
      this.app.vault.on('delete', (file) => {
        if (file instanceof TFile && file.extension === 'md') {
          deleteNote(file.path, this.settings).catch(err => {
            console.log('[DELETE ERROR]', 'Error deleting note', err);
            new Notice(`Failed to sync note: ${file.path}`);
          });
        }
      })
    );
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

const debounceMap = new Map<string, ReturnType<typeof setTimeout>>();

function debouncePerPath(path: string, fn: () => void, delay = 5000) {
  if (debounceMap.has(path)) clearTimeout(debounceMap.get(path));
  const timeout = setTimeout(() => {
    debounceMap.delete(path);
    fn();
  }, delay);
  debounceMap.set(path, timeout);
}
