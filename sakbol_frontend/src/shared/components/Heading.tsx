import type React from "react";

interface ComponentProps {
    children: React.ReactNode;
    variant?: "default" | "card";
}

function Heading({ children, variant = "default" }: ComponentProps) {
    const variantDefaultJsx = (
        <h1 className="text-white font-bold text-2xl">
            {children}
        </h1>
    );

    const variantCardJsx = (
        <h1 className="text-lg text-black font-bold">
            {children}
        </h1>
    )

    switch (variant) {
        case "card":
            return variantCardJsx;
        case "default":
        default:
            return variantDefaultJsx;
    }
}

export default Heading;