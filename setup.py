import os
import subprocess

# Define directories
dirs = [
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
]

print('Creating project structure...')
for dir_path in dirs:
    full_path = os.path.join(os.getcwd(), dir_path)
    os.makedirs(full_path, exist_ok=True)
    print(f'  Created: {dir_path}')

print('\nStructure created successfully!')
print('Installing dependencies...\n')

try:
    subprocess.run(['npm', 'install'], check=True)
    print('\nProject setup complete!')
except subprocess.CalledProcessError as e:
    print(f'Error installing dependencies: {e}')
    exit(1)
