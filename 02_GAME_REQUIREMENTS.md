# 02 — Zahteve za igre

## Skupna pravila
Vsaka igralna uganka ima stabilen ID, revizijo, uporabljene nastavitve in preverljivo rešitev. Generator in preverjevalnik sta ločena od prikaza. Izbira igre odpre nastavitve. »Začni igro« izdela mrežo, »Nadaljuj« obnovi shranjeno sejo, »Nova uganka« pa vrne na nastavitve. Za zamenjavo nedokončane uganke je potrebna potrditev. Uspešno dokončanje prikaže čestitko. Celotno rešitev odpre izrecna potrditev in po vrnitvi je igralni napredek isti.

## Osmosmerka

| Klasična stopnja | Mreža | Besede | Dolžina | Smeri |
| --- | --- | --- | --- | --- |
| Začetna | 6 × 6 | 4 | 3–4 | Desno in dol |
| Lahka | 8 × 8 | 6 | 3–5 | Desno, dol in diagonali navzdol |
| Srednja | 10 × 10 | 8 | 4–7 | Vseh osem |
| Težka | 12 × 12 | 12 | 5–10 | Vseh osem v vsaki mreži |

- »Po meri« ima velikosti 6, 8, 10 in 12, izbiro 2, 4 ali 8 smeri, število od 3 do 14 in štiri ločene zahtevnosti. Zahtevnost prilagaja dolžino in podobnost besed, težo prekrivanj in porazdelitev črk v polnilu. Predolga beseda je izključena iz nabora, omejitev števila besed pa je navedena ob polju.
- Slovensko besedišče vključuje Č, Š in Ž. Deterministični generator preveri, da se vsaka ciljna beseda pojavi natanko enkrat v vseh osmih smereh. Beseda je neprekinjena ravna črta. Na voljo sta oba vrstna reda označitve končnih črk. Generiranje ima omejeno število poskusov in ob neuspehu izpiše razlog.
- Dotik uporablja dve končni črki in dopušča navpično drsenje. Na namizju delujeta vlečenje ter pomikanje s puščicami in označevanje z Enter. Kljukica in prečrtanje ločita najdene besede. Dva namiga na sejo lahko povesta zgolj orientacijo ene še iskane besede, dokler sta vsaj dve nenajdeni.

## Sudoku
- 4×4, 6×6 in 9×9 s pravilnimi regijami.
- Vsaka uganka ima natanko eno rešitev; ustrezno preverjena težavnost, ne le štetje praznih polj.
- Tipkovnica, dotik in razumljivi namigi brez samodejnega razkritja rešitve.

## Labirint

- Mreže 13 × 13, 21 × 21, 33 × 33, 45 × 45 in 61 × 61. Velikost in težavnost (Lahka, Srednja, Zahtevna) sta neodvisni. Privzeto 13 × 13 in Lahka.
- Generator R4 uporabi naključno razvrščene povezave in Kruskalov algoritem. Preverjevalnik potrdi povezljivost in enolično pot do cilja. Generator primerja do 15 kandidatov in izbere spodnjo, srednjo ali zgornjo oceno. Ocena vključuje dolžino poti, zavoje, razpotja, slepe veje in največjo globino napačnega odcepa. Posamezne meritve se med stopnjami lahko prekrivajo.
- Celotna mreža je prikazana v enem SVG-ju. Premik dovoljuje le odprto sosednje polje. Krmiljenje vključuje analogno palico s štirimi smermi in ponavljanjem, puščice, W, A, S, D, smerne gumbe in klik soseda. Namig pove samo naslednjo smer.

## Križanka
- Cilj je **prava skandinavska križanka**: opisi v celicah mreže, puščice, gosta in smiselna križanja.
- V3 je samo poenostavljen neuspešen poskus; ne sprejmi naključno razmetanih gesel kot končne križanke.
- Za prvo kakovostno izvedbo so dovolj ročno pregledane mreže in besedna baza; generator ne sme ustvarjati napačnih namigov.
- Slovenski opisi, besedne oblike, pravilna dolžina, črke na vseh križiščih skladne. Povečava/izbira opisa tudi na telefonu.
- Ne uvajaj drugih različic križank v prvo izdajo brez odločitve.
