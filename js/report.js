/* Contenuti di Excel, PDF e Word (preventivo/parcella) a partire dal progetto. */
(function () {
  'use strict';
  const Cc = window.Calc;
  const f = (x, d) => (x == null || !isFinite(x)) ? '-' : Number(x).toLocaleString('it-IT', { minimumFractionDigits: d == null ? 2 : d, maximumFractionDigits: d == null ? 2 : d });
  const eur = x => f(x, 2) + ' €';
  const pdfEur = x => f(x, 2) + ' EUR';
  function today(m) { const d = m.data ? new Date(m.data) : new Date(); return isNaN(d) ? '' : d.toLocaleDateString('it-IT'); }
  const tipo = P => (P.meta.tipoDoc === 'parcella' ? 'Parcella' : 'Preventivo di parcella');

  function intest(P, pdf) {
    const s = P.studio || {}, c = P.cliente || {}, m = P.meta;
    const E = pdf ? pdfEur : eur;
    return [
      { t: 'kv', rows: [
        ['Professionista', [s.nome, s.titolo].filter(Boolean).join(' - ') || '-'],
        ['Albo / C.F. / P.IVA', [s.albo, s.cf, s.piva].filter(Boolean).join(' / ') || '-'],
        ['Indirizzo / contatti', [s.indirizzo, s.email].filter(Boolean).join(' - ') || '-'],
        ['Cliente', [c.nome, c.indirizzo, c.cf].filter(Boolean).join(' - ') || '-'],
        ['Oggetto dell\'incarico', m.oggetto || '-'],
        ['Commessa / n. documento', [m.commessa, m.numero].filter(Boolean).join(' / ') || '-'],
        ['Data', today(m)]
      ] }
    ];
  }

  function riepilogoRows(R, E) {
    const rows = [];
    if (R.F.inclA) rows.push(['Compenso a parametri (DM 17/06/2016)', E(R.A.compenso)]);
    if (R.F.inclB) rows.push(['Compenso a costo orario (' + f(R.B.ore, 1) + ' ore)', E(R.B.compenso)]);
    if (R.F.inclC) rows.push(['Compenso da tariffa a scaglioni', E(R.C.compenso)]);
    if (R.magg) rows.push(['Maggiorazione ' + f(Cc.num(R.F.magg), 1) + '%', E(R.magg)]);
    if (R.sconto) rows.push(['Sconto ' + f(Cc.num(R.F.sconto), 1) + '%', '-' + E(R.sconto)]);
    rows.push(['Compenso', E(R.compenso)]);
    if (R.spese) rows.push(['Spese e oneri accessori ' + f(R.spesePerc, 2) + '%', E(R.spese)]);
    if (R.rimborsi) rows.push(['Rimborsi e spese documentate', E(R.rimborsi)]);
    rows.push(['Imponibile', E(R.imponibile)]);
    if (R.integrativo) rows.push(['Contributo integrativo ' + f(Cc.num(R.F.integrativo), 2) + '%', E(R.integrativo)]);
    rows.push([R.F.forfettario ? 'IVA non dovuta (regime forfettario)' : 'IVA ' + f(R.ivaPerc, 2) + '%', E(R.iva)]);
    if (R.bollo) rows.push(['Imposta di bollo', E(R.bollo)]);
    rows.push(['TOTALE DOCUMENTO', E(R.totale)]);
    if (R.ritenuta) rows.push(['Ritenuta d\'acconto ' + f(R.ritPerc, 0) + '%', '-' + E(R.ritenuta)]);
    if (Cc.num(R.F.acconto)) rows.push(['Acconto già versato', '-' + E(Cc.num(R.F.acconto))]);
    rows.push([R.ritenuta || Cc.num(R.F.acconto) ? 'NETTO A PAGARE' : 'TOTALE A PAGARE', E(R.daPagare)]);
    return rows;
  }

  function dettaglioBlocks(P, R, E) {
    const bl = [];
    if (R.F.inclA && R.A.opere.length) {
      bl.push({ t: 'h1', x: 'Dettaglio compenso a parametri (DM 17/06/2016)' });
      bl.push({ t: 'p', x: 'CP = Σ (V × G × Q × P), con P = 0,03 + 10 / V^0,4. V = costo della categoria d\'opera; G = grado di complessità (tavola Z-1); Q = specificità della prestazione (tavola Z-2).' });
      R.A.opere.forEach(o => {
        bl.push({ t: 'h2', x: `${o.cat} - ${o.desc}` });
        bl.push({ t: 'kv', rows: [['Importo lavori V', E(o.V)], ['Grado di complessità G', f(o.G, 2)], ['Parametro P', f(o.P, 6)], ['Colonna Q', o.col === 'T' ? 'Tecnologie dell\'informazione' : 'Impianti ' + o.col]] });
        bl.push({ t: 'table', head: ['Prestazione', 'Descrizione', 'Q', 'Compenso'], align: ['l', 'l', 'r', 'r'], size: 8, widths: [1.1, 5, 0.9, 1.4], rows: o.righe.map(r => [r.code, r.desc, r.Q == null ? 'n.d.' : f(r.Q, 4), E(r.CP)]).concat([['', 'Totale categoria', '', E(o.CP)]]) });
      });
    }
    if (R.F.inclB && R.B.righe.length) {
      bl.push({ t: 'h1', x: 'Dettaglio compenso a costo orario' });
      bl.push({ t: 'table', head: ['Attività', 'Profilo', 'Ore', 'Tariffa', 'Importo'], align: ['l', 'l', 'r', 'r', 'r'], size: 8, widths: [4, 2.2, 0.8, 1.1, 1.3], rows: R.B.righe.map(r => [r.desc, r.profilo, f(r.ore, 1), E(r.tariffa), E(r.importo)]).concat([['Totale', '', f(R.B.ore, 1), '', E(R.B.compenso)]]) });
      const rim = R.B.trasf.map(t => [t.desc, t.km ? f(t.km, 0) + ' km' : '', E(t.importo)]).concat(R.B.speseVive.map(s => [s.desc, '', E(s.importo)]));
      if (rim.length) bl.push({ t: 'table', caption: 'Trasferte e spese documentate', head: ['Voce', 'Km', 'Importo'], align: ['l', 'r', 'r'], size: 8, widths: [5, 1.2, 1.4], rows: rim });
    }
    if (R.F.inclC && R.C.righe.length) {
      bl.push({ t: 'h1', x: 'Dettaglio compenso da tariffa a scaglioni' });
      bl.push({ t: 'table', head: ['Prestazione', 'Tabella', 'Importo V', 'Quota %', 'Onorario'], align: ['l', 'l', 'r', 'r', 'r'], size: 8, widths: [3.5, 2.2, 1.4, 0.9, 1.3], rows: R.C.righe.map(r => [r.desc, r.tab, E(r.V), f(r.quota, 1), E(r.importo)]).concat([['Totale', '', '', '', E(R.C.compenso)]]) });
    }
    return bl;
  }

  function blocks(P, R, pdf) {
    const E = pdf ? pdfEur : eur, bl = [];
    bl.push({ t: 'h1', x: tipo(P) });
    intest(P, pdf).forEach(b => bl.push(b));
    bl.push({ t: 'h1', x: 'Riepilogo' });
    bl.push({ t: 'table', head: ['Voce', 'Importo'], align: ['l', 'r'], size: 9.5, widths: [4, 1.4], rows: riepilogoRows(R, E) });
    if (P.meta.note) { bl.push({ t: 'h2', x: 'Note' }); bl.push({ t: 'p', x: P.meta.note }); }
    dettaglioBlocks(P, R, E).forEach(b => bl.push(b));
    bl.push({ t: 'note', x: 'Compensi determinati ai sensi del D.M. 17 giugno 2016 (parametri per i servizi di ingegneria e architettura) e/o con criteri a vacazione e tariffe concordate. I valori dei parametri sono quelli delle tavole Z-1 e Z-2 del decreto, eventualmente modificati dal professionista.' });
    return bl;
  }

  /* disciplinare d'incarico (Word) */
  function disciplinare(P, R) {
    const E = eur, s = P.studio || {}, c = P.cliente || {}, m = P.meta, bl = [];
    bl.push({ t: 'h1', x: 'Disciplinare di incarico professionale' });
    intest(P, false).forEach(b => bl.push(b));
    bl.push({ t: 'h1', x: 'Art. 1 - Oggetto' });
    bl.push({ t: 'p', x: `${c.nome || 'Il Committente'} affida a ${s.nome || 'il Professionista'} l'incarico professionale relativo a: ${m.oggetto || '________'}.` });
    bl.push({ t: 'h1', x: 'Art. 2 - Prestazioni' });
    const pr = []; R.A.opere.forEach(o => o.righe.forEach(r => pr.push(`${r.code} - ${r.desc} (categoria ${o.cat})`)));
    if (R.F.inclB) R.B.righe.forEach(r => pr.push(`${r.desc} (a vacazione)`));
    if (R.F.inclC) R.C.righe.forEach(r => pr.push(`${r.desc} (tariffa ${r.tab})`));
    bl.push({ t: 'ul', items: pr.length ? pr : ['Da definire'] });
    bl.push({ t: 'h1', x: 'Art. 3 - Compenso' });
    bl.push({ t: 'p', x: `Il compenso complessivo è determinato in ${E(R.compenso)}, oltre a spese e oneri accessori, contributo integrativo e IVA come per legge, per un importo complessivo stimato di ${E(R.totale)}.` });
    bl.push({ t: 'table', head: ['Voce', 'Importo'], align: ['l', 'r'], size: 9.5, widths: [4, 1.4], rows: riepilogoRows(R, E) });
    bl.push({ t: 'h1', x: 'Art. 4 - Modalità di pagamento' });
    bl.push({ t: 'p', x: (m.pagamento || 'Acconto alla firma del disciplinare e saldo alla consegna delle prestazioni, entro 30 giorni dalla presentazione della fattura.') });
    bl.push({ t: 'h1', x: 'Art. 5 - Varianti e prestazioni aggiuntive' });
    bl.push({ t: 'p', x: 'Le prestazioni non comprese nel presente disciplinare e le varianti richieste dal Committente sono compensate a parte, secondo i criteri sopra indicati.' });
    bl.push({ t: 'h1', x: 'Art. 6 - Disposizioni finali' });
    bl.push({ t: 'p', x: 'Per quanto non previsto si rinvia alle norme di legge, al codice civile e al codice deontologico della professione.' });
    bl.push({ t: 'p', x: '\n\nLuogo e data ______________________\n\nIl Professionista ______________________          Il Committente ______________________' });
    return bl;
  }

  /* Excel */
  function sheets(P, R) {
    const H = a => a.map(x => ({ v: x, s: 'head' })), out = [];
    const rows = [[{ v: tipo(P), s: 'title' }], [], ['Professionista', (P.studio || {}).nome], ['Cliente', (P.cliente || {}).nome], ['Oggetto', P.meta.oggetto], ['Commessa', P.meta.commessa], ['Data', today(P.meta)], [], H(['Voce', 'Importo [€]'])];
    const add = (l, v, s) => rows.push([{ v: l, s: s || null }, { v, s: 'n2' }]);
    if (R.F.inclA) add('Compenso a parametri (DM 17/06/2016)', R.A.compenso);
    if (R.F.inclB) add('Compenso a costo orario', R.B.compenso);
    if (R.F.inclC) add('Compenso da tariffa a scaglioni', R.C.compenso);
    if (R.magg) add('Maggiorazione', R.magg); if (R.sconto) add('Sconto', -R.sconto);
    add('Compenso', R.compenso, 'bold'); add('Spese e oneri accessori (' + f(R.spesePerc, 2) + '%)', R.spese); if (R.rimborsi) add('Rimborsi e spese documentate', R.rimborsi);
    add('Imponibile', R.imponibile, 'bold'); add('Contributo integrativo (' + f(Cc.num(R.F.integrativo), 2) + '%)', R.integrativo); add('IVA (' + f(R.ivaPerc, 2) + '%)', R.iva); if (R.bollo) add('Imposta di bollo', R.bollo);
    add('TOTALE DOCUMENTO', R.totale, 'bold'); if (R.ritenuta) add('Ritenuta d\'acconto (' + f(R.ritPerc, 0) + '%)', -R.ritenuta); if (Cc.num(R.F.acconto)) add('Acconto', -Cc.num(R.F.acconto)); add('DA PAGARE', R.daPagare, 'bold');
    out.push({ name: 'Parcella', widths: [48, 18], rows });
    const pr = [H(['Categoria', 'Descrizione', 'V [€]', 'G', 'P', 'Colonna Q', 'Prestazione', 'Descrizione prestazione', 'Q', 'Compenso [€]'])];
    R.A.opere.forEach(o => o.righe.forEach(r => pr.push([o.cat, o.desc, { v: o.V, s: 'n2' }, { v: o.G, s: 'n2' }, { v: o.P, s: 'n4' }, o.col, r.code, r.desc, r.Q == null ? 'n.d.' : { v: r.Q, s: 'n4' }, { v: r.CP, s: 'n2' }])));
    pr.push([], [{ v: 'Totale compenso a parametri', s: 'bold' }, '', '', '', '', '', '', '', '', { v: R.A.compenso, s: 'n2' }]);
    out.push({ name: 'Parametri DM 2016', widths: [10, 40, 16, 8, 12, 10, 12, 60, 10, 16], freeze: 1, rows: pr });
    const orr = [H(['Attività', 'Profilo', 'Ore', 'Tariffa [€/h]', 'Importo [€]'])];
    R.B.righe.forEach(r => orr.push([r.desc, r.profilo, { v: r.ore, s: 'n1' }, { v: r.tariffa, s: 'n2' }, { v: r.importo, s: 'n2' }]));
    orr.push([], [{ v: 'Totale', s: 'bold' }, '', { v: R.B.ore, s: 'n1' }, '', { v: R.B.compenso, s: 'n2' }], []);
    R.B.trasf.forEach(t => orr.push([t.desc, 'trasferta', '', '', { v: t.importo, s: 'n2' }])); R.B.speseVive.forEach(s => orr.push([s.desc, 'spesa documentata', '', '', { v: s.importo, s: 'n2' }]));
    out.push({ name: 'Costo orario', widths: [50, 26, 10, 14, 16], freeze: 1, rows: orr });
    const tr = [H(['Prestazione', 'Tabella', 'Importo V [€]', 'Quota [%]', 'Onorario [€]'])];
    R.C.righe.forEach(r => tr.push([r.desc, r.tab, { v: r.V, s: 'n2' }, { v: r.quota, s: 'n1' }, { v: r.importo, s: 'n2' }]));
    out.push({ name: 'Tariffa scaglioni', widths: [50, 26, 16, 10, 16], freeze: 1, rows: tr });
    return out;
  }

  window.Report = { blocks, disciplinare, sheets, f, eur };
})();
