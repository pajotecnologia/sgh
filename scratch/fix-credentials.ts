
import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

/**
 * Replica a mesma lógica de `prisma/seed.ts`.
 * Use se no passado foram aplicadas senhas alternativas (ex.: scripts antigos com admin123 etc.)
 * e o README passou a divergir do banco.
 */
async function fixCredentials() {
  console.log('🔐 Reaplicando usuários seed e senha padrão (Sgh@2024!)...');

  const senhaPadrao = await hash('Sgh@2024!', 12);

  const usuarios = [
    { email: 'admin@hospital.com', nome: 'Administrador Sistema', role: 'ADMIN' as const },
    { email: 'medico@hospital.com', nome: 'Dr. Carlos Mendes', role: 'MEDICO' as const, crm: '123456-SP' },
    { email: 'enfermeiro@hospital.com', nome: 'Enf. Ana Beatriz Lima', role: 'ENFERMEIRO' as const, coren: 'COREN-SP 654321' },
    { email: 'recepcao@hospital.com', nome: 'Joana Silva Santos', role: 'RECEPCIONISTA' as const },
    { email: 'diretor@hospital.com', nome: 'Dr. Roberto Faria', role: 'DIRETOR_CLINICO' as const, crm: '789012-SP' },
  ];

  try {
    for (const u of usuarios) {
      console.log(`Atualizando: ${u.email}...`);
      await prisma.usuario.upsert({
        where: { email: u.email },
        update: { senhaHash: senhaPadrao, ativo: true, deletedAt: null },
        create: { ...u, senhaHash: senhaPadrao, ativo: true },
      });
    }
    console.log('\n✅ Concluído. Ex.: admin@hospital.com / Sgh@2024!');
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('❌ Erro ao reparar credenciais:', msg);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

void fixCredentials();
