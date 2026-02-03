import { Route, Routes } from "react-router-dom"
import UrlNames from "./shared/enums/UrlNames"
import SelectRolePage from "./modules/auth/pages/SelectRolePage"
import RegisterPage from "./modules/auth/pages/RegisterPage"
import RequireGuest from "./shared/guards/RequireGuest"
import RequireAuth from "./shared/guards/RequireAuth"
import ProfilePage from "./modules/profile/pages/ProfilePage"
import LoginPage from "./modules/auth/pages/LoginPage"
import SettingsPage from "./modules/settings/pages/SettingsPage"
import ContactsPage from "./modules/contacts/pages/ContactsPage"
import MapPage from "./modules/map/pages/MapPage"

function App() {
  return (
    <Routes>
      <Route path="/" element={<RequireGuest/>}>
        <Route path={UrlNames.LOGIN} element={<LoginPage/>}/>
        <Route path={UrlNames.SELECT_ROLE} element={<SelectRolePage/>}/>
        <Route path={UrlNames.REGISTER} element={<RegisterPage/>}/>
      </Route>

      <Route element={<RequireAuth />}>
        <Route index element={<MapPage/>}/>
        <Route path={UrlNames.SOS_CONTACTS} element={<ContactsPage/>}/>
        <Route path={UrlNames.SOS_SETTINGS} element={<SettingsPage/>}/>
        <Route path={UrlNames.SOS_PROFILE} element={<ProfilePage/>}/>
      </Route>
    </Routes>
  )
}

export default App
