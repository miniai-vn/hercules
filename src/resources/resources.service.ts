import {
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Producer } from 'kafkajs';
import { PaginatedResult } from 'src/common/types/reponse.type';
import { KafkaProducerService } from 'src/kafka/kafka.producer';
import * as mammoth from 'mammoth';
import {
  FindManyOptions,
  ILike,
  IsNull,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import {
  CreateResourceDto,
  ResourceQueryDto,
  ResourceStatus,
  UpdateResourceDto,
} from './dto/resources.dto';
import FormData, { from } from 'form-data';
import { Resource } from './resources.entity';
import { UploadsService } from 'src/uploads/uploads.service';
import { ChatGateway } from 'src/chat/chat.gateway';
import { Agent } from 'http';
import { AgentServiceService } from 'src/integration/agent-service/agent-service.service';
import axios from 'axios';

@Injectable()
export class ResourcesService {
  private producer: Producer;
  constructor(
    @InjectRepository(Resource)
    private readonly resourceRepository: Repository<Resource>,
    private readonly kafkaProducerService: KafkaProducerService,
    @Inject(forwardRef(() => UploadsService))
    private readonly uploadsService: UploadsService,
    private readonly chatGateway: ChatGateway,
    private readonly agentService: AgentServiceService,
  ) {
    this.producer = this.kafkaProducerService.getProducer();
  }

  generateCodeFromFilename = (filename: string) => {
    if (!filename || typeof filename !== 'string')
      throw new Error('Invalid filename');

    const removeVietnameseTones = (str) => {
      return str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/Đ/g, 'D')
        .replace(/[^\w\s]/gi, '')
        .trim();
    };

    const cleaned = removeVietnameseTones(filename);

    const parts = cleaned.split(/\s+/);
    const initials = parts
      .map((word, index) => {
        if (index < parts.length - 1 && /^[A-Za-z]/.test(word))
          return word[0].toUpperCase();
        return word;
      })
      .join('');

    return initials + new Date().getTime().toString(36);
  };

  async updateStatusByKey(
    key: string,
    status: ResourceStatus,
    s3KeyJson?: string,
  ): Promise<void> {
    try {
      await this.resourceRepository.update(
        { s3Key: key },
        { status, ...(s3KeyJson && { s3KeyJson }) },
      );
      this.chatGateway.server.emit('resourceStatusUpdated', {
        key,
        status,
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update resource status',
        error.message,
      );
    }
  }

  async query(query: ResourceQueryDto): Promise<PaginatedResult<Resource>> {
    const {
      createdAfter,
      createdBefore,
      search,
      type,
      status,
      isActive,
      departmentId,
      page = 1,
      limit = 20,
      includeDeleted = false,
    } = query;

    const filter: FindManyOptions<Resource> = {
      where: {
        parent: IsNull(), // Only top-level resources
        ...(createdAfter && {
          createdAt: MoreThanOrEqual(new Date(createdAfter)),
        }),
        ...(createdBefore && {
          createdAt: LessThanOrEqual(new Date(createdBefore)),
        }),
        ...(search && {
          name: ILike(`%${search}%`),
        }),
        ...(type && { type }),
        ...(status && { status }),
        ...(isActive !== undefined && { isActive }),
        ...(departmentId && { department: { id: departmentId } }),
      },
      relations: {
        department: true,
        resources: true,
        parent: true,
      },
      take: limit,
      skip: (page - 1) * limit,
      withDeleted: includeDeleted,
      order: {
        createdAt: 'DESC',
      },
    };

    const [data, total] = await this.resourceRepository.findAndCount(filter);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    };
  }

  async create(file: Express.Multer.File, data: CreateResourceDto) {
    try {
      if (!file) {
        throw new InternalServerErrorException('File is required');
      }

      const buffer = Buffer.from(file.originalname, 'latin1');
      const decodedName = buffer.toString('utf8').split('.')[0];

      const parentResource = await this.resourceRepository.findOne({
        where: { id: data.parentId },
        relations: {
          department: true,
        },
      });

      const code = this.generateCodeFromFilename(decodedName);
      const parrentCode = parentResource?.code ? parentResource.code : '';

      const dataFromFile = await this.uploadsService.uploadFile({
        file: {
          ...file,
          originalname: decodedName,
        },
        departmentId: data.departmentId,
        shopId: data.shopId,
        parentCode: parrentCode,
        code: code,
      });

      const resource = await this.resourceRepository.save({
        ...data,
        name: decodedName,
        status: ResourceStatus.PROCESSING,
        s3Key: dataFromFile.key,
        path: dataFromFile.url,
        type: dataFromFile.type,
        code: (parrentCode ? parrentCode : '') + code,
        parent: {
          id: data.parentId ? data.parentId : null,
        },
        department: {
          id: data.departmentId,
        },
      });

      await this.producer.send({
        topic: process.env.KAFKA_ETL_TOPIC,
        messages: [
          {
            key: resource.id.toString(),
            value: JSON.stringify({
              id: resource.id,
              name: resource.name,
              s3Key: resource.s3Key,
              fileName: decodedName,
              ext: dataFromFile.type,
              type: resource.type,
              status: resource.status,
              isActive: resource.isActive,
              departmentId: resource.department?.id,
              tenantId: 'shop_' + data.shopId.replace(/-/g, '') || 'default',
              code: resource.code,
              parentCode: resource.department?.id,
            }),
          },
        ],
      });

      return resource.code;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to create resource',
        error.message,
      );
    }
  }

  async reEtlResource(id: number): Promise<Resource | null> {
    const resource = await this.resourceRepository.findOne({
      where: { id },
      relations: {
        department: true,
      },
    });
    if (!resource) {
      throw new InternalServerErrorException('Resource not found');
    }
    try {
      await this.producer.send({
        topic: process.env.KAFKA_ETL_TOPIC,
        messages: [
          {
            key: resource.id.toString(),
            value: JSON.stringify({
              id: resource.id,
              name: resource.name,
              s3Key: resource.s3Key,
              type: resource.type,
              status: resource.status,
              isActive: resource.isActive,
              departmentId: resource.department?.id,
              code: resource.code,
            }),
          },
        ],
      });
      await this.resourceRepository.update(id, {
        status: ResourceStatus.PROCESSING,
      });
      return resource;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to re-ETL resource',
        error.message,
      );
    }
  }

  async update(id: number, data: UpdateResourceDto) {
    try {
      await this.resourceRepository.update(id, data);
      return id;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to update resource',
        error.message,
      );
    }
  }

  async findOne(id: number) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
        relations: {
          department: true,
          resources: true,
          parent: true,
        },
      });
      if (!resource) {
        throw new InternalServerErrorException('Resource not found');
      }
      const content = await this.handleReadContent(id);
      return {
        ...resource,
        content: content,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to find resource',
        error.message,
      );
    }
  }

  async handleReadContent(id: number) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
        relations: {
          department: true,
          parent: true,
        },
      });

      if (!resource) {
        throw new InternalServerErrorException('Resource not found');
      }

      // Get file buffer from S3
      const fileBuffer = await this.uploadsService.getCotentFile(
        resource.s3Key,
      );

      if (!fileBuffer) {
        throw new InternalServerErrorException('File not found in S3');
      }

      let content = {
        html: '',
        text: '',
        metadata: {
          resource: {
            id: resource.id,
            name: resource.name,
            type: resource.type,
            code: resource.code,
            createdAt: resource.createdAt,
            department: resource.department?.name,
            parent: resource.parent?.name,
          },
        },
      };

      // Handle different file types
      switch (resource.type.toLowerCase()) {
        case 'docx':
        case 'doc':
          const mammothResult = await mammoth.convertToHtml({
            buffer: fileBuffer,
          });
          content.html = mammothResult.value;
          content.text = await this.extractTextFromHtml(mammothResult.value);
          break;

        case 'txt':
          const textContent = fileBuffer.toString('utf-8');
          content.text = textContent;
          content.html = `<pre>${textContent}</pre>`;
          break;

        case 'pdf':
          // For PDF, you might want to use pdf-parse library
          content.html = '<p>PDF content extraction not implemented yet</p>';
          content.text = 'PDF content extraction not implemented yet';
          break;

        default:
          throw new InternalServerErrorException(
            `Unsupported file type: ${resource.type}`,
          );
      }

      return content;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get file content',
        error.message,
      );
    }
  }

  private async extractTextFromHtml(html: string): Promise<string> {
    // Simple HTML to text conversion
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ') // Replace &nbsp; with space
      .replace(/&amp;/g, '&') // Replace &amp; with &
      .replace(/&lt;/g, '<') // Replace &lt; with <
      .replace(/&gt;/g, '>') // Replace &gt; with >
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .trim();
  }

  async getFileContentWithStyling(
    id: number,
  ): Promise<{ html: string; text: string; metadata: any }> {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
        relations: {
          department: true,
          parent: true,
        },
      });

      if (!resource) {
        throw new InternalServerErrorException('Resource not found');
      }

      const fileBuffer = await this.uploadsService.getCotentFile(
        resource.s3Key,
      );

      if (!fileBuffer) {
        throw new InternalServerErrorException('File not found in S3');
      }

      let content = {
        html: '',
        text: '',
        metadata: {
          resource: {
            id: resource.id,
            name: resource.name,
            type: resource.type,
            code: resource.code,
            createdAt: resource.createdAt,
            department: resource.department?.name,
            parent: resource.parent?.name,
          },
        },
      };

      if (
        resource.type.toLowerCase() === 'docx' ||
        resource.type.toLowerCase() === 'doc'
      ) {
        // Convert with styling options
        const options = {
          styleMap: [
            "p[style-name='Heading 1'] => h1:fresh",
            "p[style-name='Heading 2'] => h2:fresh",
            "p[style-name='Heading 3'] => h3:fresh",
            'b => strong',
            'i => em',
            'u => u',
          ],
          includeDefaultStyleMap: true,
          convertImage: mammoth.images.imgElement(function (image) {
            return image.read('base64').then(function (imageBuffer) {
              return {
                src: 'data:' + image.contentType + ';base64,' + imageBuffer,
              };
            });
          }),
        };

        const result = await mammoth.convertToHtml(
          { buffer: fileBuffer },
          options,
        );

        content.html = `
          <div class="document-content">
            <style>
              .document-content {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
              }
              .document-content h1, .document-content h2, .document-content h3 {
                color: #333;
                margin-top: 20px;
                margin-bottom: 10px;
              }
              .document-content p {
                margin-bottom: 10px;
              }
              .document-content strong {
                font-weight: bold;
              }
              .document-content em {
                font-style: italic;
              }
              .document-content u {
                text-decoration: underline;
              }
            </style>
            ${result.value}
          </div>
        `;

        content.text = await this.extractTextFromHtml(result.value);

        // Log any conversion warnings
        if (result.messages.length > 0) {
          console.warn('Mammoth conversion warnings:', result.messages);
        }
      }

      return content;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to get file content with styling',
        error.message,
      );
    }
  }

  async reEtlResourceByKey(id: number) {
    try {
      const resource = await this.resourceRepository.findOne({
        where: { id },
        relations: {
          department: true,
        },
      });

      const result = await this.uploadsService.reEtlFile(
        resource.s3Key,
        resource.code,
        resource.type,
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to re-ETL resource by key: ${error.message}`,
      );
    }
  }

  async delete(id: number, shopId: string): Promise<number> {
    try {
      const resource = await this.resourceRepository.findOne({ where: { id } });
      if (!resource) {
        throw new InternalServerErrorException('Resource not found');
      }

      await this.resourceRepository.update(id, { isActive: false });

      await this.agentService.deleteChunksByCode(
        resource.code,
        'shop_' + shopId.replace(/-/g, ''),
      );
      return id;
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to delete resource',
        error.message,
      );
    }
  }

  async etl(
    s3Key: string,
    code: string = '',
    ext: string = '',
    tenantId: string = 'default',
    parentCode?: string,
    fileName: string = '',
  ) {
    try {
      const rsc = await this.resourceRepository.findOne({
        where: { s3Key },
        relations: {
          department: {
            shop: true,
          },
        },
      });

      if (rsc?.status === ResourceStatus.COMPLETED) return;

      // send to elt service
      const { contentType, buf } = await this.uploadsService.sendDataToElt(
        rsc.s3Key,
        ext,
      );
      const formData = new FormData();
      formData.append('file', buf, {
        filename: fileName,
        contentType,
      });
      formData.append('key', s3Key);
      formData.append('code', code);
      formData.append('output_folder', 'json');
      formData.append('chunk_method', 'semantic');
      formData.append('min_chunk_length', '100');
      formData.append('tenant_id', tenantId);
      formData.append('ext', ext);
      formData.append('parent_code', parentCode || '');
      // Call the appropriate API endpoint
      const res = await axios.post(
        `${process.env.AGENT_BASE_URL}/etl/upload`,
        formData,
        {
          headers: formData.getHeaders(),
        },
      );

      if (!res.data.success) {
        await this.updateStatusByKey(s3Key, ResourceStatus.ERROR);
        return;
      }

      const codeJson = code || this.generateCodeFromFilename(fileName);
      const jsonKey = `${rsc.department.shop.id}/${rsc.department.id}/${s3Key.replace(/\.[^/.]+$/, '.json')}`;

      const jsonFile = await this.uploadsService.uploadFileJson({
        data: res.data.entities,
        key: jsonKey,
        code: codeJson,
        ext,
      });

      await this.updateStatusByKey(s3Key, ResourceStatus.COMPLETED);

      return jsonFile;
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to ETL resource: ${error.message}`,
      );
    }
  }
}
