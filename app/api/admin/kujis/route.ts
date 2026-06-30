import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseAdminClient } from "@/lib/supabase-admin";
import { getRequestUser } from "@/lib/auth";

const statusSchema = z.enum(["draft", "active", "paused"]);

const prizeSchema = z.object({
  rank: z.string().trim().min(1, "등급을 입력해주세요."),
  name: z.string().trim().min(1, "상품명을 입력해주세요."),
  quantity: z.coerce.number().int().positive("수량은 1개 이상이어야 합니다."),
  description: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().optional().default("")
});

const createKujiSchema = z.object({
  title: z.string().trim().min(2, "쿠지명을 입력해주세요."),
  slug: z.string().trim().optional().default(""),
  description: z.string().trim().optional().default(""),
  price: z.coerce.number().int().nonnegative("가격은 0원 이상이어야 합니다."),
  totalTickets: z.coerce.number().int().positive("총 티켓 수를 입력해주세요."),
  status: statusSchema.default("draft"),
  lastOnePrizeName: z.string().trim().optional().default(""),
  imageUrl: z.string().trim().optional().default(""),
  prizes: z.array(prizeSchema).min(1, "상품을 1개 이상 입력해주세요.")
});

type PrizeInput = z.infer<typeof prizeSchema>;

function toSlug(rawSlug: string, title: string) {
  const base = (rawSlug || title)
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54);

  return base || `kuji-${Date.now()}`;
}

function nullableText(value?: string) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length ? trimmed : null;
}

function shuffle<T>(items: T[]) {
  const copied = [...items];
  for (let i = copied.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
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

async function cleanupKuji(kujiId: string) {
  const admin = createSupabaseAdminClient();
  await admin.from("kujis").delete().eq("id", kujiId);
}

export async function POST(request: NextRequest) {
  const auth = await getAdminUserId(request);
  if (auth.error) return auth.error;

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ message: "요청 형식이 올바르지 않습니다." }, { status: 400 });
  }

  const parsed = createKujiSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json({ message: parsed.error.issues[0]?.message ?? "입력값을 확인해주세요." }, { status: 400 });
  }

  const input = parsed.data;
  const prizeQuantityTotal = input.prizes.reduce((sum: number, prize: PrizeInput) => sum + prize.quantity, 0);

  if (prizeQuantityTotal !== input.totalTickets) {
    return NextResponse.json(
      { message: `상품 수량 합계(${prizeQuantityTotal})와 총 티켓 수(${input.totalTickets})가 같아야 합니다.` },
      { status: 400 }
    );
  }

  const admin = createSupabaseAdminClient();
  const slug = toSlug(input.slug, input.title);

  const { data: kuji, error: kujiError } = await admin
    .from("kujis")
    .insert({
      title: input.title,
      slug,
      description: input.description,
      price: input.price,
      total_tickets: input.totalTickets,
      status: input.status,
      last_one_prize_name: nullableText(input.lastOnePrizeName),
      image_url: nullableText(input.imageUrl),
      created_by: auth.userId
    })
    .select("id, slug")
    .single();

  if (kujiError || !kuji) {
    const duplicateSlug = kujiError?.code === "23505";
    return NextResponse.json(
      { message: duplicateSlug ? "이미 사용 중인 URL 슬러그입니다." : kujiError?.message ?? "쿠지 등록에 실패했습니다." },
      { status: duplicateSlug ? 409 : 500 }
    );
  }

  try {
    const insertedPrizes: Array<PrizeInput & { id: string }> = [];

    for (const prize of input.prizes) {
      const { data, error } = await admin
        .from("prizes")
        .insert({
          kuji_id: kuji.id,
          rank: prize.rank,
          name: prize.name,
          description: prize.description,
          quantity: prize.quantity,
          image_url: nullableText(prize.imageUrl)
        })
        .select("id")
        .single();

      if (error || !data) {
        throw new Error(error?.message ?? "상품 등록에 실패했습니다.");
      }

      insertedPrizes.push({ ...prize, id: data.id });
    }

    const prizePool = insertedPrizes.flatMap((prize) => Array.from({ length: prize.quantity }, () => prize.id));
    const randomizedPrizePool = shuffle(prizePool);

    const ticketRows = randomizedPrizePool.map((prizeId, index) => ({
      kuji_id: kuji.id,
      ticket_no: index + 1,
      prize_id: prizeId,
      status: "available" as const
    }));

    const { error: ticketError } = await admin.from("kuji_tickets").insert(ticketRows);
    if (ticketError) {
      throw new Error(ticketError.message);
    }

    await admin.from("admin_logs").insert({
      actor_id: auth.userId,
      action: "kuji.create",
      detail: {
        kuji_id: kuji.id,
        slug: kuji.slug,
        title: input.title,
        total_tickets: input.totalTickets,
        status: input.status
      }
    });

    return NextResponse.json({
      message: "쿠지가 등록되었습니다.",
      kuji: { id: kuji.id, slug: kuji.slug }
    });
  } catch (error) {
    await cleanupKuji(kuji.id);
    const message = error instanceof Error ? error.message : "쿠지 등록 중 오류가 발생했습니다.";
    return NextResponse.json({ message }, { status: 500 });
  }
}
