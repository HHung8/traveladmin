import { useState } from 'react'

const BOOKINGS = [
  { id: '#TRV-0001', type: 'tour', customer: 'Nguyễn Minh', item: 'Hạ Long 3N2Đ', date: '20/7/2025', guests: 2, total: 344, status: 'confirmed' },
  { id: '#TRV-0002', type: 'tour', customer: 'Trần Lan', item: 'Sa Pa Trekking', date: '12/9/2025', guests: 1, total: 89, status: 'pending' },
  { id: '#TRV-0003', type: 'tour', customer: 'Lê Hùng', item: 'Hội An 2N1Đ', date: '1/8/2025', guests: 3, total: 267, status: 'cancelled' },
]

const STATUS = {
  confirmed: { cls: 'badge-green', text: 'Xác nhận' },
  pending: { cls: 'badge-orange', text: 'Chờ TT' },
  cancelled: { cls: 'badge-red', text: 'Đã hủy' },
}

const TABS = [
  { key: 'tour', label: 'Tour (42)' },
  { key: 'hotel', label: 'Hotel (38)' },
  { key: 'attraction', label: 'Vui chơi (18)' },
]

export default function Bookings() {
  const [tab, setTab] = useState('tour')
  const [q, setQ] = useState('')

  const rows = BOOKINGS.filter(
    (b) => b.type === tab && (b.id + ' ' + b.customer).toLowerCase().includes(q.toLowerCase())
  )

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Tất cả Bookings</div>
          <div className="section-sub">Tour · Hotel · Attraction</div>
        </div>
      </div>

      <div className="tab-bar">
        {TABS.map((t) => (
          <button key={t.key} className={'tab-btn' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Mã booking, tên khách..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="filter-select">
            <option>Tất cả trạng thái</option>
            <option>Đã xác nhận</option>
            <option>Chờ TT</option>
            <option>Đã hủy</option>
          </select>
          <select className="filter-select">
            <option>Tháng 7/2025</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mã</th>
              <th>Khách hàng</th>
              <th>Tour / Khách sạn</th>
              <th>Ngày</th>
              <th>Khách</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text3)', padding: 28 }}>
                  Chưa có dữ liệu
                </td>
              </tr>
            )}
            {rows.map((b) => (
              <tr key={b.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{b.id}</td>
                <td>{b.customer}</td>
                <td><div className="td-name">{b.item}</div></td>
                <td>{b.date}</td>
                <td>{b.guests}</td>
                <td><strong>${b.total}</strong></td>
                <td><span className={'badge ' + STATUS[b.status].cls}>{STATUS[b.status].text}</span></td>
                <td><button className="btn btn-outline btn-sm">Chi tiết</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="pagination">
          <div className="pagination-info">Hiển thị 1–{rows.length} / 42</div>
          <div className="pagination-btns">
            <button className="page-btn active">1</button>
            <button className="page-btn">2</button>
            <button className="page-btn">›</button>
          </div>
        </div>
      </div>
    </div>
  )
}