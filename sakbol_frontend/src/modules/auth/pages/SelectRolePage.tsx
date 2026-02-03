import { Button } from "@heroui/react";
import { Link } from "react-router-dom";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import PinElement from "../../../shared/components/PinElement";
import UrlNames from "../../../shared/enums/UrlNames";
import LoginFallback from "../components/LoginFallback";
import SelectRole from "../components/SelectRole";

function SelectRolePage() {
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
                    Жакындарыңызды коргоо үчүн катталыңыз
                </Heading>
                <Margin direction="b" value={6}/>

                <div className="px-3">
                    <SelectRole/>
                    <Margin direction="b" value={5}/>

                    <Button 
                        as={Link}
                        type="submit" 
                        color="primary"
                        className="w-full"
                        to={"/" + UrlNames.REGISTER}
                    >
                        Улантуу
                    </Button>
                </div>
            </div>

            <LoginFallback/>
        </div>
    );

    return content;
}

export default SelectRolePage;