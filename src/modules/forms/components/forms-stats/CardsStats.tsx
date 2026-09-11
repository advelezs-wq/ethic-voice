import { GetFormStats } from "@/actions/form";
import React from "react";
import { CardStats } from "./CardStats";

interface CardsStatsProps {
  data?: Awaited<ReturnType<typeof GetFormStats>>;
  isLoading: boolean;
}

export const CardsStats = (props: CardsStatsProps) => {
  // Sin visitas todavía, "tasa de envío"/"tasa de rebote" en 0%/100% no
  // reflejan nada real — mostrar un guion en vez de un porcentaje engañoso.
  const hasVisits = (props.data?.visits ?? 0) > 0;
  const rateValue = (rate?: number) =>
    hasVisits ? `${rate?.toLocaleString() ?? 0}%` : "—";

  return (
    <div className="w-full pt-8 gap-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
      <CardStats
        title="Total de visitas"
        icon={
          <i
            className="icon-[lets-icons--view] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Visitas totales del formulario"
        value={props.data?.visits.toLocaleString() ?? ""}
        isLoading={props.isLoading}
        className="shadow-md"
      />
      <CardStats
        title="Total de envíos"
        icon={
          <i
            className="icon-[humbleicons--upload] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Denuncias enviadas por este formulario"
        value={props.data?.submissions.toLocaleString() ?? ""}
        isLoading={props.isLoading}
        className="shadow-md "
      />
      <CardStats
        title="Tasa de envío"
        icon={
          <i
            className="icon-[mdi--cursor-default-click-outline] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Visitas que terminaron en un envío"
        value={rateValue(props.data?.submissionRate)}
        isLoading={props.isLoading}
        className="shadow-md "
      />
      <CardStats
        title="Tasa de rebote"
        icon={
          <i
            className="icon-[tabler--bounce-right] size-5"
            role="img"
            aria-hidden="true"
          />
        }
        helperText="Visitas que se fueron sin interactuar"
        value={rateValue(props.data?.bounceRate)}
        isLoading={props.isLoading}
        className="shadow-md "
      />
    </div>
  );
};
