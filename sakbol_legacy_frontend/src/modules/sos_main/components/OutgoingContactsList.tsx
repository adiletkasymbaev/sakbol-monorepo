// @ts-nocheck
import { addToast } from "@heroui/react";
import { useCancelContactRequestMutation, useGetOutgoingRequestsQuery } from "../../../features/contacts/contactsApi";
import ContactItem from "../../../shared/components/ContactItem";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

function OutgoingContactsList() {
    const { data: outgoing, isLoading } = useGetOutgoingRequestsQuery();
    const [cancelRequest, { isLoading: isCanceling, cancelError }] = useCancelContactRequestMutation();
    
    const handleCancel = async (contactId: number) => {
        try {
            await cancelRequest(contactId).unwrap(); // .unwrap() выбрасывает ошибку, если запрос не 200
            addToast({
                title: ToastTypes.OK,
                description: "Заявка отменена",
                color: "success"
            })
        } catch (err) {
            addToast({
                title: ToastTypes.ERR,
                description: "Не удалось отменить заявку",
                color: "danger"
            })
        }
    };

    const content = (
        <RenderWithSpinner wrapperHeight={35} isLoading={isLoading} isEmpty={outgoing?.length === 0} emptyText="Нет исходящих запросов">
            <div className="flex flex-col gap-2">
                {outgoing?.map(item => (
                    <ContactItem 
                        key={item.id}
                        contact={item.to_user} 
                        variant="request-out"
                        onClick={() => handleCancel(item.id)}
                        isLoading={isCanceling}
                    />
                ))}
            </div>
        </RenderWithSpinner>
    );

    return content;
}

export default OutgoingContactsList;