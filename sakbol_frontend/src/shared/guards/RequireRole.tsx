import { Navigate } from "react-router-dom";
import useAuth from "../../store/useAuth";
import UrlNames from "../enums/UrlNames";

interface RequireRoleProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export default function RequireRole({ allowedRoles, children }: RequireRoleProps) {
  const userRole = useAuth((state) => state.userRole);

  if (!allowedRoles.includes(userRole)) {
    return <Navigate to={`/${UrlNames.LOGIN}`} replace />;
  }

  return <>{children}</>;
}
