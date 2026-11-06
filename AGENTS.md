# Momentum deployment contract

- `main` deploys to the company Ubuntu server at https://bill.spailab.com/Momentum/ through `bash ubuntu/deploy.sh` in `/home/bill/projects/momentum-calendar`.
- Keep Next.js standalone, the `/Momentum` base path, server-side account isolation, optimistic journal revisions and full JSON backup/restore working.
- Runtime secrets and SQLite live outside Git. Never commit credentials, personal records, runtime configuration or database backups. Never replace or seed a production database during updates.
- Run `npm test`, `npm run typecheck`, `npm run build`, and `npm run test:integration` for changes affecting production behavior. The integration suite uses isolated temporary data.
- Preserve the existing company Caddy routes and PM2 services. Ordinary application updates do not require Caddy changes.
- The original Sites/Cloudflare files are references; do not switch company production back to Sites authentication headers or silently publish a separate Site.
