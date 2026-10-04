import { useState } from 'react'
import { useApp } from '../context/AppContext'

const DESTINATIONS = [
  { id: 1, name: 'Vịnh Hạ Long', country: 'Việt Nam', city: 'Quảng Ninh', tours: 3, hotels: 2 },
  { id: 2, name: 'Hội An', country: 'Việt Nam', city: 'Quảng Nam', tours: 2, hotels: 4 },
]

export default function Destinations() {
  const [q, setQ] = useState('')
  const { openModal, showToast } = useApp()

  const items = DESTINATIONS.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Quản lý Điểm đến</div>
          <div className="section-sub">Tổng {DESTINATIONS.length} điểm đến</div>
        </div>
        <button className="btn btn-primary" onClick={() => openModal('modal-create-dest')}>
          ＋ Thêm điểm đến
        </button>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tìm điểm đến..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="filter-select">
            <option>Tất cả quốc gia</option>
            <option>Việt Nam</option>
            <option>Thái Lan</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Tên</th>
              <th>Quốc gia</th>
              <th>Thành phố</th>
              <th>Tours</th>
              <th>Khách sạn</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id}>
                <td><div className="td-name">{d.name}</div></td>
                <td>{d.country}</td>
                <td>{d.city}</td>
                <td>{d.tours}</td>
                <td>{d.hotels}</td>
                <td>
                  <div className="td-actions">
                    <button className="btn btn-outline btn-sm">✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa điểm đến', 'error')}>🗑</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}