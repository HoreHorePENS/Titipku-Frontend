# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend enabling type-aware lint rules by installing `oxlint-tsgolint` and editing `.oxlintrc.json`:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "typescript", "oxc"],
  "options": {
    "typeAware": true
  },
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

See the [Oxlint rules documentation](https://oxc.rs/docs/guide/usage/linter/rules) for the full list of rules and categories.

## Docker & CI

Aplikasi di-build dengan Vite lalu disajikan oleh Nginx (port **8080** di dalam container, berjalan sebagai user non-root `nginx` UID 101). Lihat `Dockerfile` dan `nginx.conf`.

### Build & run lokal

```bash
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t titipku-frontend:local .
docker run --rm -p 3000:8080 titipku-frontend:local
```

Buka http://localhost:3000. `VITE_API_BASE_URL` di-*bake* ke bundle JS saat build (bukan runtime), jadi ganti URL API = build ulang image. Nilai ini terlihat publik di browser — jangan isi dengan rahasia.

### Image di GitHub Container Registry

Workflow `.github/workflows/docker.yml` mem-build image setiap push/PR dan mem-push ke:

```
ghcr.io/horehorepens/titipku-frontend
```

| Event | Push ke GHCR? | Tag |
| --- | --- | --- |
| push ke `main` | ya | `main`, `sha-<7 char>`, `latest` |
| push ke `dev` | ya | `dev`, `sha-<7 char>` |
| `workflow_dispatch` (manual) | ya | `<nama-branch>`, `sha-<7 char>` (+ `latest` jika dari `main`) |
| pull request ke `main`/`dev` | tidak (hanya build) | — |

### Pull image

```bash
# Jika package private, login dulu dengan PAT ber-scope read:packages
echo "$GHCR_TOKEN" | docker login ghcr.io -u <username-github> --password-stdin

docker pull ghcr.io/horehorepens/titipku-frontend:latest   # rilis main terbaru
docker pull ghcr.io/horehorepens/titipku-frontend:dev      # build dev terbaru
docker run --rm -p 3000:8080 ghcr.io/horehorepens/titipku-frontend:latest
```

### Variabel build di GitHub

Isi di **Settings → Secrets and variables → Actions → Variables**:

- `VITE_API_BASE_URL` — URL base API backend untuk build produksi (mis. `https://api.titipku.example`). Jika kosong, aplikasi memakai fallback `http://localhost:8080`.
