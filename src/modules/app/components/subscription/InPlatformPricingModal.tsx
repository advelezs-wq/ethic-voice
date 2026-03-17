"use client";

import { useState } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  Button,
  Tabs,
  Tab,
} from "@heroui/react";
import {
  PLAN_CONFIGS,
  PlanType,
  BillingCycle,
  formatPriceForUI,
} from "@/types/subscription.types";
import CheckoutSidebar from "../checkout/CheckoutSidebar";
import { useClerk } from "@clerk/nextjs";
import { motion } from "framer-motion";

interface InPlatformPricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscriptionCreated?: (subscriptionId: number) => void;
}

export default function InPlatformPricingModal({
  isOpen,
  onClose,
  onSubscriptionCreated,
}: InPlatformPricingModalProps) {
  const { signOut } = useClerk();
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [isCreatingSubscription, setIsCreatingSubscription] = useState(false);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(
    BillingCycle.MONTHLY
  );

  // Debug modal state changes
  console.log("💰 InPlatformPricingModal rendered:", {
    isOpen,
    selectedPlan,
    isCreatingSubscription,
    billingCycle,
  });

  const [checkoutData, setCheckoutData] = useState<{
    isOpen: boolean;
    subscription: {
      id: number;
      planName: string;
      price: number;
      currency: "USD" | "COP";
      returnUrl: string;
      paymentUrl?: string;
    } | null;
  }>({ isOpen: false, subscription: null });

  const handleBillingToggle = (cycle: BillingCycle) => {
    setBillingCycle(cycle);
  };

  const getPrice = (planType: PlanType) => {
    const config = PLAN_CONFIGS[planType];
    if (planType === PlanType.PREMIUM) return null;

    const price =
      billingCycle === BillingCycle.YEARLY
        ? config.price.yearly!
        : config.price.monthly;
    return price;
  };

  const handleSelectPlan = async (planType: PlanType) => {
    setSelectedPlan(planType);
    setIsCreatingSubscription(true);

    try {
      console.log(
        "🔄 Creating subscription for plan:",
        planType,
        "with billing:",
        billingCycle
      );

      const response = await fetch("/api/subscriptions/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planType,
          billingCycle: billingCycle,
          openSidebar: true,
          returnUrl: "/app",
        }),
      });

      const data = await response.json();
      console.log("📋 Subscription creation response:", data);

      if (response.ok && data.subscription) {
        console.log(
          "✅ [PRICING-MODAL] Subscription created successfully:",
          data
        );

        // Verify subscription ID exists
        if (!data.subscription.id) {
          console.error("❌ [PRICING-MODAL] No subscription ID in response!");
          alert("Error: No subscription ID received. Please try again.");
          return;
        }

        // Open checkout sidebar with subscription data
        setCheckoutData({
          isOpen: true,
          subscription: {
            id: data.subscription.id,
            planName: data.subscription.planName,
            price: data.subscription.price,
            currency: data.subscription.currency,
            returnUrl: data.subscription.returnUrl,
            paymentUrl: data.subscription.paymentUrl,
          },
        });
      } else {
        console.error("❌ Failed to create subscription:", data);
        alert("Failed to create subscription. Please try again.");
      }
    } catch (error) {
      console.error("❌ Error creating subscription:", error);
      alert("An error occurred. Please try again.");
    } finally {
      setIsCreatingSubscription(false);
    }
  };

  const handleCheckoutClose = () => {
    setCheckoutData({ isOpen: false, subscription: null });
    setSelectedPlan(null);
  };

  const handleLogout = async () => {
    try {
      console.log(
        "🔓 [PRICING-MODAL] User choosing to logout instead of subscribing"
      );
      await signOut({ redirectUrl: "/" });
    } catch (error) {
      console.error("❌ [PRICING-MODAL] Error during logout:", error);
    }
  };

  const displayPlans = [PlanType.STARTER, PlanType.GROW, PlanType.GROW_PRO];

  // Generate email template for custom plan
  const generateCustomPlanEmail = () => {
    const subject =
      "Consulta por Plan Personalizado EthicVoice - Línea Ética Empresarial";
    const body = `Hola equipo de EthicVoice,

Estoy interesado en conocer más sobre el Plan Personalizado de línea ética para mi organización.

Información de mi empresa:
- Nombre de la empresa: [Tu empresa]
- Número de empleados: [Cantidad]
- Industria/Sector: [Tu industria]
- Volumen estimado de reportes/mes: [Cantidad]
- Requerimientos específicos: [Describe tus necesidades]

Me gustaría programar una reunión para discutir:
✓ Usuarios e investigadores ilimitados
✓ Todos los canales de reporte (Web, Email, Chatbot, Teléfono)
✓ IA avanzada para análisis automático de denuncias
✓ Analíticas premium y reportes ejecutivos
✓ Seguridad empresarial y cumplimiento normativo
✓ Soporte prioritario 24/7
✓ Personalización total del branding
✓ Capacitación completa para investigadores
✓ Consultoría legal especializada
✓ Integración API con sistemas existentes
✓ SLA garantizado y soporte multiidioma

¿Cuándo podríamos agendar una llamada para evaluar nuestras necesidades específicas?

Gracias,
[Tu nombre]
[Tu cargo]
[Tu teléfono]
[Tu email corporativo]`;

    return `mailto:ventas@ethicvoice.co?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="5xl"
        scrollBehavior="inside"
        isDismissable={false}
        hideCloseButton={true}
        placement="center"
        classNames={{
          backdrop: "bg-black/80 backdrop-blur-sm z-[100]",
          wrapper: "z-[101] flex items-center justify-center p-4",
          base: "z-[102] max-h-[95vh] w-full",
          body: "overflow-y-auto max-h-[80vh]",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1 text-center relative">
            <div className="absolute top-0 right-0">
              <Button
                variant="light"
                size="sm"
                onPress={handleLogout}
                className="text-gray-500 hover:text-gray-700"
              >
                Cerrar Sesión
              </Button>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              ¡Elige tu plan ideal!
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Selecciona entre los mejores planes, asegurando una combinación
              perfecta. ¿Necesitas más o menos? ¡Personaliza tu suscripción para
              un ajuste perfecto!
            </p>

            {/* Billing Toggle - Centered */}
            <div className="flex justify-center mb-4">
              <Tabs
                selectedKey={billingCycle}
                onSelectionChange={(key) =>
                  handleBillingToggle(key as BillingCycle)
                }
                variant="solid"
                color="success"
                size="lg"
                className="w-auto"
                classNames={{
                  tabList: "bg-gray-100 rounded-full p-1",
                  cursor: "bg-green-600 rounded-full shadow-lg",
                  tab: "px-6 py-2 text-sm font-medium rounded-full transition-all duration-300",
                  tabContent:
                    "group-data-[selected=true]:text-white text-gray-600",
                }}
              >
                <Tab key={BillingCycle.MONTHLY} title="Mensual" />
                <Tab key={BillingCycle.YEARLY} title="Anual (ahorra 10%)" />
              </Tabs>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
              <p className="text-blue-800 text-sm font-medium flex items-center justify-center">
                <i className="icon-[lucide--info] w-4 h-4 mr-2" />
                Se requiere una suscripción para acceder a la plataforma
              </p>
              <p className="text-blue-600 text-xs mt-1">
                Puedes actualizar o cambiar tu plan en cualquier momento después
                del registro
              </p>
            </div>
          </ModalHeader>

          <ModalBody className="pb-6 px-6">
            {/* Pricing Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {displayPlans.map((planType) => {
                const config = PLAN_CONFIGS[planType];
                const price = getPrice(planType);
                const isPopular = config.isPopular;

                const priceDisplay = formatPriceForUI(price ?? 0);
                return (
                  <motion.div
                    key={planType}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.6,
                      delay: displayPlans.indexOf(planType) * 0.1,
                    }}
                    className={`relative bg-white rounded-xl p-6 min-h-[450px] transition-all duration-300 hover:transform hover:-translate-y-1 ${
                      isPopular
                        ? "border-2 border-green-500 shadow-2xl"
                        : "border border-gray-200 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {/* Title */}
                    <div className="mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {config.displayName}
                      </h3>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {config.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="mb-6">
                      <div className="flex items-baseline flex-wrap">
                        <span
                          className={`font-extrabold text-gray-900 ${
                            priceDisplay.size === "large"
                              ? "text-2xl md:text-3xl"
                              : priceDisplay.size === "medium"
                                ? "text-xl md:text-2xl"
                                : "text-lg md:text-xl"
                          }`}
                        >
                          {priceDisplay.formatted}
                        </span>
                        <span className="text-sm text-gray-600 ml-1 flex-shrink-0">
                          /
                          {billingCycle === BillingCycle.YEARLY ? "año" : "mes"}
                        </span>
                      </div>
                    </div>

                    {/* Features */}
                    <div className="space-y-3 mb-6 flex-1">
                      {config.features.highlights.map((feature, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <i className="icon-[lucide--check] w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm text-gray-700">
                            {feature}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <div className="mt-auto">
                      <Button
                        onClick={() => handleSelectPlan(planType)}
                        disabled={
                          isCreatingSubscription && selectedPlan === planType
                        }
                        className={`w-full py-3 px-6 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isPopular
                            ? "bg-green-600 text-white hover:bg-green-700 shadow-lg"
                            : "border-2 border-green-600 text-green-600 hover:bg-green-600 hover:text-white"
                        }`}
                      >
                        {isCreatingSubscription && selectedPlan === planType
                          ? "Procesando..."
                          : "Iniciar Sesión y Continuar"}
                      </Button>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Custom Plan Section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="mt-12 max-w-4xl mx-auto"
            >
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  ¿Necesitas algo más específico?
                </h3>
                <p className="text-gray-600">
                  Creemos una solución personalizada para tu organización
                </p>
              </div>

              <div className="relative bg-gradient-to-br from-purple-500 via-purple-600 to-purple-700 rounded-xl p-6 shadow-xl border-2 border-purple-400 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>

                <div className="relative grid lg:grid-cols-2 gap-6 items-center">
                  {/* Left Column - Content */}
                  <div>
                    <div className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full mb-4">
                      <span className="text-white font-semibold text-xs">
                        Plan Personalizado
                      </span>
                    </div>

                    <h4 className="text-xl font-bold text-white mb-3">
                      Solución Empresarial Completa
                    </h4>

                    <p className="text-purple-100 text-sm leading-relaxed mb-6">
                      Una plataforma de línea ética completamente adaptada a las
                      necesidades específicas de tu organización.
                    </p>

                    <Button
                      as="a"
                      href={generateCustomPlanEmail()}
                      className="bg-white text-purple-700 hover:bg-purple-50 px-6 py-3 rounded-lg text-sm font-bold transition-all duration-200 shadow-lg"
                    >
                      <i className="icon-[lucide--calendar] w-4 h-4 mr-2" />
                      Consulta Gratuita
                    </Button>
                  </div>

                  {/* Right Column - Features Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      {
                        iconClass: "icon-[lucide--users]",
                        title: "Usuarios Ilimitados",
                      },
                      {
                        iconClass: "icon-[lucide--mail]",
                        title: "Todos los Canales",
                      },
                      {
                        iconClass: "icon-[lucide--brain]",
                        title: "IA Avanzada",
                      },
                      {
                        iconClass: "icon-[lucide--chart-bar]",
                        title: "Analíticas Premium",
                      },
                      {
                        iconClass: "icon-[lucide--shield-check]",
                        title: "Seguridad Empresarial",
                      },
                      {
                        iconClass: "icon-[lucide--headphones]",
                        title: "Soporte 24/7",
                      },
                      {
                        iconClass: "icon-[lucide--palette]",
                        title: "Personalización Total",
                      },
                      {
                        iconClass: "icon-[lucide--graduation-cap]",
                        title: "Capacitación Completa",
                      },
                    ].map((feature, index) => (
                      <div
                        key={index}
                        className="bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20"
                      >
                        <div className="flex items-center gap-2">
                          <i
                            className={`${feature.iconClass} w-4 h-4 text-white flex-shrink-0`}
                          />
                          <span className="text-white font-medium text-xs">
                            {feature.title}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <div className="text-center mt-8 space-y-3">
              <p className="text-sm text-gray-600">
                ✓ 14 días de prueba gratis • ✓ Sin costos de configuración • ✓
                Cancela en cualquier momento
              </p>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-amber-800 text-sm font-medium flex items-center justify-center">
                  <i className="icon-[lucide--alert-triangle] w-4 h-4 mr-2" />
                  Por favor selecciona un plan para continuar
                </p>
              </div>

              <div className="text-center mt-4 p-3 bg-gray-50 rounded-lg border">
                <p className="text-gray-600 text-sm">
                  ¿No deseas suscribirte ahora?{" "}
                  <button
                    onClick={handleLogout}
                    className="text-blue-600 hover:text-blue-800 underline font-medium"
                  >
                    Cerrar sesión
                  </button>{" "}
                  y regresa cuando estés listo.
                </p>
              </div>
            </div>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Checkout Sidebar */}
      <CheckoutSidebar
        isOpen={checkoutData.isOpen}
        onClose={handleCheckoutClose}
        subscription={checkoutData.subscription}
      />
    </>
  );
}
