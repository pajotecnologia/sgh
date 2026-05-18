
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const us = await prisma.usuario.findMany({
    select: { email: true, role: true, ativo: true }
  });
  console.table(us);
  await prisma.$disconnect();
  await pool.end();
}

main();
