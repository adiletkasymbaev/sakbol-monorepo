import { Link } from "react-router-dom";
import UrlNames from "../../../shared/enums/UrlNames";
import { useTranslation } from "react-i18next";

function RegisterFallback() {
    const { t } = useTranslation();

    const content = (
        <div className="flex justify-center flex-col gap-5 absolute bottom-5 left-0 w-full">
            <Link to={"/" + UrlNames.SELECT_ROLE} className="text-white text-xs font-semibold text-center flex flex-col items-center gap-1">
                {t('auth.fallback.noAccount')} 
                <span className="text-secondary">{t('auth.fallback.register')}</span>
            </Link>
        </div>
    );

    return content;
}

export default RegisterFallback;