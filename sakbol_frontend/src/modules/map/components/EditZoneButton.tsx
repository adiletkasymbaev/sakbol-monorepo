import { Button } from "@heroui/react";
import { IconEdit } from "../../../shared/icons/IconEdit";
import { useZonesStore } from "../hooks/useZonesStore";

function EditZoneButton() {
    const { isDrawable, setDrawable } = useZonesStore()

    const content = (
        <Button
            onPress={() => setDrawable(!isDrawable)}
            isIconOnly
            className="size-14 bg-primary rounded-full shadow-2xl"
        >
            <IconEdit className="text-secondary" />
        </Button>
    );

    return content;
}

export default EditZoneButton;