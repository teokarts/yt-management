import {
  DocShell,
  DocCode,
  DocNote,
  DocH3,
  DocOl,
  DocUl,
} from "@/components/docs/doc-shell";
import { APP_NAME } from "@/lib/constants";

export function DeployPage() {
  return (
    <DocShell
      backHref="/"
      backLabel="Επιστροφή στην αρχική"
      title="Οδηγίες εγκατάστασης"
      description={`Πώς να στήσεις και να ανεβάσεις τη ${APP_NAME} στο διαδίκτυο, κάτω από τη διεύθυνση https://plinetpierias.gr/youtube-bookmarks — βήμα βήμα.`}
      sections={[
        {
          id: "eidotita",
          title: "Τι χρειάζεσαι",
          body: (
            <>
              <DocOl>
                <li>
                  <strong className="text-primary">Node.js 20 ή νεότερο</strong> σε έναν server
                  (ή τοπικά για build). Η εφαρμογή είναι Next.js και χρειάζεται Node — δηλαδή
                  <strong className="text-primary"> δεν</strong> αρκεί απλό static hosting (FTP).
                  Θα χρειαστείς είτε έναν VPS, είτε hosting με υποστήριξη Node.
                </li>
                <li>
                  <strong className="text-primary">Ένα Supabase project</strong> (δωρεάν tier
                  αρκεί) — βάση δεδομένων και αυθεντικοποίηση.
                </li>
                <li>
                  <strong className="text-primary">Ένα YouTube Data API v3 key</strong> για την
                  ανάκτηση στοιχείων των βίντεο.
                </li>
                <li>Το domain/ιστοσελίδα όπου θα ανέβει (π.χ. plinetpierias.gr).</li>
              </DocOl>
              <DocNote tone="warn">
                Η εφαρμογή δεν μπορεί να «ανέβει» ως στατικά αρχεία. Χρησιμοποιεί server actions,
                σύνδεση χρήστη και δυναμικές σελίδες. Η λύση είναι ένας server με Node.js και
                reverse-proxy του Apache/nginx προς τον Node — τα βήματα περιγράφονται παρακάτω.
              </DocNote>
            </>
          ),
        },
        {
          id: "supabase",
          title: "1. Δημιούργησε και ρύθμισε το Supabase",
          body: (
            <>
              <DocOl>
                <li>
                  Δημιούργησε project στο{" "}
                  <a
                    className="text-accent-strong underline"
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                  >
                    supabase.com
                  </a>{" "}
                  και σημείωσε το <strong className="text-primary">Project URL</strong> και το{" "}
                  <strong className="text-primary">anon public key</strong> (Settings → API).
                </li>
                <li>
                  Άνοιξε τον <strong className="text-primary">SQL Editor</strong> και εκτέλεσε με
                  τη σειρά τα migrations από τον φάκελο{" "}
                  <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                    supabase/migrations
                  </code>
                  :
                  <DocCode>{`-- 20240101000000_initial_schema.sql
-- 20240101000002_add_list_density.sql
-- 20240101000003_super_admin.sql`}</DocCode>
                  (Κάθε ένα χωριστά — copy-paste και Run.)
                </li>
                <li>
                  Στο <strong className="text-primary">Authentication → URL Configuration</strong>{" "}
                  ρύθμισε:
                  <DocUl>
                    <li>
                      <strong>Site URL:</strong>{" "}
                      <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                        https://plinetpierias.gr/youtube-bookmarks
                      </code>
                    </li>
                    <li>
                      <strong>Redirect URLs:</strong>{" "}
                      <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                        https://plinetpierias.gr/youtube-bookmarks
                      </code>
                    </li>
                  </DocUl>
                </li>
                <li>
                  <strong className="text-primary">Authentication → Providers → Email:</strong>{" "}
                  άφησε ενεργό το email. Αν θέλεις άμεση είσοδο χωρίς επιβεβαίωση, απενεργοποίησε
                  το <em>Confirm email</em> (προαιρετικό).
                </li>
                <li>
                  Δημιούργησε τον λογαριασμό του διαχειριστή (π.χ.{" "}
                  <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                    tkarts@sch.gr
                  </code>
                  ) μέσα από την εφαρμογή (Sign up) και μετά εκτέλεσε στον SQL Editor:
                  <DocCode>{`update public.profiles set is_super_admin = true
where id in (select id from auth.users where email = 'tkarts@sch.gr');`}</DocCode>
                </li>
              </DocOl>
            </>
          ),
        },
        {
          id: "youtube",
          title: "2. YouTube Data API",
          body: (
            <>
              <DocOl>
                <li>
                  Δημιούργησε ένα project στο{" "}
                  <a
                    className="text-accent-strong underline"
                    href="https://console.cloud.google.com/apis"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Google Cloud Console
                  </a>{" "}
                  (αν δεν έχεις), ενεργοποίησε το{" "}
                  <strong className="text-primary">YouTube Data API v3</strong> και δημιούργησε ένα{" "}
                  <em>API key</em>.
                </li>
                <li>
                  Το key μπαίνει στη μεταβλητή{" "}
                  <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                    YOUTUBE_API_KEY
                  </code>{" "}
                  (μόνο server-side, ποτέ σε κώδικα στο frontend).
                </li>
                <li>
                  Το δωρεάν όριο είναι 10.000 μονάδες/ημέρα — μια ανάκτηση στοιχείων κοστίζει 1
                  μονάδα. Επαρκεί άνετα για προσωπική χρήση.
                </li>
              </DocOl>
            </>
          ),
        },
        {
          id: "metavlites",
          title: "3. Μεταβλητές περιβάλλοντος",
          body: (
            <>
              <p>
                Αντέγραψε το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  .env.example
                </code>{" "}
                σε{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  .env.local
                </code>{" "}
                και συμπλήρωσε τις τιμές. Για το deployment στον φάκελο{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /youtube-bookmarks
                </code>
                :
              </p>
              <DocCode>{`NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
YOUTUBE_API_KEY=AIza...

# Πλήρης διεύθυνση της εφαρμογής (σύνδεσμοι επαναφοράς κωδικού)
NEXT_PUBLIC_APP_URL=https://plinetpierias.gr/youtube-bookmarks

# Πρόθεμα φακέλου — διαβάζεται κατά το build
NEXT_PUBLIC_BASE_PATH=/youtube-bookmarks

# Μόνο αν θες ενεργό τον πίνακα διαχειριστή (Admin)
SUPABASE_SERVICE_ROLE_KEY=eyJ...`}</DocCode>
              <DocNote>
                Το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  NEXT_PUBLIC_BASE_PATH
                </code>{" "}
                διαβάζεται κατά το <em>build</em> και δηλώνει σε ποιον φάκελο βρίσκεται η
                εφαρμογή. Όλοι οι εσωτερικοί σύνδεσμοι και τα assets παίρνουν αυτόματα το πρόθεμα{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /youtube-bookmarks
                </code>
                . Χωρίς αυτό (κενό) η εφαρμογή δουλεύει στην κορυφή του domain.
              </DocNote>
            </>
          ),
        },
        {
          id: "build",
          title: "4. Build με subfolder",
          body: (
            <>
              <p>Εγκατάσταση εξαρτήσεων και παραγωγή build (Windows / PowerShell):</p>
              <DocCode>{`npm install
$env:NEXT_PUBLIC_BASE_PATH="/youtube-bookmarks"
$env:NEXT_PUBLIC_APP_URL="https://plinetpierias.gr/youtube-bookmarks"
npm run build`}</DocCode>
              <p>Σε Linux / macOS:</p>
              <DocCode>{`npm install
NEXT_PUBLIC_BASE_PATH=/youtube-bookmarks NEXT_PUBLIC_APP_URL=https://plinetpierias.gr/youtube-bookmarks npm run build`}</DocCode>
              <p>
                Αν θες «μεταφέρσιμο» build για Docker / ελάχιστο image, πρόσθεσε{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  output: &quot;standalone&quot;
                </code>{" "}
                στο{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  next.config.ts
                </code>{" "}
                — τότε το τελικό πακέτο τρέχει με ένα μόνο{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  node .next/standalone/server.js
                </code>
                .
              </p>
            </>
          ),
        },
        {
          id: "fyloxenia",
          title: "5. Φιλοξενία και reverse proxy",
          body: (
            <>
              <p>
                Ο Node.js server τρέχει σε μια πόρτα (π.χ. 3000) και το Apache/nginx του site κάνει
                «προώθηση» του φακέλου{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /youtube-bookmarks
                </code>{" "}
                προς αυτόν. Έτσι ο χρήστης βλέπει μόνο το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  plinetpierias.gr/youtube-bookmarks
                </code>{" "}
                ενώ πίσω τρέχει η εφαρμογή.
              </p>

              <DocH3>Επιλογή A — Δικό σου server (VPS)</DocH3>
              <DocOl>
                <li>Εγκατέστησε Node.js 20+ και αντίγραψε το project στον server.</li>
                <li>Στήσε τα env vars (βήμα 3) και κάνε build (βήμα 4) στον server.</li>
                <li>
                  Ξεκίνα την εφαρμογή με ένα process manager (π.χ. PM2):
                  <DocCode>{`npm i -g pm2
pm2 start npm --name youtube-bookmarker -- start -- --port 3000
pm2 save && pm2 startup`}</DocCode>
                </li>
              </DocOl>

              <DocH3>Apache (συνηθισμένο σε hosting .gr)</DocH3>
              <p>
                Στο <em>vhost</em> του site πρόσθεσε ένα reverse proxy για τον φάκελο (με{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  mod_proxy
                </code>{" "}
                ενεργό):
              </p>
              <DocCode>{`ProxyPass /youtube-bookmarks/ http://127.0.0.1:3000/youtube-bookmarks/
ProxyPassReverse /youtube-bookmarks/ http://127.0.0.1:3000/youtube-bookmarks/

ProxyPass /youtube-bookmarks http://127.0.0.1:3000/youtube-bookmarks
ProxyPassReverse /youtube-bookmarks http://127.0.0.1:3000/youtube-bookmarks`}</DocCode>
              <p>
                Αν το hosting δεν επιτρέπει reverse proxy, εναλλακτική είναι subdomain (π.χ.{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  bookmarker.plinetpierias.gr
                </code>
                ) με την ίδια λογική, αλλά χωρίς{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  basePath
                </code>
                .
              </p>

              <DocH3>Nginx</DocH3>
              <DocCode>{`location /youtube-bookmarks/ {
    proxy_pass http://127.0.0.1:3000/youtube-bookmarks/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_cache_bypass $http_upgrade;
}`}</DocCode>

              <DocH3>Επιλογή B — Docker</DocH3>
              <p>
                Με{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  output: &quot;standalone&quot;
                </code>
                , ένα απλό{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  Dockerfile
                </code>
                :
              </p>
              <DocCode>{`FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG NEXT_PUBLIC_BASE_PATH=/youtube-bookmarks
ARG NEXT_PUBLIC_APP_URL=https://plinetpierias.gr/youtube-bookmarks
RUN npm run build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production PORT=3000
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]`}</DocCode>
              <DocCode>{`docker build -t youtube-bookmarker .
docker run -d -p 3000:3000 --name youtube-bookmarker --env-file .env.production --restart unless-stopped youtube-bookmarker`}</DocCode>
              <DocNote>
                Η εφαρμογή πρέπει πάντα να «βλέπει» την ίδια διεύθυνση με τον χρήστη. Αν ο proxy
                αφαιρεί το πρόθεμα{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /youtube-bookmarks
                </code>{" "}
                πριν το στείλει στη Node (strip path), τότε δεν χρειάζεται{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  basePath
                </code>{" "}
                και τα παραπάνω απλοποιούνται. Τα πιο συνηθισμένα shared hosting όμως δεν
                υποστηρίζουν καθόλου reverse proxy — σε αυτή την περίπτωση χρειάζεσαι VPS ή
                subdomain.
              </DocNote>
            </>
          ),
        },
        {
          id: "elenchos",
          title: "6. Έλεγχος μετά το deploy",
          body: (
            <>
              <DocOl>
                <li>
                  Άνοιξε το{" "}
                  <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                    https://plinetpierias.gr/youtube-bookmarks
                  </code>{" "}
                  και δες αν φορτώνει η αρχική σελίδα με σωστά στυλ (αν τα στυλ είναι «χωρίς
                  εμφάνιση», το basePath/static files δεν προωθείται σωστά).
                </li>
                <li>Δημιούργησε λογαριασμό και κάνε σύνδεση.</li>
                <li>Πρόσθεσε ένα βίντεο και δες αν ανακτώνται τα στοιχεία (δοκιμάζει και το YouTube API).</li>
                <li>Δοκίμασε την επαναφορά κωδικού για να επιβεβαιώσεις το redirect URL στο Supabase.</li>
              </DocOl>
            </>
          ),
        },
        {
          id: "problhmata",
          title: "7. Αντιμετώπιση προβλημάτων",
          body: (
            <>
              <DocH3>Δεν φορτώνουν στυλ / εικόνες</DocH3>
              <p>
                Ο reverse proxy δεν προωθεί τον φάκελο{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /_next
                </code>
                . Πρόσθεσε και προώθηση για το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  /youtube-bookmarks/_next
                </code>{" "}
                ή διόρθωσε το ProxyPass.
              </p>
              <DocH3>Το «Προσθήκη βίντεο» δεν βρίσκει στοιχεία</DocH3>
              <p>
                Έλεγξε το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  YOUTUBE_API_KEY
                </code>{" "}
                και ότι το YouTube Data API v3 είναι ενεργό στο project του Google Cloud.
              </p>
              <DocH3>Το «Αποθήκευση ρύθμισης» αποτυγχάνει</DocH3>
              <p>
                Έλλειψη migration. Εκτέλεσε στο Supabase SQL Editor το{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  20240101000002_add_list_density.sql
                </code>
                .
              </p>
              <DocH3>Ο admin δεν ανοίγει / πετάει στο /app</DocH3>
              <p>
                Ο λογαριασμός δεν έχει{" "}
                <code className="rounded bg-sunken px-1.5 py-0.5 font-mono text-[13px] text-primary">
                  is_super_admin = true
                </code>
                . Εκτέλεσε την SQL του βήματος 1 ή σιγουρέψου ότι η εγγραφή δημιουργήθηκε πριν
                εκτελεστεί.
              </p>
            </>
          ),
        },
      ]}
    />
  );
}