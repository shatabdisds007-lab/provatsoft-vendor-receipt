-- templates table
create table if not exists templates (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text not null unique,
  category text not null,
  thumbnail text,
  active boolean default true,
  featured boolean default false,
  metadata jsonb default '{}',
  created_at timestamptz default now()
);

-- seed 15 templates
insert into templates (name, slug, category, thumbnail, active, featured, metadata)
values
('Education Branch', 'education-branch', 'Education', '/templates/thumbnails/education-branch.png', true, true, '{"preview": "education"}'),
('University Admission', 'university-admission', 'Education', '/templates/thumbnails/education-branch.png', true, false, '{"preview":"university"}'),
('Corporate Blue', 'corporate-blue', 'Corporate', '/templates/thumbnails/corporate-blue.png', true, false, '{"preview":"corporate_blue"}'),
('Executive White', 'executive-white', 'Corporate', '/templates/thumbnails/corporate-blue.png', true, false, '{"preview":"executive_white"}'),
('Minimal Modern', 'minimal-modern', 'Business', '/templates/thumbnails/minimal-modern.png', true, false, '{"preview":"minimal_modern"}'),
('Startup Style', 'startup-style', 'Business', '/templates/thumbnails/minimal-modern.png', true, false, '{"preview":"startup"}'),
('Elegant Premium', 'elegant-premium', 'Business', '/templates/thumbnails/minimal-modern.png', true, false, '{"preview":"elegant"}'),
('Luxury Black', 'luxury-black', 'Business', '/templates/thumbnails/luxury-black.png', true, false, '{"preview":"luxury_black"}'),
('Government Style', 'government-style', 'Government', '/templates/thumbnails/minimal-modern.png', true, false, '{"preview":"government"}'),
('NGO Donation', 'ngo-donation', 'NGO', '/templates/thumbnails/minimal-modern.png', true, false, '{"preview":"ngo"}'),
('Healthcare Receipt', 'healthcare-receipt', 'Healthcare', '/templates/thumbnails/healthcare.png', true, false, '{"preview":"healthcare"}'),
('Training Institute', 'training-institute', 'Education', '/templates/thumbnails/education-branch.png', false, false, '{"preview":"training"}'),
('Tuition Fee', 'tuition-fee', 'Education', '/templates/thumbnails/education-branch.png', false, false, '{"preview":"tuition"}'),
('Business Classic', 'business-classic', 'Business', '/templates/thumbnails/corporate-blue.png', false, false, '{"preview":"business_classic"}'),
('Professional Invoice Style', 'professional-invoice', 'Business', '/templates/thumbnails/corporate-blue.png', false, false, '{"preview":"invoice"}')
on conflict (slug) do update set
  name = excluded.name,
  category = excluded.category,
  thumbnail = excluded.thumbnail,
  active = excluded.active,
  featured = excluded.featured,
  metadata = excluded.metadata;
