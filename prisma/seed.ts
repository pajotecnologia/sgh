// prisma/seed.ts — Seed inicial: usuário admin + usuários de cada role para testes
import 'dotenv/config'; // Carrega .env antes de qualquer coisa
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...');

  const senhaPadrao = await hash('Sgh@2024!', 12);

  const usuarios = [
    { email: 'admin@hospital.com', nome: 'Administrador Sistema', role: 'ADMIN' as const },
    { email: 'medico@hospital.com', nome: 'Dr. Carlos Mendes', role: 'MEDICO' as const, crm: '123456-SP' },
    { email: 'enfermeiro@hospital.com', nome: 'Enf. Ana Beatriz Lima', role: 'ENFERMEIRO' as const, coren: 'COREN-SP 654321' },
    { email: 'recepcao@hospital.com', nome: 'Joana Silva Santos', role: 'RECEPCIONISTA' as const },
    { email: 'diretor@hospital.com', nome: 'Dr. Roberto Faria', role: 'DIRETOR_CLINICO' as const, crm: '789012-SP' },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { email: u.email },
      update: { senhaHash: senhaPadrao, ativo: true },
      create: { ...u, senhaHash: senhaPadrao, ativo: true },
    });
    console.log(`✅ Usuário criado: ${u.email} (${u.role})`);
  }

  console.log('\n✨ Seed concluído!');
  console.log('📧 Acesso: admin@hospital.com / Sgh@2024!');
  console.log('⚠️  Troque as senhas imediatamente em produção!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
