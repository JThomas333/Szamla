import Database from "better-sqlite3";
const db = new Database("./data/database.sqlite");

// TÁBLÁK LÉTREHOZÁSA
function createTables() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS partners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nev TEXT NOT NULL,
      cim TEXT NOT NULL,
      adoszam TEXT NOT NULL,
      tipus TEXT NOT NULL CHECK(tipus IN ('elado', 'vevo'))  -- új oszlop, típus szerint elkülönítjük
    )
  `).run();

  db.prepare(`
    CREATE TABLE IF NOT EXISTS szamlak (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      szamlaszam TEXT NOT NULL,
      kiallito_id INTEGER NOT NULL,
      vevo_id INTEGER NOT NULL,
      kelte TEXT NOT NULL,
      teljesites TEXT NOT NULL,
      hatarido TEXT NOT NULL,
      vegosszeg REAL NOT NULL,
      afa REAL NOT NULL,
      is_storno INTEGER DEFAULT 0,
      FOREIGN KEY(kiallito_id) REFERENCES partners(id),
      FOREIGN KEY(vevo_id) REFERENCES partners(id)
    )
  `).run();
}

createTables();

// CRUD PARTNER
export const getAllPartners = () => db.prepare("SELECT * FROM partners").all();

// Új lekérdezések, eladók és vevők külön
export const getEladok = () => db.prepare("SELECT * FROM partners WHERE tipus = 'elado'").all();
export const getVevok = () => db.prepare("SELECT * FROM partners WHERE tipus = 'vevo'").all();

export const createPartner = (nev, cim, adoszam, tipus) =>
  db.prepare("INSERT INTO partners (nev, cim, adoszam, tipus) VALUES (?, ?, ?, ?)").run(nev, cim, adoszam, tipus);

export const updatePartner = (id, nev, cim, adoszam) =>
  db.prepare("UPDATE partners SET nev = ?, cim = ?, adoszam = ? WHERE id = ?").run(nev, cim, adoszam, id);

// Számla CRUD
export const getAllSzamlak = () => db.prepare(`
  SELECT sz.id, sz.szamlaszam, sz.kelte, sz.teljesites, sz.hatarido, sz.vegosszeg, sz.afa,
         sz.is_storno, kiallito.nev AS kiallito_nev, vevo.nev AS vevo_nev
  FROM szamlak sz
  JOIN partners kiallito ON sz.kiallito_id = kiallito.id
  JOIN partners vevo ON sz.vevo_id = vevo.id
`).all();

export const getSzamlaById = (id) => db.prepare("SELECT * FROM szamlak WHERE id = ?").get(id);

export const createSzamla = (szamlaszam, kiallito_id, vevo_id, kelte, teljesites, hatarido, vegosszeg, afa) =>
  db.prepare(`
    INSERT INTO szamlak (szamlaszam, kiallito_id, vevo_id, kelte, teljesites, hatarido, vegosszeg, afa)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(szamlaszam, kiallito_id, vevo_id, kelte, teljesites, hatarido, vegosszeg, afa);

export const markSzamlaAsStorno = (id) =>
  db.prepare("UPDATE szamlak SET is_storno = 1 WHERE id = ?").run(id);


// Feltöltés kezdéshez
export function resetDatabase() {
  db.prepare("DROP TABLE IF EXISTS szamlak").run();
  db.prepare("DROP TABLE IF EXISTS partners").run();
  createTables();

  const partners = [
    { nev: "Sándor", cim: "Budapest", adoszam: "87654321-2-34", tipus: "elado" },
    { nev: "Lajos", cim: "Pécs", adoszam: "23426782-3-46", tipus: "elado" },
    { nev: "Noémi", cim: "Szeged", adoszam: "332537490-4-71", tipus: "elado" },

    { nev: "Patrik", cim: "Budapest, Fő utca 1.", adoszam: "12345678-1-12", tipus: "vevo" },
    { nev: "Balázs", cim: "Pécs, Dózsa u. 12.", adoszam: "23456789-2-45", tipus: "vevo" },
    { nev: "Dóra", cim: "Szeged, Tavasz u. 9.", adoszam: "34567890-3-78", tipus: "vevo" }
  ];

  const ids = partners.map(p => createPartner(p.nev, p.cim, p.adoszam, p.tipus).lastInsertRowid);

  for (let i = 0; i < 3; i++) {
    for (let vevoId = 4; vevoId <= 6; vevoId++) {
      createSzamla(`SZ-2025-00${vevoId}${i}`, 1, vevoId, "2025-05-30", "2025-05-30", "2025-06-15", 100000 + i * 10000, 27000 + i * 2700);
    }
  }
}
