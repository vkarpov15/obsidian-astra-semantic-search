import mongoose from 'mongoose';
import { driver, createAstraUri } from '@datastax/astra-mongoose';
import { DEFAULT_SETTINGS, SemanticSearchSettings } from './settings';

mongoose.setDriver(driver);
mongoose.set('autoCreate', false);
mongoose.set('autoIndex', false);
mongoose.set('debug', true);

let settings: SemanticSearchSettings | null = null;
export async function useSettings(newSettings: SemanticSearchSettings) {
  if (settings == null) {
    settings = newSettings;
    await mongoose.connect(
      createAstraUri(settings.astraEndpoint, settings.astraToken, settings.astraKeyspace)
    );
    await Note.createCollection();
  } else if (
    Object.keys(DEFAULT_SETTINGS).find(
      (key: keyof SemanticSearchSettings) => settings![key] !== newSettings[key]
    )
  ) {
    settings = newSettings;
    await mongoose.disconnect();
    await mongoose.connect(
      createAstraUri(settings.astraEndpoint, settings.astraToken, settings.astraKeyspace)
    );
    await Note.createCollection();
  }
}

const noteSchema = new mongoose.Schema({
  path: String,
  content: String,
  $vector: { type: [Number] },
  $vectorize: String
}, {
  collectionOptions: {
    vector: {
      dimension: 1024,
      metric: 'cosine',
      service: { provider: 'nvidia', modelName: 'NV-Embed-QA' }
    }
  }
});

export const Note = mongoose.model(
  'Note',
  noteSchema
);

export async function syncNotes(
  rawNotes: { path: string, content: string }[],
  settings: SemanticSearchSettings
) {
  await useSettings(settings);

  for (const { path, content } of rawNotes) {
    await Note.updateOne(
      { path },
      { content, $vectorize: content },
      { upsert: true }
    );
    console.log('Synced:', path);
  }
}

export async function runSemanticSearch(query: string, settings: SemanticSearchSettings) {
  await useSettings(settings);
  const notes = await Note.find().sort({ $vectorize: { $meta: query } }).limit(3);
  console.log('Got notes', notes);
  return notes;
}

