"use client";

/**
 * Gestión de recursos descargables (lead magnets) desde Super Admin.
 * Permite crear/editar/eliminar recursos sin tocar código: título, descripción,
 * portada, archivo, URL personalizada, campaña y campos del formulario.
 */

import React, { useEffect, useRef, useState } from "react";
import {
  Button,
  Card,
  CardBody,
  Checkbox,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  Textarea,
  Tooltip,
} from "@heroui/react";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { ConfirmActionModal } from "./ConfirmActionModal";

interface MagnetRow {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  fileUrl: string;
  campaign: string;
  ctaLabel: string | null;
  formFields: { phone?: boolean; company?: boolean; role?: boolean } | null;
  isActive: boolean;
  visits: number;
  downloads: number;
  leads: number;
  createdAt: string;
}

interface EditorState {
  id: string | null;
  slug: string;
  title: string;
  description: string;
  coverImageUrl: string;
  fileUrl: string;
  campaign: string;
  ctaLabel: string;
  isActive: boolean;
  fieldPhone: boolean;
  fieldCompany: boolean;
  fieldRole: boolean;
}

const EMPTY_EDITOR: EditorState = {
  id: null,
  slug: "",
  title: "",
  description: "",
  coverImageUrl: "",
  fileUrl: "",
  campaign: "",
  ctaLabel: "",
  isActive: true,
  fieldPhone: true,
  fieldCompany: true,
  fieldRole: true,
};

