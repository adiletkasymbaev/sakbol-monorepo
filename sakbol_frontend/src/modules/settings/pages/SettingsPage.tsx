import { Accordion, AccordionItem, Select, SelectItem } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";

function SettingsPage() {
    const [langValue, setLangValue] = useState("ru")
    const { i18n } = useTranslation()

    function handleLanguageSelection(e: ChangeEvent<HTMLSelectElement>) {
        setLangValue(e.target.value)
        i18n.changeLanguage(e.target.value)
    }

    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                Профиль
            </Heading>
            <Margin direction="b" value={2.5}/>

            <NavBar/>

            <Accordion variant="shadow">
                <AccordionItem key="1" aria-label="Ключевые слова" title="Ключевые слова">
                    <p className="text-sm text-gray-500">Вы можете произнести следующие слова чтобы произвести сос-сигнал:</p>
                    <ul className="list-disc pl-8 pt-2 text-sm">
                        <li>"Помогите"</li>
                        <li>"СОС", "Эс о эс"</li>
                        <li>"Помощь"</li>
                        <li>"Я хочу кофе"</li>
                        <li>"Я схожу в магазин"</li>
                        <li>"Когда на работу?"</li>
                    </ul>
                </AccordionItem>

                <AccordionItem key="2" aria-label="Язык" title="Язык">
                    <Select 
                        className="max-w-xs" 
                        label="Выбрать язык"
                        selectionMode="single"
                        selectedKeys={[langValue]}
                        disallowEmptySelection={true}
                        onChange={handleLanguageSelection}
                    >
                        <SelectItem key="en">English</SelectItem>
                        <SelectItem key="kg">Кыргызча</SelectItem>
                        <SelectItem key="ru">Русский</SelectItem>
                    </Select>
                </AccordionItem>

                <AccordionItem key="3" aria-label="Политика конфидециальности" title="Политика конфидециальности">
                    <p>
                        ....
                    </p>
                </AccordionItem>
            </Accordion>
        </div>
    );

    return content;
}

export default SettingsPage;