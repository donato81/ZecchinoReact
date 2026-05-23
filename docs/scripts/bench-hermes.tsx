// File temporaneo — da eliminare dopo aver letto i risultati
// Incollare temporaneamente in App.tsx il componente BenchHermes
// oppure eseguire con: npx react-native run-windows

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { pbkdf2 } from '@noble/hashes/pbkdf2';
import { sha256 } from '@noble/hashes/sha256';

const ITERAZIONI = [100000, 150000, 200000, 300000, 450000, 600000];
const RIPETIZIONI = 5;
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
    const risultati: string[] = [];
    for (const iter of ITERAZIONI) {
      const mis: number[] = [];
      for (let j = 0; j < RIPETIZIONI; j++) {
        mis.push(misura(iter));
      }
      const med = mediana(mis).toFixed(1);
      const ok = parseFloat(med) <= 300 ? 'OK' : 'LENTO';
      risultati.push(`${iter} iter → ${med} ms  [${ok}]`);
    }
    setRighe(risultati);
  }, []);

  return (
    <ScrollView style={{ flex: 1, padding: 20, backgroundColor: '#fff' }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 16 }}>
        Benchmark PBKDF2 su Hermes
      </Text>
      {righe.map((r, i) => (
        <Text key={i} style={{ fontSize: 16, marginBottom: 8, fontFamily: 'monospace' }}>
          {r}
        </Text>
      ))}
    </ScrollView>
  );
}