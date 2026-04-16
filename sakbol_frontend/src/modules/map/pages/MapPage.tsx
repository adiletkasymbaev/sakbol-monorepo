import { useEffect, useState } from "react";
import { Button } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { useContacts } from "../../../store/useContacts";
import ContactsAcceptedList from "../../contacts/components/ContactsAcceptedList";
import BottomSheet from "../components/BottomSheet";
import MapLayer from "../components/MapLayer";
import { PushDebug } from "../../push/pushDebug";
import { useZonesStore } from "../hooks/useZonesStore";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import useTour from "../../../store/useTour";

function MapPage() {
    const { getAccepted } = useContacts();
    const { isDrawable } = useZonesStore();
    const userRole = useAuth((state) => state.userRole);
    const isAgent = userRole === ProfileRoles.TOUR_AGENCY;
    const { groups, fetchGroups } = useTour();

    useEffect(() => {
        getAccepted();
        if (isAgent) {
            fetchGroups();
        }
    }, [isAgent]);

    const [open, setOpen] = useState(false);

    // Находим группу с активным туром
    const activeGroup = groups.find(g => g.has_active_session);

    const content = (
        <div>
            <MapLayer isDrawable={isDrawable}/>

            {/* Кнопка "Начать тур" для тур-агентов */}
            {isAgent && !activeGroup && groups.length > 0 && (
                <div className="fixed top-4 right-4 z-40">
                    <Button
                        color="primary"
                        size="md"
                        className="shadow-lg"
                        onPress={() => {
                            // Переход к первой группе для начала тура
                            window.location.href = `/tour/groups/${groups[0]?.id}`;
                        }}
                    >
                        🚌 Начать тур
                    </Button>
                </div>
            )}

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