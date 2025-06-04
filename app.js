import express from "express";
import cors from "cors";
import * as db from "./util/database.js";

const app = express();
const PORT = 8080;
app.use(cors());
app.use(express.json());

db.resetDatabase();

app.get("/szamlak", (req, res) => {
  const szamlak = db.getAllSzamlak();
  res.json(szamlak);
});

app.post("/szamlak", (req, res) => {
  const { szamlaszam, kiallito_id, vevo_id, kelte, teljesites, hatarido, vegosszeg, afa } = req.body;
  if (!szamlaszam || !kiallito_id || !vevo_id || !kelte || !teljesites || !hatarido || !vegosszeg || !afa) {
    return res.status(400).json({ message: "Hiányzó adat" });
  }

  const kelteDate = new Date(kelte);
  const hataridoDate = new Date(hatarido);
  const maxHatarido = new Date(kelteDate);
  maxHatarido.setDate(maxHatarido.getDate() + 30);
  if (hataridoDate > maxHatarido) {
    return res.status(400).json({ message: "A fizetési határidő nem lehet több mint 30 nappal a kelte után." });
  }

  const result = db.createSzamla(szamlaszam, kiallito_id, vevo_id, kelte, teljesites, hatarido, vegosszeg, afa);
  res.status(201).json({ id: result.lastInsertRowid });
});

app.post("/szamlak/:id/storno", (req, res) => {
  const id = parseInt(req.params.id);
  const szamla = db.getSzamlaById(id);
  if (!szamla) {
      return res.status(404).json({ message: "Számla nem található" });
    }
  

  db.szamlaStorno(id);
  const ujSzamlaszam = szamla.szamlaszam + "-ST";
  const result = db.createSzamla(
    ujSzamlaszam,
    szamla.kiallito_id,
    szamla.vevo_id,
    szamla.kelte,
    szamla.teljesites,
    szamla.hatarido,
    szamla.vegosszeg,
    szamla.afa
  );

  res.status(201).json({ newInvoiceId: result.lastInsertRowid });
});

app.get("/partnerek", (req, res) => {
  const partnerek = db.getAllPartners();
  res.json(partnerek);
});

app.get("/eladok", (req, res) => {
  const eladok = db.getEladok();
  res.json(eladok);
});

app.get("/vevok", (req, res) => {
  const vevok = db.getVevok();
  res.json(vevok);
});

app.put("/partnerek/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const { nev, cim, adoszam } = req.body;

  if (!nev || !cim || !adoszam) {
    return res.status(400).json({ message: "Hiányzó adat" });
  }

  const partner = db.getAllPartners().find(p => p.id == id);
  if (!partner){
return res.status(404).json({ message: "Partner nem található" });
  } 

  db.updatePartner(id, nev, cim, adoszam);
  res.json({ message: "Partner frissítve" });
});

app.listen(PORT, () => console.log(`API fut a ${PORT}-as porton.`));
