## Commit Message Format

We follow the Conventional Commits format to keep history clean, searchable, and automation-friendly.

### Format

```
<type>(<scope>): <short summary>
```

### Types

- `feat` – New feature
- `fix` – Bug fix
- `refactor` – Code change without behavior change
- `perf` – Performance improvement
- `chore` – Maintenance / tooling
- `docs` – Documentation only
- `test` – Adding or updating tests
- `build` – Build system or dependency changes
- `ci` – CI/CD changes

### Scope

The scope should describe the area affected:

- `feat(uuid): add namespace support`
- `fix(correlation): prevent empty context crash`
- `refactor(auth): simplify token validation`

### Rules

- Use present tense (add, not added)
- Keep summary under ~72 characters
- Do not end with a period
- Be concise but descriptive

### Optional Body (for complex changes)

```
feat(correlation): support dynamic namespace UUID

Adds getNamespaceUUID helper and integrates it into
correlation ID generation to allow deterministic IDs
per logical namespace.
```

---

### Examples

#### Feature

```
feat(correlation): support deterministic UUID generation

Adds namespace-based UUID v5 generation to allow stable
correlation IDs derived from business context.
```

---

#### Bug Fix

```
fix(uuid): handle empty namespace gracefully

Prevents runtime error when namespace is undefined
by falling back to default namespace UUID.
```

---

#### Refactor

```
refactor(correlation): extract namespace logic into helper

Moves namespace UUID derivation into getNamespaceUUID
to improve readability and reuse.
```

---

#### Documentation

```
docs(readme): add commit message guidelines section
```

---

#### Tests

```
test(correlation): add coverage for namespace hashing logic
```

---

#### Performance

```
perf(uuid): reduce redundant namespace hashing

Caches derived namespace UUID to avoid repeated v5 computation.
```
