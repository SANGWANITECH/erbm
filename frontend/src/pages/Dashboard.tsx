import { useQuery } from '@tanstack/react-query'
import { getLatestRates, getSummary } from '../api/rates'
import { getAlerts } from '../api/alerts'
import { TrendingUp, TrendingDown, Minus, AlertTriangle, RefreshCw, Activity } from 'lucide-react'

function StatCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: '6px', padding: '16px 20px',
      borderTop: `3px solid ${color || 'var(--navy)'}`,
    }}>
      <div style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '8px' }}>{label}</div>
      <div style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', fontFamily: 'JetBrains Mono, monospace', marginBottom: '4px' }}>{value}</div>
      {sub && <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{sub}</div>}
    </div>
  )
}

function DirectionIcon({ direction }: { direction: string }) {
  if (direction === 'up') return <TrendingUp size={14} color="var(--red)" />
  if (direction === 'down') return <TrendingDown size={14} color="var(--green)" />
  return <Minus size={14} color="var(--text-dim)" />
}

function ChangeTag({ pct, direction }: { pct: number; direction: string }) {
  const color = direction === 'up' ? 'var(--red)' : direction === 'down' ? 'var(--green)' : 'var(--text-dim)'
  const bg = direction === 'up' ? 'var(--red-dim)' : direction === 'down' ? 'var(--green-dim)' : 'var(--bg-2)'
  return (
    <span style={{
      background: bg, color, fontSize: '11px', fontWeight: 600,
      padding: '2px 8px', borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace',
      display: 'inline-flex', alignItems: 'center', gap: '3px',
    }}>
      <DirectionIcon direction={direction} />
      {Math.abs(pct).toFixed(2)}%
    </span>
  )
}

