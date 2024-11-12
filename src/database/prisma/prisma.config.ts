import { Expose, Type } from 'class-transformer';
import { IsBoolean, IsInt, IsOptional, IsString, ValidateIf } from 'class-validator';

import { ConfigDecorator } from '~common/config';
import { TransformInputToBoolean } from '~common/validate';

@ConfigDecorator('prisma')
export class PrismaConfig {
  /**
   * Log levels to be displayed
   *  - 'info' | 'query' | 'warn' | 'error'
   * @see https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging
   */
  @Expose()
  @IsOptional()
  @IsString({ each: true })
  log?: Array<'info' | 'query' | 'warn' | 'error'>;

  /**
   * Automatically connect to the database when the application starts
   */
  @Expose()
  @IsOptional()
  @IsBoolean()
  @TransformInputToBoolean()
  autoConnect: boolean = true;

  /**
   * Migrate the database when `./scripts/migrate.sh` is executed
   */
  @Expose()
  @IsBoolean()
  @TransformInputToBoolean()
  autoMigrate: boolean = false;

  get databaseUrl(): string {
    return this.url || `postgresql://${this.username}:${this.password}@${this.host}:${this.port}/${this.name}`;
  }

  /**
   * Database connection string
   */
  @Expose()
  @IsOptional()
  @IsString()
  url!: string;

  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  name!: string;

  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  host!: string;

  @Expose()
  @ValidateIf((o) => !o.url)
  @IsInt()
  @Type(() => Number)
  port!: number;

  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  username!: string;

  @Expose()
  @ValidateIf((o) => !o.url)
  @IsString()
  password!: string;
}
