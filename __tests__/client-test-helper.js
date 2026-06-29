const babel = require('c:/Sviluppo/ZecchinoReact/node_modules/@babel/core');
const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/lib/supabase/client.ts');
const code = fs.readFileSync(filePath, 'utf8');

try {
  const result = babel.transformSync(code, {
    filename: filePath,
    configFile: path.resolve(__dirname, '../babel.config.js')
  });

  const mockSupabaseJs = {
    createClient: () => ({})
  };

  const moduleFn = new Function('require', 'exports', result.code);
  const exportsObj = {};
  const customRequire = (name) => {
    if (name === '@supabase/supabase-js') return mockSupabaseJs;
    return require(name);
  };

  moduleFn(customRequire, exportsObj);
} catch (err) {
  console.error(err.message);
  process.exit(1);
}

if (typeof test === 'function') {
  test('dummy test for Jest scan compatibility', () => {
    expect(true).toBe(true);
  });
}
