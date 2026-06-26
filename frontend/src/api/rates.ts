import client from './client'

export const getLatestRates = async () => {
  const res = await client.get('/rates/latest')
  return res.data
}

export const getRateHistory = async (currency: string, days: number = 30) => {
  const res = await client.get(`/rates/history/${currency}?days=${days}`)
  return res.data
}

export const getSummary = async () => {
  const res = await client.get('/rates/summary')
  return res.data
}
