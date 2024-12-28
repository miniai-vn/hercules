import { Injectable } from '@nestjs/common';
import { ChromaClient } from 'chromadb';
import { DataExtractionService } from 'src/data-extraction/data-extraction.service';
import { MaterialItems } from 'src/material-items/entity/material-item.entity';

@Injectable()
export class VectorServiceService {
  choromaClient: ChromaClient;
  collection: any;
  constructor(private readonly dataExtractorService: DataExtractionService) {
    this.choromaClient = new ChromaClient();
  }

  query(collectionName: string, query: any) {
    return this.collection.query(collectionName, query);
  }

  async insertDocument(collectionName: string, document: string[]) {
    await this.collection.add(collectionName, document);
  }

  async syncDataToVectoDb(data: MaterialItems) {
    const { material, text, file, url } = data;
    const collection = await this.choromaClient.getOrCreateCollection({
      name: 'material',
    });
    // await this.choromaClient.deleteCollection(collection);

    if (text) {
      const chunkText = text
        .replace(/\n/g, '')
        .split('.')
        .filter((item) => item.length > 0);
      console.log('chunkText', chunkText);
    }

    if (file) {
      const fileChunks = await this.dataExtractorService.readPdfToText(text);
    }

    // if (url) {
    //   const urlChunks = await this.dataExtractorService.readUrlToText(url);
    // }
  }
}
