import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import type { Contact } from "../../../shared/types/contacts";
import { mutableAction } from "../../../shared/utils/mutableAction";
import { useContacts } from "../../../store/useContacts";
import ContactItem from "./ContactItem";

function ContactsAcceptedList() {
    const {
        contactsAcceptedList,
        isAcceptedLoading,
        isActionLoading,
        error,
        destroyContact
    } = useContacts();

    const onDestroy = (id: number) =>
        mutableAction({
            id,
            action: destroyContact,
            okText: "Вы удалили заявку",
        });

    const content = (
        <RenderWithSpinner
            wrapperHeight={50}
            isLoading={isAcceptedLoading}
            isEmpty={contactsAcceptedList.length === 0}
            emptyText={error ? "Ошибка" : "Нет контактов"}
        >
            {contactsAcceptedList.map((item: Contact) => (
                <ContactItem 
                    item={item?.from_profile}
                    pk={item.id}
                    isActionLoading={isActionLoading}
                    isLoading={isAcceptedLoading}
                    onDestroy={onDestroy}
                    key={item.id}
                />
            ))}
        </RenderWithSpinner>
    );

    return content;
}

export default ContactsAcceptedList;