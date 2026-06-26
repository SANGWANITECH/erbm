import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAlerts, acknowledgeAlert } from '../api/alerts'
import { Bell, CheckCircle, AlertTriangle, TrendingUp, Clock, Filter } from 'lucide-react'

export default function Alerts() {
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<'all' | 'unacknowledged'>('all')

  const { data, isLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: getAlerts,
    refetchInterval: 30000,
  })

  const ackMutation = useMutation({
    mutationFn: acknowledgeAlert,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  })

  const allAlerts = data?.alerts || []
  const filtered = filter === 'unacknowledged' ? allAlerts.filter((a: any) => !a.acknowledged) : allAlerts
  const unackCount = allAlerts.filter((a: any) => !a.acknowledged).length

  const alertTypeIcon = (type: string) => {
    if (type.includes('THRESHOLD')) return <TrendingUp size={14} />
    if (type.includes('ANOMALY')) return <AlertTriangle size={14} />
    return <Bell size={14} />
  }

  const alertTypeColor = (type: string) => {
    if (type.includes('THRESHOLD')) return { color: 'var(--red)', bg: 'var(--red-dim)' }
    if (type.includes('ANOMALY')) return { color: 'var(--amber)', bg: 'var(--amber-dim)' }
    return { color: 'var(--teal)', bg: 'var(--teal-dim)' }
  }

  return (
    <div className='page-pad' style={{ padding: '24px', maxWidth: '900px' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
            Rate Alerts
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
            Automated alerts for exchange rate anomalies and threshold breaches
          </p>
        </div>
        {unackCount > 0 && (
          <div style={{
            background: 'var(--amber-dim)', border: '1px solid var(--amber)',
            borderRadius: '6px', padding: '8px 16px',
            display: 'flex', alignItems: 'center', gap: '8px',
          }}>
            <AlertTriangle size={14} color="var(--amber)" />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--amber)' }}>
              {unackCount} alert{unackCount > 1 ? 's' : ''} require attention
            </span>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className='stat-grid-3' style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
        {[
          { label: 'Total Alerts', value: allAlerts.length, color: 'var(--navy)', icon: Bell },
          { label: 'Unacknowledged', value: unackCount, color: unackCount > 0 ? 'var(--amber)' : 'var(--green)', icon: AlertTriangle },
          { label: 'Acknowledged', value: allAlerts.length - unackCount, color: 'var(--green)', icon: CheckCircle },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '14px 18px',
            borderTop: `3px solid ${color}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '11px', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 500 }}>{label}</span>
              <Icon size={14} color={color} />
            </div>
            <div className="mono" style={{ fontSize: '24px', fontWeight: 700, color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: '6px', padding: '12px 16px', marginBottom: '16px',
        display: 'flex', alignItems: 'center', gap: '12px',
      }}>
        <Filter size={13} color="var(--text-dim)" />
        <span style={{ fontSize: '12px', color: 'var(--text-dim)', fontWeight: 500 }}>Filter:</span>
        {(['all', 'unacknowledged'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            style={{
              padding: '5px 14px', borderRadius: '4px', border: '1px solid',
              fontSize: '12px', cursor: 'pointer',
              borderColor: filter === f ? 'var(--navy)' : 'var(--border-dark)',
              background: filter === f ? 'var(--navy)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-secondary)',
              fontWeight: filter === f ? 600 : 400,
            }}>
            {f === 'all' ? 'All alerts' : 'Unacknowledged only'}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {isLoading ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '32px', textAlign: 'center' }}>
            <span style={{ color: 'var(--text-dim)', fontSize: '13px' }}>Loading alerts...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: '6px', padding: '48px 32px', textAlign: 'center',
          }}>
            <CheckCircle size={32} color="var(--green)" style={{ margin: '0 auto 12px', display: 'block' }} />
            <div style={{ fontSize: '14px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '4px' }}>
              {filter === 'unacknowledged' ? 'No unacknowledged alerts' : 'No alerts recorded'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-dim)' }}>
              {filter === 'unacknowledged' ? 'All alerts have been acknowledged' : 'The system will generate alerts when rate thresholds are breached'}
            </div>
          </div>
        ) : filtered.map((alert: any) => {
          const { color, bg } = alertTypeColor(alert.alert_type)
          return (
            <div key={alert.id} style={{
              background: alert.acknowledged ? 'var(--bg-2)' : 'var(--surface)',
              border: `1px solid ${alert.acknowledged ? 'var(--border)' : color}`,
              borderLeft: `4px solid ${alert.acknowledged ? 'var(--border-dark)' : color}`,
              borderRadius: '6px', padding: '14px 16px',
              display: 'flex', alignItems: 'flex-start', gap: '14px',
              opacity: alert.acknowledged ? 0.7 : 1,
            }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '6px',
                background: alert.acknowledged ? 'var(--bg-3)' : bg,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, color: alert.acknowledged ? 'var(--text-muted)' : color,
              }}>
                {alertTypeIcon(alert.alert_type)}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                  <div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginRight: '8px' }}>
                      {alert.currency_pair}
                    </span>
                    <span style={{
                      fontSize: '10px', fontWeight: 600, padding: '2px 8px',
                      borderRadius: '4px', background: bg, color,
                      fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.04em',
                    }}>
                      {alert.alert_type.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-dim)', fontSize: '11px', flexShrink: 0 }}>
                    <Clock size={11} />
                    {new Date(alert.triggered_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false
                    })}
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '8px', lineHeight: 1.5 }}>
                  {alert.message}
                </p>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                  <div style={{ display: 'flex', gap: '16px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                      Rate at alert: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{alert.rate_at_alert?.toFixed(4)}</span>
                    </span>
                    {alert.threshold && (
                      <span style={{ fontSize: '11px', color: 'var(--text-dim)' }}>
                        Threshold: <span className="mono" style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{alert.threshold?.toFixed(2)}%</span>
                      </span>
                    )}
                  </div>
                  {!alert.acknowledged ? (
                    <button
                      onClick={() => ackMutation.mutate(alert.id)}
                      disabled={ackMutation.isPending}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '5px',
                        background: 'var(--navy)', color: '#fff', border: 'none',
                        borderRadius: '4px', padding: '5px 12px', fontSize: '11px',
                        fontWeight: 500, cursor: 'pointer', flexShrink: 0,
                      }}>
                      <CheckCircle size={11} /> Acknowledge
                    </button>
                  ) : (
                    <span style={{ fontSize: '11px', color: 'var(--green)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <CheckCircle size={11} /> Acknowledged
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Info about future alerts */}
      {allAlerts.length === 0 && !isLoading && (
        <div style={{
          marginTop: '16px', padding: '14px 16px',
          background: 'var(--bg-2)', border: '1px solid var(--border)',
          borderRadius: '6px',
        }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            About the alert system
          </div>
          <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: 1.7 }}>
            The system will automatically generate alerts when: the MWK/USD rate moves more than 2% in a 24-hour period,
            volatility exceeds defined thresholds, or significant anomalies are detected in rate movements.
            As live hourly data accumulates, the alert engine will begin firing based on real market conditions.
          </p>
        </div>
      )}
    </div>
  )
}
