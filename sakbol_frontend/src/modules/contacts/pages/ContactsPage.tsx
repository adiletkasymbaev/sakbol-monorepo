import { Tabs, Tab } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import AddContactForm from "../components/AddContactForm/AddContactForm";
import СontactsPendingList from '../components/СontactsPendingList';
import { useEffect } from "react";
import { useContacts } from "../../../store/useContacts";
import ContactsAcceptedList from "../components/ContactsAcceptedList";
import { useTranslation } from "react-i18next";

function ContactsPage() {
    const { t } = useTranslation();
    const {
        getPending,
        getAccepted,
        getIncoming,
    } = useContacts();

    useEffect(() => {
        getPending();
        getAccepted();
        getIncoming();
    }, []);

    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                {t('contacts.title')}
            </Heading>
            <Margin direction="b" value={2.5}/>
            <AddContactForm/>
            <Margin direction="b" value={6}/>

            <Tabs aria-label="Options">
                <Tab key="Контакты" title={t('contacts.tabs.contacts')}>
                    <ContactsAcceptedList/>
                </Tab>
                <Tab key="Заявки" title={t('contacts.tabs.requests')}>
                    <СontactsPendingList/>
                </Tab>
            </Tabs>

            <NavBar/>

            <div className="pb-10" />
        </div>
    );

    return content;
}

export default ContactsPage;