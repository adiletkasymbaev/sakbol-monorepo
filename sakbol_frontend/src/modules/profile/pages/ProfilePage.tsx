import { useEffect, useMemo, useState } from "react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { profileService } from "../../../shared/services/profileService";
import { addToast, Avatar, Button, Chip, Divider, Card, CardHeader, CardBody } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../shared/utils/parseApiErrorToArray";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import NullableCell from "../../../shared/components/NullableCell";
import useAuth from "../../../store/useAuth";
import { getRoleRepr } from "../../../shared/utils/getRoleRepr";
import { capitalizeFirstLetter } from "../../../shared/utils/capitalizeFirstLetter";

type ProfileUser = {
  avatar: string | null;
  first_name?: string;
  last_name?: string;
  identifier?: string;
  role?: string;
  birth_date?: string | null;
  med_info?: string | null;
  user_email?: string | null;
  phone_number?: string | null;
  city?: string | null;
  street?: string | null;
  house_number?: string | null;
  apartment_number?: string | null;
};

function ProfilePage() {
  const [user, setUser] = useState<ProfileUser>({} as ProfileUser);
  const [isLoading, setLoading] = useState(true);
  const logout = useAuth((state) => state.logout);

  const {
    setUserId,
    setUserRole
  } = useAuth();

  const fullName = useMemo(() => {
    const fn = user?.first_name ?? "";
    const ln = user?.last_name ?? "";
    return `${fn} ${ln}`.trim();
  }, [user?.first_name, user?.last_name]);

  async function fetchUser() {
    try {
      setLoading(true);
      const response = await profileService.getMe();
      setUser(response?.data);
      setUserId(response?.data?.id)
      setUserRole(response?.data?.role)
    } catch (error) {
      const messages = parseApiErrorToArray(error);
      messages.forEach((message) =>
        addToast({
          title: ToastTypes.ERR,
          description: message,
          color: "danger",
        })
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const content = (
    <div className="page-wrapper">
      <div className="flex items-center justify-between gap-3">
        <Heading variant="card">Профиль</Heading>

        <Button color="danger" variant="flat" onPress={logout}>
          Выйти
        </Button>
      </div>

      <Margin direction="b" value={2.5} />
      <NavBar />
      <Margin direction="t" value={4} />

      <RenderWithSpinner wrapperHeight={220} isLoading={isLoading}>
        <div className="grid gap-3">
          <Card shadow="sm" className="bg-content1">
            <CardHeader className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {user?.avatar === null || !user?.avatar ? (
                  <Avatar size="lg" name={user?.first_name} />
                ) : (
                  <Avatar size="lg" src={user?.avatar} />
                )}

                <div className="flex flex-col">
                  <p className="text-base font-semibold">{fullName || "Без имени"}</p>
                  <p className="text-sm text-default-500">
                    ID: <NullableCell value={user?.identifier} />, Роль: "{capitalizeFirstLetter(user?.role)}"
                  </p>
                </div>
              </div>
            </CardHeader>

            <Divider />

            <CardBody className="gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-primary-50 p-3">
                  <p className="text-sm font-semibold">Контакты</p>
                  <Divider className="my-2" />
                  <p className="text-sm">
                    Электронная почта: <NullableCell value={user?.user_email} />
                  </p>
                  <p className="text-sm">
                    Номер телефона: <NullableCell value={user?.phone_number} />
                  </p>
                </div>

                <div className="rounded-xl bg-primary-50 p-3">
                  <p className="text-sm font-semibold">Личная информация</p>
                  <Divider className="my-2" />
                  <p className="text-sm">
                    Дата рождения: <NullableCell value={user?.birth_date} />
                  </p>

                  {user?.med_info ? (
                    <p className="text-sm">
                      Медицинская информация: <NullableCell value={user?.med_info} />
                    </p>
                  ) : null}
                </div>

                <div className="rounded-xl bg-primary-50 p-3 md:col-span-2">
                  <p className="text-sm font-semibold">Адрес</p>
                  <Divider className="my-2" />

                  <div className="grid gap-2 md:grid-cols-3">
                    <p className="text-sm">
                      Город: <NullableCell value={user?.city} />
                    </p>
                    <p className="text-sm md:col-span-2">
                      Улица:{" "}
                      <NullableCell value={`${user?.street ?? ""} ${user?.house_number ?? ""}`.trim()} />
                    </p>

                    {user?.apartment_number ? (
                      <p className="text-sm">
                        Квартира: <NullableCell value={user?.apartment_number} />
                      </p>
                    ) : (
                      <p className="text-sm">
                        Квартира: <NullableCell value={null} />
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button color="primary" variant="solid" onPress={fetchUser}>
                  Обновить
                </Button>
                <Button color="secondary" variant="solid" isDisabled>
                  Редактировать (скоро)
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </RenderWithSpinner>

      <div className="pb-14" />
    </div>
  );

  return content;
}

export default ProfilePage;