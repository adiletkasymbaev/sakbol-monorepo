// @ts-nocheck
import { useEffect } from "react";
import { useGetFavoritesQuery } from "../../../features/contacts/favoritesApi";
import BottomSheet from "../components/BottomSheet";
import ContactItem from "../../../shared/components/ContactItem";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import Navbar from "../../../shared/components/Navbar";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import Map from '../components/Map';
import { useDispatch, useSelector } from "react-redux";
import { selectFavoriteContacts, setFavoriteContacts, setTargetLocation } from "../../../features/sos/presenceSlice";
import { useHotwordListener } from "../hooks/useHotwordListener";
import { useSyncLocation } from "../hooks/useSyncLocation";
import type { FavoriteContact } from "../../../shared/types/favorites";

function SosMainPage() {
    const dispatch = useDispatch();
    const { data, isLoading, isSuccess } = useGetFavoritesQuery();
    useEffect(() => {
    if (isSuccess && data?.results) {
        dispatch(setFavoriteContacts(data.results));
    } else {
        dispatch(setFavoriteContacts([]))
    }
    }, [isSuccess, data, dispatch]);
    const favoriteContacts = useSelector(selectFavoriteContacts);

    const handleMyLocation = (contact: FavoriteContact) => {
        dispatch(setTargetLocation({ lat: contact.location.latitude, lon: contact.location.longitude }));
    };

    // const accessToken = useSelector(selectAccessToken);
    // useLocationSocket("ws://127.0.0.1:8000/ws/location/", accessToken!);
    // useLocationSocket("wss://sakbol.app/ws/location/", accessToken!);
    useSyncLocation()
    useHotwordListener()

    const content = (
        <div className="page-wrapper-no-padding">
            <Map/>

            <BottomSheet>
                <Heading variant="card">
                    Ваши контакты
                </Heading>
                <Margin direction="b" value={2}/>
                <RenderWithSpinner isLoading={isLoading} isEmpty={favoriteContacts.length === 0} emptyText="Нет избранных контактов">
                    <div className="flex flex-col gap-2">
                        {favoriteContacts?.map(favorite => (
                            <ContactItem 
                                key={favorite.id}
                                contact={favorite.contact} 
                                onClick={() => handleMyLocation(favorite)} 
                            />
                        ))}
                    </div>
                    <Margin direction="b" value={6}/>
                </RenderWithSpinner>
            </BottomSheet>
            
            <Navbar/>
        </div>
    );

    return content;
}

export default SosMainPage;