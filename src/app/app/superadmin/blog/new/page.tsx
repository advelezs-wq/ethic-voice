import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { BlogPostForm } from "@/modules/blog/components/BlogPostForm";

export default async function NewBlogPostPage() {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          Nueva entrada
        </h1>
        <p className="mt-1 text-sm text-default-500">
          Redacta el contenido y elige borrador o publicado.
        </p>
      </div>
      <BlogPostForm mode="create" />
    </div>
  );
}
