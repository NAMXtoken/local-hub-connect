import { useEffect, useState } from "react";

const STORAGE_KEY = "samui-connect-anon-user-id";

const createId = () => {
  if (typeof window === "undefined") return null;
  let current = localStorage.getItem(STORAGE_KEY);
  if (!current) {
    const fallback = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    current = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : fallback;
    localStorage.setItem(STORAGE_KEY, current);
  }
  return current;
};

export const useAnonUserId = () => {
  const [userId, setUserId] = useState<string | null>(() => createId());

  useEffect(() => {
    if (!userId) {
      const next = createId();
      if (next) setUserId(next);
    }
  }, [userId]);

  return userId;
};
