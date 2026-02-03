import { ToastProvider } from "@heroui/react";
import { Outlet } from "react-router-dom";

function Layout() {
  return (
    <>
      <ToastProvider placement="top-center" toastOffset={60} />
      <Outlet />
    </>
  )
}

export default Layout;