/** Confirms the server can reach the warehouse. */
export default defineEventHandler(async () => {
  try {
    const [row] = await warehouseQuery<{ server_time: Date }>('SELECT now() AS server_time')
    return { serverTime: row?.server_time.toISOString() }
  } catch (error) {
    console.error('[warehouse] connection check failed', error)
    throw createError({ statusCode: 503, statusMessage: 'Warehouse unavailable' })
  }
})
