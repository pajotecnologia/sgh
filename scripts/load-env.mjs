/**
 * Carrega .env e depois .env.local (override) — padrão Next.js para dev local.
 */
import dotenv from 'dotenv'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = process.cwd()

dotenv.config({ path: resolve(root, '.env') })

const localPath = resolve(root, '.env.local')
if (existsSync(localPath)) {
  dotenv.config({ path: localPath, override: true })
}
