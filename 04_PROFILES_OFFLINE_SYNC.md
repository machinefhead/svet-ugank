# 04 — Lokalni napredek zdaj; pravi računi kasneje

## Trenutna potrjena faza (R4)

- Brskalnik hrani temo ter zadnjo sejo vsake igralne igre v verzioniranih ključih `svet-ugank:r4:theme`, `svet-ugank:r4:wordsearch` in `svet-ugank:r4:maze`. Ob nedostopni shrambi napredek ostane v trenutnem zavihku.
- Iz zapisa R2 se prenese veljavna tema. Stare igralne mreže so nezdružljive z generatorjema R4. Ob obstoječi stari seji aplikacija pokaže obvestilo na začetnem zaslonu.
- Stara ključa `svet-ugank:r2` in `svet-ugank:maze` z zgodovinskimi vzdevki in rezultati ostaneta nedotaknjena. R4 dostopa zgolj do stare teme in podatka o obstoju stare seje.
- Podatki so vezani na izvor strani. Brisanje podatkov brskalnika lahko odstrani lokalni napredek. Izvoz in uvoz sta prihodnji možnosti.

## Zgodovina (R2–R3)

R2.1 je na naslovnici prikazoval lokalni vzdevek, zgodovino R2 ter rekorde R2.1 po stopnji in uporabi namigov. R3 je dodal ločeno shrambo Labirinta z ogledanim stanjem rešitve, koraki, namigi in lokalnimi časi. Sprememba R4 je datirana v [registru odločitev](08_DECISIONS.md).

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
