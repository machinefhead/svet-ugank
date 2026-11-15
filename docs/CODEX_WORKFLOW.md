# Codex — kdo kaj dela in kako izbiramo model

## Razdelitev dela
- Lastnik: testira igre, potrjuje občutek igranja, vizualno smer in objave.
- ChatGPT koordinator: produktne zahteve, UX koncept, algoritemski kriteriji, kratki Codex briefi, pregled diffov in poročil, projektna dokumentacija.
- Codex: konkretna implementacija HTML/CSS/TS, generatorji, testni primeri, modularizacija in popravki v svoji veji.
- Grafike/ilustracije: najprej likovni koncept in potrjena kompozicija; namensko grafično orodje ali ročno pripravljeni vektorski elementi. Codex grafiko integrira, ne improvizira namesto potrjene ilustracije.

## Model / effort (izberi po nalogi, razpoložljivosti in porabi)
- Kratka, rutinska sprememba: GPT-5.6 Terra · Low.
- Večina implementacij in audit: GPT-5.6 Sol · Medium (privzeto).
- Zahteven generator ali kompleksna integracija: GPT-6.1 Sol · Medium ali High, če je na voljo.
- Težka arhitekturna odločitev ali trdovraten bug: GPT-6 Astra · High, selektivno.

Močnejši model ni avtomatsko boljša izbira. Pred vsakim delom koordinator navede točno priporočilo. Če model v Codexu ni na voljo, izberi najbližjega in to zabeleži.

## Format predaje Codexu
`Model: ... | Razmišljanje: ... | Naloga: ...`
En konkretni cilj, dovoljen obseg, prepovedi, najmanjši smiselni testi, pričakovan diff. Pri daljših navodilih koordinator pripravi popoln TXT za copy/paste.

Spreminjamo eno funkcionalno področje naenkrat. Pregled sprememb pred združitvijo; ni avtomatskega deploya.
