import { GetFormStats } from "@/actions/form";
import React from "react";
import { CardsStats } from "./CardsStats";

export const CardStatsWrapper = async () => {
  const stats = await GetFormStats();

  return <CardsStats isLoading={false} data={stats} />;
};
