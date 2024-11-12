import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import { LoggerService } from '~common/logger';
import { makeId } from '~common/utils/short-uuid';

import { getPrismaClient } from './prisma-client.helper';
import { PrismaConfig } from './prisma.config';

/**
 * Provide a temporary database
 *  - clone the current state of the input database
 */
@Injectable()
export class PrismaEphemeralService implements OnModuleInit, OnModuleDestroy {
  public client: PrismaClient;

  private readonly databaseSchema: string;
  private readonly databaseUrl: string;
  private readonly prefix = 'ephemeral-';

  public destroyOnExit = true;

  constructor(
    private readonly config: PrismaConfig,
    private readonly logger: LoggerService,
  ) {
    process.env.CHECKPOINT_DISABLE = '1';

    this.databaseSchema = `${this.prefix}${makeId()}`;
    this.databaseUrl = config.databaseUrl + `?schema=${this.databaseSchema}`;
    this.client = getPrismaClient(
      {
        ...this.config,
        databaseUrl: this.databaseUrl,
      },
      this.logger,
    );
  }

  /**
   * Destroy all ephemeral databases
   */
  async destroyAllEphemeralSchemas() {
    await this.client.$executeRawUnsafe(`
DO $$DECLARE
    schemata RECORD;
BEGIN
  FOR schemata IN (SELECT schema_name FROM information_schema.schemata WHERE schema_name LIKE '${this.prefix}%' )
    LOOP
      EXECUTE 'DROP SCHEMA IF EXISTS "' || schemata.schema_name || '" CASCADE';
    END LOOP;
END$$;`);
  }

  async destroyEphemeralSchema() {
    await this.client.$executeRawUnsafe(`DROP SCHEMA IF EXISTS "${this.databaseSchema}" CASCADE;`);
  }

  /**
   * Create the ephemeral database schema from the "public" schema
   *  - we expect the public schema to exist and to be fully migrated
   */
  async createEphemeralSchema() {
    await this.client.$executeRawUnsafe(`CREATE SCHEMA "${this.databaseSchema}";`);

    // copy tables from the main schema
    await this.client.$executeRawUnsafe(`
DO $$DECLARE
    tbl_record RECORD;
BEGIN
    FOR tbl_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'CREATE TABLE "${this.databaseSchema}".' || quote_ident(tbl_record.tablename) || ' (LIKE public.' || quote_ident(tbl_record.tablename) || ' INCLUDING ALL)';
    END LOOP;
END$$;`);
  }

  /**
   * Copy the "public" schema data into the ephemeral schema
   *  - the public schema to be fully seeded
   */
  async populateEphemeralSchema() {
    await this.client.$executeRawUnsafe(`
DO $$DECLARE
    tbl_record RECORD;
BEGIN
    FOR tbl_record IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'INSERT INTO "${this.databaseSchema}".' || quote_ident(tbl_record.tablename) || ' SELECT * FROM public.' || quote_ident(tbl_record.tablename);
    END LOOP;
END$$;`);
  }

  async onModuleDestroy() {
    if (this.destroyOnExit) {
      await this.destroyEphemeralSchema();
    }
    await this.client.$disconnect();
  }

  async onModuleInit() {
    // await this.destroyAllEphemeralSchemas();
    await this.createEphemeralSchema();
    await this.populateEphemeralSchema();
  }
}
