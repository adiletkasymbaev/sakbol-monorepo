import { useState } from "react";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Input, addToast, InputOtp } from "@heroui/react";
import { profileService } from "../../../shared/services/profileService";
import { ToastTypes } from "../../../shared/enums/ToastTypes";
import { parseApiErrorToArray } from "../../../shared/utils/parseApiErrorToArray";
import CustomOtpField from "../../../shared/components/CustomOtpField";

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [password, setPassword] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRequest = async () => {
        if (password.length < 8) return;
        setIsLoading(true);
        try {
            await profileService.reqPasswordChange(password);
            setStep(2);
            addToast({ title: ToastTypes.OK, description: "Код отправлен на почту", color: "success" });
        } catch (error) {
            parseApiErrorToArray(error).forEach(m => addToast({ title: ToastTypes.ERR, description: m, color: "danger" }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) return;
        setIsLoading(true);
        try {
            await profileService.verifyPasswordChange(code);
            addToast({ title: ToastTypes.OK, description: "Пароль успешно изменен", color: "success" });
            onClose();
            // reset state
            setStep(1); setPassword(""); setCode("");
        } catch (error) {
            parseApiErrorToArray(error).forEach(m => addToast({ title: ToastTypes.ERR, description: m, color: "danger" }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center">
            <ModalContent>
                <ModalHeader>Смена пароля</ModalHeader>
                <ModalBody>
                    {step === 1 ? (
                        <>
                            <p className="text-sm text-default-500">Введите новый пароль. Мы отправим код подтверждения на вашу текущую почту.</p>
                            <Input 
                                type="password" 
                                label="Новый пароль" 
                                placeholder="Минимум 8 символов" 
                                value={password} 
                                onValueChange={setPassword} 
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 w-full">
                            <p className="text-sm text-center">Введите 6-значный код из письма</p>
                            <InputOtp 
                                value={code}
                                onValueChange={setCode}
                                length={6}
                                size="lg"
                                classNames={{ input: "text-center tracking-widest text-lg font-bold uppercase" }}
                            />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>Отмена</Button>
                    {step === 1 ? (
                        <Button color="primary" isLoading={isLoading} onPress={handleRequest} isDisabled={password.length < 8}>Отправить код</Button>
                    ) : (
                        <Button color="primary" isLoading={isLoading} onPress={handleVerify} isDisabled={code.length < 6}>Подтвердить</Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}

interface ChangeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (newEmail: string) => void;
}

export function ChangeEmailModal({ isOpen, onClose, onSuccess }: ChangeEmailModalProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleRequest = async () => {
        if (!email.includes("@")) return;
        setIsLoading(true);
        try {
            await profileService.reqEmailChange(email);
            setStep(2);
            addToast({ title: ToastTypes.OK, description: "Код отправлен на новую почту", color: "success" });
        } catch (error) {
            parseApiErrorToArray(error).forEach(m => addToast({ title: ToastTypes.ERR, description: m, color: "danger" }));
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerify = async () => {
        if (code.length < 6) return;
        setIsLoading(true);
        try {
            const res = await profileService.verifyEmailChange(code);
            addToast({ title: ToastTypes.OK, description: "Почта успешно изменена", color: "success" });
            onSuccess(res.data.new_email || email);
            onClose();
            // reset state
            setStep(1); setEmail(""); setCode("");
        } catch (error) {
            parseApiErrorToArray(error).forEach(m => addToast({ title: ToastTypes.ERR, description: m, color: "danger" }));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} placement="center">
            <ModalContent>
                <ModalHeader>Смена почты</ModalHeader>
                <ModalBody>
                    {step === 1 ? (
                        <>
                            <p className="text-sm text-default-500">Введите новый email-адрес. На него будет отправлен код подтверждения.</p>
                            <Input 
                                type="email" 
                                label="Новый email" 
                                value={email} 
                                onValueChange={setEmail} 
                            />
                        </>
                    ) : (
                        <div className="flex flex-col items-center gap-3 w-full">
                            <p className="text-sm text-center">Введите 6-значный код с новой почты <b>{email}</b></p>
                            <InputOtp 
                                value={code}
                                onValueChange={setCode}
                                length={6}
                                size="lg"
                                classNames={{ input: "text-center tracking-widest text-lg font-bold uppercase" }}
                            />
                        </div>
                    )}
                </ModalBody>
                <ModalFooter>
                    <Button variant="flat" onPress={onClose}>Отмена</Button>
                    {step === 1 ? (
                        <Button color="primary" isLoading={isLoading} onPress={handleRequest} isDisabled={!email.includes("@")}>Отправить код</Button>
                    ) : (
                        <Button color="primary" isLoading={isLoading} onPress={handleVerify} isDisabled={code.length < 6}>Подтвердить</Button>
                    )}
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
}
