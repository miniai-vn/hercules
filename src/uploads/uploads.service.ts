import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { Producer } from 'kafkajs';
import mimeTypes from 'mime-types';
import { Minetype } from 'src/common/enums/file.enum';
import { ResourceStatus } from 'src/resources/dto/resources.dto';
import { ResourcesService } from 'src/resources/resources.service';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class UploadsService {
  private s3: S3Client;
  private bucket: string;
  producer: Producer;
  constructor(
    private config: ConfigService,
    private readonly resourceService: ResourcesService,
  ) {
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
      const allowedMimeTypes = [
        Minetype.PDF,
        Minetype.DOCX,
        Minetype.TXT,
        Minetype.CSV,
        Minetype.XLSX,
      ];
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
        ext: ext,
        key,
        url,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
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

  async sendDataToElt(key: string, code: string = '', ext: string = '') {
    try {
      // Get the extension from the key if not provided
      if (!ext) {
        ext = key.split('.').pop()?.toLowerCase();
      }

      // Get file from S3
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);

      // Determine content type and endpoint based on file extension
      const { contentType, endpoint, filename } = this.getFileConfig(ext);

      // Prepare form data
      const formData = new FormData();
      formData.append('file', buf, {
        filename,
        contentType,
      });
      formData.append('key', key);
      formData.append('code', code);

      // Call the appropriate API endpoint
      const res = await axios.post(
        `${process.env.AGENT_BASE_URL}${endpoint}`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      const data = res.data;
      const converData = data.chunks.map((item: any) => {
        return {
          type: 'text',
          data: item,
        };
      });

      // Save processed data to S3
      const jsonKey = key.replace(/\.[^/.]+$/, '.json');
      const formatData = {
        data: converData,
        code: code,
        fileType: ext,
        processedAt: new Date().toISOString(),
      };

      await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: jsonKey,
          Body: JSON.stringify(formatData),
          ContentType: 'application/json',
        }),
      );

      const jsonUrl = `https://${process.env.AWS_BASE_URL}/${this.bucket}/${jsonKey}`;
      await this.resourceService.updateStatusByKey(
        key,
        ResourceStatus.COMPLETED,
      );

      return {
        success: true,
        fileKey: key,
        fileType: ext,
        fileSize: buf.length,
        externalResponse: data,
        jsonUrl,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to process ${ext} file: ${error.message}`,
      );
    }
  }

  // Helper method to get file configuration based on extension
  private getFileConfig(ext: string): {
    contentType: string;
    endpoint: string;
    filename: string;
  } {
    switch (ext.toLowerCase()) {
      case 'docx':
        return {
          contentType:
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          endpoint: '/read-docx',
          filename: 'document.docx',
        };
      case 'pdf':
        return {
          contentType: 'application/pdf',
          endpoint: '/read-pdf',
          filename: 'document.pdf',
        };
      case 'csv':
        return {
          contentType: 'text/csv',
          endpoint: '/read-csv',
          filename: 'document.csv',
        };
      case 'xlsx':
        return {
          contentType:
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          endpoint: '/read-excel',
          filename: 'document.xlsx',
        };
      default:
        return {
          contentType: 'application/octet-stream',
          endpoint: '/read-document',
          filename: `document.${ext}`,
        };
    }
  }
}
