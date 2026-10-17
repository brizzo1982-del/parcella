/* Interfaccia: pagine, archivio pratiche, esportazioni. */
(function () {
  'use strict';
  const D = window.Data, C = window.Calc, Rp = window.Report;
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const f = Rp.f, eur = Rp.eur;
  const KEY = 'parcella_pratica_v1', ARC = 'parcella_archivio_v1', STU = 'parcella_studio_v1';
  let P = null, page = 'pratica', saveT = null, R = null;
  const uid = () => 'x' + Math.random().toString(36).slice(2, 9);

  /* ---------- progetto ---------- */
  function studioDefault() { try { return JSON.parse(localStorage.getItem(STU)) || {}; } catch (e) { return {}; } }
  function empty() {
    return {
      v: 1, id: uid(),
      meta: { tipoDoc: 'preventivo', oggetto: '', commessa: '', numero: '', data: new Date().toISOString().slice(0, 10), note: '', pagamento: '' },
      studio: Object.assign({ nome: '', titolo: 'Perito Industriale Elettrotecnico', albo: '', cf: '', piva: '', indirizzo: '', email: '' }, studioDefault()),
      cliente: { nome: '', indirizzo: '', cf: '' },
      opere: [], profili: JSON.parse(JSON.stringify(D.PROFILI)), ore: [], trasferte: [], speseVive: [],
      tariffe: [], tariffaRighe: [], tabelle: { G: {}, Q: {} }, finale: {}
    };
  }
  function fix(p) { const b = empty(); ['meta', 'studio', 'cliente', 'finale'].forEach(k => p[k] = Object.assign(b[k], p[k] || {})); ['opere', 'ore', 'trasferte', 'speseVive', 'tariffe', 'tariffaRighe'].forEach(k => p[k] = p[k] || []); p.profili = p.profili || b.profili; p.tabelle = p.tabelle || { G: {}, Q: {} }; p.tabelle.G = p.tabelle.G || {}; p.tabelle.Q = p.tabelle.Q || {}; p.id = p.id || uid(); return p; }
  function load() { try { const j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 1) return fix(j); } catch (e) { /* nuovo */ } return null; }
  function persist() {
    clearTimeout(saveT);
    saveT = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(P)); localStorage.setItem(STU, JSON.stringify(P.studio));
        const a = JSON.parse(localStorage.getItem(ARC) || '{}'); a[P.id] = { nome: (P.meta.commessa || P.meta.oggetto || 'Senza titolo'), cliente: P.cliente.nome, data: P.meta.data, tot: C.parcella(P).totale, P }; localStorage.setItem(ARC, JSON.stringify(a));
      } catch (e) { /* quota */ }
    }, 500);
  }
  function setP(p) { P = fix(p); R = null; render(); }

  /* ---------- utilità UI ---------- */
  const get = (o, path) => path.split('.').reduce((a, k) => a == null ? a : a[k], o);
  function set(o, path, v) { const ks = path.split('.'); let c = o; for (let i = 0; i < ks.length - 1; i++) { if (c[ks[i]] == null) c[ks[i]] = {}; c = c[ks[i]]; } c[ks[ks.length - 1]] = v; }
  const inp = (label, path, o) => {
    o = o || {}; const v = get(P, path);
    let i;
    if (o.sel) i = `<select data-b="${path}"${o.bool ? ' data-bool="1"' : ''}>${o.sel.map(([k, l]) => `<option value="${esc(k)}"${String(k) === String(v) ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>`;
    else if (o.area) i = `<textarea data-b="${path}" rows="${o.rows || 3}">${esc(v)}</textarea>`;
    else if (o.chk) i = `<input type="checkbox" data-b="${path}" data-bool="1"${v ? ' checked' : ''}>`;
    else i = `<input type="${o.n ? 'number' : (o.date ? 'date' : 'text')}"${o.n ? ' step="any"' : ''} data-b="${path}"${o.n ? ' data-n="1"' : ''} value="${esc(v == null ? '' : v)}"${o.ph != null ? ` placeholder="${esc(o.ph)}"` : ''}>`;
    return `<label class="fld${o.chk ? ' chk' : ''}"><span>${label}${o.u ? ` <i>${o.u}</i>` : ''}</span>${i}${o.help ? `<small>${o.help}</small>` : ''}</label>`;
  };
  function toast(m, bad) { const t = $('#toast'); t.textContent = m; t.className = 'toast show' + (bad ? ' bad' : ''); clearTimeout(toast.t); toast.t = setTimeout(() => t.className = 'toast', 3500); }
  function download(bytes, name, mime) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([bytes], { type: mime })); a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500); }
  const fname = ext => ((P.meta.commessa || P.meta.oggetto || 'parcella').replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '_').slice(0, 40) || 'parcella') + '.' + ext;

  /* ---------- navigazione ---------- */
  const PAGES = [['pratica', 'Pratica'], ['param', 'Parametri DM 2016'], ['ore', 'Costo orario'], ['tariffa', 'Tariffa a scaglioni'], ['parcella', 'Parcella'], ['tabelle', 'Tabelle'], ['archivio', 'Archivio']];
  function nav() { $('#nav').innerHTML = PAGES.map(([k, l]) => `<button data-pg="${k}" class="${page === k ? 'on' : ''}">${l}</button>`).join(''); }
  function totals() {
    R = C.parcella(P);
    $('#totbar').innerHTML = `<span>Parametri: <b>${eur(R.A.compenso)}</b></span><span>Ore: <b>${eur(R.B.compenso)}</b></span><span>Tariffa: <b>${eur(R.C.compenso)}</b></span><span class="sp"></span><span>Compenso: <b>${eur(R.compenso)}</b></span><span>Totale documento: <b>${eur(R.totale)}</b></span><span>Da pagare: <b class="okc">${eur(R.daPagare)}</b></span>`;
    document.querySelectorAll('[data-out]').forEach(el => { const v = outs()[el.dataset.out]; if (v != null) el.textContent = v; });
  }
  let outCache = null, outFor = null;
  function outs() {
    if (outFor === R && outCache) return outCache;
    const o = {};
    R.A.opere.forEach((op, i) => { o[`op.${i}.CP`] = eur(op.CP); o[`op.${i}.P`] = f(op.P, 6); o[`op.${i}.G`] = f(op.G, 2); });
    o.totA = eur(R.A.compenso); o.totB = eur(R.B.compenso); o.totC = eur(R.C.compenso); o.oreTot = f(R.B.ore, 1) + ' ore';
    o.spesePerc = f(R.spesePerc, 2) + ' %'; o.speseMax = f(C.speseMaxPerc(R.A.Vtot), 2) + ' %'; o.vtot = eur(R.A.Vtot);
    R.B.righe.forEach((r, i) => o[`or.${i}`] = eur(r.importo)); R.C.righe.forEach((r, i) => o[`tr.${i}`] = eur(r.importo));
    o.riepilogo = '';
    outCache = o; outFor = R; return o;
  }

  function render() { nav(); R = C.parcella(P); const fn = { pratica, param, ore, tariffa, parcella, tabelle, archivio }[page]; $('#page').innerHTML = fn(); totals(); }
  function go(p) { page = p; render(); window.scrollTo(0, 0); }

  /* ---------- pagine ---------- */
  function pratica() {
    return `<div class="card"><h3>Dati dell'incarico</h3><div class="grid2">${inp('Oggetto dell\'incarico', 'meta.oggetto')}${inp('Commessa', 'meta.commessa')}${inp('Numero documento', 'meta.numero')}${inp('Data', 'meta.data', { date: 1 })}${inp('Tipo di documento', 'meta.tipoDoc', { sel: [['preventivo', 'Preventivo di parcella'], ['parcella', 'Parcella']] })}</div>${inp('Note (riportate nel documento)', 'meta.note', { area: 1 })}${inp('Modalità di pagamento (disciplinare)', 'meta.pagamento', { area: 1, rows: 2 })}</div>
