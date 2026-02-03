// @ts-nocheck
import { addToast } from "@heroui/react";
import { useAcceptContactRequestMutation, useGetIncomingRequestsQuery } from "../../../features/contacts/contactsApi";
import ContactItem from "../../../shared/components/ContactItem";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

function IncomingContactsList() {
    const { data: incoming, isLoading } = useGetIncomingRequestsQuery();
    const [acceptContact, { isLoading: isAccepting, acceptError }] = useAcceptContactRequestMutation();

    const handleAccept = async (contactId: number) => {
        try {
            await acceptContact(contactId).unwrap(); // .unwrap() выбрасывает ошибку, если запрос не 200
            addToast({
                title: ToastTypes.OK,
                description: "Заявка принята",
                color: "success"
            })
        } catch (err) {
            addToast({
                title: ToastTypes.ERR,
                description: "Не удалось принять заявку",
                color: "danger"
            })
        }
    };

    const content = (
        <RenderWithSpinner wrapperHeight={35} isLoading={isLoading} isEmpty={incoming?.length === 0} emptyText="Нет входящих запросов">
            <div className="flex flex-col gap-2">
                {incoming?.map(item => (
                    <ContactItem 
                        key={item.id}
                        contact={item.from_user} 
                        variant="request-in"
                        onClick={() => handleAccept(item.id)}
                        isLoading={isAccepting}
                    />
                ))}
            </div>
        </RenderWithSpinner>
    );

    return content;
}

export default IncomingContactsList;