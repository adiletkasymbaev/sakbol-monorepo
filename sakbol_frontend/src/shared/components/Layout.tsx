import { Outlet } from "react-router-dom";
import { useEffect } from "react";
import { enablePushOnSiteEnter } from "../../modules/push/enablePush";

function Layout() {
  useEffect(() => {
    enablePushOnSiteEnter();
  }, []);
  
  return (
    <>
      <Outlet />
    </>
  )
}

export default Layout;