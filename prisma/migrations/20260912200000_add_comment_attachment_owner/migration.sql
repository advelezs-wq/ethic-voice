-- AlterTable: track who uploaded a chat attachment, so an orphaned
-- (commentId IS NULL) attachment can only later be claimed by a message
-- from that same user. ids are a plain sequential Int with no other
-- ownership check, so without this any authenticated user could attach
-- another user's still-orphaned upload (from a different report, even a
-- different organization) to their own message just by guessing a nearby
-- id — a cross-tenant IDOR data-leak.
ALTER TABLE "CommentAttachment" ADD COLUMN "uploadedByUserId" TEXT;
