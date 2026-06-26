import client from './client'

export const getAlerts = async () => {
  const res = await client.get('/alerts/')
  return res.data
}

export const acknowledgeAlert = async (id: number) => {
  const res = await client.post(`/alerts/${id}/acknowledge`)
  return res.data
}
