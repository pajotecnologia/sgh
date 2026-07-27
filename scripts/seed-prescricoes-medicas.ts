import 'dotenv/config'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { seedPrescricoesMedicasPadrao } from '../prisma/seed-prescricoes-medicas'

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Inserindo prescrições médicas padrão (demo)...\n')
  const n = await seedPrescricoesMedicasPadrao(prisma)
  console.log(`\n✨ Concluído — ${n} prescrição(ões) nova(s).`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
