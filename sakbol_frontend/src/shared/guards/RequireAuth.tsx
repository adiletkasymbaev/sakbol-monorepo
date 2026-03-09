import { Navigate } from "react-router-dom";
import useAuth from "../../store/useAuth";
import UrlNames from "../enums/UrlNames";
import Layout from "../components/Layout";
import { useEffect } from "react";
import { enablePushOnSiteEnter } from "../../modules/push/enablePush";

export default function RequireAuth() {
  const isLoggedIn = useAuth((state) => state.isLoggedIn);

  useEffect(() => {
    enablePushOnSiteEnter();
  }, []);

  if (!isLoggedIn) {
    return <Navigate to={`/${UrlNames.LOGIN}`} replace />;
  }

  return <Layout/>;
}