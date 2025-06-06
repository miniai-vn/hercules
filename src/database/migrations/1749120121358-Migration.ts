import { MigrationInterface, QueryRunner } from "typeorm";

export class Migration1749120121358 implements MigrationInterface {
    name = 'Migration1749120121358'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user_channels" ("user_id" uuid NOT NULL, "channel_id" uuid NOT NULL, CONSTRAINT "PK_9a901d5bd72ef72cdc7f5acd9ea" PRIMARY KEY ("user_id", "channel_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_edf33f6c237b06704f3d57542c" ON "user_channels" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_16f3639f33054083eb7a458cd0" ON "user_channels" ("channel_id") `);
        await queryRunner.query(`CREATE TABLE "channel_users" ("channel_id" integer NOT NULL, "user_id" uuid NOT NULL, CONSTRAINT "PK_399c0551709fe23cbc744bbfe50" PRIMARY KEY ("channel_id", "user_id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_172af4652df61837a64d5e7995" ON "channel_users" ("channel_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_a7a2db7198d61d6a301fdfeb3e" ON "channel_users" ("user_id") `);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_edf33f6c237b06704f3d57542cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "user_channels" ADD CONSTRAINT "FK_16f3639f33054083eb7a458cd0f" FOREIGN KEY ("channel_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_users" ADD CONSTRAINT "FK_172af4652df61837a64d5e79955" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE SET NULL ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "channel_users" ADD CONSTRAINT "FK_a7a2db7198d61d6a301fdfeb3ed" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "channel_users" DROP CONSTRAINT "FK_a7a2db7198d61d6a301fdfeb3ed"`);
        await queryRunner.query(`ALTER TABLE "channel_users" DROP CONSTRAINT "FK_172af4652df61837a64d5e79955"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_16f3639f33054083eb7a458cd0f"`);
        await queryRunner.query(`ALTER TABLE "user_channels" DROP CONSTRAINT "FK_edf33f6c237b06704f3d57542cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a7a2db7198d61d6a301fdfeb3e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_172af4652df61837a64d5e7995"`);
        await queryRunner.query(`DROP TABLE "channel_users"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_16f3639f33054083eb7a458cd0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_edf33f6c237b06704f3d57542c"`);
        await queryRunner.query(`DROP TABLE "user_channels"`);
    }

}
