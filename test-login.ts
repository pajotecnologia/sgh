import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { compare, hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = 'admin@hospital.com';
  const plainTextPassword = 'Sgh@2024!';

  console.log('Testing login for:', email);

  const usuario = await prisma.usuario.findFirst({
    where: {
      email: email.toLowerCase().trim(),
    },
  });

  if (!usuario) {
    console.log('User not found at all.');
    return;
  }
  
  console.log('User found:', {
    id: usuario.id,
    email: usuario.email,
    ativo: usuario.ativo,
    deletedAt: usuario.deletedAt,
    senhaHashSnippet: usuario.senhaHash.substring(0, 10) + '...',
  });

  if (!usuario.ativo) {
    console.log('User is not active.');
  }

  if (usuario.deletedAt !== null) {
    console.log('User is deleted.');
  }

  const senhaValida = await compare(plainTextPassword, usuario.senhaHash);
  console.log('Password valid?:', senhaValida);
  
  const testHash = await hash(plainTextPassword, 12);
  const testValid = await compare(plainTextPassword, testHash);
  console.log('Test hash valid?:', testValid);
}

main().catch(console.error).finally(() => process.exit(0));
