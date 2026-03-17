import { CreateFormBtn } from "@/modules/forms/components/CreateFormBtn";
import { FormCards } from "@/modules/forms/components/FormCards";
import { FormCardSkeleton } from "@/modules/forms/components/FormCardSkeleton";
import { CardsStats } from "@/modules/forms/components/forms-stats/CardsStats";
import { CardStatsWrapper } from "@/modules/forms/components/forms-stats/CardStatsWrapper";
import React, { Suspense } from "react";

const YourFormsPage = () => {
  return (
    <section className="">
      <Suspense fallback={<CardsStats isLoading={true} />}>
        <CardStatsWrapper />
      </Suspense>
      <div className="my-6" />
      <h2 className="text-4xl font-bold col-span-2">Your forms</h2>
      <div className="my-6" />
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
