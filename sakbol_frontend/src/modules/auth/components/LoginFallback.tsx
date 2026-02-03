import { Link } from "react-router-dom";
import UrlNames from "../../../shared/enums/UrlNames";

function LoginFallback() {
    const content = (
        <div className="flex justify-center items-center flex-col gap-5 pt-2">
            <Link to={"/" + UrlNames.LOGIN} className="w-fit bg-white px-2 py-1 rounded-md text-black text-xs font-semibold text-center flex flex-col items-center gap-1">
                Уже есть аккаунт? 
                <span className="text-primary">Войдите</span>
            </Link>
        </div>
    );

    return content;
}

export default LoginFallback;