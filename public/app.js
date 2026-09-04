document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs Logic
  const navBtns = document.querySelectorAll('.nav-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  navBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.getAttribute('data-tab');

      navBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(t => t.classList.remove('active'));

      btn.classList.add('active');
      document.getElementById(tabId).classList.add('active');
    });
  });

  // Settings: Load and Save
  const baseUrlInput = document.getElementById('model-base-url');
  const apiKeyInput = document.getElementById('model-api-key');
  const modelNameInput = document.getElementById('model-name');
  const saveSettingsBtn = document.getElementById('btn-save-settings');
  const settingsStatus = document.getElementById('settings-status');

  async function loadSettings() {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data) {
        baseUrlInput.value = data.baseUrl || '';
        modelNameInput.value = data.modelName || 'gpt-4o';
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }
  }

  saveSettingsBtn.addEventListener('click', async () => {
    try {
      const payload = {
        baseUrl: baseUrlInput.value.trim(),
        apiKey: apiKeyInput.value.trim(),
        modelName: modelNameInput.value.trim()
      };

      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        settingsStatus.textContent = 'Settings updated successfully!';
        setTimeout(() => { settingsStatus.textContent = ''; }, 3000);
      }
    } catch (err) {
      settingsStatus.textContent = 'Error saving settings.';
    }
  });

  loadSettings();

  // Tab 1: Script Generator
  const generateScriptBtn = document.getElementById('btn-generate-script');
  const scriptPromptInput = document.getElementById('script-prompt');
  const scriptTypeSelect = document.getElementById('script-type');
  const scriptOutput = document.getElementById('script-output');
  const scriptExplanation = document.getElementById('script-explanation');
  const copyScriptBtn = document.getElementById('btn-copy-script');
  const saveScriptBtn = document.getElementById('btn-save-script');

  generateScriptBtn.addEventListener('click', async () => {
    const prompt = scriptPromptInput.value.trim();
    if (!prompt) {
      alert('Please enter a description for the script.');
      return;
    }

    generateScriptBtn.disabled = true;
    generateScriptBtn.textContent = 'Generating...';

    try {
      const res = await fetch('/api/generate-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, scriptType: scriptTypeSelect.value })
      });
      const data = await res.json();

      if (data.success) {
        scriptOutput.textContent = data.code;
        scriptExplanation.innerHTML = `<strong>Explanation:</strong> ${data.explanation}`;
      } else {
        scriptOutput.textContent = '-- Error: ' + (data.error || 'Failed to generate script');
      }
    } catch (err) {
      scriptOutput.textContent = '-- Error connecting to server.';
    } finally {
      generateScriptBtn.disabled = false;
      generateScriptBtn.textContent = '⚡ Generate Luau Script';
    }
  });

  copyScriptBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(scriptOutput.textContent);
    copyScriptBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyScriptBtn.textContent = '📋 Copy Code'; }, 2000);
  });

  saveScriptBtn.addEventListener('click', async () => {
    const code = scriptOutput.textContent;
    if (!code || code.startsWith('-- Generated')) {
      alert('Generate a script first before saving.');
      return;
    }

    const name = prompt('Enter project name:', 'Luau Script - ' + scriptTypeSelect.value);
    if (!name) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, type: 'Script', content: code })
      });
      const data = await res.json();
      if (data.success) {
        alert('Project saved successfully!');
        loadProjects();
      }
    } catch (err) {
      alert('Failed to save project.');
    }
  });

  // Tab 2: GUI Builder
  const generateGuiBtn = document.getElementById('btn-generate-gui');
  const guiPromptInput = document.getElementById('gui-prompt');
  const guiThemeSelect = document.getElementById('gui-theme');
  const guiCanvas = document.getElementById('gui-canvas');
  const guiCodeOutput = document.getElementById('gui-code-output');
  const copyGuiCodeBtn = document.getElementById('btn-copy-gui-code');

  generateGuiBtn.addEventListener('click', async () => {
    const prompt = guiPromptInput.value.trim();
    if (!prompt) {
      alert('Please enter a GUI panel description.');
      return;
    }

    generateGuiBtn.disabled = true;
    generateGuiBtn.textContent = 'Generating...';

    try {
      const res = await fetch('/api/generate-gui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, theme: guiThemeSelect.value })
      });
      const data = await res.json();

      if (data.success) {
        guiCodeOutput.textContent = data.luauCode;
        renderGuiCanvasPreview(data.guiSpecs);
      }
    } catch (err) {
      guiCodeOutput.textContent = '-- Error generating GUI code.';
    } finally {
      generateGuiBtn.disabled = false;
      generateGuiBtn.textContent = '🎨 Generate GUI & Luau Code';
    }
  });

  function renderGuiCanvasPreview(specs) {
    guiCanvas.innerHTML = '';
    if (!specs || !specs.elements) return;

    specs.elements.forEach(elem => {
      const frame = document.createElement('div');
      frame.style.width = elem.size.x + 'px';
      frame.style.height = elem.size.y + 'px';
      frame.style.backgroundColor = elem.backgroundColor;
      frame.style.border = `2px solid ${elem.borderColor}`;
      frame.style.borderRadius = '12px';
      frame.style.padding = '16px';
      frame.style.display = 'flex';
      frame.style.flexDirection = 'column';
      frame.style.justifyContent = 'space-between';
      frame.style.boxShadow = '0 8px 24px rgba(0,0,0,0.5)';

      if (elem.children) {
        elem.children.forEach(child => {
          if (child.type === 'TextLabel') {
            const title = document.createElement('h3');
            title.textContent = child.text;
            title.style.color = child.textColor;
            title.style.textAlign = 'center';
            title.style.fontFamily = 'Inter, sans-serif';
            frame.appendChild(title);
          } else if (child.type === 'TextButton') {
            const btn = document.createElement('button');
            btn.textContent = child.text;
            btn.style.backgroundColor = child.backgroundColor;
            btn.style.color = child.textColor;
            btn.style.border = 'none';
            btn.style.padding = '10px';
            btn.style.borderRadius = '8px';
            btn.style.fontWeight = 'bold';
            btn.style.cursor = 'pointer';
            frame.appendChild(btn);
          }
        });
      }

      guiCanvas.appendChild(frame);
    });
  }

  copyGuiCodeBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(guiCodeOutput.textContent);
    copyGuiCodeBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyGuiCodeBtn.textContent = '📋 Copy UI Code'; }, 2000);
  });

  // Tab 3: Asset Prompter
  const generateAssetBtn = document.getElementById('btn-generate-asset');
  const assetTypeSelect = document.getElementById('asset-type');
  const assetStyleSelect = document.getElementById('asset-style');
  const assetDescInput = document.getElementById('asset-description');
  const assetPromptOutput = document.getElementById('asset-prompt-output');
  const assetNegativeOutput = document.getElementById('asset-negative-output');
  const assetAspectRatio = document.getElementById('asset-aspect-ratio');
  const copyAssetPromptBtn = document.getElementById('btn-copy-asset-prompt');

  generateAssetBtn.addEventListener('click', async () => {
    const description = assetDescInput.value.trim();
    if (!description) {
      alert('Please enter a description for the asset.');
      return;
    }

    try {
      const res = await fetch('/api/generate-asset-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetType: assetTypeSelect.value,
          style: assetStyleSelect.value,
          description
        })
      });
      const data = await res.json();

      if (data.success) {
        assetPromptOutput.value = data.optimizedPrompt;
        assetNegativeOutput.value = data.negativePrompt;
        assetAspectRatio.textContent = `Recommended Aspect Ratio: ${data.recommendedAspectRatio}`;
      }
    } catch (err) {
      alert('Error generating asset prompt.');
    }
  });

  copyAssetPromptBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(assetPromptOutput.value);
    copyAssetPromptBtn.textContent = '✓ Copied!';
    setTimeout(() => { copyAssetPromptBtn.textContent = '📋 Copy Prompt'; }, 2000);
  });

  // Tab 4: Saved Projects
  const projectsList = document.getElementById('projects-list');
  const refreshProjectsBtn = document.getElementById('btn-refresh-projects');

  async function loadProjects() {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();

      if (data && data.projects && data.projects.length > 0) {
        projectsList.innerHTML = '';
        data.projects.forEach(proj => {
          const card = document.createElement('div');
          card.className = 'project-card';
          card.innerHTML = `
            <h4>${proj.name}</h4>
            <span class="project-type">${proj.type} • ${new Date(proj.createdAt).toLocaleDateString()}</span>
            <pre><code>${proj.content}</code></pre>
          `;
          projectsList.appendChild(card);
        });
      } else {
        projectsList.innerHTML = '<p>No saved projects yet.</p>';
      }
    } catch (err) {
      projectsList.innerHTML = '<p>Error loading projects.</p>';
    }
  }

  refreshProjectsBtn.addEventListener('click', loadProjects);
  loadProjects();
});
