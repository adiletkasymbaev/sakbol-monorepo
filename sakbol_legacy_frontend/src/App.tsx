import { Route, Routes } from "react-router-dom"
import Layout from "./shared/components/Layout"
import SosMainPage from "./modules/sos_main/pages/SosMainPage"
import LoginPage from "./modules/auth/pages/LoginPage"
import RequireAuth from "./shared/components/RequireAuth"
import { UrlNames } from "./shared/enums/UrlNames"
import RegisterFirstPage from "./modules/auth/pages/RegisterFirstPage"
import RegisterSecondPage from "./modules/auth/pages/RegisterSecondPage"
import SosContactsPage from "./modules/sos_main/pages/SosContactsPage"
import SosSettingsPage from "./modules/sos_main/pages/SosSettingsPage"
import SosProfilePage from "./modules/sos_main/pages/SosProfilePage"

function App() {

  return (
    <Routes>
      <Route path="/" element={<Layout/>}>
        {/* Public Routes */}
        <Route path={UrlNames.LOGIN} element={<LoginPage/>}/>
        <Route path={UrlNames.SELECT_ROLE} element={<RegisterFirstPage/>}/>
        <Route path={UrlNames.REGISTER} element={<RegisterSecondPage/>}/>
      </Route>

      <Route element={<RequireAuth />}>
        {/* Private Routes */}
        <Route index element={<SosMainPage/>}/>
        <Route path={UrlNames.SOS_CONTACTS} element={<SosContactsPage/>}/>
        <Route path={UrlNames.SOS_SETTINGS} element={<SosSettingsPage/>}/>
        <Route path={UrlNames.SOS_PROFILE} element={<SosProfilePage/>}/>
      </Route>

    </Routes>
  )
}

export default App
