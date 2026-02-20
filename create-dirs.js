const fs = require('fs');
const path = require('path');

const dirs = [
  'src/app/api/ai/chat',
  'src/app/api/ai/generate',
  'src/app/api/ai/summarize',
  'src/app/blog/[slug]',
  'src/components/ui',
  'src/components/blog',
  'src/components/ai',
  'src/lib/firebase',
  'src/lib/openai',
  'src/types',
  'src/utils',
  'content/posts',
  'tests/unit',
  'tests/e2e',
  '.github/workflows',
  'public/images'
];

console.log('Creating directories...');
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) {
    fs.mkdirSync(fullPath, { recursive: true });
    console.log(`Created: ${dir}`);
  } else {
    console.log(`Exists: ${dir}`);
  }
});

console.log('\nAll directories created!');
