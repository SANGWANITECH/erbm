import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRateHistory } from '../api/rates'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Area, AreaChart, Legend
} from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

const CURRENCIES = [
  { code: 'MWK', name: 'MWK / USD', color: '#1B2A4A', desc: 'Malawi Kwacha per US Dollar' },
  { code: 'GBP', name: 'MWK / GBP', color: '#0E7490', desc: 'Malawi Kwacha per British Pound' },
  { code: 'EUR', name: 'MWK / EUR', color: '#B8860B', desc: 'Malawi Kwacha per Euro' },
  { code: 'ZAR', name: 'MWK / ZAR', color: '#15803D', desc: 'Malawi Kwacha per South African Rand' },
  { code: 'ZMW', name: 'MWK / ZMW', color: '#B91C1C', desc: 'Malawi Kwacha per Zambian Kwacha' },
  { code: 'MZN', name: 'MWK / MZN', color: '#7C3AED', desc: 'Malawi Kwacha per Mozambican Metical' },
  { code: 'INR', name: 'MWK / INR', color: '#EA580C', desc: 'Malawi Kwacha per Indian Rupee' },
  { code: 'AED', name: 'MWK / AED', color: '#0F766E', desc: 'Malawi Kwacha per UAE Dirham' },
]

const PERIODS = [
  { label: '7 days', days: 7 },
  { label: '30 days', days: 30 },
  { label: '90 days', days: 90 },
  { label: '1 year', days: 365 },
]

function StatPill({ label, value, up }: { label: string; value: string; up?: boolean | null }) {
  const color = up === true ? 'var(--red)' : up === false ? 'var(--green)' : 'var(--text-dim)'
  const bg = up === true ? 'var(--red-dim)' : up === false ? 'var(--green-dim)' : 'var(--bg-2)'
  return (
    <div style={{ background: bg, border: `1px solid ${color}`, borderRadius: '6px', padding: '10px 16px', minWidth: '130px' }}>
      <div style={{ fontSize: '10px', color: 'var(--text-dim)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '15px', fontWeight: 700, color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
    </div>
  )
}

const CustomTooltip = ({ active, payload, label, currency }: any) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border-dark)',
      borderRadius: '6px', padding: '10px 14px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--navy)', fontFamily: 'JetBrains Mono, monospace' }}>
        {currency === 'MWK' ? `${val?.toFixed(2)} MWK/USD` : `${val?.toFixed(4)}`}
      </div>
    </div>
  )
}

