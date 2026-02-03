import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

const roles = [
    {
        id: 1,
        key: ProfileRoles.USER,
        title: "Мен SOS колдонуучусумун",
        description: "Негизги сөздү айтсам, жакындарыма SOS-белги автоматтык түрдө жөнөтө алам",
    },
    {
        id: 2,
        key: ProfileRoles.PARENT,
        title: "Мен ата-энемин",
        description: "Баламдын коопсуздугу тууралуу билдирүүлөрдү алып, көзөмөлдөй алам",
    },
    {
        id: 3,
        key: ProfileRoles.CHILD,
        title: "Мен баламын",
        description: "Жайгашкан жерим менен бөлүшүп, ата-энеме SOS-белги жөнөтө алам",
    },
    {
        id: 4,
        key: ProfileRoles.TOUR_AGENCY,
        title: "Мен гидмин",
        description: "Топтогу туристтердин жайгашкан жерин көзөмөлдөй алам",
    },
    {
        id: 5,
        key: ProfileRoles.TOURIST,
        title: "Мен туристмин",
        description: "Жайгашкан жерим менен бөлүшүп, гидге SOS-белги жөнөтө алам",
    },
];

export default roles;