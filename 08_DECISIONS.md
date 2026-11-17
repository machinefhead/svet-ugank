# 08 — Register odločitev

## Potrjeno 15. 11. 2026
- Projekt »Svet ugank« koordinirava v ChatGPT Project. Lastnik je odobril javno vidnost `machinefhead/svet-ugank` in javni GitHub Pages.
- Za prvo izdajo samo **Osmosmerka, Skandinavska križanka, Sudoku, Labirint**; kasneje počasi nove vrste.
- Privzeti slovenski UI; otrokom prijazna in dostopna uporaba brez prisile registracije.
- Landing z ilustracijo in »Začni igrati«, ne neposredno naključna igra.
- Nevtralna večbarvna paleta, ne vedno zeleno/modro; tema svetla/temna/sistemska.
- Nastavitve stopijo v veljavo šele ob »Nova uganka«.
- Kakovosten modal po rešitvi; podobno oblikovani ostali dialogi; celotna rešitev samo namerno.
- Osmosmerka je uradno ime; najdene besede očitno označene.
- Skandinavska križanka je dejanska gosta mreža z opisi in puščicami v mreži; V3 ni ustrezna.
- Labirint naj ima zahtevne odcepe in različno zavito pravilno pot ter dobro mobilno upravljanje.
- Modularna koda, offline PWA, preneseni paketi, možnost samostojnega HTML izvoza.
- **Novo:** najprej samo lokalni vzdevek/napredek brez prijave; pravi računi (ime+geslo brez obvezne e-pošte), strežniška sinhronizacija in skupne lestvice **so odloženi v poznejšo fazo**.
- V3 ostane zgolj arhivska referenca, ne avtomatska osnova nove implementacije.
- Codex dela v ločenih vejah z majhnimi nalogami. Združitev razvojne veje potrdi in izvede lastnik ali koordinator po pregledu.

## Začasno potrjeno 15. 11. 2026 — R1

- Lastnik je začasno potrdil vizualni prototip R1, posebej njegovo temno smer. Svetla in sistemska različica ostajata v trenutni obliki do nadaljnjega pregleda. Končna paleta ostaja odprta.

## Odprto
- Končna paleta, naslovna ilustracija in izbrana grafična smer.
- Prva zbirka pravih skandinavskih križank in upravljanje slovenskega leksikona.
- Podrobnosti offline datotek in paketov, poznejši izvoz/uvoz ter varni računi.
- Kateri prototipni deli V3 so dejansko vredni ponovne uporabe.

Novih odločitev ni dovoljeno prikrito izvajati kot že potrjenih.

## Izvedba R2 — 15. 11. 2026

- R2 uporablja TypeScript, Vite in DOM/CSS iz R1. Pogled je zapisan v delu naslova za znakom `#`, zato delujeta tudi gumba Nazaj in Naprej v brskalniku.
- Lokalna shramba `localStorage` ima verzioniran zapis za temo, izbirni vzdevek, naslednjo prednastavitev, aktivno osmosmerko in osebne rezultate. Če zapis ni mogoč, je igranje še vedno na voljo v pomnilniku zavihka.
- Osmosmerka se obnovi iz semena, prednastavitve in revizije generatorja. Tri prednastavitve spreminjajo velikost, število in dolžino besed ter izbiro prekrivanj. Vse uporabljajo osem smeri. Tema besed in ročna izbira smeri nista del R2.
- Dva namiga označita začetni črki. Po potrjenem ogledu celotne rešitve ostane uganka za pregled, najdene besede se ohranijo, rezultat pa se ne zabeleži. Osebni časi z namigi in brez njih so ločeni. Lokalni čas od začetka vključuje premore.

## Izvedba R2.1 — 15. 11. 2026

