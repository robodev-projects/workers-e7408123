import { PrismaClient } from '@prisma/client';

export abstract class PrismaService {
  public abstract client: PrismaClient;
}
