import { isSuperAdmin } from "@/modules/core/utils/permissions";
import { currentUser } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import prisma from "@/modules/prisma/lib/prisma";
import { BlogPostForm } from "@/modules/blog/components/BlogPostForm";
import { BlogPostStatus } from "@prisma/client";
import Link from "next/link";

type Props = { params: Promise<{ id: string }> };

export default async function EditBlogPostPage({ params }: Props) {
  const user = await currentUser();
  const email = user?.emailAddresses?.[0]?.emailAddress || "";
  if (!email || !isSuperAdmin(email)) redirect("/app");

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({ where: { id } });
  if (!post) notFound();

  return (
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Editar entrada</h1>
        <p className="mt-1 text-sm text-default-500">
          Slug público:{" "}
          <span className="font-mono text-default-700">/blog/{post.slug}</span>
          {post.status === BlogPostStatus.PUBLISHED ? (
            <>
              {" · "}
              <Link
                href={`/blog/${post.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Ver en el sitio
              </Link>
            </>
          ) : null}
        </p>
      </div>
      <BlogPostForm mode="edit" initialPost={post} />
    </div>
  );
}
