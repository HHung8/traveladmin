import { useState } from 'react'
import { useApp } from '../context/AppContext'

const NOTIFS = [
  { id: 1, type: 'booking', badge: 'badge-green', title: 'Đặt tour thành công', text: 'Nguyễn Minh đã đặt tour Hạ Long 3N2Đ', time: '5 phút trước', read: false },
  { id: 2, type: 'payment', badge: 'badge-orange', title: 'Thanh toán đang chờ', text: 'Trần Lan chưa thanh toán booking #002', time: '1 giờ trước', read: true },
]

export default function Notifications() {
  const [items, setItems] = useState(NOTIFS)
  const { showToast } = useApp()

  const markAllRead = () => {
    // TODO(API): await notificationsApi.readAll()
    setItems((list) => list.map((n) => ({ ...n, read: true })))
    showToast('Đã đánh dấu tất cả đã đọc')
  }

  return (
    <div className="page active">
      <div className="section-head">
        <div>
          <div className="section-title">Thông báo hệ thống</div>
        </div>
        <button className="btn btn-outline" onClick={markAllRead}>✓ Đánh dấu tất cả đã đọc</button>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Loại</th>
              <th>Tiêu đề</th>
              <th>Nội dung</th>
              <th>Thời gian</th>
              <th>Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {items.map((n) => (
              <tr key={n.id} style={n.read ? undefined : { background: '#FAFBFE' }}>
                <td><span className={'badge ' + n.badge}>{n.type}</span></td>
                <td>{n.read ? n.title : <strong>{n.title}</strong>}</td>
                <td style={{ fontSize: 12.5, color: 'var(--text2)' }}>{n.text}</td>
                <td style={{ fontSize: 12, color: 'var(--text3)' }}>{n.time}</td>
                <td>
                  <span className={'badge ' + (n.read ? 'badge-gray' : 'badge-blue')}>{n.read ? 'Đã đọc' : 'Mới'}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}