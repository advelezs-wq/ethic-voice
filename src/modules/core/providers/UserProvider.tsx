"use client";

import { useEffect } from "react";
import { useUserStore } from "@/modules/store/user-store";
import { UserType } from "@/types/user";

interface Props {
  serverUser: UserType | null;
  serverToken: string;
  children: React.ReactNode;
}

export const UserProvider = ({ serverUser, children }: Props) => {
  const setUser = useUserStore((s) => s.setUser);
  //   const setToken = useSearchReportStore((s) => s.setToken);

  useEffect(() => {
    if (serverUser) {
      setUser(serverUser);
      //   setToken(serverToken);
    }
  }, [serverUser, setUser]);

  return <>{children}</>;
};
