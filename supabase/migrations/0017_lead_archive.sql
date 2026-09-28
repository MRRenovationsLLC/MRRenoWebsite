-- ============================================================================
-- 0017_lead_archive.sql
-- Archive + folders for the leads inbox
--
-- The leads screen was inbox-only: every lead sat in one flat list forever.
-- Admins asked to tidy it -- move handled/old/junk enquiries out of the way
-- without deleting them -- and to group what they move into named folders.
--
-- Model:
--   * lead_archive_folders  -- the sub-folders that live "inside" the Archive.
--     Created on demand from the admin UI; may be empty.
--   * leads.archived         -- true = out of the inbox, in the Archive.
--   * leads.archived_at      -- when it was archived (audit / sort).
--   * leads.archive_folder_id-- which folder inside the Archive, or NULL for
--     the Archive root ("Unfiled"). ON DELETE SET NULL so deleting a folder
--     never deletes the leads in it -- they just fall back to Unfiled.
--
-- The folders table is admin-only: RLS is enabled with NO policies, so only
-- the service-role key (used server-side by the admin panel) can touch it.
-- The public anon key sees nothing, same as the leads table itself.
--
-- Additive and idempotent: existing leads default to archived = false, so the
-- inbox is unchanged until someone archives something.
-- ============================================================================

create table if not exists public.lead_archive_folders (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.lead_archive_folders enable row level security;
-- Intentionally no policies: only the service role (which bypasses RLS) may
-- read or write. This table is admin-only.

alter table public.leads
  add column if not exists archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists archive_folder_id uuid
    references public.lead_archive_folders (id) on delete set null;

-- The inbox query filters on archived; the archive view filters by folder.
create index if not exists leads_archived_idx
  on public.leads (archived);

create index if not exists leads_archive_folder_id_idx
  on public.leads (archive_folder_id);
