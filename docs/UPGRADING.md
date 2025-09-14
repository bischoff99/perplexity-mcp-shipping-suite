# Upgrading Guide

This document describes breaking changes and migration paths for major dependency updates.

## Zod v3 → v4 Migration

### Overview

The repository has been upgraded from Zod v3.x to v4.1.8. This migration includes several breaking changes that required code updates across all apps and libraries.

### Breaking Changes

#### 1. `z.record()` API Change

**Before (v3):**
```typescript
const schema = z.object({
  options: z.record(z.unknown()).optional()
});
```

**After (v4):**
```typescript
const schema = z.object({
  options: z.record(z.string(), z.unknown()).optional()
});
```

**Fix:** Add the key type as the first parameter to `z.record()`. For string keys, use `z.string()`.

#### 2. `SafeParseReturnType` Removal

**Before (v3):**
```typescript
import { z } from 'zod';

function validate(data: unknown): z.SafeParseReturnType<unknown, MyType> {
  return MySchema.safeParse(data);
}
```

**After (v4):**
```typescript
import { z } from 'zod';

type SafeParseResult<T> = z.ZodSafeParseSuccess<T> | z.ZodSafeParseError<T>;

function validate(data: unknown): SafeParseResult<MyType> {
  return MySchema.safeParse(data);
}
```

**Fix:** Create a union type using `ZodSafeParseSuccess` and `ZodSafeParseError`.

#### 3. `ZodError.errors` → `ZodError.issues`

**Before (v3):**
```typescript
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.errors);
}
```

**After (v4):**
```typescript
const result = schema.safeParse(data);
if (!result.success) {
  console.log(result.error.issues);
}
```

**Fix:** Replace `error.errors` with `error.issues`.

#### 4. `ZodError.create()` → `new ZodError()`

**Before (v3):**
```typescript
const customError = z.ZodError.create([{
  code: 'custom',
  path: ['field'],
  message: 'Custom error'
}]);
```

**After (v4):**
```typescript
const customError = new z.ZodError([{
  code: 'custom',
  path: ['field'],
  message: 'Custom error'
}]);
```

**Fix:** Use the constructor instead of the static `create` method.

### Developer Action Items

When upgrading to Zod v4 in your local development environment:

1. **Install Zod v4:**
   ```bash
   npm install zod@^4.1.8
   ```

2. **Update validation functions:** Follow the patterns above to fix any compilation errors.

3. **Update tests:** Error messages and validation behavior may have changed. Update test assertions accordingly.

4. **Check schema definitions:** Ensure all `z.record()` usages include key types.

5. **Verify error handling:** Replace `error.errors` with `error.issues` in error handling code.

### Migration Checklist

- [ ] Update `z.record()` calls to include key type
- [ ] Replace `SafeParseReturnType` with union type
- [ ] Change `error.errors` to `error.issues`
- [ ] Replace `ZodError.create()` with constructor
- [ ] Update test assertions for new error format
- [ ] Run TypeScript compilation to catch remaining issues
- [ ] Test validation functionality

### Resources

- [Zod v4 Release Notes](https://github.com/colinhacks/zod/releases/tag/v4.0.0)
- [Zod v4 Migration Guide](https://zod.dev/upgrade-guide)
- [Zod Documentation](https://zod.dev/)

### Support

If you encounter issues during the migration, please:

1. Check this guide for common patterns
2. Review the TypeScript compiler errors for specific issues
3. Consult the Zod v4 documentation
4. Open an issue in the repository if problems persist