import mongoose from 'mongoose';
import {
  Vectorize,
  driver,
  createAstraUri,
  tableDefinitionFromSchema
} from '@datastax/astra-mongoose';
import nfetch from 'node-fetch';
import { FetcherRequestInfo } from '@datastax/astra-db-ts';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1536,
  chunkOverlap: 100,
  separators: ['\n\n', '\n', ' ', ''],
});

const m = mongoose.setDriver(driver);
m.set('autoCreate', false);
m.set('autoIndex', false);
m.set('debug', true);

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

let settings: SemanticSearchSettings | null = null;
const httpOptions = Object.freeze({
  client: 'custom',
  fetcher: {
    async fetch(info: FetcherRequestInfo) {
      const resp = await nfetch(info.url, info);
      const headers: Record<string, string> = {};
      resp.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        url: resp.url,
        statusText: resp.statusText,
        httpVersion: 1 as const,
        headers,
        body: await resp.text(),
        status: resp.status
      };
    }
  }
});
export async function useSettings(newSettings: SemanticSearchSettings) {
  if (settings == null) {
    settings = newSettings;
    await m.connect(
      createAstraUri(settings.astraEndpoint, settings.astraToken, settings.astraKeyspace),
      { isTable: true, autoCreate: false, httpOptions }
    );
    await m.connection.createTable(
      Note.collection.collectionName,
      tableDefinitionFromSchema(Note.schema),
      { ifNotExists: true }
    );
    await Note.syncIndexes();
  } else if (
    Object.keys(DEFAULT_SETTINGS).find(
      (key: keyof SemanticSearchSettings) => settings![key] !== newSettings[key]
    )
  ) {
    settings = newSettings;
    await m.disconnect();
    await m.connect(
      createAstraUri(settings.astraEndpoint, settings.astraToken, settings.astraKeyspace),
      { isTable: true, autoCreate: false, httpOptions }
    );
    await m.connection.createTable(
      Note.collection.collectionName,
      tableDefinitionFromSchema(Note.schema),
      { ifNotExists: true }
    );
    await Note.syncIndexes();
  }
}

const noteSchema = new m.Schema({
  _id: String,
  path: { type: String, required: true },
  chunkIndex: { type: Number, required: true },
  content: { type: String, required: true },
  // This pattern for defining vectorize works as well,
  // just doesn't have great type checking. Won't catch
  // type errors in `service` or `dimension`.
  vector: {
    type: Vectorize,
    dimension: 1024,
    index: { name: 'vector', vector: true },
    service: {
      provider: 'nvidia',
      modelName: 'NV-Embed-QA'
    }
  }
}, { versionKey: false });

export const Note = m.model(
  'Note',
  noteSchema
);

export async function syncNotes(
  rawNotes: { path: string, content: string }[],
  settings: SemanticSearchSettings
) {
  await useSettings(settings);

  for (const { path, content } of rawNotes) {
    await syncNote({ path, content }, settings);
  }
}

export async function syncNote(
  note: { path: string, content: string },
  settings: SemanticSearchSettings
) {
  await useSettings(settings);

  const { path, content } = note;

  const chunks = await splitter.createDocuments([content]);

  const existingNotes = await Note.find({ path });
  await Promise.all(existingNotes.map(note => Note.deleteOne({ _id: note._id })));

  await Promise.all(
    chunks.map(
      (chunk, chunkIndex) => Note.updateOne(
        { _id: `${path} - ${chunkIndex}` },
        { path, chunkIndex, content: chunk.pageContent, vector: chunk.pageContent },
        { upsert: true }
      )
    )
  );

  console.log('Synced:', path);
}

export async function deleteNote(path: string, settings: SemanticSearchSettings) {
  await useSettings(settings);
  await Note.deleteOne({ _id: path });
  console.log('Deleted', path);
}

export async function runSemanticSearch(query: string, settings: SemanticSearchSettings) {
  await useSettings(settings);
  const notes = await Note.find().sort({ vector: { $meta: query } }).limit(3);
  console.log('Got notes', notes);
  return notes;
}
