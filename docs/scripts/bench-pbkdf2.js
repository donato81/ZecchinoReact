'use strict';

// =============================================================================
// docs/scripts/bench-pbkdf2.js
// Benchmark PBKDF2-SHA256 — Fase 0 di PLAN 006
//
// USA crypto NATIVO di Node.js — nessuna dipendenza esterna necessaria.
// Questo benchmark misura le stesse prestazioni di @noble/hashes
// con margine trascurabile per lo scopo di calibrazione.
//
// ESECUZIONE:
//   node docs/scripts/bench-pbkdf2.js
// =============================================================================

var crypto = require('crypto');

var ITERAZIONI_DA_TESTARE = [100000, 150000, 200000, 300000, 450000, 600000];
var RIPETIZIONI = 10;
var PIN_TEST = '1234';
var SALT_TEST = Buffer.alloc(16, 0xAB);
var DK_LEN = 32;

function misuraTempo(iterazioni) {
  var start = performance.now();
  crypto.pbkdf2Sync(PIN_TEST, SALT_TEST, iterazioni, DK_LEN, 'sha256');
  return performance.now() - start;
}

function calcolaMediana(valori) {
  var ordinati = valori.slice().sort(function(a, b) { return a - b; });
  var meta = Math.floor(ordinati.length / 2);
  return ordinati.length % 2 !== 0
    ? ordinati[meta]
    : (ordinati[meta - 1] + ordinati[meta]) / 2;
}

console.log('');
console.log('=== BENCHMARK PBKDF2-SHA256 — PLAN 006 Fase 0 ===');
console.log('Device: ' + process.platform + ', Node ' + process.version);
console.log('Ripetizioni per valore: ' + RIPETIZIONI);
console.log('');
console.log('Iterazioni   | Mediana (ms) | Entro budget?');
console.log('-------------|--------------|---------------');

var valoreConsigliato = null;

for (var i = 0; i < ITERAZIONI_DA_TESTARE.length; i++) {
  var iterazioni = ITERAZIONI_DA_TESTARE[i];
  var misurazioni = [];
  for (var j = 0; j < RIPETIZIONI; j++) {
    misurazioni.push(misuraTempo(iterazioni));
  }
  var mediana = calcolaMediana(misurazioni).toFixed(1);
  var entro = parseFloat(mediana) <= 300 ? 'SI  OK' : 'NO  (troppo lento)';
  var label = iterazioni.toString();
  while (label.length < 12) { label = label + ' '; }
  console.log(label + ' | ' + mediana.padStart(12) + ' | ' + entro);

  if (parseFloat(mediana) <= 300) {
    valoreConsigliato = iterazioni;
  }
}

console.log('');

if (valoreConsigliato !== null) {
  console.log('>>> VALORE CONSIGLIATO: ' + valoreConsigliato + ' iterazioni');
  console.log('');
  console.log('PASSO SUCCESSIVO:');
  console.log('  1. Aprire docs/scripts/generate-golden-vectors.js');
  console.log('  2. Sostituire la riga:');
  console.log('       const PBKDF2_ITERATIONS = undefined;');
  console.log('     con:');
  console.log('       const PBKDF2_ITERATIONS = ' + valoreConsigliato + ';');
  console.log('  3. Eseguire: node docs/scripts/generate-golden-vectors.js');
} else {
  console.log('>>> ATTENZIONE: nessun valore rientra nel budget 100-300 ms.');
  console.log('    Floor invalicabile: 100.000 iterazioni (OWASP).');
  console.log('    Aprire criticita nel PLAN 006 paragrafo 2.5');
  console.log('    e attendere istruzione prima di procedere.');
}

console.log('');
console.log('=== FINE BENCHMARK ===');