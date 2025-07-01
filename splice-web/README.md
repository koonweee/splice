# Splice Web Application

A Next.js 15 React application that provides a user-friendly interface for the Splice financial data management service.

## Features

This web application implements a 4-step user journey:

1. **Create Account** - Generate a user account and receive an API key
2. **Store Credentials** - Securely store Bitwarden access token and receive a secret
3. **Manage Banks** - Connect bank accounts using Bitwarden credentials
4. **View Transactions** - Fetch and display financial transaction data

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Running Splice service on `http://localhost:3000`

### Installation

```bash
# Install dependencies
bun install

# Start development server
bun run dev
```

Visit [http://localhost:4000](http://localhost:4000) to access the application.

### Build for Production

```bash
bun run build
bun run start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Step 1: User Account Creation
│   ├── store-credentials/ # Step 2: Credential Storage
│   ├── banks/             # Step 3: Bank Management
│   ├── transactions/      # Step 4: Transaction Viewer
│   └── layout.tsx         # Root layout with navigation
├── components/
│   └── Navigation.tsx     # Step indicator and navigation
├── lib/
│   ├── api.ts            # API client for Splice service
│   └── storage.ts        # localStorage utilities
```

## Technology Stack

- **Framework**: Next.js 15 with App Router
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **HTTP Client**: Fetch API
- **State Management**: React hooks + localStorage
- **Linting/Formatting**: Biome (inherited from monorepo)

## API Integration

The application integrates with the Splice service using:

- **Authentication**: API key in `X-Api-Key` header
- **Authorization**: Secret in `X-Secret` header for transaction access
- **Error Handling**: Custom `ApiError` class with proper error messages
- **Type Safety**: Shared types from `splice-api` package

## Usage Flow

1. **Start** by creating a user account with username and optional email
2. **Store** your Bitwarden access token securely
3. **Connect** your bank accounts using Bitwarden credential UUIDs
4. **View** your financial transactions from connected accounts

All sensitive data (API keys, secrets) are stored in browser localStorage and used for authenticated API requests.
