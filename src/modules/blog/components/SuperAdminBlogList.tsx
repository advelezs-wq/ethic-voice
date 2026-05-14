"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Pagination,
  Select,
  SelectItem,
  Spinner,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from "@heroui/react";
import type { BlogPost } from "@prisma/client";
import { BlogPostStatus } from "@prisma/client";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type ListStatus = "ALL" | BlogPostStatus;

const STATUS_OPTIONS: { key: ListStatus; label: string }[] = [
  { key: "ALL", label: "Todos" },
  { key: BlogPostStatus.DRAFT, label: "Borradores" },
  { key: BlogPostStatus.PUBLISHED, label: "Publicados" },
];

function useDebouncedCallback(fn: (value: string) => void, delayMs: number) {
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;
  return useCallback(
    (value: string) => {
      if (t.current) clearTimeout(t.current);
      t.current = setTimeout(() => {
        t.current = null;
        fnRef.current(value);
      }, delayMs);
    },
    [delayMs]
  );
}

export function SuperAdminBlogList() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const statusFilter = useMemo((): ListStatus => {
    const s = searchParams.get("status");
    if (s === BlogPostStatus.DRAFT || s === BlogPostStatus.PUBLISHED) return s;
    return "ALL";
  }, [searchParams]);

  const qParam = searchParams.get("q")?.trim() ?? "";
  const pageParam = Math.max(1, Number(searchParams.get("page")) || 1);

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [loading, setLoading] = useState(true);
  const [qDraft, setQDraft] = useState(qParam);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<BlogPost | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    setQDraft(qParam);
  }, [qParam]);

  const replaceQuery = useCallback(
    (updates: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v === null || v === "") next.delete(k);
        else next.set(k, v);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams]
  );

  const pushDebouncedQ = useDebouncedCallback((value: string) => {
    replaceQuery({
      q: value.trim() || null,
      page: "1",
    });
  }, 400);

  const onQChange = (value: string) => {
    setQDraft(value);
    pushDebouncedQ(value);
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (statusFilter !== "ALL") qs.set("status", statusFilter);
      if (qParam) qs.set("q", qParam);
      qs.set("page", String(pageParam));
      qs.set("pageSize", "20");

      const res = await fetch(`/api/superadmin/blog?${qs}`, { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      const totalVal = typeof data.total === "number" ? data.total : 0;
      const pageCountVal =
        typeof data.pageCount === "number" ? data.pageCount : 1;
      setPosts(data.posts ?? []);
      setTotal(totalVal);
      setPageCount(pageCountVal);
      if (pageParam > pageCountVal && pageCountVal >= 1) {
        replaceQuery({ page: String(pageCountVal) });
        return;
      }
      if (totalVal === 0 && pageParam > 1) {
        replaceQuery({ page: "1" });
        return;
      }
    } catch (e: unknown) {
      showError(
        "No se pudo cargar el blog",
        e instanceof Error ? e.message : ""
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, qParam, pageParam, replaceQuery]);

  useEffect(() => {
    load();
  }, [load]);

  const removeConfirmed = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/superadmin/blog/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        showError("No se pudo eliminar");
        return;
      }
      showSuccess("Entrada eliminada");
      setDeleteTarget(null);
      await load();
    } finally {
      setDeleting(false);
    }
  };

  const duplicate = async (post: BlogPost) => {
    setDuplicatingId(post.id);
    try {
      const res = await fetch(`/api/superadmin/blog/${post.id}/duplicate`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo duplicar");
      }
      showSuccess("Borrador creado a partir de la entrada");
      router.push(`/app/superadmin/blog/${data.post.id}/edit`);
    } catch (e: unknown) {
      showError(
        "Error al duplicar",
        e instanceof Error ? e.message : ""
      );
    } finally {
      setDuplicatingId(null);
    }
  };

  const rangeLabel = useMemo(() => {
    if (total === 0) return "Sin resultados";
    const from = (pageParam - 1) * 20 + 1;
    const to = Math.min(pageParam * 20, total);
    return `${from}–${to} de ${total}`;
  }, [total, pageParam]);

  return (
    <>
      <Card className="border border-emerald-200/60 bg-white/90 shadow-sm">
        <CardBody className="gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-[#0d212c]">Entradas del blog</h2>
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="light"
                size="sm"
                startContent={
                  <i className="icon-[lucide--refresh-cw] size-4" aria-hidden />
                }
                onPress={() => load()}
                isDisabled={loading}
              >
                Actualizar
              </Button>
              <Button
                as={Link}
                href="/blog"
                target="_blank"
                rel="noopener noreferrer"
                variant="flat"
                size="sm"
                startContent={
                  <i
                    className="icon-[lucide--external-link] size-4"
                    aria-hidden
                  />
                }
              >
                Ver blog público
              </Button>
              <Button
                as={Link}
                href="/app/superadmin/blog/new"
                color="primary"
                startContent={
                  <i className="icon-[lucide--plus] size-4" aria-hidden />
                }
              >
                Nueva entrada
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <Select
              label="Estado"
              selectedKeys={new Set([statusFilter])}
              className="min-w-[200px] max-w-xs"
              size="sm"
              disallowEmptySelection
              onSelectionChange={(keys) => {
                const k = Array.from(keys)[0] as ListStatus | undefined;
                if (!k) return;
                replaceQuery({
                  status: k === "ALL" ? null : k,
                  page: "1",
                });
              }}
            >
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.key}>{o.label}</SelectItem>
              ))}
            </Select>
            <Input
              label="Buscar"
              placeholder="Título o slug…"
              size="sm"
              value={qDraft}
              onValueChange={onQChange}
              className="min-w-[220px] max-w-md"
              startContent={
                <i
                  className="icon-[lucide--search] size-4 text-default-400"
                  aria-hidden
                />
              }
              onClear={() => {
                setQDraft("");
                replaceQuery({ q: null, page: "1" });
              }}
            />
            <p className="text-xs text-default-500 sm:ml-auto">{rangeLabel}</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Cargando entradas…" />
            </div>
          ) : (
            <>
              <Table aria-label="Entradas del blog">
                <TableHeader>
                  <TableColumn>Título</TableColumn>
                  <TableColumn>Estado</TableColumn>
                  <TableColumn>Actualizado</TableColumn>
                  <TableColumn align="end">Acciones</TableColumn>
                </TableHeader>
                <TableBody
                  emptyContent={
                    qParam || statusFilter !== "ALL"
                      ? "No hay entradas con estos filtros."
                      : "No hay entradas todavía."
                  }
                >
                  {posts.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{p.title}</span>
                          <span className="text-xs text-default-500">
                            /{p.slug}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="sm"
                          color={
                            p.status === BlogPostStatus.PUBLISHED
                              ? "success"
                              : "warning"
                          }
                          variant="flat"
                        >
                          {p.status === BlogPostStatus.PUBLISHED
                            ? "Publicado"
                            : "Borrador"}
                        </Chip>
                      </TableCell>
                      <TableCell>
                        {format(new Date(p.updatedAt), "d MMM yyyy HH:mm", {
                          locale: es,
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap justify-end gap-2">
                          {p.status === BlogPostStatus.PUBLISHED ? (
                            <Button
                              size="sm"
                              variant="light"
                              as={Link}
                              href={`/blog/${p.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              startContent={
                                <i
                                  className="icon-[lucide--eye] size-4"
                                  aria-hidden
                                />
                              }
                            >
                              Ver
                            </Button>
                          ) : null}
                          <Button
                            size="sm"
                            variant="bordered"
                            isLoading={duplicatingId === p.id}
                            onPress={() => duplicate(p)}
                            startContent={
                              duplicatingId === p.id ? undefined : (
                                <i
                                  className="icon-[lucide--copy] size-4"
                                  aria-hidden
                                />
                              )
                            }
                          >
                            Duplicar
                          </Button>
                          <Button
                            size="sm"
                            variant="flat"
                            as={Link}
                            href={`/app/superadmin/blog/${p.id}/edit`}
                          >
                            Editar
                          </Button>
                          <Button
                            size="sm"
                            variant="light"
                            color="danger"
                            onPress={() => setDeleteTarget(p)}
                          >
                            Eliminar
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {pageCount > 1 ? (
                <div className="flex justify-center pt-2">
                  <Pagination
                    total={pageCount}
                    page={pageParam}
                    onChange={(p) => replaceQuery({ page: String(p) })}
                    showControls
                    size="sm"
                  />
                </div>
              ) : null}
            </>
          )}
        </CardBody>
      </Card>

      <Modal
        isOpen={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        placement="center"
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            Eliminar entrada
          </ModalHeader>
          <ModalBody>
            <p className="text-sm text-default-600">
              ¿Seguro que quieres eliminar{" "}
              <span className="font-semibold text-foreground">
                {deleteTarget?.title}
              </span>
              ? Esta acción no se puede deshacer.
            </p>
          </ModalBody>
          <ModalFooter>
            <Button variant="light" onPress={() => setDeleteTarget(null)}>
              Cancelar
            </Button>
            <Button
              color="danger"
              onPress={removeConfirmed}
              isLoading={deleting}
            >
              Eliminar
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
