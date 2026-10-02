import { useState } from "react";
import Sidebar, { PAGE_TITLES } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Modals from "./components/Modals";
import Toasts from "./components/Toasts";
import { useApp } from "./context/AppContext";
import Tours from "./pages/Tours";


const PAGES = {
  dashboard: Dashboard,
  tours: Tours,
}

export default function App() {
  const [page, setPage] = useState<keyof typeof PAGE_TITLES>('dashboard');
  const Page = PAGES[page]
  const { openModal } = useApp();

  return (
    <>
      <Sidebar page={page} setPage={setPage} />
      <main className="main">
        <Topbar page={page} />
        <div className="content">
          {Page ? (
            <Page />
          ) : (
            <div className="page active">
              <div className="section-title">{PAGE_TITLES[page]}</div>
              <div className="section-sub">Nội dung trang sẽ làm ở bước sau</div>
            </div>
          )}
        </div>
      </main>

      <Modals />
      <Toasts />
    </>
  )
}