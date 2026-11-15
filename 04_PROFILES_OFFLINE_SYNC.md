# 04 — Lokalni napredek zdaj; pravi računi kasneje

## Trenutna potrjena faza
- Igranje brez registracije ali strežniškega računa.
- Izbirni **lokalni vzdevek**, nikoli lažna globalna prijava.
- Shranjevanje nastavitev, lokalne statistike in napredka na napravi, predvidoma IndexedDB.
- Izvoz/uvoz lastnega napredka kot varnostna kopija, če je izvedljivo v fazi.
- Opozorilo, da brisanje podatkov brskalnika lahko odstrani lokalni napredek.
- Brez shranjevanja gesel v datotekah, JavaScriptu, LocalStorage ali Githubu.
- Lokalna statistika ni javna lestvica.

V R2.1 je povzetek profila na naslovnici pod ilustracijo in gumbom »Začni igrati«. Aplikacija prebere stari zapis `svet-ugank:r2` in ob naslednjem shranjevanju zapiše shemo 2. Aktivna uganka R2 še naprej uporablja generator revizije 1, vključno z najdenimi besedami, namigi in stanjem ogleda rešitve. Stara nastavitev »Težka« za naslednjo uganko postane »Srednja«. Časi prejšnje revizije so v zgodovini R2, osebni rekordi R2.1 pa veljajo znotraj iste stopnje in so ločeni glede na uporabo namigov.

## Offline igranje
- Ko ima povezavo, igralec prenese aplikacijo in določen paket ugank (PWA).
- Brez interneta rešuje, shrani napredek in dokončanja v lokalno shrambo.
- Prihodnje stanje dogodka in ID uganke načrtuj tako, da bo možna poznejša preverjena sinhronizacija, ne dodajaj še strežniškega mehanizma.
- Različica ene samostojne HTML datoteke lahko ostane dodatna izvozna možnost; `file://` ni ekvivalent nameščeni PWA.

## Kasnejša faza, ki je zdaj ODLOŽENA
- Pravi računi: uporabniško ime + geslo, brez obvezne e-pošte, obnovitev dostopa.
- Server za varno preverjanje prijave in podatkov, ne javna datoteka z gesli.
- Sinhronizacija lokalnih dogodkov po povezavi z idempotentnimi ID, strežniškim preverjanjem rešitev in obravnavo konfliktov.
- Skupne lestvice samo za razumno preverjene zaključke. Offline merjeni čas ni zanesljiv dokaz za globalne časovne lestvice.
- Otroške zasebnostne in varnostne zahteve urediti pred javno uvedbo profilov.

Izbire backend-a, ponudnika in registracijske UX še **ne sprejemamo**. Ni potrebe po teh odvisnostih v začetni aplikaciji.
