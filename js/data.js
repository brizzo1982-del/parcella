/* Dati normativi: DM 17/06/2016 (GU n. 174 del 27/07/2016), tavole Z-1 (categorie e grado di complessità G) e Z-2 (parametri Q).
   Valori trascritti dall'allegato pubblicato in Gazzetta Ufficiale, limitati alle categorie impianti (IA, IB) e tecnologie dell'informazione (T)
   e alle prestazioni con colonna univocamente leggibile. Tutti i valori sono modificabili dall'utente nella pagina "Tabelle". */
(function () {
  'use strict';
  /* Tavola Z-1: [id, descrizione, G, colonna Q di default] */
  const CATEGORIE = [
    ['IA.01', 'Impianti meccanici a fluido: acqua, sanitari, fognatura, gas, aria compressa, antincendio', 0.75, 'A'],
    ['IA.02', 'Impianti meccanici: riscaldamento, raffrescamento, climatizzazione, solare termico', 0.85, 'A'],
    ['IA.03', 'Impianti elettrici in genere, illuminazione, telefonici, rivelazione incendi, fotovoltaici a corredo di edifici di importanza corrente', 1.15, 'B'],
    ['IA.04', 'Impianti elettrici, illuminazione, telefonici, sicurezza, rivelazione incendi, fotovoltaici a corredo di edifici complessi - cablaggi strutturati - fibra ottica', 1.30, 'B'],
    ['IB.04', 'Impianti industriali: depositi e discariche senza trattamento rifiuti', 0.55, 'A'],
    ['IB.05', 'Impianti industriali: industrie molitorie, cartarie, alimentari, tessili, legno, cuoio e simili', 0.70, 'A'],
    ['IB.06', 'Impianti industriali complessi (chimica, siderurgia, officine, termovalorizzatori, ecc.)', 0.70, 'A'],
    ['IB.07', 'Impianti industriali di complessità particolarmente rilevante', 0.75, 'A'],
    ['IB.08', 'Linee e reti per trasmissione e distribuzione di energia elettrica, telegrafia, telefonia', 0.50, 'B'],
    ['IB.09', 'Centrali idroelettriche ordinarie, stazioni di trasformazione e conversione, impianti di trazione elettrica', 0.60, 'B'],
    ['IB.10', 'Impianti termoelettrici, elettrochimica, elettrometallurgia, laboratori con ridotte problematiche tecniche', 0.75, 'B'],
    ['IB.11', 'Campi fotovoltaici - Parchi eolici', 0.90, 'B'],
    ['IB.12', 'Micro centrali idroelettriche, impianti termoelettrici e di elettrometallurgia complessi', 1.00, 'B'],
    ['T.01', 'Sistemi informativi, gestione documentale, dematerializzazione, data center, server farm', 0.95, 'T'],
    ['T.02', 'Reti locali e geografiche, cablaggi strutturati, fibra ottica, videosorveglianza, controllo accessi, wireless, ponti radio', 0.70, 'T'],
    ['T.03', 'Elettronica industriale, controllo numerico, automazione, robotica', 1.20, 'T']
  ];

  /* Tavola Z-2: [codice, fase, descrizione, Q impianti A, Q impianti B, Q tecnologie T, scaglioni opzionali]
     Impianti A/B differiscono solo per QbII.01, QbIII.01, QcI.01; per le altre voci A = B. */
  const U = (c, f, d, q, t) => [c, f, d, q, q, t];
  const PRESTAZIONI = [
    U('QaI.01', 'Studi di fattibilità', 'Relazione illustrativa', 0.045, 0.050),
    U('QaI.02', 'Studi di fattibilità', 'Relazione illustrativa, elaborati progettuali e tecnico economici', 0.090, 0.100),
    U('QaI.03', 'Studi di fattibilità', 'Supporto al RUP: accertamenti e verifiche preliminari', 0.020, 0.020),
    U('QaII.01', 'Stime e valutazioni', 'Stime sintetiche, basate su elementi sintetici e globali (d.P.R. 327/2001)', 0.040, 0.040),
    U('QaII.02', 'Stime e valutazioni', 'Stime particolareggiate, con criteri di valutazione, relazione motivata, computi (d.P.R. 327/2001)', 0.080, 0.080),
    U('QaII.03', 'Stime e valutazioni', 'Stime analitiche, con specifiche sullo stato e valore dei singoli componenti (d.P.R. 327/2001)', 0.160, 0.160),
    U('QbI.01', 'Progettazione preliminare', 'Relazioni, planimetrie, elaborati grafici', 0.090, 0.100),
    U('QbI.02', 'Progettazione preliminare', 'Calcolo sommario spesa, quadro economico di progetto', 0.010, 0.010),
    U('QbI.12', 'Progettazione preliminare', 'Progettazione integrale e coordinata - integrazione delle prestazioni specialistiche', 0.020, 0.020),
    U('QbI.16', 'Progettazione preliminare', 'Prime indicazioni e prescrizioni per la stesura dei Piani di Sicurezza', 0.010, 0.010),
    U('QbI.19', 'Progettazione preliminare', 'Supporto al RUP: supervisione e coordinamento della progettazione preliminare', 0.010, 0.010),
    U('QbI.20', 'Progettazione preliminare', 'Supporto al RUP: verifica della progettazione preliminare', 0.060, 0.060),
    ['QbII.01', 'Progettazione definitiva', 'Relazioni generale e tecniche, elaborati grafici, calcolo degli impianti', 0.16, 0.20, 0.250],
    U('QbII.03', 'Progettazione definitiva', 'Disciplinare descrittivo e prestazionale', 0.010, 0.010),
    U('QbII.05', 'Progettazione definitiva', 'Elenco prezzi unitari ed eventuali analisi, computo metrico estimativo, quadro economico', 0.070, 0.050),
    U('QbII.07', 'Progettazione definitiva', 'Rilievi planoaltimetrici', 0.020, 0.020),
    U('QbII.08', 'Progettazione definitiva', 'Schema di contratto, capitolato speciale d\'appalto (se progetto a base di gara)', 0.080, 0.070),
    U('QbII.17', 'Progettazione definitiva', 'Progettazione integrale e coordinata - integrazione delle prestazioni specialistiche', 0.050, 0.050),
    U('QbII.23', 'Progettazione definitiva', 'Aggiornamento delle prime indicazioni e prescrizioni per la redazione del PSC', 0.010, 0.010),
    U('QbII.26', 'Progettazione definitiva', 'Supporto al RUP: supervisione e coordinamento della progettazione definitiva', 0.010, 0.010),
    U('QbII.27', 'Progettazione definitiva', 'Supporto al RUP: verifica della progettazione definitiva', 0.130, 0.130),
    ['QbIII.01', 'Progettazione esecutiva', 'Relazione generale e specialistiche, elaborati grafici, calcoli esecutivi', 0.15, 0.04, 0.050],
    U('QbIII.02', 'Progettazione esecutiva', 'Particolari costruttivi e decorativi', 0.050, 0.100),
    U('QbIII.03', 'Progettazione esecutiva', 'Computo metrico estimativo, quadro economico, elenco prezzi, incidenza manodopera', 0.050, 0.030),
    U('QbIII.04', 'Progettazione esecutiva', 'Schema di contratto, capitolato speciale d\'appalto, cronoprogramma', 0.020, 0.020),
    U('QbIII.05', 'Progettazione esecutiva', 'Piano di manutenzione dell\'opera', 0.030, 0.020),
    U('QbIII.06', 'Progettazione esecutiva', 'Progettazione integrale e coordinata - integrazione delle prestazioni specialistiche', 0.030, 0.030),
    U('QbIII.07', 'Progettazione esecutiva', 'Piano di Sicurezza e Coordinamento (CSP)', 0.100, 0.100),
    U('QbIII.08', 'Progettazione esecutiva', 'Supporto al RUP: supervisione e coordinamento della progettazione esecutiva', 0.010, 0.010),
    U('QbIII.09', 'Progettazione esecutiva', 'Supporto al RUP: verifica della progettazione esecutiva', 0.130, 0.130),
    U('QbIII.10', 'Progettazione esecutiva', 'Supporto al RUP: programmazione e progettazione appalto', 0.040, 0.040),
    U('QbIII.11', 'Progettazione esecutiva', 'Supporto al RUP: validazione del progetto', 0.010, 0.010),
    ['QcI.01', 'Direzione dell\'esecuzione', 'Direzione lavori, assistenza al collaudo, prove di accettazione', 0.32, 0.45, 0.350],
    U('QcI.02', 'Direzione dell\'esecuzione', 'Liquidazione, rendicontazioni e liquidazione tecnico contabile', 0.030, 0.030),
    U('QcI.03', 'Direzione dell\'esecuzione', 'Controllo aggiornamento elaborati di progetto, aggiornamento manuali d\'uso e manutenzione', 0.020, 0.020),
    U('QcI.04', 'Direzione dell\'esecuzione', 'Coordinamento e supervisione dell\'ufficio di direzione lavori', 0.020, 0.020),
    U('QcI.05', 'Direzione dell\'esecuzione', 'Ufficio di direzione lavori, per ogni addetto con qualifica di direttore operativo', 0.100, 0.100),
    U('QcI.06', 'Direzione dell\'esecuzione', 'Ufficio di direzione lavori, per ogni addetto con qualifica di ispettore di cantiere', 0.060, 0.060),
    U('QcI.07', 'Direzione dell\'esecuzione', 'Variante delle quantità del progetto in corso d\'opera (sulla somma dei valori assoluti delle quantità in più e in meno)', 0.150, 0.110),
    U('QcI.08', 'Direzione dell\'esecuzione', 'Variante del progetto in corso d\'opera (sugli importi lordi delle opere di nuova progettazione)', 0.320, 0.400),
    ['QcI.09', 'Direzione dell\'esecuzione', 'Contabilità dei lavori a misura (scaglioni)', 0.045, 0.045, 0.045, { limite: 500000, imp: 0.090, T: 0.090 }],
    ['QcI.10', 'Direzione dell\'esecuzione', 'Contabilità dei lavori a corpo (scaglioni)', 0.035, 0.035, 0.035, { limite: 500000, imp: 0.070, T: 0.070 }],
    U('QcI.11', 'Direzione dell\'esecuzione', 'Certificato di regolare esecuzione', 0.040, 0.040),
    U('QcI.12', 'Direzione dell\'esecuzione', 'Coordinamento della sicurezza in esecuzione (CSE)', 0.250, 0.250),
    U('QcI.13', 'Direzione dell\'esecuzione', 'Supporto al RUP: supervisione e coordinamento della D.L. e della C.S.E.', 0.040, 0.040),
    U('QdI.01', 'Verifiche e collaudi', 'Collaudo tecnico amministrativo (in corso d\'opera: compenso aumentato del 20%)', 0.080, 0.080),
    U('QdI.02', 'Verifiche e collaudi', 'Revisione tecnico contabile', 0.020, 0.020),
    ['QdI.04', 'Verifiche e collaudi', 'Collaudo tecnico funzionale degli impianti (d.m. 37/2008)', 0.180, 0.180, null]
  ];

  /* Prestazioni preimpostate per tipologia di incarico */
  const PRESET = {
    'Studio di fattibilità (SF)': ['QaI.01', 'QaI.02'],
    'Progetto preliminare / fattibilità (PFTE)*': ['QbI.01', 'QbI.02', 'QbI.12', 'QbI.16'],
    'Progetto definitivo': ['QbII.01', 'QbII.03', 'QbII.05', 'QbII.08', 'QbII.17', 'QbII.23'],
    'Progetto esecutivo': ['QbIII.01', 'QbIII.03', 'QbIII.04', 'QbIII.05', 'QbIII.06'],
    'Direzione lavori': ['QcI.01', 'QcI.02', 'QcI.03'],
    'Contabilità a misura': ['QcI.09'],
    'Contabilità a corpo': ['QcI.10'],
    'Coordinatore sicurezza progettazione (CSP)': ['QbIII.07'],
    'Coordinatore sicurezza esecuzione (CSE)': ['QcI.12'],
    'Collaudo tecnico-amministrativo': ['QdI.01'],
    'Collaudo funzionale impianti': ['QdI.04']
  };

  /* Art. 6 DM 17/06/2016: valori orari per prestazioni non determinabili (intervalli) */
  const PROFILI = [
    { id: 'pro', nome: 'Professionista incaricato', min: 50, max: 75, tariffa: 62.5 },
    { id: 'aiu', nome: 'Aiuto iscritto', min: 37, max: 50, tariffa: 43.5 },
    { id: 'con', nome: 'Aiuto di concetto', min: 30, max: 37, tariffa: 33.5 }
  ];

  window.Data = { CATEGORIE, PRESTAZIONI, PRESET, PROFILI };
})();
