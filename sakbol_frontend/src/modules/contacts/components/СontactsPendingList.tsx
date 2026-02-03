import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import type { Contact } from "../../../shared/types/contacts";
import { useContacts } from "../../../store/useContacts";
import ContactItem from "./ContactItem";
import Margin from "../../../shared/components/Margin";
import { mutableAction } from "../../../shared/utils/mutableAction";

function СontactsPendingList() {
  const {
    contactsPendingList,
    isPendingLoading,
    contactsIncomingList,
    isIncomingLoading,
    destroyContact,
    acceptContact,
    isActionLoading,
    error,
  } = useContacts();

  const onDestroy = (id: number) =>
    mutableAction({
      id,
      action: destroyContact,
      okText: "Вы удалили заявку",
    });

  const onAccept = (id: number) =>
    mutableAction({
      id,
      action: acceptContact,
      okText: "Заявка принята",
    });

  return (
    <div className="flex flex-col gap-2">
        <h3 className="font-bold">Исходящие заявки</h3>

        <RenderWithSpinner
            wrapperHeight={50}
            isLoading={isPendingLoading}
            isEmpty={contactsPendingList.length === 0}
            emptyText={error ? "Ошибка" : "Нет исходящих заявок"}
        >
            {contactsPendingList.map((item: Contact) => (
                <ContactItem 
                    item={item?.to_profile}
                    pk={item.id}
                    isActionLoading={isActionLoading}
                    isLoading={isPendingLoading}
                    key={item.id}
                    onDestroy={onDestroy}
                />
            ))}
        </RenderWithSpinner>

        <Margin direction="b" value={1} />

        <h3 className="font-bold">Входящие заявки</h3>
        <RenderWithSpinner
            wrapperHeight={50}
            isLoading={isIncomingLoading}
            isEmpty={contactsIncomingList.length === 0}
            emptyText={error ? "Ошибка" : "Нет входящих заявок"}
        >
            {contactsIncomingList.map((item: Contact) => (
                <ContactItem 
                    item={item?.from_profile}
                    pk={item.id}
                    isActionLoading={isActionLoading}
                    isLoading={isIncomingLoading}
                    onDestroy={onDestroy}
                    onAccept={onAccept}
                    isIncoming={true}
                    key={item.id}
                />
            ))}
        </RenderWithSpinner>
    </div>
  );
}

export default СontactsPendingList;