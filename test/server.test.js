const assert = require('assert');
const http = require('http');
const app = require('../server');

let server;
const PORT = 3001;
const BASE_URL = `http://localhost:${PORT}`;

function postJSON(path, payload) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(payload);
    const req = http.request(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getJSON(path) {
  return new Promise((resolve, reject) => {
    http.get(`${BASE_URL}${path}`, res => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, body });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('Starting AI Game Studio Server Tests...\n');

  server = app.listen(PORT, async () => {
    try {
      // 1. Test GET /api/config
      console.log('Testing GET /api/config...');
      const configRes = await getJSON('/api/config');
      assert.strictEqual(configRes.status, 200);
      assert.strictEqual(typeof configRes.body.baseUrl, 'string');
      console.log('✓ GET /api/config passed');

      // 2. Test POST /api/config
      console.log('Testing POST /api/config...');
      const updateConfigRes = await postJSON('/api/config', {
        baseUrl: 'https://api.my-nilo-endpoint.com/v1',
        apiKey: 'sk-testkey123',
        modelName: 'gpt-4o-mini'
      });
      assert.strictEqual(updateConfigRes.status, 200);
      assert.strictEqual(updateConfigRes.body.success, true);
      assert.strictEqual(updateConfigRes.body.config.baseUrl, 'https://api.my-nilo-endpoint.com/v1');
      console.log('✓ POST /api/config passed');

      // 3. Test POST /api/generate-script
      console.log('Testing POST /api/generate-script...');
      const scriptRes = await postJSON('/api/generate-script', {
        prompt: 'Player Inventory System',
        scriptType: 'ServerScript'
      });
      assert.strictEqual(scriptRes.status, 200);
      assert.strictEqual(scriptRes.body.success, true);
      assert.ok(scriptRes.body.code.includes('InventoryData'));
      console.log('✓ POST /api/generate-script passed');

      // 4. Test POST /api/generate-gui
      console.log('Testing POST /api/generate-gui...');
      const guiRes = await postJSON('/api/generate-gui', {
        prompt: 'Shop Menu Panel',
        theme: 'Dark Gaming'
      });
      assert.strictEqual(guiRes.status, 200);
      assert.strictEqual(guiRes.body.success, true);
      assert.ok(guiRes.body.luauCode.includes('ScreenGui'));
      console.log('✓ POST /api/generate-gui passed');

      // 5. Test POST /api/generate-asset-prompt
      console.log('Testing POST /api/generate-asset-prompt...');
      const assetRes = await postJSON('/api/generate-asset-prompt', {
        assetType: 'Roblox Game Thumbnail',
        style: 'Vibrant 3D Render',
        description: 'Floating magic island'
      });
      assert.strictEqual(assetRes.status, 200);
      assert.strictEqual(assetRes.body.success, true);
      assert.ok(assetRes.body.optimizedPrompt.includes('Floating magic island'));
      console.log('✓ POST /api/generate-asset-prompt passed');

      // 6. Test POST & GET /api/projects
      console.log('Testing POST /api/projects...');
      const saveProjRes = await postJSON('/api/projects', {
        name: 'Test Project',
        type: 'Script',
        content: 'print("Hello Roblox")'
      });
      assert.strictEqual(saveProjRes.status, 201);
      assert.strictEqual(saveProjRes.body.success, true);

      console.log('Testing GET /api/projects...');
      const getProjRes = await getJSON('/api/projects');
      assert.strictEqual(getProjRes.status, 200);
      assert.strictEqual(getProjRes.body.projects.length, 1);
      assert.strictEqual(getProjRes.body.projects[0].name, 'Test Project');
      console.log('✓ GET /api/projects passed');

      console.log('\nAll 6 test suites passed successfully! 🎉');
      server.close();
      process.exit(0);
    } catch (err) {
      console.error('❌ Test failed:', err);
      if (server) server.close();
      process.exit(1);
    }
  });
}

runTests();
