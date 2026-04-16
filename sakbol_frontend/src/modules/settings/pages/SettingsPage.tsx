import { Accordion, AccordionItem, Select, SelectItem } from "@heroui/react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { useState, type ChangeEvent, useEffect } from "react";
import { useTranslation } from "react-i18next";

function SettingsPage() {
    const { t, i18n } = useTranslation();
    const [langValue, setLangValue] = useState(i18n.language || "ru");

    useEffect(() => {
        setLangValue(i18n.language);
    }, [i18n.language]);

    function handleLanguageSelection(e: ChangeEvent<HTMLSelectElement>) {
        const newLang = e.target.value;
        setLangValue(newLang);
        i18n.changeLanguage(newLang);
    }

    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                {t('profile.title')}
            </Heading>
            <Margin direction="b" value={2.5}/>

            <NavBar/>

            <Accordion variant="shadow">
                <AccordionItem key="1" aria-label={t('settings.keywords')} title={t('settings.keywords')}>
                    <p className="text-sm text-gray-500">{t('settings.keywordsDescription')}</p>
                    <ul className="list-disc pl-8 pt-2 text-sm">
                        <li>"{t('settings.keywordsList.help')}"</li>
                        <li>"{t('settings.keywordsList.sos')}", "{t('settings.keywordsList.sosSpelled')}"</li>
                        <li>"{t('settings.keywordsList.assistance')}"</li>
                        <li>"{t('settings.keywordsList.coffee')}"</li>
                        <li>"{t('settings.keywordsList.shop')}"</li>
                        <li>"{t('settings.keywordsList.work')}"</li>
                    </ul>
                </AccordionItem>

                <AccordionItem key="2" aria-label={t('settings.language')} title={t('settings.language')}>
                    <Select
                        className="max-w-xs"
                        label={t('settings.languagePlaceholder')}
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

                <AccordionItem key="3" aria-label={t('settings.privacyPolicy')} title={t('settings.privacyPolicy')}>
                    <p>
                        {t('settings.privacyPolicyContent')}
                    </p>
                </AccordionItem>
            </Accordion>
        </div>
    );

    return content;
}

export default SettingsPage;