import { Spinner } from "@heroui/react";

function MapSpinner() {
    const content = (
        <div className="absolute top-0 left-0 w-full h-screen z-[10000] flex justify-center items-center bg-black/40 backdrop-blur-sm">
            <Spinner size="lg" color="default" />
        </div>
    );

    return content;
}

export default MapSpinner;