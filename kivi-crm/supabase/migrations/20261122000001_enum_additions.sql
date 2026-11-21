-- =============================================================================
-- KiviTronics CRM — 0005 enum additions (own file: new enum values cannot be
-- used in the same transaction that adds them).
-- =============================================================================
alter type public.activity_type add value if not exists 'research_update';
alter type public.activity_type add value if not exists 'requirement_milestone';
alter type public.activity_type add value if not exists 'invoice';
alter type public.activity_type add value if not exists 'payment';
