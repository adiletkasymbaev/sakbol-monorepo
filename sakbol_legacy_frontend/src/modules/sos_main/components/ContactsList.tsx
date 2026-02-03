// @ts-nocheck
import { addToast } from "@heroui/react";
import { useGetContactsQuery } from "../../../features/contacts/contactsApi";
import { useAddFavoriteMutation, useGetFavoritesQuery } from "../../../features/contacts/favoritesApi";
import ContactItem from "../../../shared/components/ContactItem";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { ToastTypes } from "../../../shared/enums/ToastTypes";

function ContactsList() {
    const { data: contacts, isLoading, refetch } = useGetContactsQuery()
    const [addToFavorite, { isLoading: isAdding, addingError }] = useAddFavoriteMutation();
    
    const handleAddToFavorite = async (contactId: number) => {
        try {
            await addToFavorite(contactId).unwrap(); // .unwrap() выбрасывает ошибку, если запрос не 200
            addToast({
                title: ToastTypes.OK,
                description: "Контакт добавлен в избранные",
                color: "success"
            })
        } catch (err) {
            addToast({
                title: ToastTypes.ERR,
                description: "Не удалось добавить контакт в избранные",
                color: "danger"
            })
        }

        refetch()
    };

    const content = (
        <RenderWithSpinner isLoading={isLoading} isEmpty={contacts?.count === 0} emptyText="Нет контактов">
            <div className="flex flex-col gap-2">
                {contacts?.results?.map(contact => (
                    <ContactItem 
                        key={contact.id}
                        contact={contact.to_user} 
                        variant="list"
                        defaultCheckboxValue={false}
                        onClick={() => handleAddToFavorite(contact.to_user.id)}
                        isFavorite={contact.is_favorite}
                    />
                ))}
            </div>
        </RenderWithSpinner>
    );

    return content;
}

export default ContactsList;