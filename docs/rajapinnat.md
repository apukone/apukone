# Rajapinnat (API)

Luettelo kaikista backendin tarjoamista rajapinnoista.

## Autentikaatio (`/api/auth`)

- `POST /register`: Rekisteröi uusi käyttäjä (Vain Admin).
- `POST /login`: Kirjaudu sisään ja hae JWT-token.

## Agentit (`/api/agents`)

- `GET /`: Listaa kaikki agentit.
- `POST /`: Luo uusi agentti.
- `DELETE /:id`: Poista agentti.
- `POST /share`: Jaa agentti toiselle käyttäjälle (`{ agentId, username }`).
- `POST /unshare`: Poista jako (`{ agentId, userId }`).
- `POST /shared-users`: Listaa käyttäjät, joille agentti on jaettu.

## Inferenssi (`/api/inference`)

Rajapinta agenttien käyttöön.

- `POST /finalize`: Merkitse viestin käsittely valmiiksi ja lähetä lopullinen vastaus. Takaa sekvenssin jatkumisen.

## Chat (`/api/chat`)

- `POST /`: Aloitus uusi keskustelu.
- `GET /:id/messages`: Hae viestihistoria.
