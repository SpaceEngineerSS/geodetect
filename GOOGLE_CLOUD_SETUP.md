# Google Cloud Platform Kurulum ve Bütçe Kontrolü

Bu rehber, Google Maps API'lerini güvenli ve maliyet kontrollü bir şekilde kullanmak için gerekli adımları içerir.

## 🚀 Google Cloud Console Kurulumu

### 1. Proje Oluşturma
1. [Google Cloud Console](https://console.cloud.google.com)'a gidin
2. Google hesabınızla giriş yapın
3. Üst menüden "Select a project" > "New Project"
4. Proje adı: `geodetect-maps`
5. "Create" butonuna tıklayın

### 2. API'leri Etkinleştirme
1. Sol menüden "APIs & Services" > "Library"
2. Aşağıdaki API'leri arayın ve etkinleştirin:
   - **Maps JavaScript API**
   - **Street View API**
   - **Geocoding API**

### 3. API Key Oluşturma
1. "APIs & Services" > "Credentials"
2. "Create Credentials" > "API Key"
3. Oluşturulan API key'i kopyalayın

### 4. API Key Kısıtlamaları
1. Oluşturulan API key'e tıklayın
2. "Application restrictions" bölümünde:
   - "HTTP referrers (web sites)" seçin
   - "Add an item" ile şu referrer'ları ekleyin:
     ```
     https://*.vercel.app/*
     http://localhost:*
     ```
3. "API restrictions" bölümünde:
   - "Restrict key" seçin
   - Sadece etkinleştirdiğiniz 3 API'yi seçin:
     - Maps JavaScript API
     - Street View API
     - Geocoding API
4. "Save" butonuna tıklayın

## 💰 Bütçe Uyarısı Kurulumu

### 1. Billing Hesabı Bağlama
1. Sol menüden "Billing" seçin
2. "Link a billing account" > "Create billing account"
3. Gerekli bilgileri doldurun (kredi kartı gerekli)
4. "Create and set account" butonuna tıklayın

### 2. Bütçe Oluşturma
1. "Billing" > "Budgets & Alerts"
2. "Create Budget" butonuna tıklayın
3. "Custom Budget" seçin
4. Ayarlar:
   - **Budget name**: `GeoDetect Monthly Budget`
   - **Budget amount**: `$1.00`
   - **Budget period**: `Monthly`
   - **Budget scope**: `All projects`
5. "Next" butonuna tıklayın

### 3. Uyarı Kurulumu
1. "Set budget alerts" bölümünde:
   - **Alert name**: `GeoDetect Budget Alert`
   - **Threshold**: `100%` (1$)
   - **Email recipients**: Kendi email adresinizi ekleyin
2. "Save" butonuna tıklayın

### 4. Ek Uyarılar (Opsiyonel)
Daha güvenli olmak için ek uyarılar ekleyin:
- **50% threshold**: `$0.50` - Erken uyarı
- **75% threshold**: `$0.75` - Orta seviye uyarı
- **90% threshold**: `$0.90` - Kritik uyarı

## 📊 Kullanım İzleme

### 1. API Kullanım Metrikleri
1. "APIs & Services" > "Dashboard"
2. Her API için kullanım istatistiklerini görüntüleyin
3. Günlük/haftalık trendleri takip edin

### 2. Billing Raporları
1. "Billing" > "Reports"
2. "Cost table" sekmesinde detaylı maliyet analizi
3. API bazında maliyet dağılımını görüntüleyin

### 3. Quota Limits
1. "APIs & Services" > "Quotas"
2. Her API için günlük/aylık limitleri kontrol edin
3. Kullanım oranlarını takip edin

## 🔒 Güvenlik Önlemleri

### 1. API Key Güvenliği
- API key'i asla public repository'lerde paylaşmayın
- Environment variables olarak saklayın
- Düzenli olarak rotate edin

### 2. Kullanım Limitleri
- Günlük API çağrı limitlerini ayarlayın
- Anormal kullanım pattern'lerini izleyin
- Rate limiting uygulayın

### 3. Monitoring
- Cloud Monitoring ile API kullanımını izleyin
- Error rates ve response times'i takip edin
- Anormal aktiviteleri tespit edin

## 🚨 Acil Durum Planı

### 1. Bütçe Aşımı Durumunda
1. Email uyarısı alır almaz:
   - API key'i geçici olarak devre dışı bırakın
   - Kullanım analizini yapın
   - Gerekirse yeni API key oluşturun

### 2. Güvenlik İhlali Durumunda
1. API key'i hemen değiştirin
2. Kullanım loglarını inceleyin
3. Gerekirse projeyi geçici olarak durdurun

### 3. Yüksek Kullanım Durumunda
1. Rate limiting uygulayın
2. Caching mekanizmaları ekleyin
3. API çağrılarını optimize edin

## 📈 Optimizasyon Önerileri

### 1. Caching
- Geocoding sonuçlarını cache'leyin
- Street View görüntülerini optimize edin
- CDN kullanın

### 2. Rate Limiting
- Client-side rate limiting uygulayın
- Server-side throttling ekleyin
- Batch requests kullanın

### 3. Monitoring
- Real-time monitoring kurun
- Alert sistemleri ekleyin
- Performance metrics toplayın

## 🎯 Test Kontrol Listesi

Bütçe uyarısı kurulumundan sonra test edin:

- [ ] API key çalışıyor
- [ ] HTTP referrer kısıtlamaları aktif
- [ ] API kısıtlamaları aktif
- [ ] Bütçe uyarısı email'i geliyor
- [ ] Kullanım metrikleri görüntüleniyor
- [ ] Quota limits kontrol ediliyor

## 📞 Destek

Google Cloud desteği için:
1. [Google Cloud Support](https://cloud.google.com/support)
2. [Stack Overflow](https://stackoverflow.com/questions/tagged/google-maps-api)
3. [Google Maps Platform Community](https://developers.google.com/maps/community)

## ⚠️ Önemli Notlar

- **Aylık $200 ücretsiz kredi** var, ancak bütçe uyarısı kurmak zorunlu
- API key'i güvenli tutun ve düzenli olarak kontrol edin
- Kullanım metriklerini düzenli olarak izleyin
- Anormal kullanım durumunda hemen müdahale edin
- Backup planları hazırlayın 