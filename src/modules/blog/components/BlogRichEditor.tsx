"use client";

import { useReducer, useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextAlign from "@tiptap/extension-text-align";
import Highlight from "@tiptap/extension-highlight";
import {
  TextStyle,
  Color,
  FontSize,
  LineHeight,
} from "@tiptap/extension-text-style";
import { Button } from "@heroui/react";

const FONT_SIZES = ["12px", "14px", "16px", "18px", "20px", "24px", "28px", "32px"] as const;

const LINE_HEIGHTS: { key: string; label: string }[] = [
  { key: "", label: "Interlineado" },
  { key: "1.25", label: "1.25" },
  { key: "1.5", label: "1.5" },
  { key: "1.75", label: "1.75" },
  { key: "2", label: "2" },
  { key: "2.5", label: "2.5" },
];

function ToolbarDivider() {
  return <span className="mx-0.5 hidden h-6 w-px shrink-0 bg-default-200 sm:block" aria-hidden />;
}

type Props = {
  initialHtml: string;
  onHtmlChange: (html: string) => void;
  uploadImage: (file: File) => Promise<string>;
};

export function BlogRichEditor({
  initialHtml,
  onHtmlChange,
  uploadImage,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const textColorRef = useRef<HTMLInputElement>(null);
  const highlightColorRef = useRef<HTMLInputElement>(null);
  const [, bumpToolbar] = useReducer((n: number) => n + 1, 0);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3, 4] },
        link: false,
      }),
      TextStyle,
      Color,
      FontSize,
      LineHeight,
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TiptapImage.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder:
          "Escribe el artículo… Usa la barra para dar formato e insertar imágenes.",
      }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] focus:outline-none px-3 py-2 text-sm leading-relaxed [&_h1]:text-2xl [&_h1]:font-semibold [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:text-base [&_h4]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_mark]:rounded-sm [&_mark]:px-0.5",
      },
    },
    onUpdate: ({ editor: ed }) => onHtmlChange(ed.getHTML()),
    onSelectionUpdate: bumpToolbar,
    onTransaction: bumpToolbar,
  });

  const setLink = () => {
    if (!editor) return;
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL del enlace", prev || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const pickImage = () => fileRef.current?.click();

  const onFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !editor) return;
    const url = await uploadImage(file);
    editor.chain().focus().setImage({ src: url }).run();
  };

  const clearFormatting = () => {
    if (!editor) return;
    editor
      .chain()
      .focus()
      .unsetAllMarks()
      .unsetLink()
      .unsetTextAlign()
      .unsetHighlight()
      .run();
  };

  const ts = editor?.getAttributes("textStyle") ?? {};
  const fontSizeKey = (ts.fontSize as string) || "default";
  const lineHeightKey = (ts.lineHeight as string) || "";

  if (!editor) {
    return (
      <div className="min-h-[300px] animate-pulse rounded-medium border border-default-200 bg-default-100" />
    );
  }

  return (
    <div className="overflow-hidden rounded-medium border border-default-200 bg-white">
      <div className="flex flex-col gap-2 border-b border-default-200 bg-default-50 px-2 py-2">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleBold().run()}
            className={editor.isActive("bold") ? "bg-primary-100" : ""}
            aria-label="Negrita"
          >
            <i className="icon-[lucide--bold] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleItalic().run()}
            className={editor.isActive("italic") ? "bg-primary-100" : ""}
            aria-label="Cursiva"
          >
            <i className="icon-[lucide--italic] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleUnderline().run()}
            className={editor.isActive("underline") ? "bg-primary-100" : ""}
            aria-label="Subrayado"
          >
            <i className="icon-[lucide--underline] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleStrike().run()}
            className={editor.isActive("strike") ? "bg-primary-100" : ""}
            aria-label="Tachado"
          >
            <i className="icon-[lucide--strikethrough] size-4" aria-hidden />
          </Button>

          <ToolbarDivider />

          <input
            ref={textColorRef}
            type="color"
            className="h-8 w-9 cursor-pointer rounded border border-default-200 bg-white p-0.5"
            title="Color de texto"
            aria-label="Color de texto"
            onChange={(e) => {
              const v = e.target.value;
              if (v) editor.chain().focus().setColor(v).run();
            }}
          />
          <input
            ref={highlightColorRef}
            type="color"
            className="h-8 w-9 cursor-pointer rounded border border-default-200 bg-white p-0.5"
            title="Resaltado"
            aria-label="Color de resaltado"
            defaultValue="#fef08a"
            onChange={(e) => {
              const v = e.target.value;
              if (v) {
                editor.chain().focus().setHighlight({ color: v }).run();
              }
            }}
          />
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().unsetHighlight().run()}
            aria-label="Quitar resaltado"
          >
            <i className="icon-[lucide--eraser] size-4" aria-hidden />
          </Button>

          <ToolbarDivider />

          <label className="sr-only" htmlFor="blog-editor-font-size">
            Tamaño de fuente
          </label>
          <select
            id="blog-editor-font-size"
            className="h-8 max-w-[6.5rem] rounded-lg border border-default-200 bg-white px-2 text-xs text-foreground"
            value={fontSizeKey}
            onChange={(e) => {
              const v = e.target.value;
              if (!v || v === "default") {
                editor.chain().focus().unsetFontSize().run();
              } else {
                editor.chain().focus().setFontSize(v).run();
              }
            }}
          >
            <option value="default">Tamaño</option>
            {FONT_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <label className="sr-only" htmlFor="blog-editor-line-height">
            Interlineado
          </label>
          <select
            id="blog-editor-line-height"
            className="h-8 max-w-[7.5rem] rounded-lg border border-default-200 bg-white px-2 text-xs text-foreground"
            value={lineHeightKey || "lh-default"}
            onChange={(e) => {
              const v = e.target.value;
              if (!v || v === "lh-default") {
                editor.chain().focus().unsetLineHeight().run();
              } else {
                editor.chain().focus().setLineHeight(v).run();
              }
            }}
          >
            <option value="lh-default">Interlineado</option>
            {LINE_HEIGHTS.filter((x) => x.key).map(({ key, label }) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <ToolbarDivider />

          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().setTextAlign("left").run()}
            className={
              editor.isActive({ textAlign: "left" }) ? "bg-primary-100" : ""
            }
            aria-label="Alinear izquierda"
          >
            <i className="icon-[lucide--align-left] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().setTextAlign("center").run()}
            className={
              editor.isActive({ textAlign: "center" }) ? "bg-primary-100" : ""
            }
            aria-label="Centrar"
          >
            <i className="icon-[lucide--align-center] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().setTextAlign("right").run()}
            className={
              editor.isActive({ textAlign: "right" }) ? "bg-primary-100" : ""
            }
            aria-label="Alinear derecha"
          >
            <i className="icon-[lucide--align-right] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().setTextAlign("justify").run()}
            className={
              editor.isActive({ textAlign: "justify" }) ? "bg-primary-100" : ""
            }
            aria-label="Justificar"
          >
            <i className="icon-[lucide--align-justify] size-4" aria-hidden />
          </Button>

          <ToolbarDivider />

          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={
              editor.isActive("heading", { level: 1 }) ? "bg-primary-100" : ""
            }
          >
            H1
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={
              editor.isActive("heading", { level: 2 }) ? "bg-primary-100" : ""
            }
          >
            H2
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            className={
              editor.isActive("heading", { level: 3 }) ? "bg-primary-100" : ""
            }
          >
            H3
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() =>
              editor.chain().focus().toggleHeading({ level: 4 }).run()
            }
            className={
              editor.isActive("heading", { level: 4 }) ? "bg-primary-100" : ""
            }
          >
            H4
          </Button>

          <ToolbarDivider />

          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleBulletList().run()}
            className={editor.isActive("bulletList") ? "bg-primary-100" : ""}
            aria-label="Lista con viñetas"
          >
            <i className="icon-[lucide--list] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleOrderedList().run()}
            className={editor.isActive("orderedList") ? "bg-primary-100" : ""}
            aria-label="Lista numerada"
          >
            <i className="icon-[lucide--list-ordered] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().toggleBlockquote().run()}
            className={editor.isActive("blockquote") ? "bg-primary-100" : ""}
            aria-label="Cita"
          >
            <i className="icon-[lucide--quote] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={() => editor.chain().focus().setHorizontalRule().run()}
            aria-label="Línea horizontal"
          >
            <i className="icon-[lucide--minus] size-4" aria-hidden />
          </Button>

          <ToolbarDivider />

          <Button size="sm" variant="flat" onPress={setLink} aria-label="Enlace">
            <i className="icon-[lucide--link] size-4" aria-hidden />
          </Button>
          <Button
            size="sm"
            variant="flat"
            onPress={pickImage}
            aria-label="Imagen"
          >
            <i className="icon-[lucide--image-plus] size-4" aria-hidden />
          </Button>

          <ToolbarDivider />

          <Button
            size="sm"
            variant="flat"
            onPress={clearFormatting}
            className="text-default-600"
            aria-label="Limpiar formato"
          >
            <i className="icon-[lucide--remove-formatting] size-4" aria-hidden />
          </Button>
        </div>

        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,image/avif"
          className="hidden"
          onChange={onFile}
        />
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
