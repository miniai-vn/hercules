import { Injectable } from '@nestjs/common';
import axios from 'axios';
import cheerio from 'cheerio';
// import * as pdfjsLib from 'pdfjs-dist';
@Injectable()
export class DataExtractionService {
  private chunkString(text: string) {
    const check = text
      .replace(/\n/g, '')
      .split('.')
      .filter((item) => item.length > 0);
    return check;
  }

  private replaceAllHtmlTags(text: string) {
    return text.replace(/<[^>]*>/g, '');
  }

  async readPdfToText(pdfPath: string): Promise<string[]> {
    // const loadingTask = pdfjsLib.getDocument(pdfPath);
    // const pdf = await loadingTask.promise;

    // const numPages = pdf.numPages;

    // const page = await pdf.getPage(1);
    // const textContent = await page.getTextContent();
    // const textItems = textContent.items.map((item) => item.str).join(' ');

    // return this.chunkString(textItems);
    return [];
  }

  async crawlDataFromUrl(url: string) {
    try {
      // Fetch the HTML of the page
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);

      const allElements = [];
      $('*').each((index, element) => {
        allElements.push($(element).prop('outerHTML'));
      });

      const allElementsText = allElements.join(' ');
      const text = this.replaceAllHtmlTags(allElementsText);
      const chunks = this.chunkString(text);
      return chunks;
    } catch (error) {
      console.error('Error fetching the page:', error);
    }
  }
}
