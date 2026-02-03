import Margin from "../../../shared/components/Margin";
import RoleItem from "./RoleItem";

const roles = [
    {
        id: 1,
        title: "Я родитель",
        description: "Буду получать уведомления и отслеживать безопасность ребёнка",
        selected: false,
        disabled: true,
    },
    {
        id: 2,
        title: "Я ребенок",
        description: "Буду делиться местоположением и смогу отправить SOS-сигнал",
        selected: false,
        disabled: true,
    },
    {
        id: 3,
        title: "Я пользователь SOS",
        description: "Буду автоматически отправлять SOS-сигнал, если скажу ключевое слово",
        selected: true,
        disabled: false,
    },
]

function RoleList() {
    const content = (
        <div>
            <p className="text-white">Выберите роль</p>
            <Margin direction="b" value={3}/>
            <div className="flex gap-4 flex-col">
                {roles.map(role => (
                    <RoleItem
                        title={role.title}
                        description={role.description}
                        isSelected={role.selected}
                        isDisabled={role.disabled}
                        key={role.id}
                    />
                ))}
            </div>
        </div>
    );

    return content;
}

export default RoleList;