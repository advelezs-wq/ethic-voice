import type { Metadata } from "next";
import type { ReactNode } from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";
import { Container, Voice } from "@/modules/brand/components/primitives";
import { PageHero } from "@/modules/brand/components/sections";

export const metadata: Metadata = {
  title: "Política de Tratamiento de Datos Personales (Habeas Data) | EthicVoice",
  description:
    "Política de tratamiento de datos personales de EthicVoice conforme a la Ley 1581 de 2012 y el Decreto 1377 de 2013: finalidades, derechos de los titulares y procedimiento de consultas y reclamos.",
  alternates: { canonical: "/politica-habeas-data" },
};

const CONTACT_EMAIL = "info@ethicvoice.co";
const LAST_UPDATED = "7 de noviembre de 2026";

type Clause = { id: string; title: string; body: ReactNode };

const CLAUSES: Clause[] = [
  {
    id: "responsable",
    title: "Responsable del tratamiento",
    body: (
      <>
        <p>
          EthicVoice (en adelante, “EthicVoice”) es responsable del tratamiento de los datos
          personales que recolecta directamente para la prestación de sus servicios.
        </p>
        <ul>
          <li>Domicilio: Bogotá D.C., Colombia.</li>
          <li>
            Correo electrónico:{" "}
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          </li>
          <li>Teléfono: +57 322 414 5120</li>
          <li>Sitio web: ethicvoice.co</li>
        </ul>
      </>
    ),
  },
  {
    id: "marco-legal",
    title: "Marco legal",
    body: (
      <p>
        Esta política se expide en cumplimiento del artículo 15 de la Constitución Política de
        Colombia, la Ley Estatutaria 1581 de 2012, el Decreto 1377 de 2013 (compilado en el
        Decreto Único Reglamentario 1074 de 2015) y las demás normas que los modifiquen,
        adicionen o complementen.
      </p>
    ),
  },
  {
    id: "definiciones",
    title: "Definiciones",
    body: (
      <ul>
        <li>
          <strong>Autorización:</strong> consentimiento previo, expreso e informado del titular
          para llevar a cabo el tratamiento de sus datos personales.
        </li>
        <li>
          <strong>Dato personal:</strong> cualquier información vinculada o que pueda asociarse a
          una o varias personas naturales determinadas o determinables.
        </li>
        <li>
          <strong>Dato sensible:</strong> aquel que afecta la intimidad del titular o cuyo uso
          indebido puede generar su discriminación.
        </li>
        <li>
          <strong>Encargado del tratamiento:</strong> persona que realiza el tratamiento de datos
          personales por cuenta del responsable.
        </li>
        <li>
          <strong>Responsable del tratamiento:</strong> persona que decide sobre la base de datos
          y/o el tratamiento de los datos.
        </li>
        <li>
          <strong>Titular:</strong> persona natural cuyos datos personales son objeto de
          tratamiento.
        </li>
        <li>
          <strong>Tratamiento:</strong> cualquier operación sobre datos personales, como la
          recolección, almacenamiento, uso, circulación o supresión.
        </li>
      </ul>
    ),
  },
  {
    id: "principios",
    title: "Principios",
    body: (
      <p>
        EthicVoice aplica los principios de legalidad, finalidad, libertad, veracidad o calidad,
        transparencia, acceso y circulación restringida, seguridad y confidencialidad previstos en
        el artículo 4 de la Ley 1581 de 2012.
      </p>
    ),
  },
  {
    id: "finalidades",
    title: "Datos que tratamos y finalidades",
    body: (
      <>
        <p>EthicVoice trata datos personales con las siguientes finalidades:</p>
        <ul>
          <li>
            <strong>Clientes y usuarios de la plataforma:</strong> crear y administrar cuentas,
            prestar los servicios contratados, gestionar la facturación y los pagos, brindar
            soporte, enviar notificaciones operativas y de seguridad, y cumplir obligaciones
            legales y contractuales.
          </li>
          <li>
            <strong>Prospectos y visitantes del sitio:</strong> atender solicitudes de
            información y demostraciones, enviar comunicaciones comerciales cuando el titular lo
            haya autorizado y medir el uso del sitio conforme a la política de cookies.
          </li>
          <li>
            <strong>Proveedores y aliados:</strong> gestionar la relación contractual, pagos y
            obligaciones tributarias.
          </li>
          <li>
            <strong>Candidatos:</strong> adelantar procesos de selección.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "canales-de-denuncia",
    title: "Datos de los canales de denuncia",
    body: (
      <>
        <p>
          Respecto de la información recibida a través de los canales de denuncia que las
          organizaciones clientes configuran en la plataforma, cada organización actúa como
          responsable del tratamiento y EthicVoice como encargado, tratando los datos únicamente
          por cuenta y según las instrucciones de la organización.
        </p>
        <p>
          Los reportes pueden presentarse de forma anónima. Cuando el denunciante decide
          identificarse, sus datos se usan para gestionar el reporte, comunicarse con él y dar
          seguimiento al caso, con acceso restringido a los usuarios autorizados por la
          organización. Las solicitudes sobre estos datos pueden dirigirse a la organización
          correspondiente o a EthicVoice, que las trasladará a la organización.
        </p>
      </>
    ),
  },
  {
    id: "datos-sensibles",
    title: "Datos sensibles y de menores de edad",
    body: (
      <p>
        El titular no está obligado a autorizar el tratamiento de datos sensibles ni a responder
        preguntas sobre ellos. Cuando un reporte contenga datos sensibles, estos se tratan con
        medidas reforzadas de seguridad y confidencialidad y solo para la finalidad del caso. El
        tratamiento de datos de niños, niñas y adolescentes se limita a lo permitido por la ley,
        respetando su interés superior y sus derechos fundamentales.
      </p>
    ),
  },
  {
    id: "derechos",
    title: "Derechos de los titulares",
    body: (
      <>
        <p>Como titular de datos personales, usted tiene derecho a:</p>
        <ul>
          <li>Conocer, actualizar y rectificar sus datos personales.</li>
          <li>Solicitar prueba de la autorización otorgada, salvo cuando no sea requerida.</li>
          <li>Ser informado sobre el uso que se ha dado a sus datos.</li>
          <li>
            Presentar quejas ante la Superintendencia de Industria y Comercio por infracciones a
            la ley, una vez agotado el trámite de consulta o reclamo ante EthicVoice.
          </li>
          <li>
            Revocar la autorización y/o solicitar la supresión de sus datos cuando no exista un
            deber legal o contractual de conservarlos.
          </li>
          <li>Acceder gratuitamente a sus datos personales objeto de tratamiento.</li>
        </ul>
      </>
    ),
  },
  {
    id: "autorizacion",
    title: "Autorización",
    body: (
      <p>
        EthicVoice solicita la autorización del titular a más tardar al momento de la recolección
        de sus datos, por medios que permitan su consulta posterior (formularios web, aceptación
        en la plataforma, correo electrónico u otros). No se requiere autorización en los casos
        previstos en el artículo 10 de la Ley 1581 de 2012.
      </p>
    ),
  },
  {
    id: "consultas-y-reclamos",
    title: "Procedimiento para consultas y reclamos",
    body: (
      <>
        <p>
          Las solicitudes se reciben en{" "}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> y deben incluir el nombre e
          identificación del titular, la descripción de la solicitud, la dirección de respuesta y
          los documentos que se quieran hacer valer.
        </p>
        <ul>
          <li>
            <strong>Consultas:</strong> se atienden en un máximo de diez (10) días hábiles desde
            su recibo. Si no es posible, se informará el motivo y la nueva fecha, que no superará
            cinco (5) días hábiles adicionales.
          </li>
          <li>
            <strong>Reclamos</strong> (corrección, actualización, supresión o incumplimiento): se
            atienden en un máximo de quince (15) días hábiles desde el día siguiente a su recibo,
            prorrogables por ocho (8) días hábiles informando el motivo. Si el reclamo está
            incompleto, se pedirá completarlo dentro de los cinco (5) días hábiles siguientes; si
            pasan dos (2) meses sin respuesta del interesado, se entenderá que desistió.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "area-responsable",
    title: "Área responsable de la atención",
    body: (
      <p>
        El equipo de cumplimiento y protección de datos de EthicVoice atiende las peticiones,
        consultas y reclamos de los titulares a través de{" "}
        <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
      </p>
    ),
  },
  {
    id: "transferencias",
    title: "Transferencia y transmisión de datos",
    body: (
      <p>
        Para operar la plataforma, EthicVoice puede transmitir datos a proveedores de
        infraestructura en la nube, correo electrónico, pagos y analítica, algunos ubicados fuera
        de Colombia, que actúan como encargados bajo acuerdos que exigen niveles adecuados de
        protección, conforme a los artículos 26 de la Ley 1581 de 2012 y 24 y 25 del Decreto 1377
        de 2013.
      </p>
    ),
  },
  {
    id: "seguridad",
    title: "Seguridad de la información",
    body: (
      <p>
        EthicVoice adopta medidas técnicas, humanas y administrativas para proteger los datos y
        evitar su adulteración, pérdida, consulta, uso o acceso no autorizado, entre ellas
        cifrado en tránsito y en reposo, control de acceso por roles, autenticación multifactor y
        registro de auditoría.
      </p>
    ),
  },
  {
    id: "vigencia",
    title: "Vigencia y modificaciones",
    body: (
      <p>
        Esta política rige desde su publicación. Los datos se conservarán mientras sean
        necesarios para las finalidades descritas y para cumplir deberes legales o
        contractuales. Cualquier cambio sustancial se comunicará oportunamente a través de este
        sitio web.
      </p>
    ),
  },
];

export default function HabeasDataPolicyPage() {
  return (
    <MarketingPageShell>
      <PageHero
        kicker="Habeas Data"
        title={["Política de tratamiento", <>de <Voice>datos personales.</Voice></>]}
        lead={`Cómo recolectamos, usamos y protegemos los datos personales, y cómo ejercer sus derechos como titular. Última actualización: ${LAST_UPDATED}.`}
      />

      <section className="bg-white py-16 sm:py-24">
        <Container>
          <div className="grid gap-12 lg:grid-cols-12">
            <nav aria-label="Contenido" className="lg:col-span-3">
              <ol className="ev-label space-y-2 text-ev-mute lg:sticky lg:top-28">
                {CLAUSES.map((c, i) => (
                  <li key={c.id}>
                    <a href={`#${c.id}`} className="hover:text-ev-night">
                      <span className="text-ev-moss">{String(i + 1).padStart(2, "0")}</span>{" "}
                      {c.title}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="lg:col-span-9">
              {CLAUSES.map((c, i) => (
                <article
                  key={c.id}
                  id={c.id}
                  className="scroll-mt-28 border-t border-ev-line py-8 first:border-t-0 first:pt-0"
                >
                  <h2 className="text-[1.375rem] font-medium leading-snug tracking-[-0.025em] text-ev-night">
                    <span className="ev-label mr-3 align-middle text-ev-moss">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    {c.title}
                  </h2>
                  <div className="mt-4 space-y-4 text-[1rem] leading-relaxed text-ev-ink [&_a]:underline [&_a]:underline-offset-2 [&_li]:pl-1 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5">
                    {c.body}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </Container>
      </section>
    </MarketingPageShell>
  );
}
