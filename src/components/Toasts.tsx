import { createPortal } from "react-dom";
import { useApp } from "../context/AppContext";

export default function Toasts() {
  const { toasts } = useApp();

  return createPortal(
    <div className="toast-wrap" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === "success" ? "✅ " : "❌ "}
          {toast.msg}
        </div>
      ))}
    </div>,
    document.body
  );
}