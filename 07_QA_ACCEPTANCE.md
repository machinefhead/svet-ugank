# 07 — QA in sprejemna merila

- Vsaka objavljena uganka ima veljavno rešitev; sudoku zahteva enoličnost.
- Generatorji: deterministični testi po semenih in več deset/stotine primerov na težavnost, če je relevantno.
- Vsaka težavnost pomeni merljivo razliko, ne samo velikosti mreže.
- Osmosmerka: vseh 8 smeri, slovenski znaki in pravilno označevanje najdenih besed.
- Križanka: pravilna križanja, v mrežo vgrajeni opisi/puščice, pregledana slovenska besedila.
- Labirint: dosegljiv cilj in raznolike dolge/zavite poti; premikanje brez izgube stanja.
- Sprememba nastavitev brez »Nova uganka« ne sme spremeniti trenutne mreže.
- Celotna rešitev se nikoli ne pokaže nenamerno; namigi spoštujejo pravila.
- Uspešno reševanje sproži prijeten modal; stanje preživi osvežitev, ko je shranjevanje omogočeno.
- Videz na telefonu in računalniku, svetlo/temno, tipkovnica in dotik.
- Offline delovanje preizkusiti brez omrežja na resničnem telefonu pred javno trditvijo, da deluje.

Codex za posamezno nalogo zažene **ciljne teste + najmanjši smiselni regresijski smoke**. Poroča dejanski rezultat; brez izmišljanja PASS ali objav. Lastnik potrdi rezultat.
