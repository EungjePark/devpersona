import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";

/**
 * Cloudflare R2 Upload API (Free tier: 10GB storage, 1M writes/month)
 *
 * Environment variables required:
 * - R2_ACCOUNT_ID: Your Cloudflare account ID
 * - R2_ACCESS_KEY_ID: R2 API token access key ID
 * - R2_SECRET_ACCESS_KEY: R2 API token secret access key
 * - R2_BUCKET_NAME: Your R2 bucket name
 * - R2_PUBLIC_URL: Public URL for the bucket (e.g., https://pub-xxx.r2.dev or custom domain)
 *
 * Usage:
 * POST /api/upload with FormData containing 'file' field
 */

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID;
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID;
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY;
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME;
const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL;

// Initialize S3 client for R2
const getR2Client = () => {
  if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
    return null;
  }
  return new S3Client({
    region: "auto",
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID,
      secretAccessKey: R2_SECRET_ACCESS_KEY,
    },
  });
};

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types (SVG excluded - XSS risk)
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

// Get file extension from MIME type
const getExtension = (mimeType: string): string => {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
  };
  return map[mimeType] || "bin";
};

// Generate unique filename
const generateFilename = (originalName: string, mimeType: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const ext = getExtension(mimeType);
  const safeName = originalName
    .replace(/\.[^/.]+$/, "") // Remove extension
    .replace(/[^a-zA-Z0-9-_]/g, "_") // Sanitize
    .substring(0, 32); // Limit length
  return `uploads/${timestamp}-${random}-${safeName}.${ext}`;
};

export async function POST(request: NextRequest) {
  try {
    const r2Client = getR2Client();

    // Check environment variables
    if (!r2Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      console.error("Missing R2 credentials");
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: "Invalid file type. Allowed: JPEG, PNG, GIF, WebP" },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = generateFilename(file.name, file.type);

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
      // Optional metadata
      Metadata: {
        originalName: file.name,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    // Construct public URL
    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    return NextResponse.json({
      success: true,
      id: key,
      url: publicUrl,
      filename: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Direct URL upload (fetch and store)
export async function PUT(request: NextRequest) {
  try {
    const r2Client = getR2Client();

    if (!r2Client || !R2_BUCKET_NAME || !R2_PUBLIC_URL) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL format with SSRF protection
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return NextResponse.json(
          { error: "Only HTTP(S) URLs allowed" },
          { status: 400 }
        );
      }
      const host = parsedUrl.hostname.toLowerCase();
      if (
        host === "localhost" ||
        host === "127.0.0.1" ||
        host.startsWith("10.") ||
        host.startsWith("192.168.") ||
        host.startsWith("169.254.") ||
        host.endsWith(".local")
      ) {
        return NextResponse.json(
          { error: "Invalid URL" },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        "User-Agent": "DevPersona/1.0 ImageFetcher",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch image from URL" },
        { status: 400 }
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Validate content type
    if (!ALLOWED_TYPES.some((t) => contentType.startsWith(t))) {
      return NextResponse.json(
        { error: "URL does not point to a valid image" },
        { status: 400 }
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Check size
    if (buffer.length > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Image too large. Maximum size: 10MB" },
        { status: 400 }
      );
    }

    // Generate filename from URL
    const urlFilename = parsedUrl.pathname.split("/").pop() || "image";
    const key = generateFilename(urlFilename, contentType.split(";")[0]);

    // Upload to R2
    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      Metadata: {
        sourceUrl: url,
        uploadedAt: new Date().toISOString(),
      },
    });

    await r2Client.send(command);

    const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, "")}/${key}`;

    return NextResponse.json({
      success: true,
      id: key,
      url: publicUrl,
      size: buffer.length,
      type: contentType,
    });
  } catch (error) {
    console.error("URL upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload from URL" },
      { status: 500 }
    );
  }
}

// Delete image
export async function DELETE(request: NextRequest) {
  try {
    const r2Client = getR2Client();

    if (!r2Client || !R2_BUCKET_NAME) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    const { searchParams } = new URL(request.url);
    const imageId = searchParams.get("id");

    if (!imageId) {
      return NextResponse.json(
        { error: "No image ID provided" },
        { status: 400 }
      );
    }

    // Validate key format (must be in uploads/ folder)
    if (!imageId.startsWith("uploads/") || imageId.includes("..")) {
      return NextResponse.json(
        { error: "Invalid image ID format" },
        { status: 400 }
      );
    }

    const command = new DeleteObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: imageId,
    });

    await r2Client.send(command);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
