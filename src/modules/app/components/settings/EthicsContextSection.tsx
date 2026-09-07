"use client";

import { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Chip,
  Input,
  Select,
  SelectItem,
  Switch,
  Textarea,
} from "@heroui/react";
import { addToast } from "@/modules/core/utils/safe-toast";
import {
  deleteEthicalDocument,
  getEthicalContext,
  listEthicalDocuments,
  setEthicalDocumentActive,
  upsertEthicalContext,
} from "@/actions/ethics-context.actions";
import {
  EthicalDocumentTypeValues,
  GovernanceEntry,
  SpecialCriterion,
} from "@/modules/app/lib/schemas/ethics-context";

interface EthicsContextSectionProps {
  organizationId: string;
}

interface DocumentRow {
  id: number;
  filename: string;
  fileUrl: string;
  documentType: string;
  version: string;
  isActive: boolean;
  uploadedAt: string | Date;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CODIGO_ETICA: "Código de Ética",
  REGLAMENTO_INTERNO: "Reglamento Interno",
  ANTICORRUPCION: "Anticorrupción",
  COMPRAS: "Compras y Contratación",
  GASTOS_VIAJE: "Gastos de Viaje",
  REGALOS: "Regalos y Hospitalidades",
  CONFLICTO_INTERES: "Conflictos de Interés",
  OTRO: "Otro",
};

