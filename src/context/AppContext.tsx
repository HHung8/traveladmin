import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

type ToastType = 'success' | 'error'
type Toast = { id: number; msg: string; type: ToastType }

type AppContextValue = {
  openId: string | null
  editing: boolean
  modalData: any // dòng đang sửa, truyền vào modal
  openModal: (id: string, isEdit?: boolean, data?: any) => void
  closeModal: () => void
  starVal: number
  setStar: (n: number) => void
  toasts: Toast[]
  showToast: (msg: string, type?: ToastType) => void
  handleCreate: (modalId: string, label: string) => void
  refresh: Record<string, number> // { destinations: 2, tours: 1, ... }
  bump: (key: string) => void // báo trang tương ứng tải lại danh sách
}

const AppContext = createContext<AppContextValue | null>(null)

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp phải được dùng bên trong <AppProvider>')
  return ctx
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [modalData, setModalData] = useState<any>(null)
  const [starVal, setStar] = useState(3)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [refresh, setRefresh] = useState<Record<string, number>>({})

  const openModal = (id: string, isEdit = false, data: any = null) => {
    setEditing(isEdit)
    setModalData(data)
    setOpenId(id)
  }
  const closeModal = () => setOpenId(null)

  const bump = (key: string) => setRefresh((r) => ({ ...r, [key]: (r[key] || 0) + 1 }))

  const showToast = useCallback((msg: string, type: ToastType = 'success') => {
    const id = Date.now() + Math.random()
    setToasts((list) => [...list, { id, msg, type }])
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 3000)
  }, [])

  // Dành cho các modal chưa nối API (vẫn chỉ hiện toast)
  const handleCreate = (_modalId: string, label: string) => {
    closeModal()
    showToast(`${label} đã được tạo thành công!`, 'success')
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeModal()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <AppContext.Provider
      value={{
        openId, editing, modalData, openModal, closeModal,
        starVal, setStar, toasts, showToast, handleCreate, refresh, bump,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}