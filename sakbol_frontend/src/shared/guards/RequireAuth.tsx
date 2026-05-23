import { Navigate } from "react-router-dom";
import useAuth from "../../store/useAuth";
import UrlNames from "../enums/UrlNames";
import Layout from "../components/Layout";
import { useEffect, useState } from "react";
import { profileService } from "../../shared/services/profileService";

export default function RequireAuth() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);
  const { userRole, setUserRole } = useAuth();
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    // Загружаем профиль для получения актуальной роли
    if (isLoggedIn && !profileLoaded) {
      profileService.getMe()
        .then((response) => {
          const role = response.data.role;
          setUserRole(role);
          setProfileLoaded(true);

        })
        .catch((error) => {
          console.error("Failed to load profile:", error);
          setProfileLoaded(true);
        });
    }
  }, [isLoggedIn, profileLoaded, setUserRole]);

  // Ждем загрузки профиля перед рендерингом
  if (isLoggedIn && !profileLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p>Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={`/${UrlNames.LOGIN}`} replace />;
  }

  return <Layout/>;
}