export function EthicsContextSection({
  organizationId,
}: EthicsContextSectionProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [businessContext, setBusinessContext] = useState("");
  const [governance, setGovernance] = useState<GovernanceEntry[]>([]);
  const [criteria, setCriteria] = useState<SpecialCriterion[]>([]);
  const [documents, setDocuments] = useState<DocumentRow[]>([]);

  const [uploadType, setUploadType] = useState<string>("OTRO");
  const [uploadVersion, setUploadVersion] = useState("1.0");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [context, docs] = await Promise.all([
        getEthicalContext(organizationId),
        listEthicalDocuments(organizationId),
      ]);
      setBusinessContext(context?.businessContext || "");
      setGovernance(
        Array.isArray(context?.governanceStructure)
          ? (context!.governanceStructure as unknown as GovernanceEntry[])
          : []
      );
      setCriteria(
        Array.isArray(context?.specialCriteria)
          ? (context!.specialCriteria as unknown as SpecialCriterion[])
          : []
      );
      setDocuments(docs as unknown as DocumentRow[]);
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "No se pudo cargar el contexto ético",
        color: "danger",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId]);

  const saveContext = async () => {
    setSaving(true);
    try {
      await upsertEthicalContext(organizationId, {
        businessContext,
        governanceStructure: governance,
        specialCriteria: criteria,
      });
      addToast({
        title: "Contexto ético guardado",
        description: "Los cambios se aplicarán en el próximo triage de IA",
        color: "success",
      });
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo guardar",
        color: "danger",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("orgId", organizationId);
      formData.append("documentType", uploadType);
      formData.append("version", uploadVersion);

      const response = await fetch("/api/organization/ethics-context/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error || "Error al subir el documento");
      }

      addToast({
        title: "Documento cargado",
        description: `${file.name} fue agregado al contexto ético`,
        color: "success",
      });
      await load();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo subir el documento",
        color: "danger",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const toggleDocument = async (doc: DocumentRow) => {
    try {
      await setEthicalDocumentActive(organizationId, doc.id, !doc.isActive);
      await load();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo actualizar",
        color: "danger",
      });
    }
  };

  const removeDocument = async (doc: DocumentRow) => {
    try {
      await deleteEthicalDocument(organizationId, doc.id);
      addToast({
        title: "Documento eliminado",
        color: "success",
      });
      await load();
    } catch (error) {
      addToast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "No se pudo eliminar",
        color: "danger",
      });
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8 text-slate-400">
        Cargando contexto ético...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-slate-500 text-sm">
        Personaliza el contexto ético de tu organización. Esta información y
        los documentos cargados serán utilizados por la IA para analizar las
        denuncias y generar un triage alineado con tus políticas internas.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 1. Contexto de la organización */}
        <Card>
          <CardHeader>
            <h4 className="font-semibold text-[#0d212c]">
              1. Contexto de la organización
            </h4>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-500">
              Describe brevemente a qué se dedica tu organización, su
              propósito, operación y características relevantes.
            </p>
            <Textarea
              value={businessContext}
              onValueChange={setBusinessContext}
              minRows={5}
              maxLength={4000}
              placeholder="Somos una firma especializada en..."
            />
          </CardBody>
        </Card>

        {/* 2. Estructura de gobierno y ética */}
        <Card>
          <CardHeader>
            <h4 className="font-semibold text-[#0d212c]">
              2. Estructura de gobierno y ética
            </h4>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-500">
              Describe tu estructura de gobierno, comités, responsables y
              modelo de ética empresarial.
            </p>
            <div className="space-y-2">
              {governance.map((g, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Input
                    size="sm"
                    placeholder="Rol / comité"
                    value={g.role}
                    onValueChange={(v) =>
                      setGovernance((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, role: v } : item
                        )
                      )
                    }
                  />
                  <Input
                    size="sm"
                    placeholder="Detalle"
                    value={g.detail}
                    onValueChange={(v) =>
                      setGovernance((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, detail: v } : item
                        )
                      )
                    }
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() =>
                      setGovernance((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <i className="icon-[lucide--x] size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="flat"
              onPress={() =>
                setGovernance((prev) => [...prev, { role: "", detail: "" }])
              }
            >
              + Agregar
            </Button>
          </CardBody>
        </Card>

        {/* 3. Criterios éticos especiales */}
        <Card>
          <CardHeader>
            <h4 className="font-semibold text-[#0d212c]">
              3. Criterios éticos especiales
            </h4>
          </CardHeader>
          <CardBody className="space-y-3">
            <p className="text-xs text-slate-500">
              Define los principios, reglas y lineamientos éticos
              prioritarios de tu organización.
            </p>
            <div className="space-y-2">
              {criteria.map((c, idx) => (
                <div key={idx} className="flex gap-2 items-center">
                  <Switch
                    size="sm"
                    isSelected={c.active}
                    onValueChange={(v) =>
                      setCriteria((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, active: v } : item
                        )
                      )
                    }
                  />
                  <Input
                    size="sm"
                    placeholder="Ej: Cero tolerancia a la corrupción"
                    value={c.label}
                    onValueChange={(v) =>
                      setCriteria((prev) =>
                        prev.map((item, i) =>
                          i === idx ? { ...item, label: v } : item
                        )
                      )
                    }
                  />
                  <Button
                    isIconOnly
                    size="sm"
                    variant="light"
                    color="danger"
                    onPress={() =>
                      setCriteria((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    <i className="icon-[lucide--x] size-4" />
                  </Button>
                </div>
              ))}
            </div>
            <Button
              size="sm"
              variant="flat"
              onPress={() =>
                setCriteria((prev) => [...prev, { label: "", active: true }])
              }
            >
              + Agregar
            </Button>
          </CardBody>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button color="primary" onPress={saveContext} isLoading={saving}>
          Guardar contexto ético
        </Button>
      </div>

      {/* 4. Documentos y políticas internas */}
      <Card>
        <CardHeader className="flex items-center justify-between w-full">
          <h4 className="font-semibold text-[#0d212c]">
            4. Documentos y políticas internas
          </h4>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-xs text-slate-500">
            Carga los documentos que contienen tus políticas, códigos y
            lineamientos. La IA los analizará para alinearse a tu marco
            interno. Formatos admitidos: PDF, Word y texto plano (máx. 15MB).
          </p>

          <div className="flex flex-wrap items-end gap-3">
            <Select
              label="Tipo de documento"
              size="sm"
              className="max-w-xs"
              selectedKeys={[uploadType]}
              onSelectionChange={(keys) =>
                setUploadType(Array.from(keys)[0] as string)
              }
            >
              {EthicalDocumentTypeValues.map((type) => (
                <SelectItem key={type}>
                  {DOCUMENT_TYPE_LABELS[type] || type}
                </SelectItem>
              ))}
            </Select>
            <Input
              label="Versión"
              size="sm"
              className="max-w-[120px]"
              value={uploadVersion}
              onValueChange={setUploadVersion}
            />
            <Button
              color="primary"
              onPress={() => fileInputRef.current?.click()}
              isLoading={uploading}
            >
              <i className="icon-[lucide--upload] size-4 mr-2" />
              Subir documento
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              className="hidden"
              onChange={handleUpload}
              aria-label="Seleccionar documento del contexto ético"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b">
                  <th className="py-2 pr-4">Documento</th>
                  <th className="py-2 pr-4">Tipo</th>
                  <th className="py-2 pr-4">Versión</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Aún no hay documentos cargados
                    </td>
                  </tr>
                )}
                {documents.map((doc) => (
                  <tr key={doc.id} className="border-b last:border-0">
                    <td className="py-2 pr-4">
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {doc.filename}
                      </a>
                    </td>
                    <td className="py-2 pr-4">
                      {DOCUMENT_TYPE_LABELS[doc.documentType] ||
                        doc.documentType}
                    </td>
                    <td className="py-2 pr-4">v{doc.version}</td>
                    <td className="py-2 pr-4">
                      <Chip
                        size="sm"
                        color={doc.isActive ? "success" : "default"}
                        variant="flat"
                      >
                        {doc.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </td>
                    <td className="py-2 pr-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => toggleDocument(doc)}
                        >
                          {doc.isActive ? "Desactivar" : "Activar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="light"
                          color="danger"
                          onPress={() => removeDocument(doc)}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-slate-400">{documents.length} documentos cargados</p>
        </CardBody>
      </Card>

      {/* 5. Panel informativo */}
      <div className="bg-secondary rounded-lg p-4">
        <h5 className="font-medium text-[#0d212c] mb-3">
          <i className="icon-[lucide--sparkles] size-4 mr-2 inline" />
          ¿Cómo utiliza la IA esta información?
        </h5>
        <ol className="space-y-1 text-sm text-slate-600 list-decimal list-inside">
          <li>Analiza la denuncia recibida.</li>
          <li>Consulta tus políticas y documentos internos relevantes.</li>
          <li>Compara la situación con tu marco ético y normativo.</li>
          <li>Complementa con criterios generales y buenas prácticas.</li>
          <li>Genera el triage y recomendaciones alineadas a tu organización.</li>
        </ol>
        <p className="text-xs text-slate-500 mt-3">
          La información y documentos de cada organización están completamente
          aislados y protegidos. La IA solo accede al contexto de tu
          organización.
        </p>
      </div>
    </div>
  );
}
