import JSZip from 'jszip';

// Package.json content for local offline execution
const PACKAGE_JSON = JSON.stringify(
  {
    name: "stroop-color-word-test",
    private: true,
    version: "1.0.0",
    description: "Web-based Stroop Color-Word Test for psychology research studying the effect of being observed on task performance.",
    type: "module",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "@tailwindcss/vite": "^4.3.3",
      "@vitejs/plugin-react": "^6.1.1",
      "jszip": "^3.10.1",
      "lucide-react": "^0.546.0",
      "react": "^19.0.1",
      "react-dom": "^19.0.1",
      "tailwindcss": "^4.3.3",
      "vite": "^8.3.0"
    },
    devDependencies: {
      "@types/jszip": "^3.4.1",
      "@types/node": "^22.14.0",
      "@types/react": "^19.3.0",
      "@types/react-dom": "^19.3.0",
      "typescript": "^7.0.2"
    }
  },
  null,
  2
);

const README_MD = `# Stroop Color-Word Test — Social Facilitation & Observation Study

Standardized 50-item web-based Stroop Color-Word Test built for psychology research on:
**"The Effect of Being Observed on Task Performance Among Psychology Students"**

## Quick Start (Run Locally on Any Computer)

### Requirements
- Node.js (version 18 or higher): [https://nodejs.org](https://nodejs.org)

### Installation & Execution
1. Unzip this project directory.
2. Open a terminal / command prompt in this folder:
   \`\`\`bash
   npm install
   \`\`\`
3. Start the local offline server:
   \`\`\`bash
   npm run dev
   \`\`\`
4. Open your browser at \`http://localhost:5173\` or the URL printed in terminal.

### Production Build (For offline lab machines or campus hosting)
\`\`\`bash
npm run build
\`\`\`
The resulting static files in \`dist/\` can be served by any static web server (Apache, Nginx, or directly opened).

## Features
- **50 Scored Items**: 25 Congruent and 25 Incongruent trials, randomized.
- **Silent Background RT Recording**: Monotonic high-resolution timing via \`performance.now()\` without distracting visible countdowns.
- **Observed vs. Unobserved Condition**: Standardized protocol with checklist.
- **Privacy Compliance**: Uses participant codes (e.g. P001); no full names gathered.
- **Local Storage**: Data stays on the testing machine; zero external server transmission.
- **CSV Exports**: Trial-level (all 50 items) and summary CSVs.
`;

const TSCONFIG_JSON = JSON.stringify(
  {
    compilerOptions: {
      target: "ES2022",
      useDefineForClassFields: true,
      lib: ["ES2022", "DOM", "DOM.Iterable"],
      module: "ESNext",
      skipLibCheck: true,
      moduleResolution: "bundler",
      allowImportingTsExtensions: false,
      resolveJsonModule: true,
      isolatedModules: true,
      noEmit: true,
      jsx: "react-jsx",
      strict: true,
      noUnusedLocals: false,
      noUnusedParameters: false,
      noFallthroughCasesInSwitch: true
    },
    include: ["src"]
  },
  null,
  2
);

const VITE_CONFIG_TS = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
});
`;

export async function downloadAppZip(): Promise<void> {
  const zip = new JSZip();

  // Root configuration files
  zip.file('package.json', PACKAGE_JSON);
  zip.file('README.md', README_MD);
  zip.file('tsconfig.json', TSCONFIG_JSON);
  zip.file('vite.config.ts', VITE_CONFIG_TS);

  // Index HTML
  const indexHtml = document.documentElement.outerHTML;
  zip.file('index.html', indexHtml);

  // Fetch or gather client scripts from current source
  // We can fetch source files directly or assemble a clean standalone build bundle
  const currentApp = await fetchAppSources();
  for (const [filepath, content] of Object.entries(currentApp)) {
    zip.file(filepath, content);
  }

  // Generate ZIP blob and trigger browser download
  const blob = await zip.generateAsync({ type: 'blob' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `stroop-experiment-app-${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Reads local sources in browser context
 */
async function fetchAppSources(): Promise<Record<string, string>> {
  const files: Record<string, string> = {};

  const fileList = [
    '/src/main.tsx',
    '/src/App.tsx',
    '/src/index.css',
    '/src/types/stroop.ts',
    '/src/utils/constants.ts',
    '/src/utils/stroopGenerator.ts',
    '/src/utils/metrics.ts',
    '/src/utils/csvExport.ts',
    '/src/utils/storage.ts',
    '/src/components/Header.tsx',
    '/src/components/ParticipantSetup.tsx',
    '/src/components/InstructionsModal.tsx',
    '/src/components/PracticePhase.tsx',
    '/src/components/TestingPhase.tsx',
    '/src/components/ResultsView.tsx',
    '/src/components/SessionHistoryModal.tsx',
    '/src/components/ObservationProtocolModal.tsx',
    '/src/components/ResetConfirmModal.tsx',
  ];

  await Promise.all(
    fileList.map(async (path) => {
      try {
        const res = await fetch(path);
        if (res.ok) {
          const text = await res.text();
          // strip leading slash
          files[path.replace(/^\//, '')] = text;
        }
      } catch (err) {
        console.warn(`Could not fetch ${path} for zip export:`, err);
      }
    })
  );

  return files;
}
