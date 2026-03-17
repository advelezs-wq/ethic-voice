import React, { ReactNode } from "react";

const FormBuilderLayout = ({ children }: { children: ReactNode }) => {
  return <div className="flex w-full h-full flex-grow mx-auto">{children}</div>;
};

export default FormBuilderLayout;
