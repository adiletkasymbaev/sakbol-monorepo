import { useEffect, useMemo, useState, useRef } from "react";
import Heading from "../../../shared/components/Heading";
import Margin from "../../../shared/components/Margin";
import NavBar from "../../../shared/components/NavBar";
import { profileService } from "../../../shared/services/profileService";
import { addToast, Avatar, Button, Divider, Card, CardHeader, CardBody, Input, Textarea, Autocomplete, AutocompleteItem, Select, SelectItem } from "@heroui/react";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../shared/utils/parseApiErrorToArray";
import RenderWithSpinner from "../../../shared/components/RenderWithSpinner";
import NullableCell from "../../../shared/components/NullableCell";
import { getRoleRepr, type UserRole } from "../../../shared/utils/getRoleRepr";
import useAuth from "../../../store/useAuth";
import { capitalizeFirstLetter } from "../../../shared/utils/capitalizeFirstLetter";
import { useTranslation } from "react-i18next";
import roles from "../../auth/utils/roles";
import { ChangePasswordModal, ChangeEmailModal } from "../components/SecurityModals";
import { Link } from "react-router-dom";
import UrlNames from "../../../shared/enums/UrlNames";
import { useNotifications } from "../../../store/useNotifications";
import { KYRGYZSTAN_CITIES } from "../../../shared/constants/kyrgyzstanCities";

