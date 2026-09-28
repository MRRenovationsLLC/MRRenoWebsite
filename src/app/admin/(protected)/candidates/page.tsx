import { createServiceRoleClient } from "@/lib/supabase/server";
import type { Candidate } from "@/lib/supabase/types";
import { CandidateList } from "./candidate-list";

// P1.45: candidate list. Every row opens into a full detail panel (see
// candidate-list.tsx) -- the table only ever showed the first line of the
// experience summary, and there was no way to read an application in full.
// No status workflow in this ticket -- status renders as a color badge only.
// Signed resume URLs are generated server-side at page load (1-hour expiry);
// acceptable for a low-traffic admin screen.

export const dynamic = "force-dynamic";

export default async function AdminCandidatesPage() {
  const supabase = createServiceRoleClient();
  const { data } = await supabase
    .from("candidates")
    .select()
    .order("created_at", { ascending: false });
  const candidates: Candidate[] = data ?? [];

  // Signed URLs expire, so they are generated fresh on every page load. Built
  // as a plain object (not a Map) so it can be handed to the client component.
  const resumeUrls: Record<string, string> = {};
  await Promise.all(
    candidates
      .filter((c) => c.resume_storage_path)
      .map(async (c) => {
        const { data: signed } = await supabase.storage
          .from("candidate-resumes")
          .createSignedUrl(c.resume_storage_path!, 3600);
        if (signed?.signedUrl) resumeUrls[c.id] = signed.signedUrl;
      })
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display font-bold text-2xl text-ink tracking-tight">
            Candidates
          </h1>
          <p className="text-sm text-muted mt-1">
            Job applications submitted through the careers form. Click any row
            to read the full application.
          </p>
        </div>
        <span className="text-sm text-muted">
          {candidates.length} application{candidates.length !== 1 ? "s" : ""}
        </span>
      </div>

      {candidates.length === 0 ? (
        <p className="text-sm text-muted py-4">No applications yet.</p>
      ) : (
        <CandidateList candidates={candidates} resumeUrls={resumeUrls} />
      )}
    </div>
  );
}
