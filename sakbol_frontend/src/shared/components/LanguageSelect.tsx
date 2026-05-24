import { Select, SelectItem } from "@heroui/react";
import { useTranslation } from "react-i18next";

export default function LanguageSelect() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language || i18n.resolvedLanguage || "ru";

    return (
        <div className="flex justify-center w-full mt-6 pb-6 relative z-50">
            <Select
                size="sm"
                className="w-[120px]"
                defaultSelectedKeys={["ru"]}
                selectedKeys={[currentLang]}
                onChange={(e) => i18n.changeLanguage(e.target.value)}
                disallowEmptySelection
                aria-label="Language selection"
            >
                <SelectItem key="ru">Русский</SelectItem>
                <SelectItem key="en">English</SelectItem>
                <SelectItem key="kg">Кыргызча</SelectItem>
            </Select>
        </div>
    );
}
