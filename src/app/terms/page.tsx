import React from "react";
import { MarketingPageShell } from "@/modules/landig-page/components/MarketingPageShell";

export const metadata = {
  title: "Términos y Condiciones | EthicVoice",
  description:
    "Condiciones contractuales de EthicVoice: objeto, cuentas, uso permitido, confidencialidad, tratamiento de datos, canales de reporte (web, email, chatbot, teléfono), analítica, roles y permisos, límites de uso, planes y cobros, suspensión, propiedad intelectual, responsabilidad y jurisdicción.",
};

export default function TermsPage() {
  return (
    <MarketingPageShell mainClassName="pb-16">
      <section className="container max-w-7xl px-4 md:mx-auto">
        <div className="rounded-2xl border border-[#0a1f14]/10 bg-[#f5f3ee] p-6 shadow-sm md:p-10">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Términos y Condiciones
            </h1>
            <p className="text-sm text-gray-500 mb-8">Última actualización: 11 de agosto de 2025</p>

            <section className="space-y-6">
        <p>
          El presente documento regula el acceso y uso de la plataforma EthicVoice
          (la «Plataforma»), un sistema para recepción, gestión y análisis de reportes
          de ética y cumplimiento por parte de organizaciones («Organizaciones»)
          y sus usuarios autorizados («Usuarios»). Al utilizar la Plataforma aceptas
          íntegramente estos Términos y Condiciones (los «Términos»).
        </p>

        <h2 className="text-xl font-semibold text-gray-900">1. Objeto del Servicio</h2>
        <p>
          EthicVoice proporciona a las Organizaciones un conjunto de funcionalidades
          orientadas a la recepción, tratamiento y seguimiento de reportes internos:
        </p>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Canales de reporte: formularios web, canal de correo electrónico corporativo
            (ingesta y clasificación), chatbot y registro de reportes telefónicos.
          </li>
          <li>
            Gestión del ciclo de vida del reporte: clasificación (estado, severidad,
            prioridad), asignación a departamentos/equipos, comentarios internos,
            archivado y reactivación.
          </li>
          <li>
            Analítica y tableros: estadísticas de tendencias, fuentes, severidad,
            tiempos de atención y exportes bajo demanda.
          </li>
          <li>
            Administración: configuración de organización, roles y permisos (p. ej.,
            administrador, miembro), límites por plan, personalización visual básica
            (logo y colores, según plan).
          </li>
          <li>
            Automatizaciones y notificaciones: avisos transaccionales y recordatorios
            a Usuarios internos, según configuración y permisos aplicables.
          </li>
          <li>
            Integraciones de terceros: autenticación y gestión de identidad, y
            procesamiento de cobros por suscripción mediante un proveedor externo.
          </li>
          <li>
            Funcionalidades asistidas por IA: soporte para clasificación y priorización
            asistida (cuando se active), siempre como apoyo no vinculante para la toma
            de decisiones humanas.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">2. Cuentas, Acceso y Roles</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            La Organización controla el alta, baja y permisos de sus Usuarios. EthicVoice
            ofrece perfiles con diferentes capacidades (p. ej., administradores con
            facultad de configuración, y miembros con acceso operativo restringido).
          </li>
          <li>
            El Usuario es responsable de la confidencialidad de sus credenciales y de toda
            actividad realizada desde su cuenta. Notifica de inmediato accesos no
            autorizados.
          </li>
          <li>
            EthicVoice podrá suspender o revocar accesos ante incumplimientos, riesgos de
            seguridad o por exigencia legal.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">3. Uso Permitido y Restricciones</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Usarás la Plataforma conforme a la ley y a estos Términos. Queda prohibido el
            uso ilícito, difamatorio, fraudulento, o que vulnere derechos de terceros.
          </li>
          <li>
            No podrás eludir mecanismos de seguridad, realizar ingeniería inversa,
            escaneo automatizado masivo, extracción de datos no autorizada ni interferir en
            la operación de la Plataforma.
          </li>
          <li>
            El contenido sensible de los reportes deberá manejarse con estricta
            confidencialidad conforme a la normativa aplicable y a las políticas de tu
            Organización.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">4. Confidencialidad</h2>
        <p>
          EthicVoice y la Organización se comprometen a proteger la confidencialidad de
          la información incorporada en los reportes. EthicVoice limita el acceso del
          personal al mínimo necesario para la correcta prestación del servicio y soporte
          técnico. La Organización define políticas de acceso interno, retención y
          divulgación conforme a su marco regulatorio y a estos Términos.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">5. Protección de Datos Personales</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            Rol de las partes: La Organización actúa como responsable del tratamiento de
            los datos que introduce o gestiona en la Plataforma. EthicVoice actúa como
            encargado del tratamiento en lo relativo al servicio alojado.
          </li>
          <li>
            Minimización: La Plataforma está diseñada para evitar la recopilación de
            información técnica innecesaria (p. ej., IP o user agent en las
            presentaciones/"submissions"), salvo que sea imprescindible por razones de
            seguridad o cumplimiento y siempre con base legal.
          </li>
          <li>
            Finalidades: Prestación del servicio, seguridad, mantenimiento, soporte,
            analítica agregada y mejora de la calidad. No realizamos perfiles automatizados
            con efectos jurídicos sin intervención humana.
          </li>
          <li>
            Subencargados y transferencias: Podrán emplearse proveedores de infraestructura
            y pago bajo contratos que garanticen medidas adecuadas. La Organización es
            informada de los principales subencargados críticos.
          </li>
          <li>
            Conservación: Los datos se conservan por el tiempo necesario para la finalidad
            y/o según las políticas de retención de la Organización.
          </li>
          <li>
            Derechos de los interesados: Cuando resulte aplicable, los interesados podrán
            ejercer sus derechos a través de la Organización responsable.
          </li>
        </ul>
        <p>
          El tratamiento de datos personales se realiza conforme a la Ley 1581 de 2012, el Decreto 1377 de 2013 y normas
          concordantes. Consulta nuestra Política de Privacidad para conocer finalidades, canales y procedimientos para el
          ejercicio de derechos de los titulares.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">6. Funcionalidades Asistidas por IA</h2>
        <p>
          Las funciones de análisis y priorización asistidas por IA tienen carácter
          orientativo. La decisión final y la responsabilidad de gestión del reporte
          corresponden a los Usuarios autorizados de la Organización. La IA puede errar o
          no estar disponible; se recomienda revisión humana en todo caso.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">7. Límites de Uso y Recursos</h2>
        <p>
          Los límites (p. ej., usuarios, investigadores, empleados, volumen de reportes,
          personalizaciones) dependen del plan contratado. EthicVoice podrá aplicar
          medidas de «uso justo» para proteger la estabilidad del servicio.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">8. Disponibilidad, Soporte y Mantenimiento</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            EthicVoice se esfuerza por mantener una alta disponibilidad. Podrán existir
            ventanas de mantenimiento y degradaciones temporales.
          </li>
          <li>
            El soporte se presta en los canales publicados y según el plan contratado.
          </li>
          <li>
            La Organización es responsable de su conectividad y de la correcta
            configuración de sus dominios/canales de correo, autenticación y seguridad.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">9. Planes, Pagos y Facturación</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            La suscripción es recurrente según ciclo (mensual/anual). Los precios y
            prestaciones por plan constan en la Plataforma. Impuestos y cargos de
            terceros pueden aplicar.
          </li>
          <li>
            El procesamiento de pagos se realiza a través de un proveedor externo. Al
            completar el pago, autorizas los cargos recurrentes conforme a tu plan.
          </li>
          <li>
            Cambios de plan pueden implicar prorrateos, ajustes y nuevas fechas de
            facturación.
          </li>
          <li>
            La falta de pago puede conllevar suspensión o cancelación del servicio.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">10. Modificaciones del Servicio</h2>
        <p>
          EthicVoice podrá mejorar o ajustar funcionalidades para mantener la seguridad y
          la calidad. Los cambios sustanciales se comunicarán por canales razonables. Si
          un cambio imposibilita el cumplimiento del objeto contratado, la Organización
          podrá rescindir conforme a la cláusula de terminación.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">11. Propiedad Intelectual</h2>
        <p>
          La Plataforma, su código, marcas, logotipos y contenidos generados por EthicVoice
          son de su titularidad o licenciados. La Organización conserva los derechos sobre
          sus propios contenidos y reportes, otorgando a EthicVoice una licencia limitada
          para alojarlos y procesarlos con fines de prestación del servicio.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">12. Responsabilidad</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            En la máxima medida permitida por la ley, EthicVoice no será responsable por
            daños indirectos, incidentales, especiales, punitivos o consecuentes, ni por
            lucro cesante, pérdida de datos o interrupciones originadas por terceros o por
            el propio uso de la Plataforma.
          </li>
          <li>
            La responsabilidad total de EthicVoice por reclamaciones relacionadas con el
            servicio se limita, como máximo, a los importes efectivamente pagados por la
            Organización en los doce (12) meses anteriores al evento.
          </li>
        </ul>

        <h2 className="text-xl font-semibold text-gray-900">13. Suspensión y Terminación</h2>
        <p>
          EthicVoice podrá suspender o dar por terminado el acceso ante incumplimientos,
          riesgos de seguridad, uso contrario a la ley o por requerimiento de autoridad.
          La Organización puede terminar el servicio conforme a los plazos y condiciones
          de su suscripción. Al finalizar, podrá solicitar exportes razonables de
          información permitidos por el plan.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">14. Jurisdicción y Ley Aplicable</h2>
        <p>
          Estos Términos se rigen por las leyes de la República de Colombia, sin perjuicio de normas de orden público
          o de protección al consumidor que resulten aplicables. Cualquier controversia se someterá a los tribunales
          competentes de Bogotá, D.C., salvo pacto escrito en contrario permitido por la ley.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">15. Cambios a estos Términos</h2>
        <p>
          EthicVoice podrá actualizar estos Términos para reflejar cambios legales,
          operativos o de servicio. Publicaremos la versión vigente en esta página con su
          fecha de actualización. El uso continuado tras los cambios implica aceptación.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">16. Contacto</h2>
        <p>
          Para consultas sobre estos Términos, utiliza los canales oficiales indicados en
          el sitio de EthicVoice.
        </p>

        <h2 className="text-xl font-semibold text-gray-900">17. Disposiciones Adicionales</h2>
        <ul className="list-disc pl-6 space-y-2">
          <li>
            <strong>Seguridad sin certificaciones:</strong> aplicamos medidas razonables y proporcionadas de seguridad
            técnica y organizativa. No declaramos contar con certificaciones específicas ni garantizamos seguridad absoluta.
          </li>
          <li>
            <strong>Incidentes:</strong> notificaremos incidentes de seguridad relevantes de los que tengamos conocimiento
            en la medida en que sea exigido por la ley y de forma razonable según el impacto y alcance.
          </li>
          <li>
            <strong>Subencargados y terceros:</strong> podemos utilizar proveedores y servicios de terceros para
            infraestructura, analítica, comunicaciones o cobros. No somos responsables por actos u omisiones de esos
            terceros fuera de nuestro control, sin perjuicio de las obligaciones legales que nos correspondan.
          </li>
          <li>
            <strong>Integraciones:</strong> las integraciones o enlaces a servicios externos se proveen «tal cual» y
            pueden requerir cuentas o licencias independientes. Su disponibilidad y desempeño dependen del tercero.
          </li>
          <li>
            <strong>Desarrollos a medida:</strong> salvo pacto expreso distinto, la propiedad intelectual del software
            base y de los componentes desarrollados por EthicVoice pertenece a EthicVoice. La Organización recibe una
            licencia limitada, no exclusiva y no transferible para usar los entregables dentro de la Plataforma.
          </li>
          <li>
            <strong>Indemnidad:</strong> la Organización mantendrá indemne a EthicVoice frente a reclamaciones de terceros
            derivadas del uso ilícito o contrario a estos Términos por parte de la Organización o sus Usuarios.
          </li>
          <li>
            <strong>Fuerza mayor:</strong> ninguna de las partes responde por incumplimientos causados por eventos fuera de
            su control razonable (p. ej., desastres, fallos masivos de internet, regulaciones sobrevenidas).
          </li>
          <li>
            <strong>Cesión:</strong> la Organización no podrá ceder el contrato sin autorización previa y escrita de
            EthicVoice. EthicVoice podrá cederlo en el marco de reorganizaciones corporativas.
          </li>
          <li>
            <strong>Comunicaciones:</strong> aceptas recibir comunicaciones electrónicas relativas al servicio en las
            direcciones proporcionadas por la Organización.
          </li>
          <li>
            <strong>Interpretación:</strong> si alguna cláusula se declara inválida, las restantes permanecerán vigentes;
            la falta de ejercicio de un derecho no implica renuncia.
          </li>
        </ul>
            </section>
          </div>
        </section>
    </MarketingPageShell>
  );
}


