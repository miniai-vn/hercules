import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  Injectable,
  InternalServerErrorException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  constructor(
    private config: ConfigService,
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

  async uploadFile({
    file,
    departmentId,
    shopId,
    parentCode = '',
    code,
  }: {
    file: Express.Multer.File;
    departmentId: number;
    shopId: string;
    parentCode?: string;
    code: string;
  }) {
    try {
      const allowedMimeTypes = [
        Minetype.PDF,
        Minetype.DOCX,
        Minetype.TXT,
        Minetype.CSV,
        Minetype.XLSX,
        Minetype.DOC,
      ];
      const ext = allowedMimeTypes.includes(file.mimetype as Minetype)
        ? this.getFileExtensionFromMime(file.mimetype)
        : 'pdf';

      if (parentCode) {
        code = `${parentCode}/${code}`;
      }

      const key = `${shopId}/${departmentId}/${code}-${file.originalname}-${uuidv4()}.${ext}`;
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
        type: ext,
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

  async getCotentFile(key: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: this.config.get<string>('AWS_BUCKET_NAME')!,
      Key: key,
    });
    const res = await this.s3.send(cmd);
    const buf = await this.streamToBuffer(res.Body as Readable);
    return buf;
  }

  async sendDataToElt(key: string, ext: string = '') {
    try {
      // Get file from S3
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);
      // Determine content type and endpoint based on file extension
      const { contentType, filename } = this.getFileConfig(ext);
      return { contentType, filename, buf };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to process ${ext} file: ${error.message}`,
      );
    }
  }
  async uploadFileJson({
    data,
    key,
    code = '',
    ext = '',
  }: {
    data: any;
    key: string;
    code?: string;
    ext?: string;
  }) {
    const jsonKey = key.replace(/\.[^/.]+$/, '.json');
    const formatData = {
      data: data,
      code: code,
      fileType: ext,
      processedAt: new Date().toISOString(),
    };

    const storeJSONFile = await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: jsonKey,
        Body: JSON.stringify(formatData),
        ContentType: 'application/json',
      }),
    );
    return storeJSONFile;
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

      case 'json':
        return {
          contentType: 'application/json',
          endpoint: '/read-json',
          filename: 'document.json',
        };
      case 'doc':
      case 'DOC':
        return {
          contentType: 'application/msword',
          endpoint: '/read-doc',
          filename: 'document.doc',
        };
      default:
        return {
          contentType: 'application/octet-stream',
          endpoint: '/read-document',
          filename: `document.${ext}`,
        };
    }
  }

  async reEtlFile(key: string, code: string = '', ext: string = '') {
    const fileJson = await this.getJsonFile(key);
    if (!fileJson) {
      throw new InternalServerErrorException('File JSON not found');
    }
  }
}
