import Headline from "../../../shared/components/Headline";
import Margin from "../../../shared/components/Margin";
import RegisterForm from "../components/RegisterForm/RegisterForm";

function RegisterPage() {
    const content = (
        <div className="page-wrapper">
            <Headline
                secondaryText="Регистрация"
                mainText="Создать аккаунт"
            />
            <Margin direction="b" value={6}/>
            <RegisterForm/>
        </div>
    );

    return content;
}

export default RegisterPage;