interface ComponentProps {
    isOnline: boolean;    
    className?: string;
}

function ConnectionStatusBubble({ isOnline = false, className }: ComponentProps) {
    const content = (
        <div className={`size-2 border-2 ${isOnline ? "bg-green-300 border-green-600" : "bg-gray-300 border-gray-600"} rounded-full ${className}`}></div>
    );

    return content;
}

export default ConnectionStatusBubble;