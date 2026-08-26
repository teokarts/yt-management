import {
  DocShell,
  DocNote,
  DocKbd,
  DocH3,
  DocOl,
  DocUl,
} from "@/components/docs/doc-shell";
import { APP_NAME } from "@/lib/constants";

export function HelpPage() {
  return (
    <DocShell
      backHref="/"
      backLabel="Επιστροφή στην αρχική"
      title="Οδηγίες χρήσης"
      description={`Ο πλήρης οδηγός για τη ${APP_NAME} — από την αποθήκευση του πρώτου βίντεο μέχρι την πλήρη οργάνωση της βιβλιοθήκης σου.`}
      sections={[
        {
          id: "eisagogi",
          title: "Τι είναι",
          body: (
            <>
              <p>
                Η <strong className="text-primary">{APP_NAME}</strong> είναι μια προσωπική
                βιβλιοθήκη βίντεο. Αντί να μαζεύεις σελιδοδείκτες και καρτέλες με βίντεο του
                YouTube, τα αποθηκεύεις εδώ: με εξώφυλλο, κανάλι, διάρκεια και περιγραφή — χωρίς να
                χρειαστεί να γράψεις τίποτα με το χέρι.
              </p>
              <p>
                Κάθε βίντεο μπορεί να μπει σε πολλές κατηγορίες, να πάρει όσα tags χρειάζεται και
                να έχει δικά του σημειώματα. Όλα μαζί είναι αναζητήσιμα και βρίσκονται μία αναζήτηση
                μακριά.
              </p>
            </>
          ),
        },
        {
          id: "ekkinisi",
          title: "Ξεκινώντας",
          body: (
            <>
              <DocOl>
                <li>
                  Από την αρχική σελίδα πάτα <strong className="text-primary">Get started</strong>{" "}
                  για να δημιουργήσεις λογαριασμό.
                </li>
                <li>
                  Συμπλήρωσε email και κωδικό (τουλάχιστον 6 χαρακτήρες). Ένας λογαριασμός
                  δημιουργείται σχεδόν αμέσως — δεν απαιτείται επιβεβαίωση email.
                </li>
                <li>
                  Ξέχασες τον κωδικό σου; Πάτα <strong className="text-primary">Forgot password</strong>{" "}
                  στη σελίδα εισόδου και θα λάβεις ένα σύνδεσμο επαναφοράς στο email σου.
                </li>
                <li>
                  Μετά τη σύνδεση πέφτεις κατευθείαν στη{" "}
                  <strong className="text-primary">βιβλιοθήκη</strong> σου.
                </li>
              </DocOl>
              <DocNote>
                Η εφαρμογή είναι στα Αγγλικά. Οι οδηγίες εδώ αναφέρονται στα κουμπιά με τα ακριβή
                ονόματά τους, ώστε να τα βρίσκεις εύκολα.
              </DocNote>
            </>
          ),
        },
        {
          id: "prosthiki",
          title: "Πώς προσθέτω βίντεο",
          body: (
            <>
              <p>
                Η πιο γρήγορη και συνηθισμένη ενέργεια. Από τη βιβλιοθήκη πάτα{" "}
                <strong className="text-primary">Add video</strong> (ή{" "}
                <DocKbd>n</DocKbd> από οπουδήποτε στην εφαρμογή) και κόλλησε ένα σύνδεσμο του
                YouTube.
              </p>
              <DocOl>
                <li>
                  Πάτα <strong className="text-primary">+</strong> (Add video) στη γραμμή της
                  βιβλιοθήκης ή <DocKbd>n</DocKbd> στο πληκτρολόγιο.
                </li>
                <li>Κόλλησε τον σύνδεσμο του βίντεο (youtube.com/watch?v=…, youtu.be/…, shorts κ.ά.).</li>
                <li>
                  Η εφαρμογή ανακτά αυτόματα τίτλο, κανάλι, διάρκεια, εξώφυλλο και περιγραφή. Αν
                  θέλεις, μπορείς να τα επεξεργαστείς πριν την αποθήκευση.
                </li>
                <li>
                  Πρόσθεσε κατηγορίες και tags ή άφησέ το για αργότερα — μπορείς να τα αλλάξεις ανά
                  πάσα στιγμή.
                </li>
              </DocOl>
              <DocNote>
                Αν το βίντεο δεν ανακτήσει στοιχεία, βεβαιώθηκε ότι ο σύνδεσμος είναι δημόσιο βίντεο
                και όχι private/unlisted. Η λίστα αναμονής του YouTube API μπορεί να προκαλέσει
                σπάνια καθυστερήσεις.
              </DocNote>
            </>
          ),
        },
        {
          id: "vivliothiki",
          title: "Η βιβλιοθήκη σου",
          body: (
            <>
              <p>
                Η βιβλιοθήκη είναι ο χώρος εργασίας σου. Στο αριστερό μενού (sidebar) βλέπεις:
              </p>
              <DocUl>
                <li>
                  <strong className="text-primary">All videos</strong> — όλα τα βίντεο σου.
                </li>
                <li>
                  <strong className="text-primary">Favorites</strong> — όσα έχεις προσθέσει στα
                  αγαπημένα (εικονίδιο καρδιάς).
                </li>
                <li>
                  <strong className="text-primary">Watch later</strong> — όσα έχεις σημειώσει «για
                  αργότερα».
                </li>
                <li>
                  <strong className="text-primary">Categories</strong> — οι κατηγορίες σου, με
                  χρώμα το καθένα.
                </li>
                <li>
                  <strong className="text-primary">Pinned tags</strong> — tags που έχεις «καρφιτσώσει»
                  για άμεση πρόσβαση (λειτουργούν και ως φίλτρα).
                </li>
              </DocUl>
              <p>
                Στο πάνω μέρος βλέπεις τη γραμμή αναζήτησης και τα κουμπιά{" "}
                <strong className="text-primary">Sort</strong>,{" "}
                <strong className="text-primary">Filters</strong> και πυκνότητας προβολής.
              </p>
            </>
          ),
        },
        {
          id: "organosi",
          title: "Οργάνωση: κατηγορίες και tags",
          body: (
            <>
              <DocH3>Κατηγορίες</DocH3>
              <p>
                Οι κατηγορίες είναι μεγάλες ομάδες (π.χ. «AI», «Development», «Design»). Μπορείς να
                δημιουργήσεις κατηγορία μέσα από το παράθυρο επεξεργασίας ενός βίντεο (Categories →
                New category). Ένα βίντεο μπορεί να ανήκει σε περισσότερες από μία κατηγορίες.
              </p>
              <DocH3>Tags</DocH3>
              <p>
                Τα tags είναι λεπτότερη σήμανση (π.χ. «tutorial», «podcast», «build»). Πληκτρολόγησε
                το tag στο αντίστοιχο πεδίο και πάτα <DocKbd>Enter</DocKbd> ή{" "}
                <DocKbd>,</DocKbd> για να το προσθέσεις. Υπάρχουν προτάσεις για tags που ήδη
                χρησιμοποιείς.
              </p>
              <DocH3>Καρφίτσωμα tags</DocH3>
              <p>
                Από τις <strong className="text-primary">Settings → Tags</strong> μπορείς να
                καρφιτσώσεις (Pin) tags ώστε να εμφανίζονται στο sidebar. Πατώντας ένα pinned tag
                βλέπεις μόνο τα βίντεο που το φέρουν.
              </p>
            </>
          ),
        },
        {
          id: "anazitisi",
          title: "Αναζήτηση και φίλτρα",
          body: (
            <>
              <p>
                Πάτα στη γραμμή αναζήτησης (ή <DocKbd>/</DocKbd>) και ξεκίνα να πληκτρολογείς. Η
                αναζήτηση καλύπτει τίτλους, κανάλια, περιγραφές και σημειώσεις. Όλα αλλάζουν
                ζωντανά όσο γράφεις.
              </p>
              <p>
                Το κουμπί <strong className="text-primary">Filters</strong> ανοίγει τα φίλτρα:
              </p>
              <DocUl>
                <li>
                  <strong className="text-primary">Status</strong> — Unwatched / Watching /
                  Watched.
                </li>
                <li>
                  <strong className="text-primary">Date</strong> — All time / Today / Last 7 days /
                  Last 30 days (βάσει πότε το πρόσθεσες).
                </li>
                <li>
                  <strong className="text-primary">Channel</strong> — ένα ή περισσότερα κανάλια.
                </li>
                <li>
                  <strong className="text-primary">Tags</strong> — μόνο βίντεο με επιλεγμένα tags.
                </li>
              </DocUl>
              <p>
                Τα ενεργά φίλτρα εμφανίζονται ως «chips» πάνω από τα βίντεο. Πάτα το{" "}
                <strong className="text-primary">×</strong> σε ένα chip για να το αφαιρέσεις ή την
                επιλογή <strong className="text-primary">Clear all</strong> για να καθαρίσεις όλα.
              </p>
            </>
          ),
        },
        {
          id: "taxinomisi",
          title: "Ταξινόμηση",
          body: (
            <>
              <p>
                Το κουμπί <strong className="text-primary">Sort</strong> ταξινομεί τη λίστα με 7
                τρόπους:
              </p>
              <DocUl>
                <li><strong>Recently added</strong> — πιο πρόσφατα προστέθηκαν πρώτα (προεπιλογή).</li>
                <li><strong>Oldest added</strong> — παλαιότερα προστέθηκαν πρώτα.</li>
                <li><strong>Newest / Oldest video</strong> — βάσει ημερομηνίας δημοσίευσης του βίντεο.</li>
                <li><strong>Title A–Z / Z–A</strong> — αλφαβητικά.</li>
                <li><strong>Channel</strong> — αλφαβητικά κατά κανάλι.</li>
              </DocUl>
              <p>
                Μπορείς να ορίσεις την προεπιλεγμένη ταξινόμηση στις{" "}
                <strong className="text-primary">Settings → Default sorting</strong>.
              </p>
            </>
          ),
        },
        {
          id: "provoli",
          title: "Προβολή και πυκνότητα",
          body: (
            <>
              <p>
                Ανάλογα με την οθόνη και τις προτιμήσεις σου, διάλεξε ανάμεσα σε 4 προβολές από το
                μενού δίπλα στο Sort (ή από τις Settings):
              </p>
              <DocUl>
                <li><strong>Cozy</strong> — μεγάλες κάρτες, λίγες ανά σειρά.</li>
                <li><strong>Comfortable</strong> — ισορροπημένο πλέγμα (προεπιλογή).</li>
                <li><strong>Compact</strong> — περισσότερα βίντεο ανά σειρά.</li>
                <li><strong>List</strong> — εξώφυλλο αριστερά, λεπτομέρειες δεξιά.</li>
              </DocUl>
              <p>
                Η επιλογή αποθηκεύεται στο προφίλ σου, οπότε ισχύει και στις επόμενες επισκέψεις.
              </p>
            </>
          ),
        },
        {
          id: "katastasi",
          title: "Κατάσταση παρακολούθησης",
          body: (
            <>
              <p>Πάνω σε κάθε κάρτα (ή μέσα στο βίντεο) έχεις γρήγορες ενέργειες:</p>
              <DocUl>
                <li>
                  <strong className="text-primary">Watch status</strong> — κύκλος Unwatched →
                  Watching → Watched. Χρήσιμο για σειρές μαθημάτων που δεν θέλεις να ξεχάσεις στη
                  μέση.
                </li>
                <li>
                  <strong className="text-primary">Favorite</strong> (καρδιά) — το βάζει στα
                  αγαπημένα.
                </li>
                <li>
                  <strong className="text-primary">Watch later</strong> — το προσθέτει στη λίστα
                  «για αργότερα».
                </li>
              </DocUl>
            </>
          ),
        },
        {
          id: "shmeiwseis",
          title: "Σημειώσεις",
          body: (
            <>
              <p>
                Μέσα στη σελίδα ενός βίντεο, κάτω από το player, υπάρχει το πεδίο{" "}
                <strong className="text-primary">Notes</strong>. Γράψε ό,τι θέλεις να θυμάσαι —
                βασικά σημεία, timestamps, συνδέσεις με άλλα βίντεο. Οι σημειώσεις συμπεριλαμβάνονται
                στην αναζήτηση.
              </p>
            </>
          ),
        },
        {
          id: "rithmiseis",
          title: "Ρυθμίσεις",
          body: (
            <>
              <p>
                Η σελίδα <strong className="text-primary">Settings</strong> (εικονίδιο στο sidebar)
                συγκεντρώνει:
              </p>
              <DocUl>
                <li><strong>Profile</strong> — εμφανιζόμενο όνομα (email είναι σταθερό).</li>
                <li><strong>Defaults</strong> — προεπιλεγμένη ταξινόμηση και πυκνότητα καρτών.</li>
                <li><strong>Tags</strong> — καρφίτσωμα και διαγραφή tags.</li>
                <li><strong>Account</strong> — αποσύνδεση.</li>
              </DocUl>
            </>
          ),
        },
        {
          id: "sintomeyseis",
          title: "Συντομεύσεις πληκτρολογίου",
          body: (
            <>
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-ui">
                  <thead>
                    <tr className="border-b border-border text-muted">
                      <th className="px-4 py-2.5 font-semibold">Πλήκτρο</th>
                      <th className="px-4 py-2.5 font-semibold">Ενέργεια</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    <tr>
                      <td className="px-4 py-2.5"><DocKbd>n</DocKbd></td>
                      <td className="px-4 py-2.5">Προσθήκη βίντεο</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5"><DocKbd>/</DocKbd></td>
                      <td className="px-4 py-2.5">Εστίαση στη γραμμή αναζήτησης</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </>
          ),
        },
        {
          id: "tipss",
          title: "Συμβουλές",
          body: (
            <>
              <DocUl>
                <li>Πρόσθεσε tag «watch-later» στα βίντεο που θες να δεις σύντομα και κάνε το Pin — γίνεται σχεδόν λίστα αναμονής.</li>
                <li>Αν βλέπεις σειρά μαθημάτων, χρησιμοποίησε το status Watching για να ξέρεις πού σταμάτησες.</li>
                <li>Βάλε ένα βίντεο σε πολλές κατηγορίες: «AI» + «Tutorials» είναι καλύτερο από μία γενική κατηγορία.</li>
                <li>Η αναζήτηση βλέπει και τις σημειώσεις — κράτα λέξεις-κλειδιά εκεί για να ξαναβρίσκεις βίντεο μετά από μήνες.</li>
              </DocUl>
            </>
          ),
        },
      ]}
    />
  );
}