export default function LeadMagnetsManager() {
  const [rows, setRows] = useState<MagnetRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [editor, setEditor] = useState<EditorState | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<MagnetRow | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/superadmin/lead-magnets", {
        cache: "no-store",
      });
      const data = await res.json();
      setRows(data.magnets || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => setEditor({ ...EMPTY_EDITOR });
  const openEdit = (row: MagnetRow) =>
    setEditor({
      id: row.id,
      slug: row.slug,
      title: row.title,
      description: row.description || "",
      coverImageUrl: row.coverImageUrl || "",
      fileUrl: row.fileUrl,
      campaign: row.campaign,
      ctaLabel: row.ctaLabel || "",
      isActive: row.isActive,
      fieldPhone: row.formFields?.phone !== false,
      fieldCompany: row.formFields?.company !== false,
      fieldRole: row.formFields?.role !== false,
    });

  const upload = async (file: File, kind: "cover" | "file") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);
    const res = await fetch("/api/superadmin/lead-magnets/upload", {
      method: "POST",
      body: formData,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Error al subir el archivo");
    return data.url as string;
  };

  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    try {
      setUploadingCover(true);
      const url = await upload(file, "cover");
      setEditor((prev) => (prev ? { ...prev, coverImageUrl: url } : prev));
      showSuccess("Portada subida");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploadingCover(false);
    }
  };

  const onDownloadableFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    try {
      setUploadingFile(true);
      const url = await upload(file, "file");
      setEditor((prev) => (prev ? { ...prev, fileUrl: url } : prev));
      showSuccess("Archivo descargable subido");
    } catch (err) {
      showError("Error", err instanceof Error ? err.message : "No se pudo subir");
    } finally {
      setUploadingFile(false);
    }
  };

  const save = async () => {
    if (!editor) return;
    if (!editor.title.trim()) {
      showError("Falta el título", "Escribe el título del recurso.");
      return;
    }
    if (!editor.fileUrl.trim()) {
      showError(
        "Falta el archivo",
        "Sube el archivo descargable o pega su URL."
      );
      return;
    }
    setSaving(true);
    try {
      const payload = {
        slug: editor.slug,
        title: editor.title,
        description: editor.description,
        coverImageUrl: editor.coverImageUrl,
        fileUrl: editor.fileUrl,
        campaign: editor.campaign,
        ctaLabel: editor.ctaLabel,
        isActive: editor.isActive,
        formFields: {
          phone: editor.fieldPhone,
          company: editor.fieldCompany,
          role: editor.fieldRole,
        },
      };
      const res = await fetch(
        editor.id
          ? `/api/superadmin/lead-magnets/${editor.id}`
          : "/api/superadmin/lead-magnets",
        {
          method: editor.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("No se pudo guardar", data.error || "Intenta nuevamente.");
        return;
      }
      showSuccess(
        editor.id ? "Recurso actualizado" : "Recurso creado",
        `Disponible en /recursos/${data.magnet?.slug || editor.slug}`
      );
      setEditor(null);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const runDelete = async (row: MagnetRow) => {
    try {
      setDeleteLoading(true);
      const res = await fetch(`/api/superadmin/lead-magnets/${row.id}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showError("No se pudo eliminar", data.error || "Intenta nuevamente.");
        return;
      }
      showSuccess("Recurso eliminado", `${row.title} fue eliminado.`);
      setPendingDelete(null);
      await load();
    } finally {
      setDeleteLoading(false);
    }
  };

  const copyUrl = async (slug: string) => {
    const url = `${window.location.origin}/recursos/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      showSuccess("URL copiada", url);
    } catch {
      showError("No se pudo copiar", url);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <Spinner label="Cargando recursos..." />
      </div>
    );
  }

  return (
    <>
      <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
        <CardBody>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-[#0d212c]">
                Recursos descargables
              </h2>
              <p className="text-sm text-default-500">
                Ebooks, guías, checklists y plantillas con captura de leads por
                campaña. Cada recurso publica su landing en /recursos/[url].
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="light" onPress={load} startContent={<i className="icon-[lucide--refresh-ccw] size-4" />}>
                Refrescar
              </Button>
              <Button
                color="primary"
                onPress={openCreate}
                startContent={<i className="icon-[lucide--plus] size-4" />}
              >
                Nuevo recurso
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-default-500">
                  <th className="py-2 pr-4">Recurso</th>
                  <th className="py-2 pr-4">URL</th>
                  <th className="py-2 pr-4">Campaña</th>
                  <th className="py-2 pr-4">Estado</th>
                  <th className="py-2 pr-4">Visitas</th>
                  <th className="py-2 pr-4">Descargas</th>
                  <th className="py-2 pr-4">Leads</th>
                  <th className="py-2 pr-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t border-default-100">
                    <td className="py-2 pr-4">
                      <span className="font-medium text-[#0d212c]">{r.title}</span>
                      <div className="text-xs text-default-500">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="py-2 pr-4">
                      <button
                        type="button"
                        onClick={() => copyUrl(r.slug)}
                        className="inline-flex items-center gap-1 text-emerald-700 hover:underline"
                        title="Copiar URL pública"
                      >
                        /recursos/{r.slug}
                        <i className="icon-[lucide--copy] size-3.5" />
                      </button>
                    </td>
                    <td className="py-2 pr-4">
                      <Chip size="sm" variant="flat">{r.campaign}</Chip>
                    </td>
                    <td className="py-2 pr-4">
                      <Chip size="sm" color={r.isActive ? "success" : "default"}>
                        {r.isActive ? "Activo" : "Inactivo"}
                      </Chip>
                    </td>
                    <td className="py-2 pr-4">{r.visits}</td>
                    <td className="py-2 pr-4">{r.downloads}</td>
                    <td className="py-2 pr-4">{r.leads}</td>
                    <td className="py-2 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <Tooltip content="Ver landing pública">
                          <Button
                            size="sm"
                            variant="light"
                            as="a"
                            href={`/recursos/${r.slug}`}
                            target="_blank"
                            startContent={<i className="icon-[lucide--external-link] size-4" />}
                          >
                            Ver
                          </Button>
                        </Tooltip>
                        <Button
                          size="sm"
                          variant="light"
                          onPress={() => openEdit(r)}
                          startContent={<i className="icon-[lucide--pencil] size-4" />}
                        >
                          Editar
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          variant="light"
                          onPress={() => setPendingDelete(r)}
                          startContent={<i className="icon-[lucide--trash-2] size-4" />}
                        >
                          Eliminar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr className="border-t border-default-100">
                    <td className="py-6 pr-4 text-sm text-default-500" colSpan={8}>
                      Aún no hay recursos. Crea el primero con &quot;Nuevo
                      recurso&quot;.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardBody>
      </Card>

      {/* Editor modal */}
      <Modal
        isOpen={Boolean(editor)}
        onOpenChange={(open) => !open && setEditor(null)}
        size="2xl"
        scrollBehavior="inside"
        isDismissable={false}
      >
        <ModalContent>
          {editor && (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {editor.id ? "Editar recurso" : "Nuevo recurso descargable"}
                <span className="text-xs font-normal text-default-500">
                  La landing pública se publica en /recursos/[URL personalizada]
                </span>
              </ModalHeader>
              <ModalBody className="gap-4">
                <Input
                  label="Título"
                  isRequired
                  value={editor.title}
                  onValueChange={(v) =>
                    setEditor((p) => (p ? { ...p, title: v } : p))
                  }
                />
                <Textarea
                  label="Descripción"
                  minRows={3}
                  value={editor.description}
                  onValueChange={(v) =>
                    setEditor((p) => (p ? { ...p, description: v } : p))
                  }
                />
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Input
                    label="URL personalizada (slug)"
                    placeholder="guia-compliance-2026"
                    description="Se genera desde el título si se deja vacío"
                    value={editor.slug}
                    onValueChange={(v) =>
                      setEditor((p) => (p ? { ...p, slug: v } : p))
                    }
                    startContent={
                      <span className="text-xs text-default-400">/recursos/</span>
                    }
                  />
                  <Input
                    label="Campaña"
                    placeholder="guia_compliance_2026"
                    description="Los leads se registran con esta campaña"
                    value={editor.campaign}
                    onValueChange={(v) =>
                      setEditor((p) => (p ? { ...p, campaign: v } : p))
                    }
                  />
                </div>

                {/* Portada */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Imagen de portada</p>
                  <p className="text-xs text-default-500">
                    Recomendado 1200×900&nbsp;px (4:3). JPG, PNG o WebP, máx. 12MB.
                  </p>
                  <div className="flex items-center gap-3">
                    {editor.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={editor.coverImageUrl}
                        alt=""
                        className="h-20 w-28 rounded-lg border border-default-200 object-cover"
                      />
                    ) : null}
                    <input
                      ref={coverInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
                      className="hidden"
                      onChange={onCoverFile}
                    />
                    <Button
                      variant="flat"
                      isLoading={uploadingCover}
                      onPress={() => coverInputRef.current?.click()}
                    >
                      {editor.coverImageUrl ? "Cambiar portada" : "Subir portada"}
                    </Button>
                    {editor.coverImageUrl ? (
                      <Button
                        variant="light"
                        onPress={() =>
                          setEditor((p) => (p ? { ...p, coverImageUrl: "" } : p))
                        }
                      >
                        Quitar
                      </Button>
                    ) : null}
                  </div>
                </div>

                {/* Archivo descargable */}
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">
                    Archivo descargable <span className="text-danger">*</span>
                  </p>
                  <p className="text-xs text-default-500">
                    PDF, ZIP, Word, Excel o PowerPoint. Máx. 50MB. También puedes
                    pegar una URL externa.
                  </p>
                  <div className="flex items-center gap-3">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.zip,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                      className="hidden"
                      onChange={onDownloadableFile}
                    />
                    <Button
                      variant="flat"
                      color="primary"
                      isLoading={uploadingFile}
                      onPress={() => fileInputRef.current?.click()}
                      startContent={<i className="icon-[lucide--upload] size-4" />}
                    >
                      Subir archivo
                    </Button>
                  </div>
                  <Input
                    size="sm"
                    placeholder="https://…"
                    value={editor.fileUrl}
                    onValueChange={(v) =>
                      setEditor((p) => (p ? { ...p, fileUrl: v } : p))
                    }
                  />
                </div>

                <Input
                  label="Texto del botón (CTA)"
                  placeholder="Quiero descargar la guía"
                  value={editor.ctaLabel}
                  onValueChange={(v) =>
                    setEditor((p) => (p ? { ...p, ctaLabel: v } : p))
                  }
                />

                {/* Campos del formulario */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Campos del formulario</p>
                  <p className="text-xs text-default-500">
                    Nombre y correo siempre son obligatorios.
                  </p>
                  <div className="flex flex-wrap gap-4">
                    <Checkbox
                      isSelected={editor.fieldPhone}
                      onValueChange={(v) =>
                        setEditor((p) => (p ? { ...p, fieldPhone: v } : p))
                      }
                    >
                      Teléfono
                    </Checkbox>
                    <Checkbox
                      isSelected={editor.fieldCompany}
                      onValueChange={(v) =>
                        setEditor((p) => (p ? { ...p, fieldCompany: v } : p))
                      }
                    >
                      Empresa
                    </Checkbox>
                    <Checkbox
                      isSelected={editor.fieldRole}
                      onValueChange={(v) =>
                        setEditor((p) => (p ? { ...p, fieldRole: v } : p))
                      }
                    >
                      Cargo
                    </Checkbox>
                  </div>
                </div>

                <Switch
                  isSelected={editor.isActive}
                  onValueChange={(v) =>
                    setEditor((p) => (p ? { ...p, isActive: v } : p))
                  }
                >
                  Landing activa (visible al público)
                </Switch>
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={() => setEditor(null)} isDisabled={saving}>
                  Cancelar
                </Button>
                <Button
                  color="primary"
                  onPress={save}
                  isLoading={saving}
                  isDisabled={uploadingCover || uploadingFile}
                >
                  {editor.id ? "Guardar cambios" : "Crear recurso"}
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      {pendingDelete && (
        <ConfirmActionModal
          isOpen={Boolean(pendingDelete)}
          title="Eliminar recurso"
          description={`Vas a eliminar "${pendingDelete.title}". Su landing /recursos/${pendingDelete.slug} dejará de existir. Los leads ya capturados se conservan.`}
          confirmLabel="Eliminar"
          riskLevel="high"
          isLoading={deleteLoading}
          onClose={() => setPendingDelete(null)}
          onConfirm={() => runDelete(pendingDelete)}
        />
      )}
    </>
  );
}
