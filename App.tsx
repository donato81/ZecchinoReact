import 'react-native-get-random-values';
import { sha256 } from '@noble/hashes/sha256';
import { pbkdf2 } from '@noble/hashes/pbkdf2';

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';

if (typeof globalThis.crypto === 'undefined') {
  // @ts-ignore
  globalThis.crypto = {};
}
if (typeof globalThis.crypto.subtle === 'undefined') {
  // @ts-ignore
  globalThis.crypto.subtle = {};
}

// INSERITI I TUOI NUMERI PICCOLI PER TROVARE IL VALORE IDEALE
const ITERAZIONI = [200, 300, 400, 500, 600, 700, 800, 900, 1000];
const RIPETIZIONI = 10; // Aumentate a 10 per maggiore precisione sui tempi corti
const SALT = new Uint8Array(16).fill(0xAB);

function misura(iter: number): number {
  const pin = new TextEncoder().encode('1234');
  const start = performance.now();
  pbkdf2(sha256, pin, SALT, { c: iter, dkLen: 32 });
  return performance.now() - start;
}

function mediana(valori: number[]): number {
  const ord = [...valori].sort((a, b) => a - b);
  const m = Math.floor(ord.length / 2);
  return ord.length % 2 !== 0 ? ord[m] : (ord[m - 1] + ord[m]) / 2;
}

export default function BenchHermes() {
  const [righe, setRighe] = useState<string[]>(['Avvio benchmark...']);

  useEffect(() => {
    let i = 0;
    const risultati: string[] = [];

    function eseguiProssimo() {
      if (i < ITERAZIONI.length) {
        const iter = ITERAZIONI[i];
        setRighe([...risultati, `Calcolo ${iter} iterazioni in corso...`]);

        setTimeout(() => {
          const mis: number[] = [];
          for (let j = 0; j < RIPETIZIONI; j++) {
            mis.push(misura(iter));
          }
          const med = mediana(mis).toFixed(1);
          
          // Manteniamo il nostro parametro di riferimento: sotto i 300ms è OK
          const ok = parseFloat(med) <= 300 ? 'OK' : 'LENTO';
          
          const rigaRisultato = `${iter} iter → ${med} ms  [${ok}]`;
          
          risultati.push(rigaRisultato);
          setRighe([...risultati]);
          
          i++;
          eseguiProssimo();
        }, 30); // Timeout ridotto, l'app sarà agilissima
      } else {
        setRighe([...risultati, '=== BENCHMARK COMPLETATO ===']);
      }
    }

    const t = setTimeout(eseguiProssimo, 1000);
    return () => clearTimeout(t);
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text 
        focusable={true}
        accessibilityRole="text"
        style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16, color: '#000' }}
      >
        Benchmark PBKDF2 su Hermes (Valori Reali)
      </Text>
      
      {righe.map((r, i) => (
        <Text 
          key={i} 
          focusable={true}
          accessibilityRole="text"
          accessibilityLabel={r}
          style={{ fontSize: 16, marginBottom: 8, fontFamily: 'monospace', color: '#000', padding: 4 }}
        >
          {r}
        </Text>
      ))}
    </ScrollView>
  );
}