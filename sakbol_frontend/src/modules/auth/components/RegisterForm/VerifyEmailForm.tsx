import { useState } from "react";
import { addToast, Button, InputOtp } from "@heroui/react";
import { authService } from "../../../../shared/services/authService";
import { ToastTypes } from "../../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../../shared/utils/parseApiErrorToArray";
import useAuth from "../../../../store/useAuth";
import { useNavigate } from "react-router-dom";
import UrlNames from "../../../../shared/enums/UrlNames";
import Margin from "../../../../shared/components/Margin";

interface VerifyEmailFormProps {
    email: string;
}

function VerifyEmailForm({ email }: VerifyEmailFormProps) {
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const setLoginData = useAuth((state) => state.setLoginData);
    const navigate = useNavigate();

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code || code.length < 6) return;
        
        setIsLoading(true);
        try {
            const res = await authService.verifyEmail({ email, code });
            const { access, refresh, user_id, role } = res.data;
            
            setLoginData(access, refresh, user_id, role);
            
            addToast({
                title: ToastTypes.OK,
                description: "Почта подтверждена",
                color: "success"
            });
            
            setTimeout(() => {
                navigate(`/${UrlNames.LOGIN}`);
            }, 1000);
        } catch (error) {
            const messages = parseApiErrorToArray(error);
            messages.forEach((message) =>
                addToast({
                    title: ToastTypes.ERR,
                    description: message,
                    color: "danger",
                })
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={onSubmit} className="flex flex-col gap-3.5">
            <div className="flex flex-col items-center gap-2">
                <span className="text-sm font-medium">6-значный код</span>
                <InputOtp 
                    length={6}
                    size="lg"
                    allowedKeys="^[A-Za-z0-9]*$"
                    value={code.toUpperCase()}
                    onValueChange={(val) => setCode((val ?? "").toUpperCase())}
                    classNames={{
                        input: "uppercase",
                    }}
                />
            </div>
            
            <Margin direction="b" value={1} />
            
            <Button color="primary" type="submit" isLoading={isLoading} isDisabled={code.length < 6}>
                Подтвердить
            </Button>
            
            <p className="text-center text-sm text-gray-500 mt-4">
                Письмо с кодом отправлено на <b>{email}</b>.<br />
                Проверьте папку "Спам", если письмо не пришло в течение минуты.
            </p>
        </form>
    );
}

export default VerifyEmailForm;
