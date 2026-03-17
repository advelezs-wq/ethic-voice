import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import prisma from '@/modules/prisma/lib/prisma';

export async function GET() {
  try {
    const { orgId } = await auth();
    
    if (!orgId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get recent reports with attachments
    const reportsWithAttachments = await prisma.formSubmission.findMany({
      where: {
        orgId,
        attachments: {
          some: {}
        }
      },
      include: {
        attachments: {
          orderBy: { uploadedAt: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    // Get attachment statistics
    const stats = await prisma.reportAttachment.groupBy({
      by: ['mimeType'],
      where: {
        submission: {
          orgId
        }
      },
      _count: {
        id: true
      },
      _sum: {
        fileSize: true
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        reportsWithAttachments: reportsWithAttachments.map(report => ({
          id: report.id,
          createdAt: report.createdAt,
          source: report.source,
          attachmentCount: report.attachments.length,
          attachments: report.attachments.map(att => ({
            id: att.id,
            filename: att.filename,
            fileSize: att.fileSize,
            mimeType: att.mimeType,
            uploadedAt: att.uploadedAt,
            uploadedByName: att.uploadedByName
          }))
        })),
        stats: stats.map(stat => ({
          mimeType: stat.mimeType,
          count: stat._count.id,
          totalSize: stat._sum.fileSize || 0
        })),
        summary: {
          totalReportsWithAttachments: reportsWithAttachments.length,
          totalAttachments: reportsWithAttachments.reduce((sum, report) => sum + report.attachments.length, 0)
        }
      }
    });

  } catch (error) {
    console.error('Error in test attachments API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 