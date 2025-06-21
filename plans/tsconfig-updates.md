# Plan: Implement a Build-Free Development Workflow with TypeScript Project References

This plan outlines the necessary changes to your TypeScript configuration to enable a seamless development experience using TypeScript's project references feature. This approach provides better type checking, dependency management, and build coordination between packages.

## Objective

1.  **For Development**: Configure TypeScript to understand the dependency relationship between `splice-service` and `@splice/api` using project references
2.  **For Production**: Leverage TypeScript's incremental builds and proper dependency resolution for optimized builds

We will achieve this by updating TypeScript configurations in both packages to use project references.

## Step 0: Create Root `tsconfig.json`

Create a workspace-level TypeScript configuration for better IDE support and global build commands.

**File to Create**: `tsconfig.json` (in repository root)

**Action**: Create file with the following content:

```json
{
  "files": [],
  "references": [
    { "path": "./splice-api" },
    { "path": "./splice-service" }
  ]
}
```

## Step 1: Update `splice-api/tsconfig.json` to Enable Composite Mode

First, we need to make the API package a composite project so it can be referenced by other projects.

**File to Edit**: `splice-api/tsconfig.json`

**Action**: Add `"composite": true` to the compiler options:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "composite": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Step 2: Update `splice-service/tsconfig.json` to Reference the API Package

Configure the service package to reference the API package, enabling direct TypeScript source resolution during development.

**File to Edit**: `splice-service/tsconfig.json`

**Action**: Replace the content of the file with the following:

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2023",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "composite": true
  },
  "references": [
    { "path": "../splice-api" }
  ]
}
```

## Step 3: Remove `tsconfig.build.json` (Not Needed)

Since your project uses SWC as the builder (configured in `nest-cli.json`), the `tsconfig.build.json` file is not needed. TypeScript project references handle dependency resolution automatically, and SWC compiles directly without requiring TypeScript configuration overrides.

**File to Remove**: `splice-service/tsconfig.build.json`

**Action**: Delete this file as it's no longer necessary.

## Resulting Workflow

* **For Development**: Simply run `bun run dev` from the service directory. TypeScript will automatically resolve imports to the source files in `splice-api`, providing instant updates without build steps.
* **For Production**: Build with `bun run build` in the service directory. TypeScript will automatically build referenced projects in the correct order and use compiled outputs.
* **Type Checking**: Use `tsc --build` from root for workspace-wide incremental compilation, or from individual package directories for package-specific builds.

## Benefits of Project References

1. **Better Type Checking**: TypeScript understands the dependency graph and provides more accurate error reporting
2. **Incremental Builds**: Only rebuilds what's changed, making builds faster
3. **Automatic Dependency Resolution**: No need for manual path mapping or build coordination
4. **IDE Integration**: Better IntelliSense and go-to-definition across packages
5. **Workspace Support**: Root tsconfig enables IDE workspace-wide TypeScript support and global build commands

