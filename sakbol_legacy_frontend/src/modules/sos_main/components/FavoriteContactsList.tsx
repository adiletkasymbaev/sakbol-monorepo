// @ts-nocheck
import { useGetFavoritesQuery } from "../../../features/contacts/favoritesApi";
import ContactItem from "../../../shared/components/ContactItem";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";

function FavoriteContactsList() {
    const { data: favoriteContacts, isLoading } = useGetFavoritesQuery()

    const content = (
        <RenderWithSpinner isLoading={isLoading} isEmpty={favoriteContacts?.count === 0} emptyText="Нет избранных контактов">
            <div className="flex flex-col gap-2">
                {favoriteContacts?.results?.map(favorite => (
                    <ContactItem 
                        key={favorite.id}
                        contact={favorite.contact} 
                        variant="list"
                        isFavorite={favorite.is_favorite}
                    />
                ))}
            </div>
        </RenderWithSpinner>
    );

    return content;
}

export default FavoriteContactsList;