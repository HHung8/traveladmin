// ===== Dữ liệu mẫu (sau này thay bằng dữ liệu từ API) =====
const STATS = [
  { label: 'Doanh thu tháng', value: '$48,250', change: '▲ 12.5% so với tháng trước', up: true, icon: '💰', bg: '#EEF2FF' },
  { label: 'Booking mới', value: '124', change: '▲ 8.3% so với tháng trước', up: true, icon: '📋', bg: '#E6F4EA' },
  { label: 'Người dùng', value: '2,841', change: '▲ 5.1% so với tháng trước', up: true, icon: '👥', bg: '#FEF3C7' },
  { label: 'Tỷ lệ hủy', value: '3.2%', change: '▼ 0.8% so với tháng trước', up: false, icon: '❌', bg: '#FEE2E2' },
]

const REVENUE_7D = [
  { day: 'T2', amount: 1200 },
  { day: 'T3', amount: 1580 },
  { day: 'T4', amount: 990 },
  { day: 'T5', amount: 2100 },
  { day: 'T6', amount: 1450 },
  { day: 'T7', amount: 1840 },
  { day: 'CN', amount: 3320 },
]

const RECENT_BOOKINGS = [
  { id: 1, name: 'Hạ Long 3N2Đ', sub: 'Nguyễn Minh · 2 khách', amount: 344, status: 'confirmed', icon: '🚣', bg: '#EEF2FF' },
  { id: 2, name: 'Vinpearl Đà Nẵng', sub: 'Trần Lan · 3 đêm', amount: 660, status: 'pending', icon: '🏨', bg: '#E6F4EA' },
  { id: 3, name: 'Bà Nà Hills', sub: 'Lê Hùng · 4 vé', amount: 120, status: 'confirmed', icon: '🎡', bg: '#FEF3C7' },
  { id: 4, name: 'Hội An 2N1Đ', sub: 'Phạm Thảo · 1 khách', amount: 95, status: 'cancelled', icon: '🛕', bg: '#FEE2E2' },
]

// Trạng thái -> class màu của badge trong CSS
const STATUS_BADGE = {
  confirmed: 'badge-green',
  pending: 'badge-orange',
  cancelled: 'badge-red',
}

const fmt = (n) => '$' + n.toLocaleString('en-US')

export default function Dashboard() {
  const total = REVENUE_7D.reduce((sum, d) => sum + d.amount, 0)
  const max = Math.max(...REVENUE_7D.map((d) => d.amount))

  return (
    <div className="page active">
      {/* 4 thẻ thống kê */}
      <div className="stats-grid">
        {STATS.map((s) => (
          <div className="stat-card" key={s.label}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div className="stat-label">{s.label}</div>
              <div className="stat-icon" style={{ background: s.bg }}>{s.icon}</div>
            </div>
            <div className="stat-value">{s.value}</div>
            <div className={'stat-change ' + (s.up ? 'up' : 'down')}>{s.change}</div>
          </div>
        ))}
      </div>

      <div className="dashboard-grid">
        {/* Biểu đồ doanh thu 7 ngày */}
        <div className="chart-card">
          <div className="section-head" style={{ marginBottom: 0 }}>
            <div>
              <div className="section-title">Doanh thu 7 ngày</div>
              <div className="section-sub">Tổng: {fmt(total)}</div>
            </div>
            <select className="filter-select">
              <option>7 ngày qua</option>
              <option>30 ngày</option>
              <option>3 tháng</option>
            </select>
          </div>

          <div className="mini-chart">
            {REVENUE_7D.map((d) => (
              <div
                key={d.day}
                className="mini-bar"
                style={{ height: (d.amount / max) * 100 + '%' }}
                title={fmt(d.amount)}
              />
            ))}
          </div>
          <div className="chart-labels">
            {REVENUE_7D.map((d) => (
              <div className="chart-label" key={d.day}>{d.day}</div>
            ))}
          </div>
        </div>

        {/* Booking gần đây */}
        <div className="chart-card">
          <div className="section-title" style={{ marginBottom: 0 }}>Booking gần đây</div>
          <div className="recent-list">
            {RECENT_BOOKINGS.map((b) => (
              <div className="recent-item" key={b.id}>
                <div className="recent-icon" style={{ background: b.bg }}>{b.icon}</div>
                <div className="recent-info">
                  <div className="recent-name">{b.name}</div>
                  <div className="recent-sub">{b.sub}</div>
                </div>
                <div>
                  <div className="recent-amount">{fmt(b.amount)}</div>
                  <span className={'badge ' + STATUS_BADGE[b.status]} style={{ fontSize: 10 }}>
                    {b.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}