// @ts-nocheck
import { addToast } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

interface ComponentProps {
    title: string;
    description: string;
    isDisabled: boolean;
    isSelected: boolean;
}

function RoleItem({title, description, isDisabled, isSelected, ...props}: ComponentProps) {

    function mockClickHandler(e: React.ChangeEvent<HTMLInputElement>) {
        e.preventDefault

        if (isDisabled) {
            addToast({
                title: ToastTypes.WARN,
                description: "Данная роль находится в разработке",
                color: "warning"
            })
        }
    }

    const content = (
        <div 
            onClick={mockClickHandler}
            className={`${isDisabled ? "opacity-70" : ""} ${isSelected ? "bg-white border-4 border-primary text-primary" : "bg-primary text-white"} p-3 rounded-md flex gap-1.5 flex-col`} 
            {...props}
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