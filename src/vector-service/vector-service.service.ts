import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ChromaClient } from 'chromadb';
import { DataExtractionService } from 'src/data-extraction/data-extraction.service';
import { MaterialItems } from 'src/material-items/entity/material-item.entity';
import { delayMiliseconds } from 'src/utils';

@Injectable()
export class VectorServiceService {
  choromaClient: ChromaClient;
  collection: any;
  constructor(private readonly dataExtractorService: DataExtractionService) {
    this.choromaClient = new ChromaClient();
  }

  async query(collectionName: string, query: any) {
    try {
      const collection = await this.choromaClient.getOrCreateCollection({
        name: 'material',
      });
      const chunkQuery = await this.dataExtractorService.recursiveCharaterSplit(
        {
          text: query,
          chunkSize: 100,
          chunkOverlap: 10,
        },
      );
      const results = await collection.query({
        queryTexts: chunkQuery,
        nResults: 2,
      });

      return results.documents;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error while querying data from vector db',
      });
    }
  }

  async insertDocument(collectionName: string, document: string[]) {
    await this.collection.add(collectionName, document);
  }

  async syncDataToVectoDb(data: MaterialItems) {
    try {
      const { material, text, file, url } = data;
      const collection = await this.choromaClient.getOrCreateCollection({
        name: 'material',
      });

      // await this.choromaClient.deleteCollection(collection);
      let chunkText: string[];
      let ids: string[];
      if (text) {
        const chunkText = text
          .replace(/\n/g, '')
          .split('.')
          .filter((item) => item.length > 0);
        // random id with 10 digits for each chunk
        ids = chunkText.map(
          () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
        );
        for (let i = 0; i < chunkText.length; i += 10) {
          const partialText = chunkText.slice(i, i + 10);
          const ids = partialText.map(
            () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
          );

          await collection.upsert({
            documents: partialText,
            ids: ids,
          });

          delayMiliseconds(Math.floor(Math.random() * 1000));
        }
      }

      if (file) {
        chunkText = await this.dataExtractorService.syncDataFromPdf(file);
        ids = chunkText.map(
          () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
        );
        for (let i = 0; i < chunkText.length; i += 10) {
          const partialText = chunkText.slice(i, i + 10);
          const ids = partialText.map(
            () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
          );

          await collection.upsert({
            documents: partialText,
            ids: ids,
          });

          delayMiliseconds(Math.floor(Math.random() * 1000));
        }
      }

      if (url) {
        chunkText = await this.dataExtractorService.syncDataFromUrl(url);
        ids = chunkText.map(
          () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
        );
        for (let i = 0; i < chunkText.length; i += 10) {
          const partialText = chunkText.slice(i, i + 10);
          const ids = partialText.map(
            () => 'id' + Math.floor(1000000000 + Math.random() * 9000000000),
          );

          await collection.upsert({
            documents: partialText,
            ids: ids,
          });

          delayMiliseconds(Math.floor(Math.random() * 1000));
        }
      }
      return true;
    } catch (error) {
      throw new InternalServerErrorException({
        message: 'Error while syncing data to vector db',
      });
    }
  }
}
