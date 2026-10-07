import { useEffect, useState } from 'react'
import { useApp } from '../context/AppContext'
import { destinationsApi } from '../api'
import { destinationFromApi, destinationToApi } from '../api/mappers'
import Modal from './Modal'


const ID = 'modal-create-dest'
const EMPTY = {
    name: '', country: '', city: '', description: '',
    latitude: '', longitude: '', climate: '', bestTimeToVisit: '', isFeatured: false,
}

export default function DestinationModal() {
    const { openId, editing, modalData, closeModal, showToast, bump } = useApp()
    const [form, setForm] = useState(EMPTY)
    const [saving, setSaving] = useState(false)

    const set = (key) => (e) =>
        setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))

    // Mỗi lần modal mở: nạp lại form
    useEffect(() => {
        if (openId !== ID) return
        if (!editing || !modalData) return setForm(EMPTY)

        setForm({ ...EMPTY, ...modalData }) // hiện ngay dữ liệu của dòng
        let cancelled = false
        destinationsApi
            .get(modalData.id) // rồi bổ sung climate, bestTimeToVisit từ API chi tiết
            .then((d) => !cancelled && setForm({ ...EMPTY, ...destinationFromApi(d) }))
            .catch((e) => !cancelled && showToast(e.message, 'error'))
        return () => { cancelled = true }
    }, [openId])

    const submit = async () => {
        console.log('[Modal] bấm Thêm', { editing, form })

        if (!form.name.trim() || !form.country.trim() || !form.city.trim()) {
            console.warn('[Modal] thiếu trường bắt buộc')
            return showToast('Vui lòng nhập tên, quốc gia và thành phố', 'error')
        }
        setSaving(true)
        try {
            const body = destinationToApi(form)
            console.log('[Modal] gửi body:', body)
            const res = editing
                ? await destinationsApi.update(modalData.id, body)
                : await destinationsApi.create(body)
            console.log('[Modal] server trả:', res)
            closeModal()
            showToast(editing ? 'Đã lưu thay đổi' : 'Đã thêm điểm đến')
            bump('destinations')
        } catch (e: any) {
            console.error('[Modal] lỗi:', e)
            showToast(e.message, 'error')
        } finally {
            setSaving(false)
        }
    }

    return (
        <Modal
            id={ID}
            title={editing ? '✏️ Chỉnh sửa điểm đến' : '📍 Thêm điểm đến'}
            submitText={editing ? 'Lưu thay đổi' : 'Thêm điểm đến'}
            onSubmit={submit}
            submitting={saving}
        >
            <div className="form-group">
                <label className="form-label">Tên điểm đến *</label>
                <input className="form-input" type="text" placeholder="Vd: Phú Quốc" value={form.name} onChange={set('name')} />
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Quốc gia *</label>
                    <input className="form-input" type="text" placeholder="Việt Nam" value={form.country} onChange={set('country')} />
                </div>
                <div className="form-group">
                    <label className="form-label">Thành phố *</label>
                    <input className="form-input" type="text" placeholder="Kiên Giang" value={form.city} onChange={set('city')} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Vĩ độ</label>
                    <input className="form-input" type="number" step="0.0001" value={form.latitude} onChange={set('latitude')} />
                </div>
                <div className="form-group">
                    <label className="form-label">Kinh độ</label>
                    <input className="form-input" type="number" step="0.0001" value={form.longitude} onChange={set('longitude')} />
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label className="form-label">Khí hậu</label>
                    <input className="form-input" type="text" placeholder="Vd: Nhiệt đới" value={form.climate} onChange={set('climate')} />
                </div>
                <div className="form-group">
                    <label className="form-label">Thời điểm đẹp nhất</label>
                    <input className="form-input" type="text" placeholder="Vd: Tháng 11 – Tháng 4" value={form.bestTimeToVisit} onChange={set('bestTimeToVisit')} />
                </div>
            </div>
            <div className="form-group">
                <label className="form-label">Mô tả</label>
                <textarea className="form-textarea" placeholder="Giới thiệu điểm đến..." value={form.description} onChange={set('description')} />
            </div>
            <label className="form-toggle">
                <input className="toggle-input" type="checkbox" checked={form.isFeatured} onChange={set('isFeatured')} />
                <span className="toggle-label">Điểm đến nổi bật</span>
            </label>
        </Modal>
    )
}