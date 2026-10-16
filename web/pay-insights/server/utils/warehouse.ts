import { AuthTypes, Connector, IpAddressTypes } from '@google-cloud/cloud-sql-connector'
import pg from 'pg'
import type { QueryResultRow } from 'pg'

let poolPromise: Promise<pg.Pool> | undefined

async function createPool(): Promise<pg.Pool> {
  const config = useRuntimeConfig().warehouse
  // Read-only session and a query time limit, on top of the SELECT-only grant
  const base = {
    // Nuxt may parse env values into numbers/booleans; the pg driver needs strings
    database: String(config.database),
    max: 5,
    options: '-c default_transaction_read_only=on',
    statement_timeout: Number(config.statementTimeoutMs)
  }

  if (config.instanceConnectionName) {
    // In GCP: IAM auth with the service's own identity — no password or keyfile
    const connector = new Connector()
    const clientOpts = await connector.getOptions({
      instanceConnectionName: config.instanceConnectionName,
      ipType: IpAddressTypes.PUBLIC,
      authType: AuthTypes.IAM
    })
    return new pg.Pool({ ...base, ...clientOpts, user: String(config.iamUser) })
  }

  // Local development, e.g. through cloud-sql-proxy
  return new pg.Pool({
    ...base,
    host: String(config.host),
    port: Number(config.port),
    user: String(config.user),
    password: String(config.password ?? '')
  })
}

function getPool(): Promise<pg.Pool> {
  if (!poolPromise) {
    poolPromise = createPool().catch((error) => {
      poolPromise = undefined
      throw error
    })
  }
  return poolPromise
}

/**
 * Runs a parameterized query against the warehouse. Always pass user input
 * through `params` ($1, $2, ...) — never build SQL with string concatenation.
 */
export async function warehouseQuery<T extends QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  const pool = await getPool()
  const result = await pool.query<T>(sql, params)
  return result.rows
}
