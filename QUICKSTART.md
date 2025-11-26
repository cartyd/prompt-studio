# Quick Start Guide

## Get Started in 3 Steps

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up Database
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 3. Start the Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser!

## First Steps

1. **Register an Account**: Click "Register" and create your account
2. **Explore Frameworks**: Navigate to "Frameworks" to see all available prompting frameworks
3. **Create Your First Prompt**: 
   - Select a framework (e.g., "Tree-of-Thought")
   - Fill out the guided form
   - Click "Generate Preview" to see your prompt
   - Click "Save Prompt" to add it to your library
4. **View Your Prompts**: Go to "My Prompts" to see your saved prompts
5. **Try Premium**: Visit the "Premium" page and click "Upgrade to Premium (Test)" to test premium features

## Available Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run test suite
- `npm run prisma:studio` - Open database GUI

## Test Accounts

You can create any account for testing. To make an account premium:
1. Log in with your account
2. Visit `/premium`
3. Click "Upgrade to Premium (Test)"

## Features to Try

### Free Tier
- Create prompts with any of the 5 frameworks
- Save up to 5 prompts
- View and copy your saved prompts

### Premium Tier (after upgrade)
- Save unlimited prompts
- Export prompts as text files
- All free tier features

## Available Frameworks

1. **Tree-of-Thought (ToT)** - Multiple reasoning paths evaluation
2. **Self-Consistency** - Consistent answers from multiple paths
3. **Chain-of-Thought (CoT)** - Step-by-step problem solving
4. **Few-Shot / Role Prompting** - Example-based with role definition
5. **Reflection / Revision** - Generate, critique, and improve

## Next Steps

- Check out the full [README.md](README.md) for detailed documentation
- Explore the codebase to understand the architecture
- Modify frameworks in `src/frameworks.ts` to add your own
- Customize templates in `src/views/` to change the UI
