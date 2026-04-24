"use client";

import { useRef } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapImage from "@tiptap/extension-image";
import TiptapLink from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import { Button } from "@heroui/react";

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

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Underline,
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: "https",
      }),
      TiptapImage.configure({ allowBase64: false }),
      Placeholder.configure({
        placeholder: "Escribe el artículo… Usa la barra para dar formato e insertar imágenes.",
      }),
    ],
    content: initialHtml || "<p></p>",
    editorProps: {
      attributes: {
        class:
          "min-h-[280px] focus:outline-none px-3 py-2 text-sm leading-relaxed [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:text-lg [&_h3]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:border-default-300 [&_blockquote]:pl-3 [&_blockquote]:italic",
      },
    },
    onUpdate: ({ editor: ed }) => onHtmlChange(ed.getHTML()),
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

  if (!editor) {
    return (
      <div className="min-h-[300px] animate-pulse rounded-medium border border-default-200 bg-default-100" />
    );
  }

  return (
    <div className="rounded-medium border border-default-200 bg-white overflow-hidden">
      <div className="flex flex-wrap gap-1 border-b border-default-200 bg-default-50 px-2 py-2">
        <Button
          size="sm"
          variant="flat"
          onPress={() => editor.chain().focus().toggleBold().run()}
          className={editor.isActive("bold") ? "bg-primary-100" : ""}
        >
          <i className="icon-[lucide--bold] size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={() => editor.chain().focus().toggleItalic().run()}
          className={editor.isActive("italic") ? "bg-primary-100" : ""}
        >
          <i className="icon-[lucide--italic] size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={() => editor.chain().focus().toggleUnderline().run()}
          className={editor.isActive("underline") ? "bg-primary-100" : ""}
        >
          <i className="icon-[lucide--underline] size-4" aria-hidden />
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
          onPress={() => editor.chain().focus().toggleBulletList().run()}
          className={editor.isActive("bulletList") ? "bg-primary-100" : ""}
        >
          <i className="icon-[lucide--list] size-4" aria-hidden />
        </Button>
        <Button
          size="sm"
          variant="flat"
          onPress={() => editor.chain().focus().toggleOrderedList().run()}
          className={editor.isActive("orderedList") ? "bg-primary-100" : ""}
        >
          <i className="icon-[lucide--list-ordered] size-4" aria-hidden />
        </Button>
        <Button size="sm" variant="flat" onPress={setLink}>
          <i className="icon-[lucide--link] size-4" aria-hidden />
        </Button>
        <Button size="sm" variant="flat" onPress={pickImage}>
          <i className="icon-[lucide--image-plus] size-4" aria-hidden />
        </Button>
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
