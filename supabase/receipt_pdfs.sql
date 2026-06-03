-- Supabase SQL schema for PDF storage and receipt numbering

create sequence if not exists receipt_number_seq start 1;

create or replace function next_receipt_number()
returns bigint as $$
begin
  return nextval('receipt_number_seq');
end;
$$ language plpgsql;

create table if not exists receipt_pdfs (
  id uuid default uuid_generate_v4() primary key,
  receipt_number text not null,
  vendor_id uuid not null,
  pdf_url text not null,
  file_name text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create unique index if not exists receipt_pdfs_receipt_number_unique on receipt_pdfs(receipt_number);
