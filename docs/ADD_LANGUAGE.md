# Adding a New Language

Workers are deliberately langauge-agnostic, every language integration lives entirely inside a Docker image
If your image works, lambex works

---

## Instruction

### 1. Create the Dockerfile

Location:

```sh
docker/images/{language}.Dockerfile
```

Your container should accept the code and run it. Nothing else

### 2. Add the Image to Build Script

Register your image in:

```sh
scripts/build-runtimes.sh
```

### 3. Register the Language in Lambex

Edit:

```sh
worker/langauge.ts
```

Define:

- Docker image name
- How code is executed inside the container

### 4. Enable API Validation

Edit:

```sh
api/runs/schema.ts
```

Add your language name to the allowed list

---

## Quick Test Before You Push

Run your image by hand:

- Pipe sample code via stdin
- Confirm output on stdout
- Confirm errors on stderr

Also check:

- No crash when filesystem is read-only
- No hang on infinite loops
