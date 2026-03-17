/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Card, CardBody, CardHeader } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import { Button } from "@heroui/react";
import { Badge } from "@heroui/react";

export default function AISystemDebugPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [health, setHealth] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 10000); // Cada 10 segundos
    return () => clearInterval(interval);
  }, []);

  const checkHealth = async () => {
    try {
      const response = await fetch("/api/ai/health");
      const data = await response.json();
      setHealth(data);
    } catch (error) {
      console.error("Error checking health:", error);
    } finally {
      setLoading(false);
    }
  };

  const forceEmailCheck = async () => {
    setTesting(true);
    try {
      const response = await fetch("/api/ai/test/email-check", {
        method: "POST",
      });

      if (response.ok) {
        addToast({
          title: "Revisión de emails forzada",
          color: "success",
        });
        setTimeout(checkHealth, 2000);
      } else {
        addToast({
          title: "Error forzando revisión",
          color: "danger",
        });
      }
    } catch {
      addToast({
        title: "Error de conexión",
        color: "danger",
      });
    } finally {
      setTesting(false);
    }
  };

  if (loading) return <div>Cargando...</div>;

  const StatusBadge = ({ status }: { status: string }) => {
    if (status === "connected" || status === "ok") {
      return (
        <Badge color="success" variant="flat">
          Activo
        </Badge>
      );
    }
    return (
      <Badge color="danger" variant="flat">
        Error
      </Badge>
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Debug Sistema AI</h1>
        <Button size="sm" variant="flat" onPress={checkHealth}>
          Actualizar
        </Button>
      </div>

      {health && (
        <div className="space-y-6">
          {/* Estado General */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Estado General</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Redis</p>
                  <StatusBadge status={health.redis} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Workers</p>
                  <StatusBadge
                    status={health.workersRunning ? "ok" : "error"}
                  />
                </div>
                <div>
                  <p className="text-sm text-gray-600">OpenAI</p>
                  <StatusBadge status={health.env.hasOpenAI ? "ok" : "error"} />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Google</p>
                  <StatusBadge
                    status={health.env.hasGoogleCreds ? "ok" : "error"}
                  />
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Email Config */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center w-full">
                <h2 className="text-lg font-semibold">Configuración Email</h2>
                <Button
                  size="sm"
                  color="primary"
                  onPress={forceEmailCheck}
                  isLoading={testing}
                >
                  Forzar Revisión
                </Button>
              </div>
            </CardHeader>
            <CardBody>
              {health.emailConfig === "No configurado" ? (
                <p className="text-red-600">❌ No hay configuración de email</p>
              ) : (
                <div className="space-y-2">
                  <p>
                    Estado:{" "}
                    {health.emailConfig.active ? "✅ Activo" : "❌ Inactivo"}
                  </p>
                  <p>Emails procesados: {health.emailConfig.emailsProcessed}</p>
                  <p>
                    Última revisión: {health.emailConfig.lastChecked || "Nunca"}
                  </p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Queue Stats */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Estado de Colas</h2>
            </CardHeader>
            <CardBody>
              {health.queues?.error ? (
                <p className="text-red-600">Error: {health.queues.error}</p>
              ) : (
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium mb-2">Email Queue</h3>
                    <div className="space-y-1 text-sm">
                      <p>Esperando: {health.queues?.email?.waiting || 0}</p>
                      <p>Activos: {health.queues?.email?.active || 0}</p>
                      <p>Completados: {health.queues?.email?.completed || 0}</p>
                      <p>Fallidos: {health.queues?.email?.failed || 0}</p>
                    </div>
                  </div>
                  <div>
                    <h3 className="font-medium mb-2">Submission Queue</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Esperando: {health.queues?.submission?.waiting || 0}
                      </p>
                      <p>Activos: {health.queues?.submission?.active || 0}</p>
                      <p>
                        Completados: {health.queues?.submission?.completed || 0}
                      </p>
                      <p>Fallidos: {health.queues?.submission?.failed || 0}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Jobs Recientes</h2>
            </CardHeader>
            <CardBody>
              {health.recentJobs?.length === 0 ? (
                <p className="text-gray-500">No hay jobs recientes</p>
              ) : (
                <div className="space-y-2">
                  {health.recentJobs?.map((job: any) => (
                    <div
                      key={job.id}
                      className="flex justify-between items-center p-2 bg-gray-50 rounded"
                    >
                      <div>
                        <p className="font-medium">{job.source}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge
                          color={
                            job.status === "completed"
                              ? "success"
                              : job.status === "failed"
                              ? "danger"
                              : "warning"
                          }
                          size="sm"
                        >
                          {job.status}
                        </Badge>
                        {job.errorMessage && (
                          <span className="text-xs text-red-600">
                            {job.errorMessage}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Logs */}
          <Card>
            <CardHeader>
              <h2 className="text-lg font-semibold">Comandos de Debug</h2>
            </CardHeader>
            <CardBody>
              <div className="space-y-2 font-mono text-sm">
                <p className="p-2 bg-gray-100 rounded">
                  docker-compose logs -f redis
                </p>
                <p className="p-2 bg-gray-100 rounded">npm run workers</p>
                <p className="p-2 bg-gray-100 rounded">
                  docker exec -it redis-ai-reports redis-cli
                </p>
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
