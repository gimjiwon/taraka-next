import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRequestUser } from "@/lib/auth";

export const runtime = "nodejs";

const BUCKET_NAME = "takara-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

function extensionFromMimeType(mimeType: string) {
  const map: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif"
  };
  return map[mimeType] ?? "jpg";
}

function sanitizeFolder(value: FormDataEntryValue | null) {
  const raw = typeof value === "string" ? value : "kuji";
  return raw.replace(/[^a-z0-9_-]/gi, "").toLowerCase() || "kuji";
}

async function getAdminUserId(request: NextRequest) {
  const user = await getRequestUser(request);
  if (!user) {
    return { error: NextResponse.json({ message: "로그인이 필요합니다." }, { status: 401 }) };
  }

  const admin = createSupabaseAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    return { error: NextResponse.json({ message: "관리자 권한이 필요합니다." }, { status: 403 }) };
  }

  return { userId: user.id };
}

async function ensureImageBucket() {
  const admin = createSupabaseAdminClient();
  const { data } = await admin.storage.getBucket(BUCKET_NAME);
  if (data) return;

  const { error } = await admin.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: MAX_FILE_SIZE,
    allowedMimeTypes: Array.from(ALLOWED_MIME_TYPES)
  });

  if (error && !/already exists/i.test(error.message)) {
    throw new Error(error.message);
  }
}

export async function POST(request: NextRequest) {
  const auth = await getAdminUserId(request);
  if (auth.error) return auth.error;

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ message: "이미지 업로드 요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ message: "업로드할 이미지 파일을 선택해주세요." }, { status: 400 });
  }

  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return NextResponse.json({ message: "JPG, PNG, WEBP, GIF 이미지만 업로드할 수 있습니다." }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "이미지 용량은 5MB 이하로 올려주세요." }, { status: 400 });
  }

  const folder = sanitizeFolder(formData.get("folder"));
  const ext = extensionFromMimeType(file.type);
  const path = `${folder}/${auth.userId}/${Date.now()}-${randomUUID()}.${ext}`;

  try {
    await ensureImageBucket();

    const admin = createSupabaseAdminClient();
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await admin.storage.from(BUCKET_NAME).upload(path, buffer, {
      contentType: file.type,
      cacheControl: "3600",
      upsert: false
    });

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    const { data } = admin.storage.from(BUCKET_NAME).getPublicUrl(path);

    await admin.from("admin_logs").insert({
      actor_id: auth.userId,
      action: "image.upload",
      detail: {
        bucket: BUCKET_NAME,
        path,
        size: file.size,
        mime_type: file.type
      }
    });

    return NextResponse.json({
      message: "이미지가 업로드되었습니다.",
      url: data.publicUrl,
      path,
      bucket: BUCKET_NAME
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
