# Sanal Buket

Özel bir gün için hazırlanmış, etkileşimli bir **3D dijital buket** deneyimi.  
Proje; açılışta zarf/fotoğraf akışı, ardından Three.js ile render edilen buket ve kişisel mesaj kartı içerir.

## Canlı Önizleme

[project-s4pva.vercel.app](https://project-s4pva.vercel.app/)

## Özellikler

- Three.js tabanlı 3D buket sahnesi
- Zarf → fotoğraf → hediye akışı
- Mesaj kartı ve “çiçeği gör” butonu ile sade görünüm
- iPhone/mobil cihazlar için görsel optimizasyonlar
- Basit ve üretime uygun Express API (`/api/health`, `/api/message`)

## Teknolojiler

- Vite
- Three.js
- Express.js
- Helmet, CORS, Compression, Morgan, Rate Limit

## Kurulum

```bash
npm install
```

## Geliştirme

Sadece frontend:

```bash
npm run dev
```

Frontend + API birlikte:

```bash
npm run dev:full
```

## Build

```bash
npm run build
```

## API Çalıştırma

```bash
npm run start:api
```

## Proje Yapısı

```text
.
├─ public/            # Statik dosyalar (görseller, model vb.)
├─ server/            # Express backend
├─ src/               # Uygulama kaynak kodu (JS/CSS)
├─ index.html
└─ vite.config.js
```