export default function Charts() {
  const [selectedCurrency, setSelectedCurrency] = useState('MWK')
  const [selectedDays, setSelectedDays] = useState(90)

  const { data, isLoading } = useQuery({
    queryKey: ['history', selectedCurrency, selectedDays],
    queryFn: () => getRateHistory(selectedCurrency, selectedDays),
    refetchInterval: 300000,
  })

  const history = data?.history || []

  // Deduplicate by day — take one reading per day (last of the day)
  const dailyData = (() => {
    const seen = new Map()
    for (const item of history) {
      const day = item.timestamp.split('T')[0]
      seen.set(day, item)
    }
    return Array.from(seen.values()).map(item => ({
      date: new Date(item.timestamp).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }),
      rate: selectedCurrency === 'MWK' ? item.rate : item.mwk_per_unit,
      rawDate: item.timestamp,
    }))
  })()

  // Analytics from chart data
  const rates = dailyData.map(d => d.rate).filter(Boolean)
  const minRate = rates.length ? Math.min(...rates) : 0
  const maxRate = rates.length ? Math.max(...rates) : 0
  const avgRate = rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0
  const firstRate = rates[0] || 0
  const lastRate = rates[rates.length - 1] || 0
  const periodChange = firstRate ? ((lastRate - firstRate) / firstRate) * 100 : 0
  const isUp = periodChange > 0.01
  const isDown = periodChange < -0.01

  const cur = CURRENCIES.find(c => c.code === selectedCurrency)
  const yDomain = rates.length ? [
    Math.floor(minRate * 0.998),
    Math.ceil(maxRate * 1.002),
  ] : ['auto', 'auto']

  return (
    <div className='page-pad' style={{ padding: '24px', maxWidth: '1100px' }}>

      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          Trend Analysis
        </h1>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
          Historical exchange rate movements and volatility analysis for the Malawi Kwacha
        </p>
      </div>

      {/* Currency selector */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '16px 20px', marginBottom: '16px',
        display: 'flex', alignItems: 'flex-start', gap: '24px', flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Currency Pair</div>
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
            {CURRENCIES.map(c => (
              <button key={c.code} onClick={() => setSelectedCurrency(c.code)}
                style={{
                  padding: '6px 14px', borderRadius: '4px', border: '1px solid',
                  fontSize: '12px', fontWeight: 600, cursor: 'pointer',
                  borderColor: selectedCurrency === c.code ? c.color : 'var(--border-dark)',
                  background: selectedCurrency === c.code ? `${c.color}18` : 'transparent',
                  color: selectedCurrency === c.code ? c.color : 'var(--text-secondary)',
                }}>
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div style={{ borderLeft: '1px solid var(--border)', paddingLeft: '24px' }}>
          <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>Time Period</div>
          <div style={{ display: 'flex', gap: '6px' }}>
            {PERIODS.map(p => (
              <button key={p.days} onClick={() => setSelectedDays(p.days)}
                style={{
                  padding: '6px 14px', borderRadius: '4px', border: '1px solid',
                  fontSize: '12px', fontWeight: 500, cursor: 'pointer',
                  borderColor: selectedDays === p.days ? 'var(--navy)' : 'var(--border-dark)',
                  background: selectedDays === p.days ? 'var(--navy)' : 'transparent',
                  color: selectedDays === p.days ? '#fff' : 'var(--text-secondary)',
                }}>
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Analytics pills */}
      <div className='mwk-stats-row' style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <StatPill label={`Period Change (${PERIODS.find(p => p.days === selectedDays)?.label})`}
          value={`${periodChange > 0 ? '+' : ''}${periodChange.toFixed(2)}%`}
          up={isUp ? true : isDown ? false : null} />
        <StatPill label="Period High" value={selectedCurrency === 'MWK' ? maxRate.toFixed(2) : maxRate.toFixed(4)} up={null} />
        <StatPill label="Period Low" value={selectedCurrency === 'MWK' ? minRate.toFixed(2) : minRate.toFixed(4)} up={null} />
        <StatPill label="Period Average" value={selectedCurrency === 'MWK' ? avgRate.toFixed(2) : avgRate.toFixed(4)} up={null} />
        <StatPill label="Data Points" value={String(dailyData.length)} up={null} />
      </div>

      {/* Main chart */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '6px', overflow: 'hidden', marginBottom: '16px',
      }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          background: 'var(--bg-2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        }}>
          <div>
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {cur?.desc}
            </span>
            <span style={{ marginLeft: '12px', fontSize: '11px', color: 'var(--text-dim)' }}>
              {PERIODS.find(p => p.days === selectedDays)?.label} trend
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: isUp ? 'var(--red)' : isDown ? 'var(--green)' : 'var(--text-dim)', fontWeight: 600 }}>
            {isUp ? <TrendingUp size={14} /> : isDown ? <TrendingDown size={14} /> : <Minus size={14} />}
            {isUp ? 'Kwacha weakening' : isDown ? 'Kwacha strengthening' : 'Stable'}
          </div>
        </div>

        <div style={{ padding: '20px' }}>
          {isLoading ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Loading chart data...</span>
            </div>
          ) : dailyData.length === 0 ? (
            <div style={{ height: '320px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>No data available for this period</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={dailyData} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
                <defs>
                  <linearGradient id="rateGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={cur?.color || '#1B2A4A'} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={cur?.color || '#1B2A4A'} stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  tickLine={false}
                  axisLine={false}
                  interval={Math.floor(dailyData.length / 8)}
                />
                <YAxis
                  domain={yDomain}
                  tick={{ fontSize: 10, fill: '#94A3B8', fontFamily: 'JetBrains Mono, monospace' }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                  tickFormatter={v => selectedCurrency === 'MWK' ? v.toFixed(0) : v.toFixed(2)}
                />
                <Tooltip content={<CustomTooltip currency={selectedCurrency} />} />
                <ReferenceLine
                  y={avgRate}
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  label={{ value: 'Avg', position: 'right', fontSize: 10, fill: '#94A3B8' }}
                />
                <Area
                  type="monotone"
                  dataKey="rate"
                  stroke={cur?.color || '#1B2A4A'}
                  strokeWidth={2}
                  fill="url(#rateGradient)"
                  dot={false}
                  activeDot={{ r: 4, fill: cur?.color || '#1B2A4A', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Interpretation box */}
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '14px 18px',
      }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Analytical Summary
        </div>
        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
          Over the selected {PERIODS.find(p => p.days === selectedDays)?.label} period, the{' '}
          <strong style={{ color: 'var(--text-primary)' }}>{cur?.desc}</strong>{' '}
          {isUp
            ? `increased by ${Math.abs(periodChange).toFixed(2)}%, indicating the Kwacha has weakened against this currency. The rate moved from ${firstRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)} to ${lastRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)}.`
            : isDown
            ? `decreased by ${Math.abs(periodChange).toFixed(2)}%, indicating the Kwacha has strengthened against this currency. The rate moved from ${firstRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)} to ${lastRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)}.`
            : `remained relatively stable over this period, with minimal movement between ${firstRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)} and ${lastRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)}.`
          }
          {' '}The period high was {maxRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)} and the period low was {minRate.toFixed(selectedCurrency === 'MWK' ? 2 : 4)}, giving a range of {(maxRate - minRate).toFixed(selectedCurrency === 'MWK' ? 2 : 4)}.
        </p>
      </div>
    </div>
  )
}
