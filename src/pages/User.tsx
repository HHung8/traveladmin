import { useState } from 'react'
import { useApp } from '../context/AppContext'

const USERS = [
  { id: 1, name: 'Nguyễn Minh', initials: 'MN', color: '#534AB7', email: 'minh@email.com', role: 'user', bookings: 3, joined: '01/01/2025' },
  { id: 2, name: 'Trần Lan', initials: 'TL', color: '#2D7A3A', email: 'lan@email.com', role: 'partner', bookings: 1, joined: '15/02/2025' },
]

const ROLE_BADGE = { user: 'badge-gray', partner: 'badge-purple', admin: 'badge-blue' }

export default function Users() {
  const [q, setQ] = useState('')
  const { showToast } = useApp()

  const rows = USERS.filter((u) => (u.name + ' ' + u.email).toLowerCase().includes(q.toLowerCase()))

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Người dùng</div>
          <div className="section-sub">Quản lý tài khoản</div>
        </div>
      </div>

      <div className="table-wrap">
        <div className="table-toolbar">
          <input
            className="search-input"
            type="text"
            placeholder="Tên, email..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select className="filter-select">
            <option>Tất cả vai trò</option>
            <option>admin</option>
            <option>partner</option>
            <option>user</option>
          </select>
        </div>

        <table>
          <thead>
            <tr>
              <th>Người dùng</th>
              <th>Email</th>
              <th>Vai trò</th>
              <th>Booking</th>
              <th>Ngày đăng ký</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((u) => (
              <tr key={u.id}>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div className="user-avatar" style={{ width: 32, height: 32, fontSize: 11, background: u.color }}>
                      {u.initials}
                    </div>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td style={{ color: 'var(--text2)' }}>{u.email}</td>
                <td><span className={'badge ' + ROLE_BADGE[u.role]}>{u.role}</span></td>
                <td>{u.bookings}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{u.joined}</td>
                <td>
                  <button className="btn btn-danger btn-sm" onClick={() => showToast(`Đã khoá ${u.name}`, 'error')}>
                    Khoá
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