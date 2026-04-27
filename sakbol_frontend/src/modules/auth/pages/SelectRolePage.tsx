import { Button } from "@heroui/react";
import { Link } from "react-router-dom";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import PinElement from "../../../shared/components/PinElement";
import UrlNames from "../../../shared/enums/UrlNames";
import LoginFallback from "../components/LoginFallback";
import SelectRole from "../components/SelectRole";
import { useTranslation } from "react-i18next";
import LanguageSelect from "../../../shared/components/LanguageSelect";

function SelectRolePage() {
    const { t } = useTranslation();

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
                    {t('auth.selectRole.title')}
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
                        {t('auth.selectRole.button')}
                    </Button>
                </div>
            </div>

            <LoginFallback/>
            <LanguageSelect />
        </div>
    );

    return content;
}

export default SelectRolePage;