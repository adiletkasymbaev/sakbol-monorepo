// @ts-nocheck
import { Button } from "@heroui/react";
import IconMapPin from "../icons/IconMapPin";
import ConnectionStatus from "./ConnectionStatus";
import type { IUser } from "../types/user";
import IconPerson from "../icons/IconPerson";

interface ComponentProps {
    contact: IUser;
    onClick?: () => void;
    variant?: "map" | "list" | "none" | "request-in" | "request-out";
    defaultCheckboxValue?: boolean;
    isLoading?: boolean;
    isFavorite?: boolean;
}

function ContactItem({ contact, onClick = () => {}, variant = "map", isLoading = false, isFavorite = false }: ComponentProps) {

    const content = (
        <div className="bg-pale-secondary flex justify-between items-center p-1.5 pr-2 rounded-md">
            <div className="flex gap-2.5">
                <div className="overflow-hidden w-[40px] h-[40px] rounded-xs flex justify-center items-center">
                    <img 
                        className="max-w-full"
                        src={contact.avatar}
                        alt="avatar"
                    />
                </div>
                    <div className="flex flex-col justify-center gap-1">
                        <p className="font-medium text-black text-sm">{contact.first_name} {contact.last_name}</p>
                        {/* {(variant !== "request-in" && variant !== "request-out") &&
                            <ConnectionStatus isOnline={contact.is_online} lastOnline={contact.last_seen_display} />
                        } */}
                    </div>
            </div>
            {variant === "map" &&
                <Button isIconOnly onClick={onClick} color="primary">
                    <IconMapPin className="text-primary-100"/>
                </Button>
            }
            {(variant === "list" && isFavorite === false) &&
                <Button isIconOnly onClick={onClick} size="sm" color="success">
                    <IconPerson className="text-white"/>
                </Button>
            }
            {/* {(variant === "list" && isFavorite === false) &&
                <Button isIconOnly onClick={onClick} size="sm" color="danger">
                    <IconDelete className="text-white"/>
                </Button>
            } */}
            {variant === "request-in" &&
                <Button color="success" variant="flat" size="sm" onClick={onClick} isLoading={isLoading}>
                    Принять
                </Button>
            }
            {variant === "request-out" &&
                <Button color="warning" variant="flat" size="sm" onClick={onClick} isLoading={isLoading}>
                    Отменить
                </Button>
            }
        </div>
    );

    return content;
}

export default ContactItem;