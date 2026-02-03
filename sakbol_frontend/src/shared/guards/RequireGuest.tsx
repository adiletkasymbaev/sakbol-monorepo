import { Navigate } from "react-router-dom";
import useAuth from "../../store/useAuth";
import UrlNames from "../enums/UrlNames";
import Layout from "../components/Layout";

export default function RequireGuest() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  if (isLoggedIn) {
    return <Navigate to={`/${UrlNames.SOS_PROFILE}`} replace />;
  }

  return <Layout/>;
}