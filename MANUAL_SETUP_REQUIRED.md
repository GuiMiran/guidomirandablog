# SETUP INSTRUCTIONS

Due to PowerShell Core not being available in this environment, please follow these steps manually:

## Step 1: Create Directory Structure
Run ONE of the following commands in your terminal:

### Option A: Using Node.js (Recommended)
```bash
node create-dirs.js
```

### Option B: Using the batch file
```cmd
complete-setup.bat
```

### Option C: Using PowerShell
```powershell
.\complete-setup.ps1
```

## Step 2: Install Dependencies
After creating directories, run:
```bash
npm install
```

## Step 3: Create Source Files
Once setup is complete, I have prepared all 15 source files ready to be created.

The files are:
1. src/app/layout.tsx - Main layout with metadata ✓
2. src/app/page.tsx - Homepage ✓  
3. src/app/globals.css - Global styles ✓
4. src/app/api/ai/chat/route.ts - AI chat endpoint ✓
5. src/app/api/ai/generate/route.ts - Content generation ✓
6. src/app/api/ai/summarize/route.ts - Summarization ✓
7. src/app/blog/[slug]/page.tsx - Blog post page ✓
8. src/lib/firebase/config.ts - Firebase config ✓
9. src/lib/firebase/admin.ts - Firebase Admin ✓
10. src/lib/openai/client.ts - OpenAI client ✓
11. src/components/blog/PostCard.tsx - Post card component ✓
12. src/components/ai/ChatBot.tsx - Chatbot component ✓
13. src/types/index.ts - Type definitions ✓
14. tests/setup.ts - Test setup ✓
15. tests/e2e/home.spec.ts - E2E test ✓

Please run one of the setup commands above, and once complete, let me know so I can create all the source files!
