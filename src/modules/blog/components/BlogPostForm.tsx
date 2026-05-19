"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
  Chip,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { BlogRichEditor } from "./BlogRichEditor";
import { BlogArticleBody } from "./BlogArticleBody";
import type { BlogPost } from "@prisma/client";
import { BlogPostStatus } from "@prisma/client";
import {
  showError,
  showSuccess,
  showWarning,
} from "@/modules/core/utils/safe-toast";
import Image from "next/image";

type Props = {
  mode: "create" | "edit";
  initialPost?: BlogPost;
};

export function BlogPostForm({ mode, initialPost }: Props) {
  const router = useRouter();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(initialPost?.title ?? "");
  const [slug, setSlug] = useState(initialPost?.slug ?? "");
  const [excerpt, setExcerpt] = useState(initialPost?.excerpt ?? "");
  const [contentHtml, setContentHtml] = useState(
    initialPost?.contentHtml ?? "<p></p>",
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialPost?.coverImageUrl ?? "",
  );
  const [status, setStatus] = useState<BlogPostStatus>(
    initialPost?.status ?? BlogPostStatus.DRAFT,
  );
  const [publishedAtLocal, setPublishedAtLocal] = useState(
    initialPost?.publishedAt
      ? new Date(initialPost.publishedAt).toISOString().slice(0, 16)
      : "",
  );
  const [metaTitle, setMetaTitle] = useState(initialPost?.metaTitle ?? "");
  const [metaDescription, setMetaDescription] = useState(
    initialPost?.metaDescription ?? "",
  );
  const [canonicalUrl, setCanonicalUrl] = useState(
    initialPost?.canonicalUrl ?? "",
  );
  const [ogImageUrl, setOgImageUrl] = useState(initialPost?.ogImageUrl ?? "");
  const [noIndex, setNoIndex] = useState(initialPost?.noIndex ?? false);
  const [saving, setSaving] = useState(false);
  const [hydratedDraft, setHydratedDraft] = useState(false);
  const [activeMode, setActiveMode] = useState<"edit" | "preview" | "seo">(
    "edit",
  );

  const draftStorageKey = `blog-post-form:${mode}:${initialPost?.id ?? "new"}`;

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 200);

  const htmlToPlainText = (html: string) =>
    html
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

  const contentStats = useMemo(() => {
    const plain = htmlToPlainText(contentHtml);
    const words = plain ? plain.split(" ").length : 0;
    const chars = plain.length;
    const readingMinutes = Math.max(1, Math.ceil(words / 220));
    return { words, chars, readingMinutes };
  }, [contentHtml]);

  const excerptLength = excerpt.trim().length;
  const excerptRecommendedMin = 80;
  const excerptRecommendedMax = 180;
  const metaTitleLength = metaTitle.trim().length;
  const metaDescriptionLength = metaDescription.trim().length;
  const slugPreview = slug.trim() || slugify(title) || "slug-del-articulo";
  const seoTitlePreview = metaTitle.trim() || title.trim() || "Título SEO";
  const seoDescriptionPreview =
    metaDescription.trim() ||
    excerpt.trim() ||
    "Descripción del artículo para buscadores.";
  const isPublishMode = status === BlogPostStatus.PUBLISHED;
  const previewHtml = useMemo(
    () =>
      contentHtml
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/\son\w+="[^"]*"/gi, "")
        .replace(/\son\w+='[^']*'/gi, "")
        .replace(/javascript:/gi, ""),
    [contentHtml],
  );
  const previewDate = isPublishMode
    ? publishedAtLocal
      ? new Date(publishedAtLocal)
      : new Date()
    : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (hydratedDraft) return;
    try {
      const raw = window.localStorage.getItem(draftStorageKey);
      if (!raw) {
        setHydratedDraft(true);
        return;
      }
      const parsed = JSON.parse(raw) as {
        title?: string;
        slug?: string;
        excerpt?: string;
        contentHtml?: string;
        coverImageUrl?: string;
        status?: BlogPostStatus;
        publishedAtLocal?: string;
        metaTitle?: string;
        metaDescription?: string;
        canonicalUrl?: string;
        ogImageUrl?: string;
        noIndex?: boolean;
      };

      const hasLocalChanges =
        (parsed.title && parsed.title !== (initialPost?.title ?? "")) ||
        (parsed.contentHtml &&
          parsed.contentHtml !== (initialPost?.contentHtml ?? "<p></p>"));

      if (hasLocalChanges) {
        setTitle(parsed.title ?? title);
        setSlug(parsed.slug ?? slug);
        setExcerpt(parsed.excerpt ?? excerpt);
        setContentHtml(parsed.contentHtml ?? contentHtml);
        setCoverImageUrl(parsed.coverImageUrl ?? coverImageUrl);
        setStatus(parsed.status ?? status);
        setPublishedAtLocal(parsed.publishedAtLocal ?? publishedAtLocal);
        setMetaTitle(parsed.metaTitle ?? metaTitle);
        setMetaDescription(parsed.metaDescription ?? metaDescription);
        setCanonicalUrl(parsed.canonicalUrl ?? canonicalUrl);
        setOgImageUrl(parsed.ogImageUrl ?? ogImageUrl);
        setNoIndex(parsed.noIndex ?? noIndex);
        showWarning(
          "Se recuperó un borrador local",
          "Puedes seguir editando desde donde lo dejaste.",
        );
      }
    } catch {
      // No interrumpe el flujo si localStorage falla.
    } finally {
      setHydratedDraft(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftStorageKey, hydratedDraft]);

  useEffect(() => {
    if (!hydratedDraft || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        draftStorageKey,
        JSON.stringify({
          title,
          slug,
          excerpt,
          contentHtml,
          coverImageUrl,
          status,
          publishedAtLocal,
          metaTitle,
          metaDescription,
          canonicalUrl,
          ogImageUrl,
          noIndex,
        }),
      );
    } catch {
      // Silencioso.
    }
  }, [
    title,
    slug,
    excerpt,
    contentHtml,
    coverImageUrl,
    status,
    publishedAtLocal,
    metaTitle,
    metaDescription,
    canonicalUrl,
    ogImageUrl,
    noIndex,
    hydratedDraft,
    draftStorageKey,
  ]);

  const uploadFile = async (file: File) => {
    const maxSizeMb = 8;
    if (file.size > maxSizeMb * 1024 * 1024) {
      throw new Error(`La imagen supera ${maxSizeMb}MB.`);
    }
    if (!file.type.startsWith("image/")) {
      throw new Error("Solo se permiten archivos de imagen.");
    }

    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/superadmin/blog/upload", {
      method: "POST",
      body: fd,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo subir");
    return data.url as string;
  };

  const onCoverFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const url = await uploadFile(file);
      setCoverImageUrl(url);
      showSuccess("Portada actualizada");
    } catch (err: unknown) {
      showError(
        "Error al subir",
        err instanceof Error ? err.message : "Intenta de nuevo",
      );
    }
  };

  const save = async (targetStatus?: BlogPostStatus) => {
    if (!title.trim()) {
      showError("Falta el título", "Indica un título para la entrada.");
      return;
    }
    if (contentStats.words < 30) {
      showWarning(
        "Contenido muy corto",
        "Te recomendamos al menos 30 palabras para publicar.",
      );
    }
    const nextStatus = targetStatus ?? status;

    let publishedAtIso: string | null = null;
    if (nextStatus === BlogPostStatus.PUBLISHED) {
      if (publishedAtLocal) {
        const dt = new Date(publishedAtLocal);
        if (Number.isNaN(dt.getTime())) {
          showError(
            "Fecha inválida",
            "Revisa la fecha y hora de publicación programada.",
          );
          return;
        }
        publishedAtIso = dt.toISOString();
      } else {
        publishedAtIso = new Date().toISOString();
      }
    }

    setSaving(true);
    try {
      if (mode === "create") {
        const res = await fetch("/api/superadmin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            excerpt: excerpt.trim() || null,
            contentHtml,
            coverImageUrl: coverImageUrl || null,
            status: nextStatus,
            slug: slug.trim() || null,
            publishedAt: publishedAtIso,
            metaTitle: metaTitle.trim() || null,
            metaDescription: metaDescription.trim() || null,
            canonicalUrl: canonicalUrl.trim() || null,
            ogImageUrl: ogImageUrl.trim() || null,
            noIndex,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "No se pudo crear");
        }
        showSuccess(
          nextStatus === BlogPostStatus.PUBLISHED
            ? "Publicación creada y publicada"
            : "Borrador creado",
        );
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(draftStorageKey);
        }
        router.push(`/app/superadmin/blog/${data.post.id}/edit`);
        router.refresh();
        return;
      }

      if (!initialPost) return;
      const res = await fetch(`/api/superadmin/blog/${initialPost.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          excerpt: excerpt.trim() || null,
          contentHtml,
          coverImageUrl: coverImageUrl || null,
          status: nextStatus,
          slug: slug.trim() || null,
          publishedAt: publishedAtIso,
          metaTitle: metaTitle.trim() || null,
          metaDescription: metaDescription.trim() || null,
          canonicalUrl: canonicalUrl.trim() || null,
          ogImageUrl: ogImageUrl.trim() || null,
          noIndex,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }
      showSuccess(
        nextStatus === BlogPostStatus.PUBLISHED
          ? "Cambios guardados y entrada publicada"
          : "Borrador actualizado",
      );
      if (data.post?.slug && data.post.slug !== slug) {
        setSlug(data.post.slug);
      }
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(draftStorageKey);
      }
      router.refresh();
    } catch (err: unknown) {
      showError(
        "No se pudo guardar",
        err instanceof Error ? err.message : "Intenta de nuevo",
      );
    } finally {
      setSaving(false);
    }
  };

  const insertTemplate = (template: "checklist" | "caso" | "guia") => {
    const base =
      template === "checklist"
        ? `<h2>Checklist rápido</h2><ul><li>Punto clave 1</li><li>Punto clave 2</li><li>Punto clave 3</li></ul><h3>Siguiente paso</h3><p>Describe la acción recomendada para el equipo.</p>`
        : template === "caso"
          ? `<h2>Contexto del caso</h2><p>Describe el contexto inicial y los actores involucrados.</p><h3>Riesgo detectado</h3><p>Explica por qué es relevante para cumplimiento.</p><h3>Lección aprendida</h3><p>Resume aprendizajes accionables.</p>`
          : `<h2>Objetivo de la guía</h2><p>Define qué resolverá este artículo.</p><h3>Pasos recomendados</h3><ol><li>Paso 1</li><li>Paso 2</li><li>Paso 3</li></ol><h3>Indicadores de éxito</h3><p>Cómo medir resultados.</p>`;
    setContentHtml((prev) => `${prev}\n${base}`);
    showSuccess("Plantilla insertada");
  };

  return (
    <Card className="border border-emerald-100 bg-white/95 shadow-none">
      <CardBody className="gap-6">
        <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Título"
                value={title}
                onValueChange={setTitle}
                isRequired
              />
              <Input
                label="Slug (opcional)"
                placeholder="se-genera-desde-el-titulo"
                value={slug}
                onValueChange={setSlug}
                description="Si lo dejas vacío, se deriva del título."
              />
            </div>

            <Textarea
              label="Resumen"
              placeholder="Breve descripción para el listado y SEO"
              value={excerpt}
              onValueChange={setExcerpt}
              minRows={2}
              description="Ideal entre 80 y 180 caracteres para listados y SEO."
            />

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="flat"
                onPress={() => setSlug(slugify(title))}
              >
                Generar slug automático
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => insertTemplate("checklist")}
              >
                Insertar plantilla checklist
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => insertTemplate("caso")}
              >
                Insertar plantilla caso
              </Button>
              <Button
                size="sm"
                variant="light"
                onPress={() => insertTemplate("guia")}
              >
                Insertar plantilla guía
              </Button>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Portada</p>
              <div className="flex flex-wrap items-end gap-3">
                {coverImageUrl ? (
                  <div className="relative h-28 w-44 overflow-hidden rounded-lg border border-default-200">
                    <Image
                      src={coverImageUrl}
                      alt=""
                      fill
                      className="object-cover"
                    />
                  </div>
                ) : null}
                <div className="flex gap-2">
                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
                    className="hidden"
                    onChange={onCoverFile}
                  />
                  <Button
                    color="primary"
                    variant="flat"
                    onPress={() => coverInputRef.current?.click()}
                  >
                    Subir imagen
                  </Button>
                  {coverImageUrl ? (
                    <Button
                      variant="light"
                      onPress={() => setCoverImageUrl("")}
                    >
                      Quitar
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <Select
              label="Estado"
              selectedKeys={new Set([status])}
              onSelectionChange={(keys) => {
                const v = Array.from(keys)[0];
                if (
                  v === BlogPostStatus.DRAFT ||
                  v === BlogPostStatus.PUBLISHED
                ) {
                  setStatus(v);
                }
              }}
            >
              <SelectItem key={BlogPostStatus.DRAFT}>Borrador</SelectItem>
              <SelectItem key={BlogPostStatus.PUBLISHED}>Publicado</SelectItem>
            </Select>

            {isPublishMode ? (
              <Input
                type="datetime-local"
                label="Programar publicación"
                value={publishedAtLocal}
                onValueChange={setPublishedAtLocal}
                description="Si lo dejas vacío, se publicará en el momento de guardar."
              />
            ) : null}

            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-medium text-foreground">Contenido</p>
                <div className="inline-flex rounded-xl border border-default-200 bg-white p-1">
                  <Button
                    size="sm"
                    variant={activeMode === "edit" ? "flat" : "light"}
                    color={activeMode === "edit" ? "primary" : "default"}
                    onPress={() => setActiveMode("edit")}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant={activeMode === "preview" ? "flat" : "light"}
                    color={activeMode === "preview" ? "primary" : "default"}
                    onPress={() => setActiveMode("preview")}
                  >
                    Vista previa
                  </Button>
                  <Button
                    size="sm"
                    variant={activeMode === "seo" ? "flat" : "light"}
                    color={activeMode === "seo" ? "primary" : "default"}
                    onPress={() => setActiveMode("seo")}
                  >
                    SEO
                  </Button>
                </div>
              </div>

              {activeMode === "edit" ? (
                <BlogRichEditor
                  key={initialPost?.id ?? "new"}
                  initialHtml={contentHtml}
                  onHtmlChange={setContentHtml}
                  uploadImage={uploadFile}
                />
              ) : activeMode === "preview" ? (
                <div className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-b from-emerald-50/40 to-white">
                  <div className="border-b border-emerald-100 px-5 py-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-lime-700">
                      Blog · Vista previa
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold tracking-tight text-[#0d212c]">
                      {title.trim() || "Título del artículo"}
                    </h2>
                    {previewDate ? (
                      <p className="mt-2 text-xs font-semibold text-[#273c46]">
                        {new Intl.DateTimeFormat("es-MX", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        }).format(previewDate)}
                      </p>
                    ) : null}
                    {excerpt.trim() ? (
                      <p className="mt-3 text-sm leading-relaxed text-[#273c46]">
                        {excerpt.trim()}
                      </p>
                    ) : null}
                  </div>

                  {coverImageUrl ? (
                    <div className="relative aspect-[16/9] w-full border-b border-emerald-100 bg-slate-100">
                      <Image
                        src={coverImageUrl}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 100vw, 900px"
                      />
                    </div>
                  ) : null}

                  <div className="px-5 py-5">
                    <BlogArticleBody html={previewHtml || "<p></p>"} />
                  </div>
                </div>
              ) : (
                <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <Input
                      label="Meta título"
                      value={metaTitle}
                      onValueChange={setMetaTitle}
                      description="Recomendado entre 50 y 60 caracteres."
                      maxLength={160}
                    />
                    <Input
                      label="URL canónica (https)"
                      type="url"
                      value={canonicalUrl}
                      onValueChange={setCanonicalUrl}
                      placeholder="https://ethicvoice.co/blog/mi-articulo"
                    />
                  </div>

                  <Textarea
                    label="Meta descripción"
                    value={metaDescription}
                    onValueChange={setMetaDescription}
                    minRows={3}
                    maxRows={5}
                    maxLength={320}
                    description="Ideal entre 140 y 160 caracteres."
                  />

                  <Input
                    label="Imagen Open Graph (https)"
                    type="url"
                    value={ogImageUrl}
                    onValueChange={setOgImageUrl}
                    placeholder="https://cdn.ethicvoice.co/blog/og-mi-articulo.jpg"
                  />

                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-3 py-2">
                    <div>
                      <p className="text-sm font-semibold text-amber-900">
                        Indexación del artículo
                      </p>
                      <p className="text-xs text-amber-800">
                        {noIndex
                          ? "No indexar ni seguir enlaces (noindex,nofollow)."
                          : "Permitir indexación y seguimiento de enlaces."}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      color={noIndex ? "warning" : "success"}
                      variant="flat"
                      onPress={() => setNoIndex((prev) => !prev)}
                    >
                      {noIndex ? "No indexado" : "Indexable"}
                    </Button>
                  </div>

                  <div className="rounded-xl border border-default-200 bg-default-50 px-3 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-default-700">
                      Preview de buscador
                    </p>
                    <p className="mt-1 line-clamp-1 text-sm font-semibold text-[#1a0dab]">
                      {seoTitlePreview}
                    </p>
                    <p className="line-clamp-1 text-xs text-[#006621]">
                      {canonicalUrl.trim() ||
                        `https://ethicvoice.co/blog/${slugPreview}`}
                    </p>
                    <p className="mt-1 line-clamp-2 text-xs text-default-700">
                      {seoDescriptionPreview}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card className="border border-emerald-100 bg-emerald-50/40 shadow-none">
              <CardBody className="space-y-3">
                <p className="text-sm font-semibold text-emerald-900">
                  Estado del artículo
                </p>
                <div className="flex flex-wrap gap-2">
                  <Chip
                    color={isPublishMode ? "success" : "default"}
                    variant="flat"
                  >
                    {isPublishMode ? "Publicado" : "Borrador"}
                  </Chip>
                  <Chip color="primary" variant="flat">
                    {contentStats.words} palabras
                  </Chip>
                  <Chip color="secondary" variant="flat">
                    {contentStats.readingMinutes} min lectura
                  </Chip>
                </div>
                <p className="text-xs text-emerald-800">
                  URL pública:{" "}
                  <span className="font-mono">/blog/{slugPreview}</span>
                </p>
              </CardBody>
            </Card>

            <Card className="border border-amber-200 bg-amber-50/40 shadow-none">
              <CardBody className="space-y-2">
                <p className="text-sm font-semibold text-amber-900">
                  Calidad editorial
                </p>
                <p className="text-xs text-amber-900">
                  Resumen: {excerptLength} caracteres
                  {excerptLength < excerptRecommendedMin
                    ? " (muy corto)"
                    : excerptLength > excerptRecommendedMax
                      ? " (muy largo)"
                      : " (óptimo)"}
                </p>
                <p className="text-xs text-amber-900">
                  Contenido: {contentStats.chars} caracteres visibles
                </p>
                <p className="text-xs text-amber-900">
                  Meta título: {metaTitleLength} caracteres
                </p>
                <p className="text-xs text-amber-900">
                  Meta descripción: {metaDescriptionLength} caracteres
                </p>
              </CardBody>
            </Card>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            color="default"
            variant="flat"
            onPress={() => save(BlogPostStatus.DRAFT)}
            isLoading={saving}
          >
            Guardar borrador
          </Button>
          <Button
            color="primary"
            onPress={() => save(BlogPostStatus.PUBLISHED)}
            isLoading={saving}
          >
            Publicar / actualizar
          </Button>
          <Button
            variant="light"
            onPress={() => {
              if (typeof window !== "undefined") {
                window.localStorage.removeItem(draftStorageKey);
              }
              showSuccess("Borrador local limpiado");
            }}
          >
            Limpiar borrador local
          </Button>
          <Button
            variant="light"
            onPress={() => router.push("/app/superadmin/blog")}
          >
            Volver al listado
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
