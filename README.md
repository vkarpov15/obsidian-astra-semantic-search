# obsidian-astra-semantic-search

This plugin allows syncing your Obsidian notes to your DataStax Astra cluster with enabled vector search.
No additional AI API keys required, just Astra credentials.

## Installing This Plugin

Currently, you need to download this plugin from GitHub releases.

1. Navigate to your Obsidian vault in a terminal
2. Create an `astra-semantic-search` directory in `.plugins`: `mkdir -p ./.plugins/astra-semantic-search && cd ./.plugins/astra-semantic-search`
3. Download the files from [v1.0.0 of this plugin](https://github.com/vkarpov15/obsidian-astra-semantic-search/releases/tag/1.0.0):

```
curl -OL https://github.com/vkarpov15/obsidian-astra-semantic-search/releases/download/1.0.0/main.js
curl -OL https://github.com/vkarpov15/obsidian-astra-semantic-search/releases/download/1.0.0/manifest.json
curl -OL https://github.com/vkarpov15/obsidian-astra-semantic-search/releases/download/1.0.0/styles.css
```

4. Go to `Settings` -> `Community Plugins` and make sure `astra-semantic-search` is enabled

<img src="https://i.imgur.com/5sGHBqD.png">

5. Click on the `astra-semantic-search` Options (the little gear next to "astra-semantic-search") and enter your Astra credentials. Your Astra credentials will be stored on your file system in `astra-semantic-search/data.json`.

<img src="https://i.imgur.com/1omgr1g.png">

6. Click the search icon on the left ("Open Semantic Search") to open the Astra Semantic Search UI. Then click "Sync Notes" to sync your notes to Astra!

<img src="https://i.imgur.com/Mmwo84l.png">