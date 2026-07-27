'use strict'
/**
 * Ponto de entrada para painéis (aaPanel / PM2 / Node).
 * Não é necessário executar node server.js manualmente.
 */
process.env.NODE_ENV = process.env.NODE_ENV || 'production'
require('./server.js')
