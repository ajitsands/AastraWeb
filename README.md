# AASTRA Architectural Hardware — Website, Admin Panel & PDF Catalogue Generator

Full-stack architectural hardware catalogue website for **AASTRA** (`https://aastra.uk/`), built with:
- **Frontend**: ReactJS (Vite + TailwindCSS + React Router + jsPDF/html2canvas)
- **Middleware / API**: PHP 8.2 (MVC REST API)
- **Database**: MySQL (`aastra_db` local / `aastra_web_db` production)

## Brand & Design
- **Classic Light Background** by default with a **Dark Mode toggle** in the navigation bar.
- **Brand Palette**: Gray, Black, and Gold using official AASTRA logos and icons (`frontend/public/brand/`).
- **No Shopping Cart**: Focused on architectural specification, finishes showcase, trade enquiries, and instant A4 PDF brochure generation.

## Key Features
1. **Public Architectural Catalogue**
   - Classic landing page with Categories, Browse by Finish, Featured Hardware, PDF Catalogue Showcase, and 10-Year Mechanical Guarantee.
   - Category & Finish filtering + search by model code (e.g. `AAE.671`, `ARH.201`).
   - Product detail pages with 1–3 images/technical drawings, specification lists, merged-cell ordering tables, and one-click PDF datasheet export.
2. **Admin Panel (`/admin`)**
   - Protected by Admin login (`admin@aastra.uk` / `Aastra@2026` — change after first login).
   - **Categories** (Chapter numbers, section badges, vertical side tab labels).
   - **Finishes** (Finish codes, color swatches, metallic gradients).
   - **Items** (Name, Code, Specifications, 1–3 max uploaded images/drawings, interactive **Table Builder** with custom Rows & Columns + **Cell Merging/Unmerging**, finish tags, PDF group assignment).
   - **PDF Page Groups** (`AH.<Chapter>.<Page>`, e.g., `AH.8.06`, item ordering, live A4 preview & download).
3. **Restructured A4 PDF Generator**
   - Equal compact margins (~9.5mm on all 4 sides).
   - Clean grayscale architectural layout with optional subtle AASTRA gold trim.
   - Includes AASTRA header logo, vertical right-edge tab (`DOOR HARDWARE`), merged-cell tables, `AH.Chapter.Page` footer badge, **10-Year Mechanical Guarantee** seal, and `www.aastra.uk`.

## Local Setup (Windows / AppServ)
1. **Create & Seed MySQL Database (`aastra_db`)**:
   ```powershell
   php database/setup_db.php
   ```
   *(Or import `database/schema.sql` then `database/seed.sql` via MySQL Workbench / phpMyAdmin.)*
2. **Start PHP MVC Backend** (port `8000`):
   ```powershell
   php -S localhost:8000 -t backend/public
   ```
3. **Start React Frontend** (port `5173`):
   ```powershell
   cd frontend
   npm install
   npm run dev
   ```
   Open `http://localhost:5173` (Admin Panel: `http://localhost:5173/admin`).

## Production Deployment (`https://aastra.uk/`)
`backend/config/config.php` automatically switches to production credentials (`aastra_web_user` / `aastra_web_db`) whenever `HTTP_HOST` contains `aastra.uk`.
1. Import `database/schema.sql` and `database/seed.sql` into `aastra_web_db`.
2. Build the React frontend:
   ```powershell
   cd frontend
   npm run build
   ```
3. Upload contents of `frontend/dist/` to `public_html/`.
4. Upload `backend/` to `public_html/api/` (or map `/api` and `/uploads` to `backend/public/`).
