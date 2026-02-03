interface ComponentProps {
    mainText: string;
    secondaryText: string;
}

function Headline({ mainText, secondaryText }: ComponentProps) {
    const content = (
        <div className="flex flex-col">
            <span className="text-sm uppercase text-primary font-bold">
                {secondaryText}
            </span>
            <span className="text-xl text-black font-semibold">
                {mainText}
            </span>
        </div>
    );

    return content;
}

export default Headline;