import Modal from './Modal.jsx'
import { useApp } from '../context/AppContext.jsx'

export default function Modals() {
  const { editing, handleCreate } = useApp()

  return (
    <>
      <Modal
        id="modal-create-tour"
        title={editing ? '✏️ Chỉnh sửa Tour' : '🗺️ Tạo Tour mới'}
        submitText={editing ? 'Lưu thay đổi' : 'Tạo Tour'}
        onSubmit={() => handleCreate('modal-create-tour', 'Tour')}
      >
        <div className="form-group">
          <label className="form-label">Tiêu đề tour *</label>
          <input className="form-input" type="text" placeholder="Vd: Vịnh Hạ Long 3N2Đ" />
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Điểm đến *</label>
            <select className="form-select">
              <option value="">Chọn điểm đến</option>
              <option>Vịnh Hạ Long</option>
              <option>Hội An</option>
              <option>Sa Pa</option>
              <option>Đà Nẵng</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Độ khó</label>
            <select className="form-select">
              <option value="easy">Dễ</option>
              <option value="medium">Trung bình</option>
              <option value="hard">Khó</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Giá (USD) *</label>
            <input className="form-input" type="number" placeholder="149" min="0" />
          </div>
          <div className="form-group">
            <label className="form-label">Số ngày *</label>
            <input className="form-input" type="number" placeholder="3" min="1" />
          </div>
        </div>
        <div className="form-group">
          <label className="form-label">Sức chứa tối đa</label>
          <input className="form-input" type="number" placeholder="20" min="1" />
        </div>
        <div className="form-group">
          <label className="form-label">Mô tả</label>
          <textarea className="form-textarea" placeholder="Mô tả tour, điểm nổi bật, bao gồm gì..." />
        </div>
        <label className="form-toggle">
          <input className="toggle-input" type="checkbox" defaultChecked />
          <span className="toggle-label">Kích hoạt ngay</span>
        </label>
      </Modal>

      {/* Các modal khác (lịch khởi hành, khách sạn, phòng...) thêm ở bước 6 theo đúng khuôn này */}
    </>
  )
}