<div class="card"><h3>Cliente</h3><div class="grid2">${inp('Nome / ragione sociale', 'cliente.nome')}${inp('Codice fiscale / P.IVA', 'cliente.cf')}</div>${inp('Indirizzo', 'cliente.indirizzo')}</div>
<div class="card"><h3>Studio / professionista <small>(ricordato per le prossime pratiche)</small></h3><div class="grid2">${inp('Nome e cognome', 'studio.nome')}${inp('Titolo', 'studio.titolo')}${inp('Albo / n. iscrizione', 'studio.albo')}${inp('Codice fiscale', 'studio.cf')}${inp('Partita IVA', 'studio.piva')}${inp('E-mail / telefono', 'studio.email')}</div>${inp('Indirizzo', 'studio.indirizzo')}</div>`;
  }

  function paramOpera(o, i) {
    const ci = C.catInfo(P, o.cat), col = o.col || ci.col, groups = {};
    D.PRESTAZIONI.forEach(r => { (groups[r[1]] = groups[r[1]] || []).push(C.qRow(P, r[0])); });
    const fasi = Object.keys(groups).map(fa => `<details${groups[fa].some(r => (o.prest || []).includes(r.code)) ? ' open' : ''}><summary>${esc(fa)}</summary><table class="tbl small">${groups[fa].map(r => { const q = C.qEff(r, col, C.num(o.V)); return `<tr><td><input type="checkbox" data-pr="${i}" data-code="${r.code}"${(o.prest || []).includes(r.code) ? ' checked' : ''}></td><td><b>${r.code}</b></td><td class="l">${esc(r.desc)}</td><td>Q ${q == null ? 'n.d.' : f(q, 4)}</td></tr>`; }).join('')}</table></details>`).join('');
    const extra = (o.extra || []).map((e, k) => `<div class="row3"><input data-b="opere.${i}.extra.${k}.desc" value="${esc(e.desc)}" placeholder="Prestazione libera"><input type="number" step="any" data-n="1" data-b="opere.${i}.extra.${k}.Q" value="${esc(e.Q)}" placeholder="Q"><button data-act="delExtra" data-i="${i}" data-k="${k}" class="danger">✕</button></div>`).join('');
    return `<div class="card opera"><div class="row"><h3>Categoria d'opera ${i + 1}</h3><button data-act="delOpera" data-i="${i}" class="danger">Elimina</button></div>
