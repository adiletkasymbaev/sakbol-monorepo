import { useLocation, Navigate, Outlet } from "react-router-dom"
import { useSelector } from "react-redux"
import { selectAccessToken } from "../../features/auth/authSlice"
import { UrlNames } from "../enums/UrlNames"
import { ToastProvider } from "@heroui/react"

const RequireAuth = () => {
  const token = useSelector(selectAccessToken)
  const location = useLocation()

  const isHome = location.pathname === "/"

  // Если есть токен — пользователь авторизован
  if (token) {
    return (
      <>
        <ToastProvider
          placement={isHome ? "top-center" : "bottom-center"}
          toastOffset={isHome ? 20 : 60}
        />
        <Outlet />
      </>
    )
  }

  // Иначе редирект на логин
  return <Navigate to={"/" + UrlNames.LOGIN} state={{ from: location }} replace />
}

export default RequireAuth