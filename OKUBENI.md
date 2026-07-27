# LoveHub — Editoryal Aşk Dergisi Yenilemesi (1. Aşama: Giriş Öncesi)

## Bu pakette ne var?

Kapsam sırası "önce giriş öncesi sayfalar" olarak belirlendiği için bu ilk
teslimat sadece **Landing + Auth (Login/Register/Forgot/Reset Password)**
sayfalarını kapsıyor. Dashboard, sol menü ve feature sayfaları bir sonraki
aşamada aynı token sistemiyle güncellenecek.

Seçilen yön: **Editoryal Aşk Dergisi (Bold Editorial)** — kağıt beyazı
zemin, dev ve cesur serif başlıklar (Fraunces), tek vurucu renk olarak
kiraz kırmızısı (#D6273B / `hsl(353 69% 50%)`), kıl payı çizgiler, düz
(gradientsiz, blur-orb'suz) yüzeyler.

**Animasyon/performans notların dikkate alındı:** Eski tasarımdaki
staggered (kademeli, çok parçalı) framer-motion animasyonları, hover'da
kart kaldırma efektleri ve büyük blur/gradient arka plan topları
kaldırıldı. Artık sayfa girişinde tek, kısa (~0.4sn) ve sade bir fade-in
var; her şey `prefers-reduced-motion` ayarına zaten saygı gösteriyor
(bu, projenin index.css'inde daha önceden vardı, korundu). Supabase
sorgularına veya mevcut react-query/hook desenlerine hiç dokunulmadı —
sadece görsel katman (className, index.css, index.html, tailwind.config.js)
değişti, hiçbir tablo/RLS/migration eklenmedi.

## Değişen / eklenen dosyalar

```
index.html                                  (Fraunces font eklendi, loader renkleri güncellendi)
tailwind.config.js                          (font-display: Fraunces eklendi)
src/index.css                               (renk token'ları + yeni .eyebrow/.rule/.headline-accent sınıfları)
src/pages/landing/LandingPage.tsx
src/pages/landing/LandingNav.tsx
src/pages/landing/LandingFooter.tsx
src/pages/auth/AuthShell.tsx
src/pages/auth/LoginPage.tsx
src/pages/auth/RegisterPage.tsx
src/pages/auth/ForgotPasswordPage.tsx
src/pages/auth/ResetPasswordPage.tsx
```

Önemli: `src/index.css`'teki `--primary`, `--background`, `--radius` gibi
token'lar GLOBAL olduğu için, henüz elle güncellemediğimiz Dashboard/menü/
feature sayfaları da otomatik olarak yeni kırmızı vurgu rengini ve daha
düz köşe yarıçapını (radius) alacak. Bu beklenen bir durum — bir sonraki
aşamada o sayfaların kendi düzenini (layout) de bu tona göre elden
geçireceğiz. tsc hatasızdı, uygulama çalışır durumda.

## Nereye kopyalanacak (Windows)

Proje klasörün: `C:\Users\Administrator\Desktop\projesel - Kopya`

Bu zip'i açtıktan sonra, içindeki `index.html`, `tailwind.config.js` ve
`src\...` klasörünü, **aynı göreli yolları koruyarak**, proje klasörünün
üzerine kopyala (var olan dosyaların üzerine yazacak):

```powershell
# PowerShell — zip'i açtığın klasörden çalıştır (örnek: Downloads\lovehub-editorial-update)
xcopy /E /Y "index.html" "C:\Users\Administrator\Desktop\projesel - Kopya\"
xcopy /E /Y "tailwind.config.js" "C:\Users\Administrator\Desktop\projesel - Kopya\"
xcopy /E /Y "src" "C:\Users\Administrator\Desktop\projesel - Kopya\src\"
```

Ya da daha basitçe: dosya gezgininde `index.html`, `tailwind.config.js` ve
`src` klasörünü kopyala → proje klasörüne yapıştır → "üzerine yaz" de.
(`src\pages\...` altındaki sadece 7 dosya değişti, klasörün geri kalanına
dokunulmuyor.)

Bu aşamada **supabase db push gerekmiyor** — hiç migration eklenmedi,
sadece frontend/CSS değişti.

## Nasıl test edilir

```powershell
cd "C:\Users\Administrator\Desktop\projesel - Kopya"
npm install        # sadece font/paket değişmediyse gerekmez ama zararı yok
npm run dev
```

Sonra tarayıcıda:
1. `/` (Landing) — yeni kırmızı/kağıt/serif başlık görünümü
2. `/login`, `/register` — kart içinde eyebrow etiket + serif başlık
3. `/forgot-password`, `/reset-password` — aynı stil

Tip kontrolü (projenin standart yöntemi):

```powershell
npx tsc --noEmit -p tsconfig.app.json --ignoreDeprecations 6.0
```

Bu paket zaten gerçek `node_modules` ile bu komuttan hatasız geçti.

## Sırada ne var?

Onayını aldıktan sonra aynı token sistemiyle (renk/tipografi değişmeden)
Dashboard, sol menü (AppShell/AppHeader) ve sırayla tüm feature
sayfalarına geçeceğim.
