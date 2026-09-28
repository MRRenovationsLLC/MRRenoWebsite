"use client";

import { useMemo, useState } from "react";
import {
  LEAD_STATUSES,
  type Lead,
  type LeadArchiveFolder,
} from "@/lib/supabase/types";
import {
  updateLeadStatus,
  markLeadSyncedToRoofr,
  deleteLead,
  archiveLead,
  unarchiveLead,
  moveLeadToArchiveFolder,
  createArchiveFolder,
  deleteArchiveFolder,
  renameArchiveFolder,
} from "../../actions";

const STATUS_STYLES: Record<string, string> = {
  new: "bg-navy text-paper",
  contacted: "bg-orange text-paper",
  qualified: "bg-green-700 text-paper",
  dead: "bg-soft-navy text-muted",
};

const ROOT = "__root__";
const NEW = "__new__";

function fullName(l: Lead) {
  const n = [l.first_name, l.last_name].filter(Boolean).join(" ").trim();
  return n.length > 0 ? n : "(no name given)";
}

function address(l: Lead) {
  const line = [l.street_address, l.city, l.state].filter(Boolean).join(", ");
  return [line, l.zip].filter(Boolean).join(" ").trim();
}

function when(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function minutesAgo(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / 60000;
}

function Copy({ value, label }: { value: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
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

type View = "inbox" | "archive";
type InboxFilter = "all" | "stuck" | "new";
/** "all" = every archived lead, "unfiled" = no folder, otherwise a folder id. */
type FolderSel = "all" | "unfiled" | string;

export function LeadList({
  leads,
  folders,
  signedPhotos,
  graceMinutes,
}: {
  leads: Lead[];
  folders: LeadArchiveFolder[];
  signedPhotos: Record<string, string>;
  graceMinutes: number;
}) {
  const [view, setView] = useState<View>("inbox");

  const inbox = useMemo(() => leads.filter((l) => !l.archived), [leads]);
  const archived = useMemo(() => leads.filter((l) => l.archived), [leads]);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2">
        {(
          [
            ["inbox", `Inbox (${inbox.length})`],
            ["archive", `Archive (${archived.length})`],
          ] as [View, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={`rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors ${
              view === key
                ? "bg-navy text-paper"
                : "border border-faint bg-paper text-muted hover:bg-soft-navy"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "inbox" ? (
        <InboxView
          leads={inbox}
          folders={folders}
          signedPhotos={signedPhotos}
          graceMinutes={graceMinutes}
        />
      ) : (
        <ArchiveView
          leads={archived}
          folders={folders}
          signedPhotos={signedPhotos}
          graceMinutes={graceMinutes}
        />
      )}
    </div>
  );
}

/* -------------------------------- INBOX -------------------------------- */

function InboxView({
  leads,
  folders,
  signedPhotos,
  graceMinutes,
}: {
  leads: Lead[];
  folders: LeadArchiveFolder[];
  signedPhotos: Record<string, string>;
  graceMinutes: number;
}) {
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [query, setQuery] = useState("");

  const shown = useMemo(() => {
    let list = leads;
    if (filter === "stuck") {
      list = list.filter(
        (l) => !l.synced_to_roofr && minutesAgo(l.created_at) > graceMinutes
      );
    } else if (filter === "new") {
      list = list.filter((l) => l.status === "new");
    }
    return applySearch(list, query);
  }, [leads, filter, query, graceMinutes]);

  if (leads.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-faint bg-paper p-8 text-center">
        <p className="font-display font-semibold text-sm text-ink">
          No leads in the inbox
        </p>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
          Every enquiry from the consultation and contact forms appears here the
          moment it is submitted. Archived leads live under the Archive tab.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {(
          [
            ["all", `All (${leads.length})`],
            ["new", "New only"],
            ["stuck", "Not in Roofr"],
          ] as [InboxFilter, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
              filter === key
                ? "bg-navy text-paper"
                : "border border-faint bg-paper text-muted hover:bg-soft-navy"
            }`}
          >
            {label}
          </button>
        ))}
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone, city, ZIP"
          className="ml-auto w-full sm:w-72 rounded-md border border-faint px-3 py-1.5 text-sm"
        />
      </div>

      {shown.length === 0 ? (
        <p className="py-6 text-sm text-muted">No leads match that filter.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((l) => (
            <LeadRow
              key={l.id}
              lead={l}
              mode="inbox"
              folders={folders}
              signedPhotos={signedPhotos}
              graceMinutes={graceMinutes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ------------------------------- ARCHIVE ------------------------------- */

function ArchiveView({
  leads,
  folders,
  signedPhotos,
  graceMinutes,
}: {
  leads: Lead[];
  folders: LeadArchiveFolder[];
  signedPhotos: Record<string, string>;
  graceMinutes: number;
}) {
  const [sel, setSel] = useState<FolderSel>("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const countIn = (s: FolderSel) =>
    s === "all"
      ? leads.length
      : s === "unfiled"
        ? leads.filter((l) => !l.archive_folder_id).length
        : leads.filter((l) => l.archive_folder_id === s).length;

  const shown = useMemo(() => {
    let list = leads;
    if (sel === "unfiled") list = list.filter((l) => !l.archive_folder_id);
    else if (sel !== "all") list = list.filter((l) => l.archive_folder_id === sel);
    return applySearch(list, query);
  }, [leads, sel, query]);

  const selectedFolder = folders.find((f) => f.id === sel) ?? null;

  async function createFolder() {
    const name = newName.trim();
    if (!name) return;
    setErr(null);
    setCreating(true);
    const res = await createArchiveFolder(name);
    setCreating(false);
    if (!res.ok) {
      setErr(res.error);
      return;
    }
    setNewName("");
    setSel(res.id);
  }

  return (
    <div>
      {/* Folder bar */}
      <div className="mb-4 rounded-xl border border-faint bg-paper p-3">
        <div className="flex flex-wrap items-center gap-2">
          <FolderChip
            active={sel === "all"}
            onClick={() => setSel("all")}
            label={`All (${countIn("all")})`}
          />
          <FolderChip
            active={sel === "unfiled"}
            onClick={() => setSel("unfiled")}
            label={`Unfiled (${countIn("unfiled")})`}
          />
          {folders.map((f) => (
            <FolderChip
              key={f.id}
              active={sel === f.id}
              onClick={() => setSel(f.id)}
              label={`${f.name} (${countIn(f.id)})`}
            />
          ))}

          <div className="ml-auto flex items-center gap-1.5">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") createFolder();
              }}
              placeholder="New folder name"
              className="w-40 rounded-md border border-faint px-2.5 py-1 text-xs"
            />
            <button
              onClick={createFolder}
              disabled={creating || newName.trim().length === 0}
              className="rounded-md bg-navy px-2.5 py-1 text-xs font-semibold text-paper hover:opacity-90 disabled:opacity-50"
            >
              Add folder
            </button>
          </div>
        </div>

        {err ? <p className="mt-2 text-xs text-red-700">{err}</p> : null}

        {selectedFolder ? (
          <div className="mt-2 flex items-center gap-3 border-t border-faint pt-2 text-[11px]">
            <span className="text-muted">
              Folder: <span className="font-semibold text-ink">{selectedFolder.name}</span>
            </span>
            <button
              onClick={async () => {
                const name = window.prompt("Rename folder:", selectedFolder.name);
                if (name && name.trim() && name.trim() !== selectedFolder.name) {
                  await renameArchiveFolder(selectedFolder.id, name.trim());
                }
              }}
              className="font-semibold text-navy hover:text-orange"
            >
              Rename
            </button>
            <button
              onClick={async () => {
                if (
                  window.confirm(
                    `Delete the folder "${selectedFolder.name}"? The leads in it are kept -- they move back to Unfiled.`
                  )
                ) {
                  await deleteArchiveFolder(selectedFolder.id);
                  setSel("all");
                }
              }}
              className="font-semibold text-red-700 hover:text-red-900"
            >
              Delete folder
            </button>
          </div>
        ) : null}
      </div>

      <div className="mb-4 flex items-center">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search archived leads"
          className="ml-auto w-full sm:w-72 rounded-md border border-faint px-3 py-1.5 text-sm"
        />
      </div>

      {leads.length === 0 ? (
        <div className="rounded-xl border border-dashed border-faint bg-paper p-8 text-center">
          <p className="font-display font-semibold text-sm text-ink">
            The Archive is empty
          </p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted leading-relaxed">
            Archive a lead from the Inbox to move it out of the way without
            deleting it. Create folders above to keep the Archive organised.
          </p>
        </div>
      ) : shown.length === 0 ? (
        <p className="py-6 text-sm text-muted">Nothing in this folder.</p>
      ) : (
        <div className="space-y-3">
          {shown.map((l) => (
            <LeadRow
              key={l.id}
              lead={l}
              mode="archive"
              folders={folders}
              signedPhotos={signedPhotos}
              graceMinutes={graceMinutes}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FolderChip({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
        active
          ? "bg-navy text-paper"
          : "border border-faint bg-paper text-muted hover:bg-soft-navy"
      }`}
    >
      {label}
    </button>
  );
}

/* -------------------------------- ROW --------------------------------- */

function applySearch(list: Lead[], query: string): Lead[] {
  const q = query.trim().toLowerCase();
  if (!q) return list;
  return list.filter((l) =>
    [
      fullName(l),
      l.email,
      l.phone,
      l.city,
      l.zip,
      l.project_type,
      l.source_channel,
    ]
      .filter(Boolean)
      .some((v) => String(v).toLowerCase().includes(q))
  );
}

function LeadRow({
  lead: l,
  mode,
  folders,
  signedPhotos,
  graceMinutes,
}: {
  lead: Lead;
  mode: View;
  folders: LeadArchiveFolder[];
  signedPhotos: Record<string, string>;
  graceMinutes: number;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const stuck =
    mode === "inbox" &&
    !l.synced_to_roofr &&
    minutesAgo(l.created_at) > graceMinutes;
  const pending = mode === "inbox" && !l.synced_to_roofr && !stuck;
  const photos = (l.photo_urls ?? [])
    .map((p) => (p.startsWith("http") ? p : signedPhotos[p]))
    .filter(Boolean) as string[];

  const folderName = l.archive_folder_id
    ? (folders.find((f) => f.id === l.archive_folder_id)?.name ?? "Unfiled")
    : "Unfiled";

  async function confirmDelete() {
    if (
      !window.confirm(
        `Permanently delete the lead from ${fullName(l)}? This cannot be undone.`
      )
    ) {
      return;
    }
    setBusy(true);
    await deleteLead(l.id);
    setBusy(false);
  }

  // Resolve a folder-select value ("__root__" | "__new__" | folderId) to a
  // folder id (or null), creating a folder first if the user picked "new".
  async function resolveFolder(value: string): Promise<{ ok: boolean; id: string | null }> {
    if (value === NEW) {
      const name = window.prompt("New folder name:");
      if (!name || !name.trim()) return { ok: false, id: null };
      const res = await createArchiveFolder(name.trim());
      if (!res.ok) {
        window.alert(res.error);
        return { ok: false, id: null };
      }
      return { ok: true, id: res.id };
    }
    return { ok: true, id: value === ROOT ? null : value };
  }

  async function onArchiveSelect(value: string) {
    if (!value) return;
    setBusy(true);
    const r = await resolveFolder(value);
    if (r.ok) await archiveLead(l.id, r.id);
    setBusy(false);
  }

  async function onMoveSelect(value: string) {
    if (!value) return;
    setBusy(true);
    const r = await resolveFolder(value);
    if (r.ok) await moveLeadToArchiveFolder(l.id, r.id);
    setBusy(false);
  }

  return (
    <div
      className={`rounded-lg border bg-paper p-4 ${
        stuck ? "border-red-300" : "border-faint"
      }`}
    >
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-display font-semibold text-sm text-ink">
              {fullName(l)}
            </p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                STATUS_STYLES[l.status] ?? "bg-soft-navy text-muted"
              }`}
            >
              {l.status}
            </span>
            <span className="rounded-full bg-soft-navy px-2 py-0.5 text-[10px] font-medium text-muted">
              {l.form_type}
            </span>
            {mode === "inbox" ? (
              stuck ? (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-800">
                  Not in Roofr
                </span>
              ) : pending ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-900">
                  Syncing
                </span>
              ) : (
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-900">
                  In Roofr
                </span>
              )
            ) : (
              <span className="rounded-full bg-soft-navy px-2 py-0.5 text-[10px] font-semibold text-muted">
                {folderName}
              </span>
            )}
          </div>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
            <span>{when(l.created_at)}</span>
            {l.phone ? (
              <span className="flex items-center gap-1.5">
                <a href={`tel:${l.phone}`} className="text-navy hover:text-orange">
                  {l.phone}
                </a>
                <Copy value={l.phone} label="phone" />
              </span>
            ) : null}
            {l.email ? (
              <span className="flex items-center gap-1.5">
                <a href={`mailto:${l.email}`} className="text-navy hover:text-orange">
                  {l.email}
                </a>
                <Copy value={l.email} label="email" />
              </span>
            ) : null}
            {l.project_type ? <span>&middot; {l.project_type}</span> : null}
          </div>

          {address(l) ? (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted">
              {address(l)} <Copy value={address(l)} label="address" />
            </p>
          ) : null}

          <p className="mt-1 text-[11px] text-muted">
            {l.source_channel ?? "Website"}
            {l.qr_code_slug ? ` | QR /r/${l.qr_code_slug}` : ""}
            {l.utm_campaign ? ` | ${l.utm_campaign}` : ""}
            {photos.length > 0
              ? ` | ${photos.length} photo${photos.length === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-end gap-2">
          {mode === "inbox" ? (
            <>
              <select
                value={l.status}
                disabled={busy}
                onChange={async (e) => {
                  setBusy(true);
                  await updateLeadStatus(l.id, e.target.value);
                  setBusy(false);
                }}
                className="rounded border border-faint px-2 py-1 text-xs"
              >
                {LEAD_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              <button
                onClick={() => setOpen((v) => !v)}
                className="text-xs font-semibold text-navy hover:text-orange transition-colors"
              >
                {open ? "Hide details" : "Details"}
              </button>

              {!l.synced_to_roofr ? (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await markLeadSyncedToRoofr(l.id, true);
                    setBusy(false);
                  }}
                  className="rounded-md bg-orange px-2.5 py-1 text-[11px] font-semibold text-paper hover:opacity-90 disabled:opacity-50"
                >
                  Mark entered in Roofr
                </button>
              ) : (
                <button
                  disabled={busy}
                  onClick={async () => {
                    setBusy(true);
                    await markLeadSyncedToRoofr(l.id, false);
                    setBusy(false);
                  }}
                  className="text-[11px] font-semibold text-muted hover:text-orange"
                >
                  Undo
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => setOpen((v) => !v)}
                className="text-xs font-semibold text-navy hover:text-orange transition-colors"
              >
                {open ? "Hide details" : "Details"}
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  await unarchiveLead(l.id);
                  setBusy(false);
                }}
                className="rounded-md border border-faint px-2.5 py-1 text-[11px] font-semibold text-navy hover:bg-soft-navy disabled:opacity-50"
              >
                Restore to inbox
              </button>
            </>
          )}
        </div>
      </div>

      {open ? (
        <div className="mt-4 border-t border-faint pt-4">
          {l.project_details ? (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                What they said
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm text-ink leading-relaxed">
                {l.project_details}
              </p>
            </div>
          ) : null}

          {photos.length > 0 ? (
            <div className="mb-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted">
                Photos
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {photos.map((src, i) => (
                  <a
                    key={src}
                    href={src}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block h-24 w-24 overflow-hidden rounded border border-faint"
                  >
                    {/* Signed URLs from a private bucket and short-lived, so a
                        plain img rather than next/image, which would try to
                        cache and optimise them. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={src}
                      alt={`Lead photo ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          ) : null}

          <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs sm:grid-cols-3">
            <Detail label="Preferred contact" value={l.preferred_contact} />
            <Detail label="Source channel" value={l.source_channel} />
            <Detail label="Campaign" value={l.source_campaign ?? l.utm_campaign} />
            <Detail label="utm_source" value={l.utm_source} />
            <Detail label="utm_medium" value={l.utm_medium} />
            <Detail label="QR code" value={l.qr_code_slug ? `/r/${l.qr_code_slug}` : null} />
            <Detail label="Google click id" value={l.gclid} />
            <Detail label="Meta click id" value={l.fbclid} />
            <Detail
              label="Roofr"
              value={
                l.synced_to_roofr
                  ? `Synced ${l.roofr_synced_at ? when(l.roofr_synced_at) : ""}`
                  : "Not synced"
              }
            />
          </dl>

          {l.landing_url ? (
            <p className="mt-3 break-all text-[11px] text-muted">
              Landed on:{" "}
              <span className="font-mono text-ink">{l.landing_url}</span>
            </p>
          ) : null}

          {/* Actions footer */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-red-200 pt-3">
            {mode === "inbox" ? (
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                Archive to
                <select
                  value=""
                  disabled={busy}
                  onChange={(e) => onArchiveSelect(e.target.value)}
                  className="rounded border border-faint px-2 py-1 text-[11px] font-normal text-ink"
                >
                  <option value="" disabled hidden>
                    Choose...
                  </option>
                  <option value={ROOT}>Archive (no folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                  <option value={NEW}>+ New folder...</option>
                </select>
              </label>
            ) : (
              <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted">
                Move to
                <select
                  value=""
                  disabled={busy}
                  onChange={(e) => onMoveSelect(e.target.value)}
                  className="rounded border border-faint px-2 py-1 text-[11px] font-normal text-ink"
                >
                  <option value="" disabled hidden>
                    Choose...
                  </option>
                  <option value={ROOT}>Unfiled (no folder)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                  <option value={NEW}>+ New folder...</option>
                </select>
              </label>
            )}

            <button
              disabled={busy}
              onClick={confirmDelete}
              className="shrink-0 rounded-md border border-red-300 px-2.5 py-1 text-[11px] font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete lead
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-0.5 text-ink break-words">{value || "--"}</dd>
    </div>
  );
}
