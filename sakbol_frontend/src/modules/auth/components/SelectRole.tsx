import Margin from "../../../shared/components/Margin";
import roles from "../utils/roles";
import RoleItem from "./RoleItem";

function SelectRole() {
    const content = (
        <div>
            <p className="text-white">Ролду тамданыз</p>
            <Margin direction="b" value={3}/>
            <div className="flex gap-4 flex-col">
                {roles.map(role => (
                    <RoleItem
                        key={role.id}
                        role={role.key}
                        title={role.title}
                        description={role.description}
                    />
                ))}
            </div>
        </div>
    );

    return content;
}

export default SelectRole;