## Scope

This is a large multi-area update. I'll group it into phases and ship them in order. Lovable Cloud will be enabled at the end as a separate phase, since enabling it mid-flow would block everything else.

---

## Phase 1 — Booking flow improvements (Hotels / Halls / Packages)

**HotelDetail page**
- Make Room and Hall both optional — customer can book room only, hall only, or both.
- Room selection: add **number of nights** input; line shows nightly rate × nights.
- Hall selection: add **number of days** input and **time slot** picker; line shows daily rate × days.
- Hall selection: pick a **seat arrangement** (Theatre, Classroom, U-Shape, Banquet, Boardroom, Cabaret) — each with name, description, image, shown in a sidebar.
- Packages: allow **multiple package selection**, each with **number of persons** and **time slot** (e.g. Morning 10:00, Midday 12:00, Evening 18:00).
- Packages are now **scoped per hotel** (`hotelId` on Pkg).
- Live, itemised price summary with remove buttons per line and a clear breakdown (subtotal per line, grand total, deposit if applicable).

**Halls**
- Add **amenities** field (PA System, Mints, Notepad, Pen, Flip Chart, Projector, etc.) shown as chips on the hall card and in admin form (tag input).

**Landing page — Packages section**
- Cap visible packages to **3** with a mix of coffee/snack and food packages.
- Add a **"View more"** button that links to a new `/packages` browse page (or expands inline).

**New: Food packages**
- Add a `kind` field on `Pkg`: `'coffee' | 'food'` so we can have Buffet Elysium, Kings À la Carte, etc.

---

## Phase 2 — Admin CMS additions

- **Packages admin**: fix the textarea so **Enter inserts a newline** (currently swallowed); add `hotelId`, `kind`, and time-slot list fields. Add CRUD for the new fields.
- **Halls admin**: add amenities tag input + seat-arrangement library (CRUD on arrangements with image upload).
- **Bookings admin**: display selected items, packages, time slots, seat arrangement, and rental items as **pills/badges** instead of nested JSON. Make sure packages render.
- **Inventory check-in/out**: extend `InventoryMovement` with `returnedFrom` (location) and `handledBy` (employee name from current session); update the form.
- **Revenue summary**: add a Revenue dashboard card on the admin landing — totals (gross, paid, outstanding), split by reservations vs rentals, last-30-days chart.
- **FAQs admin**: new tab with CRUD (question, answer, order, published).
- **Rental ownership label**: change `Vendor` → `Partner` everywhere in UI (keep type value `vendor` internally to avoid breaking persisted state, just remap the label).

---

## Phase 3 — Public pages & polish

- New static pages with editable content (CMS-driven via `SiteContent`):
  - `/about`
  - `/privacy`
  - `/terms`
  - `/refund`
  - `/faqs`
- Footer links updated to point at them.
- **Light mode**: add a proper light palette (no mixing) and a toggle in the header. Persist choice in Zustand. Both modes use semantic tokens — no hard-coded colors in components.
- **Checkout autofill**: email becomes the **first field**; on blur, look up prior bookings by email and prefill name + phone.

---

## Phase 4 — Lovable Cloud (last)

After the frontend changes are stable, enable Lovable Cloud and migrate persistence:
- Tables: `hotels`, `rooms`, `halls`, `packages`, `package_time_slots`, `seat_arrangements`, `hall_amenities`, `rentals`, `inventory_movements`, `bookings`, `booking_lines`, `faqs`, `site_content`, `branding`, `employees`, `roles`, `customers`.
- RLS:
  - Public read for catalog tables (hotels, rooms, halls, packages, rentals, faqs, site_content, branding, seat arrangements).
  - Public insert for `bookings` + `customers` (no-login flow), select restricted by email + reference.
  - Admin-only write everywhere — gated through a `user_roles` table + `has_role()` security-definer function.
- Storage bucket for hotel/rental/seat-arrangement images (replaces base64 data URLs).
- Admin auth: real email/password login replaces the mock one. Existing local employees become a one-time seed.
- Wire all admin CRUD screens to Cloud queries; checkout, tracking, and inventory writes also go through Cloud.

---

## Technical notes

- `Pkg` type gains: `hotelId: string`, `kind: 'coffee' | 'food'`, `timeSlots: { id; label; time }[]`.
- `Hall` type gains: `amenities: string[]`.
- New types: `SeatArrangement { id; name; description; image }`, `FAQ { id; question; answer; order; published }`.
- `CartLine` / booking details extended to record `nights`, `days`, `timeSlot`, `seatArrangementId`, `persons`.
- `InventoryMovement` gains `returnedFrom?: string`, `handledBy?: string`.
- Theme: add `[data-theme="light"]` block in `index.css` mirroring every dark token; toggle sets attribute on `<html>`.
- Packages textarea fix: stop using a control that intercepts Enter — use a plain `<textarea>` with `onChange` only (current code already does, but I'll verify the modal isn't trapping the keypress via the outer click handler / form submit).
- Cloud phase gets its own migration + RLS policies; admin uses `auth.users` + `user_roles(role app_role)` pattern (never roles on profiles).

---

## Out of scope for this pass
- Real Paystack integration (still UI stub as previously agreed).
- Email sending on booking confirmation (will need an edge function later).