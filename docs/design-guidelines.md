# Design Guidelines — Hardware Service Decision Copilot

> Wersja 1.0 · 2026-06-24 · Narzędzie wewnętrzne NBP

Source of truth: `assets/design-tokens.json`
Applied in: `app/app/globals.css` (CSS custom properties)

---

## 1. Identyfikacja wizualna

Aplikacja jest **wewnętrznym narzędziem instytucjonalnym** dla pracowników obsługi klienta i techników serwisu NBP. Estetyka powinna odzwierciedlać profesjonalizm i wiarygodność instytucji finansowej — bez rozpraszających elementów wizualnych. Każdy ekran ma jeden cel, a design temu celowi służy.

**Zasady nadrzędne:**
- Hierarchia informacji ponad dekorację
- Wskaźniki statusu decyzji (zielony/czerwony/bursztynowy) są semantyczne, nie dekoracyjne
- Czytelność w warunkach biurowych (monitor LCD, jasne oświetlenie)
- Wszystkie treści dla użytkownika w języku polskim

---

## 2. Paleta kolorów

### Kolory marki

| Token | Hex | Zastosowanie |
|---|---|---|
| `brand-navy` | `#1C2E4A` | Primary — tła nagłówków, przyciski CTA, tekst główny |
| `brand-navy-light` | `#2A4470` | Hover na navy tle |
| `brand-navy-dark` | `#111D2E` | Active/pressed na navy tle |
| `brand-gold` | `#C9913A` | Akcent — focus ring, linki, hover na przyciskach |
| `brand-gold-light` | `#E8B86D` | Hover na gold elementach |

### Powierzchnie

| Token | Hex | Zastosowanie |
|---|---|---|
| `surface-page` | `#F5F4F1` | Tło całej strony |
| `surface-card` | `#FFFFFF` | Tło kart i formularzy |
| `surface-muted` | `#EDECE8` | Sekcje drugorzędne, disabled pola |

### Tekst

| Token | Hex | Zastosowanie |
|---|---|---|
| `text-primary` | `#1C2E4A` | Nagłówki, etykiety, tekst formularzy |
| `text-secondary` | `#5B6678` | Opisy, metadane, tekst pomocniczy |
| `text-disabled` | `#9BA4B0` | Elementy wyłączone |
| `text-inverse` | `#FFFFFF` | Tekst na ciemnym tle |

### Obramowania

| Token | Hex | Zastosowanie |
|---|---|---|
| `border-default` | `#DCD9D3` | Pola formularzy, karty |
| `border-strong` | `#B8B3AB` | Separatory sekcji |
| `border-focus` | `#C9913A` | Focus ring (= brand-gold) |

### Statusy decyzji ⚡ Semantyczne — nie zmieniać

| Status | Etykieta PL | Background | Border | Text | Badge/Icon |
|---|---|---|---|---|---|
| `status-accepted` | Zaakceptowano | `#E6F4ED` | `#A3D4B8` | `#155C35` | `#1A6B3E` |
| `status-rejected` | Odrzucono | `#FAEAEA` | `#E8AAAA` | `#7A1C1C` | `#8F2020` |
| `status-pending` | Wymaga weryfikacji | `#FEF3DC` | `#F0CF8A` | `#6B4A00` | `#9B6B00` |

Kolory statusów spełniają minimalny kontrast WCAG AA (4.5:1) na białym tle.

---

## 3. Typografia

### Kroje pisma

```
font-family (sans): 'Segoe UI', system-ui, -apple-system, sans-serif
font-family (mono): 'Cascadia Code', 'Courier New', monospace
```

Segoe UI jest zawsze dostępny na środowisku Windows/Azure. Nie używaj webfontów ładowanych z CDN.

### Skala typograficzna

| Rola | Rozmiar | Waga | Line-height | Tracking | Użycie |
|---|---|---|---|---|---|
| Nagłówek aplikacji | 1.875rem | 600 | 1.25 | -0.015em | Tytuł strony w headerze |
| Nagłówek sekcji | 1.25rem | 600 | 1.375 | 0 | H2 sekcji formularza |
| Tytuł pola | 0.875rem | 600 | 1.5 | 0 | Etykiety pól formularza |
| Tekst główny | 1rem | 400 | 1.5 | 0 | Odpowiedzi czatu, wartości pól |
| Tekst czatu | 1rem | 400 | 1.625 | 0 | Długie uzasadnienia decyzji |
| Metadane / etykieta | 0.75rem | 500 | 1.5 | 0.05em | Hinty, licznik znaków |
| Zastrzeżenie (disclaimer) | 0.75rem | 400 | 1.5 | 0 | Komunikat AI-generated |
| Uppercase label | 0.75rem | 600 | 1.5 | 0.08em | Sekcje: "DECYZJA", "UZASADNIENIE" |

