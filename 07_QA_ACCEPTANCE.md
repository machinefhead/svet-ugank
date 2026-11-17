# 07 — QA in sprejemna merila

**Opomba 17. 11. 2026:** Spodnji igralni kriteriji so zgodovinski oziroma prihodnji. Osmosmerka in Labirint sta trenutno odstranjena iz razvojne veje R4 do novih navodil. Testi teh izvedb niso več del aktivne kode; preverjamo le skupno ogrodje in temo.

- Vsaka objavljena uganka ima veljavno rešitev; sudoku zahteva enoličnost.
- Generatorji: deterministični testi po semenih in več deset/stotine primerov na težavnost, če je relevantno.
- Vsaka težavnost pomeni merljivo razliko, ne samo velikosti mreže.
- Osmosmerka: vseh 8 smeri, slovenski znaki in pravilno označevanje najdenih besed.
- Križanka: pravilna križanja, v mrežo vgrajeni opisi/puščice, pregledana slovenska besedila.
- Labirint: dosegljiv cilj in raznolike dolge/zavite poti; premikanje brez izgube stanja.
- Pot od kataloga vodi najprej na nastavitve brez mreže. Preveri »Začni igro«, »Nova uganka«, preklic zamenjave, »Nadaljuj«, osvežitev ter brskalnikova Nazaj in Naprej. Štiri nastavitve Osmosmerke »Po meri« morajo ostati neodvisne.
- Stara tema se prenese. Stari seji dobita obvestilo, stari zapisi vzdevkov in rezultatov pa ostanejo v izvirnih ključih. Dokončanje shranjuje zgolj stanje trenutne igre.
- Celotna rešitev se nikoli ne pokaže nenamerno; namigi spoštujejo pravila.
- Uspešno reševanje sproži prijeten modal; stanje preživi osvežitev, ko je shranjevanje omogočeno.
- Na mobilnem pogledu preveri celotno širino 12 × 12 in 61 × 61, pomik strani po mreži črk in dva dotika. Na palici preveri mrtvo območje, držanje, steno, odmik prsta, preklic dotika in izgubo fokusa. Ločeno preveri tipkovnico, miško in svetlo, temno ter sistemsko temo.
- Na fizičnem Samsung/Android telefonu preveri drsenje v brskalniku, dosegljivost palice, berljivost največjih mrež in odziv po preklopu iz zavihka.
- Offline delovanje preizkusiti brez omrežja na resničnem telefonu pred javno trditvijo, da deluje.

Codex za posamezno nalogo zažene **ciljne teste + najmanjši smiselni regresijski smoke**. Poroča dejanski rezultat; brez izmišljanja PASS ali objav. Lastnik potrdi rezultat.

## Pet minut na Samsung/Android telefonu

1. Odpri lokalni predogled veje R4. Z naslovnice pojdi v katalog, preveri obe skupini kartic in odpri Osmosmerko.
2. Izberi »Po meri«, 12 × 12, osem smeri in 12 besed. Začni igro, povleci navzgor čez mrežo in z dvema dotikoma označi eno besedo. Preveri kljukico, namig in potrjen ogled rešitve.
3. Pritisni »Nova uganka«, spremeni nastavitev in prekliči zamenjavo. Osveži stran in izberi »Nadaljuj«. Preveri isto mrežo in najdeno besedo.
4. Odpri Labirint 61 × 61. Drži palico v smeri odprtega hodnika do stene, spusti jo in nato med držanjem za trenutek zamenjaj zavihek. Preveri, da se položaj ustavi in po vrnitvi ostane isti.
5. Pokaži in skrij rešitev. Preveri nespremenjen položaj, celotno širino mreže in berljivost smernih gumbov. Pri manjši mreži dosezi cilj in preveri čestitko.
