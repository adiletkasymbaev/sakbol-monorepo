import { Link } from "react-router-dom";
import { UrlNames } from "../../../shared/enums/UrlNames";

function LoginFallback() {
    const content = (
        <div className="flex justify-center flex-col gap-5 absolute bottom-5 left-0 w-full">
            <Link to={"/" + UrlNames.LOGIN} className="text-black text-xs font-semibold text-center flex flex-col items-center gap-1">
                Уже есть аккаунт? 
                <span className="text-primary">Войдите</span>
            </Link>
        </div>
    );

    return content;
}

export default LoginFallback;