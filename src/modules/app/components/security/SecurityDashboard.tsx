"use client";

import { useState, useEffect } from 'react';
import { Card, Button, Table, TableHeader, TableColumn, TableBody, TableRow, TableCell, Chip, Input } from '@heroui/react';
import { addToast } from '@/modules/core/utils/safe-toast';
import { IPRequestTreeChart } from './IPRequestTreeChart';

interface SecurityStats {
  blockedIPs: string[];
  suspiciousIPs: string[];
  recentAttacks: Array<{
    ip: string;
    timestamp: string;
    type: string;
    reason: string;
  }>;
  recentActivities: Array<{
    ip: string;
    timestamp: string;
    type: string;
    details: string;
  }>;
  rateLimitStats: {
    formSubmissions: number;
    emailAttempts: number;
    captchaRequired: number;
    captchaPassed: number;
  };
  ipRequestStats: Array<{
    ip: string;
    count: number;
    lastSeen: number;
    types: Record<string, number>;
  }>;
}

interface WhitelistData {
  whitelistedIPs: string[];
}

interface DebugInfo {
  systemInfo: {
    timestamp: string;
    environment: string;
    totalTrackedIPs: number;
    totalBlockedIPs: number;
    totalWhitelistedIPs: number;
  };
  debugging: {
    localhostInWhitelist: boolean;
    message: string;
  };
}

interface SecurityDashboardProps {
  userRole: 'SUPER_ADMIN' | 'ORGANIZATION_ADMIN' | 'MEMBER';
}

