import Heading from "../../../shared/components/Heading";
import Headline from "../../../shared/components/Headline";
import Margin from "../../../shared/components/Margin";
import PinElement from "../../../shared/components/PinElement";
import LoginForm from "../components/LoginForm";
import RegisterFallback from "../components/RegisterFallback";

function LoginPage() {
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
                    Самое надежное <br /> SOS-приложение в Кыргызстане
                </Heading>
                <Margin direction="b" value={20}/>

                <Headline
                    mainText="Войдите в аккаунт"
                    secondaryText="Вход"
                />
                <Margin direction="b" value={4}/>

                <LoginForm/>

            </div>
            
            <RegisterFallback/>
        </div>
    );

    return content;
}

export default LoginPage;