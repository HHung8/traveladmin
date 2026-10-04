import { useState } from 'react'
import { useApp } from '../context/AppContext.jsx'

const PAYMENTS = [
  { id: 'PAY-2025-001', customer: 'Nguyễn Minh', type: 'Tour', amount: 344, method: '💳 Thẻ', status: 'success', time: '20/06 14:32' },
  { id: 'PAY-2025-002', customer: 'Trần Lan', type: 'Hotel', amount: 660, method: '🍎 Apple Pay', status: 'processing', time: '19/06 09:15' },
]

const TYPE_BADGE = { Tour: 'badge-purple', Hotel: 'badge-blue' }
const STATUS = {
  success: { cls: 'badge-green', text: 'Thành công' },
  processing: { cls: 'badge-orange', text: 'Đang xử lý' },
}

export default function Payments() {
  const [q, setQ] = useState('')
  const { showToast } = useApp()

  const rows = PAYMENTS.filter((p) => p.id.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Thanh toán</div>
          <div className="section-sub">Giao dịch và hoàn tiền</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Mã giao dịch..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="filter-select">
            <option>Tất cả</option>
            <option>Thành công</option>
            <option>Thất bại</option>
            <option>Hoàn tiền</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Mã GD</th>
              <th>Khách hàng</th>
              <th>Loại</th>
              <th>Số tiền</th>
              <th>Phương thức</th>
              <th>Trạng thái</th>
              <th>Thời gian</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: 'monospace', fontSize: 12 }}>{p.id}</td>
                <td>{p.customer}</td>
                <td><span className={'badge ' + TYPE_BADGE[p.type]}>{p.type}</span></td>
                <td><strong>${p.amount}</strong></td>
                <td>{p.method}</td>
                <td><span className={'badge ' + STATUS[p.status].cls}>{STATUS[p.status].text}</span></td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{p.time}</td>
                <td>
                  <button className="btn btn-outline btn-sm" onClick={() => showToast(`Đã hoàn tiền $${p.amount}`)}>
                    ↩ Refund
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}