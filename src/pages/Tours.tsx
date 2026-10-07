import { useState } from 'react'
import { useApp } from '../context/AppContext.tsx'

// ===== Dữ liệu mẫu (sau này thay bằng API) =====
const TOURS = [
  { id: 't-0001', name: 'Vịnh Hạ Long 3N2Đ', icon: '🚣', province: 'Quảng Ninh', days: 3, price: 149, capacity: 20, diff: 'easy', active: true },
  { id: 't-0002', name: 'Khám phá Hội An', icon: '🛕', province: 'Quảng Nam', days: 2, price: 89, capacity: 15, diff: 'easy', active: true },
  { id: 't-0003', name: 'Sa Pa Trekking', icon: '⛰️', province: 'Lào Cai', days: 3, price: 75, capacity: 12, diff: 'hard', active: true },
  { id: 't-0004', name: 'Đà Nẵng - Bà Nà', icon: '🌉', province: 'Đà Nẵng', days: 1, price: 55, capacity: 25, diff: 'medium', active: false },
]

const SCHEDULES = [
  { id: 1, tour: 'Vịnh Hạ Long 3N2Đ', date: '20 – 23 tháng 7, 2025', booked: 12, capacity: 20, time: '07:00 sáng', price: 149 },
  { id: 2, tour: 'Vịnh Hạ Long 3N2Đ', date: '10 – 13 tháng 8, 2025', booked: 5, capacity: 20, time: '07:00 sáng', price: 149 },
  { id: 3, tour: 'Sa Pa Trekking', date: '5 – 7 tháng 8, 2025', booked: 10, capacity: 12, time: '06:00 sáng', price: 75 },
]

// Độ khó -> class màu + chữ hiển thị
const DIFF = {
  easy: { cls: 'diff-easy', text: 'Dễ' },
  medium: { cls: 'diff-medium', text: 'Trung bình' },
  hard: { cls: 'diff-hard', text: 'Khó' },
}

export default function Tours() {
  const [tab, setTab] = useState('list')
  const [q, setQ] = useState('') // ô tìm kiếm
  const { openModal, showToast } = useApp()

  // Lọc theo tên tour hoặc tỉnh
  const tours = TOURS.filter((t) => (t.name + ' ' + t.province).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page active">
      {/* Thanh tab */}
      <div className="tab-bar">
        <button className={'tab-btn' + (tab === 'list' ? ' active' : '')} onClick={() => setTab('list')}>
          Danh sách
        </button>
        <button className={'tab-btn' + (tab === 'schedules' ? ' active' : '')} onClick={() => setTab('schedules')}>
          Lịch khởi hành
        </button>
      </div>

      {/* ===== TAB 1: Danh sách tour ===== */}
      {tab === 'list' && (
        <div>
          <div className="section-head">
            <div>
              <div className="section-title">Quản lý Tour</div>
              <div className="section-sub">Tổng {TOURS.length} tour</div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal('modal-create-tour')}>
              ＋ Tạo tour mới
            </button>
          </div>

          <div className="table-wrap">
            <div className="table-toolbar">
              <input
                className="search-input"
                type="text"
                placeholder="Tìm tour, điểm đến..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
              <select className="filter-select">
                <option value="">Độ khó</option>
                <option>Dễ</option>
                <option>Trung bình</option>
                <option>Khó</option>
              </select>
              <select className="filter-select">
                <option value="">Trạng thái</option>
                <option>Hoạt động</option>
                <option>Tạm dừng</option>
              </select>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Tour</th>
                  <th>Điểm đến</th>
                  <th>Thời gian</th>
                  <th>Giá</th>
                  <th>Sức chứa</th>
                  <th>Độ khó</th>
                  <th>Trạng thái</th>
                  <th>Hành động</th>
                </tr>
              </thead>
              <tbody>
                {tours.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div className="td-img">{t.icon}</div>
                        <div>
                          <div className="td-name">{t.name}</div>
                          <div className="td-sub">ID: {t.id}</div>
                        </div>
                      </div>
                    </td>
                    <td>{t.province}</td>
                    <td>{t.days} ngày</td>
                    <td><strong>${t.price}</strong></td>
                    <td>{t.capacity} người</td>
                    <td><span className={'badge ' + DIFF[t.diff].cls}>{DIFF[t.diff].text}</span></td>
                    <td>
                      <span className={'badge ' + (t.active ? 'badge-green' : 'badge-orange')}>
                        {t.active ? 'Hoạt động' : 'Tạm dừng'}
                      </span>
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="btn btn-outline btn-sm" onClick={() => openModal('modal-create-tour', true)}>
                          ✏️ Sửa
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa tour', 'error')}>
                          🗑
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== TAB 2: Lịch khởi hành ===== */}
      {tab === 'schedules' && (
        <div>
          <div className="section-head">
            <div>
              <div className="section-title">Lịch khởi hành</div>
              <div className="section-sub">Quản lý lịch cho từng tour</div>
            </div>
            <button className="btn btn-primary" onClick={() => openModal('modal-create-schedule')}>
              ＋ Thêm lịch
            </button>
          </div>

          <div style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center' }}>
            <select className="filter-select" style={{ minWidth: 200 }}>
              {TOURS.map((t) => <option key={t.id}>{t.name}</option>)}
            </select>
            <select className="filter-select">
              <option>Tháng 7/2025</option>
              <option>Tháng 8/2025</option>
            </select>
          </div>

          <div className="schedule-grid">
            {SCHEDULES.map((s) => {
              const left = s.capacity - s.booked
              return (
                <div className="schedule-card" key={s.id}>
                  <div className="sch-title">{s.tour}</div>
                  <div className="sch-meta">
                    <div className="sch-row"><span className="sch-icon">📅</span>{s.date}</div>
                    <div className="sch-row"><span className="sch-icon">👥</span>{s.booked} / {s.capacity} chỗ đã đặt</div>
                    <div className="sch-row"><span className="sch-icon">🕐</span>Khởi hành: {s.time}</div>
                  </div>
                  <div className="sch-foot">
                    <div>
                      <div className="sch-price">${s.price}</div>
                      {/* còn ≤ 2 chỗ thì báo đỏ */}
                      <div className="sch-slots" style={left <= 2 ? { color: 'var(--red)' } : undefined}>
                        {left <= 2 ? 'Sắp hết chỗ' : `${left} chỗ trống`}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 5 }}>
                      <button className="btn btn-outline btn-sm">✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa lịch', 'error')}>🗑</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}