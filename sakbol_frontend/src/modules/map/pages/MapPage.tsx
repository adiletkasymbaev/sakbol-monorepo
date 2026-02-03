import { useEffect, useState } from "react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { useContacts } from "../../../store/useContacts";
import ContactsAcceptedList from "../../contacts/components/ContactsAcceptedList";
import BottomSheet from "../components/BottomSheet";
import MapLayer from "../components/MapLayer";
import { PushDebug } from "../../push/pushDebug";
import { useZonesStore } from "../hooks/useZonesStore";

function MapPage() {
    const {
        getAccepted,
    } = useContacts();

    const {
        isDrawable
    } = useZonesStore();

    useEffect(() => {
        getAccepted();
    }, []);

    const [open, setOpen] = useState(false);

    const content = (
        <div>
            <MapLayer isDrawable={isDrawable}/>

            <BottomSheet
                isOpen={open}
                setOpen={setOpen}
            >
                <Heading variant="card">
                    Ваши контакты
                </Heading>
                <Margin direction="b" value={2}/>
                
                <ContactsAcceptedList/>
                <Margin direction="b" value={6}/>
            </BottomSheet>

            <NavBar/>

            <PushDebug/>
        </div>
    );

    return content;
}

export default MapPage;