"use client";

import { Card, Chip, Button } from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";

interface IPRequestData {
  ip: string;
  count: number;
  lastSeen: number;
  types: Record<string, number>;
}

interface IPRequestTreeChartProps {
  data: IPRequestData[];
  onBlockIP: (ip: string) => void;
}

export function IPRequestTreeChart({
  data,
  onBlockIP,
}: IPRequestTreeChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <i className="icon-[lucide--bar-chart-3] size-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">
            Sin Datos de Peticiones
          </h3>
          <p className="text-gray-500">
            No hay datos de peticiones para mostrar en las últimas 24 horas.
          </p>
        </div>
      </Card>
    );
  }

  // Calculate max count for scaling
  const maxCount = Math.max(...data.map((item) => item.count));

  // Take top 20 IPs for visualization
  const topIPs = data.slice(0, 20);

  const getBarWidth = (count: number) => {
    return Math.max((count / maxCount) * 100, 2); // Minimum 2% width
  };

  const getCountColor = (count: number) => {
    const percentage = count / maxCount;
    if (percentage > 0.8) return "bg-red-500";
    if (percentage > 0.6) return "bg-orange-500";
    if (percentage > 0.4) return "bg-yellow-500";
    if (percentage > 0.2) return "bg-blue-500";
    return "bg-green-500";
  };

  const getCountColorChip = (
    count: number
  ): "danger" | "warning" | "success" | "primary" | "default" => {
    const percentage = count / maxCount;
    if (percentage > 0.8) return "danger";
    if (percentage > 0.6) return "warning";
    if (percentage > 0.4) return "warning";
    if (percentage > 0.2) return "primary";
    return "success";
  };

  const formatLastSeen = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `hace ${hours}h`;
    } else if (minutes > 0) {
      return `hace ${minutes}m`;
    } else {
      return "ahora";
    }
  };

  const getTopRequestType = (types: Record<string, number>) => {
    let maxType = "general";
    let maxCount = 0;

    Object.entries(types).forEach(([type, count]) => {
      if (count > maxCount) {
        maxCount = count;
        maxType = type;
      }
    });

    return maxType;
  };

  const handleBlockIP = async (ip: string) => {
    try {
      await onBlockIP(ip);
      addToast({
        title: "IP Bloqueada",
        description: `La IP ${ip} ha sido bloqueada exitosamente`,
        color: "success",
      });
    } catch (error) {
      console.error("Error blocking IP:", error);
      addToast({
        title: "Error",
        description: "No se pudo bloquear la IP",
        color: "danger",
      });
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <i className="icon-[lucide--bar-chart-3] size-5 text-blue-600" />
            Top IPs por Peticiones (24h)
          </h3>
          <Chip color="primary" size="sm">
            {data.length} IPs activas
          </Chip>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-red-500 rounded"></div>
            <span>Muy Alto (&gt;80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-orange-500 rounded"></div>
            <span>Alto (60-80%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-yellow-500 rounded"></div>
            <span>Medio (40-60%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span>Bajo (20-40%)</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span>Mínimo (&lt;20%)</span>
          </div>
        </div>

        {/* Tree Chart */}
        <div className="space-y-3">
          {topIPs.map((item, index) => (
            <div key={item.ip} className="space-y-2">
              {/* IP Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-600">
                    #{index + 1}
                  </span>
                  <span className="font-mono text-sm font-medium">
                    {item.ip}
                  </span>
                  <Chip
                    color={getCountColorChip(item.count)}
                    size="sm"
                    variant="flat"
                  >
                    {item.count} peticiones
                  </Chip>
                  <Chip size="sm" variant="bordered">
                    {getTopRequestType(item.types)}
                  </Chip>
                  <span className="text-xs text-gray-500">
                    {formatLastSeen(item.lastSeen)}
                  </span>
                </div>
                <Button
                  size="sm"
                  color="danger"
                  variant="flat"
                  onPress={() => handleBlockIP(item.ip)}
                  startContent={<i className="icon-[lucide--ban] size-4" />}
                >
                  Bloquear
                </Button>
              </div>

              {/* Visual Bar */}
              <div className="relative h-8 bg-gray-100 rounded-lg overflow-hidden">
                <div
                  className={`absolute top-0 left-0 h-full ${getCountColor(item.count)} transition-all duration-300 rounded-lg`}
                  style={{ width: `${getBarWidth(item.count)}%` }}
                >
                  <div className="flex items-center justify-between h-full px-3">
                    <span className="text-white text-xs font-medium">
                      {item.count}
                    </span>
                    <span className="text-white text-xs">
                      {Math.round((item.count / maxCount) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Request Types Breakdown */}
              <div className="flex gap-2 pl-8">
                {Object.entries(item.types).map(([type, count]) => (
                  <Chip key={type} size="sm" variant="flat" color="default">
                    {type}: {count}
                  </Chip>
                ))}
              </div>
            </div>
          ))}
        </div>

        {data.length > 20 && (
          <div className="text-center pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Mostrando top 20 de {data.length} IPs activas
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}
