import { Header } from "@/modules/landig-page/components/layout/Header";
import React from "react";

const TrackLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <>
      <Header />
      {children}
    </>
  );
};

export default TrackLayout;
