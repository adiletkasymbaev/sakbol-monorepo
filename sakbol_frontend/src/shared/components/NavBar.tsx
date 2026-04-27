import UrlNames from "../enums/UrlNames";
import IconGear from "../icons/IconGear";
import IconGroup from "../icons/IconGroup";
import IconHouse from "../icons/IconHouse";
import IconMapPin from "../icons/IconMapPin";
import IconPerson from "../icons/IconPerson";
import NavItem from "./NavItem";
import SosButton from "./SosButton";
import useAuth from "../../store/useAuth";
import { ProfileRoles } from "../enums/ProfileRoles";
import { useTranslation } from "react-i18next";

function NavBar() {
    const { t } = useTranslation();
    const activeClass = "text-[#F39DAA]";
    const inactiveClass = "text-white";
    const userRole = useAuth((state) => state.userRole);
    const isTourAgent = userRole === ProfileRoles.TOUR_AGENCY;
    const isTourist = userRole === ProfileRoles.TOURIST;
    const showGroups = isTourAgent || isTourist;

    const content = (
        <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full z-9999 bg-primary p-2 rounded-t-md">
            <div className="flex justify-between relative items-center">
                <div className="flex gap-5">
                    <NavItem link="/" icon={<IconHouse className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        {t('navbar.home')}
                    </NavItem>

                    {showGroups ? (
                        <NavItem 
                            link={"/" + UrlNames.TOUR_GROUPS} 
                            icon={<IconGroup className="w-5 h-5" />} 
                            activeClass={activeClass} 
                            inactiveClass={inactiveClass}
                        >
                            {t('navbar.groups')}
                        </NavItem>
                    ) : (
                        <NavItem 
                            link={"/" + UrlNames.SOS_CONTACTS} 
                            icon={<IconMapPin className="w-5 h-5" />} 
                            activeClass={activeClass} 
                            inactiveClass={inactiveClass}
                        >
                            {t('navbar.contacts')}
                        </NavItem>
                    )}
                </div>

                <SosButton/>

                <div className="flex gap-5">
                    <NavItem link={"/" + UrlNames.SOS_SETTINGS} icon={<IconGear className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        {t('navbar.settings')}
                    </NavItem>

                    <NavItem link={"/" + UrlNames.SOS_PROFILE} icon={<IconPerson className="w-5 h-5" />} activeClass={activeClass} inactiveClass={inactiveClass}>
                        {t('navbar.profile')}
                    </NavItem>
                </div>
            </div>
        </div>
    );

    return content;
}

export default NavBar;