export default function Dashboard() {
  const { data: ratesData, isLoading: ratesLoading, refetch } = useQuery({
    queryKey: ['rates-latest'],
    queryFn: getLatestRates,
    refetchInterval: 60000,
  })

  const { data: summaryData } = useQuery({
    queryKey: ['summary'],
    queryFn: getSummary,
    refetchInterval: 60000,
  })

  const { data: alertsData } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 30000,
  })

  const rates = ratesData?.rates || []
  const mwk = rates.find((r: any) => r.currency === 'MWK')
  const unackAlerts = alertsData?.alerts?.filter((a: any) => !a.acknowledged).length || 0
  const lastUpdated = mwk?.last_updated ? new Date(mwk.last_updated).toLocaleString('en-GB') : '—'

  return (
    <div className='page-pad' style={{ padding: '24px', maxWidth: '1100px' }}>

      {/* Page header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Exchange Rate Overview
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Real-time Malawi Kwacha exchange rate monitoring and analysis
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Last updated: {lastUpdated}</span>
          <button onClick={() => refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--surface)', border: '1px solid var(--border-dark)',
              borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--surface)'}
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* Key stats */}
      <div className='stat-grid-4' style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '24px' }}>
        <StatCard
          label="MWK / USD Rate"
          value={mwk ? `${mwk.rate.toFixed(2)}` : '—'}
          sub="Malawi Kwacha per US Dollar"
          color="var(--navy)"
        />
        <StatCard
          label="24h Change"
          value={mwk ? `${mwk.change_24h_pct > 0 ? '+' : ''}${mwk.change_24h_pct.toFixed(2)}%` : '—'}
          sub={mwk?.direction === 'up' ? 'Kwacha weakening' : mwk?.direction === 'down' ? 'Kwacha strengthening' : 'Stable'}
          color={mwk?.direction === 'up' ? 'var(--red)' : mwk?.direction === 'down' ? 'var(--green)' : 'var(--text-dim)'}
        />
        <StatCard
          label="7-Day Volatility"
          value={mwk ? `${mwk.volatility_7d.toFixed(4)}%` : '—'}
          sub={mwk?.volatility_7d < 0.2 ? 'Low — stable conditions' : mwk?.volatility_7d < 0.5 ? 'Moderate' : 'High — monitor closely'}
          color={mwk?.volatility_7d < 0.2 ? 'var(--green)' : mwk?.volatility_7d < 0.5 ? 'var(--amber)' : 'var(--red)'}
        />
        <StatCard
          label="Active Alerts"
          value={String(unackAlerts)}
          sub={unackAlerts === 0 ? 'No unacknowledged alerts' : 'Require attention'}
          color={unackAlerts > 0 ? 'var(--amber)' : 'var(--green)'}
        />
      </div>

      {/* Rates table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', marginBottom: '24px', overflow: 'hidden' }}>
        <div style={{
          padding: '14px 20px', borderBottom: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-2)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={15} color="var(--navy)" />
            <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Live Exchange Rates</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Base currency: USD · Rates updated hourly</span>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'var(--bg-2)' }}>
              {['Currency', 'Rate (vs USD)', 'MWK per Unit', '24h Change', '7-Day Avg', 'Volatility', 'Est. Spread'].map(h => (
                <th key={h} style={{
                  padding: '10px 16px', textAlign: 'left', fontSize: '11px',
                  fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em',
                  textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
                }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ratesLoading ? (
              <tr><td colSpan={7} style={{ padding: '24px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>Loading rates...</td></tr>
            ) : rates.map((rate: any, i: number) => (
              <tr key={rate.currency}
                style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = '#EFF6FF'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--bg-2)'}
              >
                <td style={{ padding: '12px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px', height: '20px', background: 'var(--navy)',
                      borderRadius: '3px', display: 'flex', alignItems: 'center',
                      justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff',
                    }}>{rate.currency}</div>
                    <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {rate.currency === 'MWK' ? 'Malawi Kwacha' :
                       rate.currency === 'ZAR' ? 'South African Rand' :
                       rate.currency === 'GBP' ? 'British Pound' :
                       rate.currency === 'EUR' ? 'Euro' :
                       rate.currency === 'ZMW' ? 'Zambian Kwacha' :
                       rate.currency === 'TZS' ? 'Tanzanian Shilling' :
                       rate.currency === 'CNY' ? 'Chinese Yuan' :
                       rate.currency === 'MZN' ? 'Mozambican Metical' :
                       rate.currency === 'INR' ? 'Indian Rupee' :
                       rate.currency === 'AED' ? 'UAE Dirham' : rate.currency}
                    </span>
                  </div>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                    {rate.rate.toFixed(4)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: '13px', color: 'var(--navy)', fontWeight: 600 }}>
                    {rate.currency === 'MWK' ? '1.0000' : rate.mwk_per_unit?.toFixed(4) || '—'}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <ChangeTag pct={rate.change_24h_pct} direction={rate.direction} />
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {rate.moving_avg_7d.toFixed(4)}
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  <span className="mono" style={{ fontSize: '12px', color: rate.volatility_7d > 0.5 ? 'var(--red)' : rate.volatility_7d > 0.2 ? 'var(--amber)' : 'var(--green)' }}>
                    {rate.volatility_7d.toFixed(4)}%
                  </span>
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {rate.spread ? (
                    <span className="mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      {rate.spread.spread_pct}%
                    </span>
                  ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Note */}
      <div style={{
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '12px 16px',
        display: 'flex', alignItems: 'flex-start', gap: '10px',
      }}>
        <AlertTriangle size={14} color="var(--amber)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <strong style={{ color: 'var(--text-secondary)' }}>Note:</strong> Rates are sourced from ExchangeRate-API and updated hourly.
          Spread estimates are approximations based on typical Malawian commercial bank margins (2% per side).
          For official RBM rates, refer to the Reserve Bank of Malawi daily rate bulletin.
          24h change and volatility figures are based on seeded historical data and live updates.
        </p>
      </div>
    </div>
  )
}
