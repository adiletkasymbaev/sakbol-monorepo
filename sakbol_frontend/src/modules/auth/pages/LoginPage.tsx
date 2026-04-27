import Heading from "../../../shared/components/Heading";
import Headline from "../../../shared/components/Headline";
import Margin from "../../../shared/components/Margin";
import PinElement from "../../../shared/components/PinElement";
import LoginForm from "../components/LoginForm/LoginForm";
import RegisterFallback from "../components/RegisterFallback";
import { useTranslation } from "react-i18next";
import LanguageSelect from "../../../shared/components/LanguageSelect";

function LoginPage() {
    const { t } = useTranslation();

    const content = (
        <div className="page-wrapper">
            <PinElement to="top">
                <img 
                    className="w-full"
                    src="images/pink-pad.png" 
                    alt="" 
                />
            </PinElement>
            <PinElement to="bottom">
                <img 
                    className="w-full"
                    src="images/blue-pad.png" 
                    alt="" 
                />
            </PinElement>

            <div className="relative">
                <Heading>
                    {t('auth.login.tagline')}
                </Heading>
                <Margin direction="b" value={20}/>

                <Headline
                    mainText={t('auth.login.title')}
                    secondaryText={t('auth.login.button')}
                />
                <Margin direction="b" value={4}/>

                <LoginForm/>
            </div>
            
            <RegisterFallback/>
            <LanguageSelect />
        </div>
    );

    return content;
}

export default LoginPage;