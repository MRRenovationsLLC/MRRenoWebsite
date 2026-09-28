"use server";

import { revalidatePath } from "next/cache";
import { createServiceRoleClient } from "@/lib/supabase/server";

/**
 * Candidate admin actions.
 *
 * Kept in its own module (rather than the shared admin/actions.ts) so the
 * candidates screen can evolve without touching the leads / portfolio /
 * team actions, and so parallel PRs do not collide on one file.
 */

/**
 * Permanently delete a candidate application. This is for clearing spam and
 * test submissions -- there is no undo. The UI gates it behind opening the
 * row and a confirm prompt that names the candidate.
 *
 * The resume lives in the PRIVATE candidate-resumes bucket at
 * resume_storage_path. We remove it first so deleting an application does
 * not leave an orphaned file behind; storage cleanup failure is non-fatal
 * and never blocks the row delete.
 */
export async function deleteCandidate(id: string) {
  const supabase = createServiceRoleClient();

  const { data: row } = await supabase
    .from("candidates")
    .select("resume_storage_path")
    .eq("id", id)
    .maybeSingle();

  const path = (row?.resume_storage_path as string | null) ?? null;
  if (path) {
    await supabase.storage.from("candidate-resumes").remove([path]);
  }

  await supabase.from("candidates").delete().eq("id", id);
  revalidatePath("/admin/candidates");
}
