# VenueConnect

**An Online Platform for Event & Banquet Venue Booking with Real-Time Availability and 3D Visualization**

Department of Artificial Intelligence & Data Science, P. R. Pote Patil College of Engineering & Management, Amravati — Session 2026–2027

A full-stack, working, animated reference implementation of the VenueConnect synopsis. Venues are listed **pan-India**, with two flagship Amravati venues — **Grand Mehfil** and **Rangoli Lawns** — rendered as fully hand-modelled, interactive **3D scenes** built with Three.js / React Three Fiber.

---

## ✨ Features

**The Gate (first screen)**
- The site never dumps the full app on you immediately. The very first thing you see is a full-screen, animated 3D entrance (rotating gold rings, particles) with only two choices: **Log In** or **Continue as Guest**. Either choice smoothly auto-scrolls you into the real homepage.

**Customer**
- Search & filter venues **across every major Indian city** by category, capacity, price and date
- Real-time availability calendar (blackout dates + existing bookings respected)
- **Interactive 3D preview** for Grand Mehfil & Rangoli Lawns (Amravati) — drag to rotate, scroll to zoom, auto-rotating camera, reflective floor, chandelier / string-lights, sparkles
- **Decoration customisation** — pick a preset theme or hand-pick your own drape/mandap and accent colours with live colour pickers; the 3D model updates instantly
- **Caterer, Menu & Photographer marketplace** — every option is sortable by ★ rating or price, so you always see the best-rated options first
- **Pre-submit your event playlist** — add song titles/artists the DJ should play, from entry to the last dance
- Checkout with a mock Razorpay (test-mode) payment — **30% advance to confirm**, balance due at the venue
- **Tiered cancellation & refund policy**, shown before you book and again before you cancel:

  | Cancel window before the event | Refund of advance paid |
  |---|---|
  | 30+ days before | 100% (full refund) |
  | 15–29 days before | 50% |
  | 7–14 days before | 25% |
  | Less than 7 days before | 0% (no refund) |

- My Bookings dashboard — track bookings, see live refund previews, cancel with confirmation
- Parameter-wise venue reviews (decoration, cleanliness, punctuality, value)

**Vendor**
- Register as a vendor and list venues in any city
- Add decoration themes and add-on services per venue
- Manage bookings and view an earnings dashboard
- Blackout-date support to block manual bookings

**Platform**
- JWT authentication (email + password) — structured so it can be swapped for Firebase Auth
- REST API with interactive Swagger docs at `/docs`
- Seed script pre-loads **18 venues across 15 Indian cities** (including the two 3D flagship venues), decoration themes, add-ons, caterers, photographers, menu packages and a sample review

---

## 🧱 Tech Stack (from the project synopsis only)

| Layer | Technology |
|---|---|
| Frontend | React.js (Vite) + Tailwind CSS |
| 3D Visualization | Three.js + React Three Fiber + drei |
| Animation | Framer Motion (React-native, CSS-based transitions) |
| Backend / API | FastAPI (Python 3.10+) |
| Database | PostgreSQL (SQLite by default for zero-setup local runs) |
| Auth | JWT (email/password) — pluggable for Firebase Authentication |
| Payments | Razorpay (Test Mode) — mock-verified flow, ready to wire to live keys, 30% advance |
| Media Storage | Cloudinary-ready (image URLs used directly in the demo) |
| Notifications | Nodemailer/EmailJS-ready hook points in the booking flow |
| Scheduling | Custom real-time availability engine |

---

## 📁 Project Structure

```
venueconnect/
├── backend/                       FastAPI REST API
│   ├── app/
│   │   ├── main.py                App entrypoint, CORS, routers
│   │   ├── database.py            SQLAlchemy engine/session (SQLite / PostgreSQL)
│   │   ├── models.py              User, Venue, Theme, AddOn, Caterer, Photographer,
│   │   │                          MenuPackage, PlaylistSong, Booking, Review…
│   │   ├── schemas.py             Pydantic request/response models
│   │   ├── auth.py                Password hashing + JWT helpers
│   │   ├── refund_policy.py       Tiered cancellation/refund calculation
│   │   ├── seed.py                Pan-India demo data seeder
│   │   └── routers/                auth, venues, bookings, vendor, reviews, catalog
│   ├── requirements.txt
│   ├── .env.example
│   └── run.sh                     One-command setup + run (Linux/macOS)
│
├── frontend/                       React + Vite + Tailwind + Three.js
│   ├── src/
│   │   ├── pages/                  Home, Venues, VenueDetail, Login, Register,
│   │   │                          CustomerDashboard, VendorDashboard, About
│   │   ├── components/
│   │   │   ├── Gate.jsx            Animated 3D entrance / login-or-skip gate
│   │   │   ├── VenueScene3D.jsx    Hand-modelled Grand Mehfil & Rangoli Lawns scenes
│   │   │   ├── BookingModal.jsx    Multi-step checkout (caterer/menu/photographer/
│   │   │   │                      playlist/add-ons/30% payment)
│   │   │   ├── RatingPicker.jsx    Rating/price-sortable caterer/photographer/menu picker
│   │   │   ├── PlaylistBuilder.jsx Pre-submit song playlist UI
│   │   │   ├── RefundPolicy.jsx    Cancellation policy table
│   │   │   ├── Calendar.jsx, Navbar.jsx, Footer.jsx, VenueCard.jsx
│   │   ├── context/                AuthContext (JWT session)
│   │   └── api/axios.js            Configured API client
│   ├── package.json
│   └── .env.example
│
└── README.md                       (this file)
```

