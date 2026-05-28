-- ============================================
-- SQL SETUP UNTUK SUPABASE
-- Jalankan di Supabase SQL Editor
-- ============================================

-- 1. Tabel Profiles (data user)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  nama TEXT NOT NULL,
  nim TEXT,
  role TEXT NOT NULL DEFAULT 'anggota' CHECK (role IN ('sekretaris', 'anggota')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Kegiatan Harian
CREATE TABLE kegiatan (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  lokasi TEXT,
  kategori TEXT DEFAULT 'umum',
  tanggal DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabel Agenda
CREATE TABLE agenda (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  tanggal DATE NOT NULL,
  waktu TEXT,
  lokasi TEXT,
  jenis TEXT DEFAULT 'rapat',
  status TEXT DEFAULT 'upcoming',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabel Notulen Rapat
CREATE TABLE notulen (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  judul_rapat TEXT NOT NULL,
  tanggal DATE NOT NULL,
  waktu TEXT,
  lokasi TEXT,
  peserta TEXT,
  pembahasan TEXT,
  keputusan TEXT,
  tindak_lanjut TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabel Surat
CREATE TABLE surat (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  jenis TEXT NOT NULL CHECK (jenis IN ('masuk', 'keluar')),
  nomor_surat TEXT,
  perihal TEXT NOT NULL,
  pengirim TEXT,
  penerima TEXT,
  tanggal DATE NOT NULL,
  status TEXT DEFAULT 'diproses',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabel Dokumentasi Foto
CREATE TABLE dokumentasi (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  author_id UUID REFERENCES profiles(id),
  author_name TEXT NOT NULL,
  judul TEXT NOT NULL,
  deskripsi TEXT,
  foto_url TEXT NOT NULL,
  tanggal DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE kegiatan ENABLE ROW LEVEL SECURITY;
ALTER TABLE agenda ENABLE ROW LEVEL SECURITY;
ALTER TABLE notulen ENABLE ROW LEVEL SECURITY;
ALTER TABLE surat ENABLE ROW LEVEL SECURITY;
ALTER TABLE dokumentasi ENABLE ROW LEVEL SECURITY;

-- Profiles: user bisa read semua, insert & update milik sendiri
CREATE POLICY "profiles_select" ON profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Untuk semua tabel data: authenticated bisa read, insert, update, delete
CREATE POLICY "kegiatan_select" ON kegiatan FOR SELECT TO authenticated USING (true);
CREATE POLICY "kegiatan_insert" ON kegiatan FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "kegiatan_update" ON kegiatan FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "kegiatan_delete" ON kegiatan FOR DELETE TO authenticated USING (true);

CREATE POLICY "agenda_select" ON agenda FOR SELECT TO authenticated USING (true);
CREATE POLICY "agenda_insert" ON agenda FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "agenda_update" ON agenda FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "agenda_delete" ON agenda FOR DELETE TO authenticated USING (true);

CREATE POLICY "notulen_select" ON notulen FOR SELECT TO authenticated USING (true);
CREATE POLICY "notulen_insert" ON notulen FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "notulen_update" ON notulen FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "notulen_delete" ON notulen FOR DELETE TO authenticated USING (true);

CREATE POLICY "surat_select" ON surat FOR SELECT TO authenticated USING (true);
CREATE POLICY "surat_insert" ON surat FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "surat_update" ON surat FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "surat_delete" ON surat FOR DELETE TO authenticated USING (true);

CREATE POLICY "dokumentasi_select" ON dokumentasi FOR SELECT TO authenticated USING (true);
CREATE POLICY "dokumentasi_insert" ON dokumentasi FOR INSERT TO authenticated WITH CHECK (auth.uid() = author_id);
CREATE POLICY "dokumentasi_update" ON dokumentasi FOR UPDATE TO authenticated USING (auth.uid() = author_id);
CREATE POLICY "dokumentasi_delete" ON dokumentasi FOR DELETE TO authenticated USING (true);
