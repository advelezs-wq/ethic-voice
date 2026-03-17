import { Header } from "@/modules/landig-page/components/layout/Header";
import React from "react";

const SubmitLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default SubmitLayout;
