/* Motore di calcolo della parcella: parametri DM 17/06/2016, costo orario, tariffe a scaglioni, voci finali. Indipendente dal DOM. */
(function () {
  'use strict';
  const D = window.Data;
  const num = (v, d) => { const x = parseFloat(v); return isFinite(x) ? x : (d == null ? 0 : d); };
  const r2 = x => Math.round((x + Number.EPSILON) * 100) / 100;

  /* parametro P (art. 3 c. 4-5): P = 0,03 + 10/V^0,4; sotto 25.000 euro non supera P(25.000) */
  function P(V) { return 0.03 + 10 / Math.pow(Math.max(num(V), 25000), 0.4); }

  function catInfo(P_, id) {
    const c = D.CATEGORIE.find(x => x[0] === id);
    const ov = (P_.tabelle && P_.tabelle.G && P_.tabelle.G[id]);
    return c ? { id, desc: c[1], G: ov != null && ov !== '' ? num(ov) : c[2], col: c[3] } : { id, desc: 'Categoria personalizzata', G: 1, col: 'B' };
  }
  function qRow(P_, code) {
    const r = D.PRESTAZIONI.find(x => x[0] === code); if (!r) return null;
    const ov = (P_.tabelle && P_.tabelle.Q && P_.tabelle.Q[code]) || {};
    const pick = (k, base) => (ov[k] != null && ov[k] !== '' ? num(ov[k]) : base);
    return { code, fase: r[1], desc: r[2], A: pick('A', r[3]), B: pick('B', r[4]), T: r[5] == null ? null : pick('T', r[5]), tier: r[6] || null };
  }
  /* Q effettivo per la colonna scelta; con scaglioni, media ponderata sul valore V */
  function qEff(row, col, V) {
    const base = row[col]; if (base == null) return null;
    if (!row.tier) return base;
    const lim = row.tier.limite, q2 = col === 'T' ? row.tier.T : row.tier.imp;
    return V <= lim ? base : (base * lim + q2 * (V - lim)) / V;
  }

  /* ---- metodo A: parametri ---- */
  function parametri(P_) {
    const opere = (P_.opere || []).map(o => {
      const V = num(o.V), ci = catInfo(P_, o.cat), G = o.G !== '' && o.G != null ? num(o.G) : ci.G;
      const col = o.col || ci.col, p = P(V), righe = [];
      let cp = 0;
      (o.prest || []).forEach(code => {
        const row = qRow(P_, code); if (!row) return;
        const q = qEff(row, col, V); if (q == null) { righe.push({ code, desc: row.desc, fase: row.fase, Q: null, CP: 0, nd: true }); return; }
        const val = V * G * q * p; cp += val;
        righe.push({ code, desc: row.desc, fase: row.fase, Q: q, CP: val });
      });
      (o.extra || []).forEach(e => { const q = num(e.Q), val = V * G * q * p; cp += val; righe.push({ code: 'libera', desc: e.desc || 'Prestazione libera', fase: 'Voci libere', Q: q, CP: val }); });
      return { id: o.id, cat: o.cat, desc: o.desc || ci.desc, V, G, col, P: p, righe, CP: cp };
    });
    const compenso = opere.reduce((a, o) => a + o.CP, 0), Vtot = opere.reduce((a, o) => a + o.V, 0);
    return { opere, compenso, Vtot };
  }
  /* spese e oneri accessori (art. 5): max 25% fino a 1 Mio, 10% da 25 Mio, interpolazione lineare */
  function speseMaxPerc(V) {
    if (V <= 1e6) return 25; if (V >= 25e6) return 10;
    return 25 - 15 * (V - 1e6) / 24e6;
  }

  /* ---- metodo B: ore ---- */
  function ore(P_) {
    const prof = (P_.profili || D.PROFILI), righe = (P_.ore || []).map(r => {
      const pf = prof.find(x => x.id === r.prof) || prof[0], h = num(r.ore), t = num(pf.tariffa);
      return { desc: r.desc, profilo: pf.nome, ore: h, tariffa: t, importo: h * t };
    });
    const tot = righe.reduce((a, r) => a + r.importo, 0);
    const trasf = (P_.trasferte || []).map(t => ({ desc: t.desc, km: num(t.km), tariffa: num(t.tariffa), importo: num(t.km) * num(t.tariffa) + num(t.altro) }));
    const speseVive = (P_.speseVive || []).map(s => ({ desc: s.desc, importo: num(s.importo) }));
    const totTrasf = trasf.reduce((a, r) => a + r.importo, 0) + speseVive.reduce((a, r) => a + r.importo, 0);
    return { righe, compenso: tot, ore: righe.reduce((a, r) => a + r.ore, 0), trasf, speseVive, rimborsi: totTrasf };
  }

  /* ---- metodo C: tariffe a scaglioni definite dall'utente ---- */
  function scaglioni(tab, V) {
    const sc = (tab.scaglioni || []).map(s => ({ fino: s.fino === '' || s.fino == null ? Infinity : num(s.fino), perc: num(s.perc) })).sort((a, b) => a.fino - b.fino);
    if (!sc.length) return { importo: 0, dettaglio: [] };
    if (tab.modo === 'classe') {
      const s = sc.find(x => V <= x.fino) || sc[sc.length - 1];
      return { importo: V * s.perc / 100, dettaglio: [{ da: 0, a: V, perc: s.perc, importo: V * s.perc / 100 }] };
    }
    let prev = 0, tot = 0; const det = [];
    for (const s of sc) {
      if (V <= prev) break;
      const a = Math.min(V, s.fino), q = a - prev, imp = q * s.perc / 100; tot += imp; det.push({ da: prev, a, perc: s.perc, importo: imp }); prev = s.fino;
    }
    return { importo: tot, dettaglio: det };
  }
  function tariffa(P_) {
    const tabs = P_.tariffe || [];
    const righe = (P_.tariffaRighe || []).map(r => {
      const tab = tabs.find(t => t.id === r.tab), V = num(r.V), quota = r.quota === '' || r.quota == null ? 100 : num(r.quota);
      if (!tab) return { desc: r.desc, tab: '-', V, quota, importo: 0 };
      const s = scaglioni(tab, V); return { desc: r.desc, tab: tab.nome, V, quota, importo: s.importo * quota / 100 };
    });
    return { righe, compenso: righe.reduce((a, r) => a + r.importo, 0) };
  }

  /* ---- parcella finale ---- */
  function parcella(P_) {
    const F = Object.assign({ inclA: true, inclB: false, inclC: false, magg: 0, sconto: 0, spese: 'dm', spesePerc: 0, speseFrazione: 100, integrativo: 5, iva: 22, ritenuta: 20, forfettario: false, bollo: 2, acconto: 0, rimborsi: true }, P_.finale || {});
    const A = parametri(P_), B = ore(P_), C = tariffa(P_);
    const base = (F.inclA ? A.compenso : 0) + (F.inclB ? B.compenso : 0) + (F.inclC ? C.compenso : 0);
    const magg = base * num(F.magg) / 100, sconto = (base + magg) * num(F.sconto) / 100, compenso = base + magg - sconto;
    let spesePerc = 0;
    if (F.spese === 'dm') spesePerc = speseMaxPerc(A.Vtot) * num(F.speseFrazione, 100) / 100; else if (F.spese === 'man') spesePerc = num(F.spesePerc);
    const spese = compenso * spesePerc / 100, rimborsi = F.rimborsi ? B.rimborsi : 0;
    const imponibile = compenso + spese + rimborsi;
    const integrativo = imponibile * num(F.integrativo) / 100;
    const ivaPerc = F.forfettario ? 0 : num(F.iva), iva = (imponibile + integrativo) * ivaPerc / 100;
    const bollo = F.forfettario || ivaPerc === 0 ? num(F.bollo) : 0;
    const totale = imponibile + integrativo + iva + bollo;
    const ritPerc = F.forfettario ? 0 : num(F.ritenuta), ritenuta = (compenso + spese) * ritPerc / 100;
    const netto = totale - ritenuta, daPagare = netto - num(F.acconto);
    return { F, A, B, C, base, magg, sconto, compenso, spesePerc, spese, rimborsi, imponibile, integrativo, ivaPerc, iva, bollo, totale, ritPerc, ritenuta, netto, daPagare };
  }

  window.Calc = { P, parametri, ore, tariffa, parcella, scaglioni, speseMaxPerc, catInfo, qRow, qEff, num, r2 };
})();
