import type { TaskInsert } from '@/types'

export const MOCK_CASE_STUDIES: Omit<TaskInsert, 'user_id'>[] = [
  {
    title: 'Kako sam postigao 1M pregleda sa jednim Reel-om',
    niche: 'Marketing',
    format: 'Kratka Forma',
    hook: 'Svi vam govore da treba da objavljujete svaki dan. Ali ja sam postigao 1M pregleda sa samo jednim Reel-om. Evo kako...',
    body: 'Ključ je bio u kombinaciji tri stvari:\n\n1. <strong>Hook u prve 3 sekunde</strong> - Rekao sam tačan broj (1M) što je odmah privuklo pažnju\n\n2. <strong>Kontroverzna izjava</strong> - "Samo jedan Reel" je suprotno od svega što svi govore\n\n3. <strong>Vrednost od početka</strong> - Odmah sam dao konkretan savet, ne samo obećanje',
    cta: 'Spremite ovaj Reel i pratite me za još taktika koje rade!',
    status: 'published',
    publish_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    original_template: 'Brojke + Kontroverza (30s Reel)',
    cover_image_url: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=800&h=450&fit=crop',
    result_views: '1.2M',
    result_engagement: '95k lajkova / 2.1k komentara / 8.5k deljenja',
    result_conversions: '12.5k novih pratilaca',
    analysis: `<h3>Zašto je ovaj Reel prošao viralno?</h3>
    
    <p><strong>1. Brojke u naslovu</strong> - "1M pregleda" je konkretan, merljiv rezultat koji privlači pažnju. Ljudi vole brojke jer su objektivne.</p>
    
    <p><strong>2. Kontroverzna izjava</strong> - "Samo jedan Reel" ide protiv konvencionalne mudrosti. To stvara radoznalost i želju da se sazna više.</p>
    
    <p><strong>3. Struktura Hook-Body-CTA</strong> - Svaka sekcija je jasno definisana i vodi gledaoca kroz priču.</p>
    
    <p><strong>4. Vrednost od početka</strong> - Nisam čekao do kraja da dam vrednost. Odmah sam podelio konkretne taktike.</p>
    
    <p><strong>5. Poziv na akciju</strong> - CTA je jasan i lako izvodljiv ("Spremite ovaj Reel").</p>
    
    <h3>Ključne lekcije:</h3>
    <ul>
      <li>Koristite konkretne brojke u hook-u</li>
      <li>Budite kontroverzni, ali autentični</li>
      <li>Dajte vrednost od prve sekunde</li>
      <li>Koristite vizuelne elemente (tekst na ekranu) za bolje zadržavanje</li>
    </ul>`,
  },
  {
    title: 'Iza Scene: Kako sam napravio $50k u 30 dana sa YouTube kanalom',
    niche: 'Marketing',
    format: 'Duga Forma',
    hook: 'UVOD: U prve 3 sekunde kaži zašto bi trebalo da ostanu do kraja.\n\nGLAVNA TEMA 1: Nije sve išlo glatko. Prva nedelja je bila katastrofa - samo 47 pregleda. Ali onda sam primenio ovu jednu strategiju...\n\nGLAVNA TEMA 2: Detaljna analiza kako sam optimizovao thumbnails, naslove i strukturu videa. Konkretni primeri i brojke.\n\nZAKLJUČAK: Ne treba vam milionska publika da zaradite. Treba vam prava strategija.',
    body: 'CEO TEKST se nalazi u Hook/Skripta polju u detaljima.',
    cta: 'Duga Forma: Nema odvojenog CTA za Kanban.',
    status: 'published',
    publish_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days ago
    original_template: 'Iza Scene: Brojke (YouTube Video)',
    cover_image_url: 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&h=450&fit=crop',
    result_views: '850k',
    result_engagement: '42k lajkova / 1.8k komentara / 3.2k deljenja',
    result_conversions: '15k novih pretplatnika / 320 prodaja kursa',
    analysis: `<h3>Zašto je ovaj video prošao viralno?</h3>
    
    <p><strong>1. Transparentnost i autentičnost</strong> - Podelio sam sirove brojke i realne izazove. Gledaoci su cenili iskrenost.</p>
    
    <p><strong>2. Konkretni rezultati</strong> - "$50k u 30 dana" je merljiv, impresivan rezultat koji privlači pažnju.</p>
    
    <p><strong>3. Struktura priče</strong> - Počeo sam sa propašću (47 pregleda), što je stvorilo napetost i radoznalost.</p>
    
    <p><strong>4. Edukativna vrednost</strong> - Video nije bio samo motivacioni, već je dao konkretne taktike koje gledaoci mogu primeniti.</p>
    
    <p><strong>5. Optimizacija za algoritam</strong> - Thumbnail sa brojem ($50k), naslov sa brojem, i dobra retencija (65% do kraja).</p>
    
    <h3>Ključne lekcije:</h3>
    <ul>
      <li>Transparentnost privlači pažnju - podelite i propasti i uspehe</li>
      <li>Koristite konkretne brojke u naslovu i thumbnail-u</li>
      <li>Struktura priče (problem → rešenje → rezultat) radi odlično</li>
      <li>Edukativni sadržaj sa konkretnim primerima ima bolju retenciju</li>
      <li>CTA na kraju videa je ključan za konverzije</li>
    </ul>`,
  },
  {
    title: '3 Alata koja su mi uštedela 20 sati nedeljno',
    niche: 'Marketing',
    format: 'Kratka Forma',
    hook: 'Ako još uvek ručno pišete svaki post, gubite vreme. Evo 3 alata koja su mi uštedela 20 sati nedeljno...',
    body: '<strong>1. ChatGPT za ideje</strong> - Generiše 50 ideja za sadržaj za 2 minuta umesto 2 sata\n\n<strong>2. Canva Templates</strong> - Pre-made template-i za brzo kreiranje vizuelnog sadržaja\n\n<strong>3. Buffer za scheduling</strong> - Planiranje svih postova za celu nedelju odjednom',
    cta: 'Komentarišite "DA" ako želite da vidite kako koristim svaki alat detaljno!',
    status: 'published',
    publish_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    original_template: 'Lista + Vrednost (30s Reel)',
    cover_image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=450&fit=crop',
    result_views: '450k',
    result_engagement: '28k lajkova / 890 komentara / 1.2k deljenja',
    result_conversions: '6.8k novih pratilaca / 150 klikova na link u bio',
    analysis: `<h3>Zašto je ovaj Reel prošao viralno?</h3>
    
    <p><strong>1. Konkretna vrednost u naslovu</strong> - "20 sati nedeljno" je merljiva korist koja odmah privlači pažnju.</p>
    
    <p><strong>2. Format liste</strong> - "3 alata" je lako za praćenje i deljenje. Ljudi vole liste jer su skenabilne.</p>
    
    <p><strong>3. Rešava pravi problem</strong> - Svi content kreatori se bore sa vremenom. Ovaj Reel direktno rešava taj problem.</p>
    
    <p><strong>4. Konkretni primeri</strong> - Nisam samo spomenuo alate, već sam dao konkretne primere kako ih koristim.</p>
    
    <p><strong>5. Interaktivni CTA</strong> - CTA koji traži komentar ("DA") povećava engagement i signalizira algoritmu da je sadržaj vredan.</p>
    
    <h3>Ključne lekcije:</h3>
    <ul>
      <li>Koristite konkretne brojke i merljive rezultate</li>
      <li>Format liste je uvek dobar za engagement</li>
      <li>Rešavajte prave probleme vaše publike</li>
      <li>Interaktivni CTA (komentari) povećava reach</li>
      <li>Vizuelni elementi (brojevi na ekranu) poboljšavaju retenciju</li>
    </ul>`,
  },
]

export async function seedMockCaseStudies(userId: string, supabase: any) {
  const tasksToInsert = MOCK_CASE_STUDIES.map((task) => ({
    ...task,
    user_id: userId,
  }))

  const { data, error } = await supabase.from('tasks').insert(tasksToInsert).select()

  if (error) {
    console.error('Error seeding mock case studies:', error)
    return { data: null, error }
  }

  return { data, error: null }
}

