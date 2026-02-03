import { Button } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import PinElement from "../../../shared/components/PinElement";
import RoleList from "../components/RoleList";
import { Link } from "react-router-dom";
import { UrlNames } from "../../../shared/enums/UrlNames";
import LoginFallback from "../components/LoginFallback";

function RegisterFirstPage() {
    const content = (
        <div className="page-wrapper">
            <PinElement to="top">
                <img 
                    className="w-full"
                    src="images/pink-pad-v2.png" 
                    alt=""
                />
            </PinElement>

            <div className="relative">
                <Heading>
                    Зарегистрируйтесь, чтобы защитить близких
                </Heading>
                <Margin direction="b" value={6}/>

                <div className="px-3">
                    <RoleList/>
                    <Margin direction="b" value={5}/>

                    <Button 
                        as={Link}
                        type="submit" 
                        color="primary"
                        className="w-full"
                        to={"/" + UrlNames.REGISTER}
                    >
                        Продолжить
                    </Button>

                </div>
            </div>
            
            <LoginFallback/>
        </div>
    );

    return content;
}

export default RegisterFirstPage;