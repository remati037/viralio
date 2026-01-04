// Viral hooks for AI context
// These hooks serve as examples to help AI understand the style and patterns for creating viral hooks
// The AI will use these hooks based on the user's selected category to generate relevant content

export interface ViralHook {
  text: string;
  format?: 'Kratka Forma' | 'Duga Forma';
}

export const VIRAL_HOOKS: ViralHook[] = [
  // Kategorija: Tajne i Ekskluzivnost (Curiosity Gap)
  {
    text: 'Čuvao sam ovu tajnu predugo.',
  },
  {
    text: 'Ovo je bukvalno „ilegalno“ znati.',
  },
  {
    text: 'Nećete verovati šta sam upravo otkrio.',
  },
  {
    text: 'Konačno sam popustio i odlučio da podelim ovo.',
  },
  {
    text: 'Nisam hteo da iko sazna za ovo, ali...',
  },
  {
    text: 'Imam priznanje da vam dam.',
  },
  {
    text: 'Ono što vam niko ne govori o [TEMI].',
  },
  {
    text: 'Otkrivam tajnu koju [INDUSTRIJA] krije od vas.',
  },
  {
    text: 'Našao sam prečicu za koju niko ne zna.',
  },
  {
    text: 'Dozvolite mi da vas uvedem u jednu malu tajnu.',
  },
  {
    text: 'Ovo je jedina stvar koju kriju od nas.',
  },
  {
    text: 'Ne mogu da verujem da ovo delim javno.',
  },
  {
    text: 'Iskopao sam informaciju koja menja sve.',
  },
  {
    text: 'Ovo je razlog zašto neki ljudi uvek uspevaju, a ti ne.',
  },
  {
    text: 'Šapnuću vam nešto što niko drugi neće.',
  },

  // Kategorija: Šok i Zaustavljanje Skrolovanja (Pattern Interrupt)
  {
    text: 'Odmah prestani da radiš [OVO]!',
  },
  {
    text: 'Prekini skrolovanje na sekundu.',
  },
  {
    text: 'Ovo nije vežba, ovo je hitno.',
  },
  {
    text: 'Gledaj do kraja, jer ćeš se šokirati.',
  },
  {
    text: 'Ne kupuj [PROIZVOD] dok ne pogledaš ovaj video.',
  },
  {
    text: 'Ovo će te potpuno ostaviti bez teksta.',
  },
  {
    text: 'Zaboravi sve što si mislio da znaš o [TEMI].',
  },
  {
    text: 'Ovo je tvoj poslednji podsetnik da uradiš [X].',
  },
  {
    text: 'Čekaj, jesi li upravo video ovo?',
  },
  {
    text: 'Većina ljudi greši kod [TEME], evo i kako.',
  },
  {
    text: 'Ovo će ti spaliti mozak!',
  },
  {
    text: 'Najveća laž u koju si ikada poverovao.',
  },
  {
    text: 'Ne paniči, ali moraš ovo da vidiš.',
  },
  {
    text: 'Jedna reč koja će promeniti tvoj dan.',
  },
  {
    text: 'Stop! Radiš ovo na teži način.',
  },

  // Kategorija: Edukacija i Rezultati (Value-Driven)
  {
    text: 'Kako da dobiješ [REZULTAT] za manje od [VREME].',
  },
  {
    text: 'Mojih top 5 trikova za bolji [X].',
  },
  {
    text: 'Ukradi moju strategiju za [X].',
  },
  {
    text: '3 jednostavna koraka do [CILJA].',
  },
  {
    text: 'Kako da nikada više ne ostaneš bez [X].',
  },
  {
    text: 'Besplatan alat koji će ti uštedeti sate rada.',
  },
  {
    text: 'Moj omiljeni način da [X] bez [MUKE].',
  },
  {
    text: 'Šta bih uradio da počinjem od nule.',
  },
  {
    text: '5 stvari koje moraš imati ako želiš [REZULTAT].',
  },
  {
    text: 'Kako sam prešao put od [LOŠE] do [ODLIČNO].',
  },
  {
    text: 'Ova jedna navika mi je promenila život.',
  },
  {
    text: 'Nauči [VEŠTINU] za samo 60 sekundi.',
  },
  {
    text: '7 stvari koje nisi znao da ti trebaju.',
  },
  {
    text: 'Najbrži način da savladaš [TEMU].',
  },
  {
    text: 'Tri saveta koja vrede zlata.',
  },

  // Kategorija: Negativa i Upozorenja (Fear of Loss)
  {
    text: '3 greške koje te koštaju novca/vremena.',
  },
  {
    text: 'Zašto tvoj [X] ne radi? Evo odgovora.',
  },
  {
    text: 'Prekini da trošiš vreme na [X].',
  },
  {
    text: 'Ovo je tvoja najveća prepreka do uspeha.',
  },
  {
    text: 'Nemoj da dopustiš da te prevare sa [TEMOM].',
  },
  {
    text: 'Gorku istinu o [X] niko ne želi da čuje.',
  },
  {
    text: 'Izgubio sam [SUMA/VREME] jer nisam znao ovo.',
  },
  {
    text: 'Tvoj [X] te polako uništava.',
  },
  {
    text: 'Čuvaj se ovih 3 stvari kod [TEME].',
  },
  {
    text: 'Zašto 99% ljudi ne uspeva u [X].',
  },
  {
    text: 'Ovo je razlog zašto tapkaš u mestu.',
  },
  {
    text: 'Nemoj praviti istu grešku kao ja.',
  },
  {
    text: 'Znakovi da si na pogrešnom putu sa [X].',
  },
  {
    text: 'Ako nastaviš ovako, nikada nećeš stići do cilja.',
  },
  {
    text: 'Šta tvoj [X] zapravo krije od tebe.',
  },

  // Kategorija: Pitanja i Angažovanje (Engagement)
  {
    text: 'Da li ste se ikada pitali zašto [X]?',
  },
  {
    text: 'Jesi li ti osoba A ili osoba B?',
  },
  {
    text: 'Šta bi uradio da imaš [X]?',
  },
  {
    text: 'Da li i ti praviš ovu sramotnu grešku?',
  },
  {
    text: 'Ko još misli da je [X] precenjeno?',
  },
  {
    text: 'Reci mi svoje mišljenje u komentarima.',
  },
  {
    text: 'Da li si spreman da čuješ surovu istinu?',
  },
  {
    text: 'Koliko često zapravo razmišljaš o [TEMI]?',
  },
  {
    text: 'Šta bi bilo kada bih ti rekao da možeš [X]?',
  },
  {
    text: 'Možeš li da pogodiš šta se desilo sledeće?',
  },
  {
    text: 'Da li je ovo najbolji [X] na svetu?',
  },
  {
    text: 'Spusti prst ako si ikada uradio [X].',
  },
  {
    text: 'Pošalji ovo nekome ko uvek [X].',
  },
  {
    text: 'Šta je tvoj najveći problem sa [TEMOM]?',
  },
  {
    text: 'Da li veruješ u [X] ili [Y]?',
  },

  // Kategorija: Trendovi i Autoritet (Authority)
  {
    text: 'Novi trend koji menja sve u 2026. godini.',
  },
  {
    text: 'Svi pričaju o [X], ali niko ne vidi ovo.',
  },
  {
    text: 'Kao ekspert za [X], evo šta ja mislim.',
  },
  {
    text: 'Najbolja investicija koju sam ikada napravio.',
  },
  {
    text: 'Ovo je prognoza za [X] koju moraš znati.',
  },
  {
    text: 'Zaboravi na [STARI NAČIN], ovo je budućnost.',
  },
  {
    text: '5 alata koje svaki [PROFESIJA] mora imati.',
  },
  {
    text: 'Zašto je [X] bolji od bilo čega drugog.',
  },
  {
    text: 'Dokazano je da [X] funkcioniše, evo i kako.',
  },
  {
    text: 'Moj sistem za [X] koji nikada ne omaši.',
  },

  // Kategorija: Emocije i Inspiracija (Relatability)
  {
    text: 'Osećao sam se izgubljeno dok nisam otkrio ovo.',
  },
  {
    text: 'Ovo je video koji bi voleo da sam video ranije.',
  },
  {
    text: 'Ako prolaziš kroz [X], nisi sam.',
  },
  {
    text: 'Veruj mi, zaslužuješ da znaš istinu.',
  },
  {
    text: 'Ovo je podsetnik koji ti je danas bio potreban.',
  },
  {
    text: 'Nikada ne odustaj od [X], a evo i zašto.',
  },
  {
    text: 'Moja transformacija će te inspirisati.',
  },
  {
    text: 'Kako sam vratio kontrolu nad svojim životom.',
  },
  {
    text: 'Mali korak koji je napravio ogromnu razliku.',
  },
  {
    text: 'Danas biraš da budeš bolja verzija sebe.',
  },

  // Kategorija: Kratki i Ubitačni (Fast Hooks)
  {
    text: 'Ovo menja sve.',
  },
  {
    text: 'Genijalno ili ludo? Ti odluči.',
  },
  {
    text: 'Rezultati govore sami za sebe.',
  },
  {
    text: 'Bukvalno nemam reči.',
  },
];

/**
 * Get all viral hooks (no filtering - all hooks are available)
 * @param limit - Maximum number of hooks to return (default: all hooks)
 * @returns Array of hooks
 */
export function getAllHooks(limit?: number): ViralHook[] {
  return limit ? VIRAL_HOOKS.slice(0, limit) : VIRAL_HOOKS;
}

/**
 * Format hooks for AI context
 * @param hooks - Array of hooks to format
 * @returns Formatted string for AI prompt
 */
export function formatHooksForAI(hooks: ViralHook[]): string {
  if (hooks.length === 0) return '';

  return hooks
    .map((hook, index) => `${index + 1}. ${hook.text}`)
    .join('\n');
}

