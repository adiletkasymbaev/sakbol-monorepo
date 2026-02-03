import { Avatar, Button } from "@heroui/react";
import { baseURL } from "../../../shared/services/axios";
import type { Contact } from "../../../shared/types/contacts";
import type { Profile } from "../../../shared/types/auth";

type Props = {
  item: Partial<Profile>;
  pk: number;
  isActionLoading: boolean;
  isLoading: boolean;
  onDestroy: (id: number) => void;
  onAccept?: (id: number) => void;
  isIncoming?: boolean;
};

function ContactItem({
  item,
  pk,
  isActionLoading,
  isLoading,
  onDestroy,
  onAccept = () => {},
  isIncoming = false,
}: Props) {
  const avatarSrc = item?.avatar
    ? baseURL + item?.avatar
    : undefined;

  return (
    <div className="bg-gray-50 rounded-md p-1 flex justify-between items-center">
      <div className="flex items-center gap-3">
        {avatarSrc ? (
          <Avatar size="md" src={avatarSrc} />
        ) : (
          <Avatar size="md" name={item.first_name} />
        )}

        <p className="text-sm">
          {item.first_name} {item.last_name}
        </p>
      </div>

      <div className="flex gap-1">
        <Button
          isIconOnly
          color="danger"
          variant="flat"
          size="sm"
          isLoading={isActionLoading}
          isDisabled={isLoading || isActionLoading}
          onPress={() => onDestroy(pk)}
        >
          <span className="mb-1 font-semibold">x</span>
        </Button>

        {isIncoming && (
          <Button
            isIconOnly
            color="success"
            variant="flat"
            size="sm"
            isLoading={isActionLoading}
            isDisabled={isLoading || isActionLoading}
            onPress={() => onAccept(pk)}
          >
            <span className="mb-1 font-semibold">+</span>
          </Button>
        )}
      </div>
    </div>
  );
}

export default ContactItem;