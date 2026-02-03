import UrlNames from "../enums/UrlNames";
import IconGear from "../icons/IconGear";
import IconHouse from "../icons/IconHouse";
import IconMapPin from "../icons/IconMapPin";
import IconPerson from "../icons/IconPerson";
import NavItem from "./NavItem";
import SosButton from "./SosButton";

function NavBar() {
    const activeClass = "text-[#F39DAA]";
    const inactiveClass = "text-white";
    
    const content = (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-9999 bg-primary p-2 rounded-t-md">
            <div className="flex justify-between relative items-center">
                <div className="flex gap-5">
                    <NavItem link="/" icon={<IconHouse className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        Главная
                    </NavItem>

                    <NavItem link={"/" + UrlNames.SOS_CONTACTS} icon={<IconMapPin className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        Контакты
                    </NavItem>
                </div>

                <SosButton/>

                <div className="flex gap-5">
                    <NavItem link={"/" + UrlNames.SOS_SETTINGS} icon={<IconGear className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        Настройки
                    </NavItem>

                    <NavItem link={"/" + UrlNames.SOS_PROFILE} icon={<IconPerson className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        Профиль
                    </NavItem>
                </div>
            </div>
        </div>
    );

    return content;
}

export default NavBar;