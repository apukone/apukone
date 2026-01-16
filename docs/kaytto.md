# Käyttö

Kuinka järjestelmää käytetään.

## Kirjautuminen

Kirjaudu sisään järjestelmään `/login` sivulla. Oletustunnukset kehitysympäristössä:
- **Käyttäjä**: `admin`
- **Salasana**: `admin`

## Agenttien Hallinta

Navigoi **Agents** -osioon luodaksesi uusia agentteja. Jokainen agentti saa yksilöllisen API-avaimen.

## Chat

Voit keskustella agenttiesi kanssa reaaliaikaisesti **Chat**-näkymässä.

## Agenttien Ajaminen

Jotta voit keskustella agentin kanssa, sen täytyy olla käynnissä omalla koneellasi (tai palvelimellasi) ja yhdistettynä Apukoneeseen.

1. **Hae Token**: Luo uusi agentti käyttöliittymässä ja kopioi sen token.
2. **Aseta Ympäristömuuttuja**: Aseta token agenttisi `.env` tiedostoon tai ympäristömuuttujaksi (`AGENT_TOKEN`).

### Esimerkkiagentit

Tarjoamme valmiita pohjia agenttien kehitykseen:
- **[Starter Agent](https://github.com/apukone/apukone-agent-starter)**: Yksinkertainen pohja.
- **[NHL Agent](https://github.com/apukone/apukone-agent-nhl)**: Esimerkki MCP-työkalujen käytöstä.
- **[Weather Agent](https://github.com/apukone/apukone-agent-weather)**: Esimerkki sääpalveluintegraatiosta.

### Omat Agentit

Voit rakentaa omia agentteja käyttämällä npm-kirjastoamme:
[`@apukone/client`](https://www.npmjs.com/package/@apukone/client).

```bash
npm install @apukone/client
```
