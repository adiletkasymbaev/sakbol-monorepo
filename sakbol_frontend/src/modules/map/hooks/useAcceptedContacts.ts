import { useEffect, useState } from "react";
import { contactsService } from "../../../shared/services/contactsService";
import type { Contact } from "../../../shared/types/contacts";
import useAuth from "../../../store/useAuth";

export interface ContactOption {
  userId: number;
  label: string;
  avatar?: string;
}

function getUserIdFromToken(token: string): number | null {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const parsed = Number(payload?.user_id);
    return isNaN(parsed) ? null : parsed;
  } catch {
    return null;
  }
}

function resolveLabel(contact: Contact, currentUserId: number): ContactOption {
  const isFromMe = contact.from_user.id === currentUserId;
  const profile = isFromMe ? contact.to_profile : contact.from_profile;
  const user    = isFromMe ? contact.to_user    : contact.from_user;

  const first = profile?.first_name?.trim();
  const last  = profile?.last_name?.trim();
  const label = first && last ? `${first} ${last}` : (first ?? user.email);

  return {
    userId: user.id,
    label,
    avatar: profile?.avatar ?? undefined,
  };
}

export function useAcceptedContacts(currentUserId: number | null) {
  const [options, setOptions] = useState<ContactOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const tokenAccess = useAuth((s) => s.tokenAccess);
  const resolvedId  = currentUserId ?? getUserIdFromToken(tokenAccess);

  useEffect(() => {
    setLoading(true);
    contactsService
      .getContactsAccepted()
      .then((res) => {
        const raw: Contact[] = Array.isArray(res.data)
          ? res.data
          : res.data?.results ?? [];

        const id = resolvedId ?? 0;
        setOptions(raw.map((c) => resolveLabel(c, id)));
      })
      .catch(() => setError("Не удалось загрузить контакты"))
      .finally(() => setLoading(false));
  }, [resolvedId]); // ✅ re-runs when id becomes available

  return { options, loading, error };
}