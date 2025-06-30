import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Producer } from 'kafkajs';
import mimeTypes from 'mime-types';
import { Minetype } from 'src/common/enums/file.enum';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;
  producer: Producer;
  constructor(private config: ConfigService) {
    this.bucket = this.config.getOrThrow('AWS_BUCKET_NAME');

    this.s3 = new S3Client({
      region: this.config.getOrThrow('AWS_REGION'),
      credentials: {
        accessKeyId: this.config.getOrThrow('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.config.getOrThrow('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  private getFileExtensionFromMime(mime: string): string | undefined {
    return mimeTypes.extension(mime) || 'jpg';
  }

  async uploadFile(file: Express.Multer.File, shopId: string) {
    try {
      const allowedMimeTypes = [Minetype.PDF, Minetype.DOCX, Minetype.TXT];
      const ext = allowedMimeTypes.includes(file.mimetype as Minetype)
        ? this.getFileExtensionFromMime(file.mimetype)
        : 'pdf';

      const key = `${shopId}/${uuidv4()}-${file.originalname}.${ext}`;
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
        }),
      );
      const url = `https://${process.env.AWS_BASE_URL}/${this.bucket}/${key}`;
      return {
        name: file.originalname,
        extra: {
          size: file.size,
        },
        key,
        url,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  async uploadJsonFile(
    data: any,
    shopId: string,
    fileName: string = 'data.json',
  ): Promise<{ key: string; url: string }> {
    let jsonString: string;
    try {
      jsonString = JSON.stringify(data);
      JSON.parse(jsonString);
    } catch (error) {
      throw new Error(`Invalid JSON data: ${error.message}`);
    }

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');

    const key = `${shopId}/${uuidv4()}-${sanitizedFileName}`;
    try {
      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: jsonString,
          ContentType: 'application/json',
        }),
      );

      const url = `https://${process.env.AWS_BASE_URL}/${this.bucket}/${key}`;
      return { key, url };
    } catch (error) {
      throw new Error(`Failed to upload JSON file: ${error.message}`);
    }
  }

  async getBinaryFile(key: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: this.config.get<string>('AWS_BUCKET_NAME')!,
      Key: key,
    });
    const res = await this.s3.send(cmd);
    const body = res.Body as Readable;
    return await this.streamToBuffer(body);
  }

  async getJsonFile<T = any>(key: string): Promise<T> {
    const cmd = new GetObjectCommand({
      Bucket: this.config.get<string>('AWS_BUCKET_NAME')!,
      Key: key,
    });
    const res = await this.s3.send(cmd);
    const buf = await this.streamToBuffer(res.Body as Readable);
    return JSON.parse(buf.toString('utf-8'));
  }

  async streamToBuffer(stream: Readable): Promise<Buffer> {
    const chunks = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  async sendDataToElt(key: string) {
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);

      // Send buffer using axios directly
      const formData = new FormData();
      formData.append('file', new Blob([buf]), key.split('/').pop() || 'file');
      formData.append('key', key);

      const res = await axios.post(
        `${process.env.AGENT_BASE_URL}/read-docx`,
        buf,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
        },
      );
      console.log('File sent successfully:', res);

      // return {
      //   success: true,
      //   fileKey: key,
      //   fileSize: buf.length,
      //   externalResponse: httpResponse.data,
      // };
      return true;
    } catch (error) {
      console.error('Error in getFile:', error);
      throw new InternalServerErrorException(
        `Failed to process file: ${error.message}`,
      );
    }
  }

  // Alternative method using raw buffer in request body
  async getFileAndSendRaw(key: string) {
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);

      // Send raw buffer using axios
      const httpResponse = await axios.post(
        'http://127.0.0.1:5000/upload-raw',
        buf,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
            'X-File-Key': key,
            'X-File-Size': buf.length.toString(),
          },
          timeout: 30000,
        },
      );

      console.log('Raw file sent successfully:', httpResponse.data);

      return {
        success: true,
        fileKey: key,
        fileSize: buf.length,
        externalResponse: httpResponse.data,
      };
    } catch (error) {
      console.error('Error in getFileAndSendRaw:', error);
      throw new InternalServerErrorException(
        `Failed to send raw file: ${error.message}`,
      );
    }
  }

  // Method to send file with additional metadata
  async getFileAndSendWithMetadata(key: string, metadata?: any) {
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);

      const payload = {
        file: buf.toString('base64'), // Convert to base64 for JSON
        key: key,
        contentType: response.ContentType,
        size: buf.length,
        metadata: metadata || {},
      };

      const httpResponse = await axios.post(
        'http://127.0.0.1:5000/upload-json',
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 30000,
        },
      );

      console.log('File with metadata sent successfully:', httpResponse.data);

      return {
        success: true,
        fileKey: key,
        fileSize: buf.length,
        externalResponse: httpResponse.data,
      };
    } catch (error) {
      console.error('Error in getFileAndSendWithMetadata:', error);
      throw new InternalServerErrorException(
        `Failed to send file with metadata: ${error.message}`,
      );
    }
  }
}
