import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react"

type ToastType = 'success' | 'error' | 'warning' | 'info'

type Toast = {
    id: number
    msg: string
    type: ToastType
}

const AppContext = createContext(null)
export const useApp = () => useContext(AppContext)

type AppProviderProps = {
    children: ReactNode
}

export function AppProvider({ children }: AppProviderProps) {
    const [openId, setOpenId] = useState(null);
    const [editing, setEditing] = useState(false) // true = đang sửa, false = đang tạo mới
    const [starVal, setStar] = useState(3)        // số sao chọn trong modal Khách sạn (dùng ở bước 6)
    const [toasts, setToasts] = useState<Toast[]>([])

    const openModal = (id, isEdit = false) => {
        setEditing(isEdit)
        setOpenId(id)
    }

    const closeModal = () => setOpenId(null);
    const showToast = useCallback((msg: string, type: ToastType = 'success') => {
        const id = Date.now() + Math.random();
        setToasts((list) => [...list, { id, msg, type }])
        setTimeout(() => {
            setToasts((list) => list.filter((t) => t.id !== id))
        }, 3000)
    }, [])

    const handleCreate = (modalId, label) => {
        closeModal()
        showToast(`Tạo mới ${label} thành công!`, 'success')
    }

    useEffect(() => {
        const onKey = (e) => e.key === 'Escape' && closeModal()
        document.addEventListener('keydown', onKey)
        return () => document.removeEventListener('keydown', onKey)
    }, [])

    return (
        <AppContext.Provider value={{ openId, editing, starVal, toasts, openModal, closeModal, showToast, handleCreate }}>
            {children}
        </AppContext.Provider>

    )


}