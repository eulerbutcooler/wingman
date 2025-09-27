import { NextRequest, NextResponse } from "next/server";
import { db } from "@/services/db/drizzle";
import { files } from "@/services/db/schema/courses";
import { eq } from "drizzle-orm";
import { createClient } from "@supabase/supabase-js";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const [file] = await db
      .select()
      .from(files)
      .where(eq(files.id, params.id))
      .limit(1);
    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Return the public URL directly since you prefer public URLs over signed URLs
    return NextResponse.json({
      success: true,
      publicUrl: file.publicUrl,
      signedUrl: file.publicUrl, // For backward compatibility
      expiresIn: null, // Public URLs don't expire
    });
  } catch (err) {
    console.error("💥 Signed URL error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
