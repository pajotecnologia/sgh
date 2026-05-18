/**
 * Smoke test: login NextAuth (credentials) e chamadas HTTP por perfil.
 * Uso: servidor em BASE_URL (default http://localhost:3000) e PostgreSQL com seed.
 *   node scripts/smoke-rbac.mjs
 */
const BASE = process.env.BASE_URL ?? 'http://localhost:3000';
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS ?? 45000);

async function fetchTimeout(url, options = {}) {
  const ac = new AbortController();
  const id = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: ac.signal });
  } finally {
    clearTimeout(id);
  }
}

const USUARIOS = [
  {
    papel: 'Recepcionista (atendente)',
    email: 'recepcao@hospital.com',
    senha: 'Sgh@2024!',
    esperadoRole: 'RECEPCIONISTA',
    testes: [
      { nome: 'GET /api/pacientes?pagina=1', path: '/api/pacientes?pagina=1&limite=5', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /api/triagem/fila', path: '/api/triagem/fila', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /recepcao (HTML)', path: '/recepcao', minStatus: 200, maxStatus: 299 },
    ],
  },
  {
    papel: 'Enfermeiro',
    email: 'enfermeiro@hospital.com',
    senha: 'Sgh@2024!',
    esperadoRole: 'ENFERMEIRO',
    testes: [
      { nome: 'GET /api/triagem/fila', path: '/api/triagem/fila', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /enfermagem (HTML)', path: '/enfermagem', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /triagem (HTML)', path: '/triagem', minStatus: 200, maxStatus: 299 },
    ],
  },
  {
    papel: 'Médico',
    email: 'medico@hospital.com',
    senha: 'Sgh@2024!',
    esperadoRole: 'MEDICO',
    testes: [
      { nome: 'GET /api/cid10?q=a', path: '/api/cid10?q=a', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /atendimento (HTML)', path: '/atendimento', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /triagem (HTML)', path: '/triagem', minStatus: 200, maxStatus: 299 },
    ],
  },
  {
    papel: 'Diretor clínico',
    email: 'diretor@hospital.com',
    senha: 'Sgh@2024!',
    esperadoRole: 'DIRETOR_CLINICO',
    testes: [
      { nome: 'GET /atendimento (HTML)', path: '/atendimento', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /prontuario (HTML)', path: '/prontuario', minStatus: 200, maxStatus: 299 },
      { nome: 'GET /relatorios (HTML)', path: '/relatorios', minStatus: 200, maxStatus: 299 },
    ],
  },
];

function coletarCookies(res) {
  const getSetCookie = res.headers.getSetCookie?.bind(res.headers);
  if (typeof getSetCookie === 'function') {
    return getSetCookie();
  }
  const single = res.headers.get('set-cookie');
  return single ? [single] : [];
}

function jarParaHeader(cookies) {
  return cookies.map((c) => c.split(';')[0]).join('; ');
}

function mergeCookies(jar, res) {
  const incoming = coletarCookies(res);
  const map = new Map();
  for (const line of jar) {
    const name = line.split('=')[0];
    if (name) map.set(name, line.split(';')[0]);
  }
  for (const line of incoming) {
    const name = line.split('=')[0];
    if (name) map.set(name, line.split(';')[0]);
  }
  return [...map.values()];
}

async function login(email, senha) {
  let jar = [];
  const csrfRes = await fetchTimeout(`${BASE}/api/auth/csrf`, { headers: { cookie: jarParaHeader(jar) } });
  jar = mergeCookies(jar, csrfRes);
  const { csrfToken } = await csrfRes.json();
  if (!csrfToken) throw new Error('csrfToken ausente');

  const body = new URLSearchParams({
    csrfToken,
    email,
    senha,
    callbackUrl: `${BASE}/dashboard`,
    json: 'true',
  });

  const signRes = await fetchTimeout(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      cookie: jarParaHeader(jar),
    },
    body: body.toString(),
    redirect: 'manual',
  });
  jar = mergeCookies(jar, signRes);

  const sessionRes = await fetchTimeout(`${BASE}/api/auth/session`, {
    headers: { cookie: jarParaHeader(jar) },
  });
  const session = await sessionRes.json();
  return { jar, session };
}

async function getComCookie(path, jar) {
  const url = path.startsWith('http') ? path : `${BASE}${path}`;
  return fetchTimeout(url, {
    headers: { cookie: jarParaHeader(jar) },
    redirect: 'manual',
  });
}

async function main() {
  console.log(`BASE_URL=${BASE}\n`);
  let falhas = 0;

  for (const u of USUARIOS) {
    console.log(`--- ${u.papel} (${u.email}) ---`);
    let jar;
    let session;
    try {
      ({ jar, session } = await login(u.email, u.senha));
    } catch (e) {
      const msg = e.name === 'AbortError' ? `timeout após ${TIMEOUT_MS}ms (servidor lento ou PostgreSQL inacessível)` : e.message;
      console.error('  ERRO login:', msg);
      falhas++;
      continue;
    }

    const role = session?.usuario?.role ?? session?.user?.role;
    if (!role) {
      console.error('  ERRO: sessão sem role — verifique PostgreSQL, seed e credenciais.');
      falhas++;
      continue;
    }
    if (role !== u.esperadoRole) {
      console.error(`  ERRO role: esperado ${u.esperadoRole}, veio ${role}`);
      falhas++;
    } else {
      console.log(`  OK sessão: role=${role}`);
    }

    for (const t of u.testes) {
      const res = await getComCookie(t.path, jar);
      const ok = res.status >= t.minStatus && res.status <= t.maxStatus;
      if (ok) {
        console.log(`  OK ${t.nome} → ${res.status}`);
      } else {
        const loc = res.headers.get('location');
        console.error(`  FALHA ${t.nome} → ${res.status}${loc ? ` location=${loc}` : ''}`);
        falhas++;
      }
    }
    console.log('');
  }

  if (falhas > 0) {
    console.error(`Total de falhas: ${falhas}`);
    process.exit(1);
  }
  console.log('Todos os smoke tests por perfil passaram.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
