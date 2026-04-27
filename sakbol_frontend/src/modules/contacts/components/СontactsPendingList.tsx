import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import type { Contact } from "../../../shared/types/contacts";
import { useContacts } from "../../../store/useContacts";
import ContactItem from "./ContactItem";
import Margin from "../../../shared/components/Margin";
import { mutableAction } from "../../../shared/utils/mutableAction";
import { useTranslation } from "react-i18next";

function СontactsPendingList() {
  const { t } = useTranslation();
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
      okText: t('contacts.pending.requestDeleted'),
    });

  const onAccept = (id: number) =>
    mutableAction({
      id,
      action: acceptContact,
      okText: t('contacts.pending.requestAccepted'),
    });

  return (
    <div className="flex flex-col gap-2">
        <h3 className="font-bold">{t('contacts.pending.outgoing')}</h3>

        <RenderWithSpinner
            wrapperHeight={50}
            isLoading={isPendingLoading}
            isEmpty={contactsPendingList.length === 0}
            emptyText={error ? t('common.error') : t('contacts.pending.emptyOutgoing')}
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

        <h3 className="font-bold">{t('contacts.pending.incoming')}</h3>
        <RenderWithSpinner
            wrapperHeight={50}
            isLoading={isIncomingLoading}
            isEmpty={contactsIncomingList.length === 0}
            emptyText={error ? t('common.error') : t('contacts.pending.emptyIncoming')}
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