---

## 🚀 Quick Start

You need **Python 3.10+**, **Node.js 18+** and **npm** installed.

### 1. Backend (FastAPI)

```bash
cd backend
cp .env.example .env          # edit values if needed (defaults work out of the box)
python3 -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m app.seed             # creates venueconnect.db with pan-India demo data
uvicorn app.main:app --reload --port 8000
```

The API is now running at **http://localhost:8000** — interactive docs at **http://localhost:8000/docs**.

> Or simply run `bash run.sh` from the `backend` folder to do all of the above in one step.

### 2. Frontend (React)

Open a **new terminal**:

```bash
cd frontend
cp .env.example .env           # defaults already point at localhost:8000
npm install
npm run dev
```

The app is now running at **http://localhost:5173**. You'll land on the animated **Gate** screen first — click **Log In** or **Continue as Guest** to enter the site.

### 3. Log in with demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `customer@venueconnect.com` | `password123` |
| Vendor | `vendor1@venueconnect.com` | `password123` |
| Vendor | `vendor2@venueconnect.com` | `password123` |

(Buttons for these are also pre-filled on the Login page.)

### 4. See the flagship 3D venues

- Go to **Home → "Two Venues, Fully Modelled in 3D"** section, or
- Search city = `Amravati` on the Venues page, and open **Grand Mehfil** or **Rangoli Lawns** — every other venue in the catalogue shows photos only, as designed.

---

## 🐘 Switching to PostgreSQL

The backend defaults to SQLite so it runs with zero setup. To use PostgreSQL (as specified in the proposed tech stack):

1. Install PostgreSQL and create a database:
   ```sql
   CREATE DATABASE venueconnect;
   CREATE USER venueconnect WITH PASSWORD 'venueconnect';
   GRANT ALL PRIVILEGES ON DATABASE venueconnect TO venueconnect;
   ```
2. Install the driver: `pip install psycopg2-binary`
3. In `backend/.env`, set:
   ```
   DATABASE_URL=postgresql+psycopg2://venueconnect:venueconnect@localhost:5432/venueconnect
   ```
4. Re-run `python -m app.seed` to create tables and demo data.

---

## 💰 Payment & Refund Logic

- **Booking**: customers pay a **30% advance** of the total (venue + theme + caterer + menu + photographer + add-ons) via a mocked Razorpay test-mode flow (`POST /api/bookings/pay`). The balance is due at the venue.
- **Cancellation**: `POST /api/bookings/{id}/cancel` calculates a refund of the **advance paid**, based on days remaining until the event (`app/refund_policy.py`):
  - 30+ days out → 100% refunded
  - 15–29 days out → 50% refunded
  - 7–14 days out → 25% refunded
  - < 7 days out → 0% refunded (no refund)
- Customers can preview their exact refund amount (`GET /api/bookings/{id}/refund-preview`) before confirming cancellation — this is shown live in the "My Bookings" cancel dialog.

---

## 💳 Connecting Real Services (Production Checklist)

The demo runs fully offline with mock/test-mode integrations. To go live:

- **Razorpay** — sign up at razorpay.com, replace `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` in `backend/.env`, and verify the payment signature server-side inside `app/routers/bookings.py::confirm_payment` instead of trusting the client-sent reference.
- **Firebase Authentication** — swap the JWT email/password flow in `app/auth.py` and `AuthContext.jsx` for the Firebase Admin SDK / Firebase JS SDK if you need phone-OTP or social login.
- **Cloudinary** — upload venue photos via the Cloudinary API instead of pasting external image URLs in the vendor "Add Venue" form.
- **Email/SMS** — wire an SMTP account (Nodemailer-style) or a transactional email API into the booking confirmation step in `app/routers/bookings.py`.
- **More 3D venues** — add a new `variant` case inside `VenueScene3D.jsx` and set `has_3d_model=True, model_variant="your_key"` on that venue's row to give it its own hand-modelled scene.

---

## 📜 License

Built as an academic project for the AI & Data Science department. Free to use and extend for coursework and demonstration purposes.



venv\Scripts\activate
python -m uvicorn app.main:app --reload --port 8000