- Revizija 1 je prvih osem gesel prisilila v osem posameznih smeri. Revizija 2 na vsakem koraku ohrani do pet najbolje ocenjenih delnih postavitev. Ocena upošteva prekrivanja, porazdelitev po kvadrantih in pogostost smeri. Generator primerja dve iskanji z različnima naboroma besed ter lahko ponovi krog do štirikrat. Pred prikazom preveri enoličnost vsake besede v vseh osmih smereh. Če noben kandidat ne uspe, trenutna uganka ostane nespremenjena.
- ID novih ugank vsebuje `r2`. Generator, prednastavitve, vrstni red smeri in besedni nabor za `r1` so del zapisa prvotnih ugank. Sprememba podatkov ali pravil, ki spremeni postavitev iz istega semena, zahteva novo revizijo.
- Aktivne stopnje so Začetna, Lahka in Srednja. Prva uporablja desno in dol, druga doda diagonali navzdol, tretja doda tudi obratne smeri. Pragovi in ciljna križanja so v [zahtevah za igre](02_GAME_REQUIREMENTS.md). Zahtevnost še čaka na igralni preizkus.
- Profil je pod naslovnico. Zelen uspeh, rdeča napaka in oranžen namig imajo tudi besedni status; seznam najdenih besed vključuje kljukico.

## Izvedba R3 — Naloga 06

- Labirint uporablja determinističen Growing Tree revizije 1 in neodvisni izbiri velikosti in težavnosti. Obstoječ recept za obnovo mora ostati dostopen ob uvedbi prihodnje revizije.
- Osmosmerka in Labirint imata skupne akcije nad mrežo in uporabljata iste potrditvene in čestitne dialoge. Labirint uporablja ločeno lokalno shrambo.
- GitHub Pages je predviden pod `/svet-ugank/`. Po preverjenih testih Codex pripravi commit, običajen push razvojne veje in Draft PR. Po potrjeni združitvi lahko GitHub Actions objavi iz `main`, ko lastnik vključi Pages. Nastavitve in koraki so v [09_GITHUB_SETUP.md](09_GITHUB_SETUP.md).

## Predlog R3.1 – mobilna uporabnost in nastavitve
- Osnovni Labirint na telefonu prikazuje celotno mrežo; povečava je namerna dodatna možnost. Ker so velika polja v pregledu fizično premajhna za dotik, mora biti mogoče premikanje s smernim potegom kjerkoli po mreži in s smernimi gumbi. Rešitev mora biti vidna kot celota in izrazito označena.
- V vseh igrah so nastavitve nad mrežo; gumb »Vse igre« je desno od naslova in ni podvojene povezave »Domov«. Značka stanja stoji desno od podnaslova.
- Nova Osmosmerka ima neodvisno velikost, težavnost, dovoljene smeri ter količino besed; spremembe se uveljavijo šele ob »Nova uganka«. Obstoječi shranjeni primeri brez dodatnih nastavitev ohranijo stare algoritme in ID-je. Teme besed kasneje.

## Potrjeno 17. 11. 2026 — R4

- Lastnik je potrdil začetne zaslone z nastavitvami, izrecen zagon, ločeno nadaljevanje in zamenjavo nedokončane uganke po potrditvi. Med igranjem je prikazana samo izbrana igra z navodili in dejanji.
- Osmosmerka in Labirint sta ponovno izvedena. Križanka in Sudoku ostajata DEMO. »Križec-krožec«, »Štiri v vrsto« in »Zračni hokej« so pasivne napovedi v katalogu.
- Lokalni vzdevek, časi in zgodovina osebnih rezultatov so za to fazo odstranjeni iz vmesnika in shranjevanja. Stari ključi ostanejo v brskalniku. R4 prenese temo, vodi nove seje pod ločenimi ključi in ob nezdružljivi stari uganki ponudi nov začetek. O profilih in računih se lahko znova odloča kasneje.
- Ogled rešitve je začasen in ohrani napredek. Čestitka ob dokončanju ostane.
- R4 se preda kot Draft PR iz nove veje na osnovi osveženega main. PR #6 ostane ločen, pregled in morebitno združitev izvede lastnik.
