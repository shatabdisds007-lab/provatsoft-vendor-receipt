-- Supabase SQL migration to add receipts as first-class entities and link PDFs

create table if not exists receipts (
  id uuid default uuid_generate_v4() primary key,
  vendor_id uuid not null,
  receipt_number text not null,
  template_id text not null,
  status text not null default 'draft' check (status in ('draft', 'finalized')),
  company_data jsonb not null default '{}'::jsonb,
  customer_data jsonb not null default '{}'::jsonb,
  payment_data jsonb not null default '{}'::jsonb,
  additional_data jsonb not null default '{}'::jsonb,
  amount numeric not null default 0,
  currency text not null default 'INR',
  pdf_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists receipts_receipt_number_unique on receipts(receipt_number);
create index if not exists receipts_vendor_id_idx on receipts(vendor_id);
create index if not exists receipts_status_idx on receipts(status);
create index if not exists receipts_receipt_number_idx on receipts(receipt_number);

alter table if exists receipt_pdfs add column if not exists receipt_id uuid;

alter table if exists receipt_pdfs
  add constraint if not exists receipt_pdfs_receipt_fk foreign key (receipt_id) references receipts(id) on delete set null;

create index if not exists receipt_pdfs_receipt_id_idx on receipt_pdfs(receipt_id);

create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger receipts_set_updated_at
  before update on receipts
  for each row
  execute function update_updated_at_column();
