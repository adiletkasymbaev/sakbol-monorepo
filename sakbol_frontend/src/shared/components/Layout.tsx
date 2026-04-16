import { Outlet } from "react-router-dom";
import PushNotificationPrompt from "./PushNotificationPrompt";

function Layout() {
  return (
    <>
      <PushNotificationPrompt />
      <Outlet />
    </>
  )
}

export default Layout;