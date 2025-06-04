import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749026538531 implements MigrationInterface {
    name = 'Migration1749026538531'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_45135fa52dfd3223f9b1fb62396"`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6"`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_7e9e1593ae867fb47588dc07610"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "shopId"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "shop_id" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "channel_id" integer`);
        await queryRunner.query(`ALTER TABLE "channels" ADD "shop_id" uuid`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_1ca3d079cbf5aaa058e9385c272" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_513b68b9a1bdf27e87d5ad051a2" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channels" ADD CONSTRAINT "FK_dd156d4d55a0b2841bb1e5c051d" FOREIGN KEY ("shop_id") REFERENCES "shops"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_7e9e1593ae867fb47588dc07610" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_7e9e1593ae867fb47588dc07610"`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" DROP CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP CONSTRAINT "FK_dd156d4d55a0b2841bb1e5c051d"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_513b68b9a1bdf27e87d5ad051a2"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP CONSTRAINT "FK_1ca3d079cbf5aaa058e9385c272"`);
        await queryRunner.query(`ALTER TABLE "channels" DROP COLUMN "shop_id"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "channel_id"`);
        await queryRunner.query(`ALTER TABLE "customers" DROP COLUMN "shop_id"`);
        await queryRunner.query(`ALTER TABLE "customers" ADD "shopId" uuid`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_7e9e1593ae867fb47588dc07610" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "conversation_customers" ADD CONSTRAINT "FK_d7482c297c9bc0fa71d740ad9d6" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "customers" ADD CONSTRAINT "FK_45135fa52dfd3223f9b1fb62396" FOREIGN KEY ("shopId") REFERENCES "shops"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
