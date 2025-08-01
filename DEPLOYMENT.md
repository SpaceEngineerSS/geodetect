# GeoDetect Deployment Rehberi

Bu rehber, GeoDetect oyununu ücretsiz platformlarda yayınlamak için gerekli adımları içerir.

## 🚀 Hızlı Başlangıç

### 1. Frontend (Vercel) Deployment

#### GitHub Repository Oluşturma
1. GitHub'da yeni bir repository oluşturun
2. Projeyi GitHub'a push edin:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/kullaniciadi/geodetect.git
git push -u origin main
```

#### Vercel Deployment
1. [Vercel.com](https://vercel.com)'a gidin ve GitHub hesabınızla giriş yapın
2. "New Project" butonuna tıklayın
3. GitHub repository'nizi seçin
4. Framework Preset olarak "Vite" seçin
5. Build Settings:
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. "Deploy" butonuna tıklayın

#### Environment Variables (Vercel)
Vercel Dashboard > Project Settings > Environment Variables bölümüne şu değişkenleri ekleyin:

```
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_SERVER_URL=https://your-backend-url.onrender.com
```

### 2. Backend (Render) Deployment

#### Backend Repository Oluşturma
1. `server` klasörünü ayrı bir GitHub repository'sine kopyalayın
2. Repository'yi GitHub'a push edin

#### Render Deployment
1. [Render.com](https://render.com)'a gidin ve GitHub hesabınızla giriş yapın
2. "New +" > "Web Service" seçin
3. GitHub repository'nizi seçin
4. Ayarlar:
   - Name: `geodetect-server`
   - Environment: `Node`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Plan: `Free`

#### Environment Variables (Render)
Render Dashboard > Environment bölümüne şu değişkenleri ekleyin:

```
NODE_ENV=production
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

### 3. Supabase Kurulumu

#### Proje Oluşturma
1. [Supabase.com](https://supabase.com)'a gidin
2. Yeni proje oluşturun
3. Database > SQL Editor'de şu tabloları oluşturun:

```sql
-- Profiles tablosu
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game history tablosu
CREATE TABLE game_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES profiles(id) NOT NULL,
  score INTEGER NOT NULL,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS (Row Level Security) ayarları
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own game history" ON game_history
  FOR SELECT USING (auth.uid() = player_id);

CREATE POLICY "Users can insert own game history" ON game_history
  FOR INSERT WITH CHECK (auth.uid() = player_id);
```

#### API Keys Alma
1. Settings > API bölümünden URL ve API key'leri alın
2. Bu bilgileri Vercel ve Render environment variables'a ekleyin

### 4. Google Maps API Kurulumu

#### API Key Oluşturma
1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
2. Yeni proje oluşturun veya mevcut projeyi seçin
3. APIs & Services > Library'den şu API'leri etkinleştirin:
   - Maps JavaScript API
   - Street View API
   - Geocoding API
4. APIs & Services > Credentials > Create Credentials > API Key
5. API key'i kısıtlayın (HTTP referrers: `*.vercel.app`)

#### Bütçe Uyarısı Kurulumu
1. Billing > Budgets & Alerts
2. "Create Budget" > "Custom Budget"
3. Amount: $1.00
4. Alert threshold: 100% (1$)
5. Email notifications ekleyin

## 🔧 Sorun Giderme

### CORS Hataları
Backend'de CORS ayarlarının doğru olduğundan emin olun:
```javascript
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ["https://your-app.vercel.app"] 
    : "http://localhost:5173",
  credentials: true
}));
```

### Socket.IO Bağlantı Sorunları
Frontend'de server URL'inin doğru olduğundan emin olun:
```javascript
const SERVER_URL = import.meta.env.VITE_SERVER_URL || 
  (import.meta.env.PROD ? 'https://your-server.onrender.com' : 'http://localhost:3001');
```

### Render "Sleep" Sorunu
Ücretsiz Render planında sunucu 15 dakika inaktif kaldığında uyku moduna geçer. İlk istek 30 saniye gecikebilir.

## 📊 Monitoring

### Vercel Analytics
- Vercel Dashboard > Analytics bölümünden performans metriklerini izleyin
- Function execution times ve error rates'i takip edin

### Render Logs
- Render Dashboard > Logs bölümünden sunucu loglarını izleyin
- Error patterns ve performance issues'i takip edin

### Google Cloud Monitoring
- Google Cloud Console > Monitoring bölümünden API kullanımını izleyin
- Quota limits ve error rates'i takip edin

## 🔒 Güvenlik

### Environment Variables
- Tüm API key'leri environment variables olarak saklayın
- `.env` dosyasını `.gitignore`'a ekleyin
- Production'da environment variables'ları platform dashboard'larında ayarlayın

### API Key Kısıtlamaları
- Google Maps API key'ini HTTP referrers ile kısıtlayın
- Supabase API key'lerini güvenli tutun

## 💰 Maliyet Kontrolü

### Google Maps API
- Aylık $200 ücretsiz kredi
- Bütçe uyarısı kurun ($1 threshold)
- API kullanımını düzenli olarak izleyin

### Supabase
- Ücretsiz plan: 500MB database, 50MB bandwidth
- Kullanım limitlerini aşmamaya dikkat edin

### Vercel & Render
- Ücretsiz planlar yeterli
- Bandwidth ve function execution limits'leri takip edin

## 🎯 Son Kontroller

Deployment tamamlandıktan sonra şunları test edin:

- [ ] Ana sayfa yükleniyor
- [ ] Kullanıcı kaydı/girişi çalışıyor
- [ ] Tek oyunculu oyun çalışıyor
- [ ] Çok oyunculu oyun çalışıyor
- [ ] Socket.IO bağlantısı kuruluyor
- [ ] Harita ve Street View yükleniyor
- [ ] Puan hesaplama doğru çalışıyor
- [ ] Oyun geçmişi kaydediliyor

## 📞 Destek

Sorun yaşarsanız:
1. Console loglarını kontrol edin
2. Network tab'ından API isteklerini izleyin
3. Platform dashboard'larından logları kontrol edin
4. GitHub Issues'da sorun bildirin 