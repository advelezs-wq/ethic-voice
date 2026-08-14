import { CreateFormBtn } from "@/modules/forms/components/CreateFormBtn";
import { FormCards } from "@/modules/forms/components/FormCards";
import { FormCardSkeleton } from "@/modules/forms/components/FormCardSkeleton";
import { CardsStats } from "@/modules/forms/components/forms-stats/CardsStats";
import { CardStatsWrapper } from "@/modules/forms/components/forms-stats/CardStatsWrapper";
import { PageHero } from "@/modules/app/components/ui";
import React, { Suspense } from "react";

const YourFormsPage = () => {
  return (
    <section className="space-y-6">
      <PageHero
        kicker="Formularios"
        title="Tus formularios"
        description="Crea y administra los formularios de tu canal de denuncias."
      />
      <Suspense fallback={<CardsStats isLoading={true} />}>
        <CardStatsWrapper />
      </Suspense>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <CreateFormBtn />
        <Suspense
          fallback={[1, 2, 3, 4].map((el) => (
            <FormCardSkeleton key={el} />
          ))}
        >
          <FormCards />
        </Suspense>
      </div>
    </section>
  );
};

export default YourFormsPage;
