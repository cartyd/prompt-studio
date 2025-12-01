# Prompt Framework Studio

A full-stack web application for creating structured, effective prompts using proven LLM prompting frameworks. Built with TypeScript, Fastify, Prisma, and htmx.

## Features

- 🌳 **Multiple Prompting Frameworks**: Tree-of-Thought, Chain-of-Thought, Self-Consistency, Role-Based, and Reflection
- 📝 **Guided Forms**: Framework-specific forms to generate professional prompts
- ⚡ **Real-Time Preview**: See your prompts generated live with htmx
- 💾 **Prompt Library**: Save and manage your prompts
- 🔒 **Secure Authentication**: User registration and login with bcrypt password hashing
- 🚀 **Premium Features**: Unlimited saved prompts and export capabilities
- 🛡️ **Security**: Rate limiting, Helmet.js security headers, and session management

## Tech Stack

- **Backend**: Node.js with TypeScript and Fastify
- **Database**: Prisma ORM with SQLite (dev) and PostgreSQL (prod)
- **Frontend**: Server-rendered EJS templates enhanced with htmx
- **Authentication**: Cookie-based sessions with bcrypt
- **Security**: @fastify/helmet, @fastify/rate-limit, @fastify/session
- **Testing**: Jest with TypeScript support

## Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (for development)
- PostgreSQL (for production)

## Installation

1. **Clone the repository and install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL="file:./dev.db"
SESSION_SECRET="your-secret-key-change-in-production"
PORT=3000
NODE_ENV=development
```

3. **Initialize the database:**

```bash
npm run prisma:generate
npm run prisma:migrate
```

This will create the SQLite database and run migrations.

## Development

Start the development server with auto-reload:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Building for Production

1. **Build the TypeScript code:**

```bash
npm run build
```

2. **Set up production environment:**

Update your `.env` for production:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/promptstudio?schema=public"
SESSION_SECRET="your-strong-secret-key"
PORT=3000
NODE_ENV=production
```

3. **Run migrations:**

```bash
npm run prisma:migrate
```

4. **Start the production server:**

```bash
npm start
```

## Database Management

### Run Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

### Create a new migration

```bash
npm run prisma:migrate
```

### Generate Prisma Client

```bash
npm run prisma:generate
```

## Testing

Run the test suite:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

The test suite includes:
- Authentication flow tests
- Free-tier prompt limit enforcement
- Premium vs free user behavior
- Framework prompt generation tests

## Project Structure

```
prompt-studio/
├── src/
│   ├── server.ts              # Fastify server setup
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── plugins/
│   │   ├── prisma.ts          # Prisma client plugin
│   │   └── auth.ts            # Authentication middleware
│   ├── routes/
│   │   ├── index.ts           # Home and premium routes
│   │   ├── auth.ts            # Authentication routes
│   │   ├── frameworks.ts      # Framework routes
│   │   └── prompts.ts         # Prompt CRUD routes
│   ├── frameworks.ts          # Framework definitions and generation logic
│   └── views/                 # EJS templates
│       ├── layout.ejs         # Base layout
│       ├── home.ejs           # Home page
│       ├── auth/              # Auth pages
│       ├── frameworks/        # Framework pages
│       ├── prompts/           # Prompt pages
│       └── partials/          # htmx partial responses
├── prisma/
│   └── schema.prisma          # Database schema
├── tests/                     # Jest tests
├── package.json
├── tsconfig.json
└── README.md
```

## API Routes

### Authentication
- `GET /auth/register` - Registration page
- `POST /auth/register` - Create new account
- `GET /auth/login` - Login page
- `POST /auth/login` - Authenticate user
- `POST /auth/logout` - End session

### Frameworks
- `GET /frameworks` - List all frameworks
- `GET /frameworks/:frameworkId` - Framework form page
- `POST /frameworks/:frameworkId/generate` - Generate prompt preview (htmx)

### Prompts
- `GET /prompts` - List user's prompts
- `GET /prompts/:id` - View single prompt
- `POST /prompts` - Save new prompt (htmx)
- `DELETE /prompts/:id` - Delete prompt (htmx)
- `GET /prompts/:id/export` - Export prompt (premium only)

### Other
- `GET /` - Home page
- `GET /premium` - Premium features page
- `POST /admin/make-premium` - Upgrade to premium (testing)

## Subscription Tiers

### Free Tier
- Access to all prompting frameworks
- Generate unlimited prompts
- Save up to 5 prompts
- No export functionality

### Premium Tier
- Everything in Free
- Unlimited saved prompts
- Export prompts as text files
- Future premium features

## Available Prompting Frameworks

1. **Tree-of-Thought (ToT)**: Explore multiple reasoning paths and evaluate approaches
2. **Self-Consistency**: Generate multiple reasoning paths for consistent answers
3. **Chain-of-Thought (CoT)**: Break down problems into step-by-step reasoning
4. **Few-Shot / Role Prompting**: Provide examples and define specific roles
5. **Reflection / Revision**: Generate, critique, and improve responses

## Security Features

- Password hashing with bcrypt (10 salt rounds)
- HTTP-only secure session cookies
- Rate limiting on authentication endpoints (5 requests per 5 minutes)
- Helmet.js security headers
- Content Security Policy
- CSRF protection via session management

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | Database connection string | `file:./dev.db` |
| `SESSION_SECRET` | Secret key for session encryption | Required |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |
| `LOG_LEVEL` | Logging level | `info` |

## Deployment

Ready to deploy to production? See [DEPLOYMENT.md](./DEPLOYMENT.md) for a complete guide to deploying on DigitalOcean.

**Quick Deploy:**
1. Create a DigitalOcean Droplet (Ubuntu 22.04)
2. SSH into the Droplet and clone this repo
3. Run `./setup-droplet.sh` for automated setup
4. Access your app at `http://YOUR_DROPLET_IP`

Cost: Starting at $6/month

## Troubleshooting

### Database Connection Issues

If you encounter database connection errors:

1. Ensure DATABASE_URL is correctly set in `.env`
2. For SQLite, ensure the directory is writable
3. For PostgreSQL, verify the connection string and database exists

### Port Already in Use

If port 3000 is already in use, change the PORT in `.env` or set it when running:

```bash
PORT=3001 npm run dev
```

### Migration Errors

If migrations fail, you can reset the database (development only):

```bash
rm dev.db
npm run prisma:migrate
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
