"use client";

import { useRef, useState } from "react";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectItem,
  Card,
  CardBody,
} from "@heroui/react";
import { useRouter } from "next/navigation";
import { BlogRichEditor } from "./BlogRichEditor";
import type { BlogPost } from "@prisma/client";
import { BlogPostStatus } from "@prisma/client";
import { showError, showSuccess } from "@/modules/core/utils/safe-toast";
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
    initialPost?.contentHtml ?? "<p></p>"
  );
  const [coverImageUrl, setCoverImageUrl] = useState(
    initialPost?.coverImageUrl ?? ""
  );
  const [status, setStatus] = useState<BlogPostStatus>(
    initialPost?.status ?? BlogPostStatus.DRAFT
  );
  const [saving, setSaving] = useState(false);

  const uploadFile = async (file: File) => {
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
        err instanceof Error ? err.message : "Intenta de nuevo"
      );
    }
  };

  const save = async () => {
    if (!title.trim()) {
      showError("Falta el título", "Indica un título para la entrada.");
      return;
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
            status,
            slug: slug.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "No se pudo crear");
        }
        showSuccess("Publicación creada");
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
          status,
          slug: slug.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "No se pudo guardar");
      }
      showSuccess("Cambios guardados");
      if (data.post?.slug && data.post.slug !== slug) {
        setSlug(data.post.slug);
      }
      router.refresh();
    } catch (err: unknown) {
      showError(
        "No se pudo guardar",
        err instanceof Error ? err.message : "Intenta de nuevo"
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardBody className="gap-6">
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
        />

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
                <Button variant="light" onPress={() => setCoverImageUrl("")}>
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
            if (v === BlogPostStatus.DRAFT || v === BlogPostStatus.PUBLISHED) {
              setStatus(v);
            }
          }}
        >
          <SelectItem key={BlogPostStatus.DRAFT}>Borrador</SelectItem>
          <SelectItem key={BlogPostStatus.PUBLISHED}>Publicado</SelectItem>
        </Select>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Contenido</p>
          <BlogRichEditor
            key={initialPost?.id ?? "new"}
            initialHtml={contentHtml}
            onHtmlChange={setContentHtml}
            uploadImage={uploadFile}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button color="primary" onPress={save} isLoading={saving}>
            Guardar
          </Button>
          <Button variant="light" onPress={() => router.push("/app/superadmin/blog")}>
            Volver al listado
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}
