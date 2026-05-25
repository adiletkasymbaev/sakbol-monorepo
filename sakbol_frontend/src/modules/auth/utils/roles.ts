import { ProfileRoles } from "../../../shared/enums/ProfileRoles";

const roles = [
    {
        id: 1,
        key: ProfileRoles.USER,
        title: "SOS-пользователь",
        description: "Негизги сөздү айтсам, жакындарыма SOS-белги автоматтык түрдө жөнөтө алам",
    },
    {
        id: 2,
        key: ProfileRoles.PARENT,
        title: "Родитель",
        description: "Баламдын коопсуздугу тууралуу билдирүүлөрдү алып, көзөмөлдөй алам",
    },
    {
        id: 3,
        key: ProfileRoles.CHILD,
        title: "Ребенок",
        description: "Жайгашкан жерим менен бөлүшүп, ата-энеме SOS-белги жөнөтө алам",
    },
    {
        id: 4,
        key: ProfileRoles.TOUR_AGENCY,
        title: "Тур. агентство",
        description: "Топтогу туристтердин жайгашкан жерин көзөмөлдөй алам",
    },
    {
        id: 5,
        key: ProfileRoles.TOURIST,
        title: "Турист",
        description: "Жайгашкан жерим менен бөлүшүп, гидге SOS-белги жөнөтө алам",
    },
];

export default roles;