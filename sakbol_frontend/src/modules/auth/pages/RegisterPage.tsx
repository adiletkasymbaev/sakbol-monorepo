import Headline from "../../../shared/components/Headline";
import Margin from "../../../shared/components/Margin";
import RegisterForm from "../components/RegisterForm/RegisterForm";
import VerifyEmailForm from "../components/RegisterForm/VerifyEmailForm";
import { useTranslation } from "react-i18next";
import LanguageSelect from "../../../shared/components/LanguageSelect";
import { useState } from "react";

function RegisterPage() {
    const { t } = useTranslation();
    const [registeredEmail, setRegisteredEmail] = useState<string | null>(null);

    return (
        <div className="page-wrapper pt-2">
            <Headline
                secondaryText={registeredEmail ? "Подтверждение почты" : t('auth.register.title')}
                mainText={registeredEmail ? "Введите код из письма" : t('auth.register.button')}
            />
            <Margin direction="b" value={6} />
            {registeredEmail ? (
                <VerifyEmailForm email={registeredEmail} />
            ) : (
                <RegisterForm onSuccess={setRegisteredEmail} />
            )}
            <LanguageSelect />
        </div>
    );
}

export default RegisterPage;