import { Link } from "react-router-dom";
import { UrlNames } from "../../../shared/enums/UrlNames";

function RegisterFallback() {
    const content = (
        <div className="flex justify-center flex-col gap-5 absolute bottom-5 left-0 w-full">
            <Link to={"/" + UrlNames.REGISTER} className="text-white text-xs font-semibold text-center flex flex-col items-center gap-1">
                Еще нет аккаунта? 
                <span className="text-secondary">Зарегистрируйтесь</span>
            </Link>
        </div>
    );

    return content;
}

export default RegisterFallback;