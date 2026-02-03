import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import Navbar from "../../../shared/components/Navbar";
import AddContact from "../components/AddContact";
import ContactsList from "../components/ContactsList";
import FavoriteContactsList from "../components/FavoriteContactsList";
import IncomingContactsList from "../components/IncomingContactsList";
import OutgoingContactsList from "../components/OutgoingContactsList";

function SosContactsPage() {
    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                Список контактов
            </Heading>
            <Margin direction="b" value={2.5}/>
            <AddContact/>
            <Margin direction="b" value={5}/>

            <Heading variant="card">
                Входящие запросы
            </Heading>
            <Margin direction="b" value={2.5}/>
            <IncomingContactsList/>
            <Margin direction="b" value={5}/>

            <Heading variant="card">
                Исходящие запросы
            </Heading>
            <Margin direction="b" value={2.5}/>
            <OutgoingContactsList/>
            <Margin direction="b" value={5}/>

            <Heading variant="card">
                Избранные контакты
            </Heading>
            <Margin direction="b" value={2.5}/>
            <FavoriteContactsList/>
            <Margin direction="b" value={5}/>

            <Heading variant="card">
                Все контакты
            </Heading>
            <Margin direction="b" value={2.5}/>
            <ContactsList/>
            <Margin direction="b" value={16}/>

            <Navbar/>
        </div>
    );

    return content;
}

export default SosContactsPage;