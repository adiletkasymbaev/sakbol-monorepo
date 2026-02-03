import { Spinner } from "@heroui/react";
import type React from "react";

interface ComponentProps {
    isLoading: boolean;
    isEmpty?: boolean;
    children: React.ReactNode;
    wrapperHeight?: number;
    emptyText?: string;
}

function RenderWithSpinner({ isLoading, isEmpty = false, emptyText, children, wrapperHeight = 100 }: ComponentProps) {
    const loadingJsx = (
        <div className="w-full h-full flex justify-center items-center" style={{ minHeight: wrapperHeight + "px" }}>
            <Spinner size="md" color="primary"/>
        </div>
    );

    const emptyJsx = (
        <div className="w-full h-full flex justify-center items-center" style={{ minHeight: wrapperHeight + "px" }}>
            <p className="text-sm text-gray-400">{emptyText}</p>
        </div>
    )

    if (isLoading) return loadingJsx
    else if (isEmpty) return emptyJsx
    else return children
}

export default RenderWithSpinner;