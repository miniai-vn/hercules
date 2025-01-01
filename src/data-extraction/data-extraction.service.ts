import { Injectable, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import * as fs from 'fs';
import * as pdfParse from 'pdf-parse';
import * as cheerio from 'cheerio';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { Document } from '@langchain/core/documents';
@Injectable()
export class DataExtractionService {
  async recursiveCharaterSplit({
    text,
    chunkSize,
    chunkOverlap,
  }: {
    text: string;
    chunkSize: number;
    chunkOverlap: number;
  }) {
    const splitter = new RecursiveCharacterTextSplitter({
      chunkSize,
      chunkOverlap,
      separators: ['\n', ' ', '.', ','],
    });

    const docOutput = await splitter.splitDocuments([
      new Document({ pageContent: text }),
    ]);

    const textMerge = docOutput.map((doc) => doc.pageContent);
    return textMerge;
  }

  async syncDataFromPdf(filePath: string): Promise<string[]> {
    const dataBuffer = fs.readFileSync(filePath);
    const pdfData = await pdfParse(dataBuffer);
    const concatenatedText = pdfData.text.replace(/\s+/g, ' ').trim();
    const chunks = this.recursiveCharaterSplit({
      text: concatenatedText,
      chunkSize: 100,
      chunkOverlap: 10,
    });
    return chunks;
  }
  x;

  async syncDataFromUrl(url: string) {
    try {
      const { data } = await axios.get(url);
      const $ = cheerio.load(data);
      const textContent = $('body').text().replace(/\s+/g, ' ').trim();
      const chunks = this.recursiveCharaterSplit({
        text: textContent,
        chunkSize: 100,
        chunkOverlap: 10,
      });
      return chunks;
    } catch (error) {
      throw new InternalServerErrorException({
        message: error.message,
      });
    }
  }
}
