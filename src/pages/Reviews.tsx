import { useState } from 'react'
import { useApp } from '../context/AppContext.js'

const REVIEWS = [
  { id: 1, user: 'Nguyễn Minh', target: 'Hạ Long 3N2Đ', type: 'Tour', rating: 5, text: 'Tour rất tuyệt, hướng dẫn viên nhiệt tình...', date: '18/06' },
  { id: 2, user: 'Lê Hùng', target: 'Vinpearl Đà Nẵng', type: 'Hotel', rating: 4, text: 'Phòng rộng, sạch sẽ, view biển đẹp...', date: '15/06' },
]

const TYPE_BADGE = { Tour: 'badge-purple', Hotel: 'badge-blue' }

export default function Reviews() {
  const [items, setItems] = useState(REVIEWS) // danh sách là state để xóa được
  const [q, setQ] = useState('')
  const { showToast } = useApp()

  const rows = items.filter((r) => (r.user + ' ' + r.target + ' ' + r.text).toLowerCase().includes(q.toLowerCase()))

  const remove = (id) => {
    // TODO(API): await reviewsApi.remove(id) rồi mới cập nhật danh sách
    setItems((list) => list.filter((r) => r.id !== id))
    showToast('Đã xóa đánh giá', 'error')
  }

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Đánh giá người dùng</div>
          <div className="section-sub">Tổng {items.length} đánh giá</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm đánh giá..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="filter-select">
            <option>Tất cả</option>
            <option>Tour</option>
            <option>Hotel</option>
            <option>Destination</option>
          </select>
          <select className="filter-select">
            <option>Tất cả sao</option>
            <option>5 ⭐</option>
            <option>4 ⭐</option>
            <option>≤3 ⭐</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Đối tượng</th>
              <th>Loại</th>
              <th>Rating</th>
              <th>Nhận xét</th>
              <th>Ngày</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.user}</strong></td>
                <td>{r.target}</td>
                <td><span className={'badge ' + TYPE_BADGE[r.type]}>{r.type}</span></td>
                <td>{'⭐'.repeat(r.rating)} <strong>{r.rating.toFixed(1)}</strong></td>
                <td style={{ maxWidth: 200, fontSize: 12.5, color: 'var(--text2)' }}>{r.text}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{r.date}</td>
                <td><button className="btn btn-danger btn-sm" onClick={() => remove(r.id)}>🗑</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}