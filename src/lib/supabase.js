import { createClient } from '@supabase/supabase-js'

// ضع هنا بيانات مشروع Supabase الخاص بك
const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL || 'https://YOUR_PROJECT.supabase.co'
const SUPABASE_ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

/*
══════════════════════════════════════════════════
  SQL — انسخ هذا في Supabase SQL Editor وشغّله
══════════════════════════════════════════════════

-- جدول المستخدمين
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  username text unique not null,
  password_hash text not null,
  role text default 'member',  -- 'member' | 'admin'
  joined_at timestamptz default now()
);

-- جدول البطاقات اليومية
create table daily_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  -- الصلوات
  fajr boolean default false,
  dhuhr boolean default false,
  asr boolean default false,
  maghrib boolean default false,
  isha boolean default false,
  sunnan boolean default false,
  duha boolean default false,
  qiyam boolean default false,
  witr boolean default false,
  -- القرآن
  quran_wird boolean default false,
  quran_review_old boolean default false,
  quran_review_new boolean default false,
  quran_new_hafz text default '',
  -- الأذكار
  athkar_morning boolean default false,
  athkar_evening boolean default false,
  istighfar_count int default 0,
  salah_nabi_count int default 0,
  hawqala_count int default 0,
  iftiqar_count int default 0,
  -- التزكية
  tazkia_done boolean default false,
  tazkia_note text default '',
  week_theme text default '',
  -- اللحظة
  moment_text text default '',
  -- النتيجة
  score int default 0,
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- جدول الأذكار الخاصة (حفاظ)
create table hafiz_cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  date date not null,
  new_surah text default '',
  new_verses text default '',
  review_old text default '',
  review_new text default '',
  notes text default '',
  created_at timestamptz default now(),
  unique(user_id, date)
);

-- جدول الأكواد السرية
create table secret_codes (
  id uuid primary key default gen_random_uuid(),
  code_type text unique not null,  -- 'admin' | 'hafiz' | 'group'
  code_value text not null,
  updated_at timestamptz default now()
);

-- إدخال الأكواد الافتراضية
insert into secret_codes (code_type, code_value) values
  ('admin', 'ADMIN2024'),
  ('hafiz', 'HAFIZ786'),
  ('group', 'WAAY1445');

-- تفعيل Row Level Security
alter table users enable row level security;
alter table daily_cards enable row level security;
alter table hafiz_cards enable row level security;
alter table secret_codes enable row level security;

-- سياسات الوصول (مبسطة — يمكن تشديدها لاحقاً)
create policy "allow_all_users" on users for all using (true) with check (true);
create policy "allow_all_cards" on daily_cards for all using (true) with check (true);
create policy "allow_all_hafiz" on hafiz_cards for all using (true) with check (true);
create policy "allow_read_codes" on secret_codes for select using (true);
create policy "allow_update_codes" on secret_codes for update using (true);

══════════════════════════════════════════════════
*/
