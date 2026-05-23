import { useEffect, useState } from "react";
import { Avatar, Button } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { useContacts } from "../../../store/useContacts";
import ContactsAcceptedList from "../../contacts/components/ContactsAcceptedList";
import BottomSheet from "../components/BottomSheet";
import MapLayer from "../components/MapLayer";
import { useZonesStore } from "../hooks/useZonesStore";
import useAuth from "../../../store/useAuth";
import { ProfileRoles } from "../../../shared/enums/ProfileRoles";
import useTour from "../../../store/useTour";
import { useTranslation } from "react-i18next";
import TourLocationUpdater from "../../tour/components/TourLocationUpdater";
import { baseURL } from "../../../shared/services/axios";
import type { TourGroupMember } from "../../../shared/types/tour";

function MapPage() {
    const { t } = useTranslation();
    const { getAccepted } = useContacts();
    const { isDrawable } = useZonesStore();
    const userRole = useAuth((state) => state.userRole);
    const isAgent = userRole === ProfileRoles.TOUR_AGENCY;
    const isTourist = userRole === ProfileRoles.TOURIST;
    const isInTourFlow = isAgent || isTourist;

    const {
        groups, fetchGroups,
        membersLocations, fetchMembersLocations,
        zones, fetchZones,
        members, fetchMembers,
    } = useTour();

    useEffect(() => {
        getAccepted();
        if (isInTourFlow) {
            fetchGroups();
        }
    }, [isInTourFlow]);

    // Once groups load, fetch member locations, zones (and members for tourists)
    useEffect(() => {
        const activeGroup = groups.find(g => g.is_active);
        if (activeGroup) {
            fetchMembersLocations(activeGroup.id);
            fetchZones(activeGroup.id);
            if (isTourist) {
                fetchMembers(activeGroup.id);
            }
            const interval = setInterval(() => fetchMembersLocations(activeGroup.id), 30_000);
            return () => clearInterval(interval);
        }
    }, [groups]);

    const [open, setOpen] = useState(false);

    const activeGroup = groups.find(g => g.is_active);
    const showGroupMembers = isInTourFlow && activeGroup && membersLocations.length > 0;

    // ── Tourist bottom-sheet content ─────────────────────────────────────
    const renderTouristPanel = () => {
        if (!activeGroup) {
            return (
                <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
                    <span className="text-3xl">🗺️</span>
                    <p className="text-sm font-medium text-default-700">
                        Вступите в группу чтобы увидеть участников
                    </p>
                    <p className="text-xs text-default-400">
                        Попросите тур-агента поделиться кодом приглашения
                    </p>
                </div>
            );
        }

        const agent = activeGroup.agent as any;
        const agentAvatar = agent?.avatar
            ? (agent.avatar.startsWith("http") ? agent.avatar : `${baseURL}${agent.avatar}`)
            : undefined;
        const agentFirstName = agent?.first_name || "";
        const agentLastName = agent?.last_name || "";
        const agentName = `${agentFirstName} ${agentLastName}`.trim() || "Агент";
        const agentEmail = agent?.user?.email || "";
        const agentPhone = agent?.phone_number || null;
        const agentInitials = `${agentFirstName?.[0] || ""}${agentLastName?.[0] || ""}`;

        const activeMembers = (members as TourGroupMember[]).filter(m => m.status === "active");

        return (
            <div className="flex flex-col gap-2">
                {/* Agent card */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/10 border border-secondary/20">
                    <Avatar
                        src={agentAvatar}
                        name={agentInitials}
                        size="sm"
                        classNames={{ base: "bg-secondary text-white" }}
                    />
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{agentName}</p>
                        <p className="text-xs text-default-500 truncate">{agentEmail}</p>
                        {agentPhone && (
                            <p className="text-xs text-secondary truncate">📞 {agentPhone}</p>
                        )}
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-xs text-secondary font-medium whitespace-nowrap">🎯 Агент</span>
                        {agentPhone && (
                            <a
                                href={`tel:${agentPhone}`}
                                className="text-xs bg-secondary text-white px-2 py-0.5 rounded-full whitespace-nowrap"
                            >
                                Позвонить
                            </a>
                        )}
                    </div>
                </div>

                {/* Group members */}
                {activeMembers.length === 0 ? (
                    <p className="text-xs text-default-400 text-center py-2">Нет активных участников</p>
                ) : (
                    activeMembers.map(member => {
                        const u = (member as any).user;
                        const avatar = u?.avatar
                            ? (u.avatar.startsWith("http") ? u.avatar : `${baseURL}${u.avatar}`)
                            : undefined;
                        const name = `${u?.first_name || ""} ${u?.last_name || ""}`.trim() || "Участник";
                        const email = u?.user?.email || "";
                        const initials = `${u?.first_name?.[0] || ""}${u?.last_name?.[0] || ""}`;

                        return (
                            <div key={member.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-default-50">
                                <Avatar src={avatar} name={initials} size="sm" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm truncate">{name}</p>
                                    <p className="text-xs text-default-400 truncate">{email}</p>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        );
    };

    return (
        <div>
            <MapLayer
                // Tourists must never see the draw panel
                isDrawable={!isTourist && isDrawable}
                memberLocations={showGroupMembers ? membersLocations : undefined}
                tourZones={isInTourFlow && activeGroup ? zones : undefined}
            />

            {/* Background location sender */}
            {isInTourFlow && <TourLocationUpdater />}

            {/* "Start Tour" button (agent only) */}
            {isAgent && !groups.find(g => g.has_active_session) && groups.length > 0 && (
                <div className="fixed top-4 right-4 z-40">
                    <Button
                        color="primary"
                        size="md"
                        className="shadow-lg"
                        onPress={() => {
                            window.location.href = `/tour/groups/${groups[0]?.id}`;
                        }}
                    >
                        {t('map.startTour')}
                    </Button>
                </div>
            )}

            <BottomSheet isOpen={open} setOpen={setOpen}>
                <Heading variant="card">
                    {isTourist ? (activeGroup ? activeGroup.name : "Ваша группа") : t('map.yourContacts')}
                </Heading>
                <Margin direction="b" value={2} />

                {isTourist ? renderTouristPanel() : <ContactsAcceptedList />}

                <Margin direction="b" value={6} />
            </BottomSheet>

            <NavBar />
        </div>
    );
}

export default MapPage;