import { NextRequest, NextResponse } from "next/server";

/**
 * Cloudflare Images Upload API
 *
 * Environment variables required:
 * - CLOUDFLARE_ACCOUNT_ID: Your Cloudflare account ID
 * - CLOUDFLARE_API_TOKEN: API token with Images permissions
 *
 * Usage:
 * POST /api/upload with FormData containing 'file' field
 */

const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_IMAGES_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// Allowed MIME types (SVG excluded - XSS risk)
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

export async function POST(request: NextRequest) {
  try {
    // Check environment variables
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error("Missing Cloudflare credentials");
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

    // Prepare Cloudflare upload
    const cloudflareFormData = new FormData();
    cloudflareFormData.append("file", file);

    // Optional: Add metadata
    const metadata = formData.get("metadata");
    if (metadata) {
      cloudflareFormData.append("metadata", metadata as string);
    }

    // Upload to Cloudflare Images
    const response = await fetch(CLOUDFLARE_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: cloudflareFormData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Cloudflare upload failed:", result);
      return NextResponse.json(
        { error: result.errors?.[0]?.message || "Upload failed" },
        { status: response.status }
      );
    }

    // Return the image URL
    const imageData = result.result;

    return NextResponse.json({
      success: true,
      id: imageData.id,
      url: imageData.variants?.[0] || `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageData.id}/public`,
      variants: imageData.variants,
      filename: imageData.filename,
      uploaded: imageData.uploaded,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload image" },
      { status: 500 }
    );
  }
}

// Direct URL upload (for URL-based images)
export async function PUT(request: NextRequest) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return NextResponse.json(
        { error: "Image upload service not configured" },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { url, metadata } = body;

    if (!url) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Validate URL format with SSRF protection
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return NextResponse.json(
          { error: "Only HTTP(S) URLs allowed" },
          { status: 400 }
        );
      }
      const host = parsed.hostname.toLowerCase();
      if (
        host === 'localhost' ||
        host === '127.0.0.1' ||
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        host.startsWith('169.254.')
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

    // Upload from URL to Cloudflare
    const cloudflareFormData = new FormData();
    cloudflareFormData.append("url", url);
    if (metadata) {
      cloudflareFormData.append("metadata", JSON.stringify(metadata));
    }

    const response = await fetch(CLOUDFLARE_IMAGES_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
      body: cloudflareFormData,
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      console.error("Cloudflare URL upload failed:", result);
      return NextResponse.json(
        { error: result.errors?.[0]?.message || "Upload from URL failed" },
        { status: response.status }
      );
    }

    const imageData = result.result;

    return NextResponse.json({
      success: true,
      id: imageData.id,
      url: imageData.variants?.[0] || `https://imagedelivery.net/${CLOUDFLARE_ACCOUNT_ID}/${imageData.id}/public`,
      variants: imageData.variants,
      filename: imageData.filename,
      uploaded: imageData.uploaded,
    });
  } catch (error) {
    console.error("URL upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload from URL" },
      { status: 500 }
    );
  }
}

// Get upload status or delete image
export async function DELETE(request: NextRequest) {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
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

    // Validate UUID format to prevent injection
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(imageId)) {
      return NextResponse.json(
        { error: "Invalid image ID format" },
        { status: 400 }
      );
    }

    const response = await fetch(`${CLOUDFLARE_IMAGES_URL}/${imageId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return NextResponse.json(
        { error: result.errors?.[0]?.message || "Delete failed" },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 }
    );
  }
}
