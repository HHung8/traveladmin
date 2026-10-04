import { useState } from "react";
import Sidebar, { PAGE_TITLES } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Modals from "./components/Modals";
import Toasts from "./components/Toasts";
import { useApp } from "./context/AppContext";
import Tours from "./pages/Tours";
import Hotels from "./pages/Hotels";
import Destinations from "./pages/Destinations";
import Attractions from "./pages/Attractions";
import Notifications from "./pages/Notifications";
import Users from "./pages/User";
import Reviews from "./pages/Reviews";
import Payments from "./pages/Payments";
import Bookings from "./pages/Booking";


const PAGES = {
  dashboard: Dashboard,
  tours: Tours,
  hotels: Hotels,
  attractions: Attractions,
  destinations: Destinations,
  bookings: Bookings,
  payments: Payments,
  reviews: Reviews,
  users: Users,
  notifications: Notifications,
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
          <Page />
        </div>
      </main>
      <Modals />
      <Toasts />
    </>
  )
}