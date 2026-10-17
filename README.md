# Parcella – calcolo onorari periti industriali elettrotecnici

Web app statica (HTML + JavaScript puro, nessuna dipendenza, nessun server) per preparare **preventivi e parcelle** con tre metodi di calcolo
confrontabili e combinabili, ed esportare **Excel, PDF, preventivo/parcella in Word e disciplinare d'incarico**.

**Password iniziale:** vedi il commento in `js/config.js` (stessa degli altri programmi). **Cambiala** con `imposta-password.html`.

## Metodi di calcolo
1. **Parametri DM 17/06/2016** – `CP = Σ (V × G × Q × P)`, `P = 0,03 + 10 / V^0,4` (per V < 25.000 € P non supera il valore a 25.000 €).
   Categorie impianti e tecnologie dell'informazione della tavola Z-1 (IA.01–IA.04, IB.04–IB.12, T.01–T.03) con il grado di complessità G;
   prestazioni della tavola Z-2 (SF, progettazione preliminare/definitiva/esecutiva, direzione lavori, contabilità, sicurezza CSP/CSE, collaudi) con il parametro Q.
   Per ogni categoria d'opera si indicano l'importo dei lavori V e le prestazioni; ci sono gruppi preimpostati per tipologia di incarico.
2. **Costo orario** – profili (professionista, aiuto iscritto, aiuto di concetto) con tariffe modificabili; i valori iniziali sono il centro degli
   intervalli dell'art. 6 del DM (50–75, 37–50, 30–37 €/h). Trasferte e spese documentate.
3. **Tariffa a scaglioni** – tabelle percentuali definite dall'utente (importo → percentuale), progressive o per classe, anche una per tipologia di prestazione.
   Il programma non include tabelle di tariffe non più vigenti: si compilano nel programma.

La pagina **Parcella** confronta i metodi e li combina (si spuntano quelli da includere), poi applica maggiorazione/sconto, spese e oneri accessori
(forfait art. 5 DM 2016: massimo 25% fino a 1 Mio €, 10% da 25 Mio €, interpolazione lineare, oppure % manuale), contributo integrativo EPPI,
IVA, ritenuta d'acconto, bollo, acconti e regime forfettario.

## Archivio
Le pratiche sono salvate nel browser (pagina *Archivio*) e si possono salvare/aprire come file `.parcella.json`. I dati dello studio sono ricordati.

## Provarla in locale
```bash
python -m http.server 8126
```
poi apri http://localhost:8126.

## Pubblicazione e password
Repository GitHub con GitHub Pages (Settings → Pages → `main` / root). La password è verificata **nel browser** (PBKDF2): tiene fuori i curiosi
ma chi apre un repository pubblico può leggere il codice. Per cambiarla: `imposta-password.html` → incolla il blocco in `js/config.js`.

## Dati normativi e verifiche necessarie
- G, Q e la formula derivano dall'allegato del DM 17/06/2016 (GU n. 174 del 27/07/2016), tavole Z-1 e Z-2. Tutti i valori sono modificabili nella pagina *Tabelle*.
- **Colonne "Impianti A/B" della tavola Z-2:** differiscono solo per QbII.01, QbIII.01 e QcI.01. L'assegnazione automatica è IA.01–IA.02 → A,
  IA.03–IA.04 e IB.08–IB.12 → B; **da verificare sul testo ufficiale** e modificabile per ogni categoria d'opera.
- Sono incluse solo le prestazioni con colonna leggibile senza ambiguità; per le altre (es. antincendio, relazione energetica) usare le **prestazioni libere** con Q manuale.
- Per le voci a scaglioni (QcI.09 e QcI.10) il Q applicato è la media ponderata sul valore V; verificare i valori dei due scaglioni.
- **Lavori pubblici dal 1/7/2023:** si applica l'Allegato I.13 del D.Lgs. 36/2023 (PFTE), con tabelle proprie non incluse. Il gruppo "PFTE" usa le voci della progettazione preliminare del DM 2016 solo come approssimazione.
- Le tariffe professionali sono state abrogate nel 2012: nel privato il compenso è quello concordato; DM 140/2012 e DM 2016 sono riferimenti, non obblighi.
- Lo strumento è di supporto e non sostituisce la valutazione del professionista.