export function SecurityDashboard({ userRole }: SecurityDashboardProps) {
  const [stats, setStats] = useState<SecurityStats>({
    blockedIPs: [],
    suspiciousIPs: [],
    recentAttacks: [],
    recentActivities: [],
    rateLimitStats: {
      formSubmissions: 0,
      emailAttempts: 0,
      captchaRequired: 0,
      captchaPassed: 0,
    },
    ipRequestStats: [],
  });
  
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newBlockIP, setNewBlockIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [whitelistData, setWhitelistData] = useState<WhitelistData>({
    whitelistedIPs: [],
  });
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  // Fetch real security stats from API
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/security/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch security stats');
        addToast({
          title: "Error",
          description: "No se pudieron cargar las estadísticas de seguridad",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error fetching security stats:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch whitelist data
  const fetchWhitelist = async () => {
    try {
      const response = await fetch('/api/security/whitelist');
      if (response.ok) {
        const data = await response.json();
        setWhitelistData(data);
      }
    } catch (error) {
      console.error('Error fetching whitelist:', error);
    }
  };

  // Fetch debug info
  const fetchDebugInfo = async () => {
    try {
      const response = await fetch('/api/security/debug');
      if (response.ok) {
        const data = await response.json();
        setDebugInfo(data);
        setShowDebug(true);
      } else {
        addToast({
          title: "Error",
          description: "No se pudo obtener información de debug",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error fetching debug info:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    }
  };

  useEffect(() => {
    fetchStats();
    fetchWhitelist();
    
    // Set up auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchStats();
      fetchWhitelist();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const handleUnblockIP = async (ip: string) => {
    try {
      const response = await fetch('/api/security/unblock-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setStats(prev => ({
          ...prev,
          blockedIPs: prev.blockedIPs.filter(blockedIP => blockedIP !== ip),
        }));
        
        addToast({
          title: "IP Desbloqueada",
          description: `La IP ${ip} ha sido desbloqueada exitosamente`,
          color: "success"
        });
        
        // Refresh data to get latest stats
        await fetchStats();
        await fetchWhitelist();
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "No se pudo desbloquear la IP",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error unblocking IP:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    }
  };

  const handleBlockIP = async (ip: string, reason?: string) => {
    try {
      const response = await fetch('/api/security/block-ip', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip, reason }),
      });

      if (response.ok) {
        // Update local state immediately for better UX
        setStats(prev => ({
          ...prev,
          blockedIPs: [...prev.blockedIPs, ip],
        }));
        
        addToast({
          title: "IP Bloqueada",
          description: `La IP ${ip} ha sido bloqueada exitosamente`,
          color: "success"
        });
        
        // Clear form if blocking from manual input
        setNewBlockIP('');
        setBlockReason('');
        
        // Refresh data to get latest stats
        await fetchStats();
        await fetchWhitelist();
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "No se pudo bloquear la IP",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error blocking IP:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    }
  };

  const handleManualBlockIP = async () => {
    if (!newBlockIP) return;
    
    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newBlockIP)) {
      addToast({
        title: "IP Inválida",
        description: "Por favor ingresa una dirección IP válida",
        color: "danger"
      });
      return;
    }

    await handleBlockIP(newBlockIP, blockReason || undefined);
  };

  const handleAddToWhitelist = async () => {
    if (!newWhitelistIP) return;
    
    // Basic IP validation
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    if (!ipRegex.test(newWhitelistIP)) {
      addToast({
        title: "IP Inválida",
        description: "Por favor ingresa una dirección IP válida",
        color: "danger"
      });
      return;
    }

    try {
      const response = await fetch('/api/security/whitelist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip: newWhitelistIP }),
      });

      if (response.ok) {
        addToast({
          title: "IP Agregada a Whitelist",
          description: `La IP ${newWhitelistIP} ha sido agregada a la lista blanca`,
          color: "success"
        });
        setNewWhitelistIP('');
        
        // Refresh data to get latest stats
        await fetchStats();
        await fetchWhitelist();
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "No se pudo agregar la IP a la whitelist",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error adding IP to whitelist:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    }
  };

  const handleRemoveFromWhitelist = async (ip: string) => {
    try {
      const response = await fetch('/api/security/whitelist', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ip }),
      });

      if (response.ok) {
        addToast({
          title: "IP Eliminada de Whitelist",
          description: `La IP ${ip} ha sido eliminada de la lista blanca`,
          color: "success"
        });
        
        // Refresh data to get latest stats
        await fetchStats();
        await fetchWhitelist();
      } else {
        const errorData = await response.json();
        addToast({
          title: "Error",
          description: errorData.error || "No se pudo eliminar la IP de la whitelist",
          color: "danger"
        });
      }
    } catch (error) {
      console.error('Error removing IP from whitelist:', error);
      addToast({
        title: "Error",
        description: "Error al conectar con el servidor",
        color: "danger"
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAttackTypeColor = (type: string): "warning" | "danger" | "secondary" | "default" => {
    switch (type) {
      case 'Rate Limit': return 'warning';
      case 'Spam Detection': return 'danger';
      case 'Bot Detection': return 'secondary';
      default: return 'default';
    }
  };

  const getActivityTypeColor = (type: string): "success" | "primary" | "secondary" | "default" => {
    switch (type) {
      case 'Form Submission': return 'success';
      case 'Email Received': return 'primary';
      case 'File Upload': return 'secondary';
      default: return 'default';
    }
  };

  if (userRole === 'MEMBER') {
    return (
      <Card className="p-6">
        <div className="text-center space-y-4">
          <i className="icon-[lucide--shield-x] size-12 text-gray-400 mx-auto" />
          <h3 className="text-lg font-semibold text-gray-700">Acceso Restringido</h3>
          <p className="text-gray-500">
            No tienes permisos para ver el dashboard de seguridad.
          </p>
        </div>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <i className="icon-[lucide--loader-circle] size-8 animate-spin text-primary mx-auto" />
          <p className="mt-2 text-gray-500">Cargando datos de seguridad...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <i className="icon-[lucide--shield-check] size-8 text-green-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard de Seguridad</h1>
            <p className="text-gray-600">
              Monitoreo y gestión de protecciones contra bots y ataques
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            color="secondary"
            variant="flat"
            onPress={fetchDebugInfo}
            startContent={<i className="icon-[lucide--bug] size-4" />}
          >
            Debug Info
          </Button>
          {showDebug && (
            <Button
              color="default"
              variant="light"
              onPress={() => setShowDebug(false)}
              startContent={<i className="icon-[lucide--x] size-4" />}
            >
              Cerrar Debug
            </Button>
          )}
        </div>
      </div>

      {/* Debug Information */}
      {showDebug && debugInfo && (
        <Card className="p-6 bg-gray-50 border-2 border-gray-200">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <i className="icon-[lucide--bug] size-5 text-gray-600" />
              <h3 className="text-lg font-semibold">Información de Debug</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">IPs Rastreadas</p>
                <p className="text-xl font-bold">{debugInfo.systemInfo?.totalTrackedIPs || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">IPs Bloqueadas</p>
                <p className="text-xl font-bold">{debugInfo.systemInfo?.totalBlockedIPs || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">IPs en Whitelist</p>
                <p className="text-xl font-bold">{debugInfo.systemInfo?.totalWhitelistedIPs || 0}</p>
              </div>
              <div className="bg-white p-3 rounded-lg">
                <p className="text-sm text-gray-600">Environment</p>
                <p className="text-sm font-mono">{debugInfo.systemInfo?.environment || 'unknown'}</p>
              </div>
            </div>

            {debugInfo.debugging?.localhostInWhitelist && (
              <div className="bg-orange-100 border-l-4 border-orange-500 p-4">
                <div className="flex items-center gap-2">
                  <i className="icon-[lucide--alert-triangle] size-5 text-orange-600" />
                  <h4 className="font-medium text-orange-800">Localhost en Whitelist</h4>
                </div>
                <p className="text-sm text-orange-700 mt-1">
                  {debugInfo.debugging.message}
                </p>
                <div className="mt-2">
                  <Button
                    size="sm"
                    color="warning"
                    variant="flat"
                    onPress={async () => {
                      try {
                        const response = await fetch('/api/security/whitelist', {
                          method: 'DELETE',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ ip: '127.0.0.1' }),
                        });
                        if (response.ok) {
                          addToast({
                            title: "Localhost Removido",
                            description: "Ahora localhost será rastreado",
                            color: "success"
                          });
                          await fetchDebugInfo();
                          await fetchStats();
                          await fetchWhitelist();
                        }
                      } catch (error) {
                        console.error('Error removing localhost:', error);
                      }
                    }}
                  >
                    Remover Localhost de Whitelist
                  </Button>
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>Última actualización: {debugInfo.systemInfo?.timestamp}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <i className="icon-[lucide--shield-alert] size-6 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.blockedIPs.length}</p>
              <p className="text-sm text-gray-600">IPs Bloqueadas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <i className="icon-[lucide--eye] size-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.suspiciousIPs.length}</p>
              <p className="text-sm text-gray-600">IPs Sospechosas</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <i className="icon-[lucide--zap] size-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stats.rateLimitStats.captchaRequired}</p>
              <p className="text-sm text-gray-600">Captchas Requeridos</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-lg">
              <i className="icon-[lucide--check-circle] size-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">
                {Math.round((stats.rateLimitStats.captchaPassed / stats.rateLimitStats.captchaRequired) * 100) || 0}%
              </p>
              <p className="text-sm text-gray-600">Tasa de Éxito</p>
            </div>
          </div>
        </Card>
      </div>

      {/* IP Request Statistics Tree Chart */}
      <IPRequestTreeChart 
        data={stats.ipRequestStats} 
        onBlockIP={handleBlockIP}
      />

      {/* Manual IP Blocking */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
                            <i className="icon-[lucide--user-minus] size-5 text-red-600" />
            Bloqueo Manual de IPs
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              placeholder="Ej: 192.168.1.1"
              label="Dirección IP"
              value={newBlockIP}
              onValueChange={setNewBlockIP}
            />
            <Input
              placeholder="Ej: Actividad sospechosa detectada"
              label="Razón (opcional)"
              value={blockReason}
              onValueChange={setBlockReason}
            />
            <Button
              color="danger"
              onPress={handleManualBlockIP}
              disabled={!newBlockIP}
              startContent={<i className="icon-[lucide--ban] size-4" />}
            >
              Bloquear IP
            </Button>
          </div>
          
          <p className="text-xs text-gray-500">
            Las IPs bloqueadas manualmente permanecerán bloqueadas hasta que se desbloqueen manualmente.
          </p>
        </div>
      </Card>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Blocked IPs */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <i className="icon-[lucide--ban] size-5 text-red-600" />
                IPs Bloqueadas
              </h3>
              <Chip color="danger" size="sm">{stats.blockedIPs.length}</Chip>
            </div>
            
            {stats.blockedIPs.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay IPs bloqueadas</p>
            ) : (
              <div className="space-y-2">
                {stats.blockedIPs.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-mono text-sm">{ip}</span>
                    <Button
                      size="sm"
                      color="primary"
                      variant="flat"
                      onPress={() => handleUnblockIP(ip)}
                    >
                      Desbloquear
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Whitelist Management */}
        <Card className="p-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <i className="icon-[lucide--shield-check] size-5 text-green-600" />
              Gestión de Whitelist
            </h3>
            
            <div className="flex gap-2">
              <Input
                placeholder="Ej: 192.168.1.1"
                value={newWhitelistIP}
                onValueChange={setNewWhitelistIP}
                className="flex-1"
              />
              <Button
                color="success"
                onPress={handleAddToWhitelist}
                disabled={!newWhitelistIP}
              >
                Agregar
              </Button>
            </div>
            
            <p className="text-xs text-gray-500">
              Las IPs en la whitelist no están sujetas a rate limiting ni verificación de captcha.
            </p>

            {/* Show current whitelisted IPs */}
            {whitelistData.whitelistedIPs.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">IPs en Whitelist:</h4>
                {whitelistData.whitelistedIPs.map((ip) => (
                  <div key={ip} className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <span className="font-mono text-sm">{ip}</span>
                    <Button
                      size="sm"
                      color="danger"
                      variant="flat"
                      onPress={() => handleRemoveFromWhitelist(ip)}
                    >
                      Eliminar
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Recent Attacks */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <i className="icon-[lucide--activity] size-5 text-orange-600" />
            Actividad de Seguridad Reciente
          </h3>
          
          <Table aria-label="Recent security attacks">
            <TableHeader>
              <TableColumn>IP ADDRESS</TableColumn>
              <TableColumn>TIMESTAMP</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>REASON</TableColumn>
            </TableHeader>
            <TableBody>
              {stats.recentAttacks.map((attack, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span className="font-mono text-sm">{attack.ip}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(attack.timestamp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={getAttackTypeColor(attack.type)}
                      size="sm"
                    >
                      {attack.type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{attack.reason}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Recent Legitimate Activities */}
      <Card className="p-6">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <i className="icon-[lucide--check-circle] size-5 text-green-600" />
            Actividades Legítimas Recientes
          </h3>
          
          <Table aria-label="Recent legitimate activities">
            <TableHeader>
              <TableColumn>IP ADDRESS</TableColumn>
              <TableColumn>TIMESTAMP</TableColumn>
              <TableColumn>TYPE</TableColumn>
              <TableColumn>DETAILS</TableColumn>
            </TableHeader>
            <TableBody>
              {stats.recentActivities.map((activity, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <span className="font-mono text-sm">{activity.ip}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600">
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      color={getActivityTypeColor(activity.type)}
                      size="sm"
                    >
                      {activity.type}
                    </Chip>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{activity.details}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
} 