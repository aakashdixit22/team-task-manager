"use client";

import { useAuth } from "@/context/AuthContext";
import { useCallback } from "react";

export function useApi() {
  const { token, logout } = useAuth();

  const apiFetch = useCallback(
    async (url, options = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, { ...options, headers });

      if (res.status === 401) {
        logout();
        throw new Error("Session expired. Please login again.");
      }

      return res;
    },
    [token, logout]
  );

  return { apiFetch };
}
