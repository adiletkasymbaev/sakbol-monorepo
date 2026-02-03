import type { ReactNode } from "react";

interface ComponentProps {
    to: "top" | "bottom";
    children: ReactNode;
}

function PinElement({ to, children }: ComponentProps) {
    const content = (
        <div className={`absolute ${to}-0 left-0 w-full`}>
            {children}
        </div>
    );

    return content;
}

export default PinElement;