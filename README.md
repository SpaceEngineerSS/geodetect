# GeoDetect 🌍

[![Website](https://img.shields.io/badge/Website-spacegumus.com.tr-blue?style=flat-square)](https://spacegumus.com.tr)
[![GitHub](https://img.shields.io/badge/GitHub-SpaceEngineerSS-black?style=flat-square)](https://github.com/SpaceEngineerSS)

**GeoDetect**, Google Street View kullanarak sizi dünyanın rastgele bir köşesine bırakan ve nerede olduğunuzu tahmin etmenizi isteyen, tarayıcı tabanlı bir coğrafya tahmin oyunudur.

![GeoDetect Gameplay](https://i.imgur.com/example.png)  <!-- TODO: Add a real screenshot -->

---

## ✨ Özellikler

- **Sürükleyici Oynanış**: Dünyanın dört bir yanından rastgele Street View konumlarını keşfedin.
- **İnteraktif Harita**: Leaflet.js tabanlı harita üzerinde tahminlerinizi yapın.
- **Puanlama Sistemi**: Tahmininiz ile gerçek konum arasındaki mesafeye göre puan kazanın.
- **Oyun Modları**: Farklı zorluk seviyeleri için sabit veya hareketli Street View modları.
- **Ayarlanabilir Turlar ve Süre**: Kendi oyun kurallarınızı belirleyin.
- **Oyuncu Gelişimi**: XP kazanın, seviye atlayın ve rütbenizi yükseltin.
- **Başarımlar**: Oyun içi hedeflere ulaşarak başarımların kilidini açın.
- **İstatistikler**: Kişisel en yüksek skorlarınızı ve oyun istatistiklerinizi takip edin.
- **Modern Arayüz**: Mantine UI kütüphanesi ile oluşturulmuş şık ve duyarlı tasarım.

---

## 🛠️ Kullanılan Teknolojiler

Bu proje, aşağıdaki modern web teknolojileri kullanılarak geliştirilmiştir:

| Teknoloji | Açıklama |
| :--- | :--- |
| **React** | Kullanıcı arayüzü için JavaScript kütüphanesi |
| **Vite** | Hızlı ve modern bir geliştirme ortamı |
| **Mantine UI** | Kapsamlı ve erişilebilir React bileşen kütüphanesi |
| **Leaflet.js** | İnteraktif haritalar için açık kaynak kütüphane |
| **Google Maps Platform** | Street View ve Geocoding API'leri |
| **React-Leaflet** | Leaflet'i React ile kullanmak için sarmalayıcı |
| **React Router** | Sayfa yönlendirmeleri için |
| **Context API** | Global state yönetimi için |

---

## 🚀 Kurulum ve Çalıştırma

Bu projeyi yerel makinenizde çalıştırmak için aşağıdaki adımları izleyin:

1.  **Projeyi Klonlayın:**
    ```bash
    git clone https://github.com/SpaceEngineerSS/GeoDetect.git
    cd GeoDetect
    ```

2.  **Bağımlılıkları Yükleyin:**
    ```bash
    npm install
    ```

3.  **Ortam Değişkenlerini Ayarlayın:**
    Proje kök dizininde `.env` adında bir dosya oluşturun ve aşağıdaki değişkeni ekleyin:
    ```
    VITE_GOOGLE_MAPS_API_KEY=BURAYA_API_ANAHTARINIZI_GIRIN
    ```
    *API anahtarınızı [Google Cloud Console](https://console.cloud.google.com/)'dan alabilirsiniz. `Maps JavaScript API`, `Street View API` ve `Geocoding API` servislerini etkinleştirdiğinizden emin olun.*

4.  **Geliştirme Sunucusunu Başlatın:**
    ```bash
    npm run dev
    ```
    Uygulama artık `http://localhost:5173` adresinde çalışıyor olacaktır.

---

## 👨‍💻 Geliştirici

Bu proje **Mehmet Gümüş** tarafından geliştirilmiştir.

- **Website:** [spacegumus.com.tr](https://spacegumus.com.tr)
- **GitHub:** [@SpaceEngineerSS](https://github.com/SpaceEngineerSS)

---

## 📜 Lisans

Bu proje MIT Lisansı altında lisanslanmıştır.
