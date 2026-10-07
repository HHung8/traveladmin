import { useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Sidebar, { PAGE_TITLES } from "./components/Sidebar";
import Topbar from "./components/Topbar";
import Dashboard from "./pages/Dashboard";
import Modals from "./components/Modals";
import Toasts from "./components/Toasts";
import Tours from "./pages/Tours";
import Hotels from "./pages/Hotels";
import Attractions from "./pages/Attractions";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";
import Register from "./pages/Register";
import PublicRoute from "./components/PublicRoute";
import Destinations from "./pages/Destinations";


const PAGES = {
  dashboard: Dashboard,
  tours: Tours,
  hotels: Hotels,
  attractions: Attractions,
  destinations: Destinations,
};

function AdminLayout() {
  const [page, setPage] = useState<keyof typeof PAGE_TITLES>("dashboard");
  const Page = PAGES[page];

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
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<PublicRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<AdminLayout />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}