<div class="grid3"><label class="fld"><span>Categoria (tavola Z-1)</span><select data-b="opere.${i}.cat">${D.CATEGORIE.map(c => `<option value="${c[0]}"${c[0] === o.cat ? ' selected' : ''}>${c[0]} - G ${c[2]}</option>`).join('')}</select><small>${esc(ci.desc)}</small></label>
${inp('Descrizione opera', `opere.${i}.desc`, { ph: 'es. Impianto elettrico capannone' })}${inp('Importo lavori V', `opere.${i}.V`, { n: 1, u: '€' })}
${inp('G personalizzato', `opere.${i}.G`, { n: 1, ph: String(ci.G), help: 'Vuoto = valore della tavola Z-1' })}
<label class="fld"><span>Colonna Q (tavola Z-2)</span><select data-b="opere.${i}.col"><option value="A"${col === 'A' ? ' selected' : ''}>Impianti A</option><option value="B"${col === 'B' ? ' selected' : ''}>Impianti B</option><option value="T"${col === 'T' ? ' selected' : ''}>Tecnologie informazione</option></select><small>A e B differiscono solo per QbII.01, QbIII.01, QcI.01</small></label>
<label class="fld"><span>Preimposta prestazioni</span><select data-preset="${i}"><option value="">Aggiungi un gruppo…</option>${Object.keys(D.PRESET).map(k => `<option>${esc(k)}</option>`).join('')}</select></label></div>
<p class="info">G <b data-out="op.${i}.G">-</b> · P <b data-out="op.${i}.P">-</b> · Compenso della categoria: <b data-out="op.${i}.CP" class="okc">-</b></p>
${fasi}<h4>Prestazioni libere (con Q manuale)</h4>${extra}<button data-act="addExtra" data-i="${i}">+ Prestazione libera</button></div>`;
  }
  function param() {
    return `<div class="card"><h3>Compenso a parametri - DM 17/06/2016</h3><p class="muted">CP = Σ (V × G × Q × P), con P = 0,03 + 10 / V<sup>0,4</sup>. Per ogni categoria d'opera indica l'importo dei lavori e spunta le prestazioni da compensare (SF, progetto, DL, contabilità, sicurezza, collaudo). I valori G e Q sono quelli delle tavole Z-1 e Z-2 e si possono modificare nella pagina <b>Tabelle</b>.</p>
