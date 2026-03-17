import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { securityManager, getClientIP } from '@/modules/app/lib/security/rate-limiter';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function POST(request: NextRequest) {
  try {
    const clientIP = getClientIP(request);
    const userAgent = request.headers.get('user-agent') || '';
    
    // Apply rate limiting for uploads
    const rateLimitResult = await securityManager.checkRateLimit({
      type: 'upload',
      identifier: clientIP,
      additionalChecks: {
        userAgent,
      },
    });

    if (!rateLimitResult.allowed) {
      securityManager.logAttack(clientIP, 'Rate Limit', 'Upload rate limit exceeded');
      return NextResponse.json(
        { error: 'Too many upload requests. Please wait before trying again.' },
        { status: 429 }
      );
    }

    // Track upload request
    securityManager.trackIPRequest(clientIP, 'upload');

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const orgId = formData.get('orgId') as string;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Maximum size is 50MB' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'audio/mpeg', 'audio/wav', 'audio/mp4',
      'video/mp4', 'video/avi', 'video/quicktime', 'video/webm'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'File type not allowed' }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = buffer.toString('base64');
    const dataURI = `data:${file.type};base64,${base64}`;

    // Upload to Cloudinary
    const uploadResponse = await cloudinary.uploader.upload(dataURI, {
      folder: `reports/${orgId}/temp-attachments`,
      resource_type: 'auto',
                max_file_size: 50000000,
      allowed_formats: ['jpg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'mp3', 'mp4', 'avi', 'mov', 'xlsx', 'txt', 'wav'],
    });

    // Log successful file upload activity
    securityManager.logActivity(
      clientIP, 
      'File Upload', 
      `File uploaded: ${file.name} (${Math.round(file.size / 1024)}KB)`
    );

    return NextResponse.json({
      success: true,
      attachment: {
        filename: file.name,
        fileUrl: uploadResponse.secure_url,
        fileSize: file.size,
        mimeType: file.type,
        cloudinaryPublicId: uploadResponse.public_id,
      },
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
} 