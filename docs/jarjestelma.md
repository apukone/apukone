# Järjestelmä

Järjestelmän tekninen arkkitehtuuri ja käytetyt teknologiat.

## Teknologiat

- **Frontend**: Angular 19, Angular Material.
- **Backend**: Node.js, Fastify (HTTP/1.1 & HTTP/2).
- **Tietokanta**: PostgreSQL (Prisma ORM).
- **Välimuisti/Jono**: Redis (Pub/Sub, Streams).
- **Infrastruktuuri**: Docker, Docker Compose.

## Protokollat

- **HTTP/1.1**: Käyttöliittymä (UI) ja julkinen API.
- **HTTP/2**: Dedikoitu serveri (`port: 8081`) agenttien pitkäkestoisiin yhteyksiin. Mahdollistaa kaksisuuntaisen striimauksen ja välittömän viestinvälityksen ilman pollausta.
- **SSE (Server-Sent Events)**: Käyttöliittymän reaaliaikaiset päivitykset.
- **WebSocket**: (Ei käytössä tällä hetkellä, korvattu HTTP/2 ja SSE:llä).
