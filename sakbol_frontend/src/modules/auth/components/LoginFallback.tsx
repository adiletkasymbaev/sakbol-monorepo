import { Link } from "react-router-dom";
import UrlNames from "../../../shared/enums/UrlNames";
import { useTranslation } from "react-i18next";

function LoginFallback() {
    const { t } = useTranslation();

    const content = (
        <div className="flex justify-center items-center flex-col gap-5 pt-2">
            <Link to={"/" + UrlNames.LOGIN} className="w-fit bg-white px-2 py-1 rounded-md text-black text-xs font-semibold text-center flex flex-col items-center gap-1">
                {t('auth.fallback.hasAccount')} 
                <span className="text-primary">{t('auth.fallback.login')}</span>
            </Link>
        </div>
    );

    return content;
}

export default LoginFallback;