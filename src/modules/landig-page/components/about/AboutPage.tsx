"use client";

import Image from "next/image";
import { Button, ButtonLink, Container, Voice, reveal } from "@/modules/brand/components/primitives";
import { IndexList, PageHero, Section } from "@/modules/brand/components/sections";
import { useDemoCta } from "@/modules/brand/hooks/useDemoCta";

const FACTS = [
  { v: "2017", l: "Acompañando programas de integridad" },
  { v: "+10", l: "Años de experiencia en cumplimiento" },
  { v: "+30", l: "Contribuidores en el equipo" },
  { v: "+100", l: "Organizaciones confían en nosotros" },
] as const;

const VALUES = [
  { title: "Confidencialidad", body: "Protegemos la identidad y la información de quienes usan la plataforma con los más altos estándares de seguridad." },
  { title: "Integridad", body: "Actuamos con transparencia y honestidad en cada interacción y decisión." },
  { title: "Innovación", body: "Creamos nuevas soluciones para que el cumplimiento sea más eficiente y accesible." },
  { title: "Inclusión", body: "Todas las voces son escuchadas y valoradas, sin importar su origen o posición." },
  { title: "Excelencia", body: "Buscamos superar las expectativas en cada aspecto del servicio y del producto." },
  { title: "Impacto", body: "Trabajamos por un efecto positivo en organizaciones y comunidades de toda la región." },
] as const;

export function AboutPage() {
  const demo = useDemoCta();

  return (
    <>
      <PageHero
        kicker="Nosotros"
        title={[
          "Le damos voz a las personas.",
          <>
            Y estructura al <Voice>cumplimiento.</Voice>
          </>,
        ]}
        lead="Tecnología y consultoría para la integridad organizacional en Colombia y Latinoamérica."
        actions={
          <>
            <Button variant="signal" size="lg" arrow onClick={demo("about_hero", "about")}>
              Conversemos
            </Button>
            <ButtonLink href="/careers" variant="outline" size="lg">
              Trabaja con nosotros
            </ButtonLink>
          </>
        }
      />

      <section className="bg-ev-paper pb-20">
        <Container>
          <dl className="grid grid-cols-2 border-t border-ev-night lg:grid-cols-4">
            {FACTS.map((f, i) => (
              <div
                key={f.l}
                {...reveal(i * 90)}
                className="flex flex-col-reverse border-b border-ev-line py-8 pr-6 lg:border-b-0 lg:[&:not(:first-child)]:border-l lg:[&:not(:first-child)]:pl-8"
              >
                <dt className="mt-4 max-w-[12rem] text-[0.975rem] leading-snug text-ev-mute">{f.l}</dt>
                <dd className="ev-num text-[clamp(3.5rem,6vw,5.5rem)] font-semibold leading-[0.85] tracking-[-0.06em] text-ev-night">
                  {f.v}
                </dd>
              </div>
            ))}
          </dl>
        </Container>
      </section>

      <Section
        index="01"
        kicker="Quiénes somos"
        title={["Plataforma y consultoría", <>para la <Voice>integridad.</Voice></>]}
      >
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="space-y-6 text-[1.125rem] leading-relaxed tracking-[-0.01em] text-ev-ink lg:col-span-6 lg:col-start-4">
            <p {...reveal(0)}>
              EthicVoice es una plataforma de gestión de denuncias y cumplimiento
              normativo para crear canales éticos seguros, transparentes y
              eficientes. Las organizaciones gestionan, rastrean y resuelven
              denuncias de forma anónima, alineadas con estándares
              internacionales de compliance, prevención de lavado de activos,
              anticorrupción y protección de datos personales.
            </p>
            <p {...reveal(80)} className="text-ev-mute">
              Desde 2017, EthicVoice y Valor Estratégico Consultores acompañan a
              organizaciones a construir culturas de integridad. Nacimos para
              darle voz a las personas y simplificar el cumplimiento con
              tecnología segura, clara y efectiva.
            </p>
          </div>
        </div>
      </Section>

      <section className="ev-grain ev-grain-dark relative overflow-hidden bg-ev-night py-28 text-white sm:py-40">
        <Container>
          <p className="ev-label text-white/45">
            <span className="text-ev-signal">(02)</span> Nuestra misión
          </p>
          <p
            {...reveal(0)}
            className="mt-10 max-w-5xl text-[clamp(2rem,4.6vw,4.25rem)] font-medium leading-[1.04] tracking-[-0.045em]"
          >
            Empoderar a las organizaciones para crear culturas de integridad,
            haciendo que reportar sea{" "}
            <em className="ev-serif text-ev-signal">seguro, accesible y efectivo</em>{" "}
            para todos.
          </p>
        </Container>
      </section>

      <Section index="03" kicker="Principios" title={["Lo que guía", <>cada <Voice>decisión.</Voice></>]}>
        <IndexList items={VALUES} columns={3} />
      </Section>

      <Section surface="bone" index="04" kicker="Respaldo">
        <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <h2 {...reveal(0)} className="ev-h2 text-ev-night">
              Operada por <Voice>Valor Estratégico</Voice> Consultores.
            </h2>
            <p {...reveal(100)} className="ev-lead mt-6 max-w-xl">
              Una firma con más de 10 años de experiencia en cumplimiento
              normativo y gestión de riesgos. Detrás de la tecnología hay un
              equipo de expertos en investigación, gobernanza y ética empresarial.
            </p>
          </div>
          <div {...reveal(150)} className="flex items-center justify-center rounded-[1.5rem] bg-ev-paper p-12 lg:col-span-4 lg:col-start-9">
            <Image
              src="/ethic-brands/valor_estrategico.webp"
              alt="Valor Estratégico Consultores"
              width={240}
              height={80}
              className="h-auto w-48 object-contain"
            />
          </div>
        </div>
      </Section>
    </>
  );
}
