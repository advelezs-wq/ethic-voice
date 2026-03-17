import { GetFormStats } from "@/actions/form";
import React from "react";
import { CardStats } from "./CardStats";

interface CardsStatsProps {
  data?: Awaited<ReturnType<typeof GetFormStats>>;
  isLoading: boolean;
}

export const CardsStats = (props: CardsStatsProps) => {
  return (
    <div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <CardStats
        title="Total visits"
        icon={
          <i
            className="icon-[lets-icons--view] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="All time form visits"
        value={props.data?.visits.toLocaleString() || ""}
        isLoading={props.isLoading}
        className="shadow-md"
      />
      <CardStats
        title="Total submissions"
        icon={
          <i
            className="icon-[humbleicons--upload] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="All time form submissions"
        value={props.data?.submissions.toLocaleString() || ""}
        isLoading={props.isLoading}
        className="shadow-md "
      />
      <CardStats
        title="Submission rate"
        icon={
          <i
            className="icon-[mdi--cursor-default-click-outline] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Visits that result in form submissions"
        value={props.data?.submissionRate.toLocaleString() + "%" || ""}
        isLoading={props.isLoading}
        className="shadow-md "
      />
      <CardStats
        title="Bounce rate"
        icon={
          <i
            className="icon-[tabler--bounce-right] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Visits that leaves without interacting"
        value={props.data?.bounceRate.toLocaleString() + "%" || ""}
        isLoading={props.isLoading}
        className="shadow-md "
      />
    </div>
  );
};
