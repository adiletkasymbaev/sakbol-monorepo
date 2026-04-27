import Margin from "../../../shared/components/Margin";
import roles from "../utils/roles";
import RoleItem from "./RoleItem";
import { useTranslation } from "react-i18next";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

function SelectRole() {
    const { t } = useTranslation();

    const content = (
        <div>
            <p className="text-white">{t('auth.selectRole.selectRole')}</p>
            <Margin direction="b" value={3}/>
            <div className="flex gap-4 flex-col">
                {roles.map(role => {
                    const roleKey = role.key === ProfileRoles.TOUR_AGENCY ? 'guide' : role.key;
                    return (
                        <RoleItem
                            key={role.id}
                            role={role.key}
                            title={t(`roles.${roleKey}.title`)}
                            description={t(`roles.${roleKey}.description`)}
                        />
                    );
                })}
            </div>
        </div>
    );

    return content;
}

export default SelectRole;