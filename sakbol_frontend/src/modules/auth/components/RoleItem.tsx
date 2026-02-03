import type { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import useAuth from "../../../store/useAuth";

interface ComponentProps {
    role: ProfileRoles;
    title: string;
    description: string;
}

function RoleItem({ title, description, role }: ComponentProps) {
    const selectedRole = useAuth((state) => state.selectedRole)
    const setSelectedRole = useAuth((state) => state.setSelectedRole)

    function handleRoleSelection() {
        setSelectedRole(role)
    }

    const content = (
        <div 
            onClick={handleRoleSelection}
            className={`${role === selectedRole ? "bg-white border-4 border-primary text-primary" : "bg-primary text-white border-4 border-transparent"} p-3 rounded-md flex gap-1.5 flex-col transition-all`} 
        >
            <span className="font-bold text-lg">{title}</span>
            <span className="text-xs">
                {description}
            </span>
        </div>
    );

    return content;
}

export default RoleItem;