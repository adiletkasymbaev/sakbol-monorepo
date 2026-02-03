// @ts-nocheck
import { useEffect } from "react";
import { useGetMeQuery } from "../../../features/sos/meApiSlice";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import Navbar from "../../../shared/components/Navbar";
import { Avatar } from "@heroui/react";
import ConnectionStatus from "../../../shared/components/ConnectionStatus";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import { useDispatch } from "react-redux";
import { logOut } from "../../../features/auth/authSlice";
import NullableCell from "../../../shared/components/NullableCell";

function SosProfilePage() {
    const { data: user, isLoading } = useGetMeQuery();

    const dispatch = useDispatch();

    const handleLogout = () => {
        dispatch(logOut());
        window.location.href = "/login";
    };


    const content = (
        <div className="page-wrapper">
            <Heading variant="card">
                Профиль
            </Heading>
            <Margin direction="b" value={2.5}/>

            <RenderWithSpinner wrapperHeight={50} isLoading={isLoading}>
                <div className="flex gap-3 flex-col">
                    <div className="p-2 flex gap-3 items-center bg-primary-100 rounded-lg">
                        {user?.avatar === null 
                            ? <Avatar size="md" name={user?.first_name} />
                            : <Avatar size="md" src={user?.avatar} />
                        }
                        <div>
                            <p className="font-semibold">
                                {user?.first_name} {user?.last_name}
                            </p>
                            <p className="text-red-500" onClick={handleLogout}>Выйти</p>
                            {/* <ConnectionStatus isOnline={!!user?.is_online} lastOnline={user?.last_seen_display || "никогда"} /> */}
                        </div>
                    </div>
                    <div className="p-3 flex flex-col gap-0.5 bg-primary-100 rounded-lg">
                        <p className="text-sm font-semibold">Электронная почта: <NullableCell value={user?.email} /></p>
                        <p className="text-sm font-semibold">Номер телефона: <NullableCell value={user?.phone_number} /></p>
                    </div>
                </div>
            </RenderWithSpinner>

            <Navbar/>
        </div>
    );

    return content;
}

export default SosProfilePage;