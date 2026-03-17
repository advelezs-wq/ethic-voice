import { Spinner } from "@heroui/react";
import React from "react";

const Loading = () => {
  return (
    <div className="flex items-center justify-center w-full h-full">
      <Spinner className="size-12" />
    </div>
  );
};

export default Loading;
