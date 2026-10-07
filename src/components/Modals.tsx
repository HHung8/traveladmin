import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.tsx'

export default function Modals() {
    const { editing, handleCreate, starVal, setStar } = useApp()

    return (
        <>
            <Modal
                id="modal-create-hotel"
                title={editing ? '✏️ Chỉnh sửa Khách sạn' : '🏨 Thêm Khách sạn mới'}
                submitText={editing ? 'Lưu thay đổi' : 'Thêm khách sạn'}
                onSubmit={() => handleCreate('modal-create-hotel', 'Khách sạn')}
            >
                <div className="form-group">
                    <label className="form-label">Tên khách sạn *</label>
                    <input className="form-input" type="text" placeholder="Vd: Vinpearl Resort Đà Nẵng" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Điểm đến *</label>
                        <select className="form-select">
                            <option value="">Chọn điểm đến</option>
                            <option>Đà Nẵng</option>
                            <option>Hội An</option>
                            <option>Nha Trang</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Hạng sao *</label>
                        <div className="star-row">
                            {[1, 2, 3, 4, 5].map((n) => (
                                <span key={n} className={'star-btn' + (starVal >= n ? ' on' : '')} onClick={() => setStar(n)}>
                                    ★
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Địa chỉ *</label>
                    <input className="form-input" type="text" placeholder="Số nhà, đường, phường/xã" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Vĩ độ (latitude)</label>
                        <input className="form-input" type="number" step="0.0001" placeholder="16.0544" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kinh độ (longitude)</label>
                        <input className="form-input" type="number" step="0.0001" placeholder="108.2022" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-textarea" placeholder="Tiện nghi, vị trí, điểm nổi bật..." />
                </div>
                <div className="form-group">
                    <label className="form-label">URL ảnh đại diện</label>
                    <input className="form-input" type="url" placeholder="https://..." />
                </div>
            </Modal>

            <Modal
                id="modal-create-room"
                title="🛏 Thêm phòng"
                submitText="Thêm phòng"
                onSubmit={() => handleCreate('modal-create-room', 'Phòng')}
            >
                <div className="form-group">
                    <label className="form-label">Khách sạn *</label>
                    <select className="form-select">
                        <option>Vinpearl Resort Đà Nẵng</option>
                        <option>The Silk Village Hội An</option>
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Loại phòng *</label>
                        <select className="form-select">
                            <option>Standard</option>
                            <option>Deluxe</option>
                            <option>Suite</option>
                            <option>Villa</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Sức chứa</label>
                        <input className="form-input" type="number" placeholder="2" min="1" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Giá/đêm (USD) *</label>
                    <input className="form-input" type="number" placeholder="220" min="0" />
                </div>
                <div className="form-group">
                    <label className="form-label">Tiện nghi</label>
                    <textarea className="form-textarea" style={{ minHeight: 60 }} placeholder="WiFi, TV, Minibar, View biển, Bồn tắm..." />
                </div>
                <label className="form-toggle">
                    <input className="toggle-input" type="checkbox" defaultChecked />
                    <span className="toggle-label">Phòng còn trống</span>
                </label>
            </Modal>

            <Modal
                id="modal-create-attraction"
                title="🎡 Thêm điểm tham quan"
                submitText="Thêm điểm"
                onSubmit={() => handleCreate('modal-create-attraction', 'Điểm tham quan')}
            >
                <div className="form-group">
                    <label className="form-label">Tên điểm tham quan *</label>
                    <input className="form-input" type="text" placeholder="Vd: Bà Nà Hills" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Điểm đến *</label>
                        <select className="form-select">
                            <option value="">Chọn điểm đến</option>
                            <option>Đà Nẵng</option>
                            <option>Hội An</option>
                            <option>Vịnh Hạ Long</option>
                        </select>
                    </div>
                    <div className="form-group">
                        <label className="form-label">Danh mục</label>
                        <select className="form-select">
                            <option>Vui chơi</option>
                            <option>Hang động</option>
                            <option>Văn hóa</option>
                            <option>Thiên nhiên</option>
                            <option>Ẩm thực</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Vĩ độ</label>
                        <input className="form-input" type="number" step="0.0001" placeholder="16.0285" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kinh độ</label>
                        <input className="form-input" type="number" step="0.0001" placeholder="107.9941" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-textarea" placeholder="Giới thiệu điểm tham quan..." />
                </div>
                <div className="form-group">
                    <label className="form-label">URL ảnh đại diện</label>
                    <input className="form-input" type="url" placeholder="https://..." />
                </div>
            </Modal>

            <Modal
                id="modal-create-attr-schedule"
                title="📅 Tạo lịch tham quan"
                submitText="Tạo lịch"
                onSubmit={() => handleCreate('modal-create-attr-schedule', 'Lịch tham quan')}
            >
                <div className="form-group">
                    <label className="form-label">Điểm tham quan *</label>
                    <select className="form-select">
                        <option>Bà Nà Hills</option>
                        <option>Hang Sửng Sốt</option>
                        <option>Làng Chài Cửa Vạn</option>
                    </select>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Ngày mở cửa *</label>
                        <input className="form-input" type="date" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Lặp lại</label>
                        <select className="form-select">
                            <option value="none">Không lặp</option>
                            <option value="daily">Hàng ngày</option>
                            <option value="weekdays">Thứ 2–6</option>
                            <option value="weekends">Cuối tuần</option>
                        </select>
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Giờ mở cửa</label>
                        <input className="form-input" type="time" defaultValue="08:00" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Giờ đóng cửa</label>
                        <input className="form-input" type="time" defaultValue="17:00" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Số vé tối đa *</label>
                        <input className="form-input" type="number" placeholder="100" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Giá vé (USD) *</label>
                        <input className="form-input" type="number" placeholder="30" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Ghi chú</label>
                    <input className="form-input" type="text" placeholder="Vd: Lịch đặc biệt ngày lễ" />
                </div>
            </Modal>

            <Modal
                id="modal-create-dest"
                title="📍 Thêm điểm đến"
                submitText="Thêm điểm đến"
                onSubmit={() => handleCreate('modal-create-dest', 'Điểm đến')}
            >
                <div className="form-group">
                    <label className="form-label">Tên điểm đến *</label>
                    <input className="form-input" type="text" placeholder="Vd: Phú Quốc" />
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Quốc gia *</label>
                        <input className="form-input" type="text" placeholder="Việt Nam" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Thành phố *</label>
                        <input className="form-input" type="text" placeholder="Kiên Giang" />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label className="form-label">Vĩ độ</label>
                        <input className="form-input" type="number" step="0.0001" />
                    </div>
                    <div className="form-group">
                        <label className="form-label">Kinh độ</label>
                        <input className="form-input" type="number" step="0.0001" />
                    </div>
                </div>
                <div className="form-group">
                    <label className="form-label">Mô tả</label>
                    <textarea className="form-textarea" placeholder="Giới thiệu điểm đến..." />
                </div>
                <div className="form-group">
                    <label className="form-label">URL ảnh đại diện</label>
                    <input className="form-input" type="url" placeholder="https://..." />
                </div>
            </Modal>

            {/* Các modal khác (lịch khởi hành, khách sạn, phòng...) thêm ở bước 6 theo đúng khuôn này */}
        </>
    )
}