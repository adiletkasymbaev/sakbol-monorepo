// @ts-nocheck
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../../api/store";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import Navbar from "../../../shared/components/Navbar";
import { Accordion, AccordionItem, Button, Input } from "@heroui/react";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { useState } from "react";
import { useGetKeywordsQuery, useAddKeywordMutation, useDeleteKeywordMutation } from "../../../features/sos/keywordsApiSlice";
import IconDelete from "../../../shared/icons/IconDelete";

function SosSettingsPage() {
    const { data: keywords, isLoading } = useGetKeywordsQuery();
    const [addKeyword, {isLoading: isAdding}] = useAddKeywordMutation();
    const [deleteKeyword, {isLoading: isDeleting}] = useDeleteKeywordMutation();
    const [newWord, setNewWord] = useState("");

    const handleAdd = async () => {
        if (!newWord) return;
        await addKeyword({ word: newWord }).unwrap();
        setNewWord("");
    };

    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                Настройки
            </Heading>
            <Margin direction="b" value={2.5}/>

            <Accordion variant="shadow">
                <AccordionItem key="1" aria-label="Ключевые слова" title="Ключевые слова">
                    <div className="flex gap-2">
                        <Input
                            value={newWord} 
                            onValueChange={(e) => setNewWord(e)}
                            placeholder="Ключевое слово"
                            isDisabled={isAdding || isDeleting}
                        />
                        <Button
                            isIconOnly
                            color="secondary"
                            type="submit"
                            isDisabled={isAdding || isDeleting}
                            onClick={handleAdd}
                        >
                            <span className="text-2xl mb-[5px]">+</span>
                        </Button>
                    </div>

                    <RenderWithSpinner wrapperHeight={50} isLoading={false} isEmpty={keywords?.count === 0} emptyText="Нет ключевых слов">
                        <ul className="p-1 pt-4 flex flex-col gap-1">
                            {keywords?.results?.map((k) => (
                                <li key={k.id} className="flex justify-between bg-primary-100 items-center p-2 px-3 rounded-md">
                                    {k.word}{" "}
                                    <Button isIconOnly size="sm" color="primary" onClick={() => deleteKeyword(k.id)}>
                                        <IconDelete className="text-white"/>
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    </RenderWithSpinner>
                </AccordionItem>
            </Accordion>

            <Navbar/>
        </div>
    );

    return content;
}

export default SosSettingsPage;