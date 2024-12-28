import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Materials } from './entity/materials.entity';
import { Repository } from 'typeorm';
import { create } from 'domain';
import { CreateOrUpdateMaterialDto } from './dto/createMaterials.entity';

@Injectable()
export class MeterialsService {
  constructor(
    @InjectRepository(Materials)
    private materialsRepository: Repository<Materials>,
  ) {}

  createMeterials(input: CreateOrUpdateMaterialDto) {
    try {
      const meterials = this.materialsRepository.create(input);

      return this.materialsRepository.save(meterials);
    } catch (error) {
      throw new Error(error);
    }
  }

  async findAll({ userId }: { userId: number }) {
    return this.materialsRepository.find();
  }

  async findOne(id: number) {
    return this.materialsRepository.findOne({ where: { id } });
  }

  async updateMeterials(id: number, input: CreateOrUpdateMaterialDto) {
    try {
      await this.materialsRepository.update(id, input);
      return this.materialsRepository.findOne({ where: { id } });
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteMeterials(id: number) {
    try {
      await this.materialsRepository.delete(id);
      return { id };
    } catch (error) {
      throw new Error(error);
    }
  }
}
