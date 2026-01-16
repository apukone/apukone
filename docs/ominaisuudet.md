# Ominaisuudet

Järjestelmän tärkeimmät ominaisuudet.

## Agentti-Integraatio

Yhdistä mikä tahansa OpenAI-yhteensopiva agentti Apukoneeseen helposti.

## Agenttien Jakaminen

Voit jakaa omistamasi agentit muiden käyttäjien kanssa:
- **Jaa käyttäjätunnuksella**: Anna toiselle käyttäjälle lukuoikeus agenttiisi.
- **Hallinta**: Voit milloin tahansa poistaa jaon.
- **Oikeudet**: Jaetut käyttäjät voivat keskustella agentin kanssa, mutta eivät voi muokata tai poistaa sitä.

## Luotettavuus (Offline-tuki)

Järjestelmä takaa viestien toimituksen myös yhteyskatkosten aikana:
- **Offline-jonotus**: Jos agentti ei ole yhteydessä palvelimeen, viestit tallennetaan jonoon (`offline_queued`).
- **Automaattinen purku**: Kun agentti palaa linjoille, se käsittelee jonottaneet viestit kronologisessa järjestyksessä.

## Tietoturva

Kaikki liikenne agenttien ja palvelimen välillä on salattu.
