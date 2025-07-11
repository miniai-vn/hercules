import {
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
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
    @Inject(forwardRef(() => ResourcesService))
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
      const allowedMimeTypes = [Minetype.PDF, Minetype.DOCX, Minetype.TXT];
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

  async getCotentFile(key: string): Promise<Buffer> {
    const cmd = new GetObjectCommand({
      Bucket: this.config.get<string>('AWS_BUCKET_NAME')!,
      Key: key,
    });
    const res = await this.s3.send(cmd);
    const buf = await this.streamToBuffer(res.Body as Readable);
    return buf;
  }

  async sendDataToElt(key: string, code: string = '') {
    try {
      const cmd = new GetObjectCommand({ Bucket: this.bucket, Key: key });
      const response = await this.s3.send(cmd);
      const buf = await this.streamToBuffer(response.Body as Readable);

      const formData = new FormData();
      formData.append('file', buf, {
        filename: 'document.docx',
        contentType:
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      });
      formData.append('key', key);
      formData.append('code', code);

      const res = await axios.post(
        `${process.env.AGENT_BASE_URL}/read-docx`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );
      const data = res.data;
      const converData = data.chunks.map((item: string) => {
        return {
          type: 'text',
          text: item,
        };
      });
      const jsonKey = key.replace(/\.[^/.]+$/, '.json');
      const formatData = {
        data: converData,
        code: code,
      };
      const storeJSONFile = await this.s3.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: jsonKey,
          Body: JSON.stringify(formatData),
          ContentType: 'application/json',
        }),
      );

      const jsonUrl = `https://${process.env.AWS_BASE_URL}/${this.bucket}/${jsonKey}`;

      if (storeJSONFile)
        this.resourceService.updateStatusByKey(key, ResourceStatus.COMPLETED);

      return {
        success: true,
        fileKey: key,
        fileSize: buf.length,
        externalResponse: data,
        jsonUrl,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to process file: ${error.message}`,
      );
    }
  }
}
