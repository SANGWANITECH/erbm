import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getLatestRates } from '../api/rates'
import { TrendingUp, TrendingDown, Minus, RefreshCw, Info } from 'lucide-react'

const CURRENCY_NAMES: Record<string, { name: string; country: string }> = {
  MWK: { name: 'Malawi Kwacha', country: 'Malawi' },
  ZAR: { name: 'South African Rand', country: 'South Africa' },
  GBP: { name: 'British Pound Sterling', country: 'United Kingdom' },
  EUR: { name: 'Euro', country: 'Eurozone' },
  ZMW: { name: 'Zambian Kwacha', country: 'Zambia' },
  TZS: { name: 'Tanzanian Shilling', country: 'Tanzania' },
  CNY: { name: 'Chinese Yuan Renminbi', country: 'China' },
  MZN: { name: 'Mozambican Metical', country: 'Mozambique' },
  INR: { name: 'Indian Rupee', country: 'India' },
  AED: { name: 'UAE Dirham', country: 'United Arab Emirates' },
}

function VolatilityBar({ value }: { value: number }) {
  const pct = Math.min(value / 3 * 100, 100)
  const color = value > 0.5 ? 'var(--red)' : value > 0.2 ? 'var(--amber)' : 'var(--green)'
  const label = value > 0.5 ? 'High' : value > 0.2 ? 'Moderate' : 'Low'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
        <span style={{ fontSize: '10px', color, fontWeight: 600 }}>{label}</span>
        <span className="mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>{value.toFixed(4)}%</span>
      </div>
      <div style={{ height: '4px', background: 'var(--bg-3)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: '2px', transition: 'width 0.5s ease' }} />
      </div>
    </div>
  )
}

export default function RatesTable() {
  const [sortBy, setSortBy] = useState<'currency' | 'rate' | 'change' | 'volatility'>('currency')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery({
    queryKey: ['rates-latest'],
    queryFn: getLatestRates,
    refetchInterval: 60000,
  })

  const rates = data?.rates || []

  const sorted = [...rates].sort((a: any, b: any) => {
    let aVal, bVal
    if (sortBy === 'currency') { aVal = a.currency; bVal = b.currency }
    else if (sortBy === 'rate') { aVal = a.rate; bVal = b.rate }
    else if (sortBy === 'change') { aVal = a.change_24h_pct; bVal = b.change_24h_pct }
    else { aVal = a.volatility_7d; bVal = b.volatility_7d }
    if (aVal < bVal) return sortDir === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDir === 'asc' ? 1 : -1
    return 0
  })

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(col); setSortDir('asc') }
  }

  const SortIcon = ({ col }: { col: typeof sortBy }) => {
    if (sortBy !== col) return <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>↕</span>
    return <span style={{ color: 'var(--navy)', marginLeft: '4px' }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  const thStyle = (col: typeof sortBy): React.CSSProperties => ({
    padding: '10px 16px', textAlign: 'left', fontSize: '11px',
    fontWeight: 600, color: 'var(--text-dim)', letterSpacing: '0.04em',
    textTransform: 'uppercase', borderBottom: '1px solid var(--border)',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    background: sortBy === col ? '#EFF6FF' : 'var(--bg-2)',
  })

  return (
    <div className='page-pad' style={{ padding: '24px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>Live Exchange Rates</h1>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Current Malawi Kwacha rates with 24-hour analytics · Updated hourly
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {dataUpdatedAt ? (
            <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
              Last fetch: {new Date(dataUpdatedAt).toLocaleTimeString('en-GB')}
            </span>
          ) : null}
          <button onClick={() => refetch()}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: 'var(--surface)', border: '1px solid var(--border-dark)',
              borderRadius: '6px', padding: '6px 12px', fontSize: '12px',
              color: 'var(--text-secondary)', cursor: 'pointer',
            }}>
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>

      {/* MWK highlight card */}
      {rates.find((r: any) => r.currency === 'MWK') && (() => {
        const mwk = rates.find((r: any) => r.currency === 'MWK')
        const isUp = mwk.direction === 'up'
        const isDown = mwk.direction === 'down'
        return (
          <div style={{
            background: 'var(--navy)', borderRadius: '8px', padding: '20px 24px',
            marginBottom: '20px', display: 'flex', alignItems: 'center',
            justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px',
            borderLeft: '4px solid var(--gold)',
          }}>
            <div>
              <div style={{ fontSize: '11px', color: 'rgba(255,255,255,0.55)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
                Official Reference Rate — MWK / USD
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
                <span className="mono" style={{ fontSize: '32px', fontWeight: 700, color: '#fff' }}>
                  {mwk.rate.toFixed(2)}
                </span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>MWK per USD</span>
              </div>
            </div>
            <div className='mwk-stats-row' style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
              {[
                { label: '24h Change', value: `${mwk.change_24h_pct > 0 ? '+' : ''}${mwk.change_24h_pct.toFixed(2)}%`, color: isUp ? '#FCA5A5' : isDown ? '#86EFAC' : 'rgba(255,255,255,0.6)' },
                { label: '7-Day Average', value: mwk.moving_avg_7d.toFixed(2), color: 'rgba(255,255,255,0.8)' },
                { label: 'Volatility', value: `${mwk.volatility_7d.toFixed(4)}%`, color: mwk.volatility_7d < 0.2 ? '#86EFAC' : mwk.volatility_7d < 0.5 ? '#FCD34D' : '#FCA5A5' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '10px', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>{label}</div>
                  <div className="mono" style={{ fontSize: '16px', fontWeight: 600, color }}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Full rates table */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
          <thead>
            <tr>
              <th style={thStyle('currency')} onClick={() => handleSort('currency')}>
                Currency <SortIcon col="currency" />
              </th>
              <th style={{ ...thStyle('rate'), textAlign: 'right' }} onClick={() => handleSort('rate')}>
                Rate (USD) <SortIcon col="rate" />
              </th>
              <th style={{ ...thStyle('rate'), textAlign: 'right' }}>MWK per Unit</th>
              <th style={{ ...thStyle('change'), textAlign: 'center' }} onClick={() => handleSort('change')}>
                24h Change <SortIcon col="change" />
              </th>
              <th style={{ ...thStyle('rate'), textAlign: 'right' }}>7-Day Avg</th>
              <th style={{ ...thStyle('volatility') }} onClick={() => handleSort('volatility')}>
                7-Day Volatility <SortIcon col="volatility" />
              </th>
              <th style={{ ...thStyle('rate') }}>Buy / Sell Spread</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={7} style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)', fontSize: '13px' }}>
                Loading exchange rates...
              </td></tr>
            ) : sorted.map((rate: any, i: number) => {
              const info = CURRENCY_NAMES[rate.currency]
              const isUp = rate.direction === 'up'
              const isDown = rate.direction === 'down'
              const changeColor = isUp ? 'var(--red)' : isDown ? 'var(--green)' : 'var(--text-dim)'
              const changeBg = isUp ? 'var(--red-dim)' : isDown ? 'var(--green-dim)' : 'var(--bg-2)'

              return (
                <tr key={rate.currency}
                  style={{ background: i % 2 === 0 ? 'var(--surface)' : 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#F0F7FF'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--bg-2)'}
                >
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '22px', background: 'var(--navy)',
                        borderRadius: '3px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontSize: '9px', fontWeight: 700, color: '#fff', flexShrink: 0,
                      }}>{rate.currency}</div>
                      <div>
                        <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>{info?.name || rate.currency}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-dim)' }}>{info?.country}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)' }}>
                      {rate.rate.toFixed(4)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span className="mono" style={{ fontSize: '13px', fontWeight: 600, color: 'var(--navy)' }}>
                      {rate.currency === 'MWK' ? '1.0000' : rate.mwk_per_unit?.toFixed(4) || '—'}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      background: changeBg, color: changeColor,
                      fontSize: '11px', fontWeight: 600, padding: '3px 10px',
                      borderRadius: '4px', fontFamily: 'JetBrains Mono, monospace',
                    }}>
                      {isUp ? <TrendingUp size={11} /> : isDown ? <TrendingDown size={11} /> : <Minus size={11} />}
                      {Math.abs(rate.change_24h_pct).toFixed(2)}%
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <span className="mono" style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                      {rate.moving_avg_7d.toFixed(4)}
                    </span>
                  </td>
                  <td style={{ padding: '14px 16px', minWidth: '140px' }}>
                    <VolatilityBar value={rate.volatility_7d} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    {rate.spread ? (
                      <div style={{ fontSize: '11px' }}>
                        <div style={{ display: 'flex', gap: '8px', marginBottom: '2px' }}>
                          <span style={{ color: 'var(--green)', fontWeight: 500 }}>B: </span>
                          <span className="mono" style={{ color: 'var(--text-secondary)' }}>{rate.spread.buy_rate.toFixed(4)}</span>
                          <span style={{ color: 'var(--red)', fontWeight: 500, marginLeft: '4px' }}>S: </span>
                          <span className="mono" style={{ color: 'var(--text-secondary)' }}>{rate.spread.sell_rate.toFixed(4)}</span>
                        </div>
                        <div style={{ color: 'var(--text-dim)', fontSize: '10px' }}>Spread: {rate.spread.spread_pct}%</div>
                      </div>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Footer note */}
      <div style={{
        marginTop: '16px', padding: '12px 16px',
        background: 'var(--bg-2)', border: '1px solid var(--border)',
        borderRadius: '6px', display: 'flex', gap: '8px', alignItems: 'flex-start',
      }}>
        <Info size={13} color="var(--teal)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.6 }}>
          Rates are sourced from ExchangeRate-API (interbank mid-market rates) and refreshed hourly.
          Buy/sell spreads are estimated at 2% per side based on typical Malawian commercial bank margins.
          Volatility is calculated as the standard deviation of daily returns over the past 7 days.
          For official RBM published rates, refer to the Reserve Bank of Malawi daily bulletin at rbm.mw.
        </p>
      </div>
    </div>
  )
}
