import { App, ItemView, TFile, WorkspaceLeaf } from 'obsidian';
import { createRoot, Root } from 'react-dom/client';
import React, { useState } from 'react';
import { runSemanticSearch, syncNotes } from './backend';
import type { SemanticSearchSettings } from './settings';

export const VIEW_TYPE_SEMANTIC_SEARCH = 'semantic-search-view';

export class SemanticSearchPanel extends ItemView {
  root: Root | null = null;
  settings: SemanticSearchSettings;

  constructor(leaf: WorkspaceLeaf, settings: SemanticSearchSettings) {
    super(leaf);
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_SEMANTIC_SEARCH;
  }

  getDisplayText(): string {
    return 'Semantic Search';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    this.root = createRoot(container);
    this.root.render(<SemanticSearchUI app={this.app} settings={this.settings} />);
  }

  async onClose() {
    this.root?.unmount();
  }
}

const SemanticSearchUI: React.FC<{ app: App; settings: SemanticSearchSettings }> = ({ app, settings }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ path: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState('');

  const handleSearch = async() => {
    setLoading(true);
    const notes = await runSemanticSearch(query, settings);
    setResults(notes);
    setLoading(false);
  };

  const handleSync = async() => {
    setSyncing(true);
    setSyncMessage('');

    const files = app.vault.getMarkdownFiles();
    const rawNotes = await Promise.all(files.map(async(file: TFile) => ({
      path: file.path,
      content: await app.vault.read(file)
    })));

    try {
      await syncNotes(rawNotes, settings);

      setSyncing(false);
      setSyncMessage('Notes synced to Astra ✅');
      setTimeout(() => setSyncMessage(''), 3000);
    } catch(err) {
      setSyncMessage('Error syncing notes: ' + err.message);
    }
  };

  return (
    <div style={{ padding: '1rem' }}>
      <h2>Semantic Search</h2>
      <input
        type="text"
        value={query}
        placeholder="Enter your search query..."
        onChange={(e) => setQuery(e.target.value)}
        style={{ width: '100%', padding: '0.5rem', fontSize: '1rem' }}
      />
      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
        <button onClick={handleSearch} disabled={loading}>
          {loading ? 'Searching...' : 'Search'}
        </button>
        <button onClick={handleSync} disabled={syncing}>
          {syncing ? 'Syncing…' : 'Sync Notes'}
        </button>
      </div>
      {syncMessage && <div style={{ marginTop: '0.5rem', color: 'green' }}>{syncMessage}</div>}
      <ul style={{ marginTop: '1rem' }}>
        {results.map((note, i) => (
          <li
            key={i}
            style={{ marginBottom: '0.5rem', cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => app.workspace.openLinkText(note.path, '/', false)}
          >
            {note.path}: {note.content.slice(0, 40)}...
          </li>
        ))}
      </ul>
    </div>
  );
};
