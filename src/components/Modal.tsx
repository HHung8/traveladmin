import { useApp } from '../context/AppContext.tsx'

export default function Modal({ id, title, submitText, onSubmit, children }) {
  const { openId, closeModal } = useApp()
  return (
    <div
      className={'modal-backdrop' + (openId === id ? ' open' : '')}
      onClick={(e) => e.target === e.currentTarget && closeModal()} // bấm nền tối để đóng
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{title}</div>
          <button className="modal-close" onClick={closeModal}>✕</button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={closeModal}>Huỷ</button>
          <button className="btn btn-primary" onClick={onSubmit}>{submitText}</button>
        </div>
      </div>
    </div>
  )
}