<p class="warn">* Il DM 17/06/2016 riguarda la progettazione preliminare/definitiva/esecutiva. Per i lavori pubblici avviati dal 1/7/2023 vale l'Allegato I.13 del D.Lgs. 36/2023 (PFTE), con tabelle proprie non incluse: usa la pagina Tabelle o le voci libere per adeguare i valori.</p>
<p>Totale lavori <b data-out="vtot">-</b> · Spese e oneri accessori massimi da decreto (art. 5): <b data-out="speseMax">-</b> · Compenso a parametri: <b class="okc" data-out="totA">-</b></p></div>
${P.opere.map(paramOpera).join('')}<div class="btns"><button class="primary" data-act="addOpera">+ Aggiungi categoria d'opera</button></div>`;
  }

  function ore() {
    const pf = P.profili.map((p, i) => `<tr><td class="l">${esc(p.nome)}</td><td><input type="number" step="any" data-n="1" data-b="profili.${i}.tariffa" value="${esc(p.tariffa)}"> €/h</td><td class="muted">intervallo art. 6 DM 2016: ${p.min}-${p.max} €/h</td></tr>`).join('');
    const rows = P.ore.map((r, i) => `<tr><td class="l"><input data-b="ore.${i}.desc" value="${esc(r.desc)}" placeholder="Attività"></td><td><select data-b="ore.${i}.prof">${P.profili.map(p => `<option value="${p.id}"${p.id === r.prof ? ' selected' : ''}>${esc(p.nome)}</option>`).join('')}</select></td><td><input type="number" step="any" data-n="1" data-b="ore.${i}.ore" value="${esc(r.ore)}"></td><td data-out="or.${i}">-</td><td><button data-act="delOre" data-i="${i}" class="danger">✕</button></td></tr>`).join('');
    const tr = P.trasferte.map((t, i) => `<tr><td class="l"><input data-b="trasferte.${i}.desc" value="${esc(t.desc)}" placeholder="Trasferta"></td><td><input type="number" step="any" data-n="1" data-b="trasferte.${i}.km" value="${esc(t.km)}"> km</td><td><input type="number" step="any" data-n="1" data-b="trasferte.${i}.tariffa" value="${esc(t.tariffa)}"> €/km</td><td><input type="number" step="any" data-n="1" data-b="trasferte.${i}.altro" value="${esc(t.altro)}"> € altro</td><td><button data-act="delTr" data-i="${i}" class="danger">✕</button></td></tr>`).join('');
    const sv = P.speseVive.map((s, i) => `<tr><td class="l"><input data-b="speseVive.${i}.desc" value="${esc(s.desc)}" placeholder="Spesa documentata"></td><td><input type="number" step="any" data-n="1" data-b="speseVive.${i}.importo" value="${esc(s.importo)}"> €</td><td><button data-act="delSv" data-i="${i}" class="danger">✕</button></td></tr>`).join('');
    return `<div class="card"><h3>Profili e tariffe orarie</h3><table class="tbl small">${pf}</table><p class="muted">I valori iniziali sono il centro degli intervalli di legge (art. 6 DM 17/06/2016), modificabili con i tuoi importi.</p></div>
<div class="card"><h3>Attività a ore</h3><table class="tbl"><thead><tr><th class="l">Attività</th><th>Profilo</th><th>Ore</th><th>Importo</th><th></th></tr></thead><tbody>${rows}</tbody></table><div class="btns"><button data-act="addOre" class="primary">+ Attività</button></div><p>Totale <b data-out="oreTot">-</b> · Compenso a ore: <b class="okc" data-out="totB">-</b></p></div>
<div class="card"><h3>Trasferte</h3><table class="tbl small">${tr}</table><div class="btns"><button data-act="addTr">+ Trasferta</button></div><h3 style="margin-top:14px">Spese vive documentate</h3><table class="tbl small">${sv}</table><div class="btns"><button data-act="addSv">+ Spesa</button></div></div>`;
  }

  function tariffa() {
    const tabs = P.tariffe.map((t, i) => `<div class="card"><div class="row"><h3>Tabella ${i + 1}</h3><button data-act="delTab" data-i="${i}" class="danger">Elimina tabella</button></div><div class="grid2">${inp('Nome (es. Tariffa periti industriali - progetto esecutivo)', `tariffe.${i}.nome`)}${inp('Modalità', `tariffe.${i}.modo`, { sel: [['progressivo', 'Progressiva per scaglioni'], ['classe', 'Unica percentuale per classe di importo']] })}</div><table class="tbl small"><thead><tr><th>Importo fino a [€] (vuoto = oltre)</th><th>Percentuale [%]</th><th></th></tr></thead><tbody>${(t.scaglioni || []).map((s, k) => `<tr><td><input type="number" step="any" data-n="1" data-b="tariffe.${i}.scaglioni.${k}.fino" value="${esc(s.fino)}"></td><td><input type="number" step="any" data-n="1" data-b="tariffe.${i}.scaglioni.${k}.perc" value="${esc(s.perc)}"></td><td><button data-act="delSc" data-i="${i}" data-k="${k}" class="danger">✕</button></td></tr>`).join('')}</tbody></table><div class="btns"><button data-act="addSc" data-i="${i}">+ Scaglione</button></div></div>`).join('');
    const righe = P.tariffaRighe.map((r, i) => `<tr><td class="l"><input data-b="tariffaRighe.${i}.desc" value="${esc(r.desc)}" placeholder="Prestazione"></td><td><select data-b="tariffaRighe.${i}.tab"><option value="">-</option>${P.tariffe.map(t => `<option value="${t.id}"${t.id === r.tab ? ' selected' : ''}>${esc(t.nome || 'Tabella')}</option>`).join('')}</select></td><td><input type="number" step="any" data-n="1" data-b="tariffaRighe.${i}.V" value="${esc(r.V)}"> €</td><td><input type="number" step="any" data-n="1" data-b="tariffaRighe.${i}.quota" value="${esc(r.quota == null ? 100 : r.quota)}"> %</td><td data-out="tr.${i}">-</td><td><button data-act="delTrg" data-i="${i}" class="danger">✕</button></td></tr>`).join('');
    return `<div class="card"><h3>Tariffa a scaglioni (tariffa professionale, DM 140/2012, altre tabelle)</h3><p class="muted">Inserisci le tabelle percentuali della tariffa che vuoi applicare (importo dei lavori → percentuale), anche una per tipologia di prestazione. Il programma non contiene tabelle di tariffe non vigenti: compila le tue o caricale da un file di progetto.</p><div class="btns"><button class="primary" data-act="addTab">+ Nuova tabella</button></div></div>${tabs}
<div class="card"><h3>Prestazioni calcolate con tariffa</h3><table class="tbl"><thead><tr><th class="l">Prestazione</th><th>Tabella</th><th>Importo V</th><th>Quota</th><th>Onorario</th><th></th></tr></thead><tbody>${righe}</tbody></table><div class="btns"><button data-act="addTrg">+ Prestazione</button></div><p>Compenso da tariffa: <b class="okc" data-out="totC">-</b></p></div>`;
  }

  function parcella() {
    const F = R.F;
    const t = (l, v, b) => `<tr class="${b ? 'strong' : ''}"><td class="l">${l}</td><td>${v}</td></tr>`;
    let body = '';
    if (F.inclA) body += t('Compenso a parametri (DM 2016)', eur(R.A.compenso));
    if (F.inclB) body += t('Compenso a costo orario', eur(R.B.compenso));
    if (F.inclC) body += t('Compenso da tariffa a scaglioni', eur(R.C.compenso));
    if (R.magg) body += t(`Maggiorazione ${f(C.num(F.magg), 1)}%`, eur(R.magg));
    if (R.sconto) body += t(`Sconto ${f(C.num(F.sconto), 1)}%`, '-' + eur(R.sconto));
    body += t('Compenso', eur(R.compenso), 1) + t(`Spese e oneri accessori ${f(R.spesePerc, 2)}%`, eur(R.spese));
    if (R.rimborsi) body += t('Rimborsi e spese documentate', eur(R.rimborsi));
    body += t('Imponibile', eur(R.imponibile), 1) + t(`Contributo integrativo ${f(C.num(F.integrativo), 2)}%`, eur(R.integrativo)) + t(F.forfettario ? 'IVA non dovuta (forfettario)' : `IVA ${f(R.ivaPerc, 2)}%`, eur(R.iva));
    if (R.bollo) body += t('Imposta di bollo', eur(R.bollo));
    body += t('TOTALE DOCUMENTO', eur(R.totale), 1);
    if (R.ritenuta) body += t(`Ritenuta d'acconto ${f(R.ritPerc, 0)}%`, '-' + eur(R.ritenuta));
    if (C.num(F.acconto)) body += t('Acconto già versato', '-' + eur(C.num(F.acconto)));
    body += t('DA PAGARE', eur(R.daPagare), 1);
    return `<div class="card"><h3>Confronto dei metodi e scelta</h3><p class="muted">Spunta i metodi da includere nel compenso (di norma uno solo; puoi sommarli se riguardano prestazioni diverse).</p><div class="grid3">
<div class="cmp"><label class="fld chk"><span><b>A</b> Parametri DM 2016</span><input type="checkbox" data-b="finale.inclA" data-bool="1"${F.inclA ? ' checked' : ''}></label><div class="big" data-out="totA">-</div></div>
<div class="cmp"><label class="fld chk"><span><b>B</b> Costo orario</span><input type="checkbox" data-b="finale.inclB" data-bool="1"${F.inclB ? ' checked' : ''}></label><div class="big" data-out="totB">-</div></div>
<div class="cmp"><label class="fld chk"><span><b>C</b> Tariffa a scaglioni</span><input type="checkbox" data-b="finale.inclC" data-bool="1"${F.inclC ? ' checked' : ''}></label><div class="big" data-out="totC">-</div></div></div></div>
<div class="card"><h3>Voci economiche</h3><div class="grid3">${inp('Maggiorazione (urgenza, ecc.)', 'finale.magg', { n: 1, u: '%' })}${inp('Sconto', 'finale.sconto', { n: 1, u: '%' })}
${inp('Spese e oneri accessori', 'finale.spese', { sel: [['dm', 'Forfait art. 5 DM 2016 (max 25%→10%)'], ['man', 'Percentuale manuale'], ['no', 'Nessuna']] })}
${F.spese === 'man' ? inp('Percentuale spese', 'finale.spesePerc', { n: 1, u: '%' }) : (F.spese === 'dm' ? inp('Quota del massimo applicata', 'finale.speseFrazione', { n: 1, u: '%', ph: '100', help: 'Percentuale applicata: <span data-out="spesePerc">-</span>' }) : '')}
${inp('Contributo integrativo EPPI', 'finale.integrativo', { n: 1, u: '%', ph: '5' })}${inp('IVA', 'finale.iva', { n: 1, u: '%', ph: '22' })}${inp('Ritenuta d\'acconto', 'finale.ritenuta', { n: 1, u: '%', ph: '20' })}${inp('Acconto già versato', 'finale.acconto', { n: 1, u: '€' })}${inp('Marca da bollo (se senza IVA)', 'finale.bollo', { n: 1, u: '€', ph: '2' })}
${inp('Regime forfettario (senza IVA e ritenuta)', 'finale.forfettario', { chk: 1 })}${inp('Includi trasferte e spese documentate', 'finale.rimborsi', { chk: 1 })}</div></div>
<div class="card"><h3>Riepilogo ${esc(P.meta.tipoDoc === 'parcella' ? 'parcella' : 'preventivo')}</h3><table class="tbl summary">${body}</table>
<div class="btns exp"><button class="primary" data-act="xlsx">Esporta Excel</button><button class="primary" data-act="pdf">Esporta PDF</button><button class="primary" data-act="docx">Preventivo / parcella (Word)</button><button class="primary" data-act="disc">Disciplinare d'incarico (Word)</button></div></div>`;
  }

  function tabelle() {
    const g = D.CATEGORIE.map(c => `<tr><td><b>${c[0]}</b></td><td class="l">${esc(c[1])}</td><td><input type="number" step="any" data-n="1" data-b="tabelle.G.${c[0]}" value="${esc(P.tabelle.G[c[0]] == null ? '' : P.tabelle.G[c[0]])}" placeholder="${c[2]}"></td></tr>`).join('');
    const q = D.PRESTAZIONI.map(r => { const ov = P.tabelle.Q[r[0]] || {}; const c = (k, base) => `<td><input type="number" step="any" data-n="1" data-b="tabelle.Q.${r[0]}.${k}" value="${esc(ov[k] == null ? '' : ov[k])}" placeholder="${base == null ? '' : base}"></td>`; return `<tr><td><b>${r[0]}</b></td><td class="l">${esc(r[2])}</td>${c('A', r[3])}${c('B', r[4])}${c('T', r[5])}</tr>`; }).join('');
    return `<div class="card"><h3>Tavola Z-1 - grado di complessità G</h3><p class="muted">Il campo vuoto usa il valore del decreto (mostrato in grigio). Inserisci un valore per modificarlo.</p><div class="scroll"><table class="tbl small"><thead><tr><th>ID</th><th class="l">Categoria</th><th>G</th></tr></thead><tbody>${g}</tbody></table></div></div>
<div class="card"><h3>Tavola Z-2 - parametri Q (colonne Impianti A, Impianti B, Tecnologie)</h3><p class="muted">Valori del decreto in grigio; i campi compilati hanno la precedenza. Le voci con scaglioni (QcI.09, QcI.10) usano il Q indicato fino a 500.000 € e quello oltre indicato nel decreto (non modificabile qui). Per prestazioni non presenti usa le voci libere nella pagina Parametri.</p><div class="scroll tall"><table class="tbl small"><thead><tr><th>Codice</th><th class="l">Prestazione</th><th>Q impianti A</th><th>Q impianti B</th><th>Q tecnologie</th></tr></thead><tbody>${q}</tbody></table></div><div class="btns"><button data-act="resetTab" class="danger">Ripristina i valori del decreto</button></div></div>`;
  }

  function archivio() {
    let a = {}; try { a = JSON.parse(localStorage.getItem(ARC) || '{}'); } catch (e) { /* vuoto */ }
    const rows = Object.keys(a).sort((x, y) => String(a[y].data).localeCompare(String(a[x].data))).map(id => `<tr><td class="l">${esc(a[id].nome)}</td><td class="l">${esc(a[id].cliente)}</td><td>${esc(a[id].data)}</td><td>${eur(a[id].tot)}</td><td><button data-act="openArc" data-id="${id}">Apri</button> <button data-act="delArc" data-id="${id}" class="danger">Elimina</button></td></tr>`).join('');
    return `<div class="card"><h3>Archivio pratiche</h3><p class="muted">Le pratiche sono salvate automaticamente nel browser. Per archiviarle o spostarle su un altro computer usa “Salva file” e “Apri file”.</p><table class="tbl"><thead><tr><th class="l">Pratica</th><th class="l">Cliente</th><th>Data</th><th>Totale</th><th></th></tr></thead><tbody>${rows || '<tr><td colspan="5" class="muted">Nessuna pratica salvata</td></tr>'}</tbody></table></div>`;
  }

  /* ---------- eventi ---------- */
  function onInput(ev) {
    const t = ev.target;
    if (t.dataset.b) {
      let v = t.value;
      if (t.dataset.bool) v = t.type === 'checkbox' ? t.checked : (v === 'true');
      else if (t.dataset.n) { const x = parseFloat(v); v = isFinite(x) ? x : ''; }
      set(P, t.dataset.b, v);
      persist(); totals();
      if (ev.type === 'change' && (t.tagName === 'SELECT' || t.type === 'checkbox')) { const keep = [window.scrollX, window.scrollY]; render(); window.scrollTo(keep[0], keep[1]); }
    } else if (t.dataset.pr != null && ev.type === 'change') {
      const o = P.opere[+t.dataset.pr]; o.prest = o.prest || [];
      const code = t.dataset.code, k = o.prest.indexOf(code);
      if (t.checked && k < 0) o.prest.push(code); else if (!t.checked && k >= 0) o.prest.splice(k, 1);
      persist(); totals();
    } else if (t.dataset.preset != null && ev.type === 'change' && t.value) {
      const o = P.opere[+t.dataset.preset]; o.prest = o.prest || [];
      D.PRESET[t.value].forEach(c => { if (o.prest.indexOf(c) < 0) o.prest.push(c); });
      persist(); const keep = window.scrollY; render(); window.scrollTo(0, keep);
    }
  }
  const act = {
    addOpera() { P.opere.push({ id: uid(), cat: 'IA.03', desc: '', V: '', G: '', col: '', prest: [], extra: [] }); },
    delOpera(i) { P.opere.splice(i, 1); },
    addExtra(i) { (P.opere[i].extra = P.opere[i].extra || []).push({ desc: '', Q: '' }); },
    delExtra(i, k) { P.opere[i].extra.splice(k, 1); },
    addOre() { P.ore.push({ desc: '', prof: P.profili[0].id, ore: '' }); }, delOre(i) { P.ore.splice(i, 1); },
    addTr() { P.trasferte.push({ desc: '', km: '', tariffa: 0.5, altro: '' }); }, delTr(i) { P.trasferte.splice(i, 1); },
    addSv() { P.speseVive.push({ desc: '', importo: '' }); }, delSv(i) { P.speseVive.splice(i, 1); },
    addTab() { P.tariffe.push({ id: uid(), nome: 'Nuova tabella', modo: 'progressivo', scaglioni: [{ fino: '', perc: '' }] }); },
    delTab(i) { const id = P.tariffe[i].id; P.tariffe.splice(i, 1); P.tariffaRighe.forEach(r => { if (r.tab === id) r.tab = ''; }); },
    addSc(i) { P.tariffe[i].scaglioni.push({ fino: '', perc: '' }); }, delSc(i, k) { P.tariffe[i].scaglioni.splice(k, 1); },
    addTrg() { P.tariffaRighe.push({ desc: '', tab: '', V: '', quota: 100 }); }, delTrg(i) { P.tariffaRighe.splice(i, 1); },
    resetTab() { if (confirm('Ripristinare tutti i valori G e Q del decreto?')) P.tabelle = { G: {}, Q: {} }; }
  };
  async function onClick(ev) {
    const t = ev.target.closest('button'); if (!t) return;
    if (t.dataset.pg) return go(t.dataset.pg);
    const a = t.dataset.act || t.dataset.top;
    if (act[a]) { act[a](+t.dataset.i, +t.dataset.k); persist(); const keep = window.scrollY; render(); window.scrollTo(0, keep); return; }
    switch (a) {
      case 'new': if (confirm('Creare una nuova pratica?')) { setP(empty()); go('pratica'); } break;
      case 'open': openFile(); break; case 'save': download(JSON.stringify(P, null, 1), fname('parcella.json'), 'application/json'); break;
      case 'logout': sessionStorage.removeItem('auth'); location.reload(); break;
      case 'openArc': { const A = JSON.parse(localStorage.getItem(ARC) || '{}'); if (A[t.dataset.id]) { setP(A[t.dataset.id].P); go('pratica'); } break; }
      case 'delArc': { if (!confirm('Eliminare la pratica dall\'archivio?')) break; const A = JSON.parse(localStorage.getItem(ARC) || '{}'); delete A[t.dataset.id]; localStorage.setItem(ARC, JSON.stringify(A)); render(); break; }
      case 'xlsx': download(window.Xlsx.build(Rp.sheets(P, R)), fname('xlsx'), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'); break;
      case 'pdf': { const d = new window.Pdf.Doc({ landscape: false, title: (P.studio.nome || 'Studio') + ' - ' + (P.meta.tipoDoc === 'parcella' ? 'Parcella' : 'Preventivo'), sub: P.meta.commessa || P.meta.oggetto }); d.blocks(Rp.blocks(P, R, true)); download(d.save(), fname('pdf'), 'application/pdf'); break; }
      case 'docx': download(window.Docx.build(Rp.blocks(P, R, false), { footer: P.studio.nome || 'Parcella' }), fname('docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); break;
      case 'disc': download(window.Docx.build(Rp.disciplinare(P, R), { footer: 'Disciplinare di incarico' }), 'Disciplinare_' + fname('docx'), 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'); break;
    }
  }
  function openFile() {
    const i = document.createElement('input'); i.type = 'file'; i.accept = '.json';
    i.onchange = () => { const r = new FileReader(); r.onload = () => { try { const j = JSON.parse(r.result); if (!j.v) throw new Error('file non valido'); setP(j); go('pratica'); toast('Pratica caricata'); } catch (e) { toast('File non valido', true); } }; r.readAsText(i.files[0]); };
    i.click();
  }

  function init() {
    P = load() || empty();
    document.addEventListener('click', onClick);
    document.addEventListener('input', onInput); document.addEventListener('change', onInput);
    render();
  }
  window.App = { init, get P() { return P; }, get R() { return R; }, setP, go };
})();
