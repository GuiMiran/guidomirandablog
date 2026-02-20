const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

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

console.log('Creating project structure...');
dirs.forEach(dir => {
  const fullPath = path.join(__dirname, dir);
  fs.mkdirSync(fullPath, { recursive: true });
  console.log(`  Created: ${dir}`);
});

console.log('\nStructure created successfully!');
console.log('Installing dependencies...\n');

try {
  execSync('npm install', { stdio: 'inherit', cwd: __dirname });
  console.log('\nProject setup complete!');
} catch (error) {
  console.error('Error installing dependencies:', error.message);
  process.exit(1);
}
