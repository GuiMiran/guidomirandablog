# Setup Instructions

Due to PowerShell 6+ not being available on this system, please run one of the following commands manually to create the directory structure and install dependencies:

## Option 1: Using Python
```bash
python setup.py
```

## Option 2: Using Node.js
```bash
node run-setup.js
```

## Option 3: Using Windows Batch File
```cmd
setup.bat
```

## Option 4: Manual Directory Creation
If the scripts don't work, create directories manually:

```cmd
mkdir src\app\api\ai\chat
mkdir src\app\api\ai\generate
mkdir src\app\api\ai\summarize
mkdir src\app\blog\[slug]
mkdir src\components\ui
mkdir src\components\blog
mkdir src\components\ai
mkdir src\lib\firebase
mkdir src\lib\openai
mkdir src\types
mkdir src\utils
mkdir content\posts
mkdir tests\unit
mkdir tests\e2e
mkdir .github\workflows
mkdir public\images

npm install
```

After running one of the above options, all source files will be created automatically in the next step.