type ProfileUser = {
  id?: number;
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

export default function ProfilePage() {
    const { t } = useTranslation();
    const [user, setUser] = useState<ProfileUser>({} as ProfileUser);
    const [isLoading, setLoading] = useState(true);
    
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState<Partial<ProfileUser>>({});
    
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isEmailModalOpen, setEmailModalOpen] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const logout = useAuth((state) => state.logout);
    const { setUserId, setUserRole, userId } = useAuth();
    const { unreadCount } = useNotifications();

  const fullName = useMemo(() => {
    const fn = user?.first_name ?? "";
    const ln = user?.last_name ?? "";
    return `${fn} ${ln}`.trim();
  }, [user?.first_name, user?.last_name]);

  const formatDate = (date: string | null | undefined) => {
    if (!date) return null;
    const parts = date.split('-');
    if (parts.length !== 3) return date;
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  };

  async function fetchUser() {
    try {
      setLoading(true);
      const response = await profileService.getMe();
      setUser(response?.data as ProfileUser);
      setEditData(response?.data as ProfileUser);
      setUserId(response?.data?.id || userId);
      setUserRole(response?.data?.role!);
    } catch (error) {
      parseApiErrorToArray(error).forEach((message) =>
        addToast({ title: ToastTypes.ERR, description: message, color: "danger" })
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUser();
  }, []);

  const handleEditToggle = () => {
    if (isEditing) {
      setEditData(user); // revert changes
    }
    setIsEditing(!isEditing);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        first_name: editData.first_name,
        last_name: editData.last_name,
        birth_date: editData.birth_date,
        city: editData.city,
        street: editData.street,
        house_number: editData.house_number,
        apartment_number: editData.apartment_number,
        med_info: editData.med_info,
        phone_number: editData.phone_number,
        role: editData.role,
      };
      
      const response = await profileService.updateMe(payload);
      setUser(response.data as ProfileUser);
      setEditData(response.data as ProfileUser);
      setUserRole(response.data.role);
      setIsEditing(false);
      addToast({ title: ToastTypes.OK, description: "Профиль успешно обновлен", color: "success" });
    } catch (error) {
      parseApiErrorToArray(error).forEach((message) =>
        addToast({ title: ToastTypes.ERR, description: message, color: "danger" })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    
    setLoading(true);
    try {
        const res = await profileService.updateAvatar({ user_id: userId, avatar: file });
        setUser(res.data as ProfileUser);
        addToast({ title: ToastTypes.OK, description: "Аватар обновлен", color: "success" });
    } catch (error) {
        parseApiErrorToArray(error).forEach(m => addToast({ title: ToastTypes.ERR, description: m, color: "danger" }));
    } finally {
        setLoading(false);
    }
  };

  const c = (f: keyof ProfileUser) => (val: string) => setEditData({...editData, [f]: val});

  return (
    <div className="page-wrapper">
      <div className="flex items-center justify-between gap-3">
        <Heading variant="card">{t('profile.title')}</Heading>

        <div className="flex gap-2">
            {isEditing ? (
                <>
                    <Button color="default" variant="flat" onPress={handleEditToggle}>
                        {t('common.cancel')}
                    </Button>
                    <Button color="primary" onPress={handleSave}>
                        {t('common.save')}
                    </Button>
                </>
            ) : (
                <>
                    <Button color="primary" onPress={handleEditToggle}>
                        {t('common.edit')}
                    </Button>
                    <Button color="danger" variant="flat" onPress={logout}>
                        {t('profile.logout')}
                    </Button>
                </>
            )}
        </div>
      </div>

      <Margin direction="b" value={2.5} />

      <Link to={"/" + UrlNames.SOS_NOTIFICATIONS}>
        <Card shadow="sm" className="bg-primary-50 cursor-pointer border-none">
          <CardBody className="flex flex-row items-center justify-between px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔔</span>
              <div>
                <p className="text-sm font-semibold">{t('notifications.title')}</p>
                <p className="text-xs text-default-500">
                  {unreadCount > 0
                    ? `${unreadCount} ${t('notifications.unread')}`
                    : t('notifications.noNew')}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <div className="w-5 h-5 rounded-full bg-primary text-white text-[10px] flex items-center justify-center font-bold">
                {unreadCount}
              </div>
            )}
          </CardBody>
        </Card>
      </Link>

      <NavBar />
      <Margin direction="t" value={4} />

      <RenderWithSpinner wrapperHeight={220} isLoading={isLoading}>
        <div className="grid gap-3 pb-20">
          <Card shadow="sm" className="bg-content1 border-none">
            <CardHeader className="flex items-center justify-between gap-3 relative">
              <div className="flex items-center gap-3">
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarChange} />
                <div 
                    className={`relative cursor-pointer hover:opacity-80 transition-opacity ${isEditing ? "ring-2 ring-primary p-0.5 rounded-full" : ""}`}
                    onClick={() => isEditing && fileInputRef.current?.click()}
                >
                    {user?.avatar === null || !user?.avatar ? (
                      <Avatar size="lg" name={user?.first_name} />
                    ) : (
                      <Avatar size="lg" src={user?.avatar} />
                    )}
                    {isEditing && (
                        <div className="absolute inset-0 bg-black/40 rounded-full flex justify-center items-center">
                            <span className="text-white text-xs">📷</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-col">
                  {isEditing ? (
                      <div className="flex gap-2">
                          <Input size="sm" placeholder={t('auth.form.firstName')} value={editData.first_name || ""} onValueChange={c("first_name")} />
                          <Input size="sm" placeholder={t('auth.form.lastName')} value={editData.last_name || ""} onValueChange={c("last_name")} />
                      </div>
                  ) : (
                    <p className="text-base font-semibold">{fullName || t('profile.noName')}</p>
                  )}
                  <p className="text-sm text-default-500 mt-1">
                    {t('profile.id')}: <NullableCell value={user?.identifier} />, {t('profile.role')}: {getRoleRepr(user?.role as UserRole)}
                  </p>
                </div>
              </div>
            </CardHeader>

            <Divider />

            <CardBody className="gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl bg-primary-50 p-3">
                  <p className="text-sm font-semibold">{t('profile.contacts')}</p>
                  <Divider className="my-2" />
                  <div className="grid gap-2">
                      {isEditing ? (
                          <>
                              <div className="flex items-center gap-2">
                                  <span className="text-sm">Email:</span>
                                  <Button size="sm" color="primary" variant="flat" onPress={() => setEmailModalOpen(true)}>{t('profile.changeEmail', 'Сменить Email')}</Button>
                              </div>
                              <Input size="sm" label={t('profile.phone')} value={editData.phone_number || ""} onValueChange={c("phone_number")} />
                          </>
                      ) : (
                          <>
                              <p className="text-sm">
                                {t('profile.email')}: <NullableCell value={user?.user_email} />
                              </p>
                              <p className="text-sm">
                                {t('profile.phone')}: <NullableCell value={user?.phone_number} />
                              </p>
                          </>
                      )}
                  </div>
                </div>

                <div className="rounded-xl bg-primary-50 p-3">
                  <p className="text-sm font-semibold">{t('profile.personalInfo')}</p>
                  <Divider className="my-2" />
                  {isEditing ? (
                      <div className="grid gap-2">
                          <Select
                              size="sm"
                              label={t('profile.role')}
                              selectedKeys={editData.role ? [editData.role] : []}
                              onSelectionChange={(keys) => {
                                  const val = Array.from(keys)[0] as string;
                                  if (val) c("role")(val);
                              }}
                              disallowEmptySelection
                          >
                              {roles.map((r) => (
                                  <SelectItem key={r.key}>{r.title}</SelectItem>
                              ))}
                          </Select>
                          <Input size="sm" type="date" label={t('profile.birthDate')} value={editData.birth_date || ""} onValueChange={c("birth_date")} />
                          <Textarea size="sm" label={t('profile.medicalInfo')} value={editData.med_info || ""} onValueChange={c("med_info")} />
                      </div>
                  ) : (
                      <div className="grid gap-2">
                          <p className="text-sm">
                            {t('profile.role')}: {getRoleRepr(user?.role as UserRole)}
                          </p>
                          <p className="text-sm">
                            {t('profile.birthDate')}: <NullableCell value={formatDate(user?.birth_date)} />
                          </p>
                          {user?.med_info ? (
                            <p className="text-sm">
                              {t('profile.medicalInfo')}: <NullableCell value={user?.med_info} />
                            </p>
                          ) : null}
                      </div>
                  )}
                </div>

                <div className="rounded-xl bg-primary-50 p-3 md:col-span-2">
                  <p className="text-sm font-semibold">{t('profile.address')}</p>
                  <Divider className="my-2" />

                  {isEditing ? (
                      <div className="grid gap-2 md:grid-cols-4">
                          <Autocomplete
                              size="sm"
                              label={t('profile.city')}
                              allowsCustomValue
                              inputValue={editData.city || ""}
                              onInputChange={c("city")}
                              onSelectionChange={(key) => {
                                  if (key) c("city")(key as string);
                              }}
                              defaultItems={KYRGYZSTAN_CITIES.map(c => ({ label: c, value: c }))}
                          >
                              {(item) => <AutocompleteItem key={item.value}>{item.label}</AutocompleteItem>}
                          </Autocomplete>
                          <Input size="sm" label={t('profile.street')} value={editData.street || ""} onValueChange={c("street")} />
                          <Input size="sm" label={t('auth.form.houseNumber', 'Номер дома')} value={editData.house_number || ""} onValueChange={c("house_number")} />
                          <Input size="sm" label={t('profile.apartment')} value={editData.apartment_number || ""} onValueChange={c("apartment_number")} />
                      </div>
                  ) : (
                      <div className="grid gap-2 md:grid-cols-3">
                        <p className="text-sm">
                          {t('profile.city')}: <NullableCell value={user?.city} />
                        </p>
                        <p className="text-sm md:col-span-2">
                          {t('profile.street')}:{" "}
                          <NullableCell value={`${user?.street ?? ""} ${user?.house_number ?? ""}`.trim()} />
                        </p>

                        <p className="text-sm">
                          {t('profile.apartment')}: <NullableCell value={user?.apartment_number} />
                        </p>
                      </div>
                  )}
                </div>
              </div>
              
              {isEditing && (
                  <>
                      <Divider className="my-2" />
                      <div className="flex gap-3 justify-center mt-2">
                          <Button color="secondary" variant="flat" onPress={() => setPasswordModalOpen(true)}>
                              {t('profile.changePassword', 'Изменить пароль')}
                          </Button>
                      </div>
                  </>
              )}
            </CardBody>
          </Card>
        </div>
      </RenderWithSpinner>

      <ChangePasswordModal 
          isOpen={isPasswordModalOpen} 
          onClose={() => setPasswordModalOpen(false)} 
      />
      <ChangeEmailModal 
          isOpen={isEmailModalOpen} 
          onClose={() => setEmailModalOpen(false)} 
          onSuccess={(newMail) => {
              setUser({...user, user_email: newMail});
              setEditData({...editData, user_email: newMail});
          }}
      />
    </div>
  );
}