import ConnectionStatusBubble from "./ConnectionStatusBubble";

interface ComponentProps {
    isOnline: boolean;   
    lastOnline: string | null;
}

function ConnectionStatus({ isOnline, lastOnline = "0 минут" }: ComponentProps) {
    let statusText = "";

    if (isOnline) {
        statusText = "В сети";
    } else if (lastOnline === null || lastOnline.toLowerCase() === "никогда") {
        statusText = "Никогда";
    } else if (lastOnline.toLowerCase() === "только что") {
        statusText = "Только что";
    } else {
        statusText = `Был в сети ${lastOnline} назад`;
    }

    return (
        <div className="flex items-center gap-1.5">
            <ConnectionStatusBubble isOnline={isOnline}/>
            <p className={`${isOnline ? "text-green-600" : "text-gray-600"} text-xs`}>
                {statusText}
            </p>
        </div>
    );
}

export default ConnectionStatus;