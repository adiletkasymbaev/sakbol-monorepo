import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import type { Contact } from "../../../shared/types/contacts";
import { mutableAction } from "../../../shared/utils/mutableAction";
import { useContacts } from "../../../store/useContacts";
import useAuth from "../../../store/useAuth";
import ContactItem from "./ContactItem";

// Fallback: decode userId from JWT if store value is null
function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const raw = payload?.user_id;
    const parsed = Number(raw);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function ContactsAcceptedList() {
  const {
    contactsAcceptedList,
    isAcceptedLoading,
    isActionLoading,
    error,
    destroyContact,
  } = useContacts();

  const storedUserId = useAuth((s) => s.userId);
  const tokenAccess  = useAuth((s) => s.tokenAccess);

  // use stored value, fall back to JWT decode if null
  const currentUserId = storedUserId ?? getUserIdFromToken(tokenAccess);

  const onDestroy = (id: number) =>
    mutableAction({
      id,
      action: destroyContact,
      okText: "Вы удалили заявку",
    });

  return (
    <RenderWithSpinner
      wrapperHeight={50}
      isLoading={isAcceptedLoading}
      isEmpty={contactsAcceptedList.length === 0}
      emptyText={error ? "Ошибка" : "Нет контактов"}
    >
      {contactsAcceptedList.map((item: Contact) => {
        const otherProfile =
          item.from_user.id === currentUserId
            ? item.to_profile
            : item.from_profile;

        return (
          <ContactItem
            item={otherProfile}
            pk={item.id}
            isActionLoading={isActionLoading}
            isLoading={isAcceptedLoading}
            onDestroy={onDestroy}
            key={item.id}
          />
        );
      })}
    </RenderWithSpinner>
  );
}

export default ContactsAcceptedList;