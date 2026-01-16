# Asennus

Tämä osio kuvaa yksityiskohtaisesti, kuinka Apukone asennetaan ja konfiguroidaan sekä paikallisessa että tuotantoympäristössä.

## Vaatimukset

- **Node.js**: v18 tai uudempi
- **Docker**: Järjestelmän ja tietokantojen ajamiseen

## Paikallinen Kehitys

1. Kloonaa repositorio:
   ```bash
   git clone https://github.com/apukone/apukone.git
   cd apukone
   ```

2. Käynnistä palvelut Docker Composella:
   ```bash
   docker-compose up -d
   ```

3. Palvelu on nyt käynnissä osoitteessa `http://localhost:8080`.

## Tuotantoasennus

Tuotannossa suosittelemme käyttämään Caddy-palvelinta käänteisenä välityspalvelimena HTTP/2-tuen ja automaattisten SSL-sertifikaattien vuoksi.
