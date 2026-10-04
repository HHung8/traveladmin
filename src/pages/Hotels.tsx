import { useState } from "react"
import { useApp } from "../context/AppContext";

const HOTELS = [
    { id: 'h-0001', name: 'Vinpearl Resort Đà Nẵng', city: 'Đà Nẵng', address: 'Bãi Mỹ Khê', stars: 5, rooms: 24 },
    { id: 'h-0002', name: 'The Silk Village Hội An', city: 'Hội An', address: '28 Lý Thường Kiệt', stars: 4, rooms: 18 },
]

const ROOMS = [
    { id: 1, name: 'Deluxe Ocean View', price: 220, capacity: 2, amenities: 'WiFi, TV, Minibar, View biển', available: true },
    { id: 2, name: 'Superior Suite', price: 350, capacity: 3, amenities: 'WiFi, TV, Bồn tắm, Ban công', available: false },
]

export default function Hotels() {
    const [tab, setTab] = useState('hotels');
    const [q, setQ] = useState('');
    const { openModal, showToast } = useApp();

    const hotels = HOTELS.filter((h) => h.name.toLowerCase().includes(q.toLowerCase()))
    return (
        <div className="page active">
            <div className="tab-bar">
                <button className={'tab-btn' + (tab === 'hotels' ? ' active' : '')} onClick={() => setTab('hotels')}>
                    Khách sạn
                </button>
                <button className={'tab-btn' + (tab === 'rooms' ? ' active' : '')} onClick={() => setTab('rooms')}>
                    Phòng
                </button>
            </div>

            {/* ===== TAB 1: Khách sạn ===== */}
            {tab === 'hotels' && (
                <div>
                    <div className="section-head">
                        <div>
                            <div className="section-title">Quản lý Khách sạn</div>
                            <div className="section-sub">Tổng {HOTELS.length} khách sạn</div>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal('modal-create-hotel')}>
                            ＋ Thêm khách sạn
                        </button>
                    </div>

                    <div className="table-wrap">
                        <div className="table-toolbar">
                            <input
                                className="search-input"
                                type="text"
                                placeholder="Tìm tên khách sạn..."
                                value={q}
                                onChange={(e) => setQ(e.target.value)}
                            />
                            <select className="filter-select">
                                <option>Tất cả điểm đến</option>
                                <option>Đà Nẵng</option>
                                <option>Hội An</option>
                                <option>Nha Trang</option>
                            </select>
                            <select className="filter-select">
                                <option>Tất cả sao</option>
                                <option>★★★★★ 5 sao</option>
                                <option>★★★★ 4 sao</option>
                                <option>★★★ 3 sao</option>
                            </select>
                        </div>

                        <table>
                            <thead>
                                <tr>
                                    <th>Khách sạn</th>
                                    <th>Điểm đến</th>
                                    <th>Địa chỉ</th>
                                    <th>Hạng sao</th>
                                    <th>Phòng</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {hotels.map((h) => (
                                    <tr key={h.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                <div className="td-img">🏨</div>
                                                <div>
                                                    <div className="td-name">{h.name}</div>
                                                    <div className="td-sub">{h.id}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{h.city}</td>
                                        <td style={{ color: 'var(--text2)', fontSize: 12.5 }}>{h.address}</td>
                                        <td><span style={{ color: '#F59E0B', fontSize: 13 }}>{'★'.repeat(h.stars)}</span></td>
                                        <td>{h.rooms} phòng</td>
                                        <td>
                                            <div className="td-actions">
                                                <button className="btn btn-outline btn-sm" onClick={() => openModal('modal-create-hotel', true)}>
                                                    ✏️
                                                </button>
                                                <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa khách sạn', 'error')}>
                                                    🗑
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pagination">
                            <div className="pagination-info">Hiển thị 1–{hotels.length} / 12 kết quả</div>
                            <div className="pagination-btns">
                                <button className="page-btn active">1</button>
                                <button className="page-btn">2</button>
                                <button className="page-btn">›</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ===== TAB 2: Phòng ===== */}
            {tab === 'rooms' && (
                <div>
                    <div className="section-head">
                        <div>
                            <div className="section-title">Quản lý Phòng</div>
                            <div className="section-sub">Phòng theo từng khách sạn</div>
                        </div>
                        <button className="btn btn-primary" onClick={() => openModal('modal-create-room')}>
                            ＋ Thêm phòng
                        </button>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                        <select className="filter-select" style={{ minWidth: 220 }}>
                            {HOTELS.map((h) => <option key={h.id}>{h.name}</option>)}
                        </select>
                    </div>

                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Loại phòng</th>
                                    <th>Giá/đêm</th>
                                    <th>Sức chứa</th>
                                    <th>Tiện nghi</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ROOMS.map((r) => (
                                    <tr key={r.id}>
                                        <td><strong>{r.name}</strong></td>
                                        <td><strong>${r.price}</strong></td>
                                        <td>{r.capacity} người</td>
                                        <td style={{ fontSize: 12, color: 'var(--text2)' }}>{r.amenities}</td>
                                        <td>
                                            <span className={'badge ' + (r.available ? 'badge-green' : 'badge-orange')}>
                                                {r.available ? 'Còn phòng' : 'Đang có khách'}
                                            </span>
                                        </td>
                                        <td>
                                            <div className="td-actions">
                                                <button className="btn btn-outline btn-sm">✏️</button>
                                                <button className="btn btn-danger btn-sm" onClick={() => showToast('Đã xóa phòng', 'error')}>
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
        </div>
    )
}


