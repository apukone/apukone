# Apukone

**Apukone** tarjoaa avoimen lähdekoodin ratkaisut omien tekoälymallien hallintaan. 

## Arkkitehtuuri

Apukone on jaettu kolmeen eri osaan:

* `apukone/apukone`: ns. pääjärjestelmä, joka pyöri Docker konteinerissa
* `apukone/apukone-client`: npm-kirjasto, jonka avulla agentit kommunikoivat pääjärjestelmän kanssa
* `apukone/apukone-agent-starter`: agentti, joka asennetaan omalle palvelimelle tai työasemalle yhdessä client-kirjaston kanssa  

## Pääjärjestelmän ohjelmistovaatimukset

*   Docker 
*   Node.js

## Käyttöönotto tuotannossa

### 1. **Pääjärjestelmän asennus**

#### Kloonataan pääjärjestelmän repository:

```bash
git clone https://github.com/apukone/apukone.git
```
Kloonaa pääjärjestelmän repository ja siirry pääjärjestelmän kansion:

```bash
cd apukone
```

#### Asetetaan ympäristömuuttujat:

```bash
cp .env.example .env
nano .env
```
Muuta tokenit, tietokantamuuttujat ja domain osoitteet tarpeen mukaan.

#### Rakennetaan kontainerit:

```bash
docker-compose -f docker-compose.prod.yml up -d
```
Järjestelmä pyöri nyt Docker konteinerissa. Selaimen kautta pääsee ohjelmistoon portista 8080.

### 2. **Käytön aloitus selaimen kautta**

#### Kirjautuminen

Ensimmäisen asennuksen yhteydessä luodaan admin käyttäjä. Kirjaudu sisään käyttäjänä admin ja salasanana admin. Muistathan vaihtaa salasanan.

#### Agenttienhallinta

Yläpalkin kautta "Valitse agentti" -alasvetovalikosta voidaan valita haluamasi agentti. Samasta alasvetovalikosta voidaan myös valita "Lisää agentti" tai "Hallitse agentteja".

Ennen kuin ensimmäinen agentti voidaan asentaa omalle palvelimelle täytyy se ensin luoda tämän valikon kautta.

Agentin luonnin yhteydessä sille generoidaan `token`-muuttuja, joka tarvitaan agentin asennuksessa. Tämän tokenin avulla agentti kommunikoi pääjärjestelmän kanssa.

### 3. **Agentin asennus**

Luotuasi ensimmäisen agentin pääjärjestelmään, voidaan se asentaa omalle palvelimelle tai työasemalle.

Agentin luomiseen on kaksi vaihtoehtoa:

* Luodaan valmis agentti olemassa olevasta reposta, esim: `apukone/apukone-agent-starter`
* Rakennetaan oma agentti, joka yhdistetään pääjärjestelmään `apukone/apukone-client` npm-kirjaston avulla

Kun agentti on luotu, voidaan se asentaa omalle palvelimelle tai työasemalle.

### 4. **Agentin käyttöönotto**

Kun agentti on luotu ja se on yhdistetty pääjärjestelmään, voidaan sen kanssa keskustella pääjärjestelmän käyttöliittymän kautta.

Pääjärjestelmä kertoo reaaliaikaisesti agentin toiminnan tilanteen ja välittää viestejä reaaliaikaisesti edes takaisin.

## Pääjärjestelmän teknologiat

* Käyttöliittymä: Angular 19+
* Backend: Node.js
* Tietokanta: PostgreSQL
* Docker: Docker Compose
* Proxy: Caddy
* Jonot: Redis
* Yhteydet: WebSocket, REST, HTTP2-streamit

## Lisenssi

**GNU General Public License v3.0**. Katso [LICENSE](./LICENSE).