### Zasady

- Maksymalna szerokość kolumny tekstu: **640px** (formularz), **720px** (czat)
- Nagłówki: `text-wrap: balance`
- Nie używaj więcej niż 3 rozmiarów na jednym ekranie

---

## 4. Odstępy i siatka

System 4px. Wszystkie wartości są wielokrotnościami 4px (0.25rem).

```
Spacing scale: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 px
```

**Standardowe odstępy:**
- Między polami formularza: `24px` (space-6)
- Wewnętrzny padding kart: `24px` lub `32px`
- Padding przycisków: `10px 20px`
- Gap między elementami inline (etykieta + ikona): `8px`

---

## 5. Komponenty

### Przycisk CTA (Wyślij zgłoszenie)

```
background: brand-navy (#1C2E4A)
color: white
border-radius: 6px
font-weight: 600
font-size: 1rem
padding: 10px 20px
width: 100% (w formularzu)

:hover → background: brand-navy-light (#2A4470), transition: 120ms
:focus-visible → outline: 2px solid brand-gold, outline-offset: 2px
:disabled → background: surface-muted, color: text-disabled, cursor: not-allowed
loading → show spinner, tekst: "Wysyłanie…", disabled
```

### Pole formularza

```
border: 1px solid border-default (#DCD9D3)
border-radius: 6px
background: surface-card (#FFFFFF)
color: text-primary (#1C2E4A)
font-size: 1rem
padding: 10px 12px

:focus → border-color: brand-gold (#C9913A), box-shadow: 0 0 0 3px rgba(201,145,58,0.15)
:error → border-color: #8F2020, + komunikat błędu pod polem
:disabled → background: surface-muted, color: text-disabled
```

### Etykieta pola

```
font-size: 0.875rem
font-weight: 600
color: text-primary
margin-bottom: 6px
```

Komunikat błędu pod polem:
```
font-size: 0.75rem
color: #7A1C1C
margin-top: 4px
```

### Badge decyzji (DecisionBadge)

```css
/* Zaakceptowano */
background: #E6F4ED; border: 1px solid #A3D4B8;
color: #155C35; font-weight: 600; font-size: 0.875rem;
border-radius: 9999px; padding: 4px 12px;

/* Odrzucono */
background: #FAEAEA; border: 1px solid #E8AAAA;
color: #7A1C1C;

/* Wymaga weryfikacji */
background: #FEF3DC; border: 1px solid #F0CF8A;
color: #6B4A00;
```

### Bąbel czatu — agent

```
background: surface-card (#FFFFFF)
border: 1px solid border-default
border-radius: 0 12px 12px 12px
padding: 16px 20px
max-width: 85%
align: left
shadow: shadow-sm
```

### Bąbel czatu — pracownik

```
background: brand-navy (#1C2E4A)
color: white
border-radius: 12px 0 12px 12px
padding: 12px 16px
max-width: 75%
align: right
```

### Pierwsza wiadomość agenta (decyzja)

Sekcje wewnątrz bąbla wyróżnione nagłówkami uppercase:

```
"DECYZJA" → uppercase label + DecisionBadge
"UZASADNIENIE" → uppercase label + tekst regular
"KOLEJNE KROKI" → uppercase label + lista numerowana
"Zastrzeżenie" → tekst 0.75rem, color: text-secondary, border-top: 1px solid border-default, margin-top: 16px, padding-top: 12px
```

---

## 6. Stany ładowania

### Overlay procesowania (ekran 2)

```
background: rgba(28, 46, 74, 0.6) — navy overlay
Spinner: biały, 48px, stroke-width 3px
Tekst statusu: biały, font-size 1rem, font-weight 500
```

### Wskaźnik pisania agenta (chat)

Trzy kropki animowane w regularnych odstępach (200ms stagger), kolor `brand-gold`.

---

## 7. Dostępność

- Minimalny kontrast tekstu: **4.5:1** (WCAG AA)
- Focus ring: `2px solid brand-gold`, `outline-offset: 2px` — widoczny na jasnym i ciemnym tle
- Wszystkie pola formularza mają jawne `<label>` z atrybutem `htmlFor`
- Komunikaty błędów powiązane z polami przez `aria-describedby`
- Przycisk submit z `aria-busy="true"` podczas ładowania
- Spinner z `role="status"` i tekstem ukrytym dla czytników ekranowych

---

## 8. Czego unikać

- Gradientów jako tła
- Cieni silniejszych niż `shadow-md` na kartach formularza
- Kolorów statusu poza kontekstem decyzji (zielony/czerwony mają znaczenie semantyczne)
- Centrowania wieloliniowego tekstu
- Animacji innych niż: hover transitions (120ms), loading spinner, typing indicator
- Fontów ładowanych z zewnętrznych CDN
