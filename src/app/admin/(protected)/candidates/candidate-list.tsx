"use client";

import { useState } from "react";
import type { Candidate } from "@/lib/supabase/types";
import { deleteCandidate } from "./actions";

/**
 * Candidate list with click-to-expand detail.
 *
 * The table stays compact for scanning, but every row opens into a full
 * detail panel: the complete experience summary (the table only shows the
 * first line), every contact field with tap-to-call / mailto / copy, the
 * role, the resume, and the exact submission time. Nothing is truncated in
 * the panel.
 *
 * Status is shown as a badge, not edited here. The one mutation is Delete,
 * for clearing spam and test applications: it is deliberately gated behind
 * opening the row and a confirm prompt, and it is permanent.
 */

const STATUS_STYLES: Record<string, string> = {
  new: "bg-orange/10 text-orange",
  reviewing: "bg-blue-50 text-blue-700",
  contacted: "bg-green-50 text-green-700",
  closed: "bg-gray-100 text-gray-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

/** Stored as <candidateId>/<timestamp>-<original-name>; show the original. */
function resumeFilename(path: string | null): string | null {
  if (!path) return null;
  const last = path.split("/").pop() ?? "";
  const stripped = last.replace(/^\d+-/, "");
  return stripped.length > 0 ? stripped : last;
}

function StatusBadge({ status }: { status: string | null }) {
  const key = status ?? "new";
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
        STATUS_STYLES[key] ?? STATUS_STYLES.new
      }`}
    >
      {key}
    </span>
  );
}

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      onClick={async (e) => {
        e.stopPropagation();
        try {
          await navigator.clipboard.writeText(value);
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch {
          /* clipboard unavailable; the value is on screen anyway */
        }
      }}
      className="text-[11px] font-semibold text-navy hover:text-orange transition-colors"
      aria-label={`Copy ${label}`}
    >
      {done ? "Copied" : "Copy"}
    </button>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-ink break-words">{children}</dd>
    </div>
  );
}

export function CandidateList({
  candidates,
  resumeUrls,
}: {
  candidates: Candidate[];
  /** candidate id -> short-lived signed URL for the resume */
  resumeUrls: Record<string, string>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => setOpenId((cur) => (cur === id ? null : id));

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-paper border border-faint rounded-xl">
        <thead>
          <tr className="bg-soft-navy">
            {["Name", "Role", "Experience", "Resume", "Submitted", "Status", ""].map(
              (label, i) => (
                <th
                  key={i}
                  className="px-4 py-3 text-left text-xs font-semibold text-muted uppercase tracking-wider"
                >
                  {label}
                </th>
              )
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-faint">
          {candidates.map((c) => {
            const open = openId === c.id;
            const resumeUrl = resumeUrls[c.id];
            return (
              <CandidateRows
                key={c.id}
                candidate={c}
                open={open}
                resumeUrl={resumeUrl}
                onToggle={() => toggle(c.id)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function CandidateRows({
  candidate: c,
  open,
  resumeUrl,
  onToggle,
}: {
  candidate: Candidate;
  open: boolean;
  resumeUrl: string | undefined;
  onToggle: () => void;
}) {
  const filename = resumeFilename(c.resume_storage_path);
  const [busy, setBusy] = useState(false);

  async function confirmDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (
      !window.confirm(
        `Permanently delete the application from ${c.name}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    await deleteCandidate(c.id);
    setBusy(false);
  }

  return (
    <>
      <tr
        onClick={onToggle}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggle();
          }
        }}
        tabIndex={0}
        role="button"
        aria-expanded={open}
        aria-controls={`candidate-${c.id}`}
        className={`cursor-pointer transition-colors ${
          open ? "bg-soft-navy/60" : "hover:bg-soft-navy/40"
        }`}
      >
        <td className="px-4 py-3 text-sm font-medium text-ink whitespace-nowrap">
          {c.name}
        </td>
        <td className="px-4 py-3 text-sm text-ink whitespace-nowrap">
          {c.role_interest ?? <span className="text-muted">--</span>}
        </td>
        <td className="px-4 py-3 text-sm text-muted max-w-xs">
          {c.experience_summary ? truncate(c.experience_summary, 80) : "--"}
        </td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">
          {resumeUrl ? (
            <span className="text-navy">Attached</span>
          ) : (
            <span className="text-muted">None</span>
          )}
        </td>
        <td className="px-4 py-3 text-sm text-muted whitespace-nowrap">
          {formatDate(c.created_at)}
        </td>
        <td className="px-4 py-3 whitespace-nowrap">
          <StatusBadge status={c.status} />
        </td>
        <td className="px-4 py-3 text-right whitespace-nowrap">
          <span className="text-xs font-semibold text-navy">
            {open ? "Hide" : "View"}
          </span>
        </td>
      </tr>

      {open ? (
        <tr id={`candidate-${c.id}`} className="bg-paper">
          <td colSpan={7} className="px-4 pb-5 pt-1">
            <div className="rounded-xl border border-faint bg-paper p-5">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display font-bold text-lg text-ink tracking-tight">
                    {c.name}
                  </h2>
                  <p className="mt-0.5 text-xs text-muted">
                    Applied {formatDateTime(c.created_at)}
                  </p>
                </div>
                <StatusBadge status={c.status} />
              </div>

              {/* Contact + role + resume */}
              <dl className="mt-5 grid grid-cols-1 gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Email">
                  <span className="flex items-center gap-2">
                    <a
                      href={`mailto:${c.email}`}
                      onClick={(e) => e.stopPropagation()}
                      className="text-navy underline underline-offset-2 break-all"
                    >
                      {c.email}
                    </a>
                    <Copy value={c.email} label="email" />
                  </span>
                </Field>
                <Field label="Phone">
                  {c.phone ? (
                    <span className="flex items-center gap-2">
                      <a
                        href={`tel:${c.phone}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-navy underline underline-offset-2"
                      >
                        {c.phone}
                      </a>
                      <Copy value={c.phone} label="phone" />
                    </span>
                  ) : (
                    <span className="text-muted">Not provided</span>
                  )}
                </Field>
                <Field label="Role interest">
                  {c.role_interest ?? (
                    <span className="text-muted">Not specified</span>
                  )}
                </Field>
                <Field label="Resume">
                  {resumeUrl ? (
                    <span className="flex flex-col gap-0.5">
                      <a
                        href={resumeUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="text-navy underline underline-offset-2"
                      >
                        View resume
                      </a>
                      {filename ? (
                        <span className="text-[11px] text-muted break-all">
                          {filename}
                        </span>
                      ) : null}
                    </span>
                  ) : (
                    <span className="text-muted">No resume uploaded</span>
                  )}
                </Field>
              </dl>

              {/* Full experience summary */}
              <div className="mt-6">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Experience and background
                </p>
                {c.experience_summary ? (
                  <p className="mt-2 whitespace-pre-wrap text-sm text-ink leading-relaxed">
                    {c.experience_summary}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">Nothing provided.</p>
                )}
              </div>

              {/* Footer: id for support, and the one destructive action */}
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-faint pt-3">
                <p className="text-[11px] text-muted">
                  Application ID{" "}
                  <span className="font-mono text-ink">{c.id}</span>
                </p>
                <button
                  type="button"
                  disabled={busy}
                  onClick={confirmDelete}
                  className="shrink-0 rounded-md border border-red-300 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Delete application
                </button>
              </div>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
