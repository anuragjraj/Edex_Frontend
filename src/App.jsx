/**
 * BrainSpark AI — Frontend v5.0
 * Complete merged app with all features
 *
 * REQUIRES in .env:
 *   VITE_API_URL=https://your-backend.onrender.com
 *   VITE_GOOGLE_CLIENT_ID=...
 *   VITE_MICROSOFT_CLIENT_ID=...
 *   VITE_RAZORPAY_KEY_ID=rzp_live_...
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import TalkingBuddy from './TalkingBuddy'

// ══════════════════════════════════════════════════════════════
//  FONT + STYLE INJECTION
// ══════════════════════════════════════════════════════════════
function useFonts() {
  useEffect(() => {
    if (!document.getElementById('brainspark-fonts')) {
      const link = document.createElement('link')
      link.id   = 'brainspark-fonts'
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800;900&display=swap'
      link.rel  = 'stylesheet'
      document.head.appendChild(link)
    }
    if (!document.getElementById('brainspark-styles')) {
      const style = document.createElement('style')
      style.id = 'brainspark-styles'
      style.textContent = `
        /* ── Design tokens ── */
        :root {
          --bg: #f4f4f0; --bg2: #ffffff; --text: #64748b; --text-h: #1e293b;
          --border: rgba(15,23,42,.10); --accent: #4f46e5;
          --accent-bg: rgba(79,70,229,.08); --accent-border: rgba(79,70,229,.20);
          --code-bg: rgba(15,23,42,.035); --social-bg: rgba(15,23,42,.035);
          --shadow-md: 0 4px 16px rgba(15,23,42,.07);
          /* How tall the bottom nav is — used for padding-bottom */
          --nav-h: 0px;
        }
        [data-theme="dark"] {
          --bg: #0d0d1a;
          --bg2: #161628;
          --text: #8892a4;
          --text-h: #dde1f0;
          --border: rgba(255,255,255,.09);
          --accent: #818cf8;
          --accent-bg: rgba(129,140,248,.13);
          --accent-border: rgba(129,140,248,.28);
          --code-bg: rgba(255,255,255,.055);
          --social-bg: rgba(255,255,255,.055);
          --shadow-md: 0 4px 20px rgba(0,0,0,.45);
        }
        @media (max-width: 768px) { :root { --nav-h: 64px; } }
 
        /* ── Reset ── */
        * { box-sizing: border-box; -webkit-tap-highlight-color: transparent; }
        html, body { overflow-x: clip; max-width: 100%; }
        body { margin: 0; background: transparent; color: var(--text-h); }
 
        /* ── Remove 300 ms tap delay everywhere ── */
        button, a, [role="button"], label { touch-action: manipulation; }
 
        /* ── Animations ── */
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes dotBounce { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        @keyframes bsSheetIn { from{transform:translateY(100%);opacity:.5} to{transform:translateY(0);opacity:1} }
        @keyframes bsFadeIn  { from{opacity:0} to{opacity:1} }
 
        .brainspark-font { font-family: 'Nunito', system-ui, sans-serif; }
 
        /* ── Sidebar / old mobile nav visibility ── */
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
        /* mobile-top-nav is no longer rendered; keep this in case anything references it */
        .mobile-top-nav { display: none !important; }
 
        /* ═══════════════════════════════════════════════
           BOTTOM NAV BAR
        ═══════════════════════════════════════════════ */
        .bs-bottom-nav {
          display: none;           /* hidden on desktop */
          position: fixed;
          bottom: 0; left: 0; right: 0;
          z-index: 200;
          background: rgba(255,255,255,.97);
          backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
          border-top: 1px solid var(--border);
          /* respect iPhone notch / home indicator */
          padding-bottom: env(safe-area-inset-bottom, 0px);
          box-shadow: 0 -2px 18px rgba(15,23,42,.07);
        }
        @media (max-width: 768px) { .bs-bottom-nav { display: block; } }
 
        /* ═══════════════════════════════════════════════
           MAIN CONTENT — push up so bottom nav doesn't cover last item
        ═══════════════════════════════════════════════ */
        @media (max-width: 768px) {
          .bs-main {
            padding-bottom: calc(var(--nav-h) + env(safe-area-inset-bottom, 0px) + 16px) !important;
          }
        }
 
        /* ═══════════════════════════════════════════════
           BOTTOM SHEET (More menu, confirmations, etc.)
        ═══════════════════════════════════════════════ */
        .bs-backdrop {
          position: fixed; inset: 0; z-index: 300;
          background: rgba(0,0,0,.46);
          backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px);
          animation: bsFadeIn .18s ease-out;
        }
        .bs-sheet {
          position: fixed; bottom: 0; left: 0; right: 0; z-index: 301;
          background: #fff;
          border-radius: 22px 22px 0 0;
          padding-bottom: calc(env(safe-area-inset-bottom, 0px) + 8px);
          animation: bsSheetIn .27s cubic-bezier(.32,.72,0,1);
          max-height: 92vh;
          overflow-y: auto; -webkit-overflow-scrolling: touch;
        }
 
        /* ═══════════════════════════════════════════════
           iOS ANTI-ZOOM: inputs must be ≥16 px on iOS,
           otherwise the page zooms in on focus — very jarring
        ═══════════════════════════════════════════════ */
        @media (max-width: 768px) {
          input[type="text"],   input[type="email"],
          input[type="password"], input[type="number"],
          input[type="search"], input[type="date"],
          input[type="datetime-local"], input[type="time"],
          select, textarea { font-size: 16px !important; }
        }
 
        /* ═══════════════════════════════════════════════
           RESPONSIVE GRIDS
        ═══════════════════════════════════════════════ */
        /* Stat chips: 3 across on phones, 6 on wide screens */
        .bs-stats-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 10px;
        }
        @media (min-width: 640px) {
          .bs-stats-grid { grid-template-columns: repeat(6, 1fr); }
        }
 
        /* Quick-start: 2 across on phones → auto-fill on larger */
        .bs-quick-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        @media (min-width: 480px) {
          .bs-quick-grid { grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); }
        }
 
        /* Quiz options: 1 col on phones, 2 on tablets+ */
        .bs-opts-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 9px;
        }
        @media (min-width: 520px) {
          .bs-opts-grid { grid-template-columns: 1fr 1fr; }
        }
 
        /* Generic auto card grid */
        .bs-card-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));
          gap: 14px;
        }
 
        /* ═══════════════════════════════════════════════
           CARD PADDING on small phones
        ═══════════════════════════════════════════════ */
        @media (max-width: 480px) {
          .bs-card { padding: 14px !important; border-radius: 12px !important; }
          .bs-page { padding: 14px !important; }
        }
 
        /* ═══════════════════════════════════════════════
           SCROLLBAR — thin and unobtrusive
        ═══════════════════════════════════════════════ */
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(15,23,42,.15); border-radius: 2px; }
      `
      document.head.appendChild(style)
    }
  }, [])
}

// ══════════════════════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════════════════════
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000'
const FREE_WINDOW = 600 // 10 minutes in seconds

const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7',
  'Class 8','Class 9','Class 10','Class 11','Class 12']

const SUBJECTS = ['Mathematics','Science','Physics','Chemistry','Biology','English','Hindi',
  'Social Science','History','Geography','Civics','Economics','Computer Science','Sanskrit',
  'Environmental Science','EVS','Accountancy','Business Studies']

const ALL_CHAPTERS = {
  "Class 1": {
    "English":     ["The Bubble, the Straw and the Shoe","Three Little Pigs","After a Bath","The Balloon Man","One Little Kitten","Lalu and Peelu","Clouds","Anandi's Rainbow","Flying-man","The Tiger and the Mosquito","Paheli","A Kite"],
    "Mathematics": ["Shapes and Space","Numbers from One to Nine","Addition","Subtraction","Numbers from Ten to Twenty","Time","Measurement","Numbers from Twenty-one to Fifty","Data Handling","Patterns","Numbers","Money","How Many"],
    "Hindi":       ["झूला","आम की कहानी","आम की टोकरी","पत्ते ही पत्ते","पकौड़ी","छुक-छुक गाड़ी","रसोईघर","चूहो! म्याऊँ सो रही है","बंदर और गिलहरी","पगड़ी","पतंग","गेंद-बल्ला","बंदर गया खेत में भाग"],
    "EVS":         ["My Body","Plants Around Us","Animals Around Us","My Family","Our Food","Seasons","Water","Our Helper","My School","My Neighbourhood"],
  },
  "Class 2": {
    "English":     ["First Day at School","Haldi's Adventure","I am Lucky!","I Want","A Smile","The Wind and the Sun","Rain","Storm in the Garden","Funny Bunny","Zoo Manners","Curlylocks and the Three Bears","Mr Nobody","Granny Granny Please Comb my Hair","The Magic Porridge Pot","Strange Talk","The Grasshopper and the Ant","Hot Like Fire","Going to the Fair"],
    "Mathematics": ["What is Long, What is Round?","Counting in Groups","How Much Can You Carry?","Counting in Tens","Patterns","Footprints","Jugs and Mugs","Tens and Ones","My Funday","Add our Points","Lines and Lines","Give and Take","The Longest Step","Birds Come, Birds Go","How Many Ponytails?"],
    "Hindi":       ["ऊँट चला","भालू ने खेली फुटबॉल","म्याऊँ म्याऊँ","अधिक बलवान कौन?","दोस्त की मदद","बहुत हुआ","मेरी किताब","तितली और कली","बुलबुल","मीठी सारंगी","टेसू राजा बीच बाजार","बोलने वाली गुफा","सूरज जल्दी आना जी"],
    "EVS":         ["Plants","Animals","My Family and Friends","Shelter","Water","Travel","Human Body","Food","Festivals","Games We Play","Safety and First Aid"],
  },
  "Class 3": {
    "English":     ["Colours","Badal and Moti","Best Friends","Out in the Garden","Talking Toys","Paper Boats","The Big Laddoo","Thank God","Madhu's Wish","Night","Chanda Mama Counts the Stars","Chandrayaan"],
    "Mathematics": ["What's in a Name?","Toy Joy","Double Century","Vacation with My Nani Maa","Fun with Shapes","House of Hundreds – I","Raksha Bandhan","Fair Share","House of Hundreds – II","Fun at Class Party","Filling and Lifting","Give and Take","Time Goes On","The Surajkund Fair"],
    "Hindi":       ["सीखो","चींटी","कितने पैर?","बया हमारी चिड़िया रानी!","आम का पेड़","बीरबल की खिचड़ी","मित्र को पत्र","चतुर गीदड़","प्रकृति पर्व – फूलदेई","रस्साकशी","एक जादुई पिटारा","अपना-अपना काम","पेड़ों की अम्मा 'थिमक्का'","किसान की होशियारी","भारत","चंद्रयान","बोलने वाली माँद","हम अनेक किंतु एक"],
    "EVS":         ["Family and Friends","Going to the Mela","Celebrating Festivals","Getting to Know Plants","Plants and Animals Live Together","Living in Harmony","Water — A Precious Gift","Food We Eat","Staying Healthy and Happy","This World of Things","Making Things","Taking Charge of Waste"],
  },
  "Class 4": {
    "English":     ["Together We Can","The Tinkling Bells","Be Smart, Be Safe","One Thing at a Time","The Old Stag","Braille","Fit Body, Fit Mind, Fit Nation","The Lagori Champions","Hekko","The Swing","A Journey to the Magical Mountains","Maheshwar"],
    "Mathematics": ["Shapes Around Us","Hide and Seek","Pattern Around Us","Thousands Around Us","Sharing and Measuring","Measuring Length","The Cleanest Village","Weigh it, Pour it","Equal Groups","Elephants, Tigers and Leopards","Fun with Symmetry","Ticking Clocks and Turning Calendar","The Transport Museum","Data Handling"],
    "Hindi":       ["चिड़िया का गीत","बगीचे का घोंघा","नीम","हमारा आहार","आसमान गिरा","जयपुर से पत्र","नकली हीरे","ओणम के रंग","मिठाइयों का सम्मेलन","कैमरा","कविता का कमाल","शतरंज में मात","हमारा आदित्य"],
    "EVS":         ["Living Together","Exploring Our Neighbourhood","Nature Trail","Growing up with Nature","Food for Health","Happy and Healthy Living","How Things Work","How Things are Made","Different Lands, Different Lives","Our Sky"],
  },
  "Class 5": {
    "English":     ["Papa's Spectacles","Gone with the Scooter","The Rainbow","The Wise Parrot","The Frog","What a Tank!","Gilli Danda","The Decision of the Panchayat","Vocation","Glass Bangles"],
    "Mathematics": ["We the Travellers — I","Fractions","Angles as Turns","We the Travellers — II","Far and Near","The Dairy Farm","Shapes and Patterns","Weight and Capacity","Coconut Farm","Symmetrical Designs","Grandmother's Quilt","Racing Seconds","Animal Jumps","Maps and Locations","Data Through Pictures"],
    "Hindi":       ["किरन","न्याय की कुर्सी","चाँद का कुर्ता","साङकेन","सुंदरिया","चतुर चित्रकार","मेरा बचपन","काजीरंगा राष्ट्रीय उद्यान की यात्रा","न्याय","तीन मछलियाँ","हमारे ये कलामंदिर","गंगा की कहानी"],
    "EVS":         ["Water – The Essence of Life","Journey of a River","The Mystery of Food","Our School – A Happy Place","Our Vibrant Country","Some Unique Places","Energy – How Things Work","Clothes – How Things are Made","Rhythms of Nature","Earth – Our Shared Home"],
  },
  "Class 6": {
    "Mathematics":    ["Patterns in Mathematics","Lines and Angles","Number Play","Data Handling and Presentation","Prime Time","Perimeter and Area","Fractions","Playing with Constructions","Symmetry","The Other Side of Zero"],
    "Science":        ["The Wonderful World of Science","Diversity in the Living World","Mindful Eating: A Path to a Healthy Body","Exploring Magnets","Measurement of Length and Motion","Materials Around Us","Temperature and its Measurement","A Journey through States of Water","Methods of Separation in Everyday Life","Living Creatures: Exploring their Characteristics","Nature's Treasures","Beyond Earth"],
    "English":        ["A Bottle of Dew","The Raven and the Fox","Rama to the Rescue","The Unlikely Best Friends","A Friend's Prayer","The Chair","Neem Baba","What a Bird Thought","Spices that Heal Us","Change of Heart","The Winner","Yoga — A Way of Life","Hamara Bharat — Incredible India!","The Kites","Ila Sachani: Embroidering Dreams with her Feet","National War Memorial"],
    "Hindi":          ["मातृभूमि","गोल","पहली बूँद","हार की जीत","रहीम के दोहे","मेरी माँ","जलाते चलो","सत्रिया और बिहू नृत्य","मैया मैं नहिं माखन खायो","परीक्षा","चेतक की वीरता","हिंद महासागर में छोटा-सा हिंदुस्तान","पेड़ की बात"],
    "Sanskrit":       ["वयं वर्णमालां पठामः","एषः कः? एषा का? एतत् किम्?","अहं च त्वं च","अहं प्रातः उत्तिष्ठामि","शूराः वयं धीराः वयम्","सः एव महान् चित्रकारः","अतिथिदेवो भव","बुद्धिः सर्वार्थसाधिका","यो जानाति सः पण्डितः","त्वम् आपणं गच्छ","पृथिव्यां त्रीणि रत्नानि","आलस्यं हि मनुष्याणां शरीरस्थो महान् रिपुः","सङ्ख्यागणना ननु सरला","माधवस्य प्रियम् अङ्गम्","वृक्षाः सत्पुरुषाः इव"],
    "Social Science": ["Locating Places on the Earth","Oceans and Continents","Landforms and Life","Timeline and Sources of History","India, That Is Bharat","The Beginnings of Indian Civilisation","India's Cultural Roots","Unity in Diversity, or 'Many in the One'","Family and Community","Grassroots Democracy — Part 1: Governance","Grassroots Democracy — Part 2: Local Government in Rural Areas","Grassroots Democracy — Part 3: Local Government in Urban Areas","The Value of Work","Economic Activities Around Us"],
  },
  "Class 7": {
    "Mathematics":    ["Large Numbers Around Us","Arithmetic Expressions","A Peek Beyond the Point","Expressions using Letter-Numbers","Parallel and Intersecting Lines","Number Play","A Tale of Three Intersecting Lines","Working with Fractions","Geometric Twins","Operations with Integers","Finding Common Ground","Another Peek Beyond the Point","Connecting the Dots","Constructions and Tilings","Finding the Unknown"],
    "Science":        ["The Ever-Evolving World of Science","Exploring Substances: Acidic, Basic, and Neutral","Electricity: Circuits and their Components","The World of Metals and Non-metals","Changes Around Us: Physical and Chemical","Adolescence: A Stage of Growth and Change","Heat Transfer in Nature","Measurement of Time and Motion","Life Processes in Animals","Life Processes in Plants","Light: Shadows and Reflections","Earth, Moon, and the Sun"],
    "English":        ["The Day the River Spoke","Try Again","Three Days to See","Animals, Birds and Dr. Dolittle","A Funny Man","Say the Right Thing","My Brother's Great Invention","Paper Boats","North, South, East, West","The Tunnel","Travel","Conquering the Summit","A Homage to Our Brave Soldiers","My Dear Soldiers","Rani Abbakka"],
    "Hindi":          ["माँ, कह एक कहानी","तीन बुद्धिमान","फूल और काँटा","पानी रे पानी","नहीं होना बीमार","गिरिधर कविराय की कुण्डलिया","वर्षा-बहार","बिरजू महाराज से साक्षात्कार","चिड़िया","मीरा के पद"],
    "Social Science": ["Geographical Diversity of India","Understanding the Weather","Climates of India","New Beginnings: Cities and States","The Rise of Empires","The Age of Reorganisation","The Gupta Era: An Age of Tireless Creativity","How the Land Becomes Sacred","From the Rulers to the Ruled: Types of Governments","The Constitution of India — An Introduction","From Barter to Money","Understanding Markets","The Story of Indian Farming","India and Her Neighbours","Empires and Kingdoms: 6th to 10th Centuries","Turning Tides: 11th and 12th Centuries","India, A Home to Many","The State, the Government, and You","Infrastructure: Engine of India's Development","Banks and the Magic of Finance"],
  },
  "Class 8": {
    "Mathematics":    ["A Square and A Cube","Power Play","A Story of Numbers","Quadrilaterals","Number Play","We Distribute, Yet Things Multiply","Proportional Reasoning-1","Fractions in Disguise","The Baudhayana-Pythagoras Theorem","Proportional Reasoning-2","Exploring Some Geometric Themes","Tales by Dots and Lines","Algebra Play","Area"],
    "Science":        ["Exploring the Investigative World of Science","The Invisible Living World: Beyond Our Naked Eye","Health: The Ultimate Treasure","Electricity: Magnetic and Heating Effects","Exploring Forces","Pressure, Winds, Storms and Cyclones","Particulate Nature of Matter","Nature of Matter: Elements, Compounds and Mixtures","The Amazing World of Solutes, Solvents and Solutions","Light: Mirrors and Lenses","Keeping Time with the Skies","How Nature Works in Harmony","Our Home: Earth, a Unique Life Sustaining Planet"],
    "English":        ["The Wit that Won Hearts","A Concrete Example","Wisdom Paves the Way","A Tale of Valour: Major Somnath Sharma and the Battle of Badgam","Somebody's Mother","Verghese Kurien — I Too Had A Dream","The Case of the Fifth Word","The Magic Brush of Dreams","Spectacular Wonders","The Cherry Tree","Harvest Hymn","Waiting for the Rain","Feathered Friend","Magnifying Glass","Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science"],
    "Hindi":          ["स्वदेश","दो गौरैया","एक आशीर्वाद","हरिद्वार","कबीर के दोहे","एक टोकरी भर मिट्टी","मत बांधो","कदम मिलाकर चलना होगा","मित्रलाभ"],
    "Social Science": ["Natural Resources and Their Use","Reshaping India's Political Map","The Rise of the Marathas","The Colonial Era in India","Universal Franchise and India's Electoral System","The Parliamentary System: Legislature and Executive","Factors of Production"],
  },
  "Class 9": {
    "Mathematics":    ["Number Systems","Polynomials","Coordinate Geometry","Linear Equations in Two Variables","Introduction to Euclid's Geometry","Lines and Angles","Triangles","Quadrilaterals","Circles","Heron's Formula","Surface Areas and Volumes","Statistics"],
    "Science":        ["Matter in Our Surroundings","Is Matter Around Us Pure?","Atoms and Molecules","Structure of the Atom","The Fundamental Unit of Life","Tissues","Motion","Force and Laws of Motion","Gravitation","Work and Energy","Sound","Why Do We Fall Ill?","Natural Resources","Improvement in Food Resources"],
    "English":        ["The Fun They Had","The Sound of Music","The Little Girl","A Truly Beautiful Mind","The Snake and the Mirror","My Childhood","Packing","Reach for the Top","The Bond of Love","Kathmandu","If I Were You","The Road Not Taken","Wind","Rain on the Roof","The Lake Isle of Innisfree","A Legend of the Northland","No Men are Foreign","The Duck and the Kangaroo","On Killing a Tree","The Snake Trying","A Slumber Did My Spirit Seal"],
    "Hindi":          ["दो बैलों की कथा","ल्हासा की ओर","उपभोक्तावाद की संस्कृति","साँवले सपनों की याद","नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया","प्रेमचंद के फटे जूते","मेरे बचपन के दिन","एक कुत्ता और एक मैना","इस जल प्रलय में","रैदास के पद","रहीम के दोहे","आदमी नामा","एक फूल की चाह","गीत–अगीत","अग्नि पथ","नए इलाके में","यमराज की दिशा","बच्चे काम पर जा रहे हैं"],
    "Social Science": ["The French Revolution","Socialism in Europe and the Russian Revolution","Nazism and the Rise of Hitler","Forest Society and Colonialism","Pastoralists in the Modern World","India Size and Location","Physical Features of India","Drainage","Climate","Natural Vegetation and Wildlife","Population","What is Democracy? Why Democracy?","Constitutional Design","Electoral Politics","Working of Institutions","Democratic Rights","The Story of Village Palampur","People as Resource","Poverty as a Challenge","Food Security in India"],
  },
  "Class 10": {
    "Mathematics":    ["Real Numbers","Polynomials","Pair of Linear Equations in Two Variables","Quadratic Equations","Arithmetic Progressions","Triangles","Coordinate Geometry","Introduction to Trigonometry","Some Applications of Trigonometry","Circles","Areas Related to Circles","Surface Areas and Volumes","Statistics","Probability"],
    "Science":        ["Chemical Reactions and Equations","Acids, Bases and Salts","Metals and Non-Metals","Carbon and its Compounds","Life Processes","Control and Coordination","How Do Organisms Reproduce?","Heredity","Light – Reflection and Refraction","Human Eye and the Colourful World","Electricity","Magnetic Effects of Electric Current","Our Environment"],
    "English":        ["A Letter to God","Nelson Mandela: Long Walk to Freedom","Two Stories about Flying","From the Diary of Anne Frank","Glimpses of India","Mijbil the Otter","Madam Rides the Bus","The Sermon at Benares","The Proposal","A Triumph of Surgery","The Thief's Story","The Midnight Visitor","A Question of Trust","Footprints without Feet","The Making of a Scientist","The Necklace","Bholi","The Book That Saved the Earth","Dust of Snow","Fire and Ice","A Tiger in the Zoo","How to Tell Wild Animals","The Ball Poem","Amanda","The Trees","Fog","The Tale of Custard the Dragon","For Anne Gregory"],
    "Hindi":          ["सूरदास के पद","तुलसीदास की रामभक्ति","देव के सवैये","जयशंकर प्रसाद – आत्मकथ्य","सूर्यकांत त्रिपाठी निराला","नागार्जुन – यह दंतुरित मुस्कान","गिरिजाकुमार माथुर","ऋतुराज","मंगलेश डबराल","नेताजी का चश्मा","बालगोबिन भगत","लखनवी अंदाज़","मानवीय करुणा की दिव्य चमक","एक कहानी यह भी","स्त्री शिक्षा के विरोधी कुतर्कों का खंडन","नौबतखाने में इबादत","संस्कृति","माता का आँचल","जॉर्ज पंचम की नाक","साना-साना हाथ जोड़ि","एही ठैयाँ झुलनी हेरानी हो रामा!","मैं क्यों लिखता हूँ?"],
    "Social Science": ["The Rise of Nationalism in Europe","Nationalism in India","The Making of a Global World","The Age of Industrialisation","Print Culture and the Modern World","Resources and Development","Forest and Wildlife Resources","Water Resources","Agriculture","Minerals and Energy Resources","Manufacturing Industries","Lifelines of National Economy","Power Sharing","Federalism","Democracy and Diversity","Gender Religion and Caste","Popular Struggles and Movements","Political Parties","Outcomes of Democracy","Challenges to Democracy","Development","Sectors of the Indian Economy","Money and Credit","Globalisation and the Indian Economy","Consumer Rights"],
  },
  "Class 11": {
    "Mathematics":      ["Sets","Relations and Functions","Trigonometric Functions","Complex Numbers and Quadratic Equations","Linear Inequalities","Permutations and Combinations","Binomial Theorem","Sequences and Series","Straight Lines","Conic Sections","Introduction to Three Dimensional Geometry","Limits and Derivatives","Statistics","Probability"],
    "Physics":          ["Physical World","Units and Measurements","Motion in a Straight Line","Motion in a Plane","Laws of Motion","Work Energy and Power","Systems of Particles and Rotational Motion","Gravitation","Mechanical Properties of Solids","Mechanical Properties of Fluids","Thermal Properties of Matter","Thermodynamics","Kinetic Theory","Oscillations","Waves"],
    "Chemistry":        ["Some Basic Concepts of Chemistry","Structure of Atom","Classification of Elements and Periodicity in Properties","Chemical Bonding and Molecular Structure","States of Matter","Thermodynamics","Equilibrium","Redox Reactions","Hydrogen","The s-Block Elements","The p-Block Elements","Organic Chemistry – Some Basic Principles and Techniques","Hydrocarbons","Environmental Chemistry"],
    "Biology":          ["The Living World","Biological Classification","Plant Kingdom","Animal Kingdom","Morphology of Flowering Plants","Anatomy of Flowering Plants","Structural Organisation in Animals","Cell The Unit of Life","Biomolecules","Cell Cycle and Cell Division","Transport in Plants","Mineral Nutrition","Photosynthesis in Higher Plants","Respiration in Plants","Plant Growth and Development","Digestion and Absorption","Breathing and Exchange of Gases","Body Fluids and Circulation","Excretory Products and their Elimination","Locomotion and Movement","Neural Control and Coordination","Chemical Coordination and Integration"],
    "English":          ["The Portrait of a Lady","We're Not Afraid to Die","Discovering Tut: the Saga Continues","Landscape of the Soul","The Ailing Planet: the Green Movement's Role","The Browning Version","The Adventure","Silk Road","A Photograph","The Laburnum Top","The Voice of the Rain","Childhood","Father to Son"],
    "Hindi":            ["हम तौ एक एक करि जाना","संतों देखत जग बौराना","आत्मपरिचय व एक गीत","पतंग","चंपा काले काले अच्छर नहीं चीन्हती","बादल राग","कैमरे में बंद अपाहिज","सहर्ष स्वीकारा है","नमक का दारोगा","मियाँ नसीरुद्दीन","अपू के साथ ढाई साल","विदाई-संभाषण","गलता लोहा","स्पीति में बारिश","रजनी","जामुन का पेड़","भारत माता","आत्मा का ताप"],
    "Accountancy":      ["Introduction to Accounting","Theory Base of Accounting","Recording of Transactions I","Recording of Transactions II","Bank Reconciliation Statement","Trial Balance and Rectification of Errors","Depreciation Provisions and Reserves","Bill of Exchange","Financial Statements I","Financial Statements II","Accounts from Incomplete Records","Applications of Computers in Accounting","Computerised Accounting System"],
    "Economics":        ["Indian Economy on the Eve of Independence","Indian Economy 1950–1990","Liberalisation Privatisation and Globalisation","Poverty","Human Capital Formation in India","Rural Development","Employment: Growth Informalisation and Other Issues","Infrastructure","Environment and Sustainable Development","Comparative Development Experiences","Introduction to Statistics","Collection of Data","Organisation of Data","Presentation of Data","Measures of Central Tendency","Measures of Dispersion","Correlation","Index Numbers","Use of Statistical Tools"],
    "Business Studies": ["Nature and Purpose of Business","Forms of Business Organisation","Private Public and Global Enterprises","Business Services","Emerging Modes of Business","Social Responsibility of Business and Business Ethics","Formation of a Company","Sources of Business Finance","Small Business","Internal Trade","International Business I","International Business II"],
    "Computer Science": ["Computer Overview","Software Concepts","Data Representation","Microprocessor and Memory Concepts","Introduction to Programming","Getting Started with Python","Functions","Strings","Lists","Tuples","Dictionaries","Societal Impacts"],
  },
  "Class 12": {
    "Mathematics":      ["Relations and Functions","Inverse Trigonometric Functions","Matrices","Determinants","Continuity and Differentiability","Application of Derivatives","Integrals","Application of Integrals","Differential Equations","Vector Algebra","Three Dimensional Geometry","Linear Programming","Probability"],
    "Physics":          ["Electric Charges and Fields","Electrostatic Potential and Capacitance","Current Electricity","Moving Charges and Magnetism","Magnetism and Matter","Electromagnetic Induction","Alternating Current","Electromagnetic Waves","Ray Optics and Optical Instruments","Wave Optics","Dual Nature of Radiation and Matter","Atoms","Nuclei","Semiconductor Electronics"],
    "Chemistry":        ["The Solid State","Solutions","Electrochemistry","Chemical Kinetics","Surface Chemistry","General Principles and Processes of Isolation of Elements","The p-Block Elements","The d and f Block Elements","Coordination Compounds","Haloalkanes and Haloarenes","Alcohols Phenols and Ethers","Aldehydes Ketones and Carboxylic Acids","Amines","Biomolecules","Polymers","Chemistry in Everyday Life"],
    "Biology":          ["Reproduction in Organisms","Sexual Reproduction in Flowering Plants","Human Reproduction","Reproductive Health","Principles of Inheritance and Variation","Molecular Basis of Inheritance","Evolution","Human Health and Disease","Strategies for Enhancement in Food Production","Microbes in Human Welfare","Biotechnology: Principles and Processes","Biotechnology and its Applications","Organisms and Populations","Ecosystem","Biodiversity and Conservation","Environmental Issues"],
    "English":          ["The Last Lesson","Lost Spring","Deep Water","The Rattrap","Indigo","Poets and Pancakes","The Interview","Going Places","My Mother at Sixty-six","An Elementary School Classroom in a Slum","Keeping Quiet","A Thing of Beauty","A Roadside Stand","Aunt Jennifer's Tigers","The Tiger King","The Enemy","On the Face of It","Memories of Childhood","The Third Level","Journey to the End of the Earth","Should Wizard Hit Mommy","Evans Tries an O-Level"],
    "Hindi":            ["आत्म-परिचय","दिन जल्दी-जल्दी ढलता है!","पतंग","कविता के बहाने","बात सीधी थी पर","कैमरे में बंद अपाहिज","सहर्ष स्वीकारा है","उषा","बादल राग","छोटा मेरा खेत","बगुलों के पंख","भक्तिन","बाजार दर्शन","काले मेघा पानी दे","पहलवान की ढोलक","चार्ली चैप्लिन यानी हम सब","नमक","शिरीष के फूल","श्रम-विभाजन और जाति-प्रथा","मेरी कल्पना का आदर्श समाज"],
    "Accountancy":      ["Accounting for Not-for-Profit Organisation","Accounting for Partnership: Basic Concepts","Reconstitution of a Partnership Firm – Admission of a Partner","Reconstitution of a Partnership Firm – Retirement/Death of a Partner","Dissolution of Partnership Firm","Accounting for Share Capital","Issue and Redemption of Debentures","Financial Statements of a Company","Analysis of Financial Statements","Accounting Ratios","Cash Flow Statement"],
    "Economics":        ["Introduction to Macroeconomics","National Income Accounting","Money and Banking","Income Determination","Government Budget and the Economy","Open Economy Macroeconomics","Introduction to Microeconomics","Theory of Consumer Behaviour","Production and Costs","The Theory of the Firm under Perfect Competition","Market Equilibrium","Non-competitive Markets"],
    "Business Studies": ["Nature and Significance of Management","Principles of Management","Business Environment","Planning","Organising","Staffing","Directing","Controlling","Financial Management","Financial Markets","Marketing Management","Consumer Protection","Entrepreneurship Development"],
    "Computer Science": ["Python Revision Tour","Object Oriented Programming","Exception Handling in Python","File Handling in Python","Database Concepts","Structured Query Language","Computer Networks","Communication Technologies","Societal Impacts"],
  },
}


// ══════════════════════════════════════════════════════════════
//  NCERT SUB-TOPICS  (you maintain this — not AI-generated)
//  Shape:  CHAPTER_SUBTOPICS[class][subject][chapter] = [ "sub-topic", ... ]
//  Any chapter you omit just shows: Full chapter + custom options.
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS — NCERT-aligned, 10–14 sub-topics per chapter
//  Replace the existing CHAPTER_SUBTOPICS constant in App.jsx
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_CORE = {

  // ════════════════════════════════════════════
  //  CLASS 9
  // ════════════════════════════════════════════
  "Class 9": {
    "Mathematics": {
      "Number Systems": [
        "Rational Numbers on Number Line",
        "Irrational Numbers",
        "Real Numbers and Their Decimal Expansions",
        "Representing Real Numbers on the Number Line",
        "Operations on Real Numbers",
        "Laws of Exponents for Real Numbers",
        "Finding Rational Numbers Between Two Rationals",
        "Terminating and Non-Terminating Decimals",
        "Rationalisation of Denominators",
        "Surds and Their Properties",
        "Locating Irrational Numbers Geometrically",
      ],
      "Polynomials": [
        "Polynomials in One Variable",
        "Zeroes of a Polynomial",
        "Remainder Theorem",
        "Factor Theorem",
        "Factorisation of Polynomials",
        "Algebraic Identities",
        "Degree and Coefficients",
        "Types of Polynomials (Linear, Quadratic, Cubic)",
        "Division Algorithm for Polynomials",
        "Polynomial Equations",
        "Value of a Polynomial at a Point",
      ],
      "Coordinate Geometry": [
        "Cartesian System",
        "Plotting Points in the Plane",
        "Quadrants and Axes",
        "Distance of a Point from Axes",
        "Abscissa and Ordinate",
        "Graphs of Linear Equations",
        "Equations of Lines Parallel to Axes",
        "Representation of Data on Graph",
        "Origin and Sign Convention",
        "Locating Points Using Coordinates",
      ],
      "Linear Equations in Two Variables": [
        "Linear Equation in Two Variables",
        "Solution of a Linear Equation",
        "Graph of a Linear Equation",
        "Equations of Lines Parallel to x-axis and y-axis",
        "Infinite Solutions of Linear Equations",
        "Real-Life Problems Using Linear Equations",
        "Slope of a Line (Introduction)",
        "Intercept Form of a Line",
        "Identifying Solutions from Graphs",
        "Consistent and Inconsistent Equations",
      ],
      "Triangles": [
        "Congruence of Triangles",
        "SAS Congruence Rule",
        "ASA Congruence Rule",
        "SSS Congruence Rule",
        "RHS Congruence Rule",
        "Properties of Isosceles Triangle",
        "Inequalities in a Triangle",
        "AAS Congruence Rule",
        "CPCT (Corresponding Parts of Congruent Triangles)",
        "Angle Sum Property",
        "Exterior Angle Theorem",
        "Triangle Inequality Property",
      ],
      "Quadrilaterals": [
        "Angle Sum Property of a Quadrilateral",
        "Types of Quadrilaterals",
        "Properties of a Parallelogram",
        "Conditions for a Quadrilateral to be a Parallelogram",
        "Mid-Point Theorem",
        "Converse of Mid-Point Theorem",
        "Diagonal Properties of Parallelogram",
        "Rectangle, Rhombus, and Square Properties",
        "Trapezium Properties",
        "Proofs Using Parallelogram Properties",
      ],
      "Circles": [
        "Circle and Related Terms",
        "Angle Subtended by a Chord at a Point",
        "Perpendicular from Centre to Chord",
        "Equal Chords and Their Distances from Centre",
        "Angle Subtended by an Arc",
        "Cyclic Quadrilaterals",
        "Chords of a Circle",
        "Congruent Circles and Arcs",
        "Theorems on Cyclic Quadrilaterals",
        "Properties of Tangent Lines (Introduction)",
        "Circles and Their Properties in Daily Life",
      ],
      "Heron's Formula": [
        "Area of a Triangle by Heron's Formula",
        "Semi-Perimeter of a Triangle",
        "Application of Heron's Formula",
        "Area of Equilateral Triangle",
        "Area of Isosceles Triangle",
        "Area of Triangles with Given Sides",
        "Area of Quadrilaterals Using Triangles",
        "Comparison with Standard Area Formulas",
        "Problems on Perimeter and Area",
        "Real-Life Applications of Heron's Formula",
      ],
      "Surface Areas and Volumes": [
        "Surface Area of a Cuboid",
        "Surface Area of a Cube",
        "Surface Area of a Right Circular Cylinder",
        "Surface Area of a Right Circular Cone",
        "Surface Area of a Sphere",
        "Volume of a Cuboid",
        "Volume of a Cylinder",
        "Volume of a Cone",
        "Volume of a Sphere",
        "Curved Surface Area vs Total Surface Area",
        "Hollow Cylinder Problems",
        "Real-Life Applications",
      ],
      "Statistics": [
        "Collection of Data",
        "Presentation of Data",
        "Frequency Distribution Table",
        "Bar Graphs",
        "Histograms",
        "Frequency Polygons",
        "Mean of Ungrouped Data",
        "Median of Ungrouped Data",
        "Mode of Ungrouped Data",
        "Measures of Central Tendency Comparison",
        "Reading and Interpreting Graphs",
      ],
    },
    "Science": {
      "Matter in Our Surroundings": [
        "Physical Nature of Matter",
        "Characteristics of Particles of Matter",
        "States of Matter",
        "Can Matter Change Its State?",
        "Interconversion of States of Matter",
        "Evaporation",
        "Factors Affecting Evaporation",
        "Effects of Evaporation",
        "Latent Heat",
        "Plasma and Bose-Einstein Condensate",
        "Diffusion in Different States",
      ],
      "Is Matter Around Us Pure?": [
        "What is a Mixture?",
        "Types of Mixtures",
        "Solution, Colloid and Suspension",
        "Properties of Solutions",
        "Concentration of Solution",
        "What is a Pure Substance?",
        "Separation Techniques – Evaporation",
        "Separation Techniques – Distillation",
        "Separation Techniques – Chromatography",
        "Separation Techniques – Centrifugation",
        "Elements and Compounds",
        "Physical and Chemical Changes",
      ],
      "Atoms and Molecules": [
        "Laws of Chemical Combination",
        "Dalton's Atomic Theory",
        "Atomic Mass and Atomic Mass Unit",
        "Symbols of Atoms of Different Elements",
        "Molecules of Elements and Compounds",
        "Ions – Cations and Anions",
        "Writing Chemical Formulae",
        "Molecular Mass",
        "Formula Unit Mass",
        "Mole Concept",
        "Avogadro's Number",
        "Molar Mass and Calculations",
      ],
      "Structure of the Atom": [
        "Charged Particles in Matter",
        "Thomson's Model of an Atom",
        "Rutherford's Model of an Atom",
        "Bohr's Model of Hydrogen Atom",
        "Electrons, Protons and Neutrons",
        "Atomic Number and Mass Number",
        "Isotopes",
        "Isobars",
        "Distribution of Electrons in Different Shells",
        "Valency",
        "Limitations of Bohr's Model",
      ],
      "The Fundamental Unit of Life": [
        "Who Discovered the Cell?",
        "Cell Theory",
        "Prokaryotic and Eukaryotic Cells",
        "Plant Cell vs Animal Cell",
        "Cell Membrane",
        "Cell Wall",
        "Nucleus and Its Components",
        "Cytoplasm and Cell Organelles",
        "Mitochondria",
        "Endoplasmic Reticulum",
        "Golgi Apparatus",
        "Vacuoles, Ribosomes, Lysosomes and Plastids",
      ],
      "Tissues": [
        "Are Plants and Animals Made of Same Types of Tissue?",
        "Plant Tissues – Meristematic Tissue",
        "Plant Tissues – Permanent Tissue",
        "Simple Permanent Tissue",
        "Complex Permanent Tissue",
        "Animal Tissues – Epithelial Tissue",
        "Animal Tissues – Connective Tissue",
        "Animal Tissues – Muscular Tissue",
        "Animal Tissues – Nervous Tissue",
        "Comparison of Plant and Animal Tissues",
        "Functions of Different Tissues",
      ],
      "Motion": [
        "Describing Motion",
        "Uniform and Non-Uniform Motion",
        "Speed with Direction",
        "Rate of Change of Velocity (Acceleration)",
        "Graphical Representation – Distance-Time Graph",
        "Graphical Representation – Velocity-Time Graph",
        "Equations of Uniformly Accelerated Motion",
        "Uniform Circular Motion",
        "Distance and Displacement",
        "Scalar and Vector Quantities",
        "Deriving Equations Graphically",
      ],
      "Force and Laws of Motion": [
        "Balanced and Unbalanced Forces",
        "Newton's First Law of Motion",
        "Inertia and Mass",
        "Newton's Second Law of Motion",
        "Momentum",
        "Mathematical Formulation of Second Law",
        "Newton's Third Law of Motion",
        "Conservation of Momentum",
        "Applications of Newton's Laws",
        "Action and Reaction Forces",
        "Real-Life Examples of Newton's Laws",
      ],
      "Gravitation": [
        "Universal Law of Gravitation",
        "Importance of Universal Law of Gravitation",
        "Free Fall",
        "Mass and Weight",
        "Weight of an Object on Moon",
        "Thrust and Pressure",
        "Pressure in Fluids",
        "Buoyancy",
        "Why Objects Float or Sink?",
        "Archimedes' Principle",
        "Relative Density",
        "Gravitational Constant G",
      ],
      "Work and Energy": [
        "Work Done by a Force",
        "Positive, Negative and Zero Work",
        "Energy and Its Forms",
        "Kinetic Energy",
        "Potential Energy",
        "Work-Energy Theorem",
        "Law of Conservation of Energy",
        "Rate of Doing Work (Power)",
        "Commercial Unit of Energy",
        "Transformation of Energy",
        "Sources of Energy (Introduction)",
      ],
      "Sound": [
        "Production of Sound",
        "Propagation of Sound",
        "Sound Needs a Medium to Travel",
        "Speed of Sound in Different Media",
        "Characteristics of Sound – Amplitude, Frequency, Time Period",
        "Loudness, Pitch and Quality",
        "Reflection of Sound",
        "Echo",
        "Reverberation",
        "Uses of Multiple Reflection of Sound",
        "Range of Hearing",
        "Ultrasound and SONAR",
        "Human Ear",
      ],
      "Why Do We Fall Ill?": [
        "Health and Its Significance",
        "Personal and Community Health",
        "Disease and Its Causes",
        "Infectious and Non-Infectious Diseases",
        "Means of Spread of Disease",
        "Principles of Treatment",
        "Principles of Prevention",
        "Immunity and Immunisation",
        "Acute and Chronic Diseases",
        "Organ-Specific and Tissue-Specific Manifestations",
        "Infectious Agents – Bacteria, Virus, Fungi, Protozoa",
      ],
    },
    "Social Science": {
      "The French Revolution": [
        "French Society During the Late Eighteenth Century",
        "The Struggle to Survive",
        "A Growing Middle Class Envisages an End to Privilege",
        "The Outbreak of the Revolution",
        "France Abolishes Monarchy and Becomes a Republic",
        "The Reign of Terror",
        "Did Women Have a Revolution?",
        "The Abolition of Slavery",
        "The Revolution and Everyday Life",
        "Napoleon and Rise of Nationalism",
        "Legacy of the French Revolution",
        "Declaration of the Rights of Man and Citizen",
      ],
      "Socialism in Europe and the Russian Revolution": [
        "The Age of Social Change",
        "The Ideas of Socialists Before Marx",
        "Support for Socialism",
        "The Russian Revolution of 1905",
        "February Revolution of 1917",
        "October Revolution of 1917",
        "What Changed After October?",
        "The Civil War",
        "Making of Soviet Union",
        "Stalinism and Collectivisation",
        "The Global Influence of the Russian Revolution",
        "Karl Marx and Friedrich Engels",
      ],
      "India Size and Location": [
        "Location of India",
        "India's Size and Extent",
        "India and the World",
        "India's Neighbours",
        "The Standard Meridian of India",
        "Latitudinal and Longitudinal Extent",
        "The Subcontinent and Its Boundaries",
        "Land Boundaries of India",
        "Sea Boundaries of India",
        "Significance of India's Location",
        "Administrative Units of India",
      ],
      "Physical Features of India": [
        "The Himalayan Mountains",
        "The Northern Plains",
        "The Peninsular Plateau",
        "The Indian Desert",
        "The Coastal Plains",
        "The Islands",
        "Physiographic Divisions",
        "Trans-Himalayan Region",
        "Eastern and Western Himalayas",
        "Deccan Plateau",
        "Western and Eastern Ghats",
        "Significance of Each Physical Region",
      ],
      "Drainage": [
        "Drainage Systems in India",
        "The Himalayan Rivers",
        "The Peninsular Rivers",
        "The Ganga River System",
        "The Indus River System",
        "The Brahmaputra River System",
        "River Pollution",
        "Lakes in India",
        "Role of Rivers in Indian Economy",
        "Drainage Pattern",
        "The Krishna and Kaveri Rivers",
        "National River Conservation Plan",
      ],
      "Climate": [
        "Factors Influencing India's Climate",
        "The Seasons of India",
        "The Cold Weather Season (Winter)",
        "The Hot Weather Season (Summer)",
        "The Advancing Monsoon",
        "The Retreating Monsoon",
        "Distribution of Rainfall",
        "Monsoon as a Unifying Bond",
        "El Nino Effect",
        "Climate and Indian Economy",
        "Regional Climatic Variations",
        "Jet Streams and Western Disturbances",
      ],
      "What is Democracy? Why Democracy?": [
        "What is Democracy?",
        "Features of Democracy",
        "Why Democracy?",
        "Arguments For and Against Democracy",
        "Broader Meaning of Democracy",
        "Democracy in Practice",
        "Political Equality in Democracy",
        "Types of Government Systems",
        "Democratic Decision Making",
        "Democracy and Human Dignity",
        "Examples of Non-Democratic Governments",
      ],
      "Constitutional Design": [
        "Democratic Constitution in South Africa",
        "Why Do We Need a Constitution?",
        "Making of the Indian Constitution",
        "Guiding Values of the Indian Constitution",
        "The Preamble of the Constitution",
        "Fundamental Rights",
        "Directive Principles of State Policy",
        "Fundamental Duties",
        "Amendment of the Constitution",
        "Significance of the Constitution",
        "Nelson Mandela and Democracy",
      ],
      "The Story of Village Palampur": [
        "Organisation of Production",
        "Farming in Palampur",
        "How is Land Distributed?",
        "Labour in Palampur",
        "Capital Needed for Farming",
        "Sale of Surplus Farm Products",
        "Non-Farm Activities in Palampur",
        "Dairy and Small-Scale Manufacturing",
        "Shopkeeping and Transport",
        "Distribution of Earnings",
        "Factors of Production",
        "Sustainable Development in Village",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 10
  // ════════════════════════════════════════════
  "Class 10": {
    "Mathematics": {
      "Real Numbers": [
        "Euclid's Division Lemma",
        "The Fundamental Theorem of Arithmetic",
        "Revisiting Irrational Numbers",
        "Revisiting Rational Numbers and Decimal Expansions",
        "Euclid's Division Algorithm",
        "HCF Using Euclid's Algorithm",
        "LCM Using Prime Factorisation",
        "Proof that √2 is Irrational",
        "Proof that √3 is Irrational",
        "Terminating vs Non-Terminating Decimals",
        "HCF × LCM = Product of Two Numbers",
      ],
      "Polynomials": [
        "Geometrical Meaning of Zeroes of a Polynomial",
        "Relationship Between Zeroes and Coefficients of a Polynomial",
        "Division Algorithm for Polynomials",
        "Zeroes of a Linear Polynomial",
        "Zeroes of a Quadratic Polynomial",
        "Zeroes of a Cubic Polynomial",
        "Factorisation of Quadratic Polynomials",
        "Graph of a Quadratic Polynomial",
        "Sum and Product of Zeroes",
        "Finding Polynomial from Given Zeroes",
        "Verification of Division Algorithm",
      ],
      "Pair of Linear Equations in Two Variables": [
        "Pair of Linear Equations in Two Variables",
        "Graphical Method of Solution",
        "Algebraic Methods – Substitution Method",
        "Algebraic Methods – Elimination Method",
        "Cross-Multiplication Method",
        "Equations Reducible to Pair of Linear Equations",
        "Consistent and Inconsistent Systems",
        "Geometrical Interpretation",
        "Word Problems on Linear Equations",
        "Conditions for Unique, Infinite and No Solution",
        "Application in Real Life",
      ],
      "Quadratic Equations": [
        "Quadratic Equations",
        "Solution by Factorisation",
        "Solution by Completing the Square",
        "Quadratic Formula (Shreedhara Acharya's Formula)",
        "Nature of Roots (Discriminant)",
        "Relationship Between Roots and Coefficients",
        "Word Problems on Quadratic Equations",
        "Real Roots vs Complex Roots",
        "Equations Reducible to Quadratic Form",
        "Application of Quadratic Equations",
        "Forming Quadratic Equation from Roots",
      ],
      "Arithmetic Progressions": [
        "Arithmetic Progressions – Introduction",
        "nth Term of an AP",
        "Sum of First n Terms of an AP",
        "Finding the Common Difference",
        "General Term Formula",
        "Properties of AP",
        "Arithmetic Mean",
        "Word Problems on AP",
        "Sum of Terms When First and Last Term Are Known",
        "Three Numbers in AP",
        "Application of AP in Real Life",
        "Finding Number of Terms in AP",
      ],
      "Triangles": [
        "Similar Figures",
        "Similarity of Triangles",
        "Criteria for Similarity of Triangles – AAA",
        "Criteria for Similarity – SSS",
        "Criteria for Similarity – SAS",
        "Basic Proportionality Theorem (Thales Theorem)",
        "Converse of BPT",
        "Pythagoras Theorem",
        "Converse of Pythagoras Theorem",
        "Areas of Similar Triangles",
        "Proof of Similarity Theorems",
        "Applications in Real Life",
      ],
      "Coordinate Geometry": [
        "Distance Formula",
        "Section Formula",
        "Mid-Point Formula",
        "Area of a Triangle Using Coordinates",
        "Collinearity of Three Points",
        "Centroid of a Triangle",
        "Trisection of a Line Segment",
        "Equation of a Line (Introduction)",
        "Coordinates of a Point Dividing in Ratio",
        "Applications of Distance Formula",
        "Area of Quadrilateral Using Coordinates",
      ],
      "Introduction to Trigonometry": [
        "Trigonometric Ratios",
        "Trigonometric Ratios of Specific Angles (0°, 30°, 45°, 60°, 90°)",
        "Trigonometric Ratios of Complementary Angles",
        "Trigonometric Identities",
        "Proof of sin²θ + cos²θ = 1",
        "Applications of Identities",
        "Reciprocal Identities",
        "Quotient Identities",
        "Finding Remaining Ratios from One Ratio",
        "Pythagoras Identity",
        "Simplification Using Identities",
      ],
      "Some Applications of Trigonometry": [
        "Heights and Distances",
        "Line of Sight",
        "Angle of Elevation",
        "Angle of Depression",
        "Two Buildings Problems",
        "Tower and Cliff Problems",
        "Problems Involving Two Angles",
        "Shadow Length Problems",
        "Practical Applications of Trigonometry",
        "Word Problems on Heights and Distances",
        "Three-Dimensional Application Concepts",
      ],
      "Circles": [
        "Tangent to a Circle",
        "Number of Tangents from a Point on a Circle",
        "Tangent at a Point is Perpendicular to Radius",
        "Length of Tangents from External Point",
        "Properties of Tangent Lines",
        "Secant and Tangent Relationship",
        "Direct Common Tangents",
        "Transverse Common Tangents",
        "Angle in Alternate Segment",
        "Proof: Tangent Perpendicular to Radius",
        "Applications of Tangent Properties",
      ],
      "Areas Related to Circles": [
        "Perimeter and Area of Circle – Revision",
        "Areas of Sector and Segment",
        "Length of Arc",
        "Area of Major and Minor Segment",
        "Area of Semicircle",
        "Areas of Combinations of Plane Figures",
        "Ring-Shaped Region",
        "Square Inscribed in Circle",
        "Circle Inscribed in Square",
        "Application Problems – Shaded Regions",
        "Area of Quadrant",
      ],
      "Surface Areas and Volumes": [
        "Surface Area of a Combination of Solids",
        "Volume of a Combination of Solids",
        "Conversion of Solid from One Shape to Another",
        "Frustum of a Cone",
        "Volume of Frustum",
        "Curved Surface Area of Frustum",
        "Total Surface Area of Frustum",
        "Problems on Melting and Recasting",
        "Hollow Cylinder and Sphere Problems",
        "Applications in Real Life",
        "Cone on Top of Cylinder",
        "Hemisphere on Cylinder",
      ],
      "Statistics": [
        "Mean of Grouped Data – Direct Method",
        "Mean of Grouped Data – Assumed Mean Method",
        "Mean of Grouped Data – Step Deviation Method",
        "Mode of Grouped Data",
        "Median of Grouped Data",
        "Cumulative Frequency Distribution",
        "Ogive (Cumulative Frequency Curve)",
        "Finding Median from Ogive",
        "Relation Between Mean, Median and Mode",
        "Class Mark and Class Interval",
        "Comparison of Measures of Central Tendency",
      ],
      "Probability": [
        "Probability – A Theoretical Approach",
        "Classical Definition of Probability",
        "Experimental Probability",
        "Complementary Events",
        "Mutually Exclusive Events",
        "Sample Space and Events",
        "Probability of Sure and Impossible Events",
        "Deck of Cards Problems",
        "Dice and Coins Problems",
        "Word Problems on Probability",
        "Addition Rule of Probability",
      ],
    },
    "Science": {
      "Chemical Reactions and Equations": [
        "Chemical Equations",
        "Balancing Chemical Equations",
        "Types of Chemical Reactions – Combination",
        "Types of Chemical Reactions – Decomposition",
        "Types of Chemical Reactions – Displacement",
        "Types of Chemical Reactions – Double Displacement",
        "Oxidation and Reduction",
        "Exothermic and Endothermic Reactions",
        "Corrosion and Its Prevention",
        "Rancidity and Its Prevention",
        "Effects of Oxidation in Daily Life",
        "Photolytic Decomposition",
      ],
      "Acids, Bases and Salts": [
        "Understanding Acids and Bases",
        "Chemical Properties of Acids",
        "Chemical Properties of Bases",
        "Acid-Base Indicators",
        "pH Scale",
        "Importance of pH in Daily Life",
        "Salts – Formation and Properties",
        "Sodium Hydroxide – Chlor-Alkali Process",
        "Bleaching Powder",
        "Baking Soda and Washing Soda",
        "Plaster of Paris",
        "Water of Crystallisation",
        "Universal Indicator",
      ],
      "Metals and Non-Metals": [
        "Physical Properties of Metals and Non-metals",
        "Chemical Properties of Metals",
        "Reactivity Series of Metals",
        "How Do Metals and Non-Metals React?",
        "Ionic Bonding – Formation of Ionic Compounds",
        "Properties of Ionic Compounds",
        "Occurrence of Metals",
        "Extraction of Metals from Ores",
        "Enrichment of Ores – Concentration",
        "Refining of Metals – Electrolytic Refining",
        "Corrosion and Alloys",
        "Uses of Metals and Non-metals",
      ],
      "Carbon and its Compounds": [
        "Bonding in Carbon – Covalent Bond",
        "Allotropes of Carbon",
        "Versatile Nature of Carbon – Catenation",
        "Hydrocarbons – Saturated and Unsaturated",
        "Nomenclature of Carbon Compounds",
        "Functional Groups in Carbon Compounds",
        "Chemical Properties – Combustion",
        "Chemical Properties – Oxidation",
        "Chemical Properties – Addition Reaction",
        "Chemical Properties – Substitution Reaction",
        "Ethanol and Ethanoic Acid",
        "Soap and Detergents",
      ],
      "Life Processes": [
        "What are Life Processes?",
        "Nutrition – Autotrophic Nutrition",
        "Photosynthesis",
        "Heterotrophic Nutrition",
        "Nutrition in Human Beings",
        "Respiration – Aerobic",
        "Respiration – Anaerobic",
        "Respiration in Human Beings",
        "Transportation in Plants",
        "Transportation in Human Beings (Circulatory System)",
        "Excretion in Human Beings",
        "Excretion in Plants",
      ],
      "Control and Coordination": [
        "Animals – Nervous System",
        "Structure of Neuron",
        "Types of Nervous System Responses",
        "Human Brain",
        "Reflex Action and Reflex Arc",
        "Coordination in Plants",
        "Immediate Response in Plants",
        "Movement Due to Growth in Plants",
        "Plant Hormones (Phytohormones)",
        "Animal Hormones",
        "Endocrine System",
        "Feedback Mechanism",
      ],
      "How Do Organisms Reproduce?": [
        "Modes of Reproduction",
        "Asexual Reproduction – Fission",
        "Asexual Reproduction – Fragmentation",
        "Asexual Reproduction – Regeneration",
        "Asexual Reproduction – Budding",
        "Asexual Reproduction – Vegetative Propagation",
        "Asexual Reproduction – Spore Formation",
        "Sexual Reproduction in Flowering Plants",
        "Pollination and Fertilisation in Plants",
        "Sexual Reproduction in Human Beings",
        "Male Reproductive System",
        "Female Reproductive System",
        "Reproductive Health and Contraception",
      ],
      "Heredity": [
        "Heredity and Accumulation of Variation",
        "Mendel's Contribution",
        "Monohybrid Cross",
        "Dihybrid Cross",
        "Dominant and Recessive Traits",
        "Sex Determination in Human Beings",
        "Rules for Inheritance",
        "Expression of Traits",
        "Variations and Evolution",
        "Acquired vs Inherited Traits",
        "Genotype and Phenotype",
      ],
      "Light – Reflection and Refraction": [
        "Reflection of Light",
        "Spherical Mirrors – Concave and Convex",
        "Image Formation by Concave Mirror",
        "Image Formation by Convex Mirror",
        "Mirror Formula",
        "Magnification",
        "Refraction of Light",
        "Refractive Index",
        "Refraction Through a Glass Slab",
        "Spherical Lenses – Convex and Concave",
        "Image Formation by Lenses",
        "Lens Formula and Magnification",
        "Power of a Lens",
      ],
      "Human Eye and the Colourful World": [
        "The Human Eye",
        "Power of Accommodation",
        "Defects of Vision – Myopia",
        "Defects of Vision – Hypermetropia",
        "Defects of Vision – Presbyopia",
        "Correction of Eye Defects",
        "Refraction Through a Prism",
        "Dispersion of Light",
        "Atmospheric Refraction",
        "Scattering of Light – Tyndall Effect",
        "Why is the Sky Blue?",
        "Why Does the Sun Appear Reddish at Sunrise and Sunset?",
      ],
      "Electricity": [
        "Electric Current and Circuit",
        "Electric Potential and Potential Difference",
        "Ohm's Law",
        "Factors Affecting Resistance",
        "Resistance of a System of Resistors – Series",
        "Resistance of a System of Resistors – Parallel",
        "Heating Effect of Electric Current",
        "Electric Power",
        "Commercial Unit of Electric Energy",
        "Applications of Heating Effect",
        "Domestic Electric Circuits",
        "Fuse and Safety Devices",
      ],
      "Magnetic Effects of Electric Current": [
        "Magnetic Field and Field Lines",
        "Magnetic Field due to Current-Carrying Conductor",
        "Circular Loop Carrying Current",
        "Solenoid and Magnetic Field",
        "Force on a Current-Carrying Conductor in Magnetic Field",
        "Electric Motor",
        "Electromagnetic Induction",
        "Faraday's Laws of Electromagnetic Induction",
        "Electric Generator",
        "Direct Current vs Alternating Current",
        "Domestic Electric Circuits and Safety",
        "Magnetic Field due to Straight Conductor",
      ],
      "Our Environment": [
        "Ecosystem – Components",
        "Food Chains and Webs",
        "How Do Our Activities Affect the Environment?",
        "Ozone Layer and Its Depletion",
        "Management of Garbage",
        "Biodegradable and Non-Biodegradable Substances",
        "Ten Percent Law",
        "Biological Magnification",
        "Environmental Problems and Solutions",
        "Producers, Consumers and Decomposers",
        "Energy Flow in Ecosystem",
      ],
    },
    "Social Science": {
      "Nationalism in India": [
        "The First World War, Khilafat and Non-Cooperation",
        "Differing Strands Within the Movement",
        "Why Non-Cooperation?",
        "The Salt March and Civil Disobedience Movement",
        "How Participants Saw the Movement",
        "The Limits of Civil Disobedience",
        "The Sense of Collective Belonging",
        "Gandhian Idea of Satyagraha",
        "Round Table Conferences",
        "Quit India Movement",
        "Role of Women in Freedom Struggle",
        "Ambedkar and Dalit Movements",
      ],
      "Resources and Development": [
        "Types of Resources",
        "Development of Resources",
        "Resource Planning in India",
        "Land Resources",
        "Land Utilisation",
        "Land Use Pattern in India",
        "Land Degradation and Conservation",
        "Soil as a Resource",
        "Classification of Soil",
        "Soil Erosion and Soil Conservation",
        "Sustainable Development Goals",
        "Global vs Local Resource Distribution",
      ],
      "Power Sharing": [
        "Belgium and Sri Lanka",
        "Majoritarianism in Sri Lanka",
        "Accommodation in Belgium",
        "Why Power Sharing is Desirable",
        "Forms of Power Sharing",
        "Horizontal Distribution of Power",
        "Vertical Distribution of Power",
        "Power Sharing Among Social Groups",
        "Power Sharing in Political Parties",
        "Prudential Reasons for Power Sharing",
        "Moral Reasons for Power Sharing",
      ],
      "Federalism": [
        "What is Federalism?",
        "What Makes India a Federal Country?",
        "How is Federalism Practised?",
        "Decentralisation in India",
        "Panchayati Raj",
        "Urban Local Bodies",
        "Unitary vs Federal Government",
        "Languages Policy in India",
        "Centre-State Relations",
        "Gram Sabha and Its Functions",
        "Holding Together vs Coming Together Federation",
      ],
      "Development": [
        "What Development Promises – Different Goals",
        "Income and Other Goals",
        "National Development",
        "How to Compare Different Countries or States?",
        "Income and Other Criteria",
        "Public Facilities",
        "Human Development Index",
        "Sustainability of Development",
        "Per Capita Income vs Average Income",
        "Development vs Growth",
        "Goals of Development Beyond GDP",
      ],
      "Money and Credit": [
        "Money as a Medium of Exchange",
        "Modern Forms of Money",
        "Loan Activities of Banks",
        "Two Different Credit Situations",
        "Terms of Credit",
        "Formal Sector Credit in India",
        "Informal Sector Credit in India",
        "Self Help Groups for the Poor",
        "Reserve Bank of India",
        "Barter System and Its Limitations",
        "Role of Banks in Economy",
        "Credit and Development",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 11
  // ════════════════════════════════════════════
  "Class 11": {
    "Physics": {
      "Units and Measurements": [
        "International System of Units",
        "Measurement of Length",
        "Measurement of Mass",
        "Measurement of Time",
        "Accuracy, Precision and Errors in Measurement",
        "Significant Figures",
        "Dimensions of Physical Quantities",
        "Dimensional Analysis and Its Applications",
        "Least Count and Errors",
        "Absolute, Relative and Percentage Error",
        "Combination of Errors",
        "Parallax Method for Large Distances",
      ],
      "Motion in a Straight Line": [
        "Position, Path Length and Displacement",
        "Average Velocity and Average Speed",
        "Instantaneous Velocity and Speed",
        "Acceleration",
        "Kinematic Equations for Uniformly Accelerated Motion",
        "Relative Velocity",
        "Graphical Analysis – Position-Time Graph",
        "Graphical Analysis – Velocity-Time Graph",
        "Equation for Uniformly Accelerated Motion (Calculus Method)",
        "Motion Under Gravity",
        "Stopping Distance",
        "Free Fall",
      ],
      "Motion in a Plane": [
        "Scalars and Vectors",
        "Multiplication of Vectors by Real Numbers",
        "Addition and Subtraction of Vectors",
        "Resolution of Vectors",
        "Vector Addition – Analytical Method",
        "Motion in a Plane with Constant Acceleration",
        "Projectile Motion",
        "Uniform Circular Motion",
        "Centripetal Acceleration",
        "Relative Velocity in Two Dimensions",
        "River and Boat Problems",
        "Unit Vectors",
      ],
      "Laws of Motion": [
        "Aristotle's Fallacy",
        "Newton's First Law of Motion",
        "Newton's Second Law of Motion",
        "Newton's Third Law of Motion",
        "Conservation of Momentum",
        "Equilibrium of a Particle",
        "Common Forces – Friction",
        "Circular Motion and Dynamics",
        "Solving Problems in Mechanics",
        "Inertia and Momentum",
        "Free Body Diagrams",
        "Pseudo Force in Non-Inertial Frames",
      ],
      "Work Energy and Power": [
        "The Work-Energy Theorem",
        "Work Done by a Variable Force",
        "Potential Energy",
        "Conservation of Mechanical Energy",
        "The Potential Energy of a Spring",
        "Various Forms of Energy",
        "Power",
        "Collisions",
        "Elastic and Inelastic Collisions",
        "Head-On Collision",
        "Work Done by Gravity",
        "Conservative and Non-Conservative Forces",
      ],
      "Gravitation": [
        "Kepler's Laws of Planetary Motion",
        "Universal Law of Gravitation",
        "The Gravitational Constant",
        "Acceleration Due to Gravity of Earth",
        "Acceleration Due to Gravity Above and Below Earth's Surface",
        "Gravitational Potential Energy",
        "Escape Speed",
        "Orbital Speed of Satellite",
        "Time Period of Satellite",
        "Geostationary and Polar Satellites",
        "Weightlessness",
        "Earth's Satellites",
      ],
      "Thermodynamics": [
        "Thermal Equilibrium",
        "Zeroth Law of Thermodynamics",
        "Heat, Internal Energy and Work",
        "First Law of Thermodynamics",
        "Specific Heat Capacity",
        "Thermodynamic State Variables",
        "Thermodynamic Processes – Isothermal",
        "Thermodynamic Processes – Adiabatic",
        "Thermodynamic Processes – Isochoric and Isobaric",
        "Heat Engines",
        "Refrigerators and Heat Pumps",
        "Second Law of Thermodynamics",
        "Carnot Engine and Efficiency",
      ],
      "Oscillations": [
        "Periodic and Oscillatory Motions",
        "Simple Harmonic Motion",
        "Simple Harmonic Motion and Uniform Circular Motion",
        "Velocity and Acceleration in SHM",
        "Force Law for Simple Harmonic Motion",
        "Energy in Simple Harmonic Motion",
        "Some Systems Executing SHM – Oscillations of Spring",
        "Simple Pendulum",
        "Free, Forced and Damped Oscillations",
        "Resonance",
        "Superposition of SHMs",
        "Time Period and Amplitude",
      ],
      "Waves": [
        "Transverse and Longitudinal Waves",
        "Displacement Relation in Waves",
        "Speed of a Travelling Wave",
        "Principle of Superposition of Waves",
        "Reflection of Waves",
        "Beats",
        "Doppler Effect",
        "Standing Waves and Normal Modes",
        "Speed of Sound in Different Media",
        "Interference of Waves",
        "Wave Number and Angular Frequency",
        "Loudness, Pitch and Quality of Sound",
      ],
    },
    "Chemistry": {
      "Some Basic Concepts of Chemistry": [
        "Importance of Chemistry",
        "Properties of Matter and Their Measurement",
        "SI Units and Scientific Notation",
        "Laws of Chemical Combination",
        "Dalton's Atomic Theory",
        "Atomic and Molecular Masses",
        "Mole Concept",
        "Percentage Composition",
        "Stoichiometry and Stoichiometric Calculations",
        "Limiting Reagent",
        "Concentration of Solutions",
        "Empirical and Molecular Formula",
      ],
      "Structure of Atom": [
        "Discovery of Subatomic Particles",
        "Thomson's Atomic Model",
        "Rutherford's Nuclear Model",
        "Atomic Number, Mass Number and Isotopes",
        "Drawbacks of Rutherford's Model",
        "Bohr's Model of Hydrogen Atom",
        "Dual Nature of Matter – de Broglie Equation",
        "Heisenberg Uncertainty Principle",
        "Quantum Mechanical Model of Atom",
        "Orbitals and Quantum Numbers",
        "Shapes of Atomic Orbitals",
        "Aufbau Principle, Pauli's Exclusion Principle and Hund's Rule",
        "Electronic Configuration of Elements",
      ],
      "Classification of Elements and Periodicity in Properties": [
        "History of Classification of Elements",
        "Modern Periodic Law",
        "Nomenclature of Elements with Atomic Number >100",
        "Electronic Configurations and Periodic Table",
        "Periodic Trends in Properties – Atomic Radii",
        "Periodic Trends – Ionic Radii",
        "Periodic Trends – Ionisation Enthalpy",
        "Periodic Trends – Electron Gain Enthalpy",
        "Periodic Trends – Electronegativity",
        "Periodic Trends – Valence Electrons and Valency",
        "Anomalous Properties of Second Period Elements",
        "Diagonal Relationship",
      ],
      "Chemical Bonding and Molecular Structure": [
        "Kossel-Lewis Approach to Chemical Bonding",
        "Ionic or Electrovalent Bond",
        "Bond Parameters",
        "VSEPR Theory",
        "Valence Bond Theory",
        "Hybridisation",
        "Molecular Orbital Theory",
        "Bonding in Some Homodiatomic Molecules",
        "Hydrogen Bonding",
        "Octet Rule and Its Exceptions",
        "Polar and Non-Polar Bonds",
        "Resonance Structures",
        "Dipole Moment",
      ],
      "Thermodynamics": [
        "Thermodynamic Terms",
        "Applications of Internal Energy and Enthalpy",
        "Measurement of ΔU and ΔH – Calorimetry",
        "Enthalpy Change – Reactions",
        "Hess's Law of Constant Heat Summation",
        "Enthalpies for Different Types of Reactions",
        "Spontaneity",
        "Gibbs Free Energy and Spontaneity",
        "Entropy and the Second Law",
        "Third Law of Thermodynamics",
        "Heat Capacity",
        "Relationship Between Cp and Cv",
      ],
      "Equilibrium": [
        "Equilibrium in Physical Processes",
        "Equilibrium in Chemical Processes",
        "Law of Chemical Equilibrium and Equilibrium Constant",
        "Homogeneous Equilibria",
        "Heterogeneous Equilibria",
        "Applications of Equilibrium Constants",
        "Relationship Between Kp and Kc",
        "Factors Affecting Equilibrium – Le Chatelier's Principle",
        "Ionic Equilibrium in Solution",
        "Acids, Bases and Salts",
        "Buffer Solutions",
        "Solubility Equilibria of Sparingly Soluble Salts",
      ],
      "Hydrocarbons": [
        "Classification of Hydrocarbons",
        "Alkanes – Nomenclature and Properties",
        "Preparation of Alkanes",
        "Reactions of Alkanes",
        "Alkenes – Structure and Nomenclature",
        "Methods of Preparation of Alkenes",
        "Reactions of Alkenes",
        "Alkynes – Nomenclature and Properties",
        "Reactions of Alkynes",
        "Aromatic Hydrocarbons – Benzene",
        "Structure of Benzene",
        "Electrophilic Substitution Reactions of Benzene",
        "Carcinogenicity and Toxicity",
      ],
    },
    "Biology": {
      "The Living World": [
        "What is 'Living'?",
        "Diversity in the Living World",
        "Taxonomic Categories",
        "Taxonomical Aids",
        "Need for Classification",
        "Three Domains of Life",
        "Binomial Nomenclature",
        "Herbarium, Museums and Zoological Parks",
        "Biological Keys",
        "Species Concept",
        "Variety and Variety Names",
        "ICBN and ICZN Rules",
      ],
      "Cell The Unit of Life": [
        "Cell Theory",
        "Overview of Cell",
        "Prokaryotic Cells",
        "Eukaryotic Cells",
        "Cell Membrane",
        "Cell Wall",
        "Endomembrane System",
        "Mitochondria",
        "Plastids",
        "Ribosomes",
        "Cytoskeleton",
        "Nucleus",
        "Cilia and Flagella",
        "Centrosome and Centrioles",
      ],
      "Photosynthesis in Higher Plants": [
        "Early Experiments on Photosynthesis",
        "Where Does Photosynthesis Take Place?",
        "Light Reactions",
        "Photosystems I and II",
        "Electron Transport Chain",
        "Splitting of Water",
        "Cyclic and Non-Cyclic Photophosphorylation",
        "Chemiosmotic Hypothesis",
        "Dark Reactions – Calvin Cycle (C3 Pathway)",
        "C4 Pathway (Hatch-Slack Pathway)",
        "Photorespiration",
        "Factors Affecting Photosynthesis",
      ],
      "Breathing and Exchange of Gases": [
        "Respiratory Organs",
        "Mechanism of Breathing",
        "Respiratory Volumes and Capacities",
        "Exchange of Gases",
        "Transport of Oxygen",
        "Transport of Carbon Dioxide",
        "Regulation of Respiration",
        "Disorders of Respiratory System",
        "Oxygen-Haemoglobin Dissociation Curve",
        "Bohr's Effect",
        "Tidal Volume and Vital Capacity",
        "Breathing in Aquatic Animals",
      ],
      "Body Fluids and Circulation": [
        "Blood – Composition",
        "Blood Groups",
        "Coagulation of Blood",
        "Lymph and its Circulation",
        "Human Circulatory System",
        "Cardiac Cycle",
        "Electrocardiograph (ECG)",
        "Double Circulation",
        "Regulation of Cardiac Activity",
        "Disorders of Circulatory System",
        "Structure of Heart",
        "Coronary Circulation",
        "Heartbeat – Origin and Conduction",
      ],
    },
    "Mathematics": {
      "Sets": [
        "Sets and Their Representations",
        "Types of Sets",
        "Subsets",
        "Operations on Sets – Union",
        "Operations on Sets – Intersection",
        "Operations on Sets – Difference",
        "Complement of a Set",
        "Venn Diagrams",
        "Laws of Algebra of Sets",
        "Practical Problems on Union and Intersection",
        "Power Set",
        "Cartesian Product of Sets",
      ],
      "Relations and Functions": [
        "Ordered Pairs and Cartesian Product",
        "Relations",
        "Representation of Relations",
        "Functions",
        "Types of Functions – One-One (Injective)",
        "Types of Functions – Onto (Surjective)",
        "Types of Functions – Bijective",
        "Algebra of Real Functions",
        "Domain and Range of Functions",
        "Graph of Functions",
        "Difference Between Relation and Function",
        "Real-Valued Functions",
      ],
      "Trigonometric Functions": [
        "Angles and Their Measurement",
        "Trigonometric Functions",
        "Trigonometric Functions of Sum and Difference of Two Angles",
        "Trigonometric Equations",
        "Sine and Cosine Rule",
        "Signs of Trigonometric Functions",
        "Domain and Range of Trigonometric Functions",
        "Trigonometric Identities",
        "Multiple and Sub-Multiple Angles",
        "Product-to-Sum and Sum-to-Product Formulas",
        "Principal and General Solutions",
        "Graphs of Trigonometric Functions",
      ],
      "Limits and Derivatives": [
        "Intuitive Idea of Derivatives",
        "Limits",
        "Limits of Trigonometric Functions",
        "Derivatives",
        "Algebra of Limits",
        "Sandwich Theorem",
        "Derivative as Rate of Change",
        "Algebra of Derivatives",
        "Derivatives of Trigonometric Functions",
        "Derivatives of Polynomial Functions",
        "Left-Hand and Right-Hand Limits",
        "Existence of Limit",
      ],
      "Statistics": [
        "Measures of Dispersion",
        "Range",
        "Mean Deviation",
        "Variance and Standard Deviation",
        "Analysis of Frequency Distribution",
        "Mean Deviation for Ungrouped Data",
        "Mean Deviation for Grouped Data",
        "Standard Deviation for Ungrouped Data",
        "Standard Deviation for Grouped Data",
        "Coefficient of Variation",
        "Comparison of Variability",
        "Shortcut Method for Standard Deviation",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 12
  // ════════════════════════════════════════════
  "Class 12": {
    "Physics": {
      "Electric Charges and Fields": [
        "Electric Charge",
        "Conductors and Insulators",
        "Basic Properties of Electric Charge",
        "Coulomb's Law",
        "Forces Between Multiple Charges",
        "Electric Field",
        "Electric Field Lines",
        "Electric Flux",
        "Gauss's Law",
        "Applications of Gauss's Law",
        "Electric Field Due to Infinitely Long Straight Wire",
        "Electric Field Due to Uniformly Charged Plane Sheet",
        "Electric Dipole and Torque",
      ],
      "Current Electricity": [
        "Electric Current",
        "Electric Currents in Conductors",
        "Ohm's Law",
        "Drift of Electrons and Origin of Resistance",
        "Limitations of Ohm's Law",
        "Resistivity and Its Temperature Dependence",
        "Electrical Energy and Power",
        "Combination of Resistors – Series and Parallel",
        "Cells, EMF, Internal Resistance",
        "Cells in Series and Parallel",
        "Kirchhoff's Laws",
        "Wheatstone Bridge",
        "Potentiometer",
      ],
      "Moving Charges and Magnetism": [
        "Magnetic Force",
        "Motion in a Magnetic Field",
        "Motion in Combined Electric and Magnetic Fields",
        "Magnetic Field Due to a Current Element – Biot-Savart Law",
        "Magnetic Field on the Axis of a Circular Current Loop",
        "Ampere's Circuital Law",
        "Solenoid and Toroid",
        "Force Between Two Parallel Currents",
        "Torque on a Current Loop in Magnetic Field",
        "Moving Coil Galvanometer",
        "Cyclotron",
        "Lorentz Force",
      ],
      "Electromagnetic Induction": [
        "Experiments of Faraday and Henry",
        "Magnetic Flux",
        "Faraday's Law of Induction",
        "Lenz's Law and Conservation of Energy",
        "Motional EMF",
        "Inductance",
        "Mutual Inductance",
        "Self-Inductance",
        "AC Generator",
        "Energy Stored in an Inductor",
        "Eddy Currents and Their Applications",
        "Transformer (Introduction)",
      ],
      "Alternating Current": [
        "AC Voltage Applied to a Resistor",
        "Representation of AC Current and Voltage by Rotating Vectors – Phasors",
        "AC Voltage Applied to an Inductor",
        "AC Voltage Applied to a Capacitor",
        "AC Voltage Applied to a Series LCR Circuit",
        "Resonance",
        "Power in AC Circuit – Wattless Current",
        "LC Oscillations",
        "Transformers",
        "Peak and RMS Values",
        "Impedance and Reactance",
        "Q-Factor of Resonance",
      ],
      "Ray Optics and Optical Instruments": [
        "Reflection of Light by Spherical Mirrors",
        "Refraction",
        "Total Internal Reflection",
        "Refraction at Spherical Surfaces and Lenses",
        "Refraction Through a Prism",
        "Dispersion by a Prism",
        "Some Natural Phenomena Due to Sunlight",
        "Optical Instruments – Microscope",
        "Optical Instruments – Telescope",
        "Lens Maker's Equation",
        "Combination of Thin Lenses in Contact",
        "Power of Combination of Lenses",
        "Human Eye as Optical Instrument",
      ],
      "Dual Nature of Radiation and Matter": [
        "Electron Emission",
        "Photoelectric Effect",
        "Experimental Study of Photoelectric Effect",
        "Photoelectric Effect and Wave Theory of Light",
        "Einstein's Photoelectric Equation",
        "Particle Nature of Light – Photon",
        "Wave Nature of Matter – de Broglie Relation",
        "Davisson-Germer Experiment",
        "Heisenberg Uncertainty Principle",
        "Work Function and Threshold Frequency",
        "Stopping Potential",
        "Photoelectric Equation Applications",
      ],
      "Atoms": [
        "Alpha-Particle Scattering and Rutherford's Nuclear Model",
        "Atomic Spectra",
        "Bohr's Model of Hydrogen Atom",
        "The Line Spectra of Hydrogen Atom",
        "de Broglie's Explanation of Bohr's Second Postulate",
        "Hydrogen Spectrum – Lyman, Balmer, Paschen Series",
        "Energy of Stationary States",
        "Ionisation Energy",
        "Orbital Velocity and Radius",
        "Limitations of Bohr's Model",
        "Atomic Spectra and Quantum Mechanics",
      ],
      "Nuclei": [
        "Atomic Masses and Composition of Nucleus",
        "Size of the Nucleus",
        "Mass-Energy and Nuclear Binding Energy",
        "Nuclear Force",
        "Radioactivity",
        "Nuclear Energy – Fission",
        "Nuclear Energy – Fusion",
        "Alpha Decay",
        "Beta Decay",
        "Gamma Decay",
        "Radioactive Decay Law",
        "Half-Life and Mean Life",
        "Q-Value of Nuclear Reactions",
      ],
    },
    "Chemistry": {
      "Solutions": [
        "Types of Solutions",
        "Expressing Concentration of Solutions",
        "Solubility",
        "Vapour Pressure of Liquid Solutions",
        "Raoult's Law",
        "Ideal and Non-Ideal Solutions",
        "Colligative Properties – Relative Lowering of Vapour Pressure",
        "Colligative Properties – Elevation of Boiling Point",
        "Colligative Properties – Depression of Freezing Point",
        "Colligative Properties – Osmotic Pressure",
        "Abnormal Molar Masses",
        "van't Hoff Factor",
        "Henry's Law",
      ],
      "Electrochemistry": [
        "Electrochemical Cells",
        "Galvanic Cells",
        "Nernst Equation",
        "Equilibrium Constant from Nernst Equation",
        "Electrochemical Cell and Gibbs Energy",
        "Conductance of Electrolytic Solutions",
        "Measurement of Conductivity",
        "Variation of Conductivity with Concentration",
        "Kohlrausch Law",
        "Electrolysis and Faraday's Laws",
        "Products of Electrolysis",
        "Batteries and Fuel Cells",
        "Corrosion",
      ],
      "Chemical Kinetics": [
        "Rate of a Chemical Reaction",
        "Factors Influencing Rate of Reaction",
        "Integrated Rate Equations – Zero Order",
        "Integrated Rate Equations – First Order",
        "Half-Life of Reactions",
        "Pseudo First Order Reaction",
        "Temperature Dependence of Rate – Arrhenius Equation",
        "Collision Theory of Chemical Reactions",
        "Activation Energy",
        "Rate Law and Rate Constant",
        "Order and Molecularity",
        "Experimental Determination of Order",
      ],
      "Aldehydes Ketones and Carboxylic Acids": [
        "Nomenclature and Structure of Carbonyl Group",
        "Preparation of Aldehydes",
        "Preparation of Ketones",
        "Physical Properties",
        "Chemical Reactions – Nucleophilic Addition",
        "Clemmensen and Wolf-Kishner Reduction",
        "Oxidation of Aldehydes",
        "Aldol Condensation",
        "Cannizzaro Reaction",
        "Carboxylic Acids – Nomenclature",
        "Preparation of Carboxylic Acids",
        "Physical and Chemical Properties of Carboxylic Acids",
        "Reactions of Carboxylic Acids",
      ],
    },
    "Mathematics": {
      "Relations and Functions": [
        "Types of Relations",
        "Types of Functions",
        "Composition of Functions",
        "Invertible Functions",
        "Binary Operations",
        "Reflexive, Symmetric, Transitive Relations",
        "Equivalence Relations",
        "One-One and Onto Functions",
        "Inverse of a Function",
        "Properties of Composition",
        "Identity Function",
        "Constant Function",
      ],
      "Matrices": [
        "Matrix and Types of Matrices",
        "Operations on Matrices – Addition",
        "Operations on Matrices – Multiplication",
        "Transpose of a Matrix",
        "Symmetric and Skew-Symmetric Matrices",
        "Invertible Matrices",
        "Elementary Row and Column Operations",
        "Multiplication of Matrices",
        "Properties of Matrix Operations",
        "Matrix Equations",
        "Null Matrix and Identity Matrix",
        "Scalar Multiplication",
      ],
      "Determinants": [
        "Determinant of a Square Matrix",
        "Properties of Determinants",
        "Area of a Triangle Using Determinants",
        "Minors and Cofactors",
        "Adjoint and Inverse of a Matrix",
        "Applications of Determinants – Solving System of Equations",
        "Consistency of System of Linear Equations",
        "Cramer's Rule",
        "Expanding Along Any Row or Column",
        "Singular and Non-Singular Matrices",
        "Sarrus Rule",
        "Determinant of Product of Matrices",
      ],
      "Continuity and Differentiability": [
        "Continuity",
        "Differentiability",
        "Exponential and Logarithmic Functions",
        "Logarithmic Differentiation",
        "Derivatives of Functions in Parametric Forms",
        "Second Order Derivative",
        "Rolle's Theorem",
        "Mean Value Theorem",
        "Chain Rule",
        "Implicit Differentiation",
        "Continuity vs Differentiability",
        "Derivatives of Inverse Trigonometric Functions",
      ],
      "Application of Derivatives": [
        "Rate of Change of Quantities",
        "Increasing and Decreasing Functions",
        "Tangents and Normals",
        "Approximations",
        "Maxima and Minima",
        "First Derivative Test",
        "Second Derivative Test",
        "Maximum and Minimum Values in Closed Interval",
        "Application to Optimisation Problems",
        "Rolle's and Mean Value Theorem Applications",
        "Graph Sketching Using Derivatives",
        "Critical Points",
      ],
      "Integrals": [
        "Integration as Inverse of Differentiation",
        "Methods of Integration – Substitution",
        "Integration Using Partial Fractions",
        "Integration by Parts",
        "Integrals of Some Particular Functions",
        "Integration by Trigonometric Substitution",
        "Definite Integral",
        "Fundamental Theorem of Calculus",
        "Evaluation of Definite Integrals by Substitution",
        "Properties of Definite Integrals",
        "Standard Integrals",
        "Reduction Formulae",
      ],
      "Differential Equations": [
        "Basic Concepts of Differential Equations",
        "General and Particular Solutions",
        "Formation of Differential Equations",
        "Methods of Solving – Separation of Variables",
        "Homogeneous Differential Equations",
        "Linear Differential Equations",
        "Exact Differential Equations (Introduction)",
        "Order and Degree of Differential Equations",
        "Applications of Differential Equations",
        "Growth and Decay Problems",
        "Bernoulli Equations (Introduction)",
        "Integrating Factor Method",
      ],
      "Probability": [
        "Conditional Probability",
        "Multiplication Theorem on Probability",
        "Independent Events",
        "Bayes' Theorem",
        "Random Variable and Its Probability Distribution",
        "Mean and Variance of a Random Variable",
        "Bernoulli Trials and Binomial Distribution",
        "Total Probability Theorem",
        "Properties of Conditional Probability",
        "Probability of Events",
        "Complement Rule",
        "Expected Value",
      ],
    },
    "Biology": {
      "Reproduction in Organisms": [
        "Modes of Reproduction",
        "Asexual Reproduction",
        "Asexual Reproduction – Fission",
        "Asexual Reproduction – Budding",
        "Asexual Reproduction – Fragmentation and Regeneration",
        "Vegetative Propagation",
        "Asexual Reproduction – Spore Formation",
        "Sexual Reproduction",
        "Phases of Sexual Reproduction",
        "Fertilisation",
        "Post-Fertilisation Events",
        "Significance of Sexual Reproduction",
      ],
      "Molecular Basis of Inheritance": [
        "DNA as Genetic Material",
        "Structure of Polynucleotide Chain",
        "Double Helix Structure of DNA",
        "Packaging of DNA Helix",
        "Replication of DNA",
        "Transcription",
        "Genetic Code",
        "Translation",
        "Regulation of Gene Expression – Lac Operon",
        "Human Genome Project",
        "DNA Fingerprinting",
        "Mutations and Genetic Disorders",
        "Central Dogma",
      ],
      "Evolution": [
        "Origin of Life",
        "Evolution of Life Forms – A Theory",
        "What is the Evidence for Evolution?",
        "Adaptive Radiation",
        "Biological Evolution",
        "Mechanism of Evolution",
        "Hardy-Weinberg Principle",
        "A Brief Account of Evolution",
        "Origin and Evolution of Man",
        "Lamarck's Theory",
        "Darwin's Theory of Natural Selection",
        "Speciation",
        "Mutation and Genetic Drift",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 8
  // ════════════════════════════════════════════
  "Class 8": {
    "Science": {
      "Crop Production and Management": [
        "Agricultural Practices",
        "Basic Practices of Crop Production",
        "Preparation of Soil",
        "Sowing",
        "Adding Manure and Fertilisers",
        "Irrigation",
        "Protection from Weeds",
        "Harvesting",
        "Storage",
        "Food from Animals",
        "Green Revolution",
        "Organic Farming",
      ],
      "Microorganisms: Friend and Foe": [
        "Microorganisms",
        "Where Do Microorganisms Live?",
        "Microorganisms and Us",
        "Harmful Microorganisms",
        "Food Preservation",
        "Nitrogen Fixation",
        "Nitrogen Cycle",
        "Vaccines and Antibiotics",
        "Microorganisms as Decomposers",
        "Protozoa, Bacteria, Fungi, Virus and Algae",
        "Role in Sewage Treatment",
        "Fermentation",
      ],
      "Coal and Petroleum": [
        "Natural Resources and Their Types",
        "Coal – Formation and Uses",
        "Destructive Distillation of Coal",
        "Petroleum – Formation and Occurrence",
        "Refining of Petroleum",
        "Fractions of Petroleum and Their Uses",
        "Natural Gas",
        "PCRA and Conservation",
        "Why Fossil Fuels Are Exhaustible",
        "Environmental Impact of Fossil Fuels",
        "Sustainable Use of Resources",
        "Alternative Sources of Energy (Introduction)",
      ],
      "Combustion and Flame": [
        "What is Combustion?",
        "How Do We Control Fire?",
        "Types of Combustion",
        "Flame and Its Structure",
        "Structure of a Candle Flame",
        "What is a Fuel?",
        "Fuel Efficiency – Calorific Value",
        "Combustion and Environment",
        "Ignition Temperature",
        "Conditions Necessary for Combustion",
        "Fire Extinguishers",
        "Acid Rain",
      ],
      "Force and Pressure": [
        "Force – A Push or Pull",
        "Effects of Force",
        "Exploration of Forces",
        "Pressure",
        "Pressure Exerted by Liquids and Gases",
        "Atmospheric Pressure",
        "Contact Forces – Muscular Force, Friction",
        "Non-Contact Forces – Gravity, Electrostatic, Magnetic",
        "Forces Are Due to an Interaction",
        "Pressure and Area",
        "Hydraulic Systems",
        "Archimedes and Buoyancy (Introduction)",
      ],
    },
    "Mathematics": {
      "Rational Numbers": [
        "Properties of Rational Numbers",
        "Closure Property",
        "Commutativity and Associativity",
        "The Role of Zero and One",
        "Negative of a Number",
        "Reciprocal of a Rational Number",
        "Distributivity of Multiplication",
        "Rational Numbers on Number Line",
        "Rational Numbers Between Two Rationals",
        "Operations on Rational Numbers",
        "Comparison of Rational Numbers",
        "Standard Form of Rational Numbers",
      ],
      "Linear Equations in One Variable": [
        "Introduction to Linear Equations",
        "Solving Equations with Linear Expressions",
        "Reducing Equations to Simpler Form",
        "Equations Reducible to Linear Form",
        "Cross-Multiplication",
        "Word Problems on Age",
        "Word Problems on Numbers",
        "Word Problems on Digits",
        "Transposing Terms",
        "Checking Solutions",
        "Linear Equations in Practical Problems",
        "Perimeter and Geometry Problems",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 7
  // ════════════════════════════════════════════
  "Class 7": {
    "Science": {
      "Nutrition in Plants": [
        "Mode of Nutrition in Plants",
        "Photosynthesis – Food Making in Plants",
        "Other Modes of Nutrition in Plants",
        "Saprotrophic Nutrition",
        "Parasitic Nutrition",
        "Insectivorous Plants",
        "How Nutrients Are Replenished in Soil",
        "Role of Chlorophyll",
        "Stomata and Gas Exchange",
        "Symbiotic Nutrition",
        "Autotrophic vs Heterotrophic Nutrition",
        "Rhizobium and Nitrogen Fixation",
      ],
      "Heat": [
        "Hot and Cold",
        "Measuring Temperature",
        "Laboratory Thermometer",
        "Transfer of Heat – Conduction",
        "Transfer of Heat – Convection",
        "Transfer of Heat – Radiation",
        "Kinds of Clothes We Wear",
        "Temperature and Thermometers",
        "Clinical Thermometer",
        "Sea Breeze and Land Breeze",
        "Insulators and Conductors",
        "Dark vs Light Colours and Heat",
      ],
    },
    "Mathematics": {
      "Integers": [
        "Recall of Integers",
        "Properties of Addition and Subtraction of Integers",
        "Multiplication of Integers",
        "Properties of Multiplication of Integers",
        "Division of Integers",
        "Properties of Division of Integers",
        "Representation on Number Line",
        "Absolute Value",
        "Ordering of Integers",
        "Word Problems on Integers",
        "Multiplication of Negative Integers",
        "Successor and Predecessor",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 6
  // ════════════════════════════════════════════
  "Class 6": {
    "Mathematics": {
      "Patterns in Mathematics": [
        "Patterns in Shapes",
        "Patterns in Numbers",
        "Number Sequences",
        "Odd and Even Numbers",
        "Triangular Numbers",
        "Square Numbers",
        "Virahanka Numbers (Fibonacci-like)",
        "Powers of 2",
        "Full Sequences",
        "Arithmetic Patterns",
        "Geometric Patterns",
        "Pattern Recognition in Real Life",
      ],
      "Number Play": [
        "Numbers Can Tell Us Things",
        "Supercells",
        "Patterns of Numbers on Grid",
        "Puzzles with Number Structures",
        "Digit-Sum Divisibility",
        "Divisibility Rules",
        "Playing with Digits",
        "Clock and Calendar Patterns",
        "Magic Squares",
        "Kaprekar Numbers",
        "Armstrong Numbers",
        "Number Tricks",
      ],
    },
    "Science": {
      "The Wonderful World of Science": [
        "Introduction to Science",
        "Scientific Method",
        "Observation and Inference",
        "Making Hypotheses",
        "Experiments and Evidence",
        "Science in Everyday Life",
        "Branches of Science",
        "Famous Scientists and Discoveries",
        "Tools of a Scientist",
        "Data Collection",
        "Safety in Science",
        "Science and Society",
      ],
    },
  },


}  // ── end CHAPTER_SUBTOPICS_CORE ──

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS — REMAINING SUBJECTS
// ══════════════════════════════════════════════════════════════
const CHAPTER_SUBTOPICS_EXTRA = {

// ════════════════════════════════════════════════════════════
//  CLASS 6 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 6": {
  "English": {
    "A Bottle of Dew": [
      "Introduction to the Story and Characters",
      "The Farmer and His Lazy Sons",
      "The Concept of Hard Work",
      "The Bottle of Dew – Symbolism",
      "Moral of the Story",
      "Character Analysis – Father",
      "Character Analysis – The Sons",
      "Vocabulary from the Story",
      "Reading Comprehension Questions",
      "Grammar – Nouns and Pronouns in the Story",
      "Creative Writing – Alternative Ending",
    ],
    "The Raven and the Fox": [
      "Introduction to Fables",
      "Characters – Raven and Fox",
      "Plot Summary",
      "The Concept of Flattery",
      "Moral of the Fable",
      "Aesop's Fables – Introduction",
      "Vocabulary – New Words",
      "Comprehension Questions",
      "Grammar – Adjectives in the Fable",
      "Role Play Activity",
      "Similar Fables and Comparison",
    ],
    "Neem Baba": [
      "Introduction to the Poem",
      "Theme – Nature and Environment",
      "Poetic Devices Used",
      "Significance of the Neem Tree",
      "Imagery in the Poem",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Environmental Awareness",
      "Creative Writing – Write About a Tree",
      "Role of Trees in Indian Culture",
    ],
  },
  "Hindi": {
    "वह चिड़िया जो": [
      "कविता का परिचय",
      "कवि का परिचय – केदारनाथ अग्रवाल",
      "चिड़िया की विशेषताएँ",
      "स्वतंत्रता का प्रतीक",
      "कविता का भावार्थ",
      "काव्य-सौंदर्य",
      "नए शब्द और अर्थ",
      "भाषा की विशेषताएँ",
      "प्रश्नोत्तर अभ्यास",
      "रचनात्मक लेखन",
      "प्रकृति और पक्षी",
    ],
    "बचपन": [
      "लेखिका का परिचय – कृष्णा सोबती",
      "बचपन की यादें",
      "पाठ का सारांश",
      "मुख्य पात्र और घटनाएँ",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "संस्मरण विधा",
      "प्रश्नोत्तर",
      "रचनात्मक लेखन",
      "बचपन और वर्तमान की तुलना",
      "व्याकरण – संज्ञा और सर्वनाम",
    ],
  },
  "Social Science": {
    "Locating Places on the Earth": [
      "The Globe",
      "Latitudes and Longitudes",
      "Prime Meridian and Standard Meridian",
      "Tropic of Cancer and Tropic of Capricorn",
      "Equator",
      "Time Zones",
      "Arctic and Antarctic Circles",
      "Heat Zones of the Earth",
      "Calculating Time Difference",
      "International Date Line",
      "Map Reading",
      "Geographic Coordinate System",
    ],
    "Oceans and Continents": [
      "The Seven Continents",
      "The Five Oceans",
      "Asia – Largest Continent",
      "Africa and Its Features",
      "North and South America",
      "Europe and Australia",
      "Antarctica",
      "Pacific, Atlantic, Indian, Arctic and Southern Oceans",
      "Distribution of Land and Water",
      "Continents and Their Boundaries",
      "Physical Features of Oceans",
      "Importance of Oceans",
    ],
    "India, That Is Bharat": [
      "Location of India",
      "India's Neighbours",
      "Physical Divisions of India",
      "Rivers of India – Major Ones",
      "Climate of India",
      "Natural Vegetation and Wildlife",
      "Cultural Diversity of India",
      "India's Languages and Religions",
      "Historical Names of India",
      "Significance of India's Position",
      "Administrative Divisions",
      "India in the World",
    ],
    "Grassroots Democracy — Part 1: Governance": [
      "What is Governance?",
      "Why Do We Need Government?",
      "Levels of Government",
      "Local Self-Government",
      "Gram Panchayat",
      "Panchayati Raj System",
      "Elections at Local Level",
      "Functions of Local Government",
      "Citizens and Governance",
      "Democracy and Participation",
      "Accountability in Governance",
      "Role of Gram Sabha",
    ],
  },
  "Sanskrit": {
    "वयं वर्णमालां पठामः": [
      "संस्कृत वर्णमाला – स्वर",
      "संस्कृत वर्णमाला – व्यंजन",
      "उच्चारण स्थान",
      "संस्कृत लिपि – देवनागरी",
      "स्वरों का वर्गीकरण",
      "व्यंजनों का वर्गीकरण",
      "संयुक्त वर्ण",
      "अनुस्वार और विसर्ग",
      "मात्राएँ",
      "वर्तनी अभ्यास",
      "उच्चारण अभ्यास",
    ],
    "अहं प्रातः उत्तिष्ठामि": [
      "दैनिक दिनचर्या",
      "क्रियाओं का परिचय",
      "वर्तमान काल – लट् लकार",
      "प्रथम पुरुष क्रिया रूप",
      "उत्तम पुरुष क्रिया रूप",
      "मध्यम पुरुष क्रिया रूप",
      "कारक परिचय",
      "शब्द भंडार – दिनचर्या सम्बन्धी",
      "अनुवाद अभ्यास",
      "संवाद लेखन",
      "प्रश्न-उत्तर",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 7 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 7": {
  "English": {
    "The Day the River Spoke": [
      "Introduction to the Story",
      "Theme – Nature's Communication",
      "Main Characters and Setting",
      "Plot Summary",
      "The River as a Character",
      "Environmental Message",
      "Vocabulary from the Lesson",
      "Comprehension Questions",
      "Grammar – Tenses Review",
      "Creative Writing – Rivers in India",
      "Value of Water Conservation",
    ],
    "Three Days to See": [
      "Introduction – Helen Keller",
      "Helen Keller's Life Story",
      "What She Would See on Day 1",
      "What She Would See on Day 2",
      "What She Would See on Day 3",
      "Theme – Value of Sight",
      "Gratitude and Perspective",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Conditional Sentences",
      "Inspirational Lesson",
    ],
  },
  "Hindi": {
    "हम पंछी उन्मुक्त गगन के": [
      "कवि का परिचय – शिवमंगल सिंह 'सुमन'",
      "कविता का भावार्थ",
      "स्वतंत्रता का प्रतीक",
      "पंछी और पिंजरा – प्रतीकात्मकता",
      "काव्य-सौंदर्य",
      "अलंकार",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "भाव-विस्तार",
      "रचनात्मक लेखन",
      "जीवन में स्वतंत्रता का महत्त्व",
    ],
    "दादी माँ": [
      "लेखक का परिचय – शिवप्रसाद सिंह",
      "पाठ का सारांश",
      "दादी माँ का चरित्र-चित्रण",
      "बचपन की यादें",
      "परिवार में बुजुर्गों का महत्त्व",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "व्याकरण – विशेषण",
      "संस्कार और परंपरा",
      "रचनात्मक लेखन",
    ],
  },
  "Social Science": {
    "Geographical Diversity of India": [
      "Physical Divisions of India",
      "The Himalayan Region",
      "The Northern Plains",
      "The Peninsular Plateau",
      "Coastal Plains",
      "Island Groups of India",
      "The Great Indian Desert",
      "Rivers of India",
      "Climate Diversity",
      "Natural Vegetation",
      "Wildlife and Biodiversity",
      "Human Adaptation to Geography",
    ],
    "New Beginnings: Cities and States": [
      "Rise of Mahajanapadas",
      "Sixteen Mahajanapadas",
      "Magadha – Rise to Power",
      "Republics and Monarchies",
      "Life in Cities",
      "Trade and Commerce",
      "Religion in This Period",
      "Buddhism and Jainism",
      "Vaishali and Licchavi Republic",
      "Alexander's Invasion",
      "Administrative System",
      "Art and Architecture",
    ],
    "The Constitution of India — An Introduction": [
      "What is a Constitution?",
      "Why Do We Need a Constitution?",
      "Making of the Indian Constitution",
      "The Preamble",
      "Fundamental Rights",
      "Directive Principles",
      "Fundamental Duties",
      "Separation of Powers",
      "Parliamentary System",
      "Federalism in India",
      "Amendments to the Constitution",
      "Role of the Judiciary",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 8 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 8": {
  "English": {
    "The Wit that Won Hearts": [
      "Introduction to Birbal",
      "Akbar and Birbal Stories",
      "Plot of the Story",
      "Wit and Intelligence Theme",
      "Moral of the Story",
      "Character Analysis – Birbal",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Direct and Indirect Speech",
      "Creative Writing – Write a Witty Story",
      "Importance of Presence of Mind",
    ],
    "The Cherry Tree": [
      "Introduction to the Poem",
      "Poet – Ruskin Bond",
      "Theme – Growth and Perseverance",
      "Symbolism of the Cherry Tree",
      "Poetic Devices",
      "Rhyme Scheme",
      "Imagery",
      "Vocabulary",
      "Comprehension Questions",
      "Creative Writing – Plant a Sapling",
      "Environmental Awareness",
    ],
  },
  "Hindi": {
    "ध्वनि": [
      "कवि का परिचय – सूर्यकांत त्रिपाठी 'निराला'",
      "कविता का भावार्थ",
      "वसंत ऋतु का वर्णन",
      "प्रकृति का उल्लास",
      "काव्य-सौंदर्य",
      "अलंकार – रूपक, उपमा",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "भाव-विस्तार",
      "रचनात्मक लेखन",
      "छंद और लय",
    ],
    "लाख की चूड़ियाँ": [
      "लेखक का परिचय – कामतानाथ",
      "पाठ का सारांश",
      "मुख्य पात्र – बचपन का मित्र",
      "पारंपरिक कला का महत्त्व",
      "आधुनिकता और परंपरा का संघर्ष",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "व्याकरण – क्रिया",
      "लाख उद्योग की जानकारी",
      "रचनात्मक लेखन",
    ],
  },
  "Social Science": {
    "Natural Resources and Their Use": [
      "Types of Natural Resources",
      "Renewable and Non-Renewable Resources",
      "Land as a Resource",
      "Water Resources",
      "Forest Resources",
      "Mineral Resources",
      "Coal and Petroleum",
      "Conservation of Natural Resources",
      "Resource Depletion",
      "Sustainable Development",
      "Human Impact on Natural Resources",
      "Resource Management Strategies",
    ],
    "Reshaping India's Political Map": [
      "Partition of India 1947",
      "Integration of Princely States",
      "Sardar Patel's Role",
      "States Reorganisation",
      "Linguistic Basis of State Formation",
      "States Reorganisation Act 1956",
      "North-East India",
      "Formation of New States",
      "Union Territories",
      "Maps Before and After Partition",
      "Challenges in Nation Building",
      "Current Political Map of India",
    ],
    "Universal Franchise and India's Electoral System": [
      "What is Universal Adult Franchise?",
      "History of Voting Rights",
      "Election Commission of India",
      "Types of Elections",
      "Lok Sabha Elections",
      "Rajya Sabha Elections",
      "State Assembly Elections",
      "Electoral Process",
      "Model Code of Conduct",
      "Role of EVMs",
      "NOTA Option",
      "Importance of Free and Fair Elections",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 9 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 9": {
  "English": {
    "The Fun They Had": [
      "Introduction to Isaac Asimov",
      "Setting – Future World (2157)",
      "Main Characters – Margie and Tommy",
      "The Mechanical Teacher",
      "Old Books vs Digital Learning",
      "Theme – Value of Traditional Education",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Past Tense",
      "Creative Writing – School of the Future",
      "Technology in Education",
    ],
    "The Sound of Music": [
      "Part I – Evelyn Glennie",
      "Evelyn's Hearing Loss",
      "How Evelyn Learned Music",
      "Evelyn's Achievements",
      "Part II – Bismillah Khan",
      "Bismillah Khan's Early Life",
      "His Devotion to Shehnai",
      "National and International Recognition",
      "Vocabulary",
      "Comprehension Questions",
      "Perseverance and Dedication",
      "Music and Indian Culture",
    ],
    "A Truly Beautiful Mind": [
      "Albert Einstein's Early Life",
      "School Years and Difficulties",
      "Special Theory of Relativity",
      "Einstein and the Atomic Bomb",
      "Einstein's Personal Life",
      "Nobel Prize in Physics",
      "Einstein's Philosophy",
      "His Work for Peace",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Compound Sentences",
      "Scientists Who Changed the World",
    ],
    "My Childhood": [
      "Abdul Kalam's Early Life",
      "His Family and Background",
      "School Days in Rameswaram",
      "Influence of Teachers",
      "Communal Harmony in Rameswaram",
      "His First Earning",
      "Personality Development",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Adverbs",
      "Values – Hard Work and Respect",
    ],
    "The Road Not Taken": [
      "Introduction to Robert Frost",
      "Theme of Choices in Life",
      "The Two Roads – Symbolism",
      "Rhyme Scheme and Structure",
      "Poetic Devices",
      "Imagery in the Poem",
      "The Speaker's Dilemma",
      "Vocabulary",
      "Comprehension Questions",
      "Life Lessons from the Poem",
      "Creative Writing – A Choice You Made",
    ],
    "Wind": [
      "Introduction to Subramania Bharati",
      "Theme – Strength and Perseverance",
      "Wind as a Symbol",
      "Poetic Devices – Personification",
      "Metaphor and Imagery",
      "Message to Readers",
      "Vocabulary",
      "Comprehension Questions",
      "Rhyme Scheme",
      "Creative Writing",
      "Nature in Indian Poetry",
    ],
  },
  "Hindi": {
    "दो बैलों की कथा": [
      "लेखक का परिचय – प्रेमचंद",
      "पाठ का सारांश",
      "मुख्य पात्र – हीरा और मोती",
      "स्वतंत्रता की भावना",
      "पशुओं के प्रति संवेदना",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "व्याकरण – मुहावरे और लोकोक्तियाँ",
      "रचनात्मक लेखन",
      "राष्ट्रीय आंदोलन का संकेत",
    ],
    "ल्हासा की ओर": [
      "लेखक का परिचय – राहुल सांकृत्यायन",
      "यात्रा-वृत्तांत विधा",
      "तिब्बत की भौगोलिक स्थिति",
      "यात्रा का मार्ग",
      "स्थानीय लोग और संस्कृति",
      "बौद्ध धर्म का प्रभाव",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "व्याकरण",
      "रचनात्मक लेखन",
    ],
    "रैदास के पद": [
      "कवि का परिचय – रैदास",
      "भक्ति आंदोलन",
      "पदों का भावार्थ",
      "ईश्वर भक्ति",
      "समाज सुधार",
      "काव्य-सौंदर्य",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "अलंकार",
      "निर्गुण भक्ति",
      "रचनात्मक लेखन",
    ],
    "अग्नि पथ": [
      "कवि का परिचय – हरिवंश राय बच्चन",
      "कविता का भावार्थ",
      "जीवन संघर्ष का संदेश",
      "काव्य-सौंदर्य",
      "अलंकार",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "प्रेरणादायक संदेश",
      "छंद और लय",
      "रचनात्मक लेखन",
      "जीवन दर्शन",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 10 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 10": {
  "English": {
    "A Letter to God": [
      "Introduction to the Story",
      "Main Character – Lencho",
      "Setting – Rural Mexico",
      "Lencho's Faith in God",
      "The Hailstorm",
      "The Letter to God",
      "Post Office Workers' Reaction",
      "Irony in the Story",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Faith and Irony",
      "Grammar – Simple Past Tense",
    ],
    "Nelson Mandela: Long Walk to Freedom": [
      "Nelson Mandela's Life Story",
      "Apartheid in South Africa",
      "The Inauguration Speech",
      "Mandela's Vision of Freedom",
      "The Twin Obligations",
      "Freedom and Responsibilities",
      "African National Congress (ANC)",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Struggle for Freedom",
      "Grammar – Complex Sentences",
      "Mandela's Legacy",
    ],
    "From the Diary of Anne Frank": [
      "Anne Frank's Background",
      "The Holocaust Context",
      "Anne and Her Diary",
      "Anne and Kitty (Her Diary)",
      "Life in Hiding",
      "Anne's Thoughts on Writing",
      "The Relationship with Her Father",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – War and Childhood",
      "Grammar – Reported Speech",
      "Human Rights and Dignity",
    ],
    "Dust of Snow": [
      "Introduction to Robert Frost",
      "Theme – Small Moments of Joy",
      "The Crow and the Hemlock Tree",
      "Symbolism in the Poem",
      "Mood Change",
      "Poetic Devices",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Life Lesson from the Poem",
      "Nature in Poetry",
    ],
    "Fire and Ice": [
      "Introduction to Robert Frost",
      "Theme – Destruction of the World",
      "Fire as Symbol of Desire",
      "Ice as Symbol of Hatred",
      "Poetic Devices",
      "Tone of the Poem",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Human Emotions and Their Consequences",
      "Creative Writing",
    ],
    "The Ball Poem": [
      "Introduction to John Berryman",
      "Theme – Loss and Responsibility",
      "The Boy Losing His Ball",
      "Acceptance of Loss",
      "Growing Up",
      "Poetic Devices",
      "Imagery",
      "Vocabulary",
      "Comprehension Questions",
      "Life Lessons",
      "Creative Writing",
    ],
    "Amanda": [
      "Introduction to Robin Klein",
      "Amanda's Daydreams",
      "Orphan Dream",
      "Rapunzel Dream",
      "Mermaid Dream",
      "Theme – Freedom vs Control",
      "Poetic Devices",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Children and Freedom",
    ],
    "The Thief's Story": [
      "Introduction to Ruskin Bond",
      "Main Character – Hari Singh",
      "Anil's Character",
      "The Plan to Steal",
      "Change of Heart",
      "Theme – Trust and Transformation",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Infinitives",
      "Values – Honesty and Trust",
      "Character Development",
    ],
    "Bholi": [
      "Introduction to K.A. Abbas",
      "Bholi's Character",
      "Social Issues – Girl Child",
      "Role of Education",
      "Bholi at School",
      "The Marriage Scene",
      "Bholi's Transformation",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Empowerment through Education",
      "Grammar – Modal Verbs",
    ],
  },
  "Hindi": {
    "सूरदास के पद": [
      "कवि का परिचय – सूरदास",
      "कृष्ण भक्ति",
      "पदों का भावार्थ",
      "वात्सल्य रस",
      "काव्य-सौंदर्य",
      "अलंकार – उपमा, रूपक",
      "ब्रज भाषा की विशेषताएँ",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "सगुण भक्ति",
      "रचनात्मक लेखन",
    ],
    "तुलसीदास की रामभक्ति": [
      "कवि का परिचय – तुलसीदास",
      "रामचरितमानस",
      "पदों का भावार्थ",
      "दास्य भक्ति",
      "काव्य-सौंदर्य",
      "अवधी भाषा",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "रस और अलंकार",
      "भक्ति आंदोलन में तुलसी का योगदान",
      "रचनात्मक लेखन",
    ],
    "नेताजी का चश्मा": [
      "लेखक का परिचय – स्वयं प्रकाश",
      "पाठ का सारांश",
      "नेताजी की मूर्ति",
      "कैप्टन चश्मेवाला का चरित्र",
      "देशभक्ति की भावना",
      "बच्चों का योगदान",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "राष्ट्रीय चेतना",
      "रचनात्मक लेखन",
    ],
    "बालगोबिन भगत": [
      "लेखक का परिचय – रामवृक्ष बेनीपुरी",
      "पाठ का सारांश",
      "बालगोबिन भगत का चरित्र-चित्रण",
      "कबीरपंथी जीवन-दर्शन",
      "रेखाचित्र विधा",
      "पुत्र की मृत्यु का प्रसंग",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "सामाजिक संदेश",
      "रचनात्मक लेखन",
    ],
  },
  "Social Science": {
    "The Rise of Nationalism in Europe": [
      "The French Revolution and the Idea of the Nation",
      "The Making of Nationalism in Europe",
      "The Age of Revolutions: 1830-1848",
      "The Making of Germany and Italy",
      "Visualising the Nation",
      "Nationalism and Imperialism",
      "Romantic Nationalism",
      "Giuseppe Mazzini and Young Italy",
      "Bismarck and German Unification",
      "The Habsburg Empire",
      "Revolutions of 1848",
      "Decline of the Ottoman Empire",
    ],
    "The Making of a Global World": [
      "The Pre-Modern World",
      "The Nineteenth Century (1815-1914)",
      "The Interwar Economy",
      "Rebuilding a World Economy: The Post-War Era",
      "The Silk Routes",
      "Food Travels: Spaghetti and Potato",
      "Conquest, Disease and Trade",
      "The World Economy in the Late 19th Century",
      "Indentured Labour",
      "The Great Depression",
      "Post-War Settlement and Bretton Woods",
      "Globalisation and Economic Crisis",
    ],
    "Agriculture": [
      "Types of Farming",
      "Subsistence Farming",
      "Commercial Farming",
      "Plantation Agriculture",
      "Agricultural Development",
      "Major Crops of India",
      "Food Crops – Rice and Wheat",
      "Cash Crops – Cotton, Jute, Sugarcane",
      "Oilseeds and Pulses",
      "Agricultural Seasons – Rabi, Kharif, Zaid",
      "Irrigation Methods",
      "Agricultural Reforms in India",
    ],
    "Political Parties": [
      "Why Do We Need Political Parties?",
      "How Many Parties Should We Have?",
      "National Political Parties",
      "State Parties",
      "Challenges to Political Parties",
      "How Can Parties Be Reformed?",
      "Functions of Political Parties",
      "Party System in India",
      "Congress Party History",
      "BJP and Its History",
      "Left Parties in India",
      "Role of Opposition",
    ],
    "Globalisation and the Indian Economy": [
      "What is Globalisation?",
      "Factors that Have Enabled Globalisation",
      "World Trade Organisation",
      "Impact of Globalisation on India",
      "The Struggle for a Fair Globalisation",
      "Liberalisation, Privatisation and Globalisation",
      "Foreign Direct Investment",
      "Multi-National Corporations",
      "Effects on Indian Farmers",
      "Effects on Small Industries",
      "1991 Economic Reforms",
      "Global Trade Agreements",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 11 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 11": {
  "English": {
    "The Portrait of a Lady": [
      "Introduction to Khushwant Singh",
      "The Grandmother's Physical Description",
      "Three Phases of Relationship",
      "Childhood in the Village",
      "School in the City",
      "College and Grandmother's Loneliness",
      "The Farewell and Death",
      "Theme – Bond Across Generations",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Relative Clauses",
      "Old Age and Loneliness",
    ],
    "We're Not Afraid to Die": [
      "Introduction to Gordon Cook and Alan East",
      "The Voyage Plan",
      "The Storm",
      "Damage to the Wavewalker",
      "The Children's Courage",
      "Finding Amsterdam Island",
      "Role of Jonathan (6-year-old)",
      "Survival Spirit",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Courage and Survival",
      "Grammar – Participial Phrases",
    ],
    "Discovering Tut: the Saga Continues": [
      "Introduction to King Tutankhamun",
      "CT Scan of Tutankhamun's Mummy",
      "The History of Tut's Dynasty",
      "Tut's Death – Theories",
      "Howard Carter's Discovery",
      "Modern Science and Archaeology",
      "Valley of the Kings",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Science and History",
      "Grammar – Passive Voice",
      "Egyptian Civilisation",
    ],
    "The Browning Version": [
      "Introduction to Terence Rattigan",
      "Crocker-Harris – The Teacher",
      "Taplow – The Student",
      "The Gift of the Book",
      "Theme – Appreciation and Humility",
      "Emotional Moment in the Play",
      "Character of Mrs Crocker-Harris",
      "Vocabulary",
      "Comprehension Questions",
      "Drama as a Literary Form",
      "Grammar – Reported Speech",
      "Teacher-Student Relationship",
    ],
    "A Photograph": [
      "Introduction to Shirley Toulson",
      "Theme – Memory and Loss",
      "Three Moments in Time",
      "The Photograph of the Mother",
      "Mother's Childhood",
      "The Poet's Grief",
      "Poetic Devices",
      "Rhyme and Structure",
      "Vocabulary",
      "Comprehension Questions",
      "Time and Change",
      "Relationship with Mother",
    ],
    "The Laburnum Top": [
      "Introduction to Ted Hughes",
      "The Tree and the Goldfinch",
      "Imagery in the Poem",
      "The Tree as a Symbol",
      "Life and Movement",
      "Poetic Devices",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Nature Poetry",
      "Creative Writing",
    ],
    "Childhood": [
      "Introduction to Markus Natten",
      "Theme – Transition from Childhood",
      "Three Stages of Discovery",
      "Heaven and Hell",
      "Adults and Hypocrisy",
      "The Mind's Freedom",
      "Vocabulary",
      "Comprehension Questions",
      "Poetic Devices",
      "Loss of Innocence",
      "Creative Writing",
    ],
  },
  "Hindi": {
    "हम तौ एक एक करि जाना": [
      "कवि का परिचय – कबीर",
      "पदों का भावार्थ",
      "ईश्वर की एकता का संदेश",
      "निर्गुण भक्ति",
      "काव्य-सौंदर्य",
      "अलंकार",
      "सधुक्कड़ी भाषा",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "सामाजिक संदेश",
      "रचनात्मक लेखन",
    ],
    "आत्मपरिचय व एक गीत": [
      "कवि का परिचय – हरिवंश राय बच्चन",
      "आत्मपरिचय का भावार्थ",
      "एक गीत का भावार्थ",
      "प्रेम और जीवन दर्शन",
      "काव्य-सौंदर्य",
      "गीत की संरचना",
      "अलंकार",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "व्यक्तिवाद और हालावाद",
      "रचनात्मक लेखन",
    ],
    "नमक का दारोगा": [
      "लेखक का परिचय – प्रेमचंद",
      "पाठ का सारांश",
      "मुंशी वंशीधर का चरित्र",
      "पंडित अलोपीदीन का चरित्र",
      "ईमानदारी बनाम भ्रष्टाचार",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "सामाजिक व्यंग्य",
      "कहानी का संदेश",
      "रचनात्मक लेखन",
    ],
    "स्पीति में बारिश": [
      "लेखक का परिचय – कृष्णनाथ",
      "यात्रा-वृत्तांत",
      "स्पीति का भौगोलिक परिचय",
      "वहाँ की जलवायु",
      "स्थानीय जीवन",
      "बारिश का महत्त्व",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "हिमालयी क्षेत्रों की विशेषताएँ",
      "रचनात्मक लेखन",
    ],
  },
  "Accountancy": {
    "Introduction to Accounting": [
      "Definition and Scope of Accounting",
      "Objectives of Accounting",
      "Users of Accounting Information",
      "Branches of Accounting",
      "Basic Terminology in Accounting",
      "Assets, Liabilities and Capital",
      "Revenue and Expenses",
      "Accounting as an Information System",
      "Limitations of Accounting",
      "Accounting and Book-Keeping Difference",
      "Role of Accountant",
      "Accounting in Business",
    ],
    "Theory Base of Accounting": [
      "Generally Accepted Accounting Principles (GAAP)",
      "Accounting Concepts – Business Entity",
      "Money Measurement Concept",
      "Going Concern Concept",
      "Accounting Period Concept",
      "Cost Concept",
      "Dual Aspect Concept",
      "Realisation Concept",
      "Accrual Concept",
      "Matching Concept",
      "Consistency Concept",
      "Materiality, Prudence and Full Disclosure",
    ],
    "Recording of Transactions I": [
      "Business Transactions and Source Documents",
      "Accounting Equation",
      "Using Debit and Credit",
      "Books of Original Entry – Journal",
      "Journalising Transactions",
      "Rules of Debit and Credit",
      "Opening Entry",
      "Compound Journal Entry",
      "Ledger",
      "Posting from Journal to Ledger",
      "Balancing of Accounts",
      "Trial Balance Introduction",
    ],
    "Recording of Transactions II": [
      "Cash Book – Simple",
      "Cash Book – Double Column",
      "Cash Book – Triple Column",
      "Petty Cash Book",
      "Purchases Book",
      "Sales Book",
      "Purchase Returns Book",
      "Sales Returns Book",
      "Bills Receivable and Bills Payable Books",
      "Journal Proper",
      "Contra Entry",
      "Posting from Special Purpose Books",
    ],
    "Bank Reconciliation Statement": [
      "Meaning and Need of BRS",
      "Causes of Difference Between Cash Book and Pass Book",
      "Preparation of BRS Starting from Cash Book Balance",
      "Preparation of BRS Starting from Pass Book Balance",
      "Adjusted Cash Book",
      "Bank Charges and Bank Interest",
      "Cheques Issued but Not Presented",
      "Cheques Deposited but Not Credited",
      "Direct Deposits by Bank",
      "Errors in Cash Book and Pass Book",
      "Format of BRS",
      "Importance of BRS",
    ],
    "Depreciation Provisions and Reserves": [
      "Meaning of Depreciation",
      "Causes of Depreciation",
      "Straight Line Method (SLM)",
      "Written Down Value Method (WDV)",
      "Comparison of SLM and WDV",
      "Depreciation under Companies Act",
      "Provision and Reserve – Distinction",
      "Types of Reserves",
      "Accounting Treatment of Depreciation",
      "Change in Method of Depreciation",
      "Sinking Fund Method (Introduction)",
      "Disposal of Assets",
    ],
    "Financial Statements I": [
      "Meaning and Objectives of Financial Statements",
      "Trading Account",
      "Profit and Loss Account",
      "Balance Sheet",
      "Adjustments – Closing Stock",
      "Adjustments – Outstanding Expenses",
      "Adjustments – Prepaid Expenses",
      "Adjustments – Accrued Income",
      "Adjustments – Income Received in Advance",
      "Adjustments – Depreciation",
      "Adjustments – Bad Debts and Provision",
      "Adjustments – Interest on Capital and Drawings",
    ],
  },
  "Economics": {
    "Indian Economy on the Eve of Independence": [
      "India's Economy Under Colonial Rule",
      "Agricultural Sector Under British",
      "Industrial Sector Under British",
      "Foreign Trade Under British",
      "Demographic Profile at Independence",
      "Occupational Structure",
      "Infrastructure Development Under British",
      "Per Capita Income",
      "Drain of Wealth",
      "Economic Impact of British Policies",
      "India at the Time of Independence",
      "Challenges at Independence",
    ],
    "Indian Economy 1950–1990": [
      "Goals of Five Year Plans",
      "Agriculture – Land Reforms",
      "Agriculture – Green Revolution",
      "Industrial Policy Resolution 1956",
      "Public Sector and Private Sector",
      "Trade Policy – Import Substitution",
      "Infrastructure Development",
      "Role of Planning Commission",
      "Achievements and Failures of Planning",
      "Small Scale Industries",
      "Criticism of Indian Planning",
      "Licence Raj",
    ],
    "Liberalisation Privatisation and Globalisation": [
      "Background of 1991 Reforms",
      "Balance of Payments Crisis 1991",
      "New Economic Policy 1991",
      "Liberalisation – Meaning and Measures",
      "Privatisation – Meaning and Measures",
      "Globalisation – Meaning and Measures",
      "WTO and India",
      "Demonetisation",
      "GST",
      "Make in India",
      "Impact on Indian Economy",
      "Criticism of LPG Reforms",
    ],
    "Poverty": [
      "Concept and Measurement of Poverty",
      "Poverty Line",
      "Estimation of Poverty in India",
      "Causes of Poverty",
      "Poverty Alleviation Programmes",
      "NREGA (MGNREGS)",
      "PDS – Public Distribution System",
      "Rural Poverty vs Urban Poverty",
      "Multidimensional Poverty Index",
      "Poverty in Bihar and Odisha",
      "Role of NGOs in Poverty Alleviation",
      "Sustainable Development Goals and Poverty",
    ],
    "Introduction to Statistics": [
      "What is Statistics?",
      "Scope and Importance of Statistics",
      "Functions of Statistics",
      "Limitations of Statistics",
      "Types of Statistical Data",
      "Primary and Secondary Data",
      "Sources of Secondary Data",
      "Methods of Collecting Primary Data",
      "Census and Sample Investigation",
      "Statistical Investigation Steps",
      "Statistics in Economics",
      "Data Collection Errors",
    ],
    "Collection of Data": [
      "Sources of Data",
      "Primary Data Collection Methods",
      "Direct Personal Interview",
      "Indirect Oral Interview",
      "Questionnaire Method",
      "Mailed Questionnaire",
      "Telephone Interview",
      "Secondary Data Sources",
      "Census of India",
      "NSS Data",
      "Qualities of a Good Questionnaire",
      "Pilot Survey",
    ],
    "Organisation of Data": [
      "Raw Data and Classification",
      "Basis of Classification",
      "Geographical Classification",
      "Chronological Classification",
      "Qualitative Classification",
      "Quantitative Classification",
      "Frequency Distribution",
      "Tally Bars",
      "Class Intervals and Class Limits",
      "Exclusive and Inclusive Series",
      "Cumulative Frequency Distribution",
      "Open-End Classes",
    ],
    "Measures of Central Tendency": [
      "Meaning of Central Tendency",
      "Arithmetic Mean – Simple",
      "Arithmetic Mean – Weighted",
      "Arithmetic Mean for Grouped Data",
      "Combined Mean",
      "Median – Ungrouped Data",
      "Median – Grouped Data",
      "Mode – Ungrouped Data",
      "Mode – Grouped Data",
      "Relationship Between Mean, Median and Mode",
      "Merits and Demerits of Mean",
      "Merits and Demerits of Median and Mode",
    ],
    "Measures of Dispersion": [
      "Meaning and Importance of Dispersion",
      "Range",
      "Quartile Deviation",
      "Mean Deviation from Mean",
      "Mean Deviation from Median",
      "Standard Deviation",
      "Variance",
      "Coefficient of Variation",
      "Lorenz Curve",
      "Standard Deviation for Grouped Data",
      "Combined Standard Deviation",
      "Comparison of Measures of Dispersion",
    ],
  },
  "Business Studies": {
    "Nature and Purpose of Business": [
      "Concept of Business",
      "Characteristics of Business",
      "Objectives of Business",
      "Classification of Business Activities",
      "Industry – Types",
      "Commerce – Trade and Auxiliaries",
      "Business Risks",
      "Starting a Business",
      "Concept of Profession and Employment",
      "Role of Profit in Business",
      "Social Responsibilities of Business",
      "Business and Society",
    ],
    "Forms of Business Organisation": [
      "Sole Proprietorship",
      "Partnership",
      "Types of Partners",
      "Types of Partnership Firms",
      "Partnership Deed",
      "Joint Hindu Family Business",
      "Cooperative Societies",
      "Types of Cooperative Societies",
      "Company – Private and Public",
      "Merits and Limitations of Each Form",
      "Multinational Companies",
      "Choice of Form of Organisation",
    ],
    "Sources of Business Finance": [
      "Concept of Business Finance",
      "Owner's Funds",
      "Borrowed Funds",
      "Equity Shares",
      "Preference Shares",
      "Debentures",
      "Public Deposits",
      "Commercial Banks – Loans",
      "Trade Credit",
      "Retained Earnings",
      "Venture Capital",
      "Factors Affecting Choice of Finance",
    ],
    "Internal Trade": [
      "Concept of Internal Trade",
      "Wholesale Trade",
      "Retail Trade",
      "Types of Retailers",
      "Small Scale Retailers",
      "Large Scale Retailers – Departmental Store",
      "Chain Stores",
      "Mail Order Business",
      "Consumer Cooperative Stores",
      "Supermarkets",
      "E-Tailing",
      "Role of Trade in Economy",
    ],
  },
  "Computer Science": {
    "Computer Overview": [
      "Characteristics of Computer",
      "Basic Organisation of Computer",
      "Evolution of Computers",
      "Generations of Computers",
      "Types of Computers",
      "Hardware Components",
      "Software – System and Application",
      "Input and Output Devices",
      "Memory – Primary and Secondary",
      "Number Systems",
      "Boolean Logic",
      "Computer Applications",
    ],
    "Getting Started with Python": [
      "Introduction to Python",
      "Features of Python",
      "Installing Python and IDLE",
      "Python Interactive Mode",
      "Python Script Mode",
      "Variables and Data Types",
      "Operators in Python",
      "Input and Output Statements",
      "Type Conversion",
      "Comments in Python",
      "Errors in Python",
      "Writing First Program",
    ],
    "Functions": [
      "Introduction to Functions",
      "Built-in Functions",
      "User-Defined Functions",
      "Function Definition and Calling",
      "Parameters and Arguments",
      "Return Statement",
      "Scope of Variables – Local and Global",
      "Recursive Functions",
      "Lambda Functions",
      "Default Parameters",
      "Positional and Keyword Arguments",
      "Advantages of Functions",
    ],
    "Strings": [
      "String Data Type",
      "String Operations",
      "String Indexing and Slicing",
      "String Functions and Methods",
      "String Formatting",
      "Iterating Over Strings",
      "String Comparison",
      "Membership Operators",
      "Built-in Functions for Strings",
      "String Immutability",
      "Escape Sequences",
      "String Programs",
    ],
    "Lists": [
      "Introduction to Lists",
      "Creating and Accessing Lists",
      "List Operations",
      "List Slicing",
      "List Methods",
      "Nested Lists",
      "List Comprehension",
      "Iterating Over Lists",
      "Mutable Nature of Lists",
      "Built-in Functions for Lists",
      "Sorting and Reversing",
      "List Programs",
    ],
    "Tuples": [
      "Introduction to Tuples",
      "Creating Tuples",
      "Accessing Tuple Elements",
      "Tuple Operations",
      "Tuple Methods",
      "Tuple vs List",
      "Immutability of Tuples",
      "Nested Tuples",
      "Unpacking Tuples",
      "Built-in Functions for Tuples",
      "Use Cases of Tuples",
      "Tuple Programs",
    ],
    "Dictionaries": [
      "Introduction to Dictionaries",
      "Creating Dictionaries",
      "Accessing Values",
      "Dictionary Methods",
      "Adding and Modifying Elements",
      "Deleting Elements",
      "Iterating Over Dictionaries",
      "Nested Dictionaries",
      "Dictionary Comprehension",
      "Built-in Functions for Dictionaries",
      "Use Cases of Dictionaries",
      "Dictionary Programs",
    ],
  },
},

// ════════════════════════════════════════════════════════════
//  CLASS 12 — Remaining Subjects
// ════════════════════════════════════════════════════════════

"Class 12": {
  "English": {
    "The Last Lesson": [
      "Introduction to Alphonse Daudet",
      "Setting – Alsace-Lorraine, Franco-Prussian War",
      "Franz and His Morning",
      "M. Hamel – The Teacher",
      "The Last French Lesson",
      "Theme – Loss of Language and Identity",
      "Prussian Order and Its Impact",
      "Symbolism in the Story",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Participial Phrases",
      "Patriotism and Language",
    ],
    "Lost Spring": [
      "Part I – Saheb and His Life",
      "Rag Picking in Seemapuri",
      "Dreams of Saheb",
      "Part II – Mukesh and His Life",
      "Glass Bangle Industry in Firozabad",
      "Tradition vs Aspiration",
      "Child Labour",
      "Poverty and Vicious Cycle",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Poverty and Dreams",
      "Social Justice",
    ],
    "Deep Water": [
      "Introduction to William O. Douglas",
      "The Fear of Water",
      "Childhood Incident at YMCA Pool",
      "The Misadventure",
      "Overcoming Fear",
      "Learning to Swim",
      "Theme – Conquering Fear",
      "The Terror at Warm Lake",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Gerunds",
      "Courage and Determination",
    ],
    "My Mother at Sixty-six": [
      "Introduction to Kamala Das",
      "Imagery – Mother's Pale Face",
      "The Drive to Airport",
      "Childhood Fear of Loss",
      "Imagery – Sprinting Trees and Children",
      "The Farewell at Airport",
      "Theme – Ageing and Fear of Loss",
      "Poetic Devices",
      "Rhyme Scheme",
      "Vocabulary",
      "Comprehension Questions",
      "Mother-Child Bond",
    ],
    "Keeping Quiet": [
      "Introduction to Pablo Neruda",
      "Theme – Silence and Introspection",
      "Call for a Moment of Silence",
      "Pause in Human Activity",
      "Nature and Silence",
      "Anti-War Message",
      "Poetic Devices",
      "Imagery",
      "Vocabulary",
      "Comprehension Questions",
      "Universal Brotherhood",
      "Creative Writing",
    ],
    "A Thing of Beauty": [
      "Introduction to John Keats",
      "Theme – Beauty as a Source of Joy",
      "Examples of Beauty in Nature",
      "Bower of Sleep",
      "Beauty Never Passes",
      "Poetic Devices",
      "Imagery and Symbolism",
      "Vocabulary",
      "Comprehension Questions",
      "Romantic Poetry Features",
      "Creative Writing",
    ],
    "The Tiger King": [
      "Introduction to Kalki",
      "The Tiger King's Prophecy",
      "His Campaign Against Tigers",
      "Marriage for the Purpose of Hunting",
      "The 100th Tiger",
      "The Wooden Tiger",
      "Satire in the Story",
      "Theme – Arrogance and Fate",
      "Vocabulary",
      "Comprehension Questions",
      "Grammar – Participial Phrases",
      "Wildlife Conservation Message",
    ],
    "Journey to the End of the Earth": [
      "Introduction – Tishani Doshi",
      "Antarctica – The Last Frontier",
      "The Journey – Akademik Shokalskiy",
      "Significance of Antarctica",
      "Environmental Concerns",
      "Ice and Its Significance",
      "Impact of Global Warming",
      "Vocabulary",
      "Comprehension Questions",
      "Theme – Environment and Human Responsibility",
      "Grammar – Infinitives",
      "Climate Change Awareness",
    ],
  },
  "Hindi": {
    "आत्म-परिचय": [
      "कवि का परिचय – हरिवंश राय बच्चन",
      "कविता का भावार्थ",
      "जीवन-दर्शन",
      "प्रेम और विरह",
      "काव्य-सौंदर्य",
      "अलंकार",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "छंद",
      "हालावाद",
      "रचनात्मक लेखन",
    ],
    "पतंग": [
      "कवि का परिचय – आलोक धन्वा",
      "कविता का भावार्थ",
      "बचपन और उत्साह",
      "पतंग का प्रतीकात्मक अर्थ",
      "काव्य-सौंदर्य",
      "बिम्ब और प्रतीक",
      "अलंकार",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "जीवन की उड़ान",
      "रचनात्मक लेखन",
    ],
    "भक्तिन": [
      "लेखिका का परिचय – महादेवी वर्मा",
      "भक्तिन का परिचय",
      "जीवन संघर्ष",
      "महादेवी के साथ संबंध",
      "सामाजिक स्थिति",
      "संस्मरण विधा",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "नारी जीवन",
      "रचनात्मक लेखन",
    ],
    "बाज़ार दर्शन": [
      "लेखक का परिचय – जैनेंद्र कुमार",
      "निबंध का सारांश",
      "बाज़ार और उपभोक्तावाद",
      "मन की भूख",
      "बाज़ार का जादू",
      "भगत की दुकान",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "उपभोक्तावाद का विरोध",
      "रचनात्मक लेखन",
    ],
    "श्रम-विभाजन और जाति-प्रथा": [
      "लेखक का परिचय – डॉ. भीमराव आंबेडकर",
      "निबंध का सारांश",
      "जाति-प्रथा की समस्या",
      "श्रम-विभाजन बनाम जाति-विभाजन",
      "आर्थिक पहलू",
      "सामाजिक न्याय",
      "भाषा-शैली",
      "नए शब्द और अर्थ",
      "प्रश्नोत्तर",
      "आंबेडकर का दृष्टिकोण",
      "रचनात्मक लेखन",
    ],
  },
  "Accountancy": {
    "Accounting for Not-for-Profit Organisation": [
      "Characteristics of Not-for-Profit Organisations",
      "Receipts and Payments Account",
      "Income and Expenditure Account",
      "Balance Sheet of NPO",
      "Subscriptions – Treatment",
      "Distinction Between Receipts & Payments and Income & Expenditure",
      "Capital Fund",
      "Specific Funds",
      "Tournament Fund, Match Fund",
      "Legacies and Donations",
      "Preparing Income and Expenditure from Receipts and Payments",
      "Opening Balance Sheet",
    ],
    "Accounting for Partnership: Basic Concepts": [
      "Nature of Partnership",
      "Partnership Deed",
      "Fixed vs Fluctuating Capital",
      "Profit and Loss Appropriation Account",
      "Interest on Capital",
      "Interest on Drawings",
      "Partner's Salary and Commission",
      "Guarantee of Profit",
      "Past Adjustments",
      "Preparation of Capital Accounts",
      "Current Accounts of Partners",
      "Distribution of Profit",
    ],
    "Reconstitution of a Partnership Firm – Admission of a Partner": [
      "Admission of a New Partner",
      "New Profit Sharing Ratio",
      "Sacrificing Ratio",
      "Goodwill – Meaning and Nature",
      "Valuation of Goodwill",
      "Treatment of Goodwill",
      "Revaluation of Assets and Liabilities",
      "Revaluation Account",
      "Adjustment of Accumulated Profits and Losses",
      "Capital Adjustment",
      "Change in Profit Sharing Ratio",
      "Balance Sheet After Admission",
    ],
    "Reconstitution of a Partnership Firm – Retirement/Death of a Partner": [
      "Retirement of a Partner",
      "Gaining Ratio",
      "Treatment of Goodwill on Retirement",
      "Revaluation of Assets on Retirement",
      "Adjustment of Accumulated Reserves",
      "Settlement of Retiring Partner's Dues",
      "Death of a Partner",
      "Executors' Account",
      "Treatment of Goodwill on Death",
      "Calculation of Share in Profit up to Death",
      "Joint Life Policy",
      "Balance Sheet After Retirement",
    ],
    "Accounting for Share Capital": [
      "Shares and Share Capital",
      "Types of Share Capital",
      "Issue of Shares at Par",
      "Issue of Shares at Premium",
      "Issue of Shares at Discount",
      "Application, Allotment and Calls",
      "Forfeiture of Shares",
      "Reissue of Forfeited Shares",
      "Share Certificate",
      "Minimum Subscription",
      "Over-subscription and Pro-rata Allotment",
      "Calls in Arrears and Calls in Advance",
    ],
    "Analysis of Financial Statements": [
      "Meaning and Objectives of Financial Analysis",
      "Comparative Financial Statements",
      "Common Size Statements",
      "Trend Analysis",
      "Ratio Analysis – Liquidity Ratios",
      "Ratio Analysis – Solvency Ratios",
      "Ratio Analysis – Activity/Turnover Ratios",
      "Ratio Analysis – Profitability Ratios",
      "Current Ratio",
      "Debt-Equity Ratio",
      "Gross Profit Ratio",
      "Net Profit Ratio",
    ],
    "Cash Flow Statement": [
      "Meaning and Objectives of Cash Flow Statement",
      "Cash and Cash Equivalents",
      "Operating Activities",
      "Investing Activities",
      "Financing Activities",
      "Direct Method vs Indirect Method",
      "Preparing Cash Flow from Operating Activities",
      "Preparing Cash Flow from Investing Activities",
      "Preparing Cash Flow from Financing Activities",
      "Adjustment for Non-Cash Items",
      "Difference from Fund Flow Statement",
      "Uses of Cash Flow Statement",
    ],
  },
  "Economics": {
    "National Income Accounting": [
      "Basic Concepts – GDP, GNP, NNP",
      "Circular Flow of Income",
      "Methods of Measuring National Income",
      "Product or Value Added Method",
      "Income Method",
      "Expenditure Method",
      "Real GDP vs Nominal GDP",
      "GDP Deflator",
      "Per Capita Income",
      "Domestic Income vs National Income",
      "Green GDP",
      "Limitations of GDP as a Welfare Measure",
    ],
    "Money and Banking": [
      "Money – Meaning and Functions",
      "Supply of Money – M1, M2, M3, M4",
      "Commercial Banks – Functions",
      "Credit Creation by Banks",
      "Reserve Bank of India – Functions",
      "Monetary Policy",
      "CRR, SLR, Repo Rate, Reverse Repo Rate",
      "Open Market Operations",
      "Bank Rate Policy",
      "Credit Control",
      "Recent Monetary Policy Measures",
      "Digital Payments",
    ],
    "Income Determination": [
      "Aggregate Demand",
      "Aggregate Supply",
      "Consumption Function",
      "Marginal Propensity to Consume",
      "Investment Function",
      "Equilibrium Level of Income",
      "Investment Multiplier",
      "Paradox of Thrift",
      "Deflationary Gap",
      "Inflationary Gap",
      "Full Employment and Under-Employment Equilibrium",
      "Keynes's Theory of Income Determination",
    ],
    "Government Budget and the Economy": [
      "Government Budget – Meaning",
      "Objectives of Government Budget",
      "Components of Budget",
      "Revenue Budget",
      "Capital Budget",
      "Revenue Receipts",
      "Capital Receipts",
      "Revenue Expenditure",
      "Capital Expenditure",
      "Balanced, Surplus and Deficit Budget",
      "Fiscal Deficit",
      "Primary Deficit and Revenue Deficit",
    ],
    "Theory of Consumer Behaviour": [
      "Consumer's Equilibrium – Utility Analysis",
      "Marginal Utility and Total Utility",
      "Law of Diminishing Marginal Utility",
      "Consumer's Equilibrium Using MU Approach",
      "Indifference Curve Analysis",
      "Properties of Indifference Curves",
      "Budget Line",
      "Consumer's Equilibrium Using IC Approach",
      "Price Effect",
      "Income Effect",
      "Substitution Effect",
      "Demand Curve Derivation",
    ],
    "Production and Costs": [
      "Concept of Production Function",
      "Short Run and Long Run Production",
      "Total Product, Average Product, Marginal Product",
      "Law of Variable Proportions",
      "Returns to Scale",
      "Concept of Costs",
      "Fixed Costs and Variable Costs",
      "Total Cost, Average Cost, Marginal Cost",
      "Relationship Between AC and MC",
      "Short Run Cost Curves",
      "Long Run Cost Curves",
      "Economies and Diseconomies of Scale",
    ],
    "The Theory of the Firm under Perfect Competition": [
      "Perfect Competition – Features",
      "Revenue Concepts – TR, AR, MR",
      "Price Determination Under Perfect Competition",
      "Short Run Equilibrium of Firm",
      "Shut Down Point",
      "Break Even Point",
      "Long Run Equilibrium of Firm",
      "Supply Curve of Firm",
      "Industry Equilibrium",
      "Effects of Change in Demand",
      "Normal Profit",
      "Producer's Surplus",
    ],
    "Non-competitive Markets": [
      "Monopoly – Meaning and Features",
      "Revenue Curves Under Monopoly",
      "Price Determination Under Monopoly",
      "Monopoly vs Perfect Competition",
      "Price Discrimination",
      "Monopolistic Competition – Features",
      "Equilibrium Under Monopolistic Competition",
      "Oligopoly – Features",
      "Price Leadership Model",
      "Kinked Demand Curve",
      "Anti-Trust Policies",
      "Real-Life Examples of Market Structures",
    ],
  },
  "Business Studies": {
    "Nature and Significance of Management": [
      "Concept and Characteristics of Management",
      "Management as Science, Art and Profession",
      "Levels of Management",
      "Management Functions – Planning",
      "Management Functions – Organising",
      "Management Functions – Staffing",
      "Management Functions – Directing",
      "Management Functions – Controlling",
      "Coordination – Nature and Importance",
      "Effectiveness and Efficiency",
      "Universality of Management",
      "Management as a Career",
    ],
    "Principles of Management": [
      "Fayol's Principles of Management",
      "Division of Work",
      "Authority and Responsibility",
      "Discipline",
      "Unity of Command",
      "Unity of Direction",
      "Subordination of Individual Interest",
      "Remuneration",
      "Centralisation and Decentralisation",
      "Scientific Management – Taylor",
      "Techniques of Scientific Management",
      "Comparison of Fayol and Taylor",
    ],
    "Financial Management": [
      "Meaning and Importance of Financial Management",
      "Financial Planning",
      "Capital Structure",
      "Fixed Capital and Working Capital",
      "Financial Decisions – Investment",
      "Financial Decisions – Financing",
      "Financial Decisions – Dividend",
      "Factors Affecting Capital Structure",
      "Trading on Equity",
      "Factors Affecting Working Capital",
      "Role of Finance Manager",
      "Financial Risk",
    ],
    "Financial Markets": [
      "Concept of Financial Market",
      "Money Market",
      "Instruments of Money Market",
      "Capital Market",
      "Primary Market",
      "Secondary Market – Stock Exchange",
      "Sensex and Nifty",
      "SEBI – Role and Functions",
      "IPO Process",
      "Stock Market and Speculation",
      "Depositories – NSDL and CDSL",
      "Online Trading",
    ],
    "Marketing Management": [
      "Concept of Market and Marketing",
      "Marketing vs Selling",
      "Marketing Mix – 4 Ps",
      "Product – Meaning and Classification",
      "Branding, Labelling, Packaging",
      "Price – Factors Affecting Pricing",
      "Pricing Methods",
      "Place – Channels of Distribution",
      "Types of Channels",
      "Promotion – Advertising",
      "Personal Selling",
      "Sales Promotion and Public Relations",
    ],
    "Consumer Protection": [
      "Importance of Consumer Protection",
      "Consumer Rights",
      "Consumer Responsibilities",
      "Consumer Protection Act 2019",
      "Consumer Disputes Redressal Agencies",
      "District Forum",
      "State Commission",
      "National Commission",
      "Remedies Available to Consumers",
      "Consumer Awareness",
      "Role of NGOs",
      "E-Commerce and Consumer Protection",
    ],
  },
  "Computer Science": {
    "Python Revision Tour": [
      "Python Data Types Revision",
      "Control Structures – if-else, loops",
      "Functions Revision",
      "Strings Revision",
      "Lists, Tuples, Dictionaries Revision",
      "File Handling Introduction",
      "Modules and Packages",
      "Error Types",
      "Debugging",
      "Python Standard Library",
      "Object-Oriented Concepts Introduction",
      "Practice Programs",
    ],
    "Object Oriented Programming": [
      "Classes and Objects",
      "Data Members and Member Functions",
      "Constructor – __init__",
      "self Parameter",
      "Encapsulation",
      "Inheritance – Types",
      "Single and Multiple Inheritance",
      "Method Overriding",
      "Polymorphism",
      "Data Hiding",
      "Abstract Classes (Introduction)",
      "OOP Programs",
    ],
    "File Handling in Python": [
      "Types of Files – Text and Binary",
      "Opening a File – open()",
      "File Opening Modes",
      "Reading from a File",
      "Writing to a File",
      "Appending to a File",
      "Closing a File",
      "Reading/Writing Binary Files",
      "Pickle Module",
      "CSV Files",
      "File Pointer and seek()/tell()",
      "File Handling Programs",
    ],
    "Database Concepts": [
      "Introduction to Database",
      "DBMS vs File System",
      "Relational Database Model",
      "Key Concepts – Tables, Records, Fields",
      "Primary Key and Foreign Key",
      "Relationships in Database",
      "Advantages of DBMS",
      "Types of DBMS",
      "MySQL Introduction",
      "Database Design",
      "Normalisation (Introduction)",
      "Database Applications",
    ],
    "Structured Query Language": [
      "Introduction to SQL",
      "DDL Commands – CREATE, ALTER, DROP",
      "DML Commands – INSERT, UPDATE, DELETE",
      "DQL – SELECT Statement",
      "WHERE Clause",
      "ORDER BY Clause",
      "GROUP BY and HAVING Clause",
      "Aggregate Functions – COUNT, SUM, AVG, MAX, MIN",
      "Joins – Introduction",
      "Nested Queries (Introduction)",
      "Constraints in SQL",
      "MySQL Programs",
    ],
    "Computer Networks": [
      "Evolution of Networking",
      "Types of Networks – LAN, MAN, WAN",
      "Network Topologies",
      "Network Devices – Hub, Switch, Router",
      "Transmission Media",
      "TCP/IP Model",
      "OSI Model",
      "IP Addressing – IPv4 and IPv6",
      "Domain Name System (DNS)",
      "HTTP and HTTPS",
      "FTP and Email Protocols",
      "Network Security (Introduction)",
    ],
    "Societal Impacts": [
      "Digital Footprint",
      "Net and Communication Etiquettes",
      "Data Protection",
      "Intellectual Property Rights",
      "Plagiarism",
      "Cybercrime – Types",
      "Cyber Laws in India – IT Act",
      "Hacking and Cracking",
      "Identity Theft",
      "E-Waste Management",
      "Health Concerns – Ergonomics",
      "Gender and Disability Issues in IT",
    ],
  },
},
}

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA2 — fills board-critical missing chapters
//  Class 9: Mathematics, Science, Social Science gaps
//  Class 10: Social Science gaps (Maths & Science already complete)
//
//  PASTE this whole constant right after the closing brace of
//  CHAPTER_SUBTOPICS_EXTRA, then update the merge line to:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA, CHAPTER_SUBTOPICS_EXTRA2
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA2 = {

  // ════════════════════════════════════════════
  //  CLASS 9 — remaining Maths / Science / SST
  // ════════════════════════════════════════════
  "Class 9": {
    "Mathematics": {
      "Introduction to Euclid's Geometry": [
        "Euclid's Definitions",
        "Point, Line and Plane",
        "Euclid's Axioms",
        "Euclid's Five Postulates",
        "Equivalent Versions of the Fifth Postulate",
        "Axioms vs Postulates",
        "Collinear and Non-Collinear Points",
        "Playfair's Axiom",
        "Consistency of Axioms",
        "Theorems, Proofs and Deductive Reasoning",
      ],
      "Lines and Angles": [
        "Basic Terms and Definitions",
        "Intersecting and Non-Intersecting Lines",
        "Pairs of Angles",
        "Linear Pair of Angles",
        "Vertically Opposite Angles",
        "Complementary and Supplementary Angles",
        "Adjacent Angles",
        "Parallel Lines and a Transversal",
        "Corresponding Angles",
        "Alternate Interior Angles",
        "Co-interior (Consecutive) Angles",
        "Angle Sum Property of a Triangle",
        "Exterior Angle Theorem",
      ],
    },
    "Science": {
      "Natural Resources": [
        "The Breath of Life – Air",
        "Role of Atmosphere in Climate Control",
        "The Movement of Air – Winds",
        "Rain and the Water Cycle",
        "Air Pollution",
        "Water – A Wonder Liquid",
        "Water Pollution",
        "Mineral Riches in the Soil",
        "Biogeochemical Cycles – Nitrogen Cycle",
        "The Carbon Cycle",
        "The Oxygen Cycle",
        "The Greenhouse Effect",
        "The Ozone Layer and Its Depletion",
      ],
      "Improvement in Food Resources": [
        "Improvement in Crop Yields",
        "Crop Variety Improvement",
        "Crop Production Management",
        "Nutrient Management",
        "Manure and Fertilisers",
        "Irrigation Methods",
        "Cropping Patterns",
        "Crop Protection Management",
        "Animal Husbandry",
        "Cattle Farming",
        "Poultry Farming",
        "Fish Production",
        "Bee-Keeping",
      ],
    },
    "Social Science": {
      "Nazism and the Rise of Hitler": [
        "Birth of the Weimar Republic",
        "Effects of the First World War",
        "Political Radicalism and Economic Crises",
        "The Years of Depression",
        "Hitler's Rise to Power",
        "The Destruction of Democracy",
        "Reconstruction – The Nazi Economy",
        "The Nazi Worldview",
        "Establishment of the Racial State",
        "Youth in Nazi Germany",
        "The Nazi Cult of Motherhood",
        "The Art of Propaganda",
        "Ordinary People and Crimes Against Humanity",
      ],
      "Forest Society and Colonialism": [
        "Why Deforestation?",
        "Land to be Improved",
        "Sleepers on the Tracks",
        "Plantations",
        "The Rise of Commercial Forestry",
        "How Lives of People Were Affected",
        "Forest Rules and Their Impact",
        "Rebellion in the Forest – Bastar",
        "The Fears of the People",
        "Forest Transformations in Java",
        "Dutch Scientific Forestry",
        "Samin's Challenge",
      ],
      "Pastoralists in the Modern World": [
        "Pastoral Nomads and Their Movements",
        "In the Mountains",
        "On the Plateaus, Plains and Deserts",
        "Colonial Rule and Pastoral Life",
        "Effects of Colonial Rule on Pastoralists",
        "How Changes Affected Pastoralists' Lives",
        "Pastoralism in Africa",
        "The Maasai Community",
        "The Borders Are Closed",
        "When Pastures Dry",
        "Not All Were Equally Affected",
      ],
      "Natural Vegetation and Wildlife": [
        "Factors Affecting Vegetation",
        "Types of Vegetation",
        "Tropical Evergreen Forests",
        "Tropical Deciduous Forests",
        "Thorn Forests and Scrubs",
        "Montane Forests",
        "Mangrove Forests",
        "Wildlife of India",
        "Conservation of Forests and Wildlife",
        "National Parks and Wildlife Sanctuaries",
        "Biosphere Reserves",
        "Project Tiger",
      ],
      "Population": [
        "Population Size and Distribution",
        "Population Density",
        "Processes of Population Change",
        "Birth Rate and Death Rate",
        "Migration",
        "Age Composition",
        "Sex Ratio",
        "Literacy Rate",
        "Occupational Structure",
        "Health of the Population",
        "Adolescent Population",
        "National Population Policy",
      ],
      "Electoral Politics": [
        "Why Elections?",
        "What Makes an Election Democratic?",
        "Is Political Competition Good?",
        "Our System of Elections",
        "Electoral Constituencies",
        "Reserved Constituencies",
        "Voters' List",
        "Nomination of Candidates",
        "Election Campaign",
        "Polling and Counting of Votes",
        "The Election Commission",
        "Challenges to Free and Fair Elections",
      ],
      "Working of Institutions": [
        "How a Major Policy Decision is Taken",
        "Need for Political Institutions",
        "Parliament and Its Importance",
        "The Two Houses of Parliament",
        "The Political Executive",
        "Prime Minister and Council of Ministers",
        "Powers of the Prime Minister",
        "The President of India",
        "Powers of the President",
        "The Judiciary",
        "Independence of the Judiciary",
        "Public Interest Litigation",
      ],
      "Democratic Rights": [
        "Life Without Rights",
        "Rights in a Democracy",
        "Why We Need Rights in a Democracy",
        "Fundamental Rights in the Constitution",
        "Right to Equality",
        "Right to Freedom",
        "Right against Exploitation",
        "Right to Freedom of Religion",
        "Cultural and Educational Rights",
        "Right to Constitutional Remedies",
        "Expanding Scope of Rights",
        "National Human Rights Commission",
      ],
      "People as Resource": [
        "Economic Activities by Men and Women",
        "Quality of Population",
        "Literacy Rate in India",
        "Education",
        "Health",
        "Unemployment",
        "Types of Unemployment",
        "Impact of Unemployment",
        "Human Capital Formation",
        "Role of Education and Health",
        "Primary, Secondary and Tertiary Sectors",
      ],
      "Poverty as a Challenge": [
        "Two Typical Cases of Poverty",
        "Poverty as Seen by Social Scientists",
        "The Poverty Line",
        "Poverty Estimates",
        "Vulnerable Groups",
        "Inter-State Disparities",
        "Global Poverty Scenario",
        "Causes of Poverty",
        "Anti-Poverty Measures",
        "Poverty Alleviation Programmes",
        "The Challenges Ahead",
      ],
      "Food Security in India": [
        "What is Food Security?",
        "Why Food Security?",
        "Who Are Food Insecure?",
        "Food Security in India",
        "Buffer Stock",
        "Public Distribution System",
        "Current Status of PDS",
        "Role of Cooperatives in Food Security",
        "The Green Revolution",
        "Ration Card System",
        "Problems in Functioning of Ration Shops",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 10 — remaining Social Science
  //  (Maths & Science are already fully covered)
  // ════════════════════════════════════════════
  "Class 10": {
    "Social Science": {
      "The Age of Industrialisation": [
        "Before the Industrial Revolution",
        "The Coming Up of the Factory",
        "The Pace of Industrial Change",
        "Hand Labour and Steam Power",
        "Life of the Workers",
        "Industrialisation in the Colonies",
        "The Age of Indian Textiles",
        "What Happened to Weavers?",
        "Manchester Comes to India",
        "Factories Come Up",
        "Peculiarities of Industrial Growth",
        "Market for Goods and Advertisements",
      ],
      "Print Culture and the Modern World": [
        "The First Printed Books",
        "Print in China, Japan and Korea",
        "Print Comes to Europe",
        "Gutenberg and the Printing Press",
        "The Print Revolution and Its Impact",
        "The Reading Mania",
        "Print and Dissent",
        "The Nineteenth Century",
        "Manuscripts Before Print in India",
        "Print Comes to India",
        "Religious Reform and Public Debates",
        "New Forms of Publication",
        "Print and Censorship",
      ],
      "Forest and Wildlife Resources": [
        "Flora and Fauna in India",
        "Biodiversity",
        "Vanishing Forests",
        "Causes of Depletion of Forest and Wildlife",
        "Categories of Existing Plant and Animal Species",
        "Conservation of Forest and Wildlife",
        "Project Tiger",
        "Types and Distribution of Forests",
        "Reserved, Protected and Unclassed Forests",
        "Community and Conservation",
        "Chipko Movement",
        "Joint Forest Management",
      ],
      "Water Resources": [
        "Water Scarcity and Its Causes",
        "Need for Water Conservation",
        "Multi-Purpose River Projects",
        "Dams and Their Advantages",
        "Objections to Multi-Purpose Projects",
        "Rainwater Harvesting",
        "Traditional Methods of Rainwater Harvesting",
        "Bamboo Drip Irrigation",
        "Watershed Development",
        "Hydraulic Structures in Ancient India",
        "Water Conservation and Management",
      ],
      "Minerals and Energy Resources": [
        "What is a Mineral?",
        "Mode of Occurrence of Minerals",
        "Ferrous and Non-Ferrous Minerals",
        "Iron Ore",
        "Manganese, Copper and Bauxite",
        "Non-Metallic Minerals – Mica and Limestone",
        "Conservation of Minerals",
        "Conventional Energy Resources",
        "Coal, Petroleum and Natural Gas",
        "Electricity – Thermal and Hydro",
        "Non-Conventional Sources of Energy",
        "Conservation of Energy Resources",
      ],
      "Manufacturing Industries": [
        "Importance of Manufacturing",
        "Contribution of Industry to National Economy",
        "Industrial Location",
        "Classification of Industries",
        "Agro-Based Industries – Textiles",
        "Cotton and Jute Textiles",
        "Sugar Industry",
        "Mineral-Based Industries – Iron and Steel",
        "Aluminium Smelting",
        "Chemical and Fertiliser Industries",
        "Cement Industry",
        "Automobile Industry",
        "Industrial Pollution and Environmental Degradation",
        "Control of Environmental Degradation",
      ],
      "Lifelines of National Economy": [
        "Importance of Transport and Communication",
        "Roadways",
        "Railways",
        "Pipelines",
        "Waterways",
        "Major Sea Ports",
        "Airways",
        "Communication",
        "International Trade",
        "Tourism as a Trade",
        "Balance of Trade",
      ],
      "Democracy and Diversity": [
        "A Story from Mexico Olympics",
        "Differences, Similarities and Divisions",
        "Origins of Social Differences",
        "Overlapping and Cross-Cutting Differences",
        "Politics of Social Divisions",
        "Range of Outcomes",
        "Factors Determining Outcomes",
        "How Social Divisions Affect Politics",
        "Democracy and Social Diversity",
      ],
      "Gender Religion and Caste": [
        "Gender and Politics",
        "Public and Private Division",
        "Women's Political Representation",
        "Religion, Communalism and Politics",
        "Communalism",
        "Secular State",
        "Caste and Politics",
        "Caste Inequalities",
        "Caste in Politics",
        "Politics in Caste",
        "The Other Backward Classes",
      ],
      "Popular Struggles and Movements": [
        "Movement for Democracy in Nepal",
        "Bolivia's Water War",
        "Democracy and Popular Struggles",
        "Mobilisation and Organisations",
        "Pressure Groups and Movements",
        "Sectional Interest Groups",
        "Public Interest Groups",
        "Movement Groups",
        "Single-Issue and Long-Term Movements",
        "How Organisations Influence Political Decisions",
        "Is This Positive for Democracy?",
      ],
      "Outcomes of Democracy": [
        "How We Assess Democracy's Outcomes",
        "Accountable, Responsive and Legitimate Government",
        "Economic Growth and Development",
        "Reduction of Inequality and Poverty",
        "Accommodation of Social Diversity",
        "Dignity and Freedom of Citizens",
        "Democracy and Development",
        "Transparency in Democracy",
        "Expected vs Real Outcomes",
        "Democracy in Practice",
      ],
      "Challenges to Democracy": [
        "Thinking About Challenges",
        "Foundational Challenge",
        "Challenge of Expansion",
        "Deepening of Democracy",
        "Different Contexts, Different Challenges",
        "Definition of a Challenge",
        "Political Reforms",
        "Guidelines to Devise Ways to Reform Politics",
        "Redefining Democracy",
        "Broad Guidelines for Political Reforms",
      ],
      "Sectors of the Indian Economy": [
        "Sectors of Economic Activities",
        "Primary, Secondary and Tertiary Sectors",
        "Comparing the Three Sectors",
        "Rising Importance of the Tertiary Sector",
        "Where Are Most People Employed?",
        "Underemployment (Disguised Unemployment)",
        "How to Create More Employment",
        "MGNREGA 2005",
        "Organised and Unorganised Sectors",
        "Public and Private Sectors",
        "Protecting Workers in the Unorganised Sector",
      ],
      "Consumer Rights": [
        "The Consumer in the Marketplace",
        "The Consumer Movement",
        "Consumer Rights",
        "Right to Safety",
        "Right to be Informed",
        "Right to Choose",
        "Right to Seek Redressal",
        "Right to Represent",
        "Consumer Protection Act (COPRA)",
        "Standardisation – ISI, Agmark, Hallmark",
        "Consumer Forums and Councils",
        "Taking the Consumer Movement Forward",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA2 ──

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA3 — Class 11 & 12 science/maths gaps
//  Physics, Chemistry, Biology, Mathematics chapters that had
//  no subtopics. English/Hindi/commerce/CS still pending (EXTRA4+).
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA2, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA3 = {

  // ════════════════════════════════════════════
  //  CLASS 11
  // ════════════════════════════════════════════
  "Class 11": {
    "Physics": {
      "Physical World": [
        "What is Physics?",
        "Scope and Excitement of Physics",
        "Physics, Technology and Society",
        "Fundamental Forces in Nature",
        "Gravitational Force",
        "Electromagnetic Force",
        "Strong and Weak Nuclear Forces",
        "Unification of Forces",
        "Nature of Physical Laws",
        "Conservation Laws",
      ],
      "Systems of Particles and Rotational Motion": [
        "Centre of Mass",
        "Motion of Centre of Mass",
        "Linear Momentum of a System of Particles",
        "Vector Product of Two Vectors",
        "Angular Velocity and Angular Acceleration",
        "Torque and Angular Momentum",
        "Equilibrium of a Rigid Body",
        "Moment of Inertia",
        "Theorems of Parallel and Perpendicular Axes",
        "Kinematics of Rotational Motion",
        "Dynamics of Rotational Motion",
        "Angular Momentum in Rotation and Its Conservation",
        "Rolling Motion",
      ],
      "Mechanical Properties of Solids": [
        "Elastic Behaviour of Solids",
        "Stress and Strain",
        "Hooke's Law",
        "Stress-Strain Curve",
        "Young's Modulus",
        "Shear Modulus (Modulus of Rigidity)",
        "Bulk Modulus",
        "Poisson's Ratio",
        "Elastic Potential Energy in a Stretched Wire",
        "Applications of Elastic Behaviour of Materials",
      ],
      "Mechanical Properties of Fluids": [
        "Pressure in Fluids",
        "Pascal's Law",
        "Variation of Pressure with Depth",
        "Atmospheric Pressure and Gauge Pressure",
        "Hydraulic Machines",
        "Streamline Flow",
        "Bernoulli's Principle",
        "Applications of Bernoulli's Principle",
        "Viscosity",
        "Stokes' Law and Terminal Velocity",
        "Reynolds Number",
        "Surface Tension",
        "Capillary Rise and Angle of Contact",
      ],
      "Thermal Properties of Matter": [
        "Temperature and Heat",
        "Measurement of Temperature",
        "Ideal Gas Equation and Absolute Temperature",
        "Thermal Expansion",
        "Specific Heat Capacity",
        "Calorimetry",
        "Change of State – Latent Heat",
        "Heat Transfer – Conduction",
        "Heat Transfer – Convection",
        "Heat Transfer – Radiation",
        "Newton's Law of Cooling",
        "Blackbody Radiation and Stefan's Law",
      ],
      "Kinetic Theory": [
        "Molecular Nature of Matter",
        "Behaviour of Gases",
        "Kinetic Theory of an Ideal Gas",
        "Pressure of an Ideal Gas",
        "Kinetic Interpretation of Temperature",
        "Law of Equipartition of Energy",
        "Specific Heat Capacity of Gases",
        "Degrees of Freedom",
        "Mean Free Path",
        "RMS Speed of Gas Molecules",
      ],
    },
    "Chemistry": {
      "States of Matter": [
        "Intermolecular Forces",
        "Thermal Energy and Molecular Interactions",
        "The Gaseous State",
        "The Gas Laws – Boyle's Law",
        "Charles' Law and Gay Lussac's Law",
        "Avogadro Law and Ideal Gas Equation",
        "Dalton's Law of Partial Pressures",
        "Kinetic Molecular Theory of Gases",
        "Behaviour of Real Gases – Deviation from Ideal Behaviour",
        "Liquefaction of Gases",
        "The Liquid State – Vapour Pressure and Viscosity",
        "Surface Tension",
      ],
      "Redox Reactions": [
        "Classical Idea of Redox Reactions",
        "Oxidation and Reduction",
        "Redox Reactions in Terms of Electron Transfer",
        "Oxidation Number",
        "Rules for Assigning Oxidation Number",
        "Types of Redox Reactions",
        "Balancing Redox Reactions – Oxidation Number Method",
        "Balancing by Half-Reaction (Ion-Electron) Method",
        "Redox Reactions and Electrode Processes",
        "Applications of Redox Reactions",
      ],
      "Hydrogen": [
        "Position of Hydrogen in the Periodic Table",
        "Isotopes of Hydrogen",
        "Preparation of Dihydrogen",
        "Properties of Dihydrogen",
        "Hydrides – Ionic, Covalent and Metallic",
        "Water – Structure and Properties",
        "Hard and Soft Water",
        "Hydrogen Peroxide",
        "Heavy Water",
        "Dihydrogen as a Fuel",
      ],
      "The s-Block Elements": [
        "Group 1 – Alkali Metals",
        "General Characteristics of Alkali Metals",
        "Anomalous Properties of Lithium",
        "Important Compounds of Sodium",
        "Group 2 – Alkaline Earth Metals",
        "General Characteristics of Alkaline Earth Metals",
        "Anomalous Behaviour of Beryllium",
        "Important Compounds of Calcium",
        "Diagonal Relationship",
        "Biological Importance of Na, K, Mg and Ca",
      ],
      "The p-Block Elements": [
        "General Introduction to p-Block Elements",
        "Group 13 – Boron Family",
        "Important Compounds of Boron",
        "Uses of Boron and Aluminium",
        "Group 14 – Carbon Family",
        "Allotropes of Carbon",
        "Important Compounds of Carbon and Silicon",
        "Silicones and Silicates",
        "Anomalous Behaviour of Boron and Carbon",
        "Trends in Properties Down the Groups",
      ],
      "Organic Chemistry – Some Basic Principles and Techniques": [
        "General Introduction to Organic Chemistry",
        "Tetravalence of Carbon and Shapes",
        "Structural Representations of Organic Compounds",
        "Classification of Organic Compounds",
        "Nomenclature (IUPAC)",
        "Isomerism – Structural and Stereo",
        "Fundamental Concepts – Fission of Bonds",
        "Electron Displacement Effects – Inductive, Resonance, Hyperconjugation",
        "Types of Organic Reactions",
        "Purification of Organic Compounds",
        "Qualitative Analysis of Organic Compounds",
        "Quantitative Analysis",
      ],
      "Environmental Chemistry": [
        "Environmental Pollution",
        "Atmospheric Pollution",
        "Tropospheric Pollution",
        "Acid Rain",
        "Smog – Classical and Photochemical",
        "Stratospheric Pollution – Ozone Depletion",
        "Global Warming and Greenhouse Effect",
        "Water Pollution",
        "Soil Pollution",
        "Strategies to Control Environmental Pollution",
        "Green Chemistry",
      ],
    },
    "Biology": {
      "Biological Classification": [
        "Kingdom Monera",
        "Kingdom Protista",
        "Kingdom Fungi",
        "Kingdom Plantae",
        "Kingdom Animalia",
        "Five Kingdom Classification",
        "Bacteria – Types and Structure",
        "Viruses, Viroids and Lichens",
        "Archaebacteria and Eubacteria",
        "Economic Importance of Microbes",
      ],
      "Plant Kingdom": [
        "Algae",
        "Bryophytes",
        "Pteridophytes",
        "Gymnosperms",
        "Angiosperms",
        "Classification of Algae",
        "Life Cycle of Bryophytes",
        "Alternation of Generations",
        "Plant Life Cycles",
        "Economic Importance of Plants",
      ],
      "Animal Kingdom": [
        "Basis of Classification",
        "Levels of Organisation",
        "Symmetry and Coelom",
        "Phylum Porifera and Coelenterata",
        "Phylum Platyhelminthes and Aschelminthes",
        "Phylum Annelida and Arthropoda",
        "Phylum Mollusca and Echinodermata",
        "Phylum Chordata – Basic Features",
        "Classes of Vertebrates",
        "Comparison of Animal Phyla",
      ],
      "Morphology of Flowering Plants": [
        "The Root",
        "The Stem",
        "The Leaf",
        "The Inflorescence",
        "The Flower",
        "Parts of a Flower",
        "The Fruit",
        "The Seed",
        "Modifications of Root, Stem and Leaf",
        "Floral Formula and Diagram",
        "Families – Fabaceae, Solanaceae, Liliaceae",
      ],
      "Anatomy of Flowering Plants": [
        "The Tissue System",
        "Meristematic Tissues",
        "Permanent Tissues",
        "Epidermal Tissue System",
        "Ground Tissue System",
        "Vascular Tissue System",
        "Anatomy of Dicot and Monocot Root",
        "Anatomy of Dicot and Monocot Stem",
        "Anatomy of Dicot and Monocot Leaf",
        "Secondary Growth",
      ],
      "Structural Organisation in Animals": [
        "Animal Tissues – Epithelial",
        "Connective Tissue",
        "Muscular Tissue",
        "Neural Tissue",
        "Organ and Organ Systems",
        "Earthworm – Morphology and Anatomy",
        "Cockroach – Morphology and Anatomy",
        "Frog – Morphology and Anatomy",
        "Digestive and Circulatory Systems of Frog",
        "Comparison of Systems Across Animals",
      ],
      "Biomolecules": [
        "Analysis of Chemical Composition",
        "Primary and Secondary Metabolites",
        "Biomacromolecules",
        "Proteins – Structure",
        "Carbohydrates and Polysaccharides",
        "Lipids",
        "Nucleic Acids",
        "Structure of Proteins – Primary to Quaternary",
        "Enzymes – Nature and Mechanism of Action",
        "Factors Affecting Enzyme Activity",
        "Classification and Nomenclature of Enzymes",
      ],
      "Cell Cycle and Cell Division": [
        "The Cell Cycle",
        "Phases of the Cell Cycle",
        "Interphase – G1, S, G2",
        "M Phase (Mitosis)",
        "Prophase, Metaphase, Anaphase, Telophase",
        "Cytokinesis",
        "Significance of Mitosis",
        "Meiosis – Meiosis I and II",
        "Stages of Meiosis I",
        "Significance of Meiosis",
        "Comparison of Mitosis and Meiosis",
      ],
      "Transport in Plants": [
        "Means of Transport",
        "Diffusion and Facilitated Diffusion",
        "Active Transport",
        "Plant-Water Relations – Water Potential",
        "Osmosis and Plasmolysis",
        "Imbibition",
        "Long Distance Transport of Water",
        "Transpiration and Its Significance",
        "Ascent of Sap",
        "Phloem Transport – Pressure Flow Hypothesis",
        "Uptake and Transport of Mineral Nutrients",
      ],
      "Mineral Nutrition": [
        "Methods to Study Mineral Requirements",
        "Essential Mineral Elements",
        "Macronutrients and Micronutrients",
        "Role of Macro and Micronutrients",
        "Deficiency Symptoms of Essential Elements",
        "Toxicity of Micronutrients",
        "Mechanism of Absorption of Elements",
        "Translocation of Solutes",
        "Nitrogen Metabolism and Nitrogen Cycle",
        "Biological Nitrogen Fixation",
      ],
      "Respiration in Plants": [
        "Do Plants Breathe?",
        "Glycolysis",
        "Fermentation",
        "Aerobic Respiration",
        "The Krebs Cycle (TCA Cycle)",
        "Electron Transport System",
        "Oxidative Phosphorylation",
        "The Respiratory Balance Sheet",
        "Amphibolic Pathway",
        "Respiratory Quotient",
      ],
      "Plant Growth and Development": [
        "Growth – Characteristics and Phases",
        "Growth Rates and Conditions for Growth",
        "Differentiation, Dedifferentiation and Redifferentiation",
        "Development",
        "Plant Growth Regulators – Auxins",
        "Gibberellins",
        "Cytokinins",
        "Ethylene",
        "Abscisic Acid",
        "Photoperiodism",
        "Vernalisation",
      ],
      "Digestion and Absorption": [
        "The Digestive System",
        "The Alimentary Canal",
        "Digestive Glands",
        "Digestion of Carbohydrates",
        "Digestion of Proteins",
        "Digestion of Fats",
        "Absorption of Digested Products",
        "Egestion",
        "Disorders of the Digestive System",
        "Nutritional and Digestive Disorders",
      ],
      "Excretory Products and their Elimination": [
        "Modes of Excretion",
        "Human Excretory System",
        "Structure of the Kidney",
        "Structure of Nephron",
        "Urine Formation – Glomerular Filtration",
        "Reabsorption and Tubular Secretion",
        "Function of the Tubules",
        "Mechanism of Concentration of Filtrate",
        "Regulation of Kidney Function",
        "Micturition",
        "Role of Other Organs in Excretion",
        "Disorders of the Excretory System",
      ],
      "Locomotion and Movement": [
        "Types of Movement",
        "Muscle – Structure",
        "Structure of Contractile Proteins",
        "Mechanism of Muscle Contraction",
        "Sliding Filament Theory",
        "Skeletal System",
        "Axial and Appendicular Skeleton",
        "Joints – Types",
        "Disorders of the Muscular and Skeletal System",
        "Red and White Muscle Fibres",
      ],
      "Neural Control and Coordination": [
        "Neural System",
        "Human Neural System",
        "Neuron as a Structural and Functional Unit",
        "Generation and Conduction of Nerve Impulse",
        "Transmission of Impulses – Synapse",
        "Central Nervous System",
        "The Brain – Forebrain, Midbrain, Hindbrain",
        "Reflex Action and Reflex Arc",
        "Peripheral Nervous System",
        "Sensory Reception and Processing – Eye",
        "Sensory Reception – Ear",
      ],
      "Chemical Coordination and Integration": [
        "Endocrine Glands and Hormones",
        "Human Endocrine System",
        "The Hypothalamus",
        "The Pituitary Gland",
        "The Pineal Gland",
        "Thyroid and Parathyroid Glands",
        "Thymus and Adrenal Gland",
        "Pancreas",
        "Testis and Ovary",
        "Hormones of Heart, Kidney and GI Tract",
        "Mechanism of Hormone Action",
      ],
    },
    "Mathematics": {
      "Complex Numbers and Quadratic Equations": [
        "Need for Complex Numbers",
        "Algebra of Complex Numbers",
        "The Modulus and Conjugate",
        "Argand Plane and Polar Representation",
        "Argument of a Complex Number",
        "Quadratic Equations with Complex Roots",
        "Square Root of a Complex Number",
        "Properties of Modulus and Conjugate",
        "Multiplicative Inverse",
        "Identities Involving Complex Numbers",
      ],
      "Linear Inequalities": [
        "Inequalities – Introduction",
        "Algebraic Solutions of Linear Inequalities in One Variable",
        "Representation on the Number Line",
        "Graphical Solution of Linear Inequalities in Two Variables",
        "Solution of System of Linear Inequalities Graphically",
        "Word Problems on Inequalities",
        "Region Represented by an Inequality",
        "Feasible Region",
        "Combined Inequalities",
        "Applications in Real Life",
      ],
      "Permutations and Combinations": [
        "Fundamental Principle of Counting",
        "Factorial Notation",
        "Permutations – Definition",
        "Permutations When All Objects Are Distinct",
        "Permutations With Repetition",
        "Permutations When Objects Are Not Distinct",
        "Combinations – Definition",
        "Relation Between Permutations and Combinations",
        "Properties of Combinations",
        "Applications and Word Problems",
      ],
      "Binomial Theorem": [
        "Binomial Theorem for Positive Integral Indices",
        "Pascal's Triangle",
        "General Term in Binomial Expansion",
        "Middle Term(s)",
        "Term Independent of x",
        "Coefficient of a Particular Term",
        "Greatest Binomial Coefficient",
        "Properties of Binomial Coefficients",
        "Applications of Binomial Theorem",
        "Numerical Problems",
      ],
      "Sequences and Series": [
        "Sequences and Series – Introduction",
        "Arithmetic Progression (AP)",
        "Arithmetic Mean",
        "Geometric Progression (GP)",
        "General Term of a GP",
        "Sum of n Terms of a GP",
        "Geometric Mean",
        "Relation Between AM and GM",
        "Sum to Infinity of a GP",
        "Sum of Special Series",
      ],
      "Straight Lines": [
        "Slope of a Line",
        "Angle Between Two Lines",
        "Collinearity of Three Points",
        "Various Forms of the Equation of a Line",
        "Point-Slope and Two-Point Form",
        "Slope-Intercept and Intercept Form",
        "Normal Form",
        "General Equation of a Line",
        "Distance of a Point from a Line",
        "Distance Between Two Parallel Lines",
      ],
      "Conic Sections": [
        "Sections of a Cone",
        "Circle",
        "Parabola",
        "Standard Equations of a Parabola",
        "Latus Rectum",
        "Ellipse",
        "Standard Equations of an Ellipse",
        "Eccentricity and Foci",
        "Hyperbola",
        "Standard Equations of a Hyperbola",
      ],
      "Introduction to Three Dimensional Geometry": [
        "Coordinate Axes and Coordinate Planes in 3D",
        "Coordinates of a Point in Space",
        "Octants",
        "Distance Between Two Points",
        "Section Formula in 3D",
        "Midpoint Formula in 3D",
        "Centroid of a Triangle in 3D",
        "Coordinates in Different Octants",
        "Applications of Distance Formula",
        "Collinearity in 3D",
      ],
      "Probability": [
        "Random Experiments",
        "Sample Space and Events",
        "Types of Events",
        "Algebra of Events",
        "Axiomatic Approach to Probability",
        "Probability of an Event",
        "Equally Likely Outcomes",
        "Addition Rule of Probability",
        "Mutually Exclusive and Exhaustive Events",
        "Probability of 'Not', 'And', 'Or' Events",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 12
  // ════════════════════════════════════════════
  "Class 12": {
    "Physics": {
      "Electrostatic Potential and Capacitance": [
        "Electrostatic Potential",
        "Potential Due to a Point Charge",
        "Potential Due to an Electric Dipole",
        "Potential Due to a System of Charges",
        "Equipotential Surfaces",
        "Potential Energy of a System of Charges",
        "Potential Energy in an External Field",
        "Conductors and Electrostatic Shielding",
        "Dielectrics and Polarisation",
        "Capacitors and Capacitance",
        "Parallel Plate Capacitor",
        "Combination of Capacitors",
        "Energy Stored in a Capacitor",
      ],
      "Magnetism and Matter": [
        "The Bar Magnet",
        "Magnetic Field Lines",
        "Magnetic Dipole and Dipole Moment",
        "The Earth's Magnetism",
        "Elements of Earth's Magnetic Field",
        "Magnetisation and Magnetic Intensity",
        "Magnetic Properties of Materials",
        "Diamagnetism",
        "Paramagnetism",
        "Ferromagnetism",
        "Hysteresis",
      ],
      "Electromagnetic Waves": [
        "Displacement Current",
        "Maxwell's Equations (Qualitative)",
        "Nature of Electromagnetic Waves",
        "Speed of Electromagnetic Waves",
        "Energy and Momentum of EM Waves",
        "The Electromagnetic Spectrum",
        "Radio Waves and Microwaves",
        "Infrared and Visible Light",
        "Ultraviolet, X-Rays and Gamma Rays",
        "Sources and Uses of EM Waves",
      ],
      "Wave Optics": [
        "Huygens Principle",
        "Refraction and Reflection Using Wavefronts",
        "Coherent and Incoherent Sources",
        "Interference of Light",
        "Young's Double Slit Experiment",
        "Fringe Width",
        "Diffraction",
        "Diffraction Due to a Single Slit",
        "Resolving Power of Optical Instruments",
        "Polarisation",
        "Polarisation by Scattering and Reflection",
        "Brewster's Law",
      ],
      "Semiconductor Electronics": [
        "Classification of Metals, Conductors and Semiconductors",
        "Intrinsic Semiconductors",
        "Extrinsic Semiconductors – n-type and p-type",
        "p-n Junction",
        "Semiconductor Diode",
        "Diode as a Rectifier",
        "Half-Wave and Full-Wave Rectifiers",
        "Special Purpose Diodes – Zener, LED, Photodiode, Solar Cell",
        "Junction Transistor",
        "Transistor as a Switch and Amplifier",
        "Logic Gates",
      ],
    },
    "Chemistry": {
      "The Solid State": [
        "General Characteristics of Solids",
        "Amorphous and Crystalline Solids",
        "Classification of Crystalline Solids",
        "Crystal Lattices and Unit Cells",
        "Types of Unit Cells",
        "Number of Atoms in a Unit Cell",
        "Close Packed Structures",
        "Packing Efficiency",
        "Calculations Involving Unit Cell Dimensions",
        "Imperfections in Solids",
        "Electrical and Magnetic Properties of Solids",
      ],
      "Surface Chemistry": [
        "Adsorption",
        "Physisorption and Chemisorption",
        "Factors Affecting Adsorption",
        "Adsorption Isotherms",
        "Catalysis",
        "Homogeneous and Heterogeneous Catalysis",
        "Enzyme Catalysis",
        "Colloids",
        "Classification of Colloids",
        "Preparation and Properties of Colloids",
        "Emulsions",
        "Applications of Colloids",
      ],
      "General Principles and Processes of Isolation of Elements": [
        "Occurrence of Metals",
        "Concentration of Ores",
        "Extraction of Crude Metal from Concentrated Ore",
        "Thermodynamic Principles of Metallurgy",
        "Ellingham Diagram",
        "Electrochemical Principles of Metallurgy",
        "Oxidation and Reduction Processes",
        "Refining of Metals",
        "Extraction of Iron",
        "Extraction of Copper and Aluminium",
        "Uses of Metals",
      ],
      "The p-Block Elements": [
        "Group 15 Elements – Nitrogen Family",
        "Dinitrogen and Ammonia",
        "Oxides of Nitrogen and Nitric Acid",
        "Phosphorus and Its Compounds",
        "Group 16 Elements – Oxygen Family",
        "Dioxygen, Ozone and Oxides",
        "Sulphur and Its Compounds – Sulphuric Acid",
        "Group 17 Elements – Halogens",
        "Chlorine and Hydrogen Chloride",
        "Interhalogen Compounds",
        "Group 18 Elements – Noble Gases",
      ],
      "The d and f Block Elements": [
        "Position in the Periodic Table",
        "Electronic Configurations of d-Block Elements",
        "General Properties of Transition Elements",
        "Variation in Atomic and Ionic Sizes",
        "Oxidation States",
        "Magnetic Properties",
        "Formation of Coloured Ions and Complexes",
        "Catalytic Properties and Interstitial Compounds",
        "Some Important Compounds – KMnO4 and K2Cr2O7",
        "The Lanthanoids",
        "The Actinoids",
      ],
      "Coordination Compounds": [
        "Werner's Theory of Coordination Compounds",
        "Definitions of Some Important Terms",
        "Nomenclature of Coordination Compounds",
        "Isomerism in Coordination Compounds",
        "Structural Isomerism",
        "Stereoisomerism",
        "Valence Bond Theory",
        "Crystal Field Theory",
        "Crystal Field Splitting in Octahedral and Tetrahedral Complexes",
        "Colour and Magnetic Properties",
        "Bonding in Metal Carbonyls",
        "Importance and Applications of Coordination Compounds",
      ],
      "Haloalkanes and Haloarenes": [
        "Classification of Haloalkanes and Haloarenes",
        "Nomenclature",
        "Nature of C–X Bond",
        "Methods of Preparation of Haloalkanes",
        "Physical Properties",
        "Chemical Reactions of Haloalkanes",
        "Nucleophilic Substitution – SN1 and SN2",
        "Elimination Reactions",
        "Preparation of Haloarenes",
        "Reactions of Haloarenes",
        "Polyhalogen Compounds",
      ],
      "Alcohols Phenols and Ethers": [
        "Classification of Alcohols, Phenols and Ethers",
        "Nomenclature",
        "Structure of Functional Groups",
        "Methods of Preparation of Alcohols",
        "Properties of Alcohols",
        "Preparation of Phenols",
        "Properties of Phenols",
        "Acidity of Alcohols and Phenols",
        "Some Commercially Important Alcohols",
        "Preparation of Ethers",
        "Properties of Ethers",
      ],
      "Amines": [
        "Structure of Amines",
        "Classification of Amines",
        "Nomenclature",
        "Preparation of Amines",
        "Physical Properties",
        "Chemical Reactions of Amines",
        "Basic Character of Amines",
        "Diazonium Salts – Preparation",
        "Physical Properties of Diazonium Salts",
        "Chemical Reactions of Diazonium Salts",
        "Importance of Diazonium Salts in Synthesis",
      ],
      "Biomolecules": [
        "Carbohydrates – Classification",
        "Monosaccharides – Glucose and Fructose",
        "Disaccharides and Polysaccharides",
        "Importance of Carbohydrates",
        "Proteins – Amino Acids",
        "Structure of Proteins",
        "Denaturation of Proteins",
        "Enzymes",
        "Vitamins",
        "Nucleic Acids – DNA and RNA",
        "Hormones",
      ],
      "Polymers": [
        "Classification of Polymers",
        "Classification Based on Source",
        "Classification Based on Structure",
        "Classification Based on Mode of Polymerisation",
        "Addition Polymerisation",
        "Condensation Polymerisation",
        "Copolymerisation",
        "Rubber – Natural and Synthetic",
        "Some Commercially Important Polymers",
        "Biodegradable Polymers",
        "Molecular Mass of Polymers",
      ],
      "Chemistry in Everyday Life": [
        "Drugs and Their Classification",
        "Drug-Target Interaction",
        "Therapeutic Action of Different Classes of Drugs",
        "Antacids and Antihistamines",
        "Antibiotics",
        "Antiseptics and Disinfectants",
        "Antifertility Drugs",
        "Chemicals in Food – Artificial Sweeteners",
        "Food Preservatives",
        "Cleansing Agents – Soaps",
        "Cleansing Agents – Detergents",
      ],
    },
    "Mathematics": {
      "Inverse Trigonometric Functions": [
        "Basic Concepts of Inverse Trigonometric Functions",
        "Domain and Range of Inverse Trig Functions",
        "Principal Value Branch",
        "Graphs of Inverse Trigonometric Functions",
        "Properties of Inverse Trigonometric Functions",
        "Simplification Using Properties",
        "Sum and Difference Formulae",
        "Conversion Between Inverse Functions",
        "Solving Equations Involving Inverse Functions",
        "Standard Results",
      ],
      "Application of Integrals": [
        "Area Under Simple Curves",
        "Area Bounded by a Curve and the x-axis",
        "Area Bounded by a Curve and the y-axis",
        "Area Between a Line and a Curve",
        "Area Between Two Curves",
        "Area of a Circle Using Integration",
        "Area of an Ellipse",
        "Area Using Symmetry",
        "Area Bounded by Parabola and Line",
        "Applications in Real Problems",
      ],
      "Vector Algebra": [
        "Scalars and Vectors",
        "Types of Vectors",
        "Position Vector and Direction Cosines",
        "Addition of Vectors",
        "Multiplication of a Vector by a Scalar",
        "Components of a Vector",
        "Section Formula Using Vectors",
        "Scalar (Dot) Product of Two Vectors",
        "Projection of a Vector",
        "Vector (Cross) Product of Two Vectors",
        "Area of Triangle and Parallelogram",
      ],
      "Three Dimensional Geometry": [
        "Direction Cosines and Direction Ratios",
        "Equation of a Line in Space – Vector Form",
        "Equation of a Line – Cartesian Form",
        "Angle Between Two Lines",
        "Shortest Distance Between Two Lines",
        "Distance Between Parallel Lines",
        "Equation of a Plane – Vector and Cartesian Form",
        "Plane Through Three Points",
        "Angle Between Two Planes",
        "Angle Between a Line and a Plane",
        "Distance of a Point from a Plane",
        "Coplanarity of Two Lines",
      ],
      "Linear Programming": [
        "Linear Programming Problem – Introduction",
        "Mathematical Formulation of LPP",
        "Objective Function and Constraints",
        "Graphical Method of Solving LPP",
        "Feasible and Infeasible Regions",
        "Feasible and Infeasible Solutions",
        "Optimal (Feasible) Solution",
        "Corner Point Method",
        "Bounded and Unbounded Regions",
        "Types of LPP – Manufacturing, Diet, Transportation",
      ],
    },
    "Biology": {
      "Sexual Reproduction in Flowering Plants": [
        "Flower – A Fascinating Organ",
        "Pre-Fertilisation – Structures and Events",
        "Stamen, Microsporangium and Pollen Grain",
        "The Pistil, Megasporangium and Embryo Sac",
        "Pollination – Types and Agents",
        "Outbreeding Devices",
        "Pollen-Pistil Interaction",
        "Double Fertilisation",
        "Post-Fertilisation – Endosperm and Embryo",
        "Seed and Fruit Formation",
        "Apomixis and Polyembryony",
      ],
      "Human Reproduction": [
        "The Male Reproductive System",
        "The Female Reproductive System",
        "Gametogenesis – Spermatogenesis",
        "Oogenesis",
        "Menstrual Cycle",
        "Fertilisation and Implantation",
        "Pregnancy and Embryonic Development",
        "Parturition and Lactation",
        "Structure of Sperm and Ovum",
        "Hormonal Control of Reproduction",
      ],
      "Reproductive Health": [
        "Reproductive Health – Problems and Strategies",
        "Population Explosion and Birth Control",
        "Contraceptive Methods",
        "Natural and Barrier Methods",
        "IUDs and Oral Contraceptives",
        "Surgical Methods",
        "Medical Termination of Pregnancy (MTP)",
        "Sexually Transmitted Infections (STIs)",
        "Infertility",
        "Assisted Reproductive Technologies (ART)",
      ],
      "Principles of Inheritance and Variation": [
        "Mendel's Laws of Inheritance",
        "Inheritance of One Gene – Monohybrid Cross",
        "Law of Dominance and Segregation",
        "Inheritance of Two Genes – Dihybrid Cross",
        "Law of Independent Assortment",
        "Deviations from Mendelism – Incomplete Dominance",
        "Co-dominance and Multiple Alleles",
        "Chromosomal Theory of Inheritance",
        "Linkage and Recombination",
        "Sex Determination",
        "Mutation",
        "Genetic Disorders – Mendelian and Chromosomal",
      ],
      "Human Health and Disease": [
        "Common Diseases in Humans",
        "Infectious Diseases and Pathogens",
        "Immunity – Innate and Acquired",
        "Active and Passive Immunity",
        "Vaccination and Immunisation",
        "Allergies and Autoimmunity",
        "The Immune System in the Body",
        "AIDS",
        "Cancer",
        "Drugs and Alcohol Abuse",
        "Adolescence, Drug and Alcohol Abuse",
      ],
      "Strategies for Enhancement in Food Production": [
        "Animal Husbandry",
        "Management of Farms and Farm Animals",
        "Animal Breeding",
        "Bee-Keeping",
        "Fisheries",
        "Plant Breeding",
        "Steps in Plant Breeding",
        "Plant Breeding for Disease Resistance",
        "Biofortification",
        "Single Cell Protein (SCP)",
        "Tissue Culture",
      ],
      "Microbes in Human Welfare": [
        "Microbes in Household Products",
        "Microbes in Industrial Products",
        "Fermented Beverages",
        "Antibiotics",
        "Chemicals, Enzymes and Bioactive Molecules",
        "Microbes in Sewage Treatment",
        "Microbes in Production of Biogas",
        "Microbes as Biocontrol Agents",
        "Microbes as Biofertilisers",
        "Role of Microbes in Human Welfare",
      ],
      "Biotechnology: Principles and Processes": [
        "Principles of Biotechnology",
        "Genetic Engineering (Recombinant DNA Technology)",
        "Tools of Recombinant DNA Technology",
        "Restriction Enzymes",
        "Cloning Vectors",
        "Competent Host for Transformation",
        "Processes of Recombinant DNA Technology",
        "Isolation of Genetic Material",
        "Amplification of Gene of Interest Using PCR",
        "Insertion of Recombinant DNA into Host",
        "Bioreactors and Downstream Processing",
      ],
      "Biotechnology and its Applications": [
        "Biotechnological Applications in Agriculture",
        "Bt Crops",
        "Pest Resistant Plants – RNA Interference",
        "Biotechnological Applications in Medicine",
        "Genetically Engineered Insulin",
        "Gene Therapy",
        "Molecular Diagnosis",
        "Transgenic Animals",
        "Ethical Issues and Biopiracy",
        "GEAC and Biosafety",
      ],
      "Organisms and Populations": [
        "Organism and Its Environment",
        "Major Abiotic Factors",
        "Responses to Abiotic Factors",
        "Adaptations",
        "Populations – Attributes",
        "Population Growth",
        "Exponential and Logistic Growth",
        "Life History Variation",
        "Population Interactions",
        "Predation, Competition and Parasitism",
        "Commensalism, Mutualism and Amensalism",
      ],
      "Ecosystem": [
        "Ecosystem – Structure and Function",
        "Productivity",
        "Decomposition",
        "Energy Flow",
        "Food Chains and Food Webs",
        "Ecological Pyramids",
        "Ecological Succession",
        "Primary and Secondary Succession",
        "Nutrient Cycling",
        "Carbon and Phosphorus Cycles",
        "Ecosystem Services",
      ],
      "Biodiversity and Conservation": [
        "Biodiversity – Levels",
        "Genetic, Species and Ecological Diversity",
        "Patterns of Biodiversity",
        "Latitudinal Gradients",
        "Species-Area Relationships",
        "Importance of Species Diversity",
        "Loss of Biodiversity",
        "Causes of Biodiversity Loss",
        "Biodiversity Conservation – In Situ",
        "Ex Situ Conservation",
        "Biodiversity Hotspots",
      ],
      "Environmental Issues": [
        "Air Pollution and Its Control",
        "Controlling Vehicular Air Pollution",
        "Noise Pollution",
        "Water Pollution and Its Control",
        "Domestic Sewage and Industrial Effluents",
        "Eutrophication",
        "Solid Wastes",
        "Agrochemicals and Their Effects",
        "Radioactive Wastes",
        "Greenhouse Effect and Global Warming",
        "Ozone Depletion",
        "Deforestation",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA3 ──


// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA4 — Class 11 & 12 commerce + CS gaps
//  Accountancy, Economics, Business Studies, Computer Science
//  chapters that had no subtopics.
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA3, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3,
//      CHAPTER_SUBTOPICS_EXTRA4
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA4 = {

  // ════════════════════════════════════════════
  //  CLASS 11
  // ════════════════════════════════════════════
  "Class 11": {
    "Accountancy": {
      "Trial Balance and Rectification of Errors": [
        "Meaning of Trial Balance",
        "Objectives of Preparing a Trial Balance",
        "Preparation of Trial Balance",
        "Methods of Preparing Trial Balance",
        "Significance of Agreement of Trial Balance",
        "Types of Errors",
        "Errors of Omission and Commission",
        "Errors of Principle and Compensating Errors",
        "Errors Disclosed and Not Disclosed by Trial Balance",
        "Suspense Account",
        "Rectification of Errors",
      ],
      "Bill of Exchange": [
        "Meaning of Bill of Exchange",
        "Features of a Bill of Exchange",
        "Parties to a Bill of Exchange",
        "Promissory Note",
        "Important Terms Used in Bills of Exchange",
        "Accounting Treatment of Bills",
        "Honouring and Dishonour of a Bill",
        "Renewal of a Bill",
        "Retirement of a Bill",
        "Endorsement and Discounting of Bills",
        "Accommodation Bills",
      ],
      "Financial Statements II": [
        "Need for Adjustments",
        "Closing Stock",
        "Outstanding Expenses",
        "Prepaid Expenses",
        "Accrued Income",
        "Income Received in Advance",
        "Depreciation",
        "Bad Debts and Provision for Doubtful Debts",
        "Provision for Discount on Debtors",
        "Interest on Capital and Drawings",
        "Manager's Commission",
        "Preparation of Final Accounts with Adjustments",
      ],
      "Accounts from Incomplete Records": [
        "Meaning of Incomplete Records",
        "Features and Limitations of Incomplete Records",
        "Reasons for Incompleteness of Records",
        "Statement of Affairs Method",
        "Difference Between Statement of Affairs and Balance Sheet",
        "Conversion Method",
        "Preparation of Trading and Profit & Loss Account",
        "Calculation of Missing Figures",
        "Ascertainment of Credit Sales and Purchases",
        "Preparation of Total Debtors and Creditors Accounts",
      ],
      "Applications of Computers in Accounting": [
        "Meaning and Elements of a Computer System",
        "Capabilities and Limitations of a Computer System",
        "Components of a Computer",
        "Evolution of Computerised Accounting",
        "Features of Computerised Accounting System",
        "Management Information System (MIS)",
        "Accounting Information System (AIS)",
        "Data and Information",
        "Comparison of Manual and Computerised Accounting",
        "Role of Computers in Accounting",
      ],
      "Computerised Accounting System": [
        "Meaning of Computerised Accounting System",
        "Components of CAS",
        "Salient Features of CAS",
        "Grouping of Accounts",
        "Codification of Accounts",
        "Advantages of Computerised Accounting System",
        "Limitations of Computerised Accounting System",
        "Accounting Software Packages – Readymade, Customised, Tailor-made",
        "Considerations Before Sourcing Accounting Software",
        "Difference Between Manual and Computerised Accounting",
      ],
    },
    "Economics": {
      "Human Capital Formation in India": [
        "What is Human Capital?",
        "Sources of Human Capital Formation",
        "Investment in Education and Health",
        "Human Capital and Human Development",
        "Difference Between Human Capital and Human Development",
        "State of Human Capital Formation in India",
        "Education Sector in India",
        "Role of Human Capital in Economic Growth",
        "Growth of Education Sector in India",
        "Future Prospects of Human Capital Formation",
      ],
      "Rural Development": [
        "What is Rural Development?",
        "Key Issues in Rural Development",
        "Credit and Marketing in Rural Areas",
        "Sources of Rural Credit",
        "Agricultural Market System",
        "Emerging Alternative Marketing Channels",
        "Diversification into Productive Activities",
        "Animal Husbandry, Fisheries and Horticulture",
        "Organic Farming",
        "Sustainable Development and Organic Farming",
      ],
      "Employment: Growth Informalisation and Other Issues": [
        "Workers and Employment",
        "Participation of People in Employment",
        "Self-Employed and Hired Workers",
        "Employment in Firms, Factories and Offices",
        "Distribution of Workforce by Industry",
        "Growth and Changing Structure of Employment",
        "Informalisation of Workforce",
        "Unemployment – Types",
        "Government Measures for Employment Generation",
        "Trends in Employment Patterns",
      ],
      "Infrastructure": [
        "What is Infrastructure?",
        "Relevance of Infrastructure",
        "The State of Infrastructure in India",
        "Energy – Sources and Consumption Pattern",
        "Power/Electricity",
        "Challenges in the Power Sector",
        "Health Infrastructure",
        "Indicators of Health and Health Infrastructure",
        "State of Health Infrastructure in India",
        "Rural-Urban Divide in Infrastructure",
      ],
      "Environment and Sustainable Development": [
        "Environment – Definition and Functions",
        "State of India's Environment",
        "Global Warming and Ozone Depletion",
        "Supply-Demand Reversal of Environmental Resources",
        "Pollution and Its Types",
        "Sustainable Development – Meaning",
        "Strategies for Sustainable Development",
        "Use of Non-Conventional Sources of Energy",
        "LPG, CNG and Biogas",
        "Wind and Solar Power",
      ],
      "Comparative Development Experiences": [
        "Developmental Path – India, Pakistan and China",
        "Demographic Indicators Comparison",
        "Gross Domestic Product and Sectors",
        "Indicators of Human Development",
        "Development Strategies of India, China and Pakistan",
        "Economic Reforms in China, Pakistan and India",
        "Growth Rates Comparison",
        "Sectoral Contribution to GDP",
        "Human Development Index Comparison",
        "Appraisal of Development Strategies",
      ],
      "Presentation of Data": [
        "Presentation of Data – Introduction",
        "Textual Presentation of Data",
        "Tabular Presentation of Data",
        "Parts of a Table",
        "Diagrammatic Presentation of Data",
        "Bar Diagrams",
        "Pie Diagram",
        "Frequency Diagrams – Histogram",
        "Frequency Polygon and Ogive",
        "Arithmetic Line Graphs (Time Series Graph)",
      ],
      "Correlation": [
        "Meaning of Correlation",
        "Types of Correlation",
        "Positive and Negative Correlation",
        "Techniques for Measuring Correlation",
        "Scatter Diagram",
        "Karl Pearson's Coefficient of Correlation",
        "Spearman's Rank Correlation",
        "Properties of Correlation Coefficient",
        "Interpretation of Correlation Coefficient",
        "Degree of Correlation",
      ],
      "Index Numbers": [
        "Meaning of Index Numbers",
        "Features and Uses of Index Numbers",
        "Construction of an Index Number",
        "Simple Aggregative Method",
        "Simple Average of Price Relatives",
        "Weighted Index Numbers",
        "Consumer Price Index (CPI)",
        "Wholesale Price Index (WPI)",
        "Index of Industrial Production",
        "Inflation and Index Numbers",
      ],
      "Use of Statistical Tools": [
        "Steps in Preparing a Project",
        "Choosing a Topic",
        "Collection of Data",
        "Organisation and Presentation of Data",
        "Analysis and Interpretation of Data",
        "Application of Statistical Tools in a Project",
        "Deriving Meaningful Conclusions",
        "Preparing a Project Report",
        "Ethical Considerations in Using Data",
        "Practical Examples of Statistical Application",
      ],
    },
    "Business Studies": {
      "Private Public and Global Enterprises": [
        "Private Sector and Public Sector",
        "Forms of Public Sector Enterprises",
        "Departmental Undertakings",
        "Statutory Corporations",
        "Government Company",
        "Changing Role of Public Sector",
        "Global Enterprises (MNCs)",
        "Features of Global Enterprises",
        "Joint Ventures",
        "Public Private Partnership (PPP)",
      ],
      "Business Services": [
        "Nature of Services",
        "Types of Services – Business, Social, Personal",
        "Banking",
        "Types of Bank Accounts",
        "Banking Services – e-Banking",
        "Insurance and Its Principles",
        "Types of Insurance – Life, Fire, Marine",
        "Communication Services – Postal and Telecom",
        "Warehousing",
        "Transportation",
      ],
      "Emerging Modes of Business": [
        "e-Business – Meaning and Scope",
        "e-Business vs Traditional Business",
        "Benefits of e-Business",
        "Types of e-Business – B2B, B2C, C2C, Intra-B",
        "Online Transactions",
        "Payment Mechanisms",
        "Security and Safety of Business Transactions",
        "Business Process Outsourcing (BPO)",
        "Knowledge Process Outsourcing (KPO)",
        "Scope and Advantages of Outsourcing",
      ],
      "Social Responsibility of Business and Business Ethics": [
        "Concept of Social Responsibility",
        "Case For and Against Social Responsibility",
        "Responsibility Towards Different Interest Groups",
        "Reality of Social Responsibility",
        "Kinds of Social Responsibility",
        "Business and Environmental Protection",
        "Role of Business in Environmental Protection",
        "Business Ethics – Concept",
        "Elements of Business Ethics",
        "Need and Importance of Ethics in Business",
      ],
      "Formation of a Company": [
        "Stages in the Formation of a Company",
        "Promotion of a Company",
        "Functions of a Promoter",
        "Documents Required for Incorporation",
        "Memorandum of Association",
        "Articles of Association",
        "Incorporation of a Company",
        "Certificate of Incorporation",
        "Capital Subscription Stage",
        "Prospectus and Its Contents",
      ],
      "Small Business": [
        "Meaning of Small Business",
        "Role of Small Business in India",
        "Classification of Small Scale Industries (MSME)",
        "Cottage and Rural Industries",
        "Role of Small Business in Rural India",
        "Problems of Small Business",
        "Government Assistance to Small Industries",
        "National Small Industries Corporation (NSIC)",
        "District Industries Centres (DIC)",
        "Incentives for Small Business",
      ],
      "International Business I": [
        "Meaning of International Business",
        "Reasons for International Business",
        "Scope of International Business",
        "Benefits of International Business",
        "Modes of Entry into International Business",
        "Exporting and Importing",
        "Contract Manufacturing",
        "Licensing and Franchising",
        "Joint Ventures",
        "Wholly Owned Subsidiaries",
      ],
      "International Business II": [
        "Export Trade – Procedure",
        "Import Trade – Procedure",
        "Documents Used in Export-Import Trade",
        "Foreign Trade Promotion Measures and Schemes",
        "Organisational Support for Foreign Trade",
        "World Trade Organisation (WTO)",
        "Objectives and Functions of WTO",
        "Export Processing Zones (EPZ)",
        "Special Economic Zones (SEZ)",
        "Foreign Exchange and Payment Terms",
      ],
    },
    "Computer Science": {
      "Software Concepts": [
        "Types of Software",
        "System Software",
        "Operating System and Its Functions",
        "Utility Software",
        "Application Software",
        "Programming Languages",
        "Generations of Programming Languages",
        "Compiler, Interpreter and Assembler",
        "Free and Open Source Software",
        "Proprietary and Freeware Software",
      ],
      "Data Representation": [
        "Number Systems – Binary, Octal, Decimal, Hexadecimal",
        "Conversion Between Number Systems",
        "Binary Arithmetic",
        "Representation of Integers",
        "Representation of Characters – ASCII and Unicode",
        "Representation of Floating Point Numbers",
        "Boolean Logic",
        "Logic Gates",
        "Encoding Schemes",
        "Data Storage Units",
      ],
      "Microprocessor and Memory Concepts": [
        "Microprocessor – Introduction",
        "Components of a Microprocessor",
        "Types of Microprocessors",
        "Clock Speed and Word Size",
        "Memory – Primary and Secondary",
        "RAM and ROM",
        "Cache Memory",
        "Memory Units",
        "Types of ROM – PROM, EPROM, EEPROM",
        "Secondary Storage Devices",
      ],
      "Introduction to Programming": [
        "Basic Concepts of Programming",
        "Problem Solving Steps",
        "Algorithm",
        "Flowchart",
        "Pseudocode",
        "Program Design and Development",
        "Types of Errors",
        "Debugging",
        "Control Structures – Sequence, Selection, Iteration",
        "Modular Programming",
      ],
      "Societal Impacts": [
        "Digital Footprint",
        "Net and Communication Etiquettes",
        "Data Protection and Privacy",
        "Intellectual Property Rights",
        "Plagiarism and Its Avoidance",
        "Licensing and Copyright",
        "Free and Open Source Software",
        "Cybercrime and Cyber Safety",
        "Cyber Laws – IT Act",
        "E-Waste Management and Health Concerns",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 12
  // ════════════════════════════════════════════
  "Class 12": {
    "Accountancy": {
      "Dissolution of Partnership Firm": [
        "Meaning of Dissolution",
        "Dissolution of Partnership vs Dissolution of Firm",
        "Modes of Dissolution of a Firm",
        "Settlement of Accounts",
        "Realisation Account",
        "Treatment of Unrecorded Assets and Liabilities",
        "Preparation of Partners' Capital Accounts",
        "Preparation of Cash/Bank Account",
        "Treatment of Firm's Debts and Private Debts",
        "Insolvency of a Partner – Garner vs Murray Rule",
      ],
      "Issue and Redemption of Debentures": [
        "Meaning and Features of Debentures",
        "Types of Debentures",
        "Difference Between Shares and Debentures",
        "Issue of Debentures at Par, Premium and Discount",
        "Issue of Debentures for Consideration Other than Cash",
        "Issue of Debentures as Collateral Security",
        "Interest on Debentures",
        "Terms of Issue of Debentures",
        "Redemption of Debentures – Methods",
        "Debenture Redemption Reserve (DRR)",
      ],
      "Financial Statements of a Company": [
        "Meaning of Financial Statements",
        "Nature and Objectives of Financial Statements",
        "Types of Financial Statements",
        "Balance Sheet – Format (Schedule III)",
        "Statement of Profit and Loss – Format",
        "Contents of Balance Sheet",
        "Major Headings and Sub-Headings",
        "Uses and Importance of Financial Statements",
        "Limitations of Financial Statements",
        "Notes to Accounts",
      ],
      "Accounting Ratios": [
        "Meaning and Objectives of Ratio Analysis",
        "Types of Ratios",
        "Liquidity Ratios – Current and Quick Ratio",
        "Solvency Ratios – Debt-Equity and Total Assets to Debt",
        "Activity (Turnover) Ratios",
        "Inventory Turnover Ratio",
        "Trade Receivables and Payables Turnover Ratio",
        "Profitability Ratios – Gross and Net Profit Ratio",
        "Return on Investment",
        "Advantages and Limitations of Ratio Analysis",
      ],
    },
    "Economics": {
      "Introduction to Macroeconomics": [
        "Meaning of Macroeconomics",
        "Emergence of Macroeconomics",
        "Difference Between Micro and Macroeconomics",
        "Macroeconomic Variables",
        "Great Depression and Keynesian Economics",
        "Four Sectors of an Economy",
        "Circular Flow of Income",
        "Concepts of Stock and Flow",
        "Consumption and Investment Goods",
        "Scope and Importance of Macroeconomics",
      ],
      "Open Economy Macroeconomics": [
        "Meaning of Open Economy",
        "Balance of Payments",
        "Current Account and Capital Account",
        "Balance of Payments Deficit and Surplus",
        "Autonomous and Accommodating Transactions",
        "Foreign Exchange Rate",
        "Determination of Exchange Rate",
        "Flexible and Fixed Exchange Rates",
        "Managed Floating Exchange Rate",
        "Merits and Demerits of Exchange Rate Systems",
      ],
      "Introduction to Microeconomics": [
        "Meaning of Microeconomics",
        "What is an Economy?",
        "Central Problems of an Economy",
        "What, How and For Whom to Produce",
        "Production Possibility Frontier",
        "Opportunity Cost",
        "Positive and Normative Economics",
        "Central Problems and the PPC",
        "Economic Systems – Market, Centrally Planned, Mixed",
        "Scope of Microeconomics",
      ],
      "Market Equilibrium": [
        "Equilibrium – Meaning",
        "Market Equilibrium with Fixed Number of Firms",
        "Determination of Equilibrium Price and Quantity",
        "Effect of Shifts in Demand",
        "Effect of Shifts in Supply",
        "Simultaneous Shifts in Demand and Supply",
        "Market Equilibrium with Free Entry and Exit",
        "Applications – Price Ceiling",
        "Applications – Price Floor",
        "Effect of Taxes and Subsidies",
      ],
    },
    "Business Studies": {
      "Business Environment": [
        "Concept of Business Environment",
        "Features of Business Environment",
        "Importance of Business Environment",
        "Dimensions of Business Environment",
        "Economic Environment",
        "Social and Technological Environment",
        "Political and Legal Environment",
        "Economic Environment in India",
        "Impact of Government Policy Changes on Business",
        "Demonetisation and Its Impact",
      ],
      "Planning": [
        "Concept of Planning",
        "Importance of Planning",
        "Features of Planning",
        "Limitations of Planning",
        "Planning Process",
        "Types of Plans",
        "Objectives and Strategy",
        "Policy, Procedure and Method",
        "Rule, Budget and Programme",
        "Single-Use and Standing Plans",
      ],
      "Organising": [
        "Concept of Organising",
        "Importance of Organising",
        "Steps in the Process of Organising",
        "Functional Structure",
        "Divisional Structure",
        "Formal and Informal Organisation",
        "Delegation of Authority",
        "Elements of Delegation",
        "Decentralisation",
        "Importance of Delegation and Decentralisation",
      ],
      "Staffing": [
        "Concept and Importance of Staffing",
        "Staffing as a Part of Human Resource Management",
        "Staffing Process",
        "Recruitment – Sources",
        "Internal and External Sources of Recruitment",
        "Selection Process",
        "Training and Development",
        "On the Job and Off the Job Training Methods",
        "Importance of Training and Development",
        "Difference Between Training and Development",
      ],
      "Directing": [
        "Concept and Importance of Directing",
        "Principles of Directing",
        "Elements of Directing",
        "Supervision",
        "Motivation – Concept",
        "Maslow's Hierarchy of Needs",
        "Financial and Non-Financial Incentives",
        "Leadership – Concept and Styles",
        "Communication – Process",
        "Formal, Informal Communication and Barriers",
      ],
      "Controlling": [
        "Concept of Controlling",
        "Importance of Controlling",
        "Relationship Between Planning and Controlling",
        "Limitations of Controlling",
        "Controlling Process",
        "Setting Performance Standards",
        "Measurement of Actual Performance",
        "Comparing Performance with Standards",
        "Analysing Deviations",
        "Taking Corrective Action",
      ],
      "Entrepreneurship Development": [
        "Concept of Entrepreneurship",
        "Characteristics of Entrepreneurship",
        "Functions of an Entrepreneur",
        "Need and Importance of Entrepreneurship",
        "Entrepreneurship and Startups",
        "Process of Entrepreneurship Development",
        "Entrepreneurial Competencies",
        "Entrepreneurial Values and Attitudes",
        "Startup India Initiative",
        "Sources of Business Ideas and Opportunities",
      ],
    },
    "Computer Science": {
      "Exception Handling in Python": [
        "Introduction to Exceptions",
        "Errors vs Exceptions",
        "Types of Exceptions",
        "Handling Exceptions – try and except",
        "Multiple except Blocks",
        "The else Clause",
        "The finally Block",
        "Raising Exceptions",
        "Built-in Exceptions",
        "User-Defined Exceptions",
      ],
      "Communication Technologies": [
        "Evolution of Networking",
        "Concept of Communication",
        "Switching Techniques",
        "Transmission Media – Wired and Wireless",
        "Network Devices",
        "Network Protocols",
        "Wireless and Mobile Communication",
        "Mobile Telecommunication Technologies – 2G to 5G",
        "Network Security Concepts",
        "Web Services – WWW, HTML, XML, HTTP",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA4 ──

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA5 — Class 6, 7, 8 academic subjects
//  Mathematics, Science, Social Science chapters (new NCERT
//  curriculum: Ganita Prakash / Curiosity / Exploring Society)
//  that had no subtopics. English/Hindi/Sanskrit = EXTRA6-7.
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA4, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3,
//      CHAPTER_SUBTOPICS_EXTRA4, CHAPTER_SUBTOPICS_EXTRA5
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA5 = {

  // ════════════════════════════════════════════
  //  CLASS 6
  // ════════════════════════════════════════════
  "Class 6": {
    "Mathematics": {
      "Lines and Angles": [
        "Point, Line, Line Segment and Ray",
        "Angles and Their Types",
        "Measuring Angles with a Protractor",
        "Drawing Angles",
        "Acute, Right, Obtuse, Straight and Reflex Angles",
        "Comparing Angles",
        "Parallel and Intersecting Lines",
        "Perpendicular Lines",
        "Angles in Real Life",
      ],
      "Data Handling and Presentation": [
        "Collecting and Organising Data",
        "Pictographs",
        "Drawing and Interpreting Pictographs",
        "Bar Graphs",
        "Drawing Bar Graphs",
        "Reading and Interpreting Bar Graphs",
        "Scale in Graphs",
        "Organising Data into Tables",
        "Data in Daily Life",
      ],
      "Prime Time": [
        "Factors and Multiples",
        "Prime and Composite Numbers",
        "Co-prime Numbers",
        "Prime Factorisation",
        "Divisibility Rules",
        "Common Factors and Common Multiples",
        "HCF and LCM",
        "Sieve of Eratosthenes",
        "Number Patterns and Puzzles",
      ],
      "Perimeter and Area": [
        "Perimeter of Plane Figures",
        "Perimeter of Rectangle and Square",
        "Perimeter of a Triangle",
        "Area of Plane Figures",
        "Area by Counting Squares",
        "Area of Rectangle and Square",
        "Area of a Triangle (Introduction)",
        "Comparing Perimeter and Area",
        "Real-Life Applications",
      ],
      "Fractions": [
        "Meaning of Fractions",
        "Fractions on the Number Line",
        "Types of Fractions",
        "Equivalent Fractions",
        "Comparing Fractions",
        "Simplest Form of a Fraction",
        "Addition and Subtraction of Fractions",
        "Fraction of a Collection",
        "Mixed and Improper Fractions",
      ],
      "Playing with Constructions": [
        "Using a Ruler and Compass",
        "Constructing a Circle",
        "Constructing Line Segments",
        "Constructing Perpendiculars",
        "Constructing Angles",
        "Constructing a Square and Rectangle",
        "Drawing Curves and Patterns",
        "Points at a Fixed Distance",
        "Geometric Design Construction",
      ],
      "Symmetry": [
        "Line of Symmetry",
        "Figures with One or More Lines of Symmetry",
        "Reflection Symmetry",
        "Rotational Symmetry",
        "Order of Rotational Symmetry",
        "Symmetry in Everyday Objects",
        "Creating Symmetric Figures",
        "Symmetry in Rangoli and Art",
      ],
      "The Other Side of Zero": [
        "Introduction to Negative Numbers",
        "The Number Line with Negatives",
        "Integers",
        "Comparing and Ordering Integers",
        "Addition of Integers",
        "Subtraction of Integers",
        "Integers in Daily Life (Temperature, Depth)",
        "Zero as a Reference Point",
        "Representing Integers on the Number Line",
      ],
    },
    "Science": {
      "Diversity in the Living World": [
        "Living and Non-Living Things",
        "Characteristics of Living Things",
        "Biodiversity Around Us",
        "Grouping Living Organisms",
        "Classification of Plants",
        "Classification of Animals",
        "Habitats of Living Organisms",
        "Adaptations to Habitat",
        "Importance of Biodiversity",
      ],
      "Mindful Eating: A Path to a Healthy Body": [
        "Components of Food",
        "Carbohydrates and Fats",
        "Proteins",
        "Vitamins and Minerals",
        "Roughage and Water",
        "Balanced Diet",
        "Deficiency Diseases",
        "Food Habits and Culture",
        "Avoiding Food Wastage",
      ],
      "Exploring Magnets": [
        "Magnetic and Non-Magnetic Materials",
        "Poles of a Magnet",
        "Attraction and Repulsion",
        "Finding Directions with a Magnet",
        "The Compass",
        "Making a Magnet",
        "Uses of Magnets",
        "Caring for Magnets",
      ],
      "Measurement of Length and Motion": [
        "Need for Standard Units of Measurement",
        "Measuring Length Correctly",
        "SI Unit of Length",
        "Measuring Curved Lines",
        "Types of Motion",
        "Rectilinear, Circular and Periodic Motion",
        "Distance and Its Measurement",
        "Motion in Everyday Life",
      ],
      "Materials Around Us": [
        "Objects and Materials",
        "Properties of Materials",
        "Grouping Materials",
        "Appearance and Hardness",
        "Soluble and Insoluble Materials",
        "Materials that Float or Sink",
        "Transparent, Opaque and Translucent Materials",
        "Choosing Materials for Uses",
      ],
      "Temperature and its Measurement": [
        "Hot and Cold Objects",
        "Concept of Temperature",
        "The Thermometer",
        "Clinical and Laboratory Thermometers",
        "Reading a Thermometer",
        "Units of Temperature",
        "Measuring Temperature Safely",
        "Temperature in Daily Life",
      ],
      "A Journey through States of Water": [
        "Three States of Water",
        "Melting and Freezing",
        "Evaporation and Condensation",
        "Boiling",
        "The Water Cycle",
        "Water in the Atmosphere",
        "Conservation of Water",
        "Importance of Water",
      ],
      "Methods of Separation in Everyday Life": [
        "Need for Separation",
        "Handpicking, Winnowing and Sieving",
        "Sedimentation and Decantation",
        "Filtration",
        "Evaporation",
        "Condensation",
        "Using More than One Method",
        "Separation in Daily Life",
      ],
      "Living Creatures: Exploring their Characteristics": [
        "Characteristics of Living Organisms",
        "Movement in Living Things",
        "Growth and Reproduction",
        "Respiration in Living Beings",
        "Response to Stimuli",
        "Nutrition in Living Organisms",
        "Excretion",
        "Life Span of Organisms",
      ],
      "Nature's Treasures": [
        "Natural Resources",
        "Renewable and Non-Renewable Resources",
        "Resources from the Earth",
        "Air, Water and Soil as Resources",
        "Minerals and Fuels",
        "Forests and Their Products",
        "Conservation of Resources",
        "Sustainable Use of Nature's Treasures",
      ],
      "Beyond Earth": [
        "The Sky and Celestial Objects",
        "The Sun, Stars and Planets",
        "The Moon and Its Phases",
        "The Solar System",
        "Constellations",
        "Day and Night",
        "Artificial Satellites",
        "Space Exploration (Introduction)",
      ],
    },
    "Social Science": {
      "Landforms and Life": [
        "Major Landforms of the Earth",
        "Mountains",
        "Plateaus",
        "Plains",
        "Life in Mountains",
        "Life in Plateaus and Plains",
        "Landforms and Human Settlement",
        "Adapting to Different Landforms",
      ],
      "Timeline and Sources of History": [
        "What is History?",
        "Measuring Historical Time",
        "BCE and CE",
        "The Timeline",
        "Sources of History",
        "Archaeological Sources",
        "Literary Sources",
        "How Historians Reconstruct the Past",
      ],
      "The Beginnings of Indian Civilisation": [
        "Early Humans",
        "The Harappan (Indus Valley) Civilisation",
        "Town Planning of Harappa",
        "Life in Harappan Cities",
        "Trade and Crafts",
        "Decline of the Harappan Civilisation",
        "Continuity and Change",
        "Legacy of Early Civilisation",
      ],
      "India's Cultural Roots": [
        "The Vedic Age",
        "Vedic Literature",
        "Beliefs and Practices",
        "Rise of New Ideas",
        "Buddhism",
        "Jainism",
        "Cultural Values and Traditions",
        "Continuity in Indian Culture",
      ],
      "Unity in Diversity, or 'Many in the One'": [
        "Diversity in India",
        "Languages of India",
        "Religions and Festivals",
        "Food, Dress and Traditions",
        "Unifying Threads of Indian Culture",
        "National Symbols",
        "The Idea of Unity in Diversity",
        "Respecting Diversity",
      ],
      "Family and Community": [
        "What is a Family?",
        "Types of Families",
        "Roles and Responsibilities in a Family",
        "The Community",
        "Living Together in a Community",
        "Diversity within Communities",
        "Cooperation and Sharing",
        "Values in Family and Community",
      ],
      "Grassroots Democracy — Part 2: Local Government in Rural Areas": [
        "Rural Local Government",
        "The Gram Panchayat",
        "The Gram Sabha",
        "Functions of the Panchayat",
        "The Panchayat Secretary",
        "Sources of Funds",
        "Panchayat and Development Work",
        "Role of Citizens in Rural Governance",
      ],
      "Grassroots Democracy — Part 3: Local Government in Urban Areas": [
        "Urban Local Government",
        "Municipal Corporation and Municipality",
        "Ward Councillors",
        "Functions of Urban Local Bodies",
        "Provision of Civic Amenities",
        "Sources of Income",
        "Administration of Cities",
        "Role of Citizens in Urban Governance",
      ],
      "The Value of Work": [
        "What is Work?",
        "Types of Work",
        "Paid and Unpaid Work",
        "Dignity of Labour",
        "Division of Work",
        "Work and the Economy",
        "Occupations Around Us",
        "Respecting All Kinds of Work",
      ],
      "Economic Activities Around Us": [
        "What are Economic Activities?",
        "Primary Economic Activities",
        "Secondary Economic Activities",
        "Tertiary Economic Activities",
        "Production and Consumption",
        "Goods and Services",
        "Economic Activities in Daily Life",
        "Interdependence of Activities",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 7
  // ════════════════════════════════════════════
  "Class 7": {
    "Mathematics": {
      "Large Numbers Around Us": [
        "Reading and Writing Large Numbers",
        "Indian and International Place Value Systems",
        "Comparing Large Numbers",
        "Estimation of Large Numbers",
        "Rounding Off Numbers",
        "Operations with Large Numbers",
        "Large Numbers in Real Life",
        "Patterns in Large Numbers",
      ],
      "Arithmetic Expressions": [
        "Meaning of Arithmetic Expressions",
        "Terms in an Expression",
        "Order of Operations",
        "Brackets in Expressions",
        "Simplifying Expressions",
        "Comparing Expressions",
        "Writing Expressions from Situations",
        "Value of an Expression",
      ],
      "A Peek Beyond the Point": [
        "Introduction to Decimals",
        "Place Value in Decimals",
        "Reading and Writing Decimals",
        "Decimals on the Number Line",
        "Comparing Decimals",
        "Tenths and Hundredths",
        "Fractions and Decimals",
        "Decimals in Daily Life",
      ],
      "Expressions using Letter-Numbers": [
        "Introduction to Variables",
        "Letter-Numbers (Algebraic Letters)",
        "Forming Algebraic Expressions",
        "Terms and Coefficients",
        "Value of an Expression",
        "Rules and Formulas Using Letters",
        "Patterns Using Letter-Numbers",
        "Real-Life Use of Expressions",
      ],
      "Parallel and Intersecting Lines": [
        "Points, Lines and Line Segments",
        "Intersecting Lines",
        "Parallel Lines",
        "Transversal Lines",
        "Angles Formed by a Transversal",
        "Corresponding and Alternate Angles",
        "Properties of Parallel Lines",
        "Constructing Parallel Lines",
      ],
      "Number Play": [
        "Playing with Digits",
        "Number Patterns",
        "Palindromes",
        "Magic Squares",
        "Interesting Number Properties",
        "Digit Sums",
        "Puzzles with Numbers",
        "Number Tricks",
      ],
      "A Tale of Three Intersecting Lines": [
        "Triangles and Their Sides",
        "Types of Triangles by Sides",
        "Types of Triangles by Angles",
        "Angle Sum Property of a Triangle",
        "Exterior Angle of a Triangle",
        "Triangle Inequality",
        "Constructing Triangles",
        "Properties of Triangles",
      ],
      "Working with Fractions": [
        "Multiplication of Fractions",
        "Fraction of a Fraction",
        "Division of Fractions",
        "Reciprocal of a Fraction",
        "Multiplication and Division in Problems",
        "Fractions in Measurement",
        "Word Problems on Fractions",
        "Fractions in Daily Life",
      ],
      "Geometric Twins": [
        "Congruent Figures",
        "Congruence of Line Segments and Angles",
        "Congruence of Triangles",
        "Criteria for Congruence",
        "Similar Figures (Introduction)",
        "Symmetry and Congruence",
        "Identifying Geometric Twins",
        "Applications of Congruence",
      ],
      "Operations with Integers": [
        "Recall of Integers",
        "Addition of Integers",
        "Subtraction of Integers",
        "Multiplication of Integers",
        "Division of Integers",
        "Properties of Integer Operations",
        "Integers on the Number Line",
        "Word Problems on Integers",
      ],
      "Finding Common Ground": [
        "Common Factors and Multiples",
        "Highest Common Factor (HCF)",
        "Lowest Common Multiple (LCM)",
        "Prime Factorisation Method",
        "Relationship Between HCF and LCM",
        "Applications of HCF and LCM",
        "Word Problems",
        "Real-Life Uses",
      ],
      "Another Peek Beyond the Point": [
        "Operations on Decimals",
        "Addition and Subtraction of Decimals",
        "Multiplication of Decimals",
        "Division of Decimals",
        "Decimals and Fractions",
        "Decimals in Measurement",
        "Word Problems on Decimals",
        "Rounding Decimals",
      ],
      "Connecting the Dots": [
        "Introduction to Coordinate Ideas",
        "Locating Points",
        "Grids and Maps",
        "Rows and Columns",
        "Describing Positions",
        "Plotting Points",
        "Patterns on a Grid",
        "Real-Life Applications",
      ],
      "Constructions and Tilings": [
        "Basic Geometric Constructions",
        "Constructing Angles and Bisectors",
        "Constructing Perpendicular Bisectors",
        "Tiling and Tessellations",
        "Shapes that Tile a Plane",
        "Patterns in Tiling",
        "Creating Tiling Designs",
        "Symmetry in Tilings",
      ],
      "Finding the Unknown": [
        "Simple Equations",
        "Forming Equations from Statements",
        "Solving Simple Equations",
        "Balancing Method",
        "Transposition Method",
        "Checking Solutions",
        "Word Problems Using Equations",
        "Equations in Daily Life",
      ],
    },
    "Science": {
      "The Ever-Evolving World of Science": [
        "What is Science?",
        "The Scientific Method",
        "Observation and Experimentation",
        "Contributions of Scientists",
        "Science in Everyday Life",
        "Evolution of Scientific Ideas",
        "Tools and Techniques in Science",
        "Science and Society",
      ],
      "Exploring Substances: Acidic, Basic, and Neutral": [
        "Acids, Bases and Neutral Substances",
        "Natural Indicators",
        "Litmus Test",
        "Turmeric and China Rose Indicators",
        "Neutralisation",
        "Acids and Bases in Daily Life",
        "Uses of Neutralisation",
        "Testing Substances",
      ],
      "Electricity: Circuits and their Components": [
        "Electric Cell",
        "Electric Circuit",
        "Components of a Circuit",
        "Open and Closed Circuits",
        "Electric Switch",
        "Conductors and Insulators",
        "Effects of Electric Current",
        "Safety with Electricity",
      ],
      "The World of Metals and Non-metals": [
        "Metals and Non-metals",
        "Physical Properties of Metals",
        "Physical Properties of Non-metals",
        "Chemical Properties of Metals",
        "Reaction with Acids and Water",
        "Displacement Reactions",
        "Uses of Metals and Non-metals",
        "Metals and Non-metals in Daily Life",
      ],
      "Changes Around Us: Physical and Chemical": [
        "Physical Changes",
        "Chemical Changes",
        "Differences Between Physical and Chemical Changes",
        "Rusting of Iron",
        "Crystallisation",
        "Reversible and Irreversible Changes",
        "Chemical Changes in Daily Life",
        "Preventing Undesirable Changes",
      ],
      "Adolescence: A Stage of Growth and Change": [
        "Growing Up",
        "Changes at Adolescence",
        "Puberty and Its Changes",
        "Reproductive Health",
        "Role of Hormones",
        "Nutrition During Adolescence",
        "Personal Hygiene",
        "Emotional and Social Changes",
      ],
      "Heat Transfer in Nature": [
        "Heat and Temperature",
        "Conduction",
        "Convection",
        "Radiation",
        "Conductors and Insulators of Heat",
        "Sea Breeze and Land Breeze",
        "Heat Transfer in Daily Life",
        "Keeping Warm or Cool",
      ],
      "Measurement of Time and Motion": [
        "Measuring Time",
        "Units of Time",
        "The Simple Pendulum",
        "Slow and Fast Motion",
        "Speed",
        "Distance-Time Relationship",
        "Distance-Time Graphs",
        "Motion in Daily Life",
      ],
      "Life Processes in Animals": [
        "Nutrition in Animals",
        "Digestion in Human Beings",
        "Digestion in Grass-Eating Animals",
        "Respiration in Animals",
        "Circulation and Transport",
        "Excretion in Animals",
        "Response and Coordination",
        "Life Processes Working Together",
      ],
      "Life Processes in Plants": [
        "Nutrition in Plants",
        "Photosynthesis",
        "Transport in Plants",
        "Transpiration",
        "Respiration in Plants",
        "Reproduction in Plants",
        "Response in Plants",
        "Life Processes in Plants Working Together",
      ],
      "Light: Shadows and Reflections": [
        "Sources of Light",
        "Transparent, Opaque and Translucent Objects",
        "Formation of Shadows",
        "Properties of Shadows",
        "Reflection of Light",
        "Plane Mirrors and Images",
        "Rectilinear Propagation of Light",
        "Light in Daily Life",
      ],
      "Earth, Moon, and the Sun": [
        "The Sun as a Star",
        "The Earth and Its Motion",
        "Rotation and Day-Night",
        "Revolution and Seasons",
        "The Moon and Its Phases",
        "Eclipses",
        "The Solar System",
        "Celestial Objects in the Sky",
      ],
    },
    "Social Science": {
      "Understanding the Weather": [
        "Weather and Its Elements",
        "Temperature",
        "Humidity and Rainfall",
        "Air Pressure and Wind",
        "Measuring Weather",
        "Weather Instruments",
        "Weather Forecasting",
        "Weather in Daily Life",
      ],
      "Climates of India": [
        "Difference Between Weather and Climate",
        "Factors Affecting Climate",
        "Seasons of India",
        "The Monsoon",
        "Climatic Regions of India",
        "Rainfall Distribution",
        "Climate and Human Life",
        "Climate Change",
      ],
      "The Rise of Empires": [
        "What is an Empire?",
        "The Mauryan Empire",
        "Chandragupta Maurya",
        "Ashoka the Great",
        "Ashoka's Dhamma",
        "Administration of Empires",
        "Rise and Fall of Empires",
        "Legacy of Ancient Empires",
      ],
      "The Age of Reorganisation": [
        "Post-Mauryan Period",
        "New Kingdoms",
        "The Shungas and Satavahanas",
        "Foreign Invasions",
        "The Kushanas",
        "Trade and Economy",
        "Cultural Developments",
        "Political Reorganisation",
      ],
      "The Gupta Era: An Age of Tireless Creativity": [
        "The Gupta Empire",
        "Rulers of the Gupta Dynasty",
        "Administration Under the Guptas",
        "Golden Age of India",
        "Achievements in Science and Mathematics",
        "Art and Architecture",
        "Literature and Learning",
        "Legacy of the Gupta Era",
      ],
      "How the Land Becomes Sacred": [
        "Sacred Places in India",
        "Pilgrimage Sites",
        "Rivers and Mountains as Sacred",
        "Sacred Groves",
        "Religious Diversity and Sacred Land",
        "Sacredness Across Religions",
        "Culture and Sacred Geography",
        "Respect for Sacred Places",
      ],
      "From the Rulers to the Ruled: Types of Governments": [
        "What is Government?",
        "Need for a Government",
        "Types of Government",
        "Monarchy",
        "Democracy",
        "Oligarchy",
        "Levels of Government",
        "Government and Citizens",
      ],
      "From Barter to Money": [
        "The Barter System",
        "Problems of Barter",
        "Origin of Money",
        "Forms of Money",
        "Coins and Currency",
        "Modern Forms of Money",
        "Banks and Money",
        "Money in Daily Life",
      ],
      "Understanding Markets": [
        "What is a Market?",
        "Types of Markets",
        "Weekly Markets and Shops",
        "Wholesale and Retail Markets",
        "Chain of Markets",
        "Buyers and Sellers",
        "Online Markets",
        "Markets in Daily Life",
      ],
      "The Story of Indian Farming": [
        "Importance of Farming",
        "Types of Farming",
        "Crops of India",
        "Farming Seasons",
        "Traditional and Modern Farming",
        "Challenges Faced by Farmers",
        "Irrigation and Technology",
        "Farming and the Economy",
      ],
      "India and Her Neighbours": [
        "India's Location and Neighbours",
        "Relations with Neighbouring Countries",
        "Trade with Neighbours",
        "Cultural Ties",
        "Cooperation and Organisations (SAARC)",
        "Borders and Boundaries",
        "Importance of Good Relations",
        "India in South Asia",
      ],
      "Empires and Kingdoms: 6th to 10th Centuries": [
        "Political Scene After the Guptas",
        "Rise of Regional Kingdoms",
        "The Pallavas and Chalukyas",
        "The Rashtrakutas",
        "The Cholas",
        "The Tripartite Struggle",
        "Administration and Society",
        "Art and Temple Architecture",
      ],
      "Turning Tides: 11th and 12th Centuries": [
        "Political Changes",
        "The Rajput Kingdoms",
        "Turkish Invasions",
        "Mahmud of Ghazni and Muhammad Ghori",
        "Rise of New Powers",
        "Society and Economy",
        "Cultural Developments",
        "Changes in the Subcontinent",
      ],
      "India, A Home to Many": [
        "Diversity of People in India",
        "Migration and Settlement",
        "Communities and Cultures",
        "Languages and Religions",
        "Coexistence and Harmony",
        "Contributions of Different Communities",
        "Cultural Exchange",
        "Unity in Diversity",
      ],
      "The State, the Government, and You": [
        "What is a State?",
        "Elements of a State",
        "Government and Its Role",
        "The Citizen",
        "Rights and Duties of Citizens",
        "Relationship Between State and Citizen",
        "Participation in Governance",
        "Responsible Citizenship",
      ],
      "Infrastructure: Engine of India's Development": [
        "What is Infrastructure?",
        "Types of Infrastructure",
        "Transport Infrastructure",
        "Communication Infrastructure",
        "Power and Energy",
        "Water and Sanitation",
        "Infrastructure and Development",
        "Challenges in Infrastructure",
      ],
      "Banks and the Magic of Finance": [
        "What is a Bank?",
        "Functions of Banks",
        "Types of Bank Accounts",
        "Deposits and Loans",
        "Interest",
        "Digital Banking",
        "Role of Banks in the Economy",
        "Financial Awareness",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 8
  // ════════════════════════════════════════════
  "Class 8": {
    "Mathematics": {
      "A Square and A Cube": [
        "Square Numbers",
        "Properties of Square Numbers",
        "Square Roots",
        "Finding Square Roots",
        "Cube Numbers",
        "Properties of Cube Numbers",
        "Cube Roots",
        "Patterns in Squares and Cubes",
      ],
      "Power Play": [
        "Exponents and Powers",
        "Laws of Exponents",
        "Powers with Negative Exponents",
        "Expressing Large Numbers in Standard Form",
        "Very Small Numbers in Standard Form",
        "Multiplying and Dividing Powers",
        "Powers in Real Life",
        "Comparing Very Large and Small Numbers",
      ],
      "A Story of Numbers": [
        "History of Number Systems",
        "Number Systems Across Cultures",
        "Roman Numerals",
        "The Place Value System",
        "Zero and Its Importance",
        "Development of Numerals",
        "Number Systems in Different Bases",
        "Numbers Through the Ages",
      ],
      "Quadrilaterals": [
        "Types of Quadrilaterals",
        "Angle Sum Property of Quadrilaterals",
        "Properties of a Parallelogram",
        "Rhombus, Rectangle and Square",
        "Trapezium and Kite",
        "Diagonals of Quadrilaterals",
        "Constructing Quadrilaterals",
        "Quadrilaterals in Daily Life",
      ],
      "Number Play": [
        "Playing with Numbers",
        "Number Patterns",
        "Divisibility Tests",
        "Digit Puzzles",
        "Magic Squares",
        "Interesting Number Properties",
        "Number Games",
        "Reasoning with Numbers",
      ],
      "We Distribute, Yet Things Multiply": [
        "The Distributive Property",
        "Multiplication Using Distribution",
        "Algebraic Identities",
        "(a+b)² and (a-b)²",
        "(a+b)(a-b)",
        "Expanding Expressions",
        "Factorisation",
        "Applications of Identities",
      ],
      "Proportional Reasoning-1": [
        "Ratio",
        "Proportion",
        "Direct Proportion",
        "Unitary Method",
        "Comparing Quantities",
        "Percentage",
        "Applications of Proportion",
        "Proportion in Daily Life",
      ],
      "Fractions in Disguise": [
        "Rational Numbers",
        "Fractions and Rational Numbers",
        "Operations on Rational Numbers",
        "Rational Numbers on the Number Line",
        "Equivalent Rational Numbers",
        "Comparing Rational Numbers",
        "Rational Numbers Between Two Numbers",
        "Rational Numbers in Real Life",
      ],
      "The Baudhayana-Pythagoras Theorem": [
        "The Pythagoras Theorem",
        "Baudhayana's Contribution",
        "Right-Angled Triangles",
        "Verifying the Theorem",
        "Pythagorean Triples",
        "Applications of the Theorem",
        "Finding Unknown Sides",
        "Historical Significance",
      ],
      "Proportional Reasoning-2": [
        "Inverse Proportion",
        "Direct vs Inverse Proportion",
        "Time and Work Problems",
        "Speed, Distance and Time",
        "Percentage Change",
        "Profit and Loss",
        "Simple Interest",
        "Applications of Proportional Reasoning",
      ],
      "Exploring Some Geometric Themes": [
        "Lines and Angles Revisited",
        "Parallel Lines and Transversals",
        "Triangles and Their Properties",
        "Congruence and Similarity",
        "Geometric Constructions",
        "Symmetry",
        "Exploring Patterns",
        "Geometric Reasoning",
      ],
      "Tales by Dots and Lines": [
        "Introduction to Graphs",
        "Reading Graphs",
        "Line Graphs",
        "Bar Graphs and Histograms",
        "The Coordinate Plane",
        "Plotting Points",
        "Interpreting Data from Graphs",
        "Graphs in Daily Life",
      ],
      "Algebra Play": [
        "Algebraic Expressions",
        "Terms, Coefficients and Factors",
        "Addition and Subtraction of Expressions",
        "Multiplication of Expressions",
        "Algebraic Identities",
        "Factorisation",
        "Simple Equations",
        "Applications of Algebra",
      ],
      "Area": [
        "Area of Plane Figures",
        "Area of a Parallelogram",
        "Area of a Triangle",
        "Area of a Trapezium",
        "Area of a Rhombus",
        "Area of Polygons",
        "Surface Area of Solids",
        "Area in Daily Life",
      ],
    },
    "Science": {
      "Exploring the Investigative World of Science": [
        "What is Scientific Investigation?",
        "Asking Scientific Questions",
        "Observation and Hypothesis",
        "Designing Experiments",
        "Collecting and Analysing Data",
        "Drawing Conclusions",
        "Scientific Attitude",
        "Science in Everyday Life",
      ],
      "The Invisible Living World: Beyond Our Naked Eye": [
        "The Microscopic World",
        "Microorganisms",
        "Types – Bacteria, Fungi, Protozoa, Algae, Virus",
        "Useful Microorganisms",
        "Harmful Microorganisms",
        "Microorganisms and Food",
        "Food Preservation",
        "Microorganisms in the Environment",
      ],
      "Health: The Ultimate Treasure": [
        "Meaning of Health",
        "Components of Good Health",
        "Balanced Diet and Nutrition",
        "Communicable and Non-Communicable Diseases",
        "Prevention of Diseases",
        "Vaccination and Immunity",
        "Personal and Community Hygiene",
        "Healthy Lifestyle",
      ],
      "Electricity: Magnetic and Heating Effects": [
        "Electric Current",
        "Heating Effect of Electric Current",
        "Applications of Heating Effect",
        "Magnetic Effect of Electric Current",
        "Electromagnets",
        "Electric Bell",
        "Uses of Electromagnetic Effects",
        "Safety with Electricity",
      ],
      "Exploring Forces": [
        "Force and Its Effects",
        "Types of Forces",
        "Contact and Non-Contact Forces",
        "Friction",
        "Gravitational Force",
        "Magnetic and Electrostatic Forces",
        "Pressure",
        "Forces in Daily Life",
      ],
      "Pressure, Winds, Storms and Cyclones": [
        "Air Pressure",
        "Atmospheric Pressure",
        "Winds and Their Causes",
        "High and Low Pressure Areas",
        "Thunderstorms",
        "Cyclones",
        "Formation of Cyclones",
        "Safety Measures During Storms",
      ],
      "Particulate Nature of Matter": [
        "Matter is Made of Particles",
        "Characteristics of Particles",
        "States of Matter",
        "Arrangement of Particles in Solids, Liquids, Gases",
        "Diffusion",
        "Change of State",
        "Effect of Temperature and Pressure",
        "Evidence for Particle Nature",
      ],
      "Nature of Matter: Elements, Compounds and Mixtures": [
        "Pure Substances and Mixtures",
        "Elements",
        "Compounds",
        "Difference Between Compounds and Mixtures",
        "Types of Mixtures",
        "Homogeneous and Heterogeneous Mixtures",
        "Symbols and Formulae",
        "Classification of Matter",
      ],
      "The Amazing World of Solutes, Solvents and Solutions": [
        "Solutions and Their Components",
        "Solute and Solvent",
        "Types of Solutions",
        "Solubility",
        "Factors Affecting Solubility",
        "Saturated and Unsaturated Solutions",
        "Concentration of a Solution",
        "Solutions in Daily Life",
      ],
      "Light: Mirrors and Lenses": [
        "Reflection of Light",
        "Plane Mirrors",
        "Spherical Mirrors – Concave and Convex",
        "Images Formed by Mirrors",
        "Refraction of Light",
        "Lenses – Convex and Concave",
        "Images Formed by Lenses",
        "Uses of Mirrors and Lenses",
      ],
      "Keeping Time with the Skies": [
        "Measuring Time Using the Sky",
        "The Sun and the Day",
        "The Moon and the Month",
        "Phases of the Moon",
        "The Calendar",
        "Seasons and the Year",
        "Ancient Timekeeping",
        "Modern Timekeeping",
      ],
      "How Nature Works in Harmony": [
        "Interdependence in Nature",
        "Food Chains and Food Webs",
        "Ecosystems",
        "Balance in Nature",
        "Cycles in Nature",
        "Biodiversity",
        "Human Impact on Nature",
        "Conservation of Nature",
      ],
      "Our Home: Earth, a Unique Life Sustaining Planet": [
        "Earth in the Solar System",
        "Why Earth Supports Life",
        "The Atmosphere",
        "Water on Earth",
        "Land and Soil",
        "Natural Resources",
        "Protecting the Earth",
        "Earth's Uniqueness",
      ],
    },
    "Social Science": {
      "The Rise of the Marathas": [
        "Background of the Marathas",
        "Shivaji and the Maratha Kingdom",
        "Shivaji's Administration",
        "Expansion of Maratha Power",
        "The Peshwas",
        "The Maratha Confederacy",
        "Decline of the Marathas",
        "Legacy of the Marathas",
      ],
      "The Colonial Era in India": [
        "Arrival of European Powers",
        "The East India Company",
        "Expansion of British Rule",
        "Impact of Colonial Rule",
        "Economic Exploitation",
        "Social and Cultural Changes",
        "Resistance to Colonial Rule",
        "Towards the Freedom Struggle",
      ],
      "The Parliamentary System: Legislature and Executive": [
        "What is Parliament?",
        "The Legislature",
        "Lok Sabha and Rajya Sabha",
        "Making of Laws",
        "The Executive",
        "The President and Prime Minister",
        "Council of Ministers",
        "Legislature and Executive Relationship",
      ],
      "Factors of Production": [
        "What are Factors of Production?",
        "Land",
        "Labour",
        "Capital",
        "Enterprise (Entrepreneurship)",
        "Combining Factors of Production",
        "Rewards for Factors of Production",
        "Production in the Economy",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA5 ──

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA6 — Class 6-12 English literature
//  Every poem/prose chapter that had no subtopics.
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA5, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3,
//      CHAPTER_SUBTOPICS_EXTRA4, CHAPTER_SUBTOPICS_EXTRA5,
//      CHAPTER_SUBTOPICS_EXTRA6
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA6 = {

  // ════════════════════════════════════════════
  //  CLASS 6 — English
  // ════════════════════════════════════════════
  "Class 6": {
    "English": {
      "Rama to the Rescue": [
        "Introduction to the Story",
        "Context from the Ramayana",
        "Plot Summary",
        "Main Characters – Rama, Sita, Ravana",
        "Theme – Good vs Evil",
        "Values in the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Creative Writing",
      ],
      "The Unlikely Best Friends": [
        "Introduction to the Story",
        "Main Characters",
        "Plot Summary",
        "Theme – Unusual Friendship",
        "Kindness and Compassion",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values and Message",
      ],
      "A Friend's Prayer": [
        "Introduction to the Poem",
        "Theme – Friendship",
        "Poetic Devices",
        "Rhyme Scheme",
        "Imagery in the Poem",
        "Message of the Poem",
        "Vocabulary",
        "Comprehension Questions",
        "Value of True Friendship",
      ],
      "The Chair": [
        "Introduction to the Story",
        "Plot Summary",
        "Main Characters",
        "Theme and Message",
        "Humour in the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Creative Writing",
      ],
      "What a Bird Thought": [
        "Introduction to the Poem",
        "The Bird's Perspective",
        "Theme – Growth and Discovery",
        "Poetic Devices",
        "Rhyme Scheme",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "Spices that Heal Us": [
        "Introduction to the Lesson",
        "Indian Spices and Their Uses",
        "Spices as Medicine",
        "Turmeric, Ginger and Others",
        "Traditional Knowledge",
        "Vocabulary",
        "Comprehension Questions",
        "Health and Wellness",
        "Value of Traditional Remedies",
      ],
      "Change of Heart": [
        "Introduction to the Story",
        "Plot Summary",
        "Main Characters",
        "Theme – Transformation",
        "Kindness and Empathy",
        "Vocabulary",
        "Comprehension Questions",
        "Values and Message",
        "Creative Writing",
      ],
      "The Winner": [
        "Introduction to the Story",
        "Plot Summary",
        "Main Characters",
        "Theme – Determination and Success",
        "Sportsmanship",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values in the Story",
      ],
      "Yoga — A Way of Life": [
        "Introduction to Yoga",
        "History and Importance of Yoga",
        "Benefits of Yoga",
        "Yoga and Health",
        "Yoga in Daily Life",
        "Vocabulary",
        "Comprehension Questions",
        "International Yoga Day",
        "Value of a Healthy Lifestyle",
      ],
      "Hamara Bharat — Incredible India!": [
        "Introduction to the Lesson",
        "Diversity of India",
        "Culture and Heritage",
        "Landscapes and Geography",
        "Festivals and Traditions",
        "Vocabulary",
        "Comprehension Questions",
        "National Pride",
        "Unity in Diversity",
      ],
      "The Kites": [
        "Introduction to the Poem",
        "Theme – Freedom and Joy",
        "Imagery of Kites",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
        "Creative Writing",
      ],
      "Ila Sachani: Embroidering Dreams with her Feet": [
        "Introduction to Ila Sachani",
        "Her Life Story",
        "Overcoming Disability",
        "Her Art of Embroidery",
        "Theme – Perseverance",
        "Vocabulary",
        "Comprehension Questions",
        "Inspirational Message",
        "Values – Determination and Hope",
      ],
      "National War Memorial": [
        "Introduction to the Lesson",
        "About the National War Memorial",
        "Honouring the Soldiers",
        "Significance of the Memorial",
        "Patriotism and Sacrifice",
        "Vocabulary",
        "Comprehension Questions",
        "Respect for the Armed Forces",
        "Value of National Service",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 7 — English
  // ════════════════════════════════════════════
  "Class 7": {
    "English": {
      "Try Again": [
        "Introduction to the Poem",
        "Poet's Message",
        "Theme – Perseverance",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Value of Not Giving Up",
        "Inspirational Message",
      ],
      "Animals, Birds and Dr. Dolittle": [
        "Introduction to the Story",
        "About Dr. Dolittle",
        "Plot Summary",
        "Theme – Love for Animals",
        "Communication with Animals",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Kindness to Animals",
      ],
      "A Funny Man": [
        "Introduction to the Poem",
        "Theme – Humour",
        "Poetic Devices",
        "Rhyme Scheme",
        "Wordplay and Wit",
        "Vocabulary",
        "Comprehension Questions",
        "Enjoying Light Verse",
        "Message of the Poem",
      ],
      "Say the Right Thing": [
        "Introduction to the Lesson",
        "Plot Summary",
        "Importance of Words",
        "Theme – Communication",
        "Tact and Kindness in Speech",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values in Communication",
      ],
      "My Brother's Great Invention": [
        "Introduction to the Story",
        "Plot Summary",
        "Main Characters",
        "Theme – Creativity and Innovation",
        "Humour in the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Encouraging Inventiveness",
      ],
      "Paper Boats": [
        "Introduction to the Poem",
        "Poet – Rabindranath Tagore",
        "Theme – Childhood Dreams",
        "Symbolism of Paper Boats",
        "Poetic Devices",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "North, South, East, West": [
        "Introduction to the Lesson",
        "The Four Directions",
        "Plot / Content Summary",
        "Theme and Message",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Learning About Directions",
        "Creative Writing",
      ],
      "The Tunnel": [
        "Introduction to the Story",
        "Author – Ruskin Bond",
        "Setting and Plot Summary",
        "Main Characters",
        "Theme – Adventure and Nature",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values and Message",
      ],
      "Travel": [
        "Introduction to the Poem",
        "Poet – Edna St. Vincent Millay",
        "Theme – Longing to Travel",
        "Symbolism of the Train",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "Conquering the Summit": [
        "Introduction to the Lesson",
        "Story of Mountaineering",
        "Theme – Courage and Determination",
        "Overcoming Challenges",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Inspirational Message",
        "Value of Perseverance",
      ],
      "A Homage to Our Brave Soldiers": [
        "Introduction to the Lesson",
        "Sacrifice of Soldiers",
        "Theme – Patriotism",
        "Honouring the Armed Forces",
        "Vocabulary",
        "Comprehension Questions",
        "National Pride",
        "Respect for Soldiers",
        "Value of Service to the Nation",
      ],
      "My Dear Soldiers": [
        "Introduction to the Poem",
        "Theme – Gratitude to Soldiers",
        "Poetic Devices",
        "Rhyme Scheme",
        "Imagery of Bravery",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
        "Patriotic Values",
      ],
      "Rani Abbakka": [
        "Introduction to Rani Abbakka",
        "Her Life and Reign",
        "Resistance Against the Portuguese",
        "Theme – Courage and Leadership",
        "A Forgotten Heroine",
        "Vocabulary",
        "Comprehension Questions",
        "Women in History",
        "Inspirational Message",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 8 — English
  // ════════════════════════════════════════════
  "Class 8": {
    "English": {
      "A Concrete Example": [
        "Introduction to the Lesson",
        "Plot / Content Summary",
        "Main Characters",
        "Theme and Message",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values in the Lesson",
        "Creative Writing",
      ],
      "Wisdom Paves the Way": [
        "Introduction to the Story",
        "Plot Summary",
        "Theme – Wisdom and Intelligence",
        "Moral of the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values and Message",
        "Application in Life",
      ],
      "A Tale of Valour: Major Somnath Sharma and the Battle of Badgam": [
        "Introduction to Major Somnath Sharma",
        "The Battle of Badgam",
        "Acts of Bravery",
        "Theme – Courage and Sacrifice",
        "The Param Vir Chakra",
        "Vocabulary",
        "Comprehension Questions",
        "Patriotism and Duty",
        "Inspirational Message",
      ],
      "Somebody's Mother": [
        "Introduction to the Poem",
        "Theme – Kindness and Compassion",
        "The Old Woman and the Boy",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
        "Values – Helping the Elderly",
      ],
      "Verghese Kurien — I Too Had A Dream": [
        "Introduction to Verghese Kurien",
        "The White Revolution",
        "Amul and Dairy Cooperatives",
        "Theme – Vision and Determination",
        "Contribution to India",
        "Vocabulary",
        "Comprehension Questions",
        "Inspirational Message",
        "Values – Service and Innovation",
      ],
      "The Case of the Fifth Word": [
        "Introduction to the Story",
        "Plot Summary",
        "The Mystery and Its Solution",
        "Main Characters",
        "Theme – Reasoning and Detection",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Logical Thinking",
      ],
      "The Magic Brush of Dreams": [
        "Introduction to the Story",
        "Plot Summary",
        "Main Characters",
        "Theme – Imagination and Justice",
        "Symbolism of the Brush",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values and Message",
      ],
      "Spectacular Wonders": [
        "Introduction to the Lesson",
        "Wonders of the World / Nature",
        "Content Summary",
        "Theme – Awe and Appreciation",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Value of Curiosity",
        "Creative Writing",
      ],
      "Harvest Hymn": [
        "Introduction to the Poem",
        "Theme – Gratitude for the Harvest",
        "Farming and Nature",
        "Poetic Devices",
        "Rhyme Scheme",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "Waiting for the Rain": [
        "Introduction to the Poem/Story",
        "Theme – Hope and Patience",
        "The Importance of Rain",
        "Poetic Devices / Narrative Style",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Message",
        "Value of Water",
      ],
      "Feathered Friend": [
        "Introduction to the Story",
        "Author – Arthur C. Clarke",
        "Setting – Space Station",
        "The Canary and Its Role",
        "Theme – Science and Life",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Observation and Care",
      ],
      "Magnifying Glass": [
        "Introduction to the Poem",
        "Theme – Curiosity and Discovery",
        "Seeing the World Closely",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
        "Value of Observation",
      ],
      "Bibha Chowdhuri: The Beam of Light that Lit the Path for Women in Indian Science": [
        "Introduction to Bibha Chowdhuri",
        "Her Life and Work",
        "Contribution to Physics",
        "Women in Indian Science",
        "Theme – Perseverance and Recognition",
        "Vocabulary",
        "Comprehension Questions",
        "Inspirational Message",
        "Value of Scientific Pursuit",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 9 — English
  // ════════════════════════════════════════════
  "Class 9": {
    "English": {
      "The Little Girl": [
        "Introduction to Katherine Mansfield",
        "The Father-Daughter Relationship",
        "Kezia's Fear of Her Father",
        "The Turning Point",
        "Theme – Understanding and Bonding",
        "Character Analysis – Kezia and Father",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Family Relationships",
      ],
      "The Snake and the Mirror": [
        "Introduction to Vaikom Muhammad Basheer",
        "The Doctor's Story",
        "The Snake Incident",
        "Theme – Vanity and Humility",
        "Humour in the Story",
        "Character of the Doctor",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Message of the Story",
      ],
      "Packing": [
        "Introduction to Jerome K. Jerome",
        "Plot Summary",
        "The Narrator, George and Harris",
        "Theme – Humour in Everyday Life",
        "The Dog Montmorency",
        "Comic Situations",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Enjoying Humorous Writing",
      ],
      "Reach for the Top": [
        "Part I – Santosh Yadav",
        "Santosh's Struggle and Achievements",
        "Part II – Maria Sharapova",
        "Maria's Journey to the Top",
        "Theme – Determination and Success",
        "Overcoming Obstacles",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Ambition and Hard Work",
      ],
      "The Bond of Love": [
        "Introduction to Kenneth Anderson",
        "The Story of Bruno the Bear",
        "Bruno and the Author's Wife",
        "Theme – Human-Animal Bond",
        "Love and Attachment",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Compassion for Animals",
      ],
      "Kathmandu": [
        "Introduction to Vikram Seth",
        "Travelogue as a Genre",
        "Visit to Pashupatinath and Baudhnath",
        "Sights and Sounds of Kathmandu",
        "Theme – Travel and Observation",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Descriptive Writing",
        "Cultural Reflections",
      ],
      "If I Were You": [
        "Introduction to Douglas James",
        "The One-Act Play",
        "Gerrard and the Intruder",
        "Theme – Presence of Mind",
        "Wit Over Force",
        "Character of Gerrard",
        "Vocabulary",
        "Comprehension Questions",
        "Drama as a Genre",
        "Message of the Play",
      ],
      "Rain on the Roof": [
        "Introduction to Coates Kinney",
        "Theme – Nostalgia and Comfort",
        "Sound of Rain",
        "Memories of the Mother",
        "Poetic Devices",
        "Rhyme Scheme",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "The Lake Isle of Innisfree": [
        "Introduction to W.B. Yeats",
        "Theme – Longing for Peace and Nature",
        "The Poet's Ideal Retreat",
        "Imagery of Nature",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Escape from City Life",
        "Message of the Poem",
      ],
      "A Legend of the Northland": [
        "Introduction to Phoebe Cary",
        "The Legend and Its Moral",
        "Saint Peter and the Old Woman",
        "Theme – Greed and Punishment",
        "The Ballad Form",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Values – Generosity",
      ],
      "No Men are Foreign": [
        "Introduction to James Kirkup",
        "Theme – Universal Brotherhood",
        "Message Against War",
        "Common Humanity",
        "Poetic Devices",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Peace and Harmony",
        "Message of the Poem",
      ],
      "The Duck and the Kangaroo": [
        "Introduction to Edward Lear",
        "The Nonsense Poem",
        "The Duck's Request",
        "The Kangaroo's Reply",
        "Theme – Friendship and Adventure",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Enjoying Light Verse",
      ],
      "On Killing a Tree": [
        "Introduction to Gieve Patel",
        "Theme – Resilience of Nature",
        "How a Tree Grows",
        "What It Takes to Kill a Tree",
        "Symbolism",
        "Poetic Devices",
        "Vocabulary",
        "Comprehension Questions",
        "Environmental Message",
        "Man vs Nature",
      ],
      "The Snake Trying": [
        "Introduction to W.W.E. Ross",
        "Theme – Sympathy for the Snake",
        "The Harmless Snake",
        "Poetic Devices",
        "Imagery of Movement",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Respect for All Creatures",
        "Message of the Poem",
      ],
      "A Slumber Did My Spirit Seal": [
        "Introduction to William Wordsworth",
        "Theme – Death and Nature",
        "The Poet's Grief",
        "Union with Nature",
        "Poetic Devices",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Romantic Poetry Features",
        "Message of the Poem",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 10 — English
  // ════════════════════════════════════════════
  "Class 10": {
    "English": {
      "Two Stories about Flying": [
        "His First Flight – Introduction",
        "The Young Seagull's Fear",
        "Overcoming Fear of Flying",
        "The Black Aeroplane – Introduction",
        "The Mysterious Pilot",
        "Theme – Courage and Faith",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Facing Fears",
      ],
      "Glimpses of India": [
        "A Baker from Goa",
        "Coorg",
        "Tea from Assam",
        "Cultural Diversity of India",
        "Theme – Indian Heritage and Traditions",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Descriptive Writing",
        "Appreciation of India's Diversity",
      ],
      "Mijbil the Otter": [
        "Introduction to Gavin Maxwell",
        "How Mijbil Came to the Author",
        "Mijbil's Playful Nature",
        "The Journey to England",
        "Theme – Human-Animal Bond",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Care for Animals",
        "Character of Mijbil",
      ],
      "Madam Rides the Bus": [
        "Introduction to Vallikkannan",
        "Valli's Curiosity",
        "Her First Bus Journey",
        "The Sight of the Dead Cow",
        "Theme – Childhood Curiosity and Growing Up",
        "Character of Valli",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Message of the Story",
      ],
      "The Sermon at Benares": [
        "Introduction – Gautama Buddha",
        "Kisa Gotami's Grief",
        "The Search for Mustard Seeds",
        "The Buddha's Teaching",
        "Theme – Acceptance of Death",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Spiritual Wisdom",
        "Message of the Sermon",
      ],
      "The Proposal": [
        "Introduction to Anton Chekhov",
        "The One-Act Play",
        "Characters – Lomov, Natalya, Chubukov",
        "The Quarrel over Oxen Meadows",
        "The Quarrel over the Dogs",
        "Theme – Marriage and Property",
        "Humour and Satire",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Play",
      ],
      "A Triumph of Surgery": [
        "Introduction to James Herriot",
        "Tricki the Overfed Dog",
        "Mrs Pumphrey's Pampering",
        "The Recovery at the Surgery",
        "Theme – Overindulgence",
        "Humour in the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Care and Discipline",
      ],
      "The Midnight Visitor": [
        "Introduction to Robert Arthur",
        "Ausable the Secret Agent",
        "Fowler's Expectations",
        "The Balcony Trick",
        "Theme – Presence of Mind",
        "Character of Ausable",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Wit Over Action",
      ],
      "A Question of Trust": [
        "Introduction to Victor Canning",
        "Horace Danby the Burglar",
        "The Woman in Red",
        "The Twist in the Tale",
        "Theme – Deception and Trust",
        "Irony in the Story",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Message of the Story",
      ],
      "Footprints without Feet": [
        "Introduction to H.G. Wells",
        "Griffin the Invisible Scientist",
        "Griffin's Misdeeds",
        "The Chase and Escape",
        "Theme – Misuse of Science",
        "Character of Griffin",
        "Vocabulary",
        "Comprehension Questions",
        "Science Fiction as a Genre",
        "Values – Responsible Use of Knowledge",
      ],
      "The Making of a Scientist": [
        "Introduction to Robert W. Peterson",
        "Richard Ebright's Early Curiosity",
        "Collecting Butterflies",
        "Science Fair Projects",
        "Theme – Curiosity and Hard Work",
        "The Making of a Scientist",
        "Vocabulary",
        "Comprehension Questions",
        "Grammar Practice",
        "Values – Perseverance in Science",
      ],
      "The Necklace": [
        "Introduction to Guy de Maupassant",
        "Matilda's Discontent",
        "The Borrowed Necklace",
        "The Loss and Its Consequences",
        "The Twist at the End",
        "Theme – Vanity and Its Cost",
        "Character of Matilda",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Story",
      ],
      "The Book That Saved the Earth": [
        "Introduction to Claire Boiko",
        "The Play Set in the Future",
        "The Martian Invasion",
        "The Book of Nursery Rhymes",
        "Theme – Power of Books",
        "Humour and Science Fiction",
        "Vocabulary",
        "Comprehension Questions",
        "Drama as a Genre",
        "Message of the Play",
      ],
      "A Tiger in the Zoo": [
        "Introduction to Leslie Norris",
        "Theme – Freedom vs Captivity",
        "The Tiger in the Cage",
        "The Tiger in the Wild",
        "Poetic Devices",
        "Contrast and Imagery",
        "Rhyme Scheme",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "How to Tell Wild Animals": [
        "Introduction to Carolyn Wells",
        "Theme – Humour and Wild Animals",
        "Describing Different Animals",
        "Poetic Devices",
        "Rhyme Scheme",
        "Wordplay and Wit",
        "Vocabulary",
        "Comprehension Questions",
        "Enjoying Humorous Verse",
        "Message of the Poem",
      ],
      "The Trees": [
        "Introduction to Adrienne Rich",
        "Theme – Nature Reclaiming Freedom",
        "Trees Moving from House to Forest",
        "Symbolism of the Trees",
        "Poetic Devices",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Interpretations of the Poem",
        "Message of the Poem",
      ],
      "Fog": [
        "Introduction to Carl Sandburg",
        "Theme – Nature and Imagery",
        "The Metaphor of the Cat",
        "Poetic Devices",
        "Imagery",
        "Free Verse",
        "Vocabulary",
        "Comprehension Questions",
        "Brevity in Poetry",
        "Message of the Poem",
      ],
      "The Tale of Custard the Dragon": [
        "Introduction to Ogden Nash",
        "Theme – Real vs Apparent Bravery",
        "The Characters and the Dragon",
        "The Pirate's Attack",
        "Poetic Devices",
        "Rhyme Scheme",
        "Humour in the Ballad",
        "Vocabulary",
        "Comprehension Questions",
        "Message of the Poem",
      ],
      "For Anne Gregory": [
        "Introduction to W.B. Yeats",
        "Theme – Inner vs Outer Beauty",
        "The Conversation in the Poem",
        "Poetic Devices",
        "Rhyme Scheme",
        "Symbolism",
        "Vocabulary",
        "Comprehension Questions",
        "True Love and Beauty",
        "Message of the Poem",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 11 — English
  // ════════════════════════════════════════════
  "Class 11": {
    "English": {
      "Landscape of the Soul": [
        "Introduction to Nathalie Trouveroy",
        "Chinese vs European Art",
        "The Story of the Chinese Painter",
        "Concept of Shanshui",
        "Theme – Art and Spirituality",
        "The Idea of Inner and Outer Space",
        "Vocabulary",
        "Comprehension Questions",
        "Art Appreciation",
        "Message of the Essay",
      ],
      "The Ailing Planet: the Green Movement's Role": [
        "Introduction to Nani Palkhivala",
        "The Green Movement",
        "Earth as a Living Organism",
        "Sustainable Development",
        "Depletion of Natural Resources",
        "Theme – Environmental Responsibility",
        "Vocabulary",
        "Comprehension Questions",
        "Human Impact on the Planet",
        "Message of the Essay",
      ],
      "The Adventure": [
        "Introduction to Jayant Narlikar",
        "Professor Gaitonde's Experience",
        "Alternate History – The Battle of Panipat",
        "The Concept of Parallel Worlds",
        "Theme – Science and Reality",
        "Catastrophe Theory",
        "Vocabulary",
        "Comprehension Questions",
        "Science Fiction Elements",
        "Message of the Story",
      ],
      "Silk Road": [
        "Introduction to Nick Middleton",
        "The Journey to Mount Kailash",
        "Travel Through the Terrain",
        "People and Places on the Way",
        "Theme – Travel and Pilgrimage",
        "Descriptive Writing",
        "Vocabulary",
        "Comprehension Questions",
        "Cultural Observations",
        "Message of the Travelogue",
      ],
      "The Voice of the Rain": [
        "Introduction to Walt Whitman",
        "Theme – The Water Cycle and Renewal",
        "The Rain as the Speaker",
        "Symbolism of Rain",
        "Poetic Devices",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Nature and Poetry",
        "Message of the Poem",
      ],
      "Father to Son": [
        "Introduction to Elizabeth Jennings",
        "Theme – Generation Gap",
        "The Father's Anguish",
        "Breakdown of Communication",
        "Poetic Devices",
        "Imagery and Tone",
        "Vocabulary",
        "Comprehension Questions",
        "Parent-Child Relationships",
        "Message of the Poem",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 12 — English
  // ════════════════════════════════════════════
  "Class 12": {
    "English": {
      "The Rattrap": [
        "Introduction to Selma Lagerlöf",
        "The Peddler and the Rattrap Philosophy",
        "The World as a Rattrap",
        "The Ironmaster's Mistake",
        "Edla's Kindness",
        "Theme – Redemption Through Compassion",
        "Vocabulary",
        "Comprehension Questions",
        "Character of the Peddler",
        "Message of the Story",
      ],
      "Indigo": [
        "Introduction to Louis Fischer",
        "The Champaran Movement",
        "Gandhi and the Indigo Sharecroppers",
        "Rajkumar Shukla's Role",
        "Theme – Satyagraha and Self-Reliance",
        "Gandhi's Leadership",
        "Vocabulary",
        "Comprehension Questions",
        "Historical Significance",
        "Message of the Chapter",
      ],
      "Poets and Pancakes": [
        "Introduction to Asokamitran",
        "Gemini Studios",
        "The Make-up Department",
        "The Poets and Office Life",
        "Theme – Behind the Scenes of Cinema",
        "Humour and Irony",
        "Vocabulary",
        "Comprehension Questions",
        "Life at Gemini Studios",
        "Message of the Chapter",
      ],
      "The Interview": [
        "Introduction to Christopher Silvester",
        "Part I – The Nature of Interviews",
        "Views For and Against Interviews",
        "Part II – Umberto Eco Interview",
        "Theme – Journalism and Public Life",
        "Vocabulary",
        "Comprehension Questions",
        "The Art of Interviewing",
        "Celebrity and Privacy",
        "Message of the Chapter",
      ],
      "Going Places": [
        "Introduction to A.R. Barton",
        "Sophie's Daydreams",
        "Sophie and Danny Casey",
        "Reality vs Fantasy",
        "Theme – Adolescent Dreams",
        "Character of Sophie",
        "Vocabulary",
        "Comprehension Questions",
        "Family and Aspirations",
        "Message of the Story",
      ],
      "An Elementary School Classroom in a Slum": [
        "Introduction to Stephen Spender",
        "Theme – Poverty and Inequality",
        "The Slum Children",
        "Contrast Between Classroom and Reality",
        "Poetic Devices",
        "Imagery",
        "Vocabulary",
        "Comprehension Questions",
        "Call for Social Change",
        "Message of the Poem",
      ],
      "A Roadside Stand": [
        "Introduction to Robert Frost",
        "Theme – Rural Poverty and Neglect",
        "The Roadside Stand",
        "City vs Country Life",
        "Poetic Devices",
        "Imagery and Tone",
        "Vocabulary",
        "Comprehension Questions",
        "Empathy for the Rural Poor",
        "Message of the Poem",
      ],
      "Aunt Jennifer's Tigers": [
        "Introduction to Adrienne Rich",
        "Theme – Oppression and Freedom",
        "Aunt Jennifer and Her Embroidery",
        "The Tigers as Symbols",
        "Poetic Devices",
        "Imagery and Contrast",
        "Vocabulary",
        "Comprehension Questions",
        "Feminist Perspective",
        "Message of the Poem",
      ],
      "The Enemy": [
        "Introduction to Pearl S. Buck",
        "Dr Sadao and the Wounded Soldier",
        "Conflict Between Duty and Humanity",
        "Wartime Setting",
        "Theme – Humanity Beyond Enmity",
        "Character of Dr Sadao",
        "Vocabulary",
        "Comprehension Questions",
        "Moral Dilemma",
        "Message of the Story",
      ],
      "On the Face of It": [
        "Introduction to Susan Hill",
        "The One-Act Play",
        "Derry and Mr Lamb",
        "Theme – Disability and Acceptance",
        "Overcoming Prejudice",
        "Character of Derry",
        "Vocabulary",
        "Comprehension Questions",
        "Drama as a Genre",
        "Message of the Play",
      ],
      "Memories of Childhood": [
        "The Cutting of My Long Hair – Zitkala-Sa",
        "Loss of Identity and Culture",
        "We Too are Human Beings – Bama",
        "Experience of Untouchability",
        "Theme – Discrimination and Resistance",
        "Marginalisation in Society",
        "Vocabulary",
        "Comprehension Questions",
        "Two Perspectives on Oppression",
        "Message of the Chapter",
      ],
      "The Third Level": [
        "Introduction to Jack Finney",
        "Charley and Grand Central Station",
        "The Mysterious Third Level",
        "Escape from Modern Anxiety",
        "Theme – Reality vs Illusion",
        "Psychology of Escapism",
        "Vocabulary",
        "Comprehension Questions",
        "Science Fiction Elements",
        "Message of the Story",
      ],
      "Should Wizard Hit Mommy": [
        "Introduction to John Updike",
        "Jack's Bedtime Story to Jo",
        "The Story of Roger Skunk",
        "Jo's Questions and Doubts",
        "Theme – Parenting and Growing Up",
        "Conflict Between Generations",
        "Vocabulary",
        "Comprehension Questions",
        "Innocence and Authority",
        "Message of the Story",
      ],
      "Evans Tries an O-Level": [
        "Introduction to Colin Dexter",
        "Evans the Prison Escaper",
        "The German O-Level Exam",
        "The Elaborate Escape Plan",
        "Theme – Cunning and Deception",
        "Twists in the Plot",
        "Vocabulary",
        "Comprehension Questions",
        "Detective Fiction Elements",
        "Message of the Story",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA6 ──


// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA7 — Class 6-12 Hindi & Sanskrit literature
//  Every Hindi/Sanskrit chapter that had no subtopics.
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA6, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3,
//      CHAPTER_SUBTOPICS_EXTRA4, CHAPTER_SUBTOPICS_EXTRA5,
//      CHAPTER_SUBTOPICS_EXTRA6, CHAPTER_SUBTOPICS_EXTRA7
//    )
// ══════════════════════════════════════════════════════════════

const CHAPTER_SUBTOPICS_EXTRA7 = {

  // ════════════════════════════════════════════
  //  CLASS 6 — Hindi & Sanskrit
  // ════════════════════════════════════════════
  "Class 6": {
    "Hindi": {
      "मातृभूमि": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","देशभक्ति की भावना",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "गोल": [
        "पाठ का परिचय","लेखक का परिचय","पाठ का सारांश","खेल और अनुशासन का महत्त्व",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
      "पहली बूँद": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","वर्षा और प्रकृति",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "हार की जीत": [
        "कहानी का परिचय","लेखक का परिचय","कहानी का सारांश","बाबा भारती और खड्गसिंह",
        "मुख्य भाव और संदेश","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
      "रहीम के दोहे": [
        "कवि का परिचय – रहीम","दोहों का भावार्थ","नीति और जीवन-मूल्य","अलंकार",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","दोहों की प्रासंगिकता",
      ],
      "मेरी माँ": [
        "पाठ का परिचय","लेखक का परिचय","पाठ का सारांश","माँ के प्रति प्रेम",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "जलाते चलो": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","आशा और प्रेरणा का संदेश",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "सत्रिया और बिहू नृत्य": [
        "पाठ का परिचय","असम के लोकनृत्य","सत्रिया नृत्य","बिहू नृत्य",
        "सांस्कृतिक महत्त्व","नए शब्द और अर्थ","प्रश्नोत्तर","भारतीय लोक-संस्कृति",
      ],
      "मैया मैं नहिं माखन खायो": [
        "कवि का परिचय – सूरदास","पद का भावार्थ","वात्सल्य और बाल-लीला","ब्रजभाषा की विशेषताएँ",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "परीक्षा": [
        "कहानी का परिचय","लेखक का परिचय – प्रेमचंद","कहानी का सारांश","कर्तव्यनिष्ठा का संदेश",
        "मुख्य पात्र","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "चेतक की वीरता": [
        "कविता का परिचय","कवि का परिचय","चेतक और महाराणा प्रताप","वीर रस",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "हिंद महासागर में छोटा-सा हिंदुस्तान": [
        "पाठ का परिचय","यात्रा-वृत्तांत","स्थान का परिचय","सांस्कृतिक विविधता",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "पेड़ की बात": [
        "पाठ का परिचय","पेड़ और पर्यावरण","पाठ का सारांश","प्रकृति-संरक्षण का संदेश",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
    },
    "Sanskrit": {
      "एषः कः? एषा का? एतत् किम्?": [
        "पाठ का परिचय","सर्वनाम – एषः, एषा, एतत्","लिंग-भेद","शब्दार्थ",
        "हिन्दी अनुवाद","सरल वाक्य-रचना","प्रश्नोत्तर","अभ्यास कार्य",
      ],
      "अहं च त्वं च": [
        "पाठ का परिचय","सर्वनाम – अहम्, त्वम्","पुरुषवाचक सर्वनाम","शब्दार्थ",
        "हिन्दी अनुवाद","संवाद अभ्यास","प्रश्नोत्तर","अभ्यास कार्य",
      ],
      "शूराः वयं धीराः वयम्": [
        "पाठ का परिचय","देशभक्ति और साहस","शब्दार्थ","हिन्दी अनुवाद",
        "क्रिया-रूप","गीत का वाचन","प्रश्नोत्तर","मूल्य-संदेश",
      ],
      "सः एव महान् चित्रकारः": [
        "पाठ का परिचय","कथा का सारांश","शब्दार्थ","हिन्दी अनुवाद",
        "व्याकरण – कारक","प्रश्नोत्तर","अभ्यास कार्य","शिक्षा और संदेश",
      ],
      "अतिथिदेवो भव": [
        "पाठ का परिचय","अतिथि-सत्कार का महत्त्व","शब्दार्थ","हिन्दी अनुवाद",
        "व्याकरण अभ्यास","प्रश्नोत्तर","अभ्यास कार्य","भारतीय संस्कृति में अतिथि",
      ],
      "बुद्धिः सर्वार्थसाधिका": [
        "पाठ का परिचय","बुद्धि की महत्ता","कथा का सारांश","शब्दार्थ",
        "हिन्दी अनुवाद","व्याकरण अभ्यास","प्रश्नोत्तर","शिक्षा और संदेश",
      ],
      "यो जानाति सः पण्डितः": [
        "पाठ का परिचय","ज्ञान का महत्त्व","कथा का सारांश","शब्दार्थ",
        "हिन्दी अनुवाद","व्याकरण अभ्यास","प्रश्नोत्तर","शिक्षा और संदेश",
      ],
      "त्वम् आपणं गच्छ": [
        "पाठ का परिचय","संवाद का सारांश","शब्दार्थ","हिन्दी अनुवाद",
        "क्रिया – लोट् लकार","प्रश्नोत्तर","अभ्यास कार्य","संवाद-रचना",
      ],
      "पृथिव्यां त्रीणि रत्नानि": [
        "पाठ का परिचय","जल, अन्न और सुभाषित","शब्दार्थ","हिन्दी अनुवाद",
        "व्याकरण अभ्यास","प्रश्नोत्तर","अभ्यास कार्य","सुभाषित का संदेश",
      ],
      "आलस्यं हि मनुष्याणां शरीरस्थो महान् रिपुः": [
        "पाठ का परिचय","आलस्य – एक शत्रु","सुभाषित का भावार्थ","शब्दार्थ",
        "हिन्दी अनुवाद","व्याकरण अभ्यास","प्रश्नोत्तर","परिश्रम का महत्त्व",
      ],
      "सङ्ख्यागणना ननु सरला": [
        "पाठ का परिचय","संस्कृत में संख्याएँ","एक से सौ तक गणना","शब्दार्थ",
        "हिन्दी अनुवाद","संख्या-अभ्यास","प्रश्नोत्तर","अभ्यास कार्य",
      ],
      "माधवस्य प्रियम् अङ्गम्": [
        "पाठ का परिचय","कथा का सारांश","शब्दार्थ","हिन्दी अनुवाद",
        "व्याकरण अभ्यास","प्रश्नोत्तर","अभ्यास कार्य","शिक्षा और संदेश",
      ],
      "वृक्षाः सत्पुरुषाः इव": [
        "पाठ का परिचय","वृक्ष और सत्पुरुष की तुलना","सुभाषित का भावार्थ","शब्दार्थ",
        "हिन्दी अनुवाद","व्याकरण अभ्यास","प्रश्नोत्तर","पर्यावरण और मूल्य",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 7 — Hindi
  // ════════════════════════════════════════════
  "Class 7": {
    "Hindi": {
      "माँ, कह एक कहानी": [
        "कविता का परिचय","कवि का परिचय – मैथिलीशरण गुप्त","कविता का भावार्थ","माँ और पुत्र का संवाद",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "तीन बुद्धिमान": [
        "कहानी का परिचय","कहानी का सारांश","मुख्य पात्र","बुद्धि और विवेक का संदेश",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
      "फूल और काँटा": [
        "कविता का परिचय","कवि का परिचय – अयोध्यासिंह उपाध्याय","कविता का भावार्थ","गुण और स्वभाव का महत्त्व",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "पानी रे पानी": [
        "पाठ का परिचय","जल का महत्त्व","पाठ का सारांश","जल-संरक्षण का संदेश",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","पर्यावरण-चेतना",
      ],
      "नहीं होना बीमार": [
        "पाठ का परिचय","स्वास्थ्य और स्वच्छता","पाठ का सारांश","रोग से बचाव के उपाय",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
      "गिरिधर कविराय की कुण्डलिया": [
        "कवि का परिचय – गिरिधर कविराय","कुण्डलिया का भावार्थ","नीति और लोक-व्यवहार","कुण्डलिया छंद का परिचय",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "वर्षा-बहार": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","वर्षा ऋतु का वर्णन",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बिरजू महाराज से साक्षात्कार": [
        "पाठ का परिचय","साक्षात्कार विधा","बिरजू महाराज का परिचय","कथक नृत्य",
        "पाठ का सारांश","नए शब्द और अर्थ","प्रश्नोत्तर","कला और साधना",
      ],
      "चिड़िया": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","स्वतंत्रता का प्रतीक",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "मीरा के पद": [
        "कवयित्री का परिचय – मीराबाई","पदों का भावार्थ","कृष्ण-भक्ति","भक्ति रस",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","भक्ति आंदोलन में मीरा",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 8 — Hindi
  // ════════════════════════════════════════════
  "Class 8": {
    "Hindi": {
      "स्वदेश": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","देशप्रेम की भावना",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "दो गौरैया": [
        "पाठ का परिचय","लेखक का परिचय","पाठ का सारांश","पशु-पक्षियों के प्रति संवेदना",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और शिक्षा",
      ],
      "एक आशीर्वाद": [
        "पाठ का परिचय","पाठ का सारांश","मुख्य भाव","बड़ों का आशीर्वाद",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "हरिद्वार": [
        "पाठ का परिचय","यात्रा-वर्णन","हरिद्वार का महत्त्व","सांस्कृतिक और धार्मिक परिचय",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "कबीर के दोहे": [
        "कवि का परिचय – कबीर","दोहों का भावार्थ","निर्गुण भक्ति और समाज-सुधार","सधुक्कड़ी भाषा",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","दोहों की प्रासंगिकता",
      ],
      "एक टोकरी भर मिट्टी": [
        "कहानी का परिचय","लेखक का परिचय – माधवराव सप्रे","कहानी का सारांश","संवेदना और मानवता",
        "मुख्य पात्र","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "मत बांधो": [
        "कविता का परिचय","कवि का परिचय","कविता का भावार्थ","स्वतंत्रता का संदेश",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "कदम मिलाकर चलना होगा": [
        "कविता का परिचय","कवि का परिचय – अटल बिहारी वाजपेयी","कविता का भावार्थ","एकता और संघर्ष का संदेश",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","प्रेरणादायक संदेश",
      ],
      "मित्रलाभ": [
        "पाठ का परिचय","पंचतंत्र की कथा","कथा का सारांश","मित्रता का महत्त्व",
        "मुख्य पात्र","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 9 — Hindi
  // ════════════════════════════════════════════
  "Class 9": {
    "Hindi": {
      "उपभोक्तावाद की संस्कृति": [
        "लेखक का परिचय – श्यामाचरण दुबे","निबंध का सारांश","उपभोक्तावाद की समस्या","विज्ञापन और बाज़ार का प्रभाव",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "साँवले सपनों की याद": [
        "लेखक का परिचय – जाबिर हुसैन","सालिम अली का परिचय","पाठ का सारांश","प्रकृति और पक्षी-प्रेम",
        "संस्मरण विधा","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "नाना साहब की पुत्री देवी मैना को भस्म कर दिया गया": [
        "लेखिका का परिचय – चपला देवी","रेखाचित्र विधा","1857 का स्वतंत्रता संग्राम","देवी मैना का बलिदान",
        "देशभक्ति की भावना","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "प्रेमचंद के फटे जूते": [
        "लेखक का परिचय – हरिशंकर परसाई","व्यंग्य विधा","पाठ का सारांश","प्रेमचंद का व्यक्तित्व",
        "सामाजिक व्यंग्य","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "मेरे बचपन के दिन": [
        "लेखिका का परिचय – महादेवी वर्मा","संस्मरण विधा","बचपन की यादें","तत्कालीन समाज और शिक्षा",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "एक कुत्ता और एक मैना": [
        "लेखक का परिचय – रवींद्रनाथ ठाकुर","पाठ का सारांश","पशु-पक्षियों के प्रति प्रेम","शांतिनिकेतन का परिवेश",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और संदेश",
      ],
      "इस जल प्रलय में": [
        "लेखक का परिचय – फणीश्वरनाथ रेणु","रिपोर्ताज विधा","बाढ़ का चित्रण","मानवीय संवेदना",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "रहीम के दोहे": [
        "कवि का परिचय – रहीम","दोहों का भावार्थ","नीति और जीवन-मूल्य","अलंकार",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","दोहों की प्रासंगिकता",
      ],
      "आदमी नामा": [
        "कवि का परिचय – नज़ीर अकबराबादी","कविता का भावार्थ","मनुष्य के विभिन्न रूप","मानवता का संदेश",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "एक फूल की चाह": [
        "कवि का परिचय – सियारामशरण गुप्त","कविता का भावार्थ","छुआछूत की समस्या","सामाजिक कुरीतियों पर प्रहार",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "गीत–अगीत": [
        "कवि का परिचय – रामधारी सिंह दिनकर","कविता का भावार्थ","गीत और अगीत का भाव","प्रकृति-चित्रण",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "नए इलाके में": [
        "कवि का परिचय – अरुण कमल","कविता का भावार्थ","बदलते परिवेश का चित्रण","स्मृति और आधुनिकता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "यमराज की दिशा": [
        "कवि का परिचय – चंद्रकांत देवताले","कविता का भावार्थ","माँ की सीख","लोक-विश्वास और यथार्थ",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बच्चे काम पर जा रहे हैं": [
        "कवि का परिचय – राजेश जोशी","कविता का भावार्थ","बाल-श्रम की समस्या","सामाजिक चिंता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 10 — Hindi
  // ════════════════════════════════════════════
  "Class 10": {
    "Hindi": {
      "देव के सवैये": [
        "कवि का परिचय – देव","सवैयों का भावार्थ","श्रृंगार और भक्ति","रीतिकालीन काव्य",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "जयशंकर प्रसाद – आत्मकथ्य": [
        "कवि का परिचय – जयशंकर प्रसाद","कविता का भावार्थ","आत्मकथा लिखने से इनकार","छायावादी काव्य",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "सूर्यकांत त्रिपाठी निराला": [
        "कवि का परिचय – निराला","'उत्साह' का भावार्थ","'अट नहीं रही है' का भावार्थ","प्रकृति और क्रांति",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "नागार्जुन – यह दंतुरित मुस्कान": [
        "कवि का परिचय – नागार्जुन","'यह दंतुरित मुस्कान' का भावार्थ","'फसल' का भावार्थ","वात्सल्य और श्रम",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "गिरिजाकुमार माथुर": [
        "कवि का परिचय – गिरिजाकुमार माथुर","'छाया मत छूना' का भावार्थ","सुख-दुख का दर्शन","जीवन का यथार्थ",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "ऋतुराज": [
        "कवि का परिचय – ऋतुराज","'कन्यादान' का भावार्थ","माँ की सीख","स्त्री-अस्मिता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "मंगलेश डबराल": [
        "कवि का परिचय – मंगलेश डबराल","'संगतकार' का भावार्थ","सहयोगी की भूमिका","श्रम और समर्पण",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "लखनवी अंदाज़": [
        "लेखक का परिचय – यशपाल","व्यंग्य विधा","पाठ का सारांश","नवाब साहब का प्रसंग",
        "सामंती अंदाज़ पर व्यंग्य","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "मानवीय करुणा की दिव्य चमक": [
        "लेखक का परिचय – सर्वेश्वर दयाल सक्सेना","फादर कामिल बुल्के का परिचय","पाठ का सारांश","करुणा और प्रेम",
        "संस्मरण विधा","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "एक कहानी यह भी": [
        "लेखिका का परिचय – मन्नू भंडारी","आत्मकथात्मक संस्मरण","पाठ का सारांश","पिता और स्वतंत्रता संग्राम का प्रभाव",
        "स्त्री-चेतना","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "स्त्री शिक्षा के विरोधी कुतर्कों का खंडन": [
        "लेखक का परिचय – महावीर प्रसाद द्विवेदी","निबंध का सारांश","स्त्री-शिक्षा का महत्त्व","कुतर्कों का खंडन",
        "तर्कपूर्ण भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "नौबतखाने में इबादत": [
        "लेखक का परिचय – यतींद्र मिश्र","बिस्मिल्लाह खाँ का परिचय","पाठ का सारांश","शहनाई और साधना",
        "व्यक्तित्व-चित्रण","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "संस्कृति": [
        "लेखक का परिचय – भदंत आनंद कौसल्यायन","निबंध का सारांश","संस्कृति और सभ्यता में अंतर","मानव-कल्याण",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सांस्कृतिक चेतना",
      ],
      "माता का आँचल": [
        "लेखक का परिचय – शिवपूजन सहाय","संस्मरण विधा","पाठ का सारांश","बचपन और माता-पिता का स्नेह",
        "ग्रामीण परिवेश","भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर",
      ],
      "जॉर्ज पंचम की नाक": [
        "लेखक का परिचय – कमलेश्वर","व्यंग्य कहानी","पाठ का सारांश","औपनिवेशिक मानसिकता पर व्यंग्य",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "साना-साना हाथ जोड़ि": [
        "लेखिका का परिचय – मधु कांकरिया","यात्रा-वृत्तांत","सिक्किम की यात्रा","प्रकृति-सौंदर्य",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","पर्यावरण-चेतना",
      ],
      "एही ठैयाँ झुलनी हेरानी हो रामा!": [
        "लेखक का परिचय – शिवप्रसाद मिश्र 'रुद्र'","कहानी का सारांश","स्वतंत्रता संग्राम का प्रसंग","लोक-जीवन का चित्रण",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","देशभक्ति की भावना",
      ],
      "मैं क्यों लिखता हूँ?": [
        "लेखक का परिचय – अज्ञेय","निबंध का सारांश","लेखन की प्रेरणा","आंतरिक और बाहरी विवशता",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 11 — Hindi
  // ════════════════════════════════════════════
  "Class 11": {
    "Hindi": {
      "संतों देखत जग बौराना": [
        "कवि का परिचय – कबीर","पद का भावार्थ","आडंबरों पर प्रहार","निर्गुण भक्ति",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "पतंग": [
        "कवि का परिचय – आलोक धन्वा","कविता का भावार्थ","बचपन और उल्लास","पतंग की प्रतीकात्मकता",
        "काव्य-सौंदर्य और बिंब","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "चंपा काले काले अच्छर नहीं चीन्हती": [
        "कवि का परिचय – त्रिलोचन","कविता का भावार्थ","चंपा का चरित्र","शिक्षा और ग्रामीण जीवन",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "बादल राग": [
        "कवि का परिचय – निराला","कविता का भावार्थ","क्रांति का आह्वान","बादल की प्रतीकात्मकता",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "कैमरे में बंद अपाहिज": [
        "कवि का परिचय – रघुवीर सहाय","कविता का भावार्थ","मीडिया पर व्यंग्य","संवेदनहीनता का चित्रण",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "सहर्ष स्वीकारा है": [
        "कवि का परिचय – गजानन माधव मुक्तिबोध","कविता का भावार्थ","सुख-दुख की स्वीकार्यता","प्रेम और आत्मीयता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "मियाँ नसीरुद्दीन": [
        "लेखिका का परिचय – कृष्णा सोबती","रेखाचित्र विधा","पाठ का सारांश","नानबाई कला और आत्मसम्मान",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","श्रम की गरिमा",
      ],
      "अपू के साथ ढाई साल": [
        "लेखक का परिचय – सत्यजीत राय","संस्मरण विधा","'पथेर पांचाली' का निर्माण","फिल्म-निर्माण की चुनौतियाँ",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","कला और समर्पण",
      ],
      "विदाई-संभाषण": [
        "लेखक का परिचय – बालमुकुंद गुप्त","व्यंग्य निबंध","पाठ का सारांश","लॉर्ड कर्जन पर व्यंग्य",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","राष्ट्रीय चेतना",
      ],
      "गलता लोहा": [
        "लेखक का परिचय – शेखर जोशी","कहानी का सारांश","मोहन और जातिगत भेदभाव","श्रम और आत्मनिर्भरता",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "रजनी": [
        "लेखिका का परिचय – मन्नू भंडारी","पटकथा विधा","पाठ का सारांश","रजनी का चरित्र और सामाजिक न्याय",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक जागरूकता",
      ],
      "जामुन का पेड़": [
        "लेखक का परिचय – कृष्ण चंदर","व्यंग्य कहानी","पाठ का सारांश","सरकारी तंत्र पर व्यंग्य",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "भारत माता": [
        "लेखक का परिचय – जवाहरलाल नेहरू","पाठ का सारांश","भारत माता का स्वरूप","जनता और राष्ट्र",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","राष्ट्रीय एकता",
      ],
      "आत्मा का ताप": [
        "लेखक का परिचय – सैयद हैदर रज़ा","आत्मकथात्मक संस्मरण","पाठ का सारांश","कला-साधना और संघर्ष",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","लगन और समर्पण",
      ],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 12 — Hindi
  // ════════════════════════════════════════════
  "Class 12": {
    "Hindi": {
      "दिन जल्दी-जल्दी ढलता है!": [
        "कवि का परिचय – हरिवंश राय बच्चन","कविता का भावार्थ","समय और जीवन","आशा और लगन",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "कविता के बहाने": [
        "कवि का परिचय – कुँवर नारायण","कविता का भावार्थ","कविता की असीमता","बच्चे और फूल का संदर्भ",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बात सीधी थी पर": [
        "कवि का परिचय – कुँवर नारायण","कविता का भावार्थ","भाषा और अभिव्यक्ति","सहजता का महत्त्व",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "कैमरे में बंद अपाहिज": [
        "कवि का परिचय – रघुवीर सहाय","कविता का भावार्थ","मीडिया पर व्यंग्य","संवेदनहीनता का चित्रण",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "सहर्ष स्वीकारा है": [
        "कवि का परिचय – गजानन माधव मुक्तिबोध","कविता का भावार्थ","सुख-दुख की स्वीकार्यता","प्रेम और आत्मीयता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "उषा": [
        "कवि का परिचय – शमशेर बहादुर सिंह","कविता का भावार्थ","भोर का प्रकृति-चित्रण","बिंब-योजना",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बादल राग": [
        "कवि का परिचय – निराला","कविता का भावार्थ","क्रांति का आह्वान","बादल की प्रतीकात्मकता",
        "काव्य-सौंदर्य और अलंकार","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "छोटा मेरा खेत": [
        "कवि का परिचय – उमाशंकर जोशी","कविता का भावार्थ","रचना-प्रक्रिया का रूपक","खेत और कविता की तुलना",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बगुलों के पंख": [
        "कवि का परिचय – उमाशंकर जोशी","कविता का भावार्थ","प्रकृति-सौंदर्य","बिंब और चित्रात्मकता",
        "काव्य-सौंदर्य","नए शब्द और अर्थ","प्रश्नोत्तर","रचनात्मक लेखन",
      ],
      "बाजार दर्शन": [
        "लेखक का परिचय – जैनेंद्र कुमार","निबंध का सारांश","बाज़ार और उपभोक्तावाद","मन की भूख और बाज़ार का जादू",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक संदेश",
      ],
      "काले मेघा पानी दे": [
        "लेखक का परिचय – धर्मवीर भारती","संस्मरण विधा","इंदर सेना और लोक-विश्वास","विज्ञान बनाम आस्था",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सांस्कृतिक चेतना",
      ],
      "पहलवान की ढोलक": [
        "लेखक का परिचय – फणीश्वरनाथ रेणु","कहानी का सारांश","लुट्टन सिंह पहलवान","लोक-कला और संघर्ष",
        "आंचलिक भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मूल्य और संदेश",
      ],
      "चार्ली चैप्लिन यानी हम सब": [
        "लेखक का परिचय – विष्णु खरे","निबंध का सारांश","चार्ली चैप्लिन की कला","हास्य और करुणा",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सिनेमा और समाज",
      ],
      "नमक": [
        "लेखिका का परिचय – रज़िया सज्जाद ज़हीर","कहानी का सारांश","सीमा-पार की भावनाएँ","देश-प्रेम और अपनापन",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","मानवीय संवेदना",
      ],
      "शिरीष के फूल": [
        "लेखक का परिचय – हजारी प्रसाद द्विवेदी","निबंध का सारांश","शिरीष और अवधूत की तुलना","जीवन-दर्शन",
        "भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","प्रकृति और मूल्य",
      ],
      "मेरी कल्पना का आदर्श समाज": [
        "लेखक का परिचय – डॉ. भीमराव आंबेडकर","निबंध का सारांश","आदर्श समाज की अवधारणा","स्वतंत्रता, समता और बंधुता",
        "तर्कपूर्ण भाषा-शैली","नए शब्द और अर्थ","प्रश्नोत्तर","सामाजिक न्याय",
      ],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA7 ──

// ══════════════════════════════════════════════════════════════
//  CHAPTER_SUBTOPICS_EXTRA8 — Classes 1-5 (all subjects)
//  English, Mathematics, Hindi, EVS. Primary-level, short and
//  age-appropriate subtopics. FINAL batch — completes the catalogue.
//
//  PASTE after the closing brace of CHAPTER_SUBTOPICS_EXTRA7, then:
//    const CHAPTER_SUBTOPICS = mergeSubtopics(
//      CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA,
//      CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3,
//      CHAPTER_SUBTOPICS_EXTRA4, CHAPTER_SUBTOPICS_EXTRA5,
//      CHAPTER_SUBTOPICS_EXTRA6, CHAPTER_SUBTOPICS_EXTRA7,
//      CHAPTER_SUBTOPICS_EXTRA8
//    )
// ══════════════════════════════════════════════════════════════

// Reusable primary-level templates
const _story = () => ["Introduction to the Story","What Happens in the Story","New Words and Meanings","Comprehension Questions","Fun Activity","The Lesson We Learn"]
const _poem  = () => ["Introduction to the Poem","What the Poem is About","Rhyme and Rhythm","New Words and Meanings","Comprehension Questions","Recite and Enjoy"]
const _hkatha = () => ["कहानी का परिचय","कहानी का सार","नए शब्द और अर्थ","प्रश्नोत्तर","गतिविधि","सीख"]
const _hkav   = () => ["कविता का परिचय","कविता का भाव","नए शब्द और अर्थ","प्रश्नोत्तर","गतिविधि","कविता का आनंद"]

const CHAPTER_SUBTOPICS_EXTRA8 = {

  // ════════════════════════════════════════════
  //  CLASS 1
  // ════════════════════════════════════════════
  "Class 1": {
    "English": {
      "The Bubble, the Straw and the Shoe": _story(),
      "Three Little Pigs": _story(),
      "After a Bath": _poem(),
      "The Balloon Man": _poem(),
      "One Little Kitten": _poem(),
      "Lalu and Peelu": _story(),
      "Clouds": _poem(),
      "Anandi's Rainbow": _story(),
      "Flying-man": _poem(),
      "The Tiger and the Mosquito": _story(),
      "Paheli": _story(),
      "A Kite": _poem(),
    },
    "Mathematics": {
      "Shapes and Space": ["Solid and Flat Shapes","Inside, Outside and On","Near and Far","Top, Bottom and Between","Big and Small","Sorting Shapes"],
      "Numbers from One to Nine": ["Counting Objects","Number Names 1 to 9","Reading and Writing Numbers","Comparing Numbers","Before, After and Between","Ordering Numbers"],
      "Addition": ["Meaning of Addition","Adding Objects","Adding Numbers up to 9","Addition Using Fingers","Word Problems","Addition is Putting Together"],
      "Subtraction": ["Meaning of Subtraction","Taking Away Objects","Subtraction up to 9","Subtraction Facts","Word Problems","Subtraction is Taking Away"],
      "Numbers from Ten to Twenty": ["Counting 10 to 20","Number Names","Tens and Ones","Comparing Numbers","Before, After and Between","Ordering Numbers"],
      "Time": ["Day and Night","Days of the Week","Morning, Afternoon, Evening","Sequence of Events","Fast and Slow","Reading a Simple Clock"],
      "Measurement": ["Long and Short","Tall and Short","Heavy and Light","Near and Far","Comparing Lengths","Measuring with Hands and Feet"],
      "Numbers from Twenty-one to Fifty": ["Counting 21 to 50","Number Names","Tens and Ones","Comparing Numbers","Skip Counting","Ordering Numbers"],
      "Data Handling": ["Sorting Objects","Grouping by Colour and Shape","Making Groups","Counting in Groups","Reading Simple Pictures"],
      "Patterns": ["What is a Pattern?","Patterns with Shapes","Patterns with Colours","Patterns with Numbers","Making Your Own Pattern"],
      "Numbers": ["Counting Numbers","Number Names","Reading and Writing Numbers","Comparing Numbers","Number Games"],
      "Money": ["Coins and Notes","Recognising Money","Counting Money","Buying and Selling","Value of Money"],
      "How Many": ["Counting How Many","Comparing Quantities","More and Less","Equal Groups","Counting Games"],
    },
    "Hindi": {
      "झूला": _hkav(),
      "आम की कहानी": _hkatha(),
      "आम की टोकरी": _hkav(),
      "पत्ते ही पत्ते": _hkav(),
      "पकौड़ी": _hkav(),
      "छुक-छुक गाड़ी": _hkav(),
      "रसोईघर": _hkatha(),
      "चूहो! म्याऊँ सो रही है": _hkav(),
      "बंदर और गिलहरी": _hkatha(),
      "पगड़ी": _hkatha(),
      "पतंग": _hkav(),
      "गेंद-बल्ला": _hkav(),
      "बंदर गया खेत में भाग": _hkav(),
    },
    "EVS": {
      "My Body": ["Parts of the Body","Sense Organs","Uses of Body Parts","Keeping the Body Clean","Healthy Habits"],
      "Plants Around Us": ["Different Kinds of Plants","Parts of a Plant","Uses of Plants","Caring for Plants","Plants We Eat"],
      "Animals Around Us": ["Different Kinds of Animals","Homes of Animals","What Animals Eat","Sounds Animals Make","Caring for Animals"],
      "My Family": ["Members of a Family","Types of Families","Roles in a Family","Helping at Home","Love and Respect"],
      "Our Food": ["Food We Eat","Sources of Food","Healthy and Junk Food","Meal Times","Not Wasting Food"],
      "Seasons": ["Summer, Winter and Rainy Season","Clothes We Wear","Weather Changes","Festivals in Seasons","Enjoying the Seasons"],
      "Water": ["Sources of Water","Uses of Water","Clean and Dirty Water","Saving Water","Importance of Water"],
      "Our Helper": ["People Who Help Us","Doctor, Teacher and Farmer","Community Helpers","How They Help Us","Respecting Helpers"],
      "My School": ["My Classroom","People in School","Things in School","School Rules","Enjoying School"],
      "My Neighbourhood": ["Places Around Us","People in the Neighbourhood","Shops and Buildings","Keeping It Clean","Being a Good Neighbour"],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 2
  // ════════════════════════════════════════════
  "Class 2": {
    "English": {
      "First Day at School": _poem(),
      "Haldi's Adventure": _story(),
      "I am Lucky!": _poem(),
      "I Want": _story(),
      "A Smile": _poem(),
      "The Wind and the Sun": _story(),
      "Rain": _poem(),
      "Storm in the Garden": _story(),
      "Funny Bunny": _story(),
      "Zoo Manners": _poem(),
      "Curlylocks and the Three Bears": _story(),
      "Mr Nobody": _poem(),
      "Granny Granny Please Comb my Hair": _poem(),
      "The Magic Porridge Pot": _story(),
      "Strange Talk": _poem(),
      "The Grasshopper and the Ant": _story(),
      "Hot Like Fire": _poem(),
      "Going to the Fair": _story(),
    },
    "Mathematics": {
      "What is Long, What is Round?": ["Long and Round Objects","Rolling and Sliding","Flat and Curved Surfaces","Sorting by Shape","Shapes Around Us"],
      "Counting in Groups": ["Counting in Twos","Counting in Fives","Counting in Tens","Making Equal Groups","Grouping Objects"],
      "How Much Can You Carry?": ["Heavy and Light","Comparing Weights","Balancing Objects","Using a Simple Balance","Estimating Weight"],
      "Counting in Tens": ["Groups of Ten","Tens and Ones","Number Names","Building Numbers","Counting to Hundred"],
      "Patterns": ["Patterns with Shapes","Patterns with Numbers","Growing Patterns","Repeating Patterns","Creating Patterns"],
      "Footprints": ["Shapes of Footprints","Big and Small Prints","Matching Prints","Symmetry in Prints","Tracing Shapes"],
      "Jugs and Mugs": ["More and Less Capacity","Comparing Containers","Measuring Liquid","Full and Empty","Estimating Capacity"],
      "Tens and Ones": ["Place Value","Tens and Ones","Making Two-Digit Numbers","Comparing Numbers","Expanding Numbers"],
      "My Funday": ["Days of the Week","Ordering Days","Calendar Reading","Planning a Day","Fun Activities"],
      "Add our Points": ["Adding Two-Digit Numbers","Addition Without Regrouping","Addition With Regrouping","Word Problems","Adding Points in a Game"],
      "Lines and Lines": ["Straight and Curved Lines","Drawing Lines","Sleeping and Standing Lines","Making Shapes with Lines","Patterns with Lines"],
      "Give and Take": ["Addition and Subtraction","Subtraction of Two-Digit Numbers","Regrouping in Subtraction","Word Problems","Giving and Taking"],
      "The Longest Step": ["Measuring with Steps","Long and Short Distances","Comparing Lengths","Non-Standard Units","Estimating Length"],
      "Birds Come, Birds Go": ["Addition and Subtraction Stories","More and Less","Counting Birds","Word Problems","Coming and Going"],
      "How Many Ponytails?": ["Collecting Data","Making Tally Marks","Reading Simple Graphs","Comparing Numbers","Counting and Recording"],
    },
    "Hindi": {
      "ऊँट चला": _hkav(),
      "भालू ने खेली फुटबॉल": _hkatha(),
      "म्याऊँ म्याऊँ": _hkatha(),
      "अधिक बलवान कौन?": _hkatha(),
      "दोस्त की मदद": _hkatha(),
      "बहुत हुआ": _hkav(),
      "मेरी किताब": _hkav(),
      "तितली और कली": _hkav(),
      "बुलबुल": _hkav(),
      "मीठी सारंगी": _hkatha(),
      "टेसू राजा बीच बाजार": _hkav(),
      "बोलने वाली गुफा": _hkatha(),
      "सूरज जल्दी आना जी": _hkav(),
    },
    "EVS": {
      "Plants": ["Kinds of Plants","Parts of a Plant","Uses of Plants","Growing a Plant","Caring for Plants"],
      "Animals": ["Kinds of Animals","Homes of Animals","What Animals Eat","Baby Animals","Caring for Animals"],
      "My Family and Friends": ["My Family Members","Relatives","My Friends","Sharing and Caring","Working Together"],
      "Shelter": ["Need for Shelter","Types of Houses","Materials for Houses","Animal Homes","Keeping Home Clean"],
      "Water": ["Sources of Water","Uses of Water","Clean Water","Saving Water","Water in Daily Life"],
      "Travel": ["Ways to Travel","Land, Water and Air Transport","Old and New Vehicles","Road Safety","Journeys We Make"],
      "Human Body": ["Parts of the Body","Sense Organs","Keeping the Body Healthy","Good Habits","Exercise and Rest"],
      "Food": ["Food We Eat","Sources of Food","Healthy Food","Cooking Food","Not Wasting Food"],
      "Festivals": ["Festivals We Celebrate","National Festivals","Religious Festivals","Harvest Festivals","Celebrating Together"],
      "Games We Play": ["Indoor and Outdoor Games","Team Games","Playing Fair","Games from Long Ago","Fun and Exercise"],
      "Safety and First Aid": ["Staying Safe at Home","Safety on the Road","Safety at Play","Simple First Aid","Asking for Help"],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 3
  // ════════════════════════════════════════════
  "Class 3": {
    "English": {
      "Colours": _poem(),
      "Badal and Moti": _story(),
      "Best Friends": _poem(),
      "Out in the Garden": _story(),
      "Talking Toys": _poem(),
      "Paper Boats": _story(),
      "The Big Laddoo": _story(),
      "Thank God": _poem(),
      "Madhu's Wish": _story(),
      "Night": _poem(),
      "Chanda Mama Counts the Stars": _story(),
      "Chandrayaan": _story(),
    },
    "Mathematics": {
      "What's in a Name?": ["Counting Letters and Names","Sorting and Grouping","Comparing Lengths of Names","Making Tables","Fun with Names"],
      "Toy Joy": ["Shapes of Toys","2D and 3D Shapes","Sorting Shapes","Faces, Edges and Corners","Making Shapes"],
      "Double Century": ["Numbers up to 200","Place Value","Reading and Writing Numbers","Comparing Numbers","Ordering Numbers"],
      "Vacation with My Nani Maa": ["Addition and Subtraction","Word Problems","Money and Spending","Estimation","Solving Everyday Problems"],
      "Fun with Shapes": ["2D Shapes","Sides and Corners","Patterns with Shapes","Tiling","Symmetry"],
      "House of Hundreds – I": ["Hundreds, Tens and Ones","Building Three-Digit Numbers","Place Value","Comparing Numbers","Expanded Form"],
      "Raksha Bandhan": ["Addition Stories","Grouping and Sharing","Word Problems","Patterns","Numbers in Festivals"],
      "Fair Share": ["Sharing Equally","Introduction to Division","Halves and Quarters","Grouping","Fair Distribution"],
      "House of Hundreds – II": ["Addition of Three-Digit Numbers","Subtraction of Three-Digit Numbers","Regrouping","Word Problems","Estimation"],
      "Fun at Class Party": ["Data Collection","Making Groups","Counting and Recording","Simple Graphs","Comparing Data"],
      "Filling and Lifting": ["Capacity – More and Less","Measuring Liquids","Weight – Heavy and Light","Using a Balance","Estimating"],
      "Give and Take": ["Addition and Subtraction","Regrouping","Word Problems","Money Problems","Mental Maths"],
      "Time Goes On": ["Reading a Clock","Hours and Minutes","Days, Weeks and Months","The Calendar","Sequencing Events"],
      "The Surajkund Fair": ["Money and Buying","Addition and Subtraction of Money","Making Change","Word Problems","Numbers at a Fair"],
    },
    "Hindi": {
      "सीखो": _hkav(),
      "चींटी": _hkav(),
      "कितने पैर?": _hkav(),
      "बया हमारी चिड़िया रानी!": _hkav(),
      "आम का पेड़": _hkatha(),
      "बीरबल की खिचड़ी": _hkatha(),
      "मित्र को पत्र": _hkatha(),
      "चतुर गीदड़": _hkatha(),
      "प्रकृति पर्व – फूलदेई": _hkatha(),
      "रस्साकशी": _hkatha(),
      "एक जादुई पिटारा": _hkatha(),
      "अपना-अपना काम": _hkatha(),
      "पेड़ों की अम्मा 'थिमक्का'": _hkatha(),
      "किसान की होशियारी": _hkatha(),
      "भारत": _hkav(),
      "चंद्रयान": _hkatha(),
      "बोलने वाली माँद": _hkatha(),
      "हम अनेक किंतु एक": _hkav(),
    },
    "EVS": {
      "Family and Friends": ["My Family","Relationships","Joint and Nuclear Families","Friends and Neighbours","Living Together"],
      "Going to the Mela": ["What is a Mela?","People at the Mela","Things at the Mela","Fun and Shopping","Local Fairs"],
      "Celebrating Festivals": ["Festivals of India","National Festivals","Religious Festivals","Seasonal Festivals","Celebrating Together"],
      "Getting to Know Plants": ["Parts of a Plant","Types of Plants","Uses of Plants","Growing Plants","Caring for Plants"],
      "Plants and Animals Live Together": ["Interdependence","Food from Plants and Animals","Homes and Habitats","Helping Each Other","Balance in Nature"],
      "Living in Harmony": ["Living Together","Sharing Resources","Respecting Others","Community Life","Cooperation"],
      "Water — A Precious Gift": ["Sources of Water","Uses of Water","Saving Water","Clean Water","Water Cycle (Simple)"],
      "Food We Eat": ["Sources of Food","Healthy Eating","Cooking Food","Food from Different Regions","Not Wasting Food"],
      "Staying Healthy and Happy": ["Good Habits","Cleanliness","Exercise and Rest","Healthy Food","Being Happy"],
      "This World of Things": ["Things Around Us","Natural and Man-Made Things","Materials","Uses of Things","Sorting Things"],
      "Making Things": ["How Things Are Made","Materials Used","Handmade and Machine-Made","Craftspeople","Making Something Ourselves"],
      "Taking Charge of Waste": ["Types of Waste","Reduce, Reuse, Recycle","Keeping Surroundings Clean","Dustbins and Disposal","Caring for the Environment"],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 4
  // ════════════════════════════════════════════
  "Class 4": {
    "English": {
      "Together We Can": _poem(),
      "The Tinkling Bells": _story(),
      "Be Smart, Be Safe": _story(),
      "One Thing at a Time": _poem(),
      "The Old Stag": _story(),
      "Braille": _story(),
      "Fit Body, Fit Mind, Fit Nation": _story(),
      "The Lagori Champions": _story(),
      "Hekko": _story(),
      "The Swing": _poem(),
      "A Journey to the Magical Mountains": _story(),
      "Maheshwar": _story(),
    },
    "Mathematics": {
      "Shapes Around Us": ["2D and 3D Shapes","Faces, Edges and Corners","Nets of Solids","Patterns with Shapes","Symmetry"],
      "Hide and Seek": ["Patterns in Numbers","Number Sequences","Odd and Even Numbers","Skip Counting","Finding Rules"],
      "Pattern Around Us": ["Repeating Patterns","Growing Patterns","Patterns in Nature","Number Patterns","Creating Patterns"],
      "Thousands Around Us": ["Numbers up to 10000","Place Value","Reading and Writing Large Numbers","Comparing Numbers","Ordering Numbers"],
      "Sharing and Measuring": ["Division as Sharing","Equal Groups","Introduction to Fractions","Halves and Quarters","Word Problems"],
      "Measuring Length": ["Units of Length","Metre and Centimetre","Measuring Objects","Estimation","Converting Units"],
      "The Cleanest Village": ["Data Collection","Bar Graphs","Reading Graphs","Comparing Data","Pictographs"],
      "Weigh it, Pour it": ["Weight – Kilogram and Gram","Capacity – Litre and Millilitre","Measuring Weight","Measuring Liquid","Estimation"],
      "Equal Groups": ["Multiplication as Repeated Addition","Multiplication Tables","Groups and Rows","Word Problems","Arrays"],
      "Elephants, Tigers and Leopards": ["Large Numbers","Addition and Subtraction","Word Problems","Estimation","Number Patterns"],
      "Fun with Symmetry": ["Line of Symmetry","Symmetrical Figures","Reflection","Making Symmetric Patterns","Symmetry in Nature"],
      "Ticking Clocks and Turning Calendar": ["Reading Time","Hours, Minutes and Seconds","Days, Weeks and Months","The Calendar","Time Problems"],
      "The Transport Museum": ["Multiplication and Division","Word Problems","Money Calculations","Data Handling","Everyday Maths"],
      "Data Handling": ["Collecting Data","Tally Marks","Pictographs","Bar Graphs","Interpreting Data"],
    },
    "Hindi": {
      "चिड़िया का गीत": _hkav(),
      "बगीचे का घोंघा": _hkatha(),
      "नीम": _hkav(),
      "हमारा आहार": _hkatha(),
      "आसमान गिरा": _hkatha(),
      "जयपुर से पत्र": _hkatha(),
      "नकली हीरे": _hkatha(),
      "ओणम के रंग": _hkatha(),
      "मिठाइयों का सम्मेलन": _hkatha(),
      "कैमरा": _hkatha(),
      "कविता का कमाल": _hkav(),
      "शतरंज में मात": _hkatha(),
      "हमारा आदित्य": _hkatha(),
    },
    "EVS": {
      "Living Together": ["Family and Community","Living in Groups","Cooperation","Respecting Others","Rules of Living Together"],
      "Exploring Our Neighbourhood": ["Places in the Neighbourhood","Community Helpers","Maps of the Area","Keeping It Clean","Being a Good Citizen"],
      "Nature Trail": ["Plants and Animals Around Us","Observing Nature","Habitats","Interdependence","Protecting Nature"],
      "Growing up with Nature": ["Plants and Their Growth","Animals and Their Young","Life Cycles","Seasons and Nature","Caring for Living Things"],
      "Food for Health": ["Balanced Diet","Sources of Food","Cooking and Preserving","Healthy Eating Habits","Avoiding Food Waste"],
      "Happy and Healthy Living": ["Good Habits","Cleanliness and Hygiene","Exercise and Rest","Mental Wellbeing","Staying Safe"],
      "How Things Work": ["Simple Machines","Everyday Devices","Sources of Energy","Using Things Safely","Machines That Help Us"],
      "How Things are Made": ["Materials and Their Uses","Handmade and Machine-Made","Craftspeople and Workers","From Raw to Finished","Making Things Ourselves"],
      "Different Lands, Different Lives": ["Life in Different Regions","Mountains, Plains and Deserts","Adapting to Surroundings","Homes and Clothes","Diversity of Life"],
      "Our Sky": ["The Sun, Moon and Stars","Day and Night","Phases of the Moon","Stars and Constellations","Looking at the Sky"],
    },
  },

  // ════════════════════════════════════════════
  //  CLASS 5
  // ════════════════════════════════════════════
  "Class 5": {
    "English": {
      "Papa's Spectacles": _poem(),
      "Gone with the Scooter": _story(),
      "The Rainbow": _poem(),
      "The Wise Parrot": _story(),
      "The Frog": _story(),
      "What a Tank!": _story(),
      "Gilli Danda": _story(),
      "The Decision of the Panchayat": _story(),
      "Vocation": _poem(),
      "Glass Bangles": _story(),
    },
    "Mathematics": {
      "We the Travellers — I": ["Large Numbers","Place Value","Distances and Journeys","Addition and Subtraction","Estimation"],
      "Fractions": ["Understanding Fractions","Types of Fractions","Equivalent Fractions","Comparing Fractions","Adding and Subtracting Fractions"],
      "Angles as Turns": ["What is an Angle?","Types of Angles","Measuring Angles","Turns and Rotations","Angles Around Us"],
      "We the Travellers — II": ["Multiplication and Division","Speed, Distance and Time","Word Problems","Estimation","Everyday Calculations"],
      "Far and Near": ["Measuring Distance","Units of Length","Maps and Scale","Comparing Distances","Estimation"],
      "The Dairy Farm": ["Multiplication","Division","Word Problems","Measurement of Quantity","Data Handling"],
      "Shapes and Patterns": ["2D and 3D Shapes","Nets of Solids","Patterns and Tiling","Symmetry","Creating Designs"],
      "Weight and Capacity": ["Kilogram and Gram","Litre and Millilitre","Measuring Weight","Measuring Capacity","Word Problems"],
      "Coconut Farm": ["Multiplication and Division","Large Numbers","Word Problems","Estimation","Data Handling"],
      "Symmetrical Designs": ["Line of Symmetry","Symmetrical Figures","Reflection and Rotation","Making Patterns","Symmetry in Art"],
      "Grandmother's Quilt": ["Patterns and Shapes","Tiling","Symmetry","Area (Introduction)","Designing Patterns"],
      "Racing Seconds": ["Measuring Time","Hours, Minutes and Seconds","Reading Timetables","Calendar and Dates","Time Problems"],
      "Animal Jumps": ["Number Patterns","Skip Counting","Multiples and Factors","Number Line","Sequences"],
      "Maps and Locations": ["Reading Maps","Directions","Scale and Distance","Locating Places","Drawing Simple Maps"],
      "Data Through Pictures": ["Collecting Data","Pictographs","Bar Graphs","Interpreting Data","Comparing Information"],
    },
    "Hindi": {
      "किरन": _hkav(),
      "न्याय की कुर्सी": _hkatha(),
      "चाँद का कुर्ता": _hkav(),
      "साङकेन": _hkatha(),
      "सुंदरिया": _hkatha(),
      "चतुर चित्रकार": _hkatha(),
      "मेरा बचपन": _hkatha(),
      "काजीरंगा राष्ट्रीय उद्यान की यात्रा": _hkatha(),
      "न्याय": _hkatha(),
      "तीन मछलियाँ": _hkatha(),
      "हमारे ये कलामंदिर": _hkatha(),
      "गंगा की कहानी": _hkatha(),
    },
    "EVS": {
      "Water – The Essence of Life": ["Sources of Water","Uses of Water","Water Scarcity","Saving Water","Water Cycle"],
      "Journey of a River": ["Where Rivers Begin","The Path of a River","Rivers and People","Uses of Rivers","Keeping Rivers Clean"],
      "The Mystery of Food": ["Where Food Comes From","Food Journey – Farm to Table","Preserving Food","Healthy Eating","Food and Culture"],
      "Our School – A Happy Place": ["Life at School","People in School","Rules and Values","Working Together","A Safe School"],
      "Our Vibrant Country": ["Diversity of India","States and Regions","Languages and Cultures","Festivals and Traditions","Unity in Diversity"],
      "Some Unique Places": ["Special Places in India","Mountains, Deserts and Forests","Historical Places","Natural Wonders","Protecting These Places"],
      "Energy – How Things Work": ["Sources of Energy","Uses of Energy","Simple Machines","Saving Energy","Renewable Energy (Introduction)"],
      "Clothes – How Things are Made": ["Materials for Clothes","From Fibre to Fabric","Weaving and Stitching","Clothes in Different Regions","Caring for Clothes"],
      "Rhythms of Nature": ["Day and Night","Seasons","Plants and Animals in Seasons","Cycles in Nature","Living with Nature"],
      "Earth – Our Shared Home": ["The Earth We Live On","Land, Water and Air","Natural Resources","Protecting the Earth","Caring for Our Planet"],
    },
  },

}  // ── end CHAPTER_SUBTOPICS_EXTRA8 ──

// Deep-merge class → subject → chapter so no subject overwrites another
function mergeSubtopics(...objs) {
  const out = {}
  for (const src of objs) {
    for (const cls in src) {
      out[cls] = out[cls] || {}
      for (const subject in src[cls]) {
        out[cls][subject] = { ...(out[cls][subject] || {}), ...src[cls][subject] }
      }
    }
  }
  return out
}

const CHAPTER_SUBTOPICS = mergeSubtopics(CHAPTER_SUBTOPICS_CORE, CHAPTER_SUBTOPICS_EXTRA, CHAPTER_SUBTOPICS_EXTRA2, CHAPTER_SUBTOPICS_EXTRA3, CHAPTER_SUBTOPICS_EXTRA4, CHAPTER_SUBTOPICS_EXTRA5, CHAPTER_SUBTOPICS_EXTRA6, CHAPTER_SUBTOPICS_EXTRA7, CHAPTER_SUBTOPICS_EXTRA8)

// Chapters for a given subject + class, in the order defined in ALL_CHAPTERS
const getChapters = (subject, cls) => ALL_CHAPTERS?.[cls]?.[subject] || []

const getSubtopics = (cls, subject, chapter) =>
  CHAPTER_SUBTOPICS?.[cls]?.[subject]?.[chapter] || []

// Only subjects that actually have chapters for this class
const getSubjectsForClass = cls => Object.keys(ALL_CHAPTERS[cls] || {})

// Reverse lookup: subtopic text -> its parent chapter
const SUBTOPIC_TO_CHAPTER = (() => {
  const map = {}
  for (const cls in CHAPTER_SUBTOPICS) {
    map[cls] = {}
    for (const subject in CHAPTER_SUBTOPICS[cls]) {
      map[cls][subject] = {}
      for (const chapter in CHAPTER_SUBTOPICS[cls][subject]) {
        for (const sub of CHAPTER_SUBTOPICS[cls][subject][chapter]) {
          map[cls][subject][sub] = chapter
        }
      }
    }
  }
  return map
})()

function resolveParentChapter(cls, subject, topicText) {
  if (!topicText || subject === 'General') return null
  const chaptersForSubj = ALL_CHAPTERS?.[cls]?.[subject] || []
  if (chaptersForSubj.includes(topicText)) return topicText
  return SUBTOPIC_TO_CHAPTER?.[cls]?.[subject]?.[topicText] || topicText
}

function courseListKey(subject, cls, chapter) {
  const safe = s => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 20)
  return `bscm-list-${safe(subject)}-${safe(cls)}-${safe(chapter)}`
}

const HUB_TOOLS = ['notes', 'quiz', 'flashcards']

// Groups all locally-saved sessions into "chapter boxes" for the dashboard
function groupSessionsIntoChapters() {
  const sessions = listAllSessions().filter(s => HUB_TOOLS.includes(s.tool))
  const groups = {}
  for (const s of sessions) {
    const cls     = s.classLevel || 'Class 10'
    const subject = s.subject || 'General'
    const topic   = s.chapter || (s.chapters || [])[0] || ''
    if (!topic) continue
    const isRandom = subject === 'General'
    const parent   = isRandom ? null : resolveParentChapter(cls, subject, topic)
    const key = `${subject}::${cls}::${isRandom ? topic : parent}`
    if (!groups[key]) {
      groups[key] = { key, subject, cls, chapterName: isRandom ? topic : parent, isRandomGroup: isRandom, items: [] }
    }
    groups[key].items.push({
      ...s,
      isFull:     !isRandom && topic === parent,
      isRandom,
      isSubtopic: !isRandom && topic !== parent,
    })
  }
  return Object.values(groups).map(g => {
    const seen = new Map()
    for (const it of [...g.items].sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt))) {
      const k = `${it.tool}::${it.chapter}`
      if (!seen.has(k)) seen.set(k, it)
    }
    const items = [...seen.values()].sort((a, b) => {
      const rank = it => it.isFull ? 0 : it.isSubtopic ? 1 : 2
      const r = rank(a) - rank(b)
      return r !== 0 ? r : new Date(b.savedAt) - new Date(a.savedAt)
    })
    const lastActivity = items.reduce((m, it) => Math.max(m, new Date(it.savedAt).getTime()), 0)
    const counts = { notes: 0, quiz: 0, flashcards: 0 }
    for (const it of items) counts[it.tool] = (counts[it.tool] || 0) + 1
    return { ...g, items, lastActivity, counts }
  }).sort((a, b) => b.lastActivity - a.lastActivity)
}


// Default state each tool starts with
const emptyPicker = (cls = 'Class 10') => ({
  cls, subject: '', chapter: '',
  subTopicChoice: 'full',   // 'full' | <a real sub-topic string> | 'custom'
  customText: '',
})

// Ready to generate?
const isPickerReady = sel => {
  if (!sel.subject || !sel.chapter) return false
  if (sel.subTopicChoice === 'custom') return !!sel.customText.trim()
  return true
}

// Short label for titles
const pickerTopic = sel => {
  if (sel.subTopicChoice === 'custom') return sel.customText.trim()
  if (sel.subTopicChoice === 'full')   return sel.chapter
  return sel.subTopicChoice   // a real sub-topic string
}

// Full scope line fed into AI prompts
const pickerContext = sel => {
  const base = `${sel.subject}, ${sel.cls}`
  if (sel.subTopicChoice === 'custom')
    return `${base}, focusing on "${sel.customText.trim()}" within the chapter "${sel.chapter}"`
  if (sel.subTopicChoice === 'full')
    return `${base}, covering the full chapter "${sel.chapter}"`
  return `${base}, covering ONLY the sub-topic "${sel.subTopicChoice}" within the chapter "${sel.chapter}"`
}

// Context builder for the separate Random Topic box (unrelated to any chapter)
const randomTopicContext = (topic, cls) =>
  `the topic "${topic.trim()}" (a free topic chosen by the student, NOT tied to any chapter). Answer at ${cls} level.`

// ══════════════════════════════════════════════════════════════
//  SESSION STORAGE  (saves generated content for history replay)
// ══════════════════════════════════════════════════════════════
const SESSION_PREFIX = 'bs_sess_'
const MAX_SESSIONS   = 200

export function saveSessionContent({ tool, subject='', chapter='', chapters=[], classLevel='', content, extra={} }) {
  try {
    const id  = `${tool}-${subject}-${chapter||(chapters||[]).join(',')}-${Date.now()}`
    const key = SESSION_PREFIX + id
    localStorage.setItem(key, JSON.stringify({
      id, tool, subject, chapter, chapters, classLevel, content, extra,
      savedAt: new Date().toISOString(),
    }))
    // Prune oldest beyond MAX_SESSIONS
    const allKeys = Object.keys(localStorage).filter(k=>k.startsWith(SESSION_PREFIX)).sort()
    if (allKeys.length > MAX_SESSIONS)
      allKeys.slice(0, allKeys.length - MAX_SESSIONS).forEach(k=>localStorage.removeItem(k))
    return id
  } catch(e) { console.warn('[saveSessionContent]', e.message); return null }
}

function listAllSessions() {
  try {
    return Object.keys(localStorage)
      .filter(k=>k.startsWith(SESSION_PREFIX))
      .map(k=>{ try{ return JSON.parse(localStorage.getItem(k)) }catch{ return null } })
      .filter(Boolean)
      .sort((a,b)=>new Date(b.savedAt)-new Date(a.savedAt))
  } catch { return [] }
}

function findSessionForActivity(item) {
  const sessions = listAllSessions()
  return sessions.find(s =>
    s.tool    === item.tool    &&
    s.subject === item.subject &&
    (s.chapter === item.chapter ||
     (item.chapters||[]).some(c => s.chapter===c || (s.chapters||[]).includes(c))) &&
    Math.abs(new Date(s.savedAt) - new Date(item.created_at)) < 2 * 60 * 60 * 1000 // within 2 hours
  ) || null
}

const LEVELS = [
  { min: 0,      label: 'Beginner',        color: '#94A3B8', emoji: '🌱' },
  { min: 200,    label: 'Learner',          color: '#6EE7B7', emoji: '📗' },
  { min: 600,    label: 'Student',          color: '#34D399', emoji: '📘' },
  { min: 1500,   label: 'Scholar',          color: '#60A5FA', emoji: '🎓' },
  { min: 3500,   label: 'Knowledge Seeker', color: '#818CF8', emoji: '🔍' },
  { min: 7000,   label: 'Expert',           color: '#A78BFA', emoji: '💡' },
  { min: 15000,  label: 'Master',           color: '#F59E0B', emoji: '⚡' },
  { min: 30000,  label: 'Elite',            color: '#EF4444', emoji: '🔥' },
  { min: 60000,  label: 'Champion',         color: '#EC4899', emoji: '🏆' },
  { min: 120000, label: 'Legend',           color: '#F97316', emoji: '🌟' },
  { min: 250000, label: 'Genius',           color: '#C084FC', emoji: '💎' },
  { min: 500000, label: 'Transcendent',     color: '#FBBF24', emoji: '🌌' },
]
function getLevel(xp) {
  for (let i = LEVELS.length - 1; i >= 0; i--) if (xp >= LEVELS[i].min) return { ...LEVELS[i], index: i }
  return { ...LEVELS[0], index: 0 }
}
function getNextLevel(xp) { const cur = getLevel(xp); return LEVELS[cur.index + 1] || null }
const DIFF_COLORS = { easy: '#22c55e', medium: '#f59e0b', hard: '#ef4444', legendary: '#8b5cf6' }
const GRADS = ['135deg,#6366F1,#8B5CF6','135deg,#f59e0b,#ef4444','135deg,#06b6d4,#6366F1','135deg,#34d399,#2563eb','135deg,#a855f7,#ef4444','135deg,#ec4899,#6366F1']

// ══════════════════════════════════════════════════════════════
//  HOOKS
// ══════════════════════════════════════════════════════════════

function useAutoSave(tool, subject, cls, chapter, content) {
  useEffect(() => {
    if (!content || !chapter) return
    const key = `bs_saved_${tool}_${subject}_${cls}_${chapter}`.replace(/\s+/g, '_').toLowerCase()
    try { localStorage.setItem(key, content) } catch {}
  }, [content, tool, subject, cls, chapter])
}

/** Load previously saved content on mount — returns string or null */
function useAutoLoad(tool, subject, cls, chapter) {
  const [loaded, setLoaded] = useState(null)
  useEffect(() => {
    if (!chapter) return
    const key = `bs_saved_${tool}_${subject}_${cls}_${chapter}`.replace(/\s+/g, '_').toLowerCase()
    try {
      const v = localStorage.getItem(key)
      if (v) setLoaded(v)
    } catch {}
  }, [tool, subject, cls, chapter])
  return loaded
}
function useIsMobile() {
  const [mobile, setMobile] = useState(window.innerWidth < 769)
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 769)
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [])
  return mobile
}

function getSecondsRemaining(freeStartedAt) {
  if (!freeStartedAt) return FREE_WINDOW
  const elapsed = Math.floor((Date.now() - new Date(freeStartedAt)) / 1000)
  return Math.max(0, FREE_WINDOW - elapsed)
}

// ══════════════════════════════════════════════════════════════
//  API CLIENT
// ══════════════════════════════════════════════════════════════
const api = {
  headers() {
    const h = { 'Content-Type': 'application/json' }
    const t = localStorage.getItem('bs_token')
    const s = localStorage.getItem('bs_session')
    if (t) h['Authorization'] = `Bearer ${t}`
    if (s) h['x-session-token'] = s
    return h
  },
  async get(path) {
    const r = await fetch(`${API_URL}${path}`, { headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async post(path, body) {
  const r = await fetch(`${API_URL}${path}`, { method: 'POST', headers: this.headers(), body: JSON.stringify(body) })
  const data = await r.json().catch(() => ({}))
  // Slow AI tools commit a 200, then may stream an error body with _failed:true
  if (!r.ok || data._failed) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
  return data
},
  async put(path, body) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PUT', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async del(path) {
    const r = await fetch(`${API_URL}${path}`, { method: 'DELETE', headers: this.headers() })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
  async patch(path, body = {}) {
    const r = await fetch(`${API_URL}${path}`, { method: 'PATCH', headers: this.headers(), body: JSON.stringify(body) })
    const data = await r.json()
    if (!r.ok) throw Object.assign(new Error(data.error || 'Request failed'), { code: data.code, status: r.status })
    return data
  },
}

// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════

async function downloadNotesAsPDF(content, title) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' })

  const PAGE_W = 210, PAGE_H = 297
  const MARGIN_X = 18, MARGIN_TOP = 20, MARGIN_BOT = 16
  const MAX_W = PAGE_W - MARGIN_X * 2
  const BOT_LIMIT = PAGE_H - MARGIN_BOT
  const PT = 0.3528 // pt -> mm
  let y = MARGIN_TOP

  // Strip emoji + symbols, normalize fancy punctuation to ASCII so nothing is dropped silently
  const clean = s => (s || '')
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\u2026/g, '...')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/[\u2190-\u21FF\u2300-\u27BF\u2B00-\u2BFF\uFE00-\uFE0F]/g, '')
    .replace(/[^\x09\x0A\x0D\x20-\x7E\xA0-\xFF]/g, '')
    .replace(/\s+$/,'')

  const pageBreak = needMm => { if (y + needMm > BOT_LIMIT) { doc.addPage(); y = MARGIN_TOP } }

  const rule = (color, thickness, gap = 3) => {
    doc.setDrawColor(...color); doc.setLineWidth(thickness)
    doc.line(MARGIN_X, y, PAGE_W - MARGIN_X, y); y += gap
  }

  // Lay out styled runs [{text, bold}] with strict word-wrap + hard-break of oversized tokens
  function writeRich(runs, {
    family = 'helvetica', size = 11, colorN = [55,65,81], colorB = [26,26,46],
    indent = 0, gapAfter = 3, lineFactor = 1.55,
  } = {}) {
    const lineStep = size * PT * lineFactor
    const usableW = MAX_W - indent
    const x0 = MARGIN_X + indent
    doc.setFontSize(size)
    doc.setFont(family, 'normal')
    const spaceW = doc.getTextWidth(' ')

    // tokenize into words + explicit spaces
    const tokens = []
    for (const run of runs) {
      for (const p of run.text.split(/(\s+)/)) {
        if (p === '') continue
        if (/^\s+$/.test(p)) tokens.push({ space: true })
        else tokens.push({ text: p, bold: run.bold })
      }
    }

    // hard-break any token wider than the line
    const fit = []
    for (const t of tokens) {
      if (t.space) { fit.push(t); continue }
      doc.setFont(family, t.bold ? 'bold' : 'normal')
      if (doc.getTextWidth(t.text) <= usableW) { fit.push(t); continue }
      let cur = ''
      for (const ch of t.text) {
        if (cur && doc.getTextWidth(cur + ch) > usableW) { fit.push({ text: cur, bold: t.bold, brk: true }); cur = ch }
        else cur += ch
      }
      if (cur) fit.push({ text: cur, bold: t.bold })
    }

    let cx = x0, lineStart = true
    pageBreak(lineStep)
    const newline = () => { y += lineStep; pageBreak(lineStep); cx = x0; lineStart = true }

    for (const t of fit) {
      if (t.space) { if (!lineStart) cx += spaceW; continue }
      doc.setFont(family, t.bold ? 'bold' : 'normal')
      const w = doc.getTextWidth(t.text)
      if (!lineStart && cx + w > x0 + usableW) newline()
      doc.setTextColor(...(t.bold ? colorB : colorN))
      doc.text(t.text, cx, y)
      cx += w; lineStart = false
      if (t.brk) newline()
    }
    y += lineStep + gapAfter
  }

  const parseBold = text => {
    const runs = []; const re = /\*\*(.*?)\*\*/g; let last = 0, m
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) runs.push({ text: text.slice(last, m.index), bold: false })
      runs.push({ text: m[1], bold: true }); last = m.index + m[0].length
    }
    if (last < text.length) runs.push({ text: text.slice(last), bold: false })
    return runs.length ? runs : [{ text, bold: false }]
  }

  // ── Header ──
  const mainTitle = clean((title.split('—')[0] || title).replace(/\s*Notes\s*$/i, '').trim())
  const subTitle  = clean((title.split('—')[1] || '').trim())

  writeRich([{ text: mainTitle, bold: true }], { family: 'times', size: 22, colorB: [26,26,46], lineFactor: 1.2, gapAfter: 2 })

  doc.setFontSize(9.5)
  let mx = MARGIN_X
  if (subTitle) { doc.setFont('helvetica','bold'); doc.setTextColor(55,48,163); doc.text(subTitle, mx, y); mx += doc.getTextWidth(subTitle) }
  doc.setFont('helvetica','normal'); doc.setTextColor(100,116,139)
  doc.text((subTitle ? '   ·   ' : '') + 'CBSE 2024-25', mx, y)
  y += 9.5 * PT * 1.2 + 5
  rule([55,48,163], 0.8, 5)

  // ── Body ──
  for (const raw of (content || '').split('\n')) {
    const line = raw.trimEnd()
    const txt = clean(line.replace(/^#{1,4}\s|^[-•]\s|^\d+\.\s/, ''))

    if (line === '') { y += 3; continue }
    if (/^(---|═══)/.test(line)) { y += 2; rule([226,232,240], 0.3, 4); continue }

    if (line.startsWith('# ')) {
      y += 4; pageBreak(16)
      writeRich([{ text: clean(line.slice(2)), bold: true }], { family: 'times', size: 16, colorB: [26,26,46], lineFactor: 1.25, gapAfter: 1.5 })
      rule([232,230,255], 0.4, 4); continue
    }
    if (line.startsWith('## ')) {
      y += 3; pageBreak(12)
      writeRich([{ text: clean(line.slice(3)), bold: true }], { family: 'times', size: 13, colorB: [55,48,163], lineFactor: 1.25, gapAfter: 3 }); continue
    }
    if (line.startsWith('### ') || line.startsWith('#### ')) {
      const t = clean(line.replace(/^#{3,4}\s/, ''))
      y += 1.5; pageBreak(10)
      const step = 11.5 * PT * 1.2
      doc.setDrawColor(129,140,248); doc.setLineWidth(0.9)
      doc.line(MARGIN_X + 0.6, y - 3.4, MARGIN_X + 0.6, y + 1)
      writeRich([{ text: t, bold: true }], { family: 'helvetica', size: 11.5, colorB: [30,41,59], indent: 4, lineFactor: 1.2, gapAfter: 2 }); continue
    }

    if (line.startsWith('- ') || line.startsWith('• ')) {
      pageBreak(7)
      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(129,140,248)
      doc.text('•', MARGIN_X + 1.5, y)
      writeRich(parseBold(txt), { size: 11, indent: 6.5, gapAfter: 1.5 }); continue
    }
    if (/^\d+\.\s/.test(line)) {
      const num = (line.match(/^\d+/)[0]) + '.'
      pageBreak(7)
      doc.setFontSize(11); doc.setFont('helvetica','bold'); doc.setTextColor(129,140,248)
      doc.text(num, MARGIN_X + 1.5, y)
      writeRich(parseBold(txt), { size: 11, indent: 7.5, gapAfter: 1.5 }); continue
    }

    // Exam-tip callout box
    if (raw.startsWith('📝') || /exam tip/i.test(line)) {
      const tip = txt.replace(/\*\*/g, '')
      doc.setFont('helvetica','bold'); doc.setFontSize(10)
      const innerW = MAX_W - 8
      const wrapped = doc.splitTextToSize(tip, innerW)
      const step = 10 * PT * 1.4
      const boxH = wrapped.length * step + 4
      pageBreak(boxH + 2)
      doc.setFillColor(239,246,255); doc.setDrawColor(191,219,254); doc.setLineWidth(0.3)
      doc.roundedRect(MARGIN_X, y, MAX_W, boxH, 2, 2, 'FD')
      doc.setTextColor(29,78,216)
      let ty = y + step
      for (const wl of wrapped) { doc.text(wl, MARGIN_X + 4, ty); ty += step }
      y += boxH + 3; continue
    }

    // Paragraph
    if (txt) writeRich(parseBold(txt), { size: 11, lineFactor: 1.55, gapAfter: 3 })
  }

  // Light footer / page numbers (doesn't touch body alignment)
  const total = doc.internal.getNumberOfPages()
  for (let i = 1; i <= total; i++) {
    doc.setPage(i)
    doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(148,163,184)
    doc.text('Ragel AI · CBSE Notes', MARGIN_X, PAGE_H - 8)
    doc.text(`Page ${i} of ${total}`, PAGE_W - MARGIN_X, PAGE_H - 8, { align: 'right' })
  }

  doc.save(`${title.replace(/ — |—/g, '-').replace(/[\s/\\:*?"<>|]+/g, '-')}.pdf`)
}



async function downloadQPaperAsPDF(paper, opts = {}) {
  await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js')
  const { jsPDF } = window.jspdf
  const doc = new jsPDF({ unit: 'mm', format: 'a4' })

  const clean = s => (s || '').replace(/[^\x00-\x7F]/g, '').replace(/\*\*/g, '').trim()
  const PAGE_W = 210, MARGIN = 20, MAX_W = 170, PAGE_H = 297, BOT = 277
  let y = MARGIN

  function newPage() { doc.addPage(); y = MARGIN }
  function check(need = 8) { if (y + need > BOT) newPage() }

  function line(text, opts2 = {}) {
    const { size = 11, bold = false, color = [0, 0, 0], indent = 0, gap = 3, center = false } = opts2
    doc.setFontSize(size)
    doc.setFont('times', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const wrapped = doc.splitTextToSize(clean(text), MAX_W - indent)
    for (const l of wrapped) {
      check(size * 0.4 + 2)
      const x = center ? PAGE_W / 2 : MARGIN + indent
      doc.text(l, x, y, center ? { align: 'center' } : {})
      y += size * 0.42 + 1
    }
    y += gap
  }

  function hline(thickness = 0.4, color = 0) {
    doc.setDrawColor(color)
    doc.setLineWidth(thickness)
    doc.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 3
  }

  const h     = paper.header || {}
  const school = opts.schoolName || 'CBSE Affiliated School'

  // ── Header box ───────────────────────────────────────────────
  doc.setFillColor(245, 245, 245)
  doc.rect(MARGIN, y - 2, MAX_W, 38, 'F')
  doc.setDrawColor(0); doc.setLineWidth(0.6)
  doc.rect(MARGIN, y - 2, MAX_W, 38)

  line(school.toUpperCase(), { size: 15, bold: true, center: true, gap: 2 })
  line(`${clean(h.board || 'CBSE')} Examination — ${clean(h.year || '2024-25')}`, { size: 11, center: true, gap: 3 })

  // Info row
  doc.setFontSize(11); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0)
  const half = MAX_W / 2
  doc.text(`Subject: ${clean(h.subject)}`,       MARGIN + 4,        y)
  doc.text(`Class: ${clean(h.class_level)}`,      MARGIN + half + 4, y); y += 6
  doc.text(`Max. Marks: ${h.max_marks || ''}`,    MARGIN + 4,        y)
  doc.text(`Time: ${clean(h.duration)}`,          MARGIN + half + 4, y); y += 5
  hline(0.6); y += 2

  // ── General Instructions ─────────────────────────────────────
  line('General Instructions:', { size: 11, bold: true, gap: 2 })
  for (let i = 0; i < (paper.general_instructions || []).length; i++) {
    line(`${i + 1}. ${clean(paper.general_instructions[i])}`, { size: 10, indent: 5, gap: 1.5 })
  }
  hline(0.5); y += 3

  // ── Sections ─────────────────────────────────────────────────
  for (const sec of (paper.sections || [])) {
    check(16)

    // Section heading bar
    doc.setFillColor(230, 230, 230)
    doc.rect(MARGIN, y - 1, MAX_W, 8, 'F')
    doc.setFontSize(12); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text(clean(sec.name).toUpperCase(), PAGE_W / 2, y + 5, { align: 'center' })
    y += 9

    if (sec.description) {
      doc.setFontSize(10); doc.setFont('times', 'italic'); doc.setTextColor(80, 80, 80)
      doc.text(clean(sec.description), PAGE_W / 2, y, { align: 'center' })
      y += 5
    }
    y += 2

    for (const q of (sec.questions || [])) {
      // Estimate space needed: question lines + options
      const qText    = `Q${q.number}.  ${clean(q.text)}`
      const wrappedQ = doc.splitTextToSize(qText, MAX_W - 18)
      const optLines = q.options?.length ? Math.ceil(q.options.length / 2) : 0
      const needed   = wrappedQ.length * 5.5 + optLines * 5.5 + 8
      check(needed)

      // Thin separator between questions
      doc.setDrawColor(210); doc.setLineWidth(0.15)
      doc.line(MARGIN, y, PAGE_W - MARGIN, y)
      doc.setDrawColor(0)
      y += 3

      // Question text
      doc.setFontSize(11); doc.setFont('times', 'normal'); doc.setTextColor(0, 0, 0)
      for (let wi = 0; wi < wrappedQ.length; wi++) {
        check(6)
        if (wi === wrappedQ.length - 1) {
          // Last line: question text left, marks right
          doc.text(clean(wrappedQ[wi]), MARGIN, y)
          doc.setFont('times', 'bold')
          doc.text(`[${q.marks} Mark${q.marks > 1 ? 's' : ''}]`, PAGE_W - MARGIN, y, { align: 'right' })
          doc.setFont('times', 'normal')
        } else {
          doc.text(clean(wrappedQ[wi]), MARGIN, y)
        }
        y += 5.5
      }

      // MCQ options — 2 per row
      if (q.options?.length) {
        y += 1
        for (let oi = 0; oi < q.options.length; oi += 2) {
          check(6)
          doc.setFontSize(10.5)
          doc.text(clean(q.options[oi]     || ''), MARGIN + 10,      y)
          doc.text(clean(q.options[oi + 1] || ''), MARGIN + 10 + 82, y)
          y += 5.5
        }
      }

      y += 3  // small gap after each question — no answer lines
    }

    y += 5  // gap between sections
  }

  // ── Answer Key ───────────────────────────────────────────────
  if (opts.includeAnswers) {
    newPage()

    doc.setFillColor(230, 230, 230)
    doc.rect(MARGIN, y - 2, MAX_W, 10, 'F')
    doc.setFontSize(14); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
    doc.text('ANSWER KEY', PAGE_W / 2, y + 5.5, { align: 'center' })
    y += 14
    hline(0.5); y += 2

    for (const sec of (paper.sections || [])) {
      check(10)
      line(sec.name, { size: 11, bold: true, gap: 2 })

      for (const q of (sec.questions || [])) {
        check(12)

        // Q number + answer on same line
        doc.setFontSize(10.5); doc.setFont('times', 'bold'); doc.setTextColor(0, 0, 0)
        doc.text(`Q${q.number}.`, MARGIN + 2, y)
        doc.setFont('times', 'normal')
        const ansText = doc.splitTextToSize(`Ans: ${clean(q.answer)}`, MAX_W - 18)
        for (const al of ansText) {
          check(5); doc.text(al, MARGIN + 12, y); y += 5
        }

        if (q.solution) {
          doc.setTextColor(60, 60, 60); doc.setFontSize(10)
          const solText = doc.splitTextToSize(`Solution: ${clean(q.solution)}`, MAX_W - 22)
          for (const sl of solText) {
            check(5); doc.text(sl, MARGIN + 14, y); y += 4.5
          }
          doc.setTextColor(0, 0, 0)
        }
        y += 3
      }
      y += 4
    }
  }

  // ── Footer on every page ─────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setFontSize(8.5); doc.setFont('times', 'normal'); doc.setTextColor(140, 140, 140)
    doc.line(MARGIN, PAGE_H - 12, PAGE_W - MARGIN, PAGE_H - 12)
    doc.text(
      `${clean(h.subject)}  |  ${clean(h.class_level)}  |  Page ${p} of ${totalPages}`,
      PAGE_W / 2, PAGE_H - 7, { align: 'center' }
    )
  }

  const fname = `${clean(h.subject)}-${clean(h.class_level)}-${h.max_marks || ''}M-paper.pdf`
  doc.save(fname)
}


function QPaperDocument({ paper, onPaperChange, schoolName, onSchoolNameChange }) {
  const [showAnswers, setShowAnswers] = useState(false)
  const [editingQ, setEditingQ] = useState(null)  // {sIdx, qIdx}
  const [editingInstr, setEditingInstr] = useState(null)

  const h = paper.header || {}

  function updateQuestion(sIdx, qIdx, field, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions[qIdx][field] = value
    onPaperChange(updated)
  }

  function updateOption(sIdx, qIdx, oIdx, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions[qIdx].options[oIdx] = value
    onPaperChange(updated)
  }

  function updateInstruction(idx, value) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.general_instructions[idx] = value
    onPaperChange(updated)
  }

  function addQuestion(sIdx) {
    const updated = JSON.parse(JSON.stringify(paper))
    const sec = updated.sections[sIdx]
    const lastNum = sec.questions[sec.questions.length - 1]?.number || 0
    sec.questions.push({ number: lastNum + 1, text: 'New question', options: [], marks: 2, answer: '', solution: '' })
    onPaperChange(updated)
  }

  function deleteQuestion(sIdx, qIdx) {
    const updated = JSON.parse(JSON.stringify(paper))
    updated.sections[sIdx].questions.splice(qIdx, 1)
    onPaperChange(updated)
  }

  return (
    <>
      <link href="https://fonts.googleapis.com/css2?family=IM+Fell+English&family=Source+Serif+4:wght@400;600;700&display=swap" rel="stylesheet"/>

      <div style={{ background: '#e8e6e0', borderRadius: 14, padding: '20px 16px', marginTop: 20 }}>

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['#ef4444','#f59e0b','#22c55e'].map(c => <div key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }}/>)}
            <input value={schoolName} onChange={e => onSchoolNameChange(e.target.value)} placeholder="School Name" style={{ fontSize: 12, color: '#64748b', background: 'transparent', border: 'none', outline: 'none', fontFamily: "'Nunito', sans-serif", minWidth: 180 }}/>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={() => setShowAnswers(v => !v)} style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: showAnswers ? '#1d4ed8' : '#fff', color: showAnswers ? '#fff' : '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              {showAnswers ? '📖 Hide Answers' : '🔑 Show Answers'}
            </button>
            <button onClick={() => downloadQPaperAsPDF(paper, { schoolName, includeAnswers: false })}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⬇ Paper PDF
            </button>
            <button onClick={() => downloadQPaperAsPDF(paper, { schoolName, includeAnswers: true })}
              style={{ padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', color: '#374151', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              ⬇ With Answers
            </button>
            <button onClick={() => printQPaper(paper, { schoolName, includeAnswers: false })}
              style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#1e3a5f', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
              🖨 Print Paper
            </button>
          </div>
        </div>

        {/* ── Paper document ── */}
        <div style={{ background: '#fff', borderRadius: 10, padding: 'clamp(24px,4vw,52px) clamp(18px,5vw,60px)', boxShadow: '0 4px 24px rgba(0,0,0,.12)', maxHeight: '78vh', overflowY: 'auto', fontFamily: "'Source Serif 4', Georgia, serif" }}>

          {/* Header */}
          <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: 14, marginBottom: 14 }}>
            <div style={{ fontSize: 'clamp(15px,2.5vw,20px)', fontWeight: 700, letterSpacing: 1.5, marginBottom: 4, textTransform: 'uppercase' }}>
              {schoolName || 'School Name'}
            </div>
            <div style={{ fontSize: 13, marginBottom: 10, color: '#444' }}>
              {h.board || 'CBSE'} Examination — {h.year || '2024-25'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 20px', fontSize: 13, textAlign: 'left', maxWidth: 520, margin: '0 auto' }}>
              {[['Subject', h.subject], ['Class', h.class_level], ['Max. Marks', h.max_marks], ['Time', h.duration]].map(([l, v]) => (
                <div key={l} style={{ borderBottom: '1px solid #ddd', paddingBottom: 3 }}>
                  <span style={{ fontWeight: 700 }}>{l}: </span>{v}
                </div>
              ))}
            </div>
          </div>

          {/* Instructions */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6, borderBottom: '1px dashed #ccc', paddingBottom: 3 }}>
              General Instructions:
            </div>
            {(paper.general_instructions || []).map((inst, i) => (
              <div key={i} style={{ display: 'flex', gap: 6, marginBottom: 3 }}>
                <span style={{ fontWeight: 700, fontSize: 12, flexShrink: 0 }}>{i + 1}.</span>
                {editingInstr === i ? (
                  <input value={inst} onChange={e => updateInstruction(i, e.target.value)}
                    onBlur={() => setEditingInstr(null)} autoFocus
                    style={{ flex: 1, fontSize: 12, border: '1.5px solid #6366F1', borderRadius: 5, padding: '2px 6px', fontFamily: "'Source Serif 4', serif" }}/>
                ) : (
                  <span onClick={() => setEditingInstr(i)} style={{ fontSize: 12, color: '#374151', cursor: 'text', lineHeight: 1.6, flex: 1, padding: '1px 4px', borderRadius: 4, transition: 'background .15s' }}
                    onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                    onMouseLeave={e => e.target.style.background = 'transparent'}>{inst}</span>
                )}
              </div>
            ))}
          </div>

          {/* Sections */}
          {(paper.sections || []).map((sec, sIdx) => (
            <div key={sIdx} style={{ marginBottom: 20 }}>
              <div style={{ borderTop: '1.5px solid #000', borderBottom: '1px solid #000', padding: '6px 0', marginBottom: 10 }}>
                <div style={{ fontWeight: 700, fontSize: 14, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {sec.name}
                </div>
                {sec.description && <div style={{ textAlign: 'center', fontSize: 12, color: '#555', marginTop: 3, fontStyle: 'italic' }}>{sec.description}</div>}
              </div>

              {(sec.questions || []).map((q, qIdx) => {
                const isEditing = editingQ?.sIdx === sIdx && editingQ?.qIdx === qIdx
                return (
                  <div key={qIdx} style={{ marginBottom: 14, padding: '10px 12px', borderRadius: 8, border: isEditing ? '1.5px solid #6366F1' : '1px solid transparent', background: isEditing ? '#f8f7ff' : 'transparent', transition: 'all .15s' }}>

                    {/* Question header row */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <div style={{ display: 'flex', gap: 6, flex: 1, alignItems: 'flex-start' }}>
                        <span style={{ fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 1 }}>Q{q.number}.</span>
                        {isEditing ? (
                          <textarea value={q.text} onChange={e => updateQuestion(sIdx, qIdx, 'text', e.target.value)}
                            style={{ flex: 1, fontSize: 13, border: '1px solid #d1d5db', borderRadius: 6, padding: '4px 8px', resize: 'vertical', minHeight: 60, fontFamily: "'Source Serif 4', serif" }}/>
                        ) : (
                          <span onClick={() => setEditingQ({ sIdx, qIdx })} style={{ fontSize: 13, lineHeight: 1.7, cursor: 'text', flex: 1, padding: '1px 4px', borderRadius: 4 }}
                            onMouseEnter={e => e.target.style.background = '#f0f9ff'}
                            onMouseLeave={e => e.target.style.background = 'transparent'}>{q.text}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, marginLeft: 10 }}>
                        {isEditing ? (
                          <input type="number" value={q.marks} onChange={e => updateQuestion(sIdx, qIdx, 'marks', parseInt(e.target.value))}
                            style={{ width: 48, fontSize: 12, border: '1px solid #d1d5db', borderRadius: 5, padding: '2px 5px', textAlign: 'center' }}/>
                        ) : (
                          <span style={{ fontWeight: 700, fontSize: 12, background: '#1e3a5f', color: '#fff', padding: '2px 10px', borderRadius: 12 }}>{q.marks}M</span>
                        )}
                        <button onClick={() => setEditingQ(isEditing ? null : { sIdx, qIdx })}
                          style={{ padding: '2px 8px', borderRadius: 6, border: '1px solid #d1d5db', background: isEditing ? '#6366F1' : '#f8fafc', color: isEditing ? '#fff' : '#374151', fontSize: 11, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>
                          {isEditing ? 'Done' : '✏️'}
                        </button>
                        <button onClick={() => deleteQuestion(sIdx, qIdx)}
                          style={{ padding: '2px 7px', borderRadius: 6, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>✕</button>
                      </div>
                    </div>

                    {/* Options */}
                    {q.options?.length > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 12px', margin: '6px 0 4px 24px' }}>
                        {q.options.map((opt, oIdx) => (
                          <div key={oIdx} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            {isEditing ? (
                              <input value={opt} onChange={e => updateOption(sIdx, qIdx, oIdx, e.target.value)}
                                style={{ flex: 1, fontSize: 12, border: '1px solid #d1d5db', borderRadius: 5, padding: '2px 6px', fontFamily: "'Source Serif 4', serif" }}/>
                            ) : (
                              <span style={{ fontSize: 12.5, color: '#374151' }}>{opt}</span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Answer lines */}
                    {!showAnswers && (
                      <div style={{ marginTop: 6, marginLeft: 24 }}>
                        {Array(Math.min(q.marks >= 5 ? q.marks : 2, 6)).fill(0).map((_, li) => (
                          <div key={li} style={{ borderBottom: '1px solid #ccc', height: 20, marginBottom: 2 }}/>
                        ))}
                      </div>
                    )}

                    {/* Answer key (visible when toggled) */}
                    {showAnswers && (
                      <div style={{ marginTop: 8, marginLeft: 24, padding: '8px 12px', background: '#eff6ff', borderRadius: 8, border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1d4ed8', marginBottom: isEditing ? 4 : 0 }}>
                          Answer:&nbsp;
                          {isEditing ? (
                            <input value={q.answer} onChange={e => updateQuestion(sIdx, qIdx, 'answer', e.target.value)}
                              style={{ fontSize: 12, border: '1px solid #bfdbfe', borderRadius: 5, padding: '2px 8px', fontFamily: "'Source Serif 4', serif", width: '90%' }}/>
                          ) : (
                            <span style={{ fontWeight: 400, color: '#1e40af' }}>{q.answer}</span>
                          )}
                        </div>
                        {(q.solution || isEditing) && (
                          <div style={{ fontSize: 11.5, color: '#374151', marginTop: 4 }}>
                            <span style={{ fontWeight: 600 }}>Solution: </span>
                            {isEditing ? (
                              <textarea value={q.solution || ''} onChange={e => updateQuestion(sIdx, qIdx, 'solution', e.target.value)}
                                style={{ width: '100%', fontSize: 11.5, border: '1px solid #bfdbfe', borderRadius: 5, padding: '3px 8px', resize: 'vertical', fontFamily: "'Source Serif 4', serif" }} rows={2}/>
                            ) : q.solution}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Add question button */}
              <button onClick={() => addQuestion(sIdx)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 14px', borderRadius: 8, border: '1.5px dashed #94a3b8', background: 'transparent', color: '#64748b', fontSize: 12, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>
                + Add Question to {sec.name}
              </button>
            </div>
          ))}

          <div style={{ textAlign: 'center', fontSize: 12, color: '#888', marginTop: 16, paddingTop: 12, borderTop: '1px solid #e2e8f0' }}>
            — End of Question Paper —
          </div>
        </div>
      </div>
    </>
  )
}



function printQPaper(paper, opts = {}) {
  const clean = s => (s || '').replace(/[^\x00-\x7F]/g, '').replace(/\*\*/g, '').trim()
  const h = paper.header || {}
  const school = opts.schoolName || 'CBSE Affiliated School'

  let sectionsHTML = ''
  for (const sec of (paper.sections || [])) {
    let qs = ''
    for (const q of (sec.questions || [])) {
      const opts2 = q.options?.length
        ? `<div class="opts">${q.options.map((o, i) => `<span class="opt">${clean(o)}</span>`).join('')}</div>`
        : ''
      const lines = sec.type === 'long' || q.marks >= 5
        ? `<div class="lines">${Array(Math.min(q.marks, 8)).fill('<div class="line"></div>').join('')}</div>`
        : `<div class="lines">${Array(2).fill('<div class="line"></div>').join('')}</div>`
      qs += `<div class="q"><p class="qtext"><span class="qnum">Q${q.number}.</span> ${clean(q.text)} <span class="marks">[${q.marks} Mark${q.marks > 1 ? 's' : ''}]</span></p>${opts2}${lines}</div>`
    }
    sectionsHTML += `<div class="section"><h3>${clean(sec.name)}</h3><p class="sec-desc">${clean(sec.description || '')}</p>${qs}</div>`
  }

  let answersHTML = ''
  if (opts.includeAnswers) {
    let aks = ''
    for (const sec of (paper.sections || [])) {
      aks += `<h4>${clean(sec.name)}</h4>`
      for (const q of (sec.questions || [])) {
        aks += `<p class="ak-q"><strong>Q${q.number}.</strong> ${clean(q.answer)}${q.solution ? `<br><span class="sol">${clean(q.solution)}</span>` : ''}</p>`
      }
    }
    answersHTML = `<div class="answer-key"><h2>ANSWER KEY</h2>${aks}</div>`
  }

  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${clean(h.subject)} Question Paper</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Times New Roman',serif;font-size:12pt;color:#000;background:#fff;padding:0}
  .page{max-width:210mm;margin:0 auto;padding:15mm 20mm}
  .header{border:1px solid #000;padding:12px;text-align:center;margin-bottom:12px}
  .school{font-size:16pt;font-weight:bold;letter-spacing:1px;margin-bottom:4px}
  .exam-line{font-size:11pt;margin-bottom:8px}
  .info-row{display:flex;justify-content:space-between;font-size:11pt;margin:3px 0}
  .instructions{margin:10px 0}
  .instructions h4{font-size:11pt;margin-bottom:4px}
  .instructions ol{padding-left:20px;font-size:10.5pt;line-height:1.7}
  .section h3{font-size:12pt;font-weight:bold;text-transform:uppercase;border-bottom:1px solid #000;padding-bottom:4px;margin:14px 0 4px}
  .sec-desc{font-size:10.5pt;color:#444;margin-bottom:8px;font-style:italic}
  .q{margin:10px 0 4px}
  .qtext{font-size:11pt;line-height:1.6}
  .qnum{font-weight:bold}
  .marks{float:right;font-weight:bold;font-size:10.5pt}
  .opts{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin:6px 0 4px 20px}
  .opt{font-size:10.5pt}
  .lines{margin:4px 0 8px}
  .line{border-bottom:1px solid #aaa;height:18px;margin:2px 0}
  .answer-key{page-break-before:always;padding-top:10mm}
  .answer-key h2{text-align:center;font-size:14pt;border:1px solid #000;padding:6px;margin-bottom:14px}
  .answer-key h4{font-size:11pt;margin:10px 0 4px;border-bottom:1px dashed #ccc;padding-bottom:2px}
  .ak-q{font-size:10.5pt;margin:4px 0 4px 12px;line-height:1.6}
  .sol{color:#555;font-size:10pt}
  .footer{text-align:center;font-size:9pt;color:#888;margin-top:16px;border-top:1px solid #ccc;padding-top:6px}
  @media print{
    body{padding:0} .page{padding:10mm 15mm}
    @page{margin:0.5in; size:A4}
  }
</style></head><body>
<div class="page">
  <div class="header">
    <div class="school">${school.toUpperCase()}</div>
    <div class="exam-line">${clean(h.board || 'CBSE')} Examination ${clean(h.year || '2024-25')}</div>
    <div class="info-row"><span><strong>Subject:</strong> ${clean(h.subject)}</span><span><strong>Class:</strong> ${clean(h.class_level)}</span></div>
    <div class="info-row"><span><strong>Max. Marks:</strong> ${h.max_marks}</span><span><strong>Time Allowed:</strong> ${clean(h.duration)}</span></div>
  </div>
  <div class="instructions">
    <h4>General Instructions:</h4>
    <ol>${(paper.general_instructions || []).map(i => `<li>${clean(i)}</li>`).join('')}</ol>
  </div>
  ${sectionsHTML}
  ${answersHTML}
</div>
<script>window.addEventListener('load',function(){setTimeout(function(){window.print()},400)})<\/script>
</body></html>`

  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const win = window.open(url, '_blank')
  if (win) win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  else setTimeout(() => URL.revokeObjectURL(url), 30000)
}



function downloadText(content, filename = 'Brainspark.txt') {
  const blob = new Blob([content], { type: 'text/plain' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href = url; a.download = filename; a.click()
  URL.revokeObjectURL(url)
}

// REPLACE the old printContent function with this
function printContent(content, title = 'BrainSpark AI Notes') {
  // Build HTML string (no DOM touching yet — pure string ops, non-blocking)
  const lines = (content || '').split('\n')
  let body = ''
  for (const line of lines) {
    if (line.startsWith('# '))        body += `<h1>${line.slice(2)}</h1>`
    else if (line.startsWith('## '))  body += `<h2>${line.slice(3)}</h2>`
    else if (line.startsWith('### ')) body += `<h3>${line.slice(4)}</h3>`
    else if (line.startsWith('- ') || line.startsWith('• ')) body += `<li>${line.slice(2)}</li>`
    else if (/^\d+\./.test(line))     body += `<li>${line}</li>`
    else if (line.startsWith('---'))  body += `<hr/>`
    else if (line.startsWith('📝'))   body += `<div class="tip">${line}</div>`
    else if (line.trim() === '')      body += `<div style="height:8px"></div>`
    else body += `<p>${line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}</p>`
  }

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8"/>
  <title>${title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Lora:wght@400;700&family=Source+Sans+3:wght@400;600;700&display=swap');
    * { box-sizing:border-box; margin:0; padding:0; }
    body { font-family:'Source Sans 3',Georgia,sans-serif; background:#f0efe9; padding:32px 20px; color:#374151; font-size:14.5px; line-height:1.8; }
    .page { background:#fff; max-width:780px; margin:0 auto; padding:56px 68px; border-radius:6px; box-shadow:0 4px 32px rgba(0,0,0,.10); }
    .hdr  { border-bottom:3px solid #3730a3; padding-bottom:20px; margin-bottom:32px; }
    .hdr-title { font-family:'Lora',Georgia,serif; font-size:30px; font-weight:700; color:#1a1a2e; margin-bottom:8px; }
    .hdr-meta  { font-size:12.5px; color:#64748b; font-weight:600; }
    .hdr-meta span { color:#3730a3; }
    h1 { font-family:'Lora',Georgia,serif; font-size:22px; font-weight:700; color:#1a1a2e; margin:32px 0 10px; padding-bottom:8px; border-bottom:2px solid #e8e6ff; }
    h2 { font-family:'Lora',Georgia,serif; font-size:18px; font-weight:700; color:#3730a3; margin:24px 0 8px; }
    h3 { font-size:15px; font-weight:700; color:#1e293b; margin:18px 0 6px; padding-left:12px; border-left:3px solid #818cf8; }
    p  { margin:0 0 10px; }
    li { margin:4px 0 4px 22px; list-style:disc; }
    strong { color:#1a1a2e; font-weight:700; }
    hr { border:none; border-top:1px solid #e2e8f0; margin:18px 0; }
    .tip { background:#eff6ff; border:1px solid #bfdbfe; border-radius:6px; padding:8px 14px; margin:10px 0; font-size:13px; color:#1d4ed8; font-weight:600; }
    @media print {
      body { background:#fff; padding:0; }
      .page { box-shadow:none; border-radius:0; max-width:100%; padding:0; }
      @page { margin:0.65in; }
    }
  </style>
</head>
<body>
  <div class="page">
    <div class="hdr">
      <div class="hdr-title">${title.split('—')[0]?.trim() || title}</div>
      <div class="hdr-meta"><span>${title.split('—')[1]?.trim() || ''}</span> · CBSE 2024-25</div>
    </div>
    ${body}
  </div>
  <script>
    // Only print after fonts + content are loaded — never blocks parent
    window.addEventListener('load', function() {
      setTimeout(function() { window.print(); }, 400);
    });
  <\/script>
</body>
</html>`

  // ✅ Blob URL approach — zero DOM blocking on the parent window
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const win  = window.open(url, '_blank')

  // Clean up the blob URL after the new window has loaded it
  if (win) {
    win.addEventListener('load', () => URL.revokeObjectURL(url), { once: true })
  } else {
    // Popup blocked fallback — revoke after a delay
    setTimeout(() => URL.revokeObjectURL(url), 30000)
  }
}

async function loadScript(src) {
  if (document.querySelector(`script[src="${src}"]`)) return
  return new Promise((res, rej) => {
    const s = document.createElement('script')
    s.src = src; s.async = true; s.defer = true
    s.onload = res; s.onerror = rej
    document.head.appendChild(s)
  })
}

const timeAgo = t => {
  const d = (Date.now() - new Date(t)) / 1000
  if (d < 60) return 'just now'
  if (d < 3600) return `${Math.floor(d / 60)}m ago`
  if (d < 86400) return `${Math.floor(d / 3600)}h ago`
  return `${Math.floor(d / 86400)}d ago`
}

function canMessageUser(me, target) {
  if (!me || !target || me.id === target.id) return false
  // Students may never message other students.
  if (me.role === 'student' && target.role === 'student') return false
  return true
}

function PillMultiSelect({ options, selected = [], onChange, color = 'var(--accent)' }) {
  const toggle = o =>
    selected.includes(o) ? onChange(selected.filter(x => x !== o)) : onChange([...selected, o])
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {options.map(o => {
        const sel = selected.includes(o)
        return (
          <span key={o} onClick={() => toggle(o)} style={{
            padding: '5px 12px', borderRadius: 20, fontSize: 12.5, cursor: 'pointer',
            fontWeight: 700, fontFamily: "'Nunito', sans-serif", userSelect: 'none',
            background: sel ? color : 'var(--accent-bg)', color: sel ? '#fff' : 'var(--accent)',
            border: `1px solid ${sel ? color : 'var(--accent-border)'}`, transition: 'all .15s',
          }}>{o}</span>
        )
      })}
    </div>
  )
}

function MultiSelectDropdown({ options, selected = [], onChange, placeholder = '── Select ──', max = 99, color = 'var(--accent)' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  const toggle = o => {
    if (selected.includes(o)) onChange(selected.filter(x => x !== o))
    else if (selected.length < max) onChange([...selected, o])
  }

  const triggerLabel = selected.length === 0 ? placeholder
    : selected.length === 1 ? selected[0]
    : `${selected.length} selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10, border: `1.5px solid ${open ? color : 'var(--border)'}`,
          background: '#fff', color: selected.length ? '#1e293b' : '#64748b', fontSize: 14,
          fontFamily: "'Nunito', sans-serif", cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{triggerLabel}</span>
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {selected.map(o => (
            <span key={o} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-bg)', color, border: `1px solid ${color}44`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700 }}>
              {o}<span onClick={e => { e.stopPropagation(); toggle(o) }} style={{ cursor: 'pointer', fontSize: 13, fontWeight: 900, lineHeight: 1 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff',
          border: `1.5px solid ${color}55`, borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,.18)', zIndex: 500, overflow: 'hidden' }}>
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#f8fafc', color: '#1e293b', fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: 'none' }} />
            <button onClick={() => onChange(options.slice(0, max))} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color, fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>All</button>
            <button onClick={() => onChange([])} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer' }}>Clear</button>
          </div>
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
            {filtered.map(o => {
              const checked = selected.includes(o)
              return (
                <div key={o} onClick={() => toggle(o)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 14px', cursor: 'pointer', background: checked ? 'var(--accent-bg)' : 'transparent' }}>
                  <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${checked ? color : '#cbd5e1'}`, background: checked ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13.5, color: checked ? color : '#1e293b', fontWeight: checked ? 700 : 400, fontFamily: "'Nunito', sans-serif" }}>{o}</span>
                </div>
              )
            })}
            {filtered.length === 0 && <div style={{ padding: 14, textAlign: 'center', fontSize: 13, color: '#64748b' }}>No matches</div>}
          </div>
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.length} selected</span>
            <button onClick={() => setOpen(false)} style={{ padding: '5px 16px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer' }}>Done ✓</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ name, url, size = 44, fontSize }) {
  if (url) return (
    <img src={url} alt="" style={{
      width: size, height: size, borderRadius: '50%', objectFit: 'cover',
      flexShrink: 0, border: '2px solid var(--bg)',
    }} />
  )
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontFamily: "'Sora',sans-serif",
      fontSize: fontSize || Math.round(size * 0.4), flexShrink: 0,
    }}>{name?.[0]?.toUpperCase() || '?'}</div>
  )
}

const pillRO     = { background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '4px 12px', fontSize: 12.5, fontWeight: 700 }
const pillNeutral= { background: 'var(--code-bg)', border: '1px solid var(--border)', borderRadius: 20, padding: '2px 10px', fontSize: 12, color: 'var(--text-h)', fontWeight: 600 }
const valueRO    = { color: 'var(--text-h)', fontSize: 14, margin: 0, fontWeight: 600 }
const emptyRO    = { color: 'var(--text)', fontSize: 13, margin: 0, fontStyle: 'italic' }

// ══════════════════════════════════════════════════════════════
//  DESIGN TOKENS
// ══════════════════════════════════════════════════════════════
const T = {
  card:   { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px', boxShadow:'var(--shadow-md)' },
  label:  { display:'block', fontSize:'10.5px', fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'0.6px', marginBottom:'6px', fontFamily:"'Nunito', sans-serif" },
  input:  { width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', fontSize:'14px', fontFamily:"'Nunito', sans-serif", boxSizing:'border-box', outline:'none', transition:'border-color .2s' },
  select: { width:'100%', padding:'10px 14px', borderRadius:'10px', border:'1.5px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', fontSize:'14px', fontFamily:"'Nunito', sans-serif", appearance:'auto', outline:'none', cursor:'pointer' },
}

// ══════════════════════════════════════════════════════════════
//  BASE UI COMPONENTS
// ══════════════════════════════════════════════════════════════
function PageHeader({ icon, title, subtitle, color }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:3 }}>
        <span style={{ fontSize:26 }}>{icon}</span>
        <h2 style={{ fontFamily:"'Sora', sans-serif", fontWeight:900, fontSize:'clamp(1.1rem,2.5vw,1.45rem)', color:'var(--text-h)', margin:0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ color:'var(--text)', fontSize:13, margin:0, paddingLeft:36 }}>{subtitle}</p>}
      <div style={{ height:3, width:44, background:color||'var(--accent)', borderRadius:2, marginTop:8, marginLeft:36 }}/>
    </div>
  )
}
function Card({ children, style = {} }) {
  return (
    <div className="bs-card" style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: 20,
      boxShadow: '0 1px 8px rgba(15,23,42,.05)',
      ...style,
    }}>
      {children}
    </div>
  )
}
function Label({ children }) { return <div style={T.label}>{children}</div> }
function PrimaryBtn({ children, onClick, disabled, color = 'var(--accent)', small, style = {}, gradient }) {
  const bg = gradient || (color.startsWith('var(') ? color : `linear-gradient(135deg,${color},${color}cc)`)
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        background: bg, color: '#fff',
        padding: small ? '9px 16px' : '13px 22px',
        minHeight: small ? 42 : 48,   /* 48 px is Apple's min tap-target */
        borderRadius: small ? 9 : 11, border: 'none',
        fontWeight: 800, fontSize: small ? 13.5 : 15,
        cursor: disabled ? 'not-allowed' : 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontFamily: "'Nunito', sans-serif",
        opacity: disabled ? .6 : 1, transition: 'opacity .15s',
        ...style,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '.88' }}
      onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
    >
      {children}
    </button>
  )
}
function OutlineBtn({ children, onClick, disabled, color='var(--accent)', small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--code-bg)', color, padding:small?'6px 13px':'9px 18px', borderRadius:small?9:10, border:`2px solid ${color}`, fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}
function GhostBtn({ children, onClick, disabled, small, style={} }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:'var(--social-bg)', color:'var(--text-h)', padding:small?'6px 12px':'9px 16px', borderRadius:small?8:10, border:'1px solid var(--border)', fontWeight:700, fontSize:small?12.5:14, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:5, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, ...style }}>
      {children}
    </button>
  )
}
function Field({ label, children }) {
  return <div style={{ marginBottom:14 }}><Label>{label}</Label>{children}</div>
}
function BSInput({ value, onChange, placeholder, type = 'text', required, disabled, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      type={type}
      required={required}
      disabled={disabled}
      style={{
        width: '100%', padding: '11px 14px',
        borderRadius: 10,
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg2)', color: 'var(--text-h)',
fontSize: 16,             /* ← must be ≥16 px on iOS */
        fontFamily: "'Nunito', sans-serif",
        boxSizing: 'border-box', outline: 'none',
        transition: 'border-color .2s',
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
function BSSelect({ value, onChange, options, disabled = false, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%', padding: '11px 14px',
        borderRadius: 10,
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        background: disabled ? 'var(--code-bg)' : 'var(--bg2)',
        color: disabled ? 'var(--text)' : 'var(--text-h)',
        fontSize: 16,             /* ← must be ≥16 px on iOS */
        fontFamily: "'Nunito', sans-serif",
        appearance: 'auto', outline: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'border-color .2s',
        ...style,
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}
          style={{ background: '#fff', color: '#1e293b' }}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}
function BSTextarea({ value, onChange, placeholder, rows = 4, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', padding: '11px 14px',
        borderRadius: 10,
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        background: 'var(--bg2)', color: 'var(--text-h)',
fontSize: 16,             /* ← must be ≥16 px on iOS */
        fontFamily: "'Nunito', sans-serif",
        resize: 'vertical', lineHeight: 1.6,
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color .2s',
        ...style,
      }}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
    />
  )
}
function Spinner({ size=16 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,.15)`, borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
}

function LessonPicker({ value, onChange, accent = 'var(--accent)' }) {
  const sel = value
  const set = patch => onChange({ ...sel, ...patch })
 
  // These helpers come from the parent App.jsx — keep referencing them
  const subjects  = typeof getSubjectsForClass !== 'undefined' ? getSubjectsForClass(sel.cls) : []
  const chapters  = (sel.subject && typeof getChapters !== 'undefined') ? getChapters(sel.subject, sel.cls) : []
  const subtopics = (sel.subject && sel.chapter && typeof getSubtopics !== 'undefined')
    ? getSubtopics(sel.cls, sel.subject, sel.chapter) : []
 
  const subTopicOptions = [
    { value: 'full', label: '📘 Full Chapter' },
    ...subtopics.map(s => ({ value: s, label: s })),
    { value: 'custom', label: '✍️ Write my own...' },
  ]
 
  const CLASSES_LIST = typeof CLASSES !== 'undefined' ? CLASSES : []
 
  return (
    <div>
      {/*
        minmax(min(100%, 180px), 1fr) → 1 column on phones,
        up to 3 columns on wider screens.
        This is the key responsive fix for forms.
      */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 180px), 1fr))',
        gap: 12, marginBottom: 4,
      }}>
        <div><label style={{ display:'block', fontSize:'10.5px', fontWeight: 800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom: 6 }}>Class</label>
          <BSSelect value={sel.cls}
            onChange={v => set({ cls: v, subject: '', chapter: '', subTopicChoice: 'full', customText: '' })}
            options={CLASSES_LIST} />
        </div>
        <div><label style={{ display:'block', fontSize:'10.5px', fontWeight: 800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom: 6 }}>Subject</label>
          <BSSelect value={sel.subject}
            onChange={v => set({ subject: v, chapter: '', subTopicChoice: 'full', customText: '' })}
            options={[{ value: '', label: 'Select subject' }, ...subjects.map(s => ({ value: s, label: s }))]} />
        </div>
        <div><label style={{ display:'block', fontSize:'10.5px', fontWeight: 800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom: 6 }}>Chapter</label>
          <BSSelect value={sel.chapter} disabled={!sel.subject}
            onChange={v => set({ chapter: v, subTopicChoice: 'full', customText: '' })}
            options={[{ value: '', label: 'Select chapter' }, ...chapters.map(c => ({ value: c, label: c }))]} />
        </div>
      </div>
 
      <div style={{ marginBottom: 14 }}>
        <label style={{ display:'block', fontSize:'10.5px', fontWeight: 800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom: 6 }}>Sub Topic</label>
        <BSSelect
          value={sel.subTopicChoice}
          disabled={!sel.chapter}
          onChange={v => set({ subTopicChoice: v, customText: v === 'custom' ? sel.customText : '' })}
          options={sel.chapter ? subTopicOptions : [{ value: 'full', label: 'Select a chapter first' }]}
        />
      </div>
 
      {sel.chapter && sel.subTopicChoice === 'custom' && (
        <div style={{ marginBottom: 4 }}>
          <label style={{ display:'block', fontSize:'10.5px', fontWeight: 800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', marginBottom: 6 }}>Type your focus</label>
          <BSInput
            value={sel.customText}
            onChange={v => set({ customText: v })}
            placeholder="e.g. only numerical problems, or a specific sub-topic not listed above"
          />
        </div>
      )}
    </div>
  )
}

function RandomTopicBox({ value, onChange, onGenerate, loading, accent = 'var(--accent)', buttonLabel = 'Generate', placeholder = "e.g. Photosynthesis, Newton's Laws, French Revolution…" }) {
  return (
    <Card style={{ marginTop: 12, padding: 14 }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: accent, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
        🎲 Or generate on a Random Topic
        <span style={{ color: 'var(--text)', fontWeight: 600, fontSize: 11.5 }}>(not tied to any chapter)</span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <BSInput value={value} onChange={onChange} placeholder={placeholder} />
        <PrimaryBtn small onClick={onGenerate} disabled={loading || !value.trim()} color={accent}>
          {loading ? <Spinner size={14} /> : buttonLabel}
        </PrimaryBtn>
      </div>
    </Card>
  )
}



function PageSpinner() {
  return (
    <div style={{ display:'flex', justifyContent:'center', alignItems:'center', padding:64, flexDirection:'column', gap:12 }}>
      <div style={{ width:36, height:36, border:'3px solid var(--border)', borderTopColor:'var(--accent)', borderRadius:'50%', animation:'spin 1s linear infinite' }}/>
      <span style={{ fontSize:13, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>Loading...</span>
    </div>
  )
}
function ErrMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', borderRadius:9, padding:'10px 14px', color:'#fca5a5', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>⚠️ {msg}</div>
}
function SuccessMsg({ msg }) {
  if (!msg) return null
  return <div style={{ background:'rgba(16,185,129,.1)', border:'1px solid rgba(16,185,129,.25)', borderRadius:9, padding:'10px 14px', color:'#6ee7b7', fontSize:13, fontWeight:600, marginTop:8, fontFamily:"'Nunito', sans-serif" }}>✅ {msg}</div>
}
function Tag({ label, onRemove }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:4, background:'var(--accent-bg)', color:'var(--accent)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'3px 10px', fontSize:12, fontWeight:700, fontFamily:"'Nunito', sans-serif" }}>
      {label} {onRemove && <span onClick={onRemove} style={{ cursor:'pointer', fontWeight:800 }}>×</span>}
    </span>
  )
}
function XPBadge({ amount, label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', marginTop:14 }}>
      <div style={{ background:'var(--accent-bg)', padding:'5px 14px', borderRadius:20, display:'flex', alignItems:'center', gap:5, border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:700, fontSize:12.5, fontFamily:"'Nunito', sans-serif" }}>
        ⚡ Earn +{amount} XP {label}
      </div>
    </div>
  )
}

function MultiChapterSelect({ subject, cls, selected = [], onChange, max = 20 }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef(null)
  const chapters = getChapters(subject, cls)

  // Close when clicking outside
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const filtered = search.trim()
    ? chapters.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : chapters

  const toggle = ch => {
    if (selected.includes(ch)) onChange(selected.filter(c => c !== ch))
    else if (selected.length < max) onChange([...selected, ch])
  }

  const selectAll   = () => onChange(chapters.slice(0, max))
  const clearAll    = () => onChange([])

  const triggerLabel = selected.length === 0
    ? ' Select chapters '
    : selected.length === 1
    ? selected[0]
    : `${selected.length} chapters selected`

  return (
    <div ref={ref} style={{ position: 'relative' }}>

      {/* ── Trigger button ── */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 14px', borderRadius: 10,
          border: `1.5px solid ${open ? 'var(--accent)' : 'var(--border)'}`,
          background: 'var(--bg2)', color: selected.length ? 'var(--text-h)' : 'var(--text)',
          fontSize: 14, fontFamily: "'Nunito', sans-serif", cursor: 'pointer',
          transition: 'border-color .2s', textAlign: 'left',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
          {triggerLabel}
        </span>
        <span style={{ marginLeft: 8, fontSize: 11, color: 'var(--text)', flexShrink: 0, transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {/* ── Selected pills (shown below trigger) ── */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}>
          {selected.map(ch => (
            <span key={ch} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 700, fontFamily: "'Nunito', sans-serif" }}>
              {ch}
              <span
                onClick={e => { e.stopPropagation(); toggle(ch) }}
                style={{ cursor: 'pointer', fontSize: 13, fontWeight: 900, lineHeight: 1 }}
              >×</span>
            </span>
          ))}
        </div>
      )}

      {/* ── Dropdown panel ── */}
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0,
          background: 'var(--bg2)', border: '1.5px solid var(--accent-border)',
          borderRadius: 12, boxShadow: 'var(--shadow-md)',
          zIndex: 500, overflow: 'hidden',
        }}>
          {/* Search + bulk actions */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search chapters…"
              style={{
                flex: 1, padding: '6px 10px', borderRadius: 8,
                border: '1px solid var(--border)', background: 'var(--code-bg)',
                color: 'var(--text-h)', fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: 'none',
              }}
            />
            <button onClick={selectAll} style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: 'var(--accent)', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif" }}>All</button>
            <button onClick={clearAll}  style={{ padding: '5px 10px', borderRadius: 7, border: '1px solid var(--border)', background: 'transparent', color: '#94a3b8', fontSize: 11.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>Clear</button>
          </div>

          {/* Chapter list */}
          <div style={{ maxHeight: 240, overflowY: 'auto', padding: '6px 0' }}>
            {filtered.map(ch => {
              const checked = selected.includes(ch)
              const disabled = !checked && selected.length >= max
              return (
                <div
                  key={ch}
                  onClick={() => !disabled && toggle(ch)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 14px', cursor: disabled ? 'not-allowed' : 'pointer',
                    background: checked ? 'var(--accent-bg)' : 'transparent',
                    opacity: disabled ? .4 : 1,
                    transition: 'background .12s',
                  }}
                  onMouseEnter={e => { if (!disabled && !checked) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
                  onMouseLeave={e => { if (!checked) e.currentTarget.style.background = 'transparent' }}
                >
                  {/* Custom checkbox */}
                  <div style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${checked ? 'var(--accent)' : '#475569'}`,
                    background: checked ? 'var(--accent)' : 'transparent',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all .15s',
                  }}>
                    {checked && <span style={{ color: '#fff', fontSize: 10, fontWeight: 900, lineHeight: 1 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13.5, color: checked ? 'var(--accent)' : 'var(--text-h)', fontWeight: checked ? 700 : 400, fontFamily: "'Nunito', sans-serif" }}>
                    {ch}
                  </span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <div style={{ padding: '14px', textAlign: 'center', fontSize: 13, color: '#64748b' }}>No chapters match</div>
            )}
          </div>

          {/* Footer */}
          <div style={{ padding: '8px 14px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748b' }}>{selected.length}/{max} selected</span>
            <button
              onClick={() => setOpen(false)}
              style={{ padding: '5px 16px', borderRadius: 8, border: 'none', background: 'var(--accent)', color: '#fff', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
            >
              Done ✓
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function ChapterSelector({ subject, cls, selected, onChange, max=20 }) {
  const chapters = getChapters(subject, cls)
  const toggle = (ch) => {
    if (selected.includes(ch)) onChange(selected.filter(c=>c!==ch))
    else if (selected.length < max) onChange([...selected, ch])
  }
  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
        <GhostBtn small onClick={()=>onChange(chapters)}>Select All</GhostBtn>
        {selected.length>0 && <GhostBtn small onClick={()=>onChange([])}>Clear</GhostBtn>}
        <span style={{ fontSize:12, color:'var(--text)', fontFamily:"'Nunito', sans-serif" }}>{selected.length} selected</span>
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
        {chapters.map(ch=>{
          const sel = selected.includes(ch)
          return (
            <span key={ch} onClick={()=>toggle(ch)}
              style={{ padding:'5px 13px', borderRadius:20, fontSize:12, cursor:'pointer', fontWeight:700, fontFamily:"'Nunito', sans-serif",
                background:sel?'var(--accent)':'var(--accent-bg)', color:sel?'#fff':'var(--accent)',
                border:`1px solid ${sel?'var(--accent)':'var(--accent-border)'}`, transition:'all .15s' }}>
              {ch}
            </span>
          )
        })}
      </div>
      {selected.length>0 && (
        <div style={{ marginTop:10, display:'flex', flexWrap:'wrap', gap:5 }}>
          <span style={{ fontSize:12, color:'var(--text)', alignSelf:'center', fontFamily:"'Nunito', sans-serif" }}>Selected: </span>
          {selected.map(ch=><Tag key={ch} label={ch} onRemove={()=>toggle(ch)}/>)}
        </div>
      )}
    </div>
  )
}
function ContentBox({ content, onDownload, downloadName, label='Generated Content' }) {
  const lines = (content||'').split('\n')
  return (
    <Card style={{ marginTop:18 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
        <h3 style={{ margin:0, fontSize:15, color:'var(--text-h)', fontFamily:"'Sora', sans-serif", fontWeight:800 }}>{label}</h3>
        <div style={{ display:'flex', gap:8 }}>
          {onDownload && <GhostBtn small onClick={onDownload}>⬇ Download</GhostBtn>}
          <GhostBtn small onClick={()=>printContent(content, downloadName)}>🖨 Print / PDF</GhostBtn>
        </div>
      </div>
      <div style={{ maxHeight:'60vh', overflowY:'auto', fontFamily:"'Nunito', sans-serif", fontSize:14, lineHeight:1.85, color:'var(--text-h)', padding:'4px 2px' }}>
        {lines.map((line,i)=>{
          if(line.startsWith('# '))   return <h2 key={i} style={{ color:'var(--accent)', borderBottom:'2px solid var(--accent-border)', paddingBottom:6, margin:'16px 0 8px', fontFamily:"'Sora', sans-serif" }}>{line.slice(2)}</h2>
          if(line.startsWith('## '))  return <h3 key={i} style={{ color:'var(--text-h)', margin:'14px 0 6px', fontFamily:"'Sora', sans-serif" }}>{line.slice(3)}</h3>
          if(line.startsWith('### ')) return <h4 key={i} style={{ color:'var(--text-h)', margin:'10px 0 4px', fontFamily:"'Sora', sans-serif" }}>{line.slice(4)}</h4>
          if(line.startsWith('- ')||line.startsWith('• ')) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }} dangerouslySetInnerHTML={{ __html:'• '+line.slice(2).replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }}/>
          if(/^\d+\./.test(line)) return <div key={i} style={{ paddingLeft:16, marginBottom:2, color:'var(--text-h)' }} dangerouslySetInnerHTML={{ __html:line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>') }}/>
          if(line.startsWith('---')||line.startsWith('═══')) return <hr key={i} style={{ border:'none', borderTop:'1px solid var(--border)', margin:'12px 0' }}/>
          const bold = line.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
          return <p key={i} style={{ margin:'3px 0', color:'var(--text-h)' }} dangerouslySetInnerHTML={{ __html:bold }}/>
        })}
      </div>
    </Card>
  )
}

// ══════════════════════════════════════════════════════════════
//  MEDIA UPLOADER
// ══════════════════════════════════════════════════════════════
function MediaUploader({ onUpload, onClear, current, accept='image/*,application/pdf', label='📎 Add Photo/File', small=false }) {
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)
  const handleFile = async (file) => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const tok = localStorage.getItem('bs_token')
      const r = await fetch(`${API_URL}/api/upload/media`, { method:'POST', headers:{ Authorization:`Bearer ${tok}` }, body:form })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error)
      onUpload(data.url, data.type)
    } catch (e) { alert('Upload failed: ' + e.message) }
    setLoading(false)
  }
  if (current?.url) return (
    <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
      {current.type==='image'
        ? <img src={current.url} style={{ width:56, height:56, objectFit:'cover', borderRadius:8, border:'1px solid var(--border)' }} alt=""/>
        : <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:8, padding:'5px 10px', fontSize:11.5, color:'var(--accent)', fontWeight:700 }}>📄 PDF</div>
      }
      <button onClick={onClear} style={{ background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.25)', color:'#fca5a5', borderRadius:6, padding:'3px 8px', fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito', sans-serif" }}>✕</button>
    </div>
  )
  return (
    <div>
      <input ref={inputRef} type="file" accept={accept} style={{ display:'none' }} onChange={e=>handleFile(e.target.files[0])}/>
      <button onClick={()=>inputRef.current?.click()} disabled={loading}
        style={{ display:'inline-flex', alignItems:'center', gap:5, padding:small?'5px 10px':'7px 14px', borderRadius:8, border:'1px dashed var(--border)', background:'transparent', color:'var(--text)', cursor:'pointer', fontSize:small?11.5:12.5, fontWeight:600, fontFamily:"'Nunito', sans-serif", opacity:loading?.6:1 }}>
        {loading ? '⏳ Uploading...' : label}
      </button>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FREE TIER COUNTDOWN
// ══════════════════════════════════════════════════════════════
function FreeTierCountdown({ user, onSubscribe, onExpired }) {
  const [seconds, setSeconds] = useState(null)
  useEffect(() => {
    if (!user || user.type==='school' || user.subscription_status==='active') return
    const initial = getSecondsRemaining(user.free_tier_started_at)
    setSeconds(initial)
    if (initial <= 0) { onExpired?.(); return }
    if (!user.free_tier_started_at) return // hasn't started yet, no ticking
    const interval = setInterval(() => {
      const rem = getSecondsRemaining(user.free_tier_started_at)
      setSeconds(rem)
      if (rem <= 0) { clearInterval(interval); onExpired?.() }
    }, 1000)
    return () => clearInterval(interval)
  }, [user?.id, user?.free_tier_started_at, user?.subscription_status])

  if (!user || user.type==='school' || user.subscription_status==='active') return null
  if (seconds === null) return null

  if (seconds <= 0) return (
    <div onClick={onSubscribe} style={{ background:'rgba(239,68,68,.12)', border:'1px solid rgba(239,68,68,.3)', borderRadius:11, padding:'10px 16px', marginBottom:16, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ color:'#fca5a5', fontWeight:700, fontSize:13.5 }}>⛔ Free trial ended — Subscribe to continue</span>
      <span style={{ color:'#ef4444', fontWeight:800, fontSize:12.5 }}>Subscribe →</span>
    </div>
  )

  // If not started yet (first visit)
  if (!user.free_tier_started_at) return (
    <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:11, padding:'9px 16px', marginBottom:16, display:'flex', justifyContent:'space-between', alignItems:'center', fontFamily:"'Nunito', sans-serif" }}>
      <span style={{ fontSize:13, color:'var(--text-h)', fontWeight:700 }}>⏱ 10:00 free trial — starts on your first AI call</span>
      <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
    </div>
  )

  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  const pct  = Math.round((seconds / FREE_WINDOW) * 100)
  const isLow = seconds <= 120

  return (
    <div style={{ background:isLow?'rgba(239,68,68,.08)':'var(--accent-bg)', border:`1px solid ${isLow?'rgba(239,68,68,.25)':'var(--accent-border)'}`, borderRadius:11, padding:'9px 16px', marginBottom:16, fontFamily:"'Nunito', sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:13, fontWeight:700, color:isLow?'#fca5a5':'var(--text-h)' }}>{isLow?'⚠️':'⏱'} Free Trial:</span>
          <span style={{ fontFamily:"'Sora', monospace", fontWeight:900, fontSize:17, color:isLow?'#ef4444':'var(--accent)', animation:isLow?'pulse 1s infinite':'none', letterSpacing:1 }}>
            {String(mins).padStart(2,'0')}:{String(secs).padStart(2,'0')}
          </span>
        </div>
        <span onClick={onSubscribe} style={{ fontSize:12, color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Upgrade →</span>
      </div>
      <div style={{ background:'var(--border)', borderRadius:999, height:4 }}>
        <div style={{ background:isLow?'#ef4444':'var(--accent)', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s linear' }}/>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MOBILE TOP NAV
// ══════════════════════════════════════════════════════════════
function MobileTopNav({ tabs, activeTab, onTabChange, unreadCount = 0 }) {
  return (
    <div className="mobile-top-nav" style={{ position: 'sticky', top: 58, zIndex: 90, background: 'rgba(255,255,255,.95)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)', padding: '4px 8px', display: 'flex', gap: 2, overflowX: 'auto', scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onTabChange(t.id)} style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, padding: '5px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', background: activeTab === t.id ? `${t.color}22` : 'transparent', color: activeTab === t.id ? t.color : '#64748b', fontFamily: "'Nunito',sans-serif", fontWeight: 700, fontSize: 8.5, minWidth: 46, flexShrink: 0, transition: 'all .15s', borderBottom: activeTab === t.id ? `2px solid ${t.color}` : '2px solid transparent' }}>
          <span style={{ fontSize: 17, position: 'relative' }}>
            {t.icon}
            {t.id === 'messages' && unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -4, right: -8, minWidth: 14, height: 14, padding: '0 3px', borderRadius: 7, background: '#ef4444', color: '#fff', fontSize: 8, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </span>
          {t.label.split(' ')[0]}
        </button>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  LANDING PAGE
// ══════════════════════════════════════════════════════════════
function LandingPage({ onStart }) {
  const feats = [
    {e:'📚',t:'Chapter Courses',d:"AI builds a full course per chapter — best YouTube video, notes & quiz per topic.",c:'#8B5CF6'},
    {e:'📖',t:'Chapter Notes',d:"Textbook-quality notes you can download or print as PDF.",c:'#10B981'},
    {e:'🤔',t:'Doubt Solver',d:"Step-by-step answers to any CBSE question with full explanations.",c:'#818CF8'},
    {e:'🎯',t:'Quizzes',d:"Auto-generated MCQ quizzes with a timer, instant scoring and explanations.",c:'#F59E0B'},
    {e:'🃏',t:'Flashcards',d:"Flip-card sets for fast revision in grid or study mode.",c:'#EF4444'},
    {e:'📣',t:'Study Feed',d:"Share achievements and ask questions like a social app — with anonymous mode.",c:'#6366F1'},
  ]
  return (
    <div style={{ minHeight:'100vh', background:'#f4f4f0', fontFamily:"'Nunito',sans-serif" }}>
      <nav style={{ padding:'0 5%', height:62, display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100, background:'rgba(255,255,255,.85)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(15,23,42,.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:9 }}>
          <div style={{ width:34, height:34, borderRadius:10, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🧠</div>
          <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:17, color:'#1e293b' }}>BrainSpark<span style={{ color:'#6366F1' }}> AI</span></span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={()=>onStart('signin')} style={{ padding:'7px 16px', borderRadius:9, border:'1px solid rgba(15,23,42,.12)', background:'transparent', color:'#475569', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Sign In</button>
          <button onClick={()=>onStart('signup')} style={{ padding:'7px 16px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>Get Started Free →</button>
        </div>
      </nav>
      <section style={{ position:'relative', padding:'88px 5% 64px', textAlign:'center', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:0, left:'20%', width:600, height:600, borderRadius:'50%', background:'radial-gradient(circle,rgba(99,102,241,.15),transparent 65%)', filter:'blur(80px)', pointerEvents:'none' }}/>
        <div style={{ position:'relative', zIndex:1, maxWidth:820, margin:'0 auto' }}>
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, padding:'5px 14px', borderRadius:30, background:'rgba(79,70,229,.08)', border:'1px solid rgba(79,70,229,.2)', marginBottom:18, fontSize:12, color:'#4f46e5', fontWeight:700 }}>✦ AI Learning Platform Built for CBSE</div>
          <h1 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(28px,5.5vw,62px)', fontWeight:900, lineHeight:1.08, color:'#1e293b', marginBottom:16 }}>
            Where Students<br/>
            <span style={{ background:'linear-gradient(135deg,#818CF8,#A855F7,#06b6d4)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>Learn, Share & Grow</span>
          </h1>
          <p style={{ fontSize:'clamp(14px,1.8vw,17px)', color:'#64748b', lineHeight:1.8, marginBottom:30, maxWidth:520, margin:'0 auto 30px' }}>AI study tools + a student feed — one platform built for Indian students and teachers.</p>
          <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
            <button onClick={()=>onStart('signup')} style={{ padding:'13px 34px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f46e5,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Start Free — 60-Day Trial</button>
            <button onClick={()=>onStart('school')} style={{ padding:'12px 22px', borderRadius:10, border:'1px solid rgba(79,70,229,.25)', background:'rgba(79,70,229,.08)', color:'#4f46e5', fontSize:13.5, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🏫 School Login</button>
          </div>
        </div>
      </section>
      <section style={{ padding:'64px 5%' }}>
        <div style={{ textAlign:'center', marginBottom:36 }}>
          <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(18px,3vw,34px)', fontWeight:800, color:'#1e293b', marginBottom:8 }}>Everything to excel</h2>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12, maxWidth:1000, margin:'0 auto' }}>
          {feats.map((f,i)=>(
            <div key={i} onClick={()=>onStart('signup')} style={{ background:'#ffffff', border:'1px solid rgba(15,23,42,.08)', borderRadius:13, padding:20, cursor:'pointer', boxShadow:'0 1px 10px rgba(15,23,42,.05)', transition:'border-color .2s,transform .2s' }}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=f.c+'55';e.currentTarget.style.transform='translateY(-2px)'}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(15,23,42,.08)';e.currentTarget.style.transform='none'}}>
              <div style={{ width:44, height:44, borderRadius:11, background:`${f.c}18`, border:`1px solid ${f.c}28`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, marginBottom:11 }}>{f.e}</div>
              <div style={{ fontFamily:"'Sora',sans-serif", fontSize:13.5, fontWeight:700, color:'#1e293b', marginBottom:5 }}>{f.t}</div>
              <p style={{ fontSize:12, color:'#64748b', lineHeight:1.65, margin:0 }}>{f.d}</p>
            </div>
          ))}
        </div>
      </section>
      <section style={{ padding:'52px 5%', textAlign:'center' }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontSize:'clamp(20px,4vw,42px)', fontWeight:900, color:'#1e293b', marginBottom:10 }}>
          Ready to study <span style={{ background:'linear-gradient(135deg,#f59e0b,#ef4444)', WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text' }}>smarter?</span>
        </h2>
        <p style={{ color:'#64748b', fontSize:13.5, marginBottom:26 }}>60-day free trial · AI-powered · CBSE aligned · Built for India</p>
        <button onClick={()=>onStart('signup')} style={{ padding:'14px 42px', borderRadius:10, border:'none', background:'linear-gradient(135deg,#4f46e5,#8B5CF6)', color:'#fff', fontSize:15, fontWeight:700, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>🚀 Get Started Free</button>
      </section>
      <footer style={{ padding:'18px 5%', borderTop:'1px solid rgba(15,23,42,.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontFamily:"'Sora',sans-serif", color:'#475569', fontSize:12, fontWeight:700 }}>BrainSpark AI © 2026</span>
        <span style={{ fontSize:10.5, color:'#1e293b' }}>Powered by Claude · OpenAI · Groq · Built for CBSE</span>
      </footer>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  AUTH PAGE
// ══════════════════════════════════════════════════════════════
function AuthPage({ onAuth, initMode }) {
  useFonts()
  const [tab,    setTab]    = useState(initMode==='school'?'school':'personal')
  const [role,   setRole]   = useState(initMode==='teacher'?'teacher':'student')
  const [mode,   setMode]   = useState('login')
  const [form,   setForm]   = useState({ name:'', email:'', password:'', schoolCode:'', identifier:'', confirmPassword:'' })
  const [err,    setErr]    = useState('')
  const [busy,   setBusy]   = useState(false)
  const [showPw, setShowPw] = useState(false)
  const [regStep, setRegStep] = useState('form')   // 'form' = enter details, 'otp' = enter code
  const [otp,     setOtp]     = useState('')
  const gBtnRef = useRef(null)
  const set = (k)=>(v)=>setForm(f=>({...f,[k]:v}))

  // Reset the register step whenever they switch login/register or personal/school
  useEffect(() => { setRegStep('form'); setOtp(''); setErr('') }, [mode, tab])

  useEffect(()=>{
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID
    if (!clientId || tab!=='personal') return
    loadScript('https://accounts.google.com/gsi/client').then(()=>{
      if (!window.google || !gBtnRef.current) return
      window.google.accounts.id.initialize({ client_id:clientId, callback:async(resp)=>{
        try { setBusy(true); setErr(''); const data = await api.post('/api/auth/google',{idToken:resp.credential, role}); saveAuth(data); onAuth(data.user) }
        catch(e){ setErr(e.message) } finally{ setBusy(false) }
      }})
      window.google.accounts.id.renderButton(gBtnRef.current,{ theme:'outline', size:'large', width:280 })
    }).catch(()=>{})
  },[tab, role])

  async function handlePersonal(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      // ── Login: unchanged ──
      if (mode === 'login') {
        const data = await api.post('/api/auth/login', { email: form.email, password: form.password, role })
        saveAuth(data); onAuth(data.user); return
      }

      // ── Register step 1: validate details, then send the code ──
      if (regStep === 'form') {
        if (!form.name.trim())                      throw new Error('Name is required')
        if (form.password.length < 8)               throw new Error('Password must be at least 8 characters')
        if (form.password !== form.confirmPassword) throw new Error('Passwords do not match')
        await api.post('/api/auth/send-otp', { email: form.email })
        setRegStep('otp')   // reveal the code box
        return
      }

      // ── Register step 2: verify code, then create the account ──
      if (otp.trim().length < 4) throw new Error('Enter the code sent to your email')
      await api.post('/api/auth/verify-otp', { email: form.email, code: otp })
      const data = await api.post('/api/auth/register', { name: form.name, email: form.email, password: form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  async function handleSchool(e) {
    e.preventDefault(); setErr(''); setBusy(true)
    try {
      const data = await api.post('/api/auth/school',{ schoolCode:form.schoolCode, identifier:form.identifier, password:form.password, role })
      saveAuth(data); onAuth(data.user)
    } catch(e){ setErr(e.message) } finally{ setBusy(false) }
  }

  function saveAuth(data) {
    localStorage.setItem('bs_token',   data.token)
    localStorage.setItem('bs_session', data.sessionToken)
    localStorage.setItem('bs_user',    JSON.stringify(data.user))
  }

  const onOtpStep = mode === 'register' && regStep === 'otp'

  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#eef2ff,#f4f4f0)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#ffffff', border:'1px solid rgba(15,23,42,.08)', borderRadius:18, padding:28, width:'100%', maxWidth:430, boxShadow:'0 20px 60px rgba(15,23,42,.12)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}>
          <div style={{ width:52, height:52, borderRadius:14, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 10px', fontSize:26 }}>🧠</div>
          <h1 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:22, color:'#1e293b' }}>BrainSpark<span style={{ color:'#6366F1' }}> AI</span></h1>
          <p style={{ color:'#64748b', fontSize:13, marginTop:4 }}>Your AI-powered study companion</p>
        </div>
        <div style={{ display:'flex', background:'rgba(15,23,42,.04)', borderRadius:11, padding:3, marginBottom:18 }}>
          {[['personal','Personal'],['school','🏫 School']].map(([t,l])=>(
            <button key={t} onClick={()=>{setTab(t);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:'none', fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:tab===t?'#ffffff':'transparent', color:tab===t?'#1e293b':'#64748b', boxShadow:tab===t?'0 1px 4px rgba(15,23,42,.1)':'none', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        <div style={{ display:'flex', gap:8, marginBottom:18 }}>
          {[['student','🎒 Student'],['teacher','👨‍🏫 Teacher']].map(([r,l])=>(
            <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'8px 12px', borderRadius:9, border:`2px solid ${role===r?'var(--accent)':'var(--border)'}`, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:role===r?'var(--accent-bg)':'transparent', color:role===r?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        {tab==='personal'&&<>
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            {[['login','Sign In'],['register','Register']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:`2px solid ${mode===m?'var(--accent)':'var(--border)'}`, fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'var(--accent-bg)':'transparent', color:mode===m?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
            ))}
          </div>
          <form onSubmit={handlePersonal} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {mode==='register'&&<Field label="Full Name"><BSInput value={form.name} onChange={set('name')} placeholder="Your full name" disabled={onOtpStep}/></Field>}
            <Field label="Email Address"><BSInput value={form.email} onChange={set('email')} type="email" placeholder="your@email.com" disabled={onOtpStep}/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Password" style={{ paddingRight:40 }} disabled={onOtpStep}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b', userSelect:'none' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            {mode==='register'&&<Field label="Confirm Password"><BSInput value={form.confirmPassword} onChange={set('confirmPassword')} type="password" placeholder="Repeat password" disabled={onOtpStep}/></Field>}

            {onOtpStep && (
              <Field label="Verification Code">
                <BSInput value={otp} onChange={setOtp} placeholder="6-digit code from your email"/>
                <div style={{ fontSize:12, color:'#64748b', marginTop:6 }}>
                  Sent to {form.email}.{' '}
                  <span onClick={async()=>{ setErr(''); try{ await api.post('/api/auth/send-otp',{email:form.email}) }catch(e){ setErr(e.message) } }}
                    style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Resend</span>
                  {' · '}
                  <span onClick={()=>{ setRegStep('form'); setOtp('') }} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Edit details</span>
                </div>
              </Field>
            )}

            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center', marginTop:4 }} disabled={busy}>
              {busy
                ? <><Spinner/> {mode==='register' ? (onOtpStep ? 'Creating account...' : 'Sending code...') : 'Signing in...'}</>
                : mode==='register' ? (onOtpStep ? 'Verify & Create Account' : 'Create Account') : 'Sign In'}
            </PrimaryBtn>
          </form>
          {mode==='login'&&<p style={{ textAlign:'center', fontSize:12.5, color:'#64748b', marginTop:10 }}>
            <span onClick={()=>onAuth('forgot')} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>Forgot password?</span>
          </p>}
          <div style={{ display:'flex', alignItems:'center', gap:8, margin:'18px 0' }}>
            <div style={{ flex:1, height:1, background:'var(--border)' }}/><span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>OR</span><div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/>
          </div>
          <div ref={gBtnRef} style={{ display:'flex', justifyContent:'center', marginBottom:10 }}/>
          <p style={{ textAlign:'center', fontSize:11.5, color:'#64748b', marginTop:8 }}>⏱ 60-day free trial · then ₹{role==='teacher'?'100':'100'}/month</p>
        </>}
        {tab==='school'&&(
          <form onSubmit={handleSchool} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ background:'var(--accent-bg)', padding:'10px 14px', borderRadius:10, fontSize:13, color:'var(--accent)', fontWeight:600 }}>🏫 Enter the School Code provided by your administrator.</div>
            <Field label="School Code"><BSInput value={form.schoolCode} onChange={set('schoolCode')} placeholder="e.g. DPS2024"/></Field>
            <Field label={role==='teacher'?'Employee ID':'Roll Number'}><BSInput value={form.identifier} onChange={set('identifier')} placeholder={role==='teacher'?'e.g. TCH001':'e.g. 101'}/></Field>
            <Field label="Password">
              <div style={{ position:'relative' }}>
                <BSInput value={form.password} onChange={set('password')} type={showPw?'text':'password'} placeholder="Your password" style={{ paddingRight:40 }}/>
                <span onClick={()=>setShowPw(p=>!p)} style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', cursor:'pointer', color:'#64748b' }}>{showPw?'🙈':'👁'}</span>
              </div>
            </Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>
              {busy?<><Spinner/> Signing in...</>:`Sign In as ${role==='teacher'?'Teacher':'Student'}`}
            </PrimaryBtn>
          </form>
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FORGOT PASSWORD
// ══════════════════════════════════════════════════════════════
function ForgotPasswordPage({ onBack }) {
  useFonts()
  const [email,setEmail]=useState(''); const [sent,setSent]=useState(false); const [err,setErr]=useState(''); const [busy,setBusy]=useState(false)
  async function handleSubmit(e){ e.preventDefault();setErr('');setBusy(true);try{await api.post('/api/auth/forgot-password',{email});setSent(true)}catch(e){setErr(e.message)}finally{setBusy(false)} }
  return (
    <div style={{ minHeight:'100vh', background:'linear-gradient(135deg,#eef2ff,#f4f4f0)', display:'flex', alignItems:'center', justifyContent:'center', padding:20, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ background:'#ffffff', border:'1px solid rgba(15,23,42,.08)', borderRadius:18, padding:28, maxWidth:400, width:'100%', boxShadow:'0 20px 60px rgba(15,23,42,.12)' }}>
        <div style={{ textAlign:'center', marginBottom:24 }}><div style={{ fontSize:40, marginBottom:8 }}>🔐</div><h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'#1e293b' }}>Reset Password</h2></div>
        {sent?<SuccessMsg msg="Check your inbox for the reset link. It expires in 1 hour."/>:(
          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:12 }}>
            <Field label="Email Address"><BSInput value={email} onChange={setEmail} type="email" placeholder="your@email.com"/></Field>
            <ErrMsg msg={err}/>
            <PrimaryBtn style={{ width:'100%', justifyContent:'center' }} disabled={busy}>{busy?<><Spinner/> Sending...</>:'Send Reset Link'}</PrimaryBtn>
          </form>
        )}
        <p style={{ textAlign:'center', marginTop:16, fontSize:13 }}><span onClick={onBack} style={{ color:'var(--accent)', cursor:'pointer', fontWeight:700 }}>← Back to sign in</span></p>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SUBSCRIPTION PAGE
// ══════════════════════════════════════════════════════════════
function SubscriptionPage({ user, onSuccess, onBack }) {
  const [loading,setLoading]=useState(false); const [err,setErr]=useState('')
  const plans = user?.role==='teacher'
    ? [{id:'teacher_monthly',label:'Monthly',price:'₹150',desc:'₹150/month',months:1},{id:'teacher_yearly',label:'Annual',price:'₹1500',desc:'Save ₹300/year',months:12,popular:true}]
    : [{id:'student_monthly',label:'Monthly',price:'₹130',desc:'₹130/month',months:1},{id:'student_yearly',label:'Annual',price:'₹1200',desc:'Save ₹360/year',months:12,popular:true}]

  // Pre-select the recommended (popular) plan, falling back to the first
  const [selectedId,setSelectedId]=useState(()=>(plans.find(p=>p.popular)||plans[0])?.id)

  async function subscribe(planType) {
    setErr('');setLoading(true)
    try {
      await loadScript('https://checkout.razorpay.com/v1/checkout.js')
      const order = await api.post('/api/subscription/create-order',{planType})
      const rzp = new window.Razorpay({ key:import.meta.env.VITE_RAZORPAY_KEY_ID, amount:order.amount, currency:'INR', name:'BrainSpark AI', description:order.planLabel, order_id:order.orderId, prefill:{name:user.name,email:user.email}, theme:{color:'#6366F1'},
        handler:async({razorpay_payment_id,razorpay_order_id,razorpay_signature})=>{
          try{ await api.post('/api/subscription/verify',{orderId:razorpay_order_id,paymentId:razorpay_payment_id,signature:razorpay_signature,planType}); onSuccess() }
          catch(e){ setErr('Payment verification failed.') }
        },
      })
      rzp.open()
    } catch(e){setErr(e.message)} finally{setLoading(false)}
  }

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:20 }}>← Back</GhostBtn>}
      <div style={{ textAlign:'center', marginBottom:32 }}><div style={{ fontSize:48, marginBottom:8 }}>💎</div><h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>Upgrade BrainSpark AI</h2><p style={{ color:'var(--text)', fontSize:14 }}>Unlimited access to all AI tools</p></div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(240px,1fr))', gap:16, marginBottom:24, maxWidth:700, margin:'0 auto 24px' }}>
        {plans.map(p=>{
          const selected = selectedId===p.id
          return (
            <div key={p.id}
              onClick={()=>setSelectedId(p.id)}
              role="button" tabIndex={0}
              onKeyDown={e=>{ if(e.key==='Enter'||e.key===' '){ e.preventDefault(); setSelectedId(p.id) } }}
              style={{
                ...T.card, position:'relative', textAlign:'center', cursor:'pointer',
                borderColor: selected ? 'var(--accent)' : 'var(--border)',
                borderWidth: selected ? 2 : 1,
                background: selected ? 'var(--accent-bg)' : 'var(--bg2)',
                boxShadow: selected ? '0 0 0 4px var(--accent-bg), 0 8px 24px rgba(99,102,241,.18)' : '0 2px 12px rgba(0,0,0,.12)',
                transform: selected ? 'translateY(-2px)' : 'none',
                transition: 'all .18s ease',
              }}
              onMouseEnter={e=>{ if(!selected) e.currentTarget.style.borderColor='var(--accent-border)' }}
              onMouseLeave={e=>{ if(!selected) e.currentTarget.style.borderColor='var(--border)' }}
            >
              {p.popular&&<div style={{ position:'absolute', top:-13, left:'50%', transform:'translateX(-50%)', background:'var(--accent)', color:'#fff', borderRadius:20, padding:'3px 14px', fontSize:11, fontWeight:800 }}>BEST VALUE</div>}

              {/* selection indicator */}
              <div style={{ position:'absolute', top:12, right:12, width:20, height:20, borderRadius:'50%', border:`2px solid ${selected?'var(--accent)':'var(--border)'}`, background:selected?'var(--accent)':'transparent', display:'flex', alignItems:'center', justifyContent:'center', transition:'all .15s' }}>
                {selected && <span style={{ color:'#fff', fontSize:11, fontWeight:900, lineHeight:1 }}>✓</span>}
              </div>

              <div style={{ fontSize:30, fontWeight:900, color:'var(--accent)', marginBottom:4, fontFamily:"'Sora',sans-serif" }}>{p.price}</div>
              <div style={{ fontSize:13, color:'var(--text)', marginBottom:16 }}>{p.desc}</div>
              <div style={{ fontSize:12.5, fontWeight:700, color:selected?'var(--accent)':'var(--text)' }}>
                {selected ? '✓ Selected' : 'Tap to select'}
              </div>
            </div>
          )
        })}
      </div>

      {/* Single subscribe button acts on the selected plan */}
      <div style={{ maxWidth:700, margin:'0 auto' }}>
  <PrimaryBtn onClick={()=>subscribe(selectedId)} disabled={loading||!selectedId} gradient="linear-gradient(135deg,#4f46e5,#8B5CF6)" style={{ width:'100%', justifyContent:'center', fontSize:15 }}>
    {loading ? <><Spinner/> Processing…</> : `Continue with ${plans.find(p=>p.id===selectedId)?.label||''} — ${plans.find(p=>p.id===selectedId)?.price||''}`}
  </PrimaryBtn>
</div>
      <ErrMsg msg={err}/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
function Dashboard({ user, onNavigate, onOpenChapter }) {
  const [stats,setStats]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('bs_dash_stats')) }catch{ return null } })
  const [achs,setAchs]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('bs_dash_achs'))||[] }catch{ return [] } })
  const [chapterGroups, setChapterGroups] = useState([])
  useEffect(()=>{
    api.get('/api/user/stats').then(s=>{ setStats(s); try{localStorage.setItem('bs_dash_stats',JSON.stringify(s))}catch{} }).catch(()=>{})
    api.get('/api/user/achievements').then(a=>{ setAchs(a); try{localStorage.setItem('bs_dash_achs',JSON.stringify(a))}catch{} }).catch(()=>{})
    setChapterGroups(groupSessionsIntoChapters())
  },[])
  const xp=stats?.stats?.total_xp||0; const level=getLevel(xp); const nextLevel=getNextLevel(xp)
  const pct=nextLevel?Math.round(((xp-level.min)/(nextLevel.min-level.min))*100):100
  const streak=stats?.stats?.current_streak||0; const unlocked=achs.filter(a=>a.unlocked).slice(0,3)
  const hour=new Date().getHours(); const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'

  const cls = user.class_level || 'Class 10'
  const starterSubjects = getSubjectsForClass(cls).slice(0, 4)
  const starters = starterSubjects
    .map(subj => ({ subject: subj, cls, chapter: getChapters(subj, cls)[0] }))
    .filter(s => s.chapter)

  const quickStart = [
    {icon:'🤔',label:'Ask a Doubt',    tab:'doubt',      color:'#818CF8', desc:'Step-by-step answers'},
    {icon:'📖',label:'Generate Notes', tab:'notes',      color:'#10B981', desc:'Chapter-wise notes'},
    {icon:'🎯',label:'Take a Quiz',    tab:'quiz',       color:'#F59E0B', desc:'Timed MCQ practice'},
    {icon:'🃏',label:'Flashcards',     tab:'flashcards', color:'#EF4444', desc:'Quick revision cards'},
    {icon:'📚',label:'Youtube-Courses',tab:'courses',    color:'#8B5CF6', desc:'Video-based lessons'},
    {icon:'🕘',label:'My History',     tab:'history',    color:'#6366F1', desc:'Replay past sessions'},
    {icon:'📣',label:'Study Feed',     tab:'feed',       color:'#6366F1', desc:'Share & ask peers'},
  ]
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div>
          <h2 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', fontSize:'clamp(1.1rem,2.5vw,1.5rem)' }}>{greeting}, {user.name.split(' ')[0]}! {level.emoji}</h2>
          <p style={{ margin:'4px 0 0', color:'var(--text)', fontSize:13 }}>{new Date().toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long'})}</p>
        </div>
        <div style={{ background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:20, padding:'6px 16px', display:'inline-flex', alignItems:'center', gap:6 }}>
          <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
        </div>
      </div>

      <div className="bs-stats-grid" style={{ marginBottom: 22 }}>
        {[{label:'Total XP',value:xp.toLocaleString(),icon:'⚡',bg:'rgba(99,102,241,.15)',color:'#818CF8'},{label:'Streak',value:`${streak}d`,icon:'🔥',bg:'rgba(249,115,22,.15)',color:'#FB923C'},{label:'Doubts',value:stats?.stats?.doubts_solved||0,icon:'🤔',bg:'rgba(16,185,129,.15)',color:'#34D399'},{label:'Quizzes',value:stats?.stats?.quizzes_done||0,icon:'🎯',bg:'rgba(139,92,246,.15)',color:'#A78BFA'},{label:'Notes',value:stats?.stats?.notes_made||0,icon:'📖',bg:'rgba(239,68,68,.15)',color:'#FCA5A5'},{label:'Papers',value:stats?.stats?.papers_made||0,icon:'📄',bg:'rgba(245,158,11,.15)',color:'#FCD34D'}].map(stat=>(
          <div key={stat.label} style={{ background:stat.bg, borderRadius:14, padding:'14px 12px', textAlign:'center', border:'1px solid rgba(255,255,255,.05)' }}>
            <div style={{ fontSize:24, marginBottom:4 }}>{stat.icon}</div>
            <div style={{ fontSize:20, fontWeight:900, color:stat.color, fontFamily:"'Sora',sans-serif" }}>{stat.value}</div>
            <div style={{ fontSize:11, color:'var(--text)', marginTop:2, fontWeight:600 }}>{stat.label}</div>
          </div>
        ))}
      </div>
      <Card style={{ marginBottom:20, background:'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)', border:'none' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
          <div>
            <span style={{ fontWeight:900, color:'#fff', fontSize:18, fontFamily:"'Sora',sans-serif" }}>{level.emoji} {level.label}</span>
            {nextLevel&&<span style={{ color:'rgba(255,255,255,.75)', fontSize:12.5, marginLeft:10 }}>→ {nextLevel.emoji} {nextLevel.label} at {nextLevel.min.toLocaleString()} XP</span>}
          </div>
          <span style={{ fontSize:24, fontWeight:900, color:'#fff', fontFamily:"'Sora',sans-serif" }}>{xp.toLocaleString()} XP</span>
        </div>
        <div style={{ background:'rgba(255,255,255,.25)', borderRadius:999, height:8 }}><div style={{ background:'#fff', width:`${pct}%`, height:'100%', borderRadius:999, transition:'width 1s ease' }}/></div>
        {nextLevel&&<p style={{ fontSize:12, color:'rgba(255,255,255,.75)', margin:'8px 0 0', textAlign:'right' }}>{(nextLevel.min-xp).toLocaleString()} XP to {nextLevel.label}</p>}
      </Card>

      {/* ── Continue / Start Learning: chapter hub cards ── */}
      <div style={{ marginBottom:26 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <h3 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)' }}>
            {chapterGroups.length ? '📚 Continue Learning' : '📚 Start Learning'}
          </h3>
          {chapterGroups.length > 0 && <GhostBtn small onClick={()=>onNavigate('history')}>View All →</GhostBtn>}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:14 }}>
          {chapterGroups.length > 0
            ? chapterGroups.slice(0,4).map((g,i) => <ChapterCard key={g.key} group={g} index={i} onOpen={onOpenChapter} />)
            : starters.map((s,i) => <StarterChapterCard key={s.subject} {...s} index={i} onStart={p => onNavigate('notes', p)} />)
          }
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))', gap:16 }}>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>⚡ Quick Start</h3>
          {quickStart.map(item=>(
  <button key={item.tab} onClick={()=>onNavigate(item.tab)} style={{ width:'100%', display:'flex', alignItems:'center', gap:12, padding:'10px 14px', borderRadius:10, border:'1px solid var(--border)', background:'var(--code-bg)', color:'var(--text-h)', cursor:'pointer', marginBottom:9, fontFamily:"'Nunito',sans-serif", transition:'all .15s', textAlign:'left' }}
    onMouseEnter={e=>{e.currentTarget.style.background='var(--accent-bg)';e.currentTarget.style.borderColor='var(--accent)'}}
    onMouseLeave={e=>{e.currentTarget.style.background='var(--code-bg)';e.currentTarget.style.borderColor='var(--border)'}}>
    <span style={{ fontSize:20, flexShrink:0 }}>{item.icon}</span>
    <span style={{ flex:1, minWidth:0 }}>
      <span style={{ display:'block', fontSize:14, fontWeight:600 }}>{item.label}</span>
      <span style={{ display:'block', fontSize:11.5, color:'var(--text)', fontWeight:500, marginTop:1 }}>{item.desc}</span>
    </span>
    <span style={{ fontSize:16, color:'var(--text)', flexShrink:0 }}>→</span>
  </button>
))}
        </Card>
        <Card>
          <h3 style={{ margin:'0 0 14px', fontSize:15, fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)' }}>🏆 Recent Achievements</h3>
          {unlocked.length===0?<p style={{ color:'var(--text)', fontSize:13 }}>Complete activities to unlock achievements!</p>:unlocked.map(a=>(
            <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:24 }}>{a.emoji}</span>
              <div style={{ flex:1 }}><div style={{ fontWeight:700, fontSize:13.5, color:'var(--text-h)' }}>{a.name}</div><div style={{ fontSize:12, color:'var(--text)' }}>{a.description}</div></div>
            </div>
          ))}
        </Card>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SOCIAL FEED (no stories, with media upload)
// ══════════════════════════════════════════════════════════════
const SEED_POSTS = [
  // {id:'sp1',uid:'u1',uname:'Priya Sharma',ucls:'Class 10',subj:'Mathematics',body:"Just cracked quadratic equations! 🎉 Key tip: check the discriminant first. b²-4ac ≥ 0 means real roots exist.",likes:24,rich_comments:[],tags:['Maths','ExamTip'],created_at:new Date(Date.now()-3600000).toISOString(),anon:false,grad:'135deg,#6366F1,#8B5CF6'},
  // {id:'sp2',uid:'u2',uname:'Anonymous Student',ucls:'Class 11',subj:'Physics',body:'Struggling with thermodynamics 😫 Can someone explain isothermal vs adiabatic processes?',likes:8,rich_comments:[{id:'c1',author_name:'Helpful Student',text:'Isothermal = constant temp, Adiabatic = no heat exchange!',created_at:new Date(Date.now()-1800000).toISOString()}],tags:['Physics','Help'],created_at:new Date(Date.now()-7200000).toISOString(),anon:true,grad:'135deg,#374151,#1f2937'},
  // {id:'sp3',uid:'u3',uname:'Arjun Mehta',ucls:'Class 12',subj:'Chemistry',body:'🏆 WON 2nd place in District Chemistry Olympiad!! Months of hard work paid off!',likes:67,rich_comments:[],tags:['Achievement'],created_at:new Date(Date.now()-18000000).toISOString(),anon:false,grad:'135deg,#f59e0b,#ef4444'},
]

function SocialFeed({ user }) {
  const [posts, setPosts] = useState(SEED_POSTS);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState({ body: '', subj: 'Mathematics', tags: '', anon: false, media_url: null, media_type: null });
  const [posting, setPosting] = useState(false);
  const [openCmt, setOpenCmt] = useState(null);
  const [cmtText, setCmtText] = useState('');
  const [cmtMedia, setCmtMedia] = useState(null);
  const [liked, setLiked] = useState(new Set());
  const [err, setErr] = useState('');
 
  useEffect(() => {
    api.get('/api/posts').then(data => {
      if (data?.length) {
        const ids = new Set(SEED_POSTS.map(p => p.id));
        const merged = [...SEED_POSTS, ...data.filter(p => !ids.has(p.id))];
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setPosts(merged);
      }
    }).catch(() => {});
  }, []);
 
  const submitPost = async () => {
    if (!draft.body.trim() && !draft.media_url) return;
    setPosting(true);
    setErr('');
    try {
      const post = await api.post('/api/posts', {
        body: draft.body.trim(),
        subj: draft.subj,
        tags: draft.tags.split(',').map(t => t.trim()).filter(Boolean),
        anon: draft.anon,
        grad: draft.anon ? '135deg,#374151,#1f2937' : GRADS[Math.floor(Math.random() * GRADS.length)],
        media_url: draft.media_url,
        media_type: draft.media_type,
      });
      setPosts(p => [post, ...p]);
      setDraft({ body: '', subj: 'Mathematics', tags: '', anon: false, media_url: null, media_type: null });
      setComposing(false);
    } catch (e) {
      setErr(e.message);
    }
    setPosting(false);
  };
 
  const likePost = async id => {
    if (liked.has(id)) return;
    setLiked(p => new Set([...p, id]));
    setPosts(p => p.map(x => x.id === id ? { ...x, likes: (x.likes || 0) + 1 } : x));
    api.patch(`/api/posts/${id}/like`).catch(() => {});
  };
 
  const addComment = async id => {
    if (!cmtText.trim() && !cmtMedia) return;
    const cmt = {
      id: Date.now(),
      author_name: user.name,
      text: cmtText.trim(),
      media_url: cmtMedia?.url,
      media_type: cmtMedia?.type,
      created_at: new Date().toISOString(),
    };
    setPosts(p => p.map(x => x.id === id ? { ...x, rich_comments: [...(x.rich_comments || []), cmt] } : x));
    setCmtText('');
    setCmtMedia(null);
    api.post(`/api/posts/${id}/comment`, { text: cmtText.trim(), media_url: cmtMedia?.url, media_type: cmtMedia?.type }).catch(() => {});
  };
 
  return (
    <div style={{
      padding: 24,
      width: '100%',
      boxSizing: 'border-box',
      fontFamily: "'Nunito',sans-serif",
      height: 'calc(100vh - 58px)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <PageHeader icon="📣" title="Study Feed" subtitle="Share achievements, ask questions, post study stories" color="#6366F1" />
 
      {/* Compose */}
      {!composing ? (
        <div style={{ ...T.card, marginBottom: 12, display: 'flex', gap: 10, alignItems: 'center', cursor: 'text', padding: '12px 15px' }} onClick={() => setComposing(true)}>
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(${GRADS[0]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{user.name[0].toUpperCase()}</div>
          <div style={{ flex: 1, padding: '8px 13px', borderRadius: 22, background: 'var(--code-bg)', border: '1px solid var(--border)', fontSize: 13, color: 'var(--text)' }}>What's on your study mind, {user.name.split(' ')[0]}? ✨</div>
        </div>
      ) : (
        <div style={{ ...T.card, marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 11 }}>
            <div style={{ display: 'flex', gap: 9, alignItems: 'center' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(${draft.anon ? '135deg,#374151,#1f2937' : GRADS[0]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff' }}>{draft.anon ? '?' : user.name[0].toUpperCase()}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-h)' }}>{draft.anon ? 'Anonymous Student' : user.name}</div>
            </div>
            <button onClick={() => setComposing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 18 }}>×</button>
          </div>
          <BSTextarea value={draft.body} onChange={v => setDraft(d => ({ ...d, body: v }))} placeholder="Share achievements, study tips, questions..." rows={3} style={{ marginBottom: 8 }} />
          {draft.media_url && (
            <div style={{ marginBottom: 8 }}>
              {draft.media_type === 'image'
                ? <img src={draft.media_url} style={{ maxWidth: '100%', maxHeight: 180, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} alt="" />
                : <div style={{ padding: '6px 12px', background: 'var(--accent-bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--accent)', display: 'inline-flex', gap: 6 }}>📄 PDF attached <span onClick={() => setDraft(d => ({ ...d, media_url: null, media_type: null }))} style={{ cursor: 'pointer' }}>✕</span></div>
              }
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 11 }}>
            <div><Label>Subject</Label><BSSelect value={draft.subj} onChange={v => setDraft(d => ({ ...d, subj: v }))} options={SUBJECTS} /></div>
            <div><Label>Tags</Label><BSInput value={draft.tags} onChange={v => setDraft(d => ({ ...d, tags: v }))} placeholder="Comma separated" /></div>
          </div>
          {err && <ErrMsg msg={err} />}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <MediaUploader accept="image/*" label="📷 Photo" small onUpload={(url, type) => setDraft(d => ({ ...d, media_url: url, media_type: type }))} onClear={() => setDraft(d => ({ ...d, media_url: null, media_type: null }))} current={null} />
              <label style={{ display: 'flex', alignItems: 'center', gap: 7, cursor: 'pointer', fontSize: 13, color: draft.anon ? 'var(--accent)' : 'var(--text)', fontWeight: 700 }}>
                <input type="checkbox" checked={draft.anon} onChange={e => setDraft(d => ({ ...d, anon: e.target.checked }))} style={{ accentColor: 'var(--accent)' }} />
                👻 Anon
              </label>
            </div>
            <PrimaryBtn onClick={submitPost} disabled={posting || (!draft.body.trim() && !draft.media_url)} small>{posting ? <Spinner size={12} /> : 'Post ✦'}</PrimaryBtn>
          </div>
        </div>
      )}
 
      {/* FIX 1 & 2: posts scrollable container — overflow lives here, not on outer div */}
      {/* FIX 3: post card JSX is inside the .map() so `post` is in scope */}
      <div style={{ flex: 1, overflowY: 'auto', marginTop: 8 }}>
        {posts.map(post => (
          <div key={post.id} style={{ ...T.card, marginBottom: 11 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(${post.grad || GRADS[0]})`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15, fontWeight: 900, color: '#fff', flexShrink: 0 }}>{post.uname[0].toUpperCase()}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-h)' }}>{post.uname}</span>
                  {post.anon && <span style={{ background: 'rgba(100,116,139,.1)', color: '#94a3b8', border: '1px solid rgba(100,116,139,.2)', borderRadius: 20, padding: '1px 7px', fontSize: 10, fontWeight: 700 }}>👻 anon</span>}
                  <span style={{ fontSize: 10.5, color: 'var(--text)' }}>· {timeAgo(post.created_at)}</span>
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text)' }}>{post.ucls} · {post.subj}</div>
              </div>
            </div>
            {post.body && <p style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.72, marginBottom: post.media_url ? 8 : 10 }}>{post.body}</p>}
            {post.media_url && post.media_type === 'image' && <img src={post.media_url} style={{ width: '100%', borderRadius: 10, marginBottom: 10, maxHeight: 500, objectFit: 'contain', background: 'var(--code-bg)' }} alt="" />}
            {(post.tags || []).length > 0 && (
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginBottom: 10 }}>
                {post.tags.map((t, i) => <span key={i} style={{ fontSize: 11.5, color: 'var(--accent)', background: 'var(--accent-bg)', padding: '2px 8px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>#{t}</span>)}
              </div>
            )}
            <div style={{ display: 'flex', gap: 7, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
              <GhostBtn small onClick={() => likePost(post.id)} style={{ color: liked.has(post.id) ? '#ef4444' : 'var(--text-h)' }}>{liked.has(post.id) ? '❤️' : '🤍'} {(post.likes || 0)}</GhostBtn>
              <GhostBtn small onClick={() => setOpenCmt(openCmt === post.id ? null : post.id)}>💬 {(post.rich_comments || []).length}</GhostBtn>
            </div>
            {openCmt === post.id && (
              <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px solid var(--border)' }}>
                {(post.rich_comments || []).map((c, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'var(--accent)', flexShrink: 0 }}>{c.author_name?.[0] || '?'}</div>
                    <div style={{ flex: 1, background: 'var(--code-bg)', borderRadius: '4px 12px 12px 12px', padding: '8px 12px', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--accent)', marginBottom: 3 }}>{c.author_name}</div>
                      {c.text && <div style={{ fontSize: 13, color: 'var(--text-h)', lineHeight: 1.5 }}>{c.text}</div>}
                      {c.media_url && c.media_type === 'image' && <img src={c.media_url} style={{ maxWidth: '100%', maxHeight: 120, borderRadius: 6, marginTop: 4 }} alt="" />}
                    </div>
                  </div>
                ))}
                {cmtMedia?.url && (
                  <div style={{ marginBottom: 6 }}>
                    {cmtMedia.type === 'image'
                      ? <img src={cmtMedia.url} style={{ height: 48, borderRadius: 6 }} alt="" />
                      : <div style={{ padding: '3px 8px', background: 'var(--accent-bg)', borderRadius: 6, fontSize: 11.5, color: 'var(--accent)', display: 'inline-flex', gap: 5 }}>📄 <span onClick={() => setCmtMedia(null)} style={{ cursor: 'pointer' }}>✕</span></div>
                    }
                  </div>
                )}
                <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                  <MediaUploader accept="image/*" label="📷" small onUpload={(url, type) => setCmtMedia({ url, type })} onClear={() => setCmtMedia(null)} current={null} />
                  <input value={cmtText} onChange={e => setCmtText(e.target.value)} onKeyDown={e => e.key === 'Enter' && addComment(post.id)} placeholder="Add a comment…" style={{ flex: 1, ...T.input, fontSize: 13 }} />
                  <PrimaryBtn small onClick={() => addComment(post.id)} disabled={!cmtText.trim() && !cmtMedia}>↑</PrimaryBtn>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  SEARCH PAGE
// ══════════════════════════════════════════════════════════════
function SearchPage({ currentUser, onViewProfile, onMessage }) {
  const isStudent = currentUser?.role === 'student'

  const [q,       setQ]       = useState('')
  const [role,    setRole]    = useState(isStudent ? 'teacher' : 'all') // students look for teachers by default
  const [subject, setSubject] = useState('')
  const [cls,     setCls]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  // Fetch whenever any filter changes. With role=teacher and no name, this
  // lists ALL teachers ranked by XP (per your requirement).
  useEffect(() => {
    const anyFilter = q.trim().length >= 1 || subject || cls || role !== 'all'
    if (!anyFilter) { setResults([]); return }
    setLoading(true)
    const t = setTimeout(() => {
      const params = new URLSearchParams()
      if (q.trim()) params.set('q', q.trim())
      if (role !== 'all') params.set('role', role)
      if (subject) params.set('subject', subject)
      if (cls)     params.set('classLevel', cls)
      api.get(`/api/search?${params.toString()}`)
        .then(d => { setResults(d); setLoading(false) })
        .catch(() => setLoading(false))
    }, 300)
    return () => clearTimeout(t)
  }, [q, role, subject, cls])

  const roleTabs = [['teacher', '👨‍🏫 Teachers'], ['student', '🎒 Students'], ['all', 'Everyone']]

  return (
    <div style={{ padding: 24, maxWidth: 720, margin: '0 auto', fontFamily: "'Nunito',sans-serif" }}>
      <PageHeader icon="🔍" title="Find People" subtitle={isStudent ? 'Find teachers by class & subject to ask your doubts' : 'Search students and teachers'} color="#06b6d4" />

      {/* Role tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {roleTabs.map(([r, l]) => (
          <button key={r} onClick={() => setRole(r)} style={{
            padding: '6px 16px', borderRadius: 20, border: 'none', fontWeight: 700, fontSize: 12.5,
            cursor: 'pointer', fontFamily: "'Nunito',sans-serif",
            background: role === r ? '#06b6d4' : 'var(--social-bg)', color: role === r ? '#fff' : 'var(--text-h)', transition: 'all .15s',
          }}>{l}</button>
        ))}
      </div>

      {/* Name search */}
      <div style={{ position: 'relative', marginBottom: 12 }}>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search by name (optional)..." style={{ ...T.input, paddingLeft: 44, fontSize: 15 }} />
        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 18, opacity: .5 }}>🔍</span>
      </div>

      {/* Subject + Class filters (most useful when role = Teachers) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
        <div>
          <Label>Subject</Label>
          <BSSelect value={subject} onChange={setSubject} options={[{ value: '', label: 'Any subject' }, ...SUBJECTS.map(s => ({ value: s, label: s }))]} />
        </div>
        <div>
          <Label>Class</Label>
          <BSSelect value={cls} onChange={setCls} options={[{ value: '', label: 'Any class' }, ...CLASSES.map(c => ({ value: c, label: c }))]} />
        </div>
      </div>
      {(subject || cls) && (
        <div style={{ marginBottom: 16 }}>
          <GhostBtn small onClick={() => { setSubject(''); setCls('') }}>✕ Clear filters</GhostBtn>
        </div>
      )}

      {loading && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text)' }}>Searching...</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {results.map((u, i) => {
          const canMsg = canMessageUser(currentUser, u)
          return (
            <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--bg2)', borderRadius: 12, border: '1px solid var(--border)', transition: 'border-color .2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

              {/* rank chip when ranked by XP */}
              {role === 'teacher' && (
                <div style={{ width: 26, textAlign: 'center', fontSize: 12, fontWeight: 800, color: i < 3 ? '#FCD34D' : 'var(--text)', flexShrink: 0 }}>
                  {i < 3 ? ['🥇', '🥈', '🥉'][i] : `#${i + 1}`}
                </div>
              )}

              <div onClick={() => onViewProfile?.(u.id)} style={{ cursor: 'pointer', flexShrink: 0 }}>
                <Avatar name={u.name} url={u.avatar_url} size={44} />
              </div>

              <div onClick={() => onViewProfile?.(u.id)} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: 14 }}>{u.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text)' }}>
                  {u.role === 'teacher' ? '👨‍🏫 Teacher' : `🎒 ${u.class_level || 'Student'}`}
                  {' · '}⚡ {(u.total_xp || 0).toLocaleString()} XP
                </div>
                {/* Teacher subjects/classes preview */}
                {u.role === 'teacher' && (u.teaches_subjects?.length || u.teaches_classes?.length) ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
                    {(u.teaches_subjects || []).slice(0, 3).map(s => <span key={s} style={{ fontSize: 10.5, background: 'var(--accent-bg)', color: 'var(--accent)', borderRadius: 12, padding: '1px 8px', fontWeight: 700 }}>{s}</span>)}
                    {(u.teaches_classes || []).slice(0, 2).map(c => <span key={c} style={{ fontSize: 10.5, background: 'rgba(16,185,129,.1)', color: '#6ee7b7', borderRadius: 12, padding: '1px 8px', fontWeight: 700 }}>{c}</span>)}
                  </div>
                ) : null}
              </div>

              {canMsg && onMessage && (
                <PrimaryBtn small onClick={() => onMessage(u.id)} color="#06b6d4">💬 Ask</PrimaryBtn>
              )}
              <span onClick={() => onViewProfile?.(u.id)} style={{ fontSize: 14, color: 'var(--text)', cursor: 'pointer', flexShrink: 0 }}>→</span>
            </div>
          )
        })}
      </div>

      {!loading && results.length === 0 && (q.length >= 1 || subject || cls || role !== 'all') && (
        <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)' }}>No {role === 'all' ? 'people' : role + 's'} found{subject ? ` for ${subject}` : ''}{cls ? ` in ${cls}` : ''}.</div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  PROFILE PAGE (LinkedIn-style)
// ══════════════════════════════════════════════════════════════
function ProfilePage({ userId, currentUser, onMessage, onBack }) {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [form,     setForm]     = useState({})
  const [saving,   setSaving]   = useState(false)
  const [ok,       setOk]       = useState(false)
  const [err,      setErr]      = useState('')

  const isOwn     = !userId || userId === currentUser?.id
  const targetId  = userId || currentUser?.id

  useEffect(() => {
    if (!targetId) return
    setLoading(true); setEditMode(false)
    api.get(`/api/profiles/${targetId}`)
      .then(d => {
        setData(d)
        setForm({ ...(d.profile || {}), class_level: d.user?.class_level || '' })
        setLoading(false)
      })
      .catch(e => { setErr(e.message); setLoading(false) })
  }, [targetId])

  const setF = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const save = async () => {
    setSaving(true); setOk(false); setErr('')
    try {
      await api.put('/api/profiles/me', {
        headline: form.headline, about: form.about, location: form.location,
        website_url: form.website_url, skills: form.skills || [], languages: form.languages || [],
        hobbies: form.hobbies || [], banner_url: form.banner_url,
        teaches_subjects: form.teaches_subjects || [], teaches_classes: form.teaches_classes || [],
        favourite_chapter: form.favourite_chapter, favourite_subject: form.favourite_subject,
        favourite_hobby: form.favourite_hobby, institution: form.institution,
      })
      // Class lives on the users table — only personal users edit it (school sets it).
      if (isOwn && currentUser?.type !== 'school') {
        await api.put('/api/user/profile', { classLevel: form.class_level })
      }
      setData(d => ({
        ...d,
        profile: { ...d.profile, ...form },
        user:    { ...d.user, class_level: form.class_level ?? d.user.class_level },
      }))
      setOk(true)
      setTimeout(() => { setEditMode(false); setOk(false) }, 1300)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  const onAvatarUpload = async url => {
    try { await api.put('/api/user/avatar', { avatar_url: url }); setData(d => ({ ...d, user: { ...d.user, avatar_url: url } })) }
    catch (e) { setErr(e.message) }
  }

  if (loading) return <PageSpinner />
  if (!data)   return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text)' }}>{err || 'Profile not found'}</div>

  const { user, profile: prof, stats, rank } = data
  const isTeacher  = user?.role === 'teacher'
  const schoolName = user?.schools?.name || prof.institution || (isOwn && currentUser?.schools?.name) || ''
  const canMsg     = !isOwn && canMessageUser(currentUser, user)

  // chapters for the "favourite chapter" datalist (teacher)
  const favChapterOptions = (() => {
    const subj = (form.teaches_subjects || [])[0]
    const cls  = (form.teaches_classes  || [])[0]
    return subj && cls ? getChapters(subj, cls) : []
  })()

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito',sans-serif", maxWidth: 780, margin: '0 auto' }}>

      {onBack && <GhostBtn small onClick={onBack} style={{ marginBottom: 16 }}>← Back</GhostBtn>}

      {/* ── Banner / cover photo ─────────────────────────────── */}
      <div style={{
        borderRadius: 14, overflow: 'hidden', position: 'relative', height: 150,
        background: form.banner_url ? `url(${form.banner_url}) center/cover` : 'linear-gradient(135deg,#4338ca,#6366F1,#8B5CF6)',
      }}>
        {isOwn && editMode && (
          <div style={{ position: 'absolute', right: 12, bottom: 12 }}>
            <MediaUploader accept="image/*" label="📷 Change cover" small current={null}
              onUpload={url => setF('banner_url', url)} onClear={() => setF('banner_url', null)} />
          </div>
        )}
      </div>

      {/* ── Avatar + actions ─────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -40, paddingInline: 20, marginBottom: 20, position: 'relative', zIndex: 2 }}>
        <div style={{ position: 'relative' }}>
          <Avatar name={user?.name} url={user?.avatar_url} size={78} fontSize={30} />
          {isOwn && editMode && (
            <div style={{ position: 'absolute', bottom: -4, right: -4 }}>
              <MediaUploader accept="image/*" label="📷" small current={null}
                onUpload={onAvatarUpload} onClear={() => {}} />
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
          {canMsg && onMessage && <PrimaryBtn small onClick={() => onMessage(user.id)}>💬 Message</PrimaryBtn>}
          {!isOwn && !canMsg && currentUser?.role === 'student' && user?.role === 'student' &&
            <span style={{ fontSize: 12, color: 'var(--text)', alignSelf: 'center' }}>🔒 Students can't message each other</span>}
          {isOwn && !editMode && <PrimaryBtn small onClick={() => setEditMode(true)}>✏️ Edit Profile</PrimaryBtn>}
          {isOwn && editMode && <>
            <PrimaryBtn small onClick={save} disabled={saving}>{saving ? <><Spinner size={12} /> Saving...</> : '💾 Save'}</PrimaryBtn>
            <GhostBtn small onClick={() => { setEditMode(false); setForm({ ...(data.profile || {}), class_level: data.user?.class_level || '' }) }}>Cancel</GhostBtn>
          </>}
        </div>
      </div>

      {ok  && <SuccessMsg msg="Profile saved successfully!" />}
      {err && <ErrMsg msg={err} />}

      {/* ── Name + headline + badges ─────────────────────────── */}
      <Card style={{ marginBottom: 14 }}>
        <h2 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, color: 'var(--text-h)', margin: '0 0 6px', fontSize: 22 }}>{user?.name}</h2>
        {editMode ? (
          <input value={form.headline || ''} onChange={e => setF('headline', e.target.value)}
            placeholder={isTeacher ? "Headline — e.g. 'Physics teacher | JEE mentor'" : "Headline — e.g. 'Class 10 student | loves coding'"}
            style={{ ...T.input, marginBottom: 10 }} />
        ) : (
          <p style={{ color: 'var(--text)', fontSize: 14, margin: '0 0 12px', lineHeight: 1.5 }}>
            {prof.headline || `${isTeacher ? '👨‍🏫 Teacher' : '🎒 Student'}${user?.class_level ? ` · ${user.class_level}` : ''}`}
          </p>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <span style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>
            {isTeacher ? '👨‍🏫 Teacher' : `🎒 ${user?.class_level || 'Student'}`}
          </span>
          {rank?.rank && <span style={{ background: 'rgba(245,158,11,.1)', color: '#FCD34D', border: '1px solid rgba(245,158,11,.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>🏆 Ranked #{rank.rank} of {rank.total_users?.toLocaleString()}</span>}
          <span style={{ background: 'rgba(99,102,241,.1)', color: '#818CF8', border: '1px solid rgba(99,102,241,.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>⚡ {(stats?.total_xp || 0).toLocaleString()} XP</span>
          {schoolName && <span style={{ background: 'rgba(16,185,129,.1)', color: '#6ee7b7', border: '1px solid rgba(16,185,129,.2)', borderRadius: 20, padding: '3px 12px', fontSize: 12, fontWeight: 700 }}>🏫 {schoolName}</span>}
        </div>
      </Card>

      {/* ── Stats row ────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
        {[['🔥', stats?.current_streak || 0, 'Day Streak'], ['🤔', stats?.doubts_solved || 0, 'Doubts'], ['🎯', stats?.quizzes_done || 0, 'Quizzes'], ['📖', stats?.notes_made || 0, 'Notes']].map(([e, v, l]) => (
          <div key={l} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
            <div style={{ fontSize: 20, marginBottom: 3 }}>{e}</div>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 900, fontSize: 18, color: 'var(--accent)' }}>{v}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text)' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* ════════ TEACHER-SPECIFIC SECTION ════════ */}
      {isTeacher && (
        <Card style={{ marginBottom: 14 }}>
          <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: 'var(--text-h)', margin: '0 0 12px', fontSize: 15 }}>Teaching</h4>

          {/* Subjects taught */}
          <div style={{ marginBottom: 14 }}>
            <Label>Subjects taught</Label>
            {editMode
  ? <MultiSelectDropdown options={SUBJECTS} selected={form.teaches_subjects || []} onChange={v => setF('teaches_subjects', v)} placeholder="Select subjects" />
  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(prof.teaches_subjects || []).map(s => <span key={s} style={pillRO}>{s}</span>)}
      {!(prof.teaches_subjects || []).length && <span style={emptyRO}>No subjects listed</span>}
    </div>}
          </div>

          {/* Classes taught */}
          <div style={{ marginBottom: 14 }}>
            <Label>Classes taught</Label>
            {editMode
  ? <MultiSelectDropdown options={CLASSES} selected={form.teaches_classes || []} onChange={v => setF('teaches_classes', v)} placeholder="── Select classes ──" color="#10B981" />
  : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {(prof.teaches_classes || []).map(c => <span key={c} style={{ ...pillRO, background: 'rgba(16,185,129,.1)', color: '#6ee7b7', borderColor: 'rgba(16,185,129,.25)' }}>{c}</span>)}
      {!(prof.teaches_classes || []).length && <span style={emptyRO}>No classes listed</span>}
    </div>}
          </div>

          {/* Favourite chapter */}
          <div style={{ marginBottom: 14 }}>
            <Label>Favourite chapter</Label>
            {editMode ? <>
              <input list="fav-chapters" value={form.favourite_chapter || ''} onChange={e => setF('favourite_chapter', e.target.value)} placeholder="e.g. Gravitation" style={{ ...T.input }} />
              <datalist id="fav-chapters">{favChapterOptions.map(c => <option key={c} value={c} />)}</datalist>
            </> : <p style={prof.favourite_chapter ? valueRO : emptyRO}>{prof.favourite_chapter || 'Not set'}</p>}
          </div>

          {/* Interests outside academics */}
          <div>
            <Label>Interests outside academics</Label>
            {editMode
              ? <input value={(form.hobbies || []).join(', ')} onChange={e => setF('hobbies', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. Cricket, Gardening, Travel" style={{ ...T.input }} />
              : <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {(prof.hobbies || []).map((h, i) => <span key={i} style={pillNeutral}>{h}</span>)}
                  {!(prof.hobbies || []).length && <span style={emptyRO}>None listed</span>}
                </div>}
          </div>
        </Card>
      )}

      {/* ════════ STUDENT-SPECIFIC SECTION ════════ */}
      {!isTeacher && (
        <Card style={{ marginBottom: 14 }}>
          <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: 'var(--text-h)', margin: '0 0 12px', fontSize: 15 }}>Student Details</h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 14 }}>
            {/* Class — editable only for personal users */}
            <div>
              <Label>Class studying in</Label>
              {editMode && currentUser?.type !== 'school'
                ? <BSSelect value={form.class_level || ''} onChange={v => setF('class_level', v)} options={[{ value: '', label: '-- Select --' }, ...CLASSES.map(c => ({ value: c, label: c }))]} />
                : <p style={user?.class_level ? valueRO : emptyRO}>{user?.class_level || 'Not set'}</p>}
            </div>
            {/* School / institution */}
            <div>
              <Label>School</Label>
              {editMode && currentUser?.type !== 'school'
                ? <input value={form.institution || ''} onChange={e => setF('institution', e.target.value)} placeholder="Your school name" style={{ ...T.input }} />
                : <p style={schoolName ? valueRO : emptyRO}>{schoolName || 'Not set'}</p>}
            </div>
            {/* Favourite subject */}
            <div>
              <Label>Favourite subject</Label>
              {editMode
                ? <BSSelect value={form.favourite_subject || ''} onChange={v => setF('favourite_subject', v)} options={[{ value: '', label: '-- Select --' }, ...SUBJECTS.map(s => ({ value: s, label: s }))]} />
                : <p style={prof.favourite_subject ? valueRO : emptyRO}>{prof.favourite_subject || 'Not set'}</p>}
            </div>
            {/* Favourite hobby */}
            <div>
              <Label>Favourite hobby (outside academics)</Label>
              {editMode
                ? <input value={form.favourite_hobby || ''} onChange={e => setF('favourite_hobby', e.target.value)} placeholder="e.g. Football, Painting" style={{ ...T.input }} />
                : <p style={prof.favourite_hobby ? valueRO : emptyRO}>{prof.favourite_hobby || 'Not set'}</p>}
            </div>
          </div>
        </Card>
      )}

      {/* ── About ────────────────────────────────────────────── */}
      <Card style={{ marginBottom: 14 }}>
        <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: 'var(--text-h)', margin: '0 0 10px', fontSize: 15 }}>About</h4>
        {editMode
          ? <textarea value={form.about || ''} onChange={e => setF('about', e.target.value)} placeholder={isTeacher ? 'Your teaching philosophy, experience, what students can ask you...' : 'Tell other students about you — goals, interests, favourite topics...'} rows={4} style={{ ...T.input, resize: 'vertical' }} />
          : <p style={{ color: prof.about ? 'var(--text-h)' : 'var(--text)', fontSize: 14, lineHeight: 1.7, margin: 0, fontStyle: prof.about ? 'normal' : 'italic' }}>{prof.about || (isOwn ? 'Click "Edit Profile" to add your bio.' : 'No about section yet.')}</p>}
      </Card>

      {/* ── Skills & Subjects ───────────────────────────────── */}
      <Card style={{ marginBottom: 14 }}>
        <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: 'var(--text-h)', margin: '0 0 12px', fontSize: 15 }}>Skills &amp; Subjects</h4>
        {editMode && (
          <div style={{ marginBottom: 10 }}>
            <Label>Skills / strong subjects (comma separated)</Label>
            <input value={(form.skills || []).join(', ')} onChange={e => setF('skills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. Mathematics, Physics, Problem Solving" style={{ ...T.input }} />
          </div>
        )}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(prof.skills || []).map((s, i) => <span key={i} style={pillRO}>{s}</span>)}
          {!(prof.skills || []).length && <span style={emptyRO}>{isOwn ? 'No skills added yet — click Edit Profile.' : 'No skills listed.'}</span>}
        </div>
      </Card>

      {/* ── Languages / location (view mode, if present) ─────── */}
      {!editMode && (prof.location || (prof.languages || []).length > 0) && (
        <Card style={{ marginBottom: 14 }}>
          {prof.location && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 13.5, color: 'var(--text-h)' }}>📍 {prof.location}</div>}
          {(prof.languages || []).length > 0 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 12.5, color: 'var(--text)', marginRight: 4 }}>🗣️</span>
              {prof.languages.map((l, i) => <span key={i} style={pillNeutral}>{l}</span>)}
            </div>
          )}
        </Card>
      )}

      {editMode && (
        <Card style={{ marginBottom: 14 }}>
          <h4 style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, color: 'var(--text-h)', margin: '0 0 14px', fontSize: 15 }}>More Details</h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 12 }}>
            <div><Label>Location</Label><input value={form.location || ''} onChange={e => setF('location', e.target.value)} placeholder="e.g. Mumbai, India" style={{ ...T.input }} /></div>
            <div><Label>Languages (comma separated)</Label><input value={(form.languages || []).join(', ')} onChange={e => setF('languages', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="e.g. English, Hindi" style={{ ...T.input }} /></div>
          </div>
        </Card>
      )}

      {editMode && (
        <div style={{ display: 'flex', gap: 10, marginTop: 4, paddingBottom: 24 }}>
          <PrimaryBtn onClick={save} disabled={saving} style={{ flex: 1, justifyContent: 'center' }}>{saving ? <><Spinner /> Saving...</> : '💾 Save Profile'}</PrimaryBtn>
          <GhostBtn onClick={() => { setEditMode(false); setForm({ ...(data.profile || {}), class_level: data.user?.class_level || '' }) }}>Cancel</GhostBtn>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MESSAGING PAGE
// ══════════════════════════════════════════════════════════════
function MessagingPage({ currentUser, startWithUserId, onConversationRead }) {
  const [convs, setConvs]     = useState([])
  const [active, setActive]   = useState(null)
  const [msgs, setMsgs]       = useState([])
  const [input, setInput]     = useState('')
  const [media, setMedia]     = useState(null)
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)
  const bottomRef = useRef(null)
  const isMobile  = useIsMobile()

  const refreshConvs = () => api.get('/api/conversations').then(setConvs).catch(() => {})

  useEffect(() => { refreshConvs().finally(() => setLoading(false)) }, [])

  useEffect(() => { if (startWithUserId) startConversation(startWithUserId) }, [startWithUserId])

  // Load + poll the open conversation; mark it read on open.
  useEffect(() => {
    if (!active) return
    let stop = false
    const load = () => api.get(`/api/conversations/${active.id}/messages`).then(m => { if (!stop) setMsgs(m) }).catch(() => {})
    load()
    markActiveRead()
    const poll = setInterval(() => { load(); markActiveRead() }, 5000)
    return () => { stop = true; clearInterval(poll) }
  }, [active?.id])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [msgs])

  function markActiveRead() {
    if (!active) return
    api.post(`/api/conversations/${active.id}/read`).then(() => {
      setConvs(c => c.map(x => x.id === active.id ? { ...x, unread_count: 0 } : x))
      onConversationRead?.()   // refresh the header badge
    }).catch(() => {})
  }

  const startConversation = async receiverId => {
    try {
      const conv = await api.post('/api/conversations', { receiverId })
      setActive(conv)
      refreshConvs()
    } catch (e) {
      // student↔student is blocked server-side → 403
      alert(e.status === 403 ? 'Students cannot message each other.' : e.message)
    }
  }

  const send = async () => {
    if (!input.trim() && !media) return
    setSending(true)
    try {
      const msg = await api.post(`/api/conversations/${active.id}/messages`, { content: input.trim(), media_url: media?.url, media_type: media?.type })
      setMsgs(m => [...m, msg])
      setInput(''); setMedia(null)
      setConvs(c => c.map(x => x.id === active.id ? { ...x, last_message: input.slice(0, 60), last_message_at: new Date().toISOString() } : x))
    } catch (e) { alert(e.message) }
    setSending(false)
  }

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 120px)', fontFamily: "'Nunito',sans-serif" }}>
      {(!isMobile || !active) && (
        <div style={{ width: isMobile ? '100%' : 280, borderRight: '1px solid var(--border)', overflowY: 'auto', flexShrink: 0 }}>
          <div style={{ padding: '16px 16px 10px', fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-h)', borderBottom: '1px solid var(--border)' }}>💬 Messages</div>
          {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text)' }}>Loading...</div>}
          {convs.map(c => (
            <div key={c.id} onClick={() => setActive(c)} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: active?.id === c.id ? 'var(--accent-bg)' : 'transparent', transition: 'background .15s' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <Avatar name={c.other?.name} url={c.other?.avatar_url} size={36} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: c.unread_count > 0 ? 800 : 700, fontSize: 13.5, color: 'var(--text-h)' }}>{c.other?.name || 'Unknown'}</div>
                  <div style={{ fontSize: 11.5, color: c.unread_count > 0 ? 'var(--text-h)' : 'var(--text)', fontWeight: c.unread_count > 0 ? 700 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.last_message || 'No messages yet'}</div>
                </div>
                {c.unread_count > 0 && (
                  <span style={{ flexShrink: 0, minWidth: 20, height: 20, padding: '0 6px', borderRadius: 10, background: 'var(--accent)', color: '#fff', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {c.unread_count > 99 ? '99+' : c.unread_count}
                  </span>
                )}
              </div>
            </div>
          ))}
          {!loading && convs.length === 0 && <div style={{ padding: 24, textAlign: 'center', color: 'var(--text)', fontSize: 13 }}>No conversations yet. Visit a profile to start a chat.</div>}
        </div>
      )}

      {active ? (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
            {isMobile && <button onClick={() => setActive(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 18 }}>←</button>}
            <Avatar name={active.other?.name} url={active.other?.avatar_url} size={34} />
            <div>
              <div style={{ fontWeight: 700, color: 'var(--text-h)', fontSize: 15 }}>{active.other?.name || 'Chat'}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text)' }}>{active.other?.role} {active.other?.class_level ? `· ${active.other.class_level}` : ''}</div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
            {msgs.map(m => {
              const isMe = m.sender_id === currentUser.id
              return (
                <div key={m.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '72%', padding: '10px 14px', borderRadius: isMe ? '14px 4px 14px 14px' : '4px 14px 14px 14px', background: isMe ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--bg2)', color: isMe ? '#fff' : 'var(--text-h)', border: isMe ? 'none' : '1px solid var(--border)', fontSize: 14, lineHeight: 1.6 }}>
                    {m.media_url && m.media_type === 'image' && <img src={m.media_url} style={{ width: '100%', borderRadius: 8, marginBottom: 6, maxHeight: 200, objectFit: 'cover' }} alt="" />}
                    {m.content && <div>{m.content}</div>}
                    <div style={{ fontSize: 9.5, opacity: .7, marginTop: 4, textAlign: 'right', display: 'flex', gap: 4, justifyContent: 'flex-end', alignItems: 'center' }}>
                      {new Date(m.created_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      {/* WhatsApp-style ticks on MY messages only */}
                      {isMe && (
                        m.read_at
                          ? <span title="Seen" style={{ color: '#7dd3fc', fontWeight: 900, letterSpacing: -2 }}>✓✓</span>
                          : <span title="Sent" style={{ color: 'rgba(255,255,255,.85)', fontWeight: 900 }}>✓</span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>

          {media?.url && <div style={{ padding: '0 12px 6px', display: 'flex', gap: 6 }}><img src={media.url} style={{ height: 44, borderRadius: 6 }} alt="" /><button onClick={() => setMedia(null)} style={{ background: 'none', border: 'none', color: 'var(--text)', cursor: 'pointer' }}>✕</button></div>}
          <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
            <MediaUploader accept="image/*" label="📷" small onUpload={(url, type) => setMedia({ url, type })} onClear={() => setMedia(null)} current={null} />
            <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder="Type a message..." style={{ flex: 1, ...T.input, fontSize: 14 }} />
            <PrimaryBtn onClick={send} disabled={sending || (!input.trim() && !media)} small>Send</PrimaryBtn>
          </div>
        </div>
      ) : (!isMobile && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 48 }}>💬</div>
          <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-h)' }}>Select a conversation</div>
        </div>
      ))}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ASSIGNMENTS (Teacher create + Student view)
// ══════════════════════════════════════════════════════════════
function AssignmentsPage({ user }) {
  const [assignments,setAssignments]=useState([]); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [selected,setSelected]=useState(null)
  useEffect(()=>{
    api.get('/api/assignments').then(setAssignments).catch(()=>{}).finally(()=>setLoading(false))
  },[])
  if(loading) return <PageSpinner/>
  if(creating) return <AssignmentCreator user={user} onCreated={a=>{setAssignments(p=>[a,...p]);setCreating(false)}} onBack={()=>setCreating(false)}/>
  if(selected) return <AssignmentDetail assignment={selected} user={user} onBack={()=>setSelected(null)}/>
  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:22 }}>
        <PageHeader icon="📝" title="Assignments" subtitle={user.role==='teacher'?'Create and manage assignments':'Your assignments'} color="#F59E0B"/>
        {user.role==='teacher'&&<PrimaryBtn onClick={()=>setCreating(true)} color="#F59E0B">+ New Assignment</PrimaryBtn>}
      </div>
      {assignments.length===0&&<div style={{ textAlign:'center', padding:44, color:'var(--text)' }}>No assignments yet.</div>}
      <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
        {assignments.map(a=>{
          const isPast=new Date(a.deadline)<new Date(); const isUrgent=!isPast&&(new Date(a.deadline)-Date.now())<86400000*2
          return (
            <div key={a.id} onClick={()=>setSelected(a)} style={{ ...T.card, cursor:'pointer', borderLeft:`4px solid ${isPast?'#64748b':isUrgent?'#ef4444':'var(--accent)'}`, transition:'transform .15s' }}
              onMouseEnter={e=>e.currentTarget.style.transform='translateX(3px)'}
              onMouseLeave={e=>e.currentTarget.style.transform='none'}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)', marginBottom:3 }}>{a.title}</div>
                  <div style={{ fontSize:12.5, color:'var(--text)' }}>{a.subject} · {a.class_level} {a.section?`(Sec ${a.section})`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontSize:11, fontWeight:700, color:isPast?'#64748b':isUrgent?'#ef4444':'#22c55e', background:isPast?'rgba(100,116,139,.1)':isUrgent?'rgba(239,68,68,.1)':'rgba(34,197,94,.1)', padding:'3px 10px', borderRadius:20, marginBottom:4 }}>
                    {isPast?'Closed':isUrgent?'⚠️ Due soon':'Active'}
                  </div>
                  <div style={{ fontSize:11.5, color:'var(--text)' }}>Due: {new Date(a.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</div>
                </div>
              </div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <span style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:11.5, color:'var(--text)', fontWeight:600 }}>📊 {a.total_marks} marks</span>
                <span style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:20, padding:'2px 10px', fontSize:11.5, color:'var(--text)', fontWeight:600 }}>{a.answer_type==='pdf'?'📄 PDF only':a.answer_type==='text'?'⌨️ Text only':'🔄 Text or PDF'}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function AssignmentCreator({ user, onCreated, onBack }) {
  const [form,setForm]=useState({title:'',description:'',subject:'Mathematics',class_level:'Class 10',section:'',total_marks:20,deadline:'',answer_type:'both',grading_notes:''})
  const [qMode,setQMode]=useState('generate'); const [qPaper,setQPaper]=useState(''); const [qFile,setQFile]=useState(null)
  const [generating,setGenerating]=useState(false); const [saving,setSaving]=useState(false); const [err,setErr]=useState('')
  const set=k=>v=>setForm(f=>({...f,[k]:v}))
  const generatePaper=async()=>{
    setGenerating(true); setErr('')
    try{ const r=await api.post('/api/assignments/generate-paper',{subject:form.subject,class_level:form.class_level,marks:form.total_marks,answer_type:form.answer_type,teacher_notes:form.grading_notes}); setQPaper(r.paper_text) }
    catch(e){ setErr(e.message) }
    setGenerating(false)
  }
  const submit=async()=>{
    if(!form.title||!form.deadline) return setErr('Title and deadline required')
    setSaving(true); setErr('')
    try{ const data=await api.post('/api/assignments',{...form,question_paper_text:qPaper,question_paper_url:qFile}); onCreated?.(data) }
    catch(e){ setErr(e.message) }
    setSaving(false)
  }
  return (
    <div style={{ padding:24, maxWidth:720, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      {onBack&&<GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>}
      <PageHeader icon="📝" title="Create Assignment" subtitle="AI-powered assignment creation with automatic grading after deadline" color="#F59E0B"/>
      <Card style={{ marginBottom:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:14, marginBottom:14 }}>
          <Field label="Title"><BSInput value={form.title} onChange={set('title')} placeholder="e.g. Chapter 5 Practice"/></Field>
          <Field label="Subject"><BSSelect value={form.subject} onChange={set('subject')} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={form.class_level} onChange={set('class_level')} options={CLASSES}/></Field>
          <Field label="Section (blank=all)"><BSInput value={form.section} onChange={set('section')} placeholder="A, B, or blank"/></Field>
          <Field label="Total Marks"><input type="number" value={form.total_marks} onChange={e=>set('total_marks')(parseInt(e.target.value))} style={{ ...T.input }}/></Field>
          <Field label="Deadline"><input type="datetime-local" value={form.deadline} onChange={e=>set('deadline')(e.target.value)} min={new Date().toISOString().slice(0,16)} style={{ ...T.input }}/></Field>
        </div>
        <Field label="Expected Answer Format">
          <div style={{ display:'flex', gap:8 }}>
            {[['text','⌨️ Text only'],['pdf','📄 PDF only'],['both','🔄 Either']].map(([v,l])=>(
              <button key={v} onClick={()=>set('answer_type')(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${form.answer_type===v?'var(--accent)':'var(--border)'}`, background:form.answer_type===v?'var(--accent-bg)':'transparent', color:form.answer_type===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
            ))}
          </div>
        </Field>
        <Field label="Grading Preferences (AI uses this to grade)">
          <BSTextarea value={form.grading_notes} onChange={set('grading_notes')} rows={2} placeholder="e.g. Focus on method, not just answer. Award partial marks for correct working. Presentation matters."/>
        </Field>
      </Card>
      <Card style={{ marginBottom:14 }}>
        <Label>Question Paper</Label>
        <div style={{ display:'flex', gap:8, marginBottom:12 }}>
          {[['generate','🤖 AI Generate'],['upload','📎 Upload PDF']].map(([v,l])=>(
            <button key={v} onClick={()=>setQMode(v)} style={{ padding:'7px 14px', borderRadius:9, border:`2px solid ${qMode===v?'var(--accent)':'var(--border)'}`, background:qMode===v?'var(--accent-bg)':'transparent', color:qMode===v?'var(--accent)':'var(--text)', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{l}</button>
          ))}
        </div>
        {qMode==='generate'&&(
          <>
            <PrimaryBtn onClick={generatePaper} disabled={generating} color="#F59E0B" style={{ marginBottom:qPaper?10:0 }}>{generating?<><Spinner/> Generating...</>:'✨ Generate Question Paper'}</PrimaryBtn>
            {qPaper&&<textarea value={qPaper} onChange={e=>setQPaper(e.target.value)} rows={10} style={{ ...T.input, resize:'vertical', marginTop:8 }}/>}
          </>
        )}
        {qMode==='upload'&&<MediaUploader accept="application/pdf" label="Upload Question Paper PDF" onUpload={url=>setQFile(url)} onClear={()=>setQFile(null)} current={qFile?{url:qFile,type:'pdf'}:null}/>}
      </Card>
      <ErrMsg msg={err}/>
      <PrimaryBtn onClick={submit} disabled={saving} color="#F59E0B" style={{ width:'100%', justifyContent:'center', fontSize:15 }}>{saving?<><Spinner/> Publishing...</>:'📤 Publish Assignment'}</PrimaryBtn>
    </div>
  )
}

function AssignmentDetail({ assignment, user, onBack }) {
  const [submission,setSubmission]=useState(null); const [analysis,setAnalysis]=useState(null); const [answers,setAnswers]=useState({}); const [pdfFile,setPdfFile]=useState(null); const [submitting,setSubmitting]=useState(false); const [submitted,setSubmitted]=useState(false); const [teacherAnalysis,setTeacherAnalysis]=useState(null); const [loading,setLoading]=useState(true)
  const isPast=new Date(assignment.deadline)<new Date()
  useEffect(()=>{
    Promise.all([
      api.get(`/api/assignments/${assignment.id}/analysis/me`),
      user.role==='teacher'?api.get(`/api/assignments/${assignment.id}/analysis/all`):Promise.resolve(null),
    ]).then(([a,ta])=>{setAnalysis(a);setTeacherAnalysis(ta);setLoading(false)}).catch(()=>setLoading(false))
  },[assignment.id])

  const submitText=async()=>{
    setSubmitting(true)
    try{
      const ansArr=Object.entries(answers).map(([q_num,answer_text])=>({q_num:parseInt(q_num),answer_text}))
      await api.post(`/api/assignments/${assignment.id}/submit`,{answers:JSON.stringify(ansArr)})
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const submitPDF=async()=>{
    if(!pdfFile) return
    setSubmitting(true)
    try{
      const form=new FormData(); form.append('pdf',pdfFile)
      const tok=localStorage.getItem('bs_token')
      const r=await fetch(`${API_URL}/api/assignments/${assignment.id}/submit`,{method:'POST',headers:{Authorization:`Bearer ${tok}`},body:form})
      if(!r.ok){ const d=await r.json(); throw new Error(d.error) }
      setSubmitted(true)
    } catch(e){ alert(e.message) }
    setSubmitting(false)
  }

  const questions=assignment.questions_json?.questions||[]
  return (
    <div style={{ padding:24, maxWidth:760, margin:'0 auto', fontFamily:"'Nunito',sans-serif" }}>
      <GhostBtn small onClick={onBack} style={{ marginBottom:16 }}>← Back</GhostBtn>
      <Card style={{ marginBottom:18, borderLeft:`4px solid ${isPast?'#64748b':'var(--accent)'}` }}>
        <h2 style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, color:'var(--text-h)', margin:'0 0 6px' }}>{assignment.title}</h2>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap', marginBottom:10 }}>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>{assignment.subject} · {assignment.class_level}</span>
          <span style={{ fontSize:12.5, color:'var(--text)' }}>📊 {assignment.total_marks} marks</span>
          <span style={{ fontSize:12.5, color:isPast?'#fca5a5':'#6ee7b7', fontWeight:700 }}>🕐 {isPast?'Deadline passed':'Due: '}{new Date(assignment.deadline).toLocaleDateString('en-IN',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}</span>
        </div>
        {assignment.description&&<p style={{ color:'var(--text)', fontSize:13.5, marginBottom:10 }}>{assignment.description}</p>}
        {assignment.question_paper_text&&<div style={{ background:'var(--code-bg)', border:'1px solid var(--border)', borderRadius:10, padding:16, whiteSpace:'pre-wrap', fontFamily:'monospace', fontSize:13, color:'var(--text-h)', maxHeight:300, overflowY:'auto' }}>{assignment.question_paper_text}</div>}
      </Card>

      {/* Student: submission form */}
      {user.role==='student'&&!isPast&&!submitted&&!analysis&&(
        <Card style={{ marginBottom:14 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)', margin:'0 0 16px' }}>Your Submission</h3>
          {(assignment.answer_type==='text'||assignment.answer_type==='both')&&questions.map(q=>(
            <div key={q.q_num} style={{ marginBottom:14 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'var(--text-h)', marginBottom:6 }}>Q{q.q_num}. {q.question} [{q.max_marks} marks]</div>
              <BSTextarea value={answers[q.q_num]||''} onChange={v=>setAnswers(a=>({...a,[q.q_num]:v}))} rows={3} placeholder="Type your answer here..."/>
            </div>
          ))}
          {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&(
            <div style={{ marginBottom:14 }}>
              <Label>Upload PDF Answer</Label>
              <input type="file" accept="application/pdf" onChange={e=>setPdfFile(e.target.files[0])} style={{ color:'var(--text)', fontFamily:"'Nunito',sans-serif" }}/>
              {pdfFile&&<div style={{ marginTop:8, fontSize:13, color:'#6ee7b7' }}>📄 {pdfFile.name}</div>}
            </div>
          )}
          <div style={{ display:'flex', gap:10 }}>
            {(assignment.answer_type==='text'||assignment.answer_type==='both')&&Object.keys(answers).length>0&&<PrimaryBtn onClick={submitText} disabled={submitting}>{submitting?<><Spinner/> Submitting...</>:'Submit Text Answers'}</PrimaryBtn>}
            {(assignment.answer_type==='pdf'||assignment.answer_type==='both')&&pdfFile&&<PrimaryBtn onClick={submitPDF} disabled={submitting} color="#F97316">{submitting?<><Spinner/> Uploading...</>:'Upload PDF'}</PrimaryBtn>}
          </div>
        </Card>
      )}

      {submitted&&<SuccessMsg msg="Submitted! You'll receive AI feedback after the deadline."/>}

      {/* Student: analysis */}
      {user.role==='student'&&analysis&&(
        <Card style={{ borderLeft:'4px solid #22c55e' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'#6ee7b7', margin:'0 0 16px' }}>🤖 AI Feedback</h3>
          <div style={{ display:'flex', gap:16, marginBottom:16, background:'rgba(34,197,94,.1)', padding:'14px 16px', borderRadius:10 }}>
            <div style={{ textAlign:'center' }}><div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:28, color:'#6ee7b7' }}>{analysis.total_marks_awarded}/{analysis.total_marks_max}</div><div style={{ fontSize:11, color:'var(--text)' }}>Total Marks</div></div>
          </div>
          {analysis.overall_feedback&&<p style={{ color:'var(--text-h)', fontSize:14, marginBottom:14, lineHeight:1.7 }}>{analysis.overall_feedback}</p>}
          {analysis.handwriting_quality&&<div style={{ marginBottom:12, padding:'8px 12px', background:'var(--code-bg)', borderRadius:8, fontSize:13, color:'var(--text-h)' }}>✍️ Handwriting: <strong>{analysis.handwriting_quality}</strong> — {analysis.handwriting_tips}</div>}
          {(analysis.questions_analysis||[]).map((qa,i)=>(
            <Card key={i} style={{ marginBottom:10, borderLeft:`3px solid ${qa.marks_awarded>=qa.marks_max*0.7?'#22c55e':'#f59e0b'}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                <span style={{ fontWeight:700, color:'var(--text-h)', fontSize:13.5 }}>Q{qa.q_num}</span>
                <span style={{ fontWeight:800, color:'var(--accent)', fontSize:14 }}>{qa.marks_awarded}/{qa.marks_max}</span>
              </div>
              <p style={{ color:'var(--text-h)', fontSize:13, marginBottom:6, lineHeight:1.6 }}>{qa.feedback}</p>
              {qa.improvement_tip&&<p style={{ color:'#FCD34D', fontSize:12.5, margin:0 }}>💡 {qa.improvement_tip}</p>}
            </Card>
          ))}
        </Card>
      )}

      {/* Teacher: all students analysis */}
      {user.role==='teacher'&&teacherAnalysis&&teacherAnalysis.length>0&&(
        <div>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)', margin:'0 0 14px' }}>📊 Student Results Summary</h3>
          {teacherAnalysis.map((a,i)=>(
            <Card key={i} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                <div>
                  <div style={{ fontWeight:700, color:'var(--text-h)', fontSize:14 }}>{a.users?.name||'Student'}</div>
                  <div style={{ fontSize:12, color:'var(--text)' }}>{a.users?.class_level} {a.users?.section?`· Sec ${a.users.section}`:''}</div>
                </div>
                <div style={{ textAlign:'right' }}>
                  <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:20, color:'var(--accent)' }}>{a.total_marks_awarded}/{a.total_marks_max}</div>
                  <div style={{ fontSize:11, color:'var(--text)' }}>Potential marks</div>
                </div>
              </div>
              {a.overall_feedback&&<p style={{ color:'var(--text)', fontSize:12.5, lineHeight:1.6, margin:0 }}>{a.overall_feedback}</p>}
            </Card>
          ))}
        </div>
      )}

      {loading&&<PageSpinner/>}
      {isPast&&!analysis&&user.role==='student'&&<Card style={{ textAlign:'center', padding:24 }}><div style={{ fontSize:36, marginBottom:8 }}>⏳</div><p style={{ color:'var(--text)', fontSize:14 }}>AI analysis is being prepared. Check back shortly.</p></Card>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  AI BUDDY FLOATING WIDGET
// ══════════════════════════════════════════════════════════════
function AIBuddy({ user }) {
  const [open,setOpen]=useState(false); const [messages,setMessages]=useState([{role:'assistant',content:`Hey ${user?.name?.split(' ')[0]}! 👋 I'm your AI study buddy. I know your schedule and school updates. What's on your mind?`}]); const [input,setInput]=useState(''); const [loading,setLoading]=useState(false); const bottomRef=useRef(null)
  useEffect(()=>{ if(open) bottomRef.current?.scrollIntoView({behavior:'smooth'}) },[messages,open])
  const send=async()=>{
    if(!input.trim()) return
    const userMsg={role:'user',content:input.trim()}; setMessages(m=>[...m,userMsg]); setInput(''); setLoading(true)
    try{
      const r=await api.post('/api/buddy/chat',{message:input.trim(),sessionMessages:messages.slice(-8)})
      setMessages(m=>[...m,{role:'assistant',content:r.content}])
    } catch{ setMessages(m=>[...m,{role:'assistant',content:"I had trouble connecting. Try again! 🔄"}]) }
    setLoading(false)
  }
  return (
    <>
      <div onClick={()=>setOpen(!open)} style={{ position:'fixed', bottom:24, right:24, width:52, height:52, borderRadius:'50%', background:'linear-gradient(135deg,#6366F1,#8B5CF6)', boxShadow:'0 4px 20px rgba(99,102,241,.4)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', zIndex:1000, fontSize:22, transition:'transform .2s' }}
        onMouseEnter={e=>e.currentTarget.style.transform='scale(1.1)'} onMouseLeave={e=>e.currentTarget.style.transform='scale(1)'}>
        {open?'✕':'🤖'}
      </div>
      {open&&(
        <div style={{ position:'fixed', bottom:88, right:24, width:320, height:460, borderRadius:18, background:'var(--bg2)', border:'1px solid var(--accent-border)', boxShadow:'0 20px 60px rgba(0,0,0,.5)', display:'flex', flexDirection:'column', zIndex:999, overflow:'hidden', fontFamily:"'Nunito',sans-serif" }}>
          <div style={{ padding:'12px 16px', background:'linear-gradient(135deg,#4338ca,#6366F1)', display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:34, height:34, borderRadius:'50%', background:'rgba(255,255,255,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:17 }}>🤖</div>
            <div><div style={{ fontWeight:800, color:'#fff', fontSize:14 }}>AI Buddy</div><div style={{ fontSize:11, color:'rgba(255,255,255,.7)' }}>Your personal study companion</div></div>
          </div>
          <div style={{ flex:1, overflowY:'auto', padding:12, display:'flex', flexDirection:'column', gap:8 }}>
            {messages.map((m,i)=>(
              <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start' }}>
                <div style={{ maxWidth:'86%', padding:'8px 12px', borderRadius:m.role==='user'?'12px 3px 12px 12px':'3px 12px 12px 12px', background:m.role==='user'?'var(--accent)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', fontSize:13, lineHeight:1.6, border:m.role==='assistant'?'1px solid var(--border)':'none' }}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading&&<div style={{ display:'flex', gap:4, padding:'8px 12px', background:'var(--code-bg)', borderRadius:'3px 12px 12px 12px', width:'fit-content', border:'1px solid var(--border)' }}>{[0,1,2].map(j=><div key={j} style={{ width:6, height:6, borderRadius:'50%', background:'var(--accent)', animation:`dotBounce 1s ${j*.2}s infinite` }}/>)}</div>}
            <div ref={bottomRef}/>
          </div>
          <div style={{ padding:10, borderTop:'1px solid var(--border)', display:'flex', gap:6 }}>
            <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask me anything..." disabled={loading} style={{ flex:1, ...T.input, fontSize:13 }}/>
            <button onClick={send} disabled={loading||!input.trim()} style={{ padding:'8px 12px', borderRadius:10, border:'none', background:'var(--accent)', color:'#fff', fontWeight:700, cursor:'pointer', fontSize:13 }}>→</button>
          </div>
        </div>
      )}
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  SCHOOL NOTICES
// ══════════════════════════════════════════════════════════════
function NoticesPage({ user }) {
  const [notices,setNotices]=useState([]); const [loading,setLoading]=useState(true); const [creating,setCreating]=useState(false); const [form,setForm]=useState({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false}); const [saving,setSaving]=useState(false)
  useEffect(()=>{ api.get('/api/school/notices').then(setNotices).catch(()=>{}).finally(()=>setLoading(false)) },[])
  const submit=async()=>{
    setSaving(true)
    try{
      const n=await api.post('/api/school/notices',form);
      setNotices(p=>[n,...p]);
      setCreating(false);
      setForm({title:'',content:'',notice_type:'general',target_audience:'all',is_pinned:false})
    } catch(e){ alert(e.message) }
    setSaving(false)
  }

  const canCreate = ['admin','principal','teacher'].includes(user.role)
  const TYPES = [{v:'general',l:'📢 General'},{v:'exam',l:'📝 Exam'},{v:'event',l:'🎉 Event'},{v:'holiday',l:'🏖️ Holiday'},{v:'sports',l:'⚽ Sports'},{v:'cultural',l:'🎭 Cultural'}]

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif", maxWidth:760, margin:'0 auto' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <PageHeader icon="📢" title="School Notices" subtitle="Stay updated with school announcements" color="#F97316"/>
        {canCreate&&!creating&&<PrimaryBtn onClick={()=>setCreating(true)} color="#F97316">+ New Notice</PrimaryBtn>}
      </div>

      {creating&&(
        <Card style={{ marginBottom:20, borderColor:'#F97316' }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 16px', fontSize:15 }}>Create Notice</h3>
          <Field label="Title"><BSInput value={form.title} onChange={v=>setForm(f=>({...f,title:v}))} placeholder="Notice title..."/></Field>
          <Field label="Content"><BSTextarea value={form.content} onChange={v=>setForm(f=>({...f,content:v}))} rows={4} placeholder="Notice details..."/></Field>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:12, marginBottom:14 }}>
            <div>
              <Label>Type</Label>
              <BSSelect value={form.notice_type} onChange={v=>setForm(f=>({...f,notice_type:v}))} options={TYPES.map(t=>({value:t.v,label:t.l}))}/>
            </div>
            {user.role!=='teacher'&&<div>
              <Label>Audience</Label>
              <BSSelect value={form.target_audience} onChange={v=>setForm(f=>({...f,target_audience:v}))} options={[{value:'all',label:'Everyone'},{value:'students',label:'Students only'},{value:'teachers',label:'Teachers only'}]}/>
            </div>}
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', fontSize:13, color:'var(--text)', fontWeight:600, marginBottom:14 }}>
            <input type="checkbox" checked={form.is_pinned} onChange={e=>setForm(f=>({...f,is_pinned:e.target.checked}))} style={{ accentColor:'var(--accent)' }}/>
            📌 Pin this notice
          </label>
          <div style={{ display:'flex', gap:10 }}>
            <PrimaryBtn onClick={submit} disabled={saving||!form.title||!form.content} color="#F97316">{saving?<><Spinner/> Posting...</>:'📤 Post Notice'}</PrimaryBtn>
            <GhostBtn onClick={()=>setCreating(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {loading&&<PageSpinner/>}
      {!loading&&notices.length===0&&<div style={{ textAlign:'center', padding:40, color:'var(--text)' }}>No notices yet.</div>}

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {notices.map(n=>{
          const typeColors = {general:'#6366F1',exam:'#F59E0B',event:'#10B981',holiday:'#06b6d4',sports:'#EF4444',cultural:'#A855F7'}
          const color = typeColors[n.notice_type]||'#6366F1'
          return (
            <div key={n.id} style={{ ...T.card, borderLeft:`4px solid ${color}` }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
                    {n.is_pinned&&<span style={{ fontSize:12, color:'#F59E0B' }}>📌</span>}
                    <span style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'var(--text-h)' }}>{n.title}</span>
                    <span style={{ background:`${color}18`, color, border:`1px solid ${color}28`, borderRadius:20, padding:'2px 10px', fontSize:10.5, fontWeight:700, textTransform:'capitalize' }}>{n.notice_type}</span>
                  </div>
                  <p style={{ color:'var(--text-h)', fontSize:13.5, lineHeight:1.7, margin:'0 0 10px' }}>{n.content}</p>
                  <div style={{ fontSize:11.5, color:'var(--text)' }}>{timeAgo(n.created_at)} · {n.target_audience==='all'?'Everyone':n.target_audience}</div>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TIMETABLE VIEWER
// ══════════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════════
//  TEACHER PICKER — multi-select from school teachers + manual add
//  (Place this component ABOVE TimetablePage in your file)
// ══════════════════════════════════════════════════════════════
function TeacherPicker({ selected = [], onChange, options = [], color = '#06b6d4' }) {
  const [open, setOpen]     = useState(false)
  const [search, setSearch] = useState('')
  const [manual, setManual] = useState('')
  const ref = useRef(null)

  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const toggle = name =>
    selected.includes(name) ? onChange(selected.filter(n => n !== name)) : onChange([...selected, name])

  const addManual = () => {
    const n = manual.trim()
    if (n && !selected.includes(n)) onChange([...selected, n])
    setManual('')
  }

  const filtered = search.trim()
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options

  const label = selected.length === 0
    ? 'Add teacher (optional)'
    : selected.length === 1
    ? selected[0]
    : `${selected.length} teachers`

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      {/* Selected pills */}
      {selected.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 6 }}>
          {selected.map(t => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: `${color}18`, color, border: `1px solid ${color}44`, borderRadius: 20, padding: '2px 9px', fontSize: 11.5, fontWeight: 700 }}>
              {t}
              <span onClick={e => { e.stopPropagation(); toggle(t) }} style={{ cursor: 'pointer', fontWeight: 900, lineHeight: 1 }}>×</span>
            </span>
          ))}
        </div>
      )}

      {/* Trigger */}
      <button type="button" onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, border: `1.5px solid ${open ? color : 'var(--border)'}`, background: '#fff', color: selected.length ? '#1e293b' : '#94a3b8', fontSize: 13, fontFamily: "'Nunito', sans-serif", cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{label}</span>
        <span style={{ marginLeft: 6, fontSize: 10, color: 'var(--text)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }}>▼</span>
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, background: '#fff', border: `1.5px solid ${color}55`, borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,.18)', zIndex: 600, overflow: 'hidden' }}>
          {/* Search the school teacher list */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search school teachers…"
              style={{ width: '100%', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#f8fafc', color: '#1e293b', fontSize: 12.5, fontFamily: "'Nunito', sans-serif", outline: 'none' }} />
          </div>

          {/* List of school teachers */}
          <div style={{ maxHeight: 180, overflowY: 'auto', padding: '4px 0' }}>
            {options.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No teachers found for this school</div>}
            {filtered.map(o => {
              const checked = selected.includes(o)
              return (
                <div key={o} onClick={() => toggle(o)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 13px', cursor: 'pointer', background: checked ? `${color}12` : 'transparent' }}>
                  <div style={{ width: 15, height: 15, borderRadius: 4, border: `2px solid ${checked ? color : '#cbd5e1'}`, background: checked ? color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {checked && <span style={{ color: '#fff', fontSize: 9, fontWeight: 900 }}>✓</span>}
                  </div>
                  <span style={{ fontSize: 13, color: checked ? color : '#1e293b', fontWeight: checked ? 700 : 400 }}>{o}</span>
                </div>
              )
            })}
            {options.length > 0 && filtered.length === 0 && <div style={{ padding: 12, textAlign: 'center', fontSize: 12, color: '#94a3b8' }}>No matches</div>}
          </div>

          {/* Manual add — for guest / substitute / not-listed teachers */}
          <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border)', display: 'flex', gap: 6 }}>
            <input value={manual} onChange={e => setManual(e.target.value)} onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addManual())} placeholder="Or type a name…"
              style={{ flex: 1, padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)', background: '#f8fafc', color: '#1e293b', fontSize: 12.5, fontFamily: "'Nunito', sans-serif", outline: 'none' }} />
            <button onClick={addManual} disabled={!manual.trim()} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: 12, fontWeight: 700, cursor: manual.trim() ? 'pointer' : 'not-allowed', opacity: manual.trim() ? 1 : .5, fontFamily: "'Nunito', sans-serif" }}>Add</button>
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  TIMETABLE VIEWER + VISUAL BUILDER  (replaces old TimetablePage)
// ══════════════════════════════════════════════════════════════
function TimetablePage({ user }) {
  const DAYS   = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const COLORS = { 'Mathematics':'#6366F1','Science':'#10B981','Physics':'#06b6d4','Chemistry':'#F59E0B','Biology':'#22c55e','English':'#EF4444','Hindi':'#A855F7','Social Science':'#F97316','History':'#ec4899','Geography':'#34d399','default':'#64748b' }
  const SECTIONS = ['A', 'B', 'C', 'D', 'E', 'F']

  const isTeacher = ['teacher', 'admin', 'principal'].includes(user.role)

  const [classLevel, setClassLevel] = useState(user.class_level || 'Class 10')
  const [section,    setSection]    = useState(user.section || 'A')
  const [timetable,  setTimetable]  = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [editing,    setEditing]    = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [err,        setErr]        = useState('')
  const [ok,         setOk]         = useState(false)
  const [teacherOptions, setTeacherOptions] = useState([])
  const [builder,    setBuilder]    = useState([])   // [{ day, periods:[{ subject, teachers:[], time_start, time_end }] }]

  // ── Load existing timetable + the school's teacher list ──
  useEffect(() => {
    api.get('/api/school/timetable')
      .then(d => setTimetable(d))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    api.get('/api/search?role=teacher')
      .then(list => setTeacherOptions([...new Set((list || []).map(t => t.name).filter(Boolean))]))
      .catch(() => {})
  }, [])

  // ── Time helper: add minutes to "HH:MM" ──
  const addMin = (t, m) => {
    if (!t) return ''
    const [h, mm] = t.split(':').map(Number)
    const d = new Date(2000, 0, 1, h, mm + m)
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  // ── Convert saved schedule → editable builder rows ──
  const scheduleToBuilder = (week = []) => {
    const byDay = Object.fromEntries((week || []).map(d => [d.day, d.periods || []]))
    return DAYS.map(day => ({
      day,
      periods: (byDay[day] || []).map(p => ({
        subject:    p.subject || '',
        teachers:   p.teacher ? p.teacher.split(',').map(s => s.trim()).filter(Boolean) : [],
        time_start: p.time_start || '',
        time_end:   p.time_end || '',
      })),
    }))
  }

  // ── Default blank week: each day starts with one empty 45-min slot ──
  const blankBuilder = () =>
    DAYS.map(day => ({ day, periods: [{ subject: '', teachers: [], time_start: '08:00', time_end: '08:45' }] }))

  function startEditing() {
    setErr(''); setOk(false)
    const week = timetable?.schedule?.week
    setBuilder(week?.length ? scheduleToBuilder(week) : blankBuilder())
    setEditing(true)
  }

  // ── Builder mutations ──
  const updatePeriod = (di, pi, field, value) =>
    setBuilder(b => b.map((d, i) => i !== di ? d : {
      ...d,
      periods: d.periods.map((p, j) => j !== pi ? p : { ...p, [field]: value }),
    }))

  const addPeriod = di =>
    setBuilder(b => b.map((d, i) => {
      if (i !== di) return d
      const last  = d.periods[d.periods.length - 1]
      const start = last?.time_end || '08:00'
      return { ...d, periods: [...d.periods, { subject: '', teachers: [], time_start: start, time_end: addMin(start, 45) }] }
    }))

  const removePeriod = (di, pi) =>
    setBuilder(b => b.map((d, i) => i !== di ? d : { ...d, periods: d.periods.filter((_, j) => j !== pi) }))

  const copyMondayToAll = () =>
    setBuilder(b => {
      const mon = b[0]?.periods || []
      return b.map((d, i) => i === 0 ? d : { ...d, periods: mon.map(p => ({ ...p, teachers: [...p.teachers] })) })
    })

  // ── Save: builder → schedule.week JSON ──
  async function save() {
    setErr(''); setOk(false)
    const week = builder
      .map(d => ({
        day: d.day,
        periods: d.periods
          .filter(p => p.subject && p.time_start && p.time_end)
          .map((p, i) => ({
            period:     i + 1,
            subject:    p.subject,
            teacher:    p.teachers.join(', '),   // stays a string → viewer renders unchanged
            time_start: p.time_start,
            time_end:   p.time_end,
          })),
      }))
      .filter(d => d.periods.length)

    if (!week.length) { setErr('Add at least one period with a subject and time before saving.'); return }

    setSaving(true)
    try {
      const result = await api.post('/api/school/timetable', { class_level: classLevel, section, schedule: { week } })
      setTimetable(result)
      setOk(true)
      setEditing(false)
      setTimeout(() => setOk(false), 1500)
    } catch (e) { setErr(e.message) }
    setSaving(false)
  }

  if (loading) return <PageSpinner />

  const schedule = timetable?.schedule?.week || []
  const maxP = schedule.length ? Math.max(...schedule.map(d => d.periods?.length || 0)) : 0

  // ══════════════════════════════════════════════════════════
  //  EDIT MODE — timesheet-style builder
  // ══════════════════════════════════════════════════════════
  if (editing) {
    return (
      <div style={{ padding: 24, fontFamily: "'Nunito', sans-serif", maxWidth: 920, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
          <PageHeader icon="📅" title="Build Timetable" subtitle="Fill it like a weekly timesheet — pick the class, then add periods per day" color="#06b6d4" />
          <div style={{ display: 'flex', gap: 8 }}>
            <PrimaryBtn onClick={save} disabled={saving} color="#06b6d4">{saving ? <><Spinner /> Saving…</> : '💾 Save Timetable'}</PrimaryBtn>
            <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
          </div>
        </div>

        {/* Class / section selectors */}
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14 }}>
            <Field label="Class"><BSSelect value={classLevel} onChange={setClassLevel} options={CLASSES} /></Field>
            <Field label="Section"><BSSelect value={section} onChange={setSection} options={SECTIONS} /></Field>
          </div>
          <div style={{ marginTop: 6 }}>
            <GhostBtn small onClick={copyMondayToAll}>📋 Copy Monday's periods to all days</GhostBtn>
          </div>
        </Card>

        {ok  && <SuccessMsg msg="Timetable saved!" />}
        {err && <ErrMsg msg={err} />}

        {/* One block per day */}
        {builder.map((day, di) => {
          const color = '#06b6d4'
          return (
            <Card key={day.day} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text-h)' }}>
                  {day.day}
                </h3>
                <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{day.periods.length} period{day.periods.length !== 1 ? 's' : ''}</span>
              </div>

              {day.periods.length === 0 && (
                <div style={{ fontSize: 12.5, color: 'var(--text)', padding: '4px 0 10px', fontStyle: 'italic' }}>No periods yet — it's a free day, or add one below.</div>
              )}

              {/* Each period row */}
              {day.periods.map((p, pi) => (
                <div key={pi} style={{ display: 'grid', gridTemplateColumns: '90px 90px 1fr 1fr 32px', gap: 8, alignItems: 'start', marginBottom: 10, paddingBottom: 10, borderBottom: pi < day.periods.length - 1 ? '1px solid var(--border)' : 'none' }}>
                  {/* Start time */}
                  <div>
                    <Label>From</Label>
                    <input type="time" value={p.time_start} onChange={e => updatePeriod(di, pi, 'time_start', e.target.value)} style={{ ...T.input, padding: '8px 8px', fontSize: 13 }} />
                  </div>
                  {/* End time */}
                  <div>
                    <Label>To</Label>
                    <input type="time" value={p.time_end} onChange={e => updatePeriod(di, pi, 'time_end', e.target.value)} style={{ ...T.input, padding: '8px 8px', fontSize: 13 }} />
                  </div>
                  {/* Subject */}
                  <div>
                    <Label>Subject</Label>
                    <BSSelect value={p.subject} onChange={v => updatePeriod(di, pi, 'subject', v)}
                      options={[{ value: '', label: 'Select subject' }, ...SUBJECTS.map(s => ({ value: s, label: s })), { value: 'Break', label: 'Break / Lunch' }, { value: 'Library', label: 'Library' }, { value: 'Games', label: 'Games / PE' }]} />
                  </div>
                  {/* Teacher (optional, multi-select + manual) */}
                  <div>
                    <Label>Teacher (optional)</Label>
                    <TeacherPicker selected={p.teachers} onChange={v => updatePeriod(di, pi, 'teachers', v)} options={teacherOptions} />
                  </div>
                  {/* Delete row */}
                  <div style={{ paddingTop: 22 }}>
                    <button onClick={() => removePeriod(di, pi)} title="Remove period"
                      style={{ width: 30, height: 30, borderRadius: 8, border: '1px solid #fecaca', background: '#fff5f5', color: '#ef4444', fontSize: 13, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}>✕</button>
                  </div>
                </div>
              ))}

              <button onClick={() => addPeriod(di)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 9, border: '1.5px dashed #94a3b8', background: 'transparent', color: '#06b6d4', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", marginTop: 4 }}>
                + Add Period to {day.day}
              </button>
            </Card>
          )
        })}

        <div style={{ display: 'flex', gap: 10, marginTop: 4, paddingBottom: 24 }}>
          <PrimaryBtn onClick={save} disabled={saving} color="#06b6d4" style={{ flex: 1, justifyContent: 'center' }}>{saving ? <><Spinner /> Saving…</> : '💾 Save Timetable'}</PrimaryBtn>
          <GhostBtn onClick={() => setEditing(false)}>Cancel</GhostBtn>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  VIEW MODE (unchanged grid)
  // ══════════════════════════════════════════════════════════
  return (
    <div style={{ padding: 24, fontFamily: "'Nunito', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        <PageHeader icon="📅" title="Timetable" subtitle={`${user.class_level || classLevel} schedule`} color="#06b6d4" />
        {isTeacher && <PrimaryBtn onClick={startEditing} color="#06b6d4">{schedule.length ? '✏️ Edit' : '+ Create Timetable'}</PrimaryBtn>}
      </div>

      {ok && <SuccessMsg msg="Timetable saved!" />}

      {!timetable && (
        <div style={{ textAlign: 'center', padding: 44, color: 'var(--text)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📅</div>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 16, color: 'var(--text-h)', marginBottom: 8 }}>No timetable yet</div>
          {isTeacher && <PrimaryBtn onClick={startEditing} color="#06b6d4">Create Timetable</PrimaryBtn>}
        </div>
      )}

      {schedule.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: `120px repeat(${maxP}, 1fr)`, gap: 6, minWidth: 600 }}>
            <div style={{ padding: '10px 12px', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: 'var(--text)', fontSize: 11, textTransform: 'uppercase' }}>Day</div>
            {Array.from({ length: maxP }, (_, i) => (
              <div key={i} style={{ padding: '10px 8px', textAlign: 'center', fontFamily: "'Sora', sans-serif", fontWeight: 800, color: 'var(--text)', fontSize: 11, textTransform: 'uppercase' }}>Period {i + 1}</div>
            ))}
            {schedule.map((day, di) => (
              <div key={di} style={{ display: 'contents' }}>
                <div style={{ padding: '10px 12px', display: 'flex', alignItems: 'center', fontWeight: 800, color: 'var(--text-h)', fontSize: 13, fontFamily: "'Sora', sans-serif", background: 'var(--bg2)', borderRadius: 10, border: '1px solid var(--border)' }}>{day.day}</div>
                {(day.periods || []).map((p, pi) => {
                  const color = COLORS[p.subject] || COLORS.default
                  return (
                    <div key={pi} style={{ background: `${color}15`, border: `1px solid ${color}25`, borderRadius: 10, padding: '10px 10px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: 12.5, color, fontFamily: "'Sora', sans-serif", marginBottom: 2 }}>{p.subject}</div>
                      {p.teacher && <div style={{ fontSize: 10.5, color: 'var(--text)' }}>{p.teacher}</div>}
                      <div style={{ fontSize: 10, color: 'var(--text)', marginTop: 2 }}>{p.time_start}–{p.time_end}</div>
                    </div>
                  )
                })}
                {/* pad empty cells so rows align */}
                {Array.from({ length: maxP - (day.periods?.length || 0) }, (_, k) => <div key={`pad-${k}`} />)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  SCHOOL ADMIN DASHBOARD
// ══════════════════════════════════════════════════════════════
function SchoolDashboard({ user }) {
  const [analytics,setAnalytics]=useState([]); const [loading,setLoading]=useState(true); const [filter,setFilter]=useState('all')
  useEffect(()=>{ api.get('/api/school/analytics').then(setAnalytics).catch(()=>{}).finally(()=>setLoading(false)) },[])

  const shown = filter==='all'?analytics:analytics.filter(u=>u.role===filter)
  const totalXP = analytics.reduce((s,u)=>s+(u.total_xp||0),0)
  const totalDoubts = analytics.reduce((s,u)=>s+(u.doubts_solved||0),0)
  const activeToday = analytics.filter(u=>u.last_active_at&&new Date(u.last_active_at)>new Date(Date.now()-86400000)).length

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <PageHeader icon="🏫" title="School Analytics" subtitle="Real-time usage and performance dashboard" color="#A855F7"/>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))', gap:12, marginBottom:20 }}>
        {[['👥',analytics.length,'Total Users','#6366F1'],['⚡',totalXP.toLocaleString(),'Total XP','#F59E0B'],['🤔',totalDoubts,'Doubts Solved','#10B981'],['🟢',activeToday,'Active Today','#22c55e']].map(([e,v,l,c])=>(
          <div key={l} style={{ background:`${c}15`, border:`1px solid ${c}25`, borderRadius:14, padding:'14px 12px', textAlign:'center' }}>
            <div style={{ fontSize:22, marginBottom:4 }}>{e}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:22, color:c }}>{v}</div>
            <div style={{ fontSize:11, color:'var(--text)', marginTop:2 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['all','All'],['student','Students'],['teacher','Teachers']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===v?'var(--accent)':'var(--social-bg)', color:filter===v?'#fff':'var(--text-h)', transition:'all .15s' }}>{l}</button>
        ))}
      </div>

      {loading&&<PageSpinner/>}

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'Nunito',sans-serif" }}>
          <thead>
            <tr>
              {['Name','Class/Role','XP','Streak','Doubts','Quizzes','Notes','Assignments','Last Active'].map(h=>(
                <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:10.5, fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.5px', borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.map((u,i)=>(
              <tr key={u.user_id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                <td style={{ padding:'10px 12px', fontSize:13.5, color:'var(--text-h)', fontWeight:600 }}>{u.name}</td>
                <td style={{ padding:'10px 12px', fontSize:12, color:'var(--text)' }}>{u.class_level||'-'} {u.section?`·${u.section}`:''} <span style={{ fontSize:10.5, color:'var(--accent)' }}>{u.role}</span></td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FCD34D', fontWeight:700 }}>{(u.total_xp||0).toLocaleString()}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FB923C' }}>{u.streak||0}d</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#34D399' }}>{u.doubts_solved||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#A78BFA' }}>{u.quizzes_done||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#FCA5A5' }}>{u.notes_made||0}</td>
                <td style={{ padding:'10px 12px', fontSize:13, color:'#6ee7b7' }}>{u.assignments_submitted||0}</td>
                <td style={{ padding:'10px 12px', fontSize:11.5, color:'var(--text)' }}>{u.last_active_at?timeAgo(u.last_active_at):'Never'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading&&shown.length===0&&<div style={{ textAlign:'center', padding:32, color:'var(--text)' }}>No data yet.</div>}
      </div>
    </div>
  )
}


// Loads the most recent saved item for a tool matching subject + chapter/chapters
async function loadSavedContent(tool, subject, chapter, chapters) {
  const endpoints = {
    notes:      { list: '/api/user/notes',      detail: id => `/api/user/notes/${id}`,      matchFn: (n) => n.subject === subject && n.chapter === chapter },
    paper:      { list: '/api/user/papers',     detail: id => `/api/user/papers`,           matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    cheatsheet: { list: '/api/user/cheatsheets',detail: id => `/api/user/cheatsheets`,      matchFn: (n) => n.subject === subject && (n.chapters||[]).some(c => (chapters||[]).includes(c) || c === chapter) },
    lessonplan: { list: '/api/user/lessonplans', detail: id => `/api/user/lessonplans`,     matchFn: (n) => n.subject === subject && (n.topic === chapter) },
  }
  const cfg = endpoints[tool]
  if (!cfg) return null
  try {
    const list  = await api.get(cfg.list)
    const match = list.find(cfg.matchFn)
    if (!match) return null
    // notes have a real detail endpoint; others store content in list already
    if (tool === 'notes') {
      const full = await api.get(`/api/user/notes/${match.id}`)
      return full.content
    }
    return match.content || null
  } catch { return null }
}

// ══════════════════════════════════════════════════════════════
//  DOUBT SOLVER
// ══════════════════════════════════════════════════════════════

function formatDoubtMessage(md = '') {
  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const inline = s => esc(s).replace(/\*\*(.*?)\*\*/g, '<strong style="color:#c7d2fe;font-weight:800">$1</strong>')

  const lines = md.split('\n')
  let html = '', i = 0
  while (i < lines.length) {
    const line = lines[i].trim()

    // Markdown table → render each row as "Term: value"
    if (line.startsWith('|') && lines[i + 1] && /^\|[\s|:-]+\|?$/.test(lines[i + 1].trim())) {
      i += 2
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean)
        const term = cells[0] || '', def = cells.slice(1).join(' — ')
        html += `<div style="margin:4px 0;padding:7px 11px;background:rgba(99,102,241,.07);border-radius:8px;border:1px solid rgba(99,102,241,.15)"><strong style="color:#a5b4fc">${esc(term)}:</strong> ${esc(def)}</div>`
        i++
      }
      continue
    }
    if (/^#{1,4}\s/.test(line)) {
      html += `<div style="font-weight:800;color:#c7d2fe;font-size:14.5px;margin:14px 0 6px;font-family:'Sora',sans-serif">${inline(line.replace(/^#{1,4}\s/, ''))}</div>`
      i++; continue
    }
    if (/^(---|═══)/.test(line)) { html += `<hr style="border:none;border-top:1px solid var(--border);margin:12px 0"/>`; i++; continue }
    if (/^[-•]\s/.test(line)) {
      html += `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#818cf8;flex-shrink:0">•</span><span>${inline(line.replace(/^[-•]\s/, ''))}</span></div>`
      i++; continue
    }
    if (/^\d+\.\s/.test(line)) {
      const n = line.match(/^\d+/)[0]
      html += `<div style="display:flex;gap:8px;margin:3px 0"><span style="color:#818cf8;font-weight:700;flex-shrink:0">${n}.</span><span>${inline(line.replace(/^\d+\.\s/, ''))}</span></div>`
      i++; continue
    }
    if (line.startsWith('📝')) {
      html += `<div style="margin:8px 0;padding:8px 12px;background:rgba(99,102,241,.1);border:1px solid rgba(99,102,241,.25);border-radius:8px;color:#c7d2fe;font-size:13px">${inline(line)}</div>`
      i++; continue
    }
    if (line === '') { html += '<div style="height:6px"></div>'; i++; continue }
    html += `<div style="margin:3px 0;line-height:1.7">${inline(line)}</div>`
    i++
  }
  return html
}


// ── Persistent doubt thread (server = source of truth, localStorage = cache) ──
const DOUBT_THREAD_KEY = 'bs_doubt_thread'
const DOUBT_GREETING = { role: 'assistant', content: "👋 Hi! Ask me any doubt, I'll give you a **clear, step-by-step explanation** tailored to your CBSE syllabus. 🎯", ts: 0 }

function doubtCacheKey(userId) {
  return userId ? `${DOUBT_THREAD_KEY}_${userId}` : DOUBT_THREAD_KEY
}
function loadDoubtThread(userId) {
  try {
    const parsed = JSON.parse(localStorage.getItem(doubtCacheKey(userId)) || 'null')
    if (Array.isArray(parsed) && parsed.length) return parsed
  } catch {}
  return null
}
function saveDoubtThread(userId, msgs) {
  try { localStorage.setItem(doubtCacheKey(userId), JSON.stringify(msgs.slice(-500))) }
  catch (e) { console.warn('[saveDoubtThread]', e.message) }
}
const fmtTime = ts => ts ? new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) : ''

function DoubtSolver({ user, prefill, onClearPrefill }) {
  const [subject,  setSubject]  = useState('Mathematics')
  const [cls,      setCls]      = useState('Class 10')
  const [chapter,  setChapter]  = useState('')
  const [messages, setMessages] = useState(() => loadDoubtThread(user?.id) || [DOUBT_GREETING])
  const [input,    setInput]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const [err,      setErr]      = useState('')
  const bottomRef = useRef(null)
  const interactedRef = useRef(false)   // don't let server hydration wipe a live exchange

  const chapters = getChapters(subject, cls)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  // Load the complete saved thread from the server on mount/refresh
  useEffect(() => {
    let cancelled = false
    api.get('/api/doubt/thread').then(rows => {
      if (cancelled || interactedRef.current) return
      if (Array.isArray(rows) && rows.length) {
        const serverMsgs = rows.map(r => ({
          role: r.role, content: r.content,
          ts: r.ts ? new Date(r.ts).getTime() : 0,
        }))
        const full = [DOUBT_GREETING, ...serverMsgs]
        setMessages(full)
        saveDoubtThread(user?.id, full)
      }
    }).catch(() => {})
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [])

  const chapterContext = chapter ? ` specifically the chapter "${chapter}"` : ''
  const SYSTEM = `You are an expert CBSE/NCERT teacher for ${subject}${chapterContext} (${cls}). Answer strictly within the NCERT syllabus and the way CBSE expects answers in board exams.

RULES:
- Be precise and to the point. No greetings, no filler, no "great question". Get straight to the explanation.
- Use NCERT terminology, definitions, and notation exactly as in the textbook. If the textbook gives a standard definition, state it the standard way first, then explain in simple words.
- For numerical/derivation questions: show clean step-by-step working — Given → Formula → Substitution → Result with correct units. Do NOT show self-correction or rambling; write only the final clean steps.
- For theory questions: answer in the mark-appropriate length a CBSE examiner expects (1-mark = one line, 3-mark = 3-4 key points, 5-mark = full structured answer).
- Bold only the key term on first use. Use short headings or numbered points where it aids clarity.
- Where relevant, add one line "📝 Exam tip:" pointing out what CBSE commonly asks or where students lose marks.
- Stay on the ${cls} and ${subject}level — do not bring in concepts beyond this class's NCERT scope.
- If the question belongs to a different chapter, answer it correctly but note the actual chapter in one short line.
- If a question is outside the syllabus or unclear, say so briefly and ask one focused clarifying question.
- Dont show any latexes as equation, equations should look like equations in textbook
-always be supportive and polite with the user

FORMATTING — the chat renders limited markdown, follow exactly:
- Use **bold** for every heading and every key term. Do NOT use markdown tables.
- Write headings as their own bold line, e.g. **Definition of a Circle**.
- Write term lists one per line as: **Term:** explanation — e.g. **Radius:** the distance from the centre to any point on the circle.
- Use "- " for bullet points and "1. " for numbered steps.
- Always put a colon after the label you are explaining. One idea per line, keep it clean and scannable.`

  async function send() {
    if (!input.trim()) return
    interactedRef.current = true
    const userMsg = { role: 'user', content: input.trim(), ts: Date.now() }
    const withUser = [...messages, userMsg]
    setMessages(withUser); setInput(''); setErr(''); setLoading(true)
    saveDoubtThread(user?.id, withUser)
    try {
      const history = withUser.filter((m, i) => !(i === 0 && m.role === 'assistant'))
      let trimmed = history.slice(-16)
      while (trimmed.length && trimmed[0].role !== 'user') trimmed = trimmed.slice(1)
      const r = await api.post('/api/ai/doubt', { messages: trimmed, system: SYSTEM, subject })
      const aMsg = { role: 'assistant', content: r.content, ts: Date.now() }
      const finalMessages = [...withUser, aMsg]
      setMessages(finalMessages)
      saveDoubtThread(user?.id, finalMessages)
      api.post('/api/doubt/thread', {
        messages: [
          { role: 'user',      content: userMsg.content, subject, chapter, ts: userMsg.ts },
          { role: 'assistant', content: aMsg.content,                       ts: aMsg.ts },
        ],
      }).catch(() => {})
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr(e.message)
    }
    setLoading(false)
  }

  function clearThread() {
    if (!window.confirm('Clear all your doubt history? This cannot be undone.')) return
    interactedRef.current = true
    setMessages([DOUBT_GREETING])
    try { localStorage.removeItem(doubtCacheKey(user?.id)) } catch {}
    api.del('/api/doubt/thread').catch(() => {})
  }

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <PageHeader icon="🤔" title="AI Doubt Solver" subtitle="Ask anything - your full chat history is saved here" color="#6366F1" />
        {messages.length > 1 && (
          <GhostBtn small onClick={clearThread} style={{ flexShrink: 0, marginTop: 4 }}>🗑 Clear</GhostBtn>
        )}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 140px' }}>
          <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
        </div>
        <div style={{ flex: '1 1 120px' }}>
          <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
        </div>
        <div style={{ flex: '2 1 200px' }}>
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: 'All chapters' }, ...chapters.map(c => ({ value: c, label: c }))]}
          />
        </div>
      </div>

      {chapter && (
        <div style={{ fontSize: 12, color: 'var(--accent)', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 8, padding: '6px 12px', marginBottom: 10, fontWeight: 700 }}>
          📌 Context: {subject} › {cls} › {chapter}
        </div>
      )}

      <div style={{ ...T.card, flex: 1, overflowY: 'auto', marginBottom: 14, minHeight: 200, display: 'flex', flexDirection: 'column', gap: 14 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: 10 }}>
            {m.role === 'assistant' && <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, marginTop: 2 }}>🧠</div>}
            <div style={{ maxWidth: '78%' }}>
              <div style={{ padding: '11px 15px', borderRadius: m.role === 'user' ? '14px 4px 14px 14px' : '4px 14px 14px 14px', fontSize: 14, lineHeight: 1.75, background: m.role === 'user' ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'var(--code-bg)', color: m.role === 'user' ? '#fff' : 'var(--text-h)', border: m.role === 'assistant' ? '1px solid var(--border)' : 'none' }}
                dangerouslySetInnerHTML={{ __html: m.role === 'assistant' ? formatDoubtMessage(m.content) : m.content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }} />
              {m.ts ? <div style={{ fontSize: 10, color: 'var(--text)', marginTop: 3, textAlign: m.role === 'user' ? 'right' : 'left', paddingInline: 4 }}>{fmtTime(m.ts)}</div> : null}
            </div>
          </div>
        ))}
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🧠</div>
            <div style={{ background: 'var(--code-bg)', padding: '12px 16px', borderRadius: '4px 14px 14px 14px', border: '1px solid var(--border)', display: 'flex', gap: 5, alignItems: 'center' }}>
              {[0, 1, 2].map(j => <div key={j} style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--accent)', animation: `dotBounce 1s ${j * .2}s infinite ease-in-out` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <ErrMsg msg={err} />
      <div style={{ display: 'flex', gap: 10 }}>
        <input style={{ ...T.input, flex: 1 }} value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()} placeholder={`Ask a ${subject}${chapter ? ` › ${chapter}` : ''} question… (Enter to send)`} disabled={loading} />
        <PrimaryBtn onClick={send} disabled={loading || !input.trim()}>Send →</PrimaryBtn>
      </div>
    </div>
  )
}


function NotesDocument({ content, title, onDownload }) {
  const lines = (content || '').split('\n')
  const mdBold = s =>
    (s || '').replace(/\*\*(.*?)\*\*/g, '<strong style="font-weight:700;color:#1a1a2e">$1</strong>')

  const rendered = lines.map((line, i) => {
    if (line.startsWith('# '))
      return <h2 key={i} style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(20px,3vw,26px)', fontWeight:700, color:'#1a1a2e', margin:'32px 0 12px', paddingBottom:10, borderBottom:'2px solid #e8e6ff' }}>{line.slice(2)}</h2>
    if (line.startsWith('## '))
      return <h3 key={i} style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(16px,2vw,20px)', fontWeight:700, color:'#3730a3', margin:'24px 0 8px' }}>{line.slice(3)}</h3>
    if (line.startsWith('### '))
      return <h4 key={i} style={{ fontSize:15, fontWeight:700, color:'#1e293b', margin:'18px 0 6px', paddingLeft:12, borderLeft:'3px solid #818cf8' }}>{line.slice(4)}</h4>
    if (line.startsWith('- ') || line.startsWith('• '))
      return <div key={i} style={{ display:'flex', gap:10, marginBottom:5, paddingLeft:8 }}><span style={{ color:'#818cf8', flexShrink:0, fontWeight:800, marginTop:1 }}>•</span><span style={{ color:'#374151', fontSize:14.5, lineHeight:1.75 }} dangerouslySetInnerHTML={{ __html: mdBold(line.slice(2)) }}/></div>
    if (/^\d+\./.test(line))
      return <div key={i} style={{ display:'flex', gap:10, marginBottom:5, paddingLeft:8 }}><span style={{ color:'#818cf8', flexShrink:0, fontWeight:800, minWidth:22, fontSize:13 }}>{line.match(/^\d+/)[0]}.</span><span style={{ color:'#374151', fontSize:14.5, lineHeight:1.75 }} dangerouslySetInnerHTML={{ __html: mdBold(line.replace(/^\d+\.\s*/,'')) }}/></div>
    if (line.startsWith('---') || line.startsWith('═══'))
      return <hr key={i} style={{ border:'none', borderTop:'1px solid #e2e8f0', margin:'20px 0' }}/>
    if (line.startsWith('📝'))
      return <div key={i} style={{ background:'#eff6ff', border:'1px solid #bfdbfe', borderRadius:8, padding:'8px 14px', margin:'10px 0', fontSize:13.5, color:'#1d4ed8', fontWeight:600 }} dangerouslySetInnerHTML={{ __html: mdBold(line) }}/>
    if (line.trim() === '')
      return <div key={i} style={{ height:8 }}/>
    const bold = line.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#1a1a2e;font-weight:700">$1</strong>')
    return <p key={i} style={{ color:'#374151', fontSize:14.5, lineHeight:1.8, marginBottom:6 }} dangerouslySetInnerHTML={{ __html: bold }}/>
  })

  return (
    <>
      {/* Load Lora font for the document */}
      <link href="https://fonts.googleapis.com/css2?family=Lora:wght@400;600;700&family=Source+Sans+3:wght@400;600;700&display=swap" rel="stylesheet"/>

      {/* Outer wrapper — parchment/grey background like image 2 */}
      <div style={{ background:'#f0efe9', borderRadius:14, padding:'20px 16px', marginTop:20 }}>

        {/* Toolbar */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#ef4444' }}/>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#f59e0b' }}/>
            <div style={{ width:10, height:10, borderRadius:'50%', background:'#22c55e' }}/>
            <span style={{ fontSize:12, color:'#94a3b8', marginLeft:6, fontFamily:"'Source Sans 3',sans-serif" }}>{title}</span>
          </div>
        <div style={{ display:'flex', gap:8 }}>
  <button onClick={()=>downloadNotesAsPDF(content, title)}
    style={{ display:'flex', alignItems:'center', gap:6, padding:'7px 16px', borderRadius:8, border:'none', background:'#3730a3', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:"'Source Sans 3',sans-serif" }}>
    ⬇ Download PDF
  </button>
</div>
        </div>

        {/* The white document paper */}
        <div style={{ background:'#ffffff', borderRadius:10, padding:'clamp(28px,5vw,64px) clamp(20px,6vw,72px)', boxShadow:'0 4px 24px rgba(0,0,0,0.10)', maxHeight:'72vh', overflowY:'auto' }}>

          {/* Document header */}
          <div style={{ borderBottom:'3px solid #3730a3', paddingBottom:20, marginBottom:32 }}>
            <h1 style={{ fontFamily:"'Lora',Georgia,serif", fontSize:'clamp(22px,4vw,32px)', fontWeight:700, color:'#1a1a2e', lineHeight:1.25, margin:'0 0 10px' }}>
              {title.replace(' Notes — ','').replace(' Notes','')}
            </h1>
            <div style={{ fontSize:13, color:'#64748b', fontWeight:600, fontFamily:"'Source Sans 3',sans-serif" }}>
              {title.includes('—') && <span style={{ color:'#3730a3' }}>{title.split('—')[1]?.trim()}</span>}
              {' · '}CBSE 2024-25
            </div>
          </div>

          {/* Content */}
          <div style={{ fontFamily:"'Source Sans 3','Georgia',sans-serif" }}>
            {rendered}
          </div>

        </div>
      </div>
    </>
  )
}

// ══════════════════════════════════════════════════════════════
//  NOTES MAKER
// ══════════════════════════════════════════════════════════════
function NotesMaker({ user, prefill, onClearPrefill }) {
  const [sel, setSel]       = useState(emptyPicker())
  const [style_, setStyle_] = useState('Detailed')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [err, setErr]       = useState('')

  const [randomTopic, setRandomTopic] = useState('')
  const [randomLoading, setRandomLoading] = useState(false)

  const subject      = sel.subject
  const cls          = sel.cls
  const finalChapter = pickerTopic(sel)
  const ready        = isPickerReady(sel)

  const STYLE_INSTRUCTIONS = {
    'Detailed': `Write in thorough prose under every heading. Explain the "why" behind every concept, not just the "what". Every sub-topic gets its own ### heading with at least 3-4 full paragraphs of explanation.`,
    'Concise': `Write in tight, information-dense paragraphs. No filler. Every sentence must carry a fact, definition, or insight useful for exams.`,
    'Bullet Points': `Use nested bullet points throughout. Main bullets = concepts. Sub-bullets = explanation, example, formula. Every bullet must be a complete, exam-useful thought — not just a label.`,
    'Q&A Format': `Present every concept as a Question followed by a detailed Answer. Use the format:\n**Q: [question]**\nA: [full answer with examples]. Minimum 20 Q&A pairs covering all sub-topics.`,
    'Mind Map Style': `Organize as a hierarchy: Chapter → Topics → Sub-topics → Key facts/formulas/examples. Use indentation and bold headings to show relationships clearly. Still write full explanatory sentences under each node.`,
  }

  const buildPrompt = (contextLine, chapterLabel, subjectLabel, clsLabel) => `You are a world-class CBSE textbook author and examiner with 20+ years of experience. Your task is to write EXHAUSTIVE, publication-quality study notes.

SCOPE: ${contextLine}
SUBJECT: ${subjectLabel} | CLASS: ${clsLabel} | CHAPTER: "${chapterLabel}" | BOARD: CBSE
STYLE: ${style_}

STYLE INSTRUCTION: ${STYLE_INSTRUCTIONS[style_] || STYLE_INSTRUCTIONS['Detailed']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT REQUIREMENTS — YOU MUST FOLLOW ALL OF THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ If SCOPE names a single sub-topic, cover ONLY that sub-topic in complete depth — do NOT summarise the whole chapter. If SCOPE says "full chapter", cover every sub-topic.
✦ MINIMUM LENGTH: 3500 words. Do NOT stop writing until you have covered every single sub-topic completely.
✦ COVER EVERYTHING: List every sub-topic of this chapter from the CBSE textbook and cover each one in depth.
✦ DO NOT SKIP: If you are running out of content, that means you have not gone deep enough. Go deeper.
✦ REAL EXAMPLES: Every concept needs a real-world example or a worked numerical example.
✦ EXAM FOCUS: After every major concept, add a line: "📝 Exam tip: [specific tip for this concept]"
✦ BOLD only key terms on their FIRST use.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${chapterLabel}
**Subject:** ${subjectLabel} | **Class:** ${clsLabel} | **Board:** CBSE 2024-25

---

## 1. 📌 Chapter Overview & Importance
- Where this chapter fits in the bigger picture of ${subjectLabel}
- Real-world relevance and applications
- How many marks this chapter carries in board exams and which types of questions appear
- What you will know by the end of these notes

---

## 2. 🧠 Core Concepts — Full Explanation
### [Write a separate ### sub-section for EVERY concept and sub-topic in this chapter]
For each concept:
- Full definition (formal + in simple language)  
- How it works and WHY it works that way  
- The underlying principle or theory  
- At least one real-world or relatable example  
- Common student confusions about this concept, corrected  
- 📝 Exam tip for this concept

---

## 3. 📐 All Formulas, Laws & Rules
For EVERY formula in this chapter:
- Write the formula clearly
- Define every variable/symbol
- State the units (SI and CGS if applicable)
- Derive it step-by-step where possible (derivations are frequently asked in boards)
- State the conditions under which it applies
- State when it does NOT apply
- Give one solved numerical using each formula
- The formulas should never look like latexes.

---

## 4. 🔢 Solved Examples (Minimum 5)
Pick examples ranging from easy to board-exam level:
- State the problem clearly
- Identify what is given and what is asked
- Write the complete step-by-step solution
- Highlight the key step where most students make errors
- State the final answer with correct units

---

## 5. 🎯 Exam-Pattern Questions with Model Answers
Include ALL question types the CBSE board asks from this chapter:
- 5 × 1-mark questions (with answers)
- 4 × 2-mark questions (with answers)
- 3 × 3-mark questions (with answers)
- 2 × 5-mark questions (with answers)
For each, write a complete model answer as a CBSE examiner would expect it.

---

## 6. ⚡ Quick Revision — Chapter at a Glance
- All definitions in one line each
- All formulas listed together
- All laws/rules in one line each
- Key relationships between concepts (e.g. "If X increases, Y decreases because...")
- The 5 most important facts to remember before the exam

---

## 7. ⚠️ Common Mistakes & How to Avoid Them
List at least 8 specific mistakes students make in this chapter in exams.
For each: describe the mistake, explain why it is wrong, show the correct approach.

---

## 8. 📅 Previous Year CBSE Question Patterns
- Which sub-topics are asked most frequently (last 5 years trend)
- Which sub-topics carry the most marks
- Which sub-topics are likely to appear this year
- Specific previous year questions (2019-2024) from this chapter with answers

---

## 9. 🔗 Connections to Other Chapters
- Which previous chapters are prerequisites for understanding this chapter
- Which future chapters build on what you learn here
- How this chapter connects to real-world problems or other subjects

---

FINAL REMINDER: You must write AT LEAST 3500 words. Every section above must be fully populated with real, detailed, exam-relevant content. Do not write placeholder text or headings without content.`

  useEffect(() => {
    if (!prefill) return
    setSel(s => ({ ...s, subject: prefill.subject || s.subject, chapter: prefill.chapter || s.chapter, cls: prefill.cls || s.cls, subTopicChoice: 'full', customText: '' }))
    onClearPrefill?.()
    loadSavedContent('notes', prefill.subject, prefill.chapter, []).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [prefill])

  const notesCacheKey = (subj, clsLabel, chapterLabel) => {
    const safe = s => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 24)
    return `bsnotes-${safe(subj)}-${safe(clsLabel)}-${safe(chapterLabel)}-${safe(style_)}`
  }

  async function generate() {
    if (!ready) return
    setErr(''); setLoading(true); setSaved(false)
    try {
      const key = notesCacheKey(subject, cls, finalChapter)
      const shared = await api.get(`/api/shared-notes/${key}`).catch(() => null)
      if (shared?.content) { setResult(shared.content); setLoading(false); return }
      const prompt = buildPrompt(pickerContext(sel), finalChapter, subject, cls)
      const r = await api.post('/api/ai/notes', { messages: [{ role: 'user', content: prompt }], subject, chapter: finalChapter })
      setResult(r.content)
      try { await api.post('/api/shared-notes', { subject, classLevel: cls, chapter: finalChapter, style: style_, content: r.content }) } catch {}
      saveSessionContent({ tool: 'notes', subject, chapter: finalChapter, classLevel: cls, content: r.content })
    } catch (e) { if (e.status === 402) { setErr('Free trial ended. Please subscribe.') } else { setErr(e.message) } }
    setLoading(false)
  }

  async function generateRandom() {
    if (!randomTopic.trim()) return
    setErr(''); setRandomLoading(true); setSaved(false)
    const topic = randomTopic.trim()
    try {
      const key = notesCacheKey('General', sel.cls, topic)
      const shared = await api.get(`/api/shared-notes/${key}`).catch(() => null)
      if (shared?.content) { setResult(shared.content); setRandomLoading(false); return }
      const prompt = buildPrompt(randomTopicContext(topic, sel.cls), topic, 'General', sel.cls)
      const r = await api.post('/api/ai/notes', { messages: [{ role: 'user', content: prompt }], subject: 'General', chapter: topic })
      setResult(r.content)
      try { await api.post('/api/shared-notes', { subject: 'General', classLevel: sel.cls, chapter: topic, style: style_, content: r.content }) } catch {}
      saveSessionContent({ tool: 'notes', subject: 'General', chapter: topic, classLevel: sel.cls, content: r.content })
    } catch (e) { if (e.status === 402) { setErr('Free trial ended. Please subscribe.') } else { setErr(e.message) } }
    setRandomLoading(false)
  }

  async function saveNote() { try { await api.post('/api/user/notes', { subject, classLevel: cls, chapter: finalChapter, style: style_, content: result }); setSaved(true) } catch (e) { alert(e.message) } }

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito',sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="📖" title="Chapter Notes Maker" subtitle="Class → Subject → Chapter → Sub Topic → textbook-quality notes - download or print as PDF" color="#10B981" />

      <Card style={{ marginBottom: 4 }}>
        <LessonPicker value={sel} onChange={setSel} accent="#10B981" />
        <Field label="Notes Style"><BSSelect value={style_} onChange={setStyle_} options={['Detailed', 'Concise', 'Bullet Points', 'Q&A Format', 'Mind Map Style']} /></Field>
        <PrimaryBtn onClick={generate} disabled={loading || !ready} color="#10B981">{loading ? <><Spinner /> Generating notes...</> : '📖 Generate Comprehensive Notes'}</PrimaryBtn>
        {loading && (
          <div style={{ marginTop: 12, padding: '10px 14px', borderRadius: 10, background: 'rgba(16,185,129,.08)', border: '1px solid rgba(16,185,129,.25)', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'Nunito', sans-serif" }}>
            <Spinner size={16} />
            <span style={{ fontSize: 13, color: '#10B981', fontWeight: 700 }}>
              ⏳ Please wait 30–40 seconds — we're writing comprehensive, exam-ready notes for you. Don't close or switch tabs.
            </span>
          </div>
        )}
      </Card>

      <RandomTopicBox
        value={randomTopic}
        onChange={setRandomTopic}
        onGenerate={generateRandom}
        loading={randomLoading}
        accent="#10B981"
        buttonLabel="📖 Generate"
      />

      <ErrMsg msg={err} />
      {result && <>
        <NotesDocument
          content={result}
          title={`${finalChapter} Notes — ${subject || 'General'} ${cls}`}
          onDownload={() => downloadText(result, `${finalChapter}-notes.txt`)}
        />
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          {!saved ? <GhostBtn small onClick={saveNote}>💾 Save to Library</GhostBtn> : <SuccessMsg msg="Saved to Library!" />}
        </div>
      </>}
      <XPBadge amount={20} label="per notes generated" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CHEAT SHEET MAKER
// ══════════════════════════════════════════════════════════════
function CheatSheetMaker({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapters,setChapters]=useState([]); const [examDate,setExamDate]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')

  const buildPrompt=()=>`You are the world's best CBSE exam preparation expert. Create a COMPREHENSIVE 3-hour exam cheat sheet.
Subject: ${subject} | Class: ${cls} | Chapters: ${chapters.join(', ')}${examDate?` | Exam Date: ${examDate}`:''}
MINIMUM 2500 words.

# 🎯 EXAM CHEAT SHEET: ${subject} — ${cls}
## ⏱️ 3-HOUR STUDY STRATEGY
${chapters.map(ch=>`
## 📚 ${ch}
### ⚡ Key Formulas & Laws
### 📝 Must-Know Definitions (5-8 most important)
### 🎯 Top 15 Exam Questions + Model Answers
### ⚠️ Common Mistakes`).join('\n')}
## 📊 FINAL EXAM STRATEGY & SCORING TIPS`

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapters?.length) setChapters(prefill.chapters)
    else if (prefill.chapter) setChapters([prefill.chapter])
    onClearPrefill?.()
    loadSavedContent('cheatsheet', prefill.subject, prefill.chapter, prefill.chapters).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [])

  async function generate() {
    if(chapters.length===0) return alert('Please select at least one chapter')
    setErr(''); setLoading(true); setSaved(false)
    try{ const r=await api.post('/api/ai/cheatsheet',{messages:[{role:'user',content:buildPrompt()}],subject,chapters}); setResult(r.content)
  saveSessionContent({ tool:'cheatsheet', subject, chapters, classLevel:cls, content:r.content }) }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:4 }}>
        <PageHeader icon="📋" title="3-Hour Exam Cheat Sheet" subtitle="Top questions, formulas, predictions, scoring strategy" color="#F97316"/>
        <span style={{ background:'#F97316', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content' }}>STUDENT ONLY</span>
      </div>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapters([])}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v=>{setCls(v);setChapters([])}} options={CLASSES}/></Field>
        </div>
        <Field label="Select Chapters"><ChapterSelector subject={subject} cls={cls} selected={chapters} onChange={setChapters}/></Field>
        <Field label="Exam Date (optional)"><input type="date" style={{ ...T.input, maxWidth:220 }} value={examDate} onChange={e=>setExamDate(e.target.value)} min={new Date().toISOString().split('T')[0]}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||chapters.length===0} gradient="linear-gradient(135deg,#F97316,#F59E0B)">{loading?<><Spinner/> Generating cheat sheet...</>:`🎯 Generate Cheat Sheet (${chapters.length} chapter${chapters.length!==1?'s':''})`}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Exam Cheat Sheet — ${subject} | ${chapters.join(', ')}`} downloadName={`cheatsheet-${subject}-${cls}.txt`} onDownload={()=>downloadText(result,`cheatsheet-${subject}-${cls}.txt`)}/>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/cheatsheets',{subject,classLevel:cls,chapters,examDate,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUESTION PAPER MAKER
// ══════════════════════════════════════════════════════════════
function QPMaker({ user, prefill, onClearPrefill }) {
  const [subject, setSubject] = useState('Mathematics')
  const [cls, setCls] = useState('Class 10')
  const [chapters, setChapters] = useState([])
  const [marks, setMarks] = useState('80')
  const [duration, setDuration] = useState('3 Hours')
  const [desc, setDesc] = useState('')
  const [paper, setPaper] = useState(null)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [schoolName, setSchoolName] = useState('')

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapters?.length) setChapters(prefill.chapters)
    else if (prefill.chapter) setChapters([prefill.chapter])
    onClearPrefill?.()
  }, [])

  const buildPrompt = () => {
  const totalMarks = parseInt(marks)

  // ── Exact distribution calculator ──────────────────────────
  let nA = 0, nB = 0, nC = 0, nD = 0

  if (totalMarks <= 20) {
    nA = Math.ceil(totalMarks * 0.5)
    nB = Math.floor((totalMarks - nA) / 2)
    // absorb any remainder into nA
    const rem = totalMarks - (nA * 1) - (nB * 2)
    if (rem > 0) nA += rem
  } else if (totalMarks <= 40) {
    nA = Math.round(totalMarks * 0.25)
    nB = Math.round((totalMarks * 0.375) / 2)
    nC = Math.round((totalMarks * 0.375) / 3)
  } else {
    nA = Math.round(totalMarks * 0.25)
    nB = Math.round((totalMarks * 0.25) / 2)
    nC = Math.round((totalMarks * 0.25) / 3)
    nD = Math.round((totalMarks * 0.25) / 5)
  }

  // ── Fix rounding so it sums to exactly totalMarks ───────────
  let gap = totalMarks - (nA*1 + nB*2 + nC*3 + nD*5)
  let safety = 50
  while (gap !== 0 && safety-- > 0) {
    if      (gap >= 5)  { nD++; gap -= 5 }
    else if (gap >= 3)  { nC++; gap -= 3 }
    else if (gap >= 2)  { nB++; gap -= 2 }
    else if (gap >= 1)  { nA++; gap -= 1 }
    else if (gap <= -5 && nD > 0) { nD--; gap += 5 }
    else if (gap <= -3 && nC > 0) { nC--; gap += 3 }
    else if (gap <= -2 && nB > 0) { nB--; gap += 2 }
    else if (gap <= -1 && nA > 0) { nA--; gap += 1 }
    else break
  }

  const secA = nA*1, secB = nB*2, secC = nC*3, secD = nD*5
  const totalQ = nA + nB + nC + nD
  const computed = secA + secB + secC + secD

  // Verify — should always be 0
  console.log(`[QPMaker] ${totalMarks}M → A:${nA}×1=${secA} B:${nB}×2=${secB} C:${nC}×3=${secC} D:${nD}×5=${secD} = ${computed} (gap:${totalMarks - computed})`)

  // ── Sequential question numbering ───────────────────────────
  let q = 1
  const a1 = q,         a2 = q + nA - 1;       q += nA
  const b1 = q,         b2 = q + nB - 1;       q += nB
  const c1 = q,         c2 = q + nC - 1;       q += nC
  const d1 = q,         d2 = q + nD - 1

  // ── Build example question templates per section ─────────────
  const makeExampleMCQ = (num) =>
    `{"number":${num},"text":"Write your question here","options":["A. option one","B. option two","C. option three","D. option four"],"marks":1,"answer":"A. option one","solution":"Explanation why A is correct"}`

  const makeExampleShort = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":2,"answer":"Model answer in 2-3 sentences","solution":"Step-by-step working"}`

  const makeExampleMedium = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":3,"answer":"Detailed model answer","solution":"Complete step-by-step solution"}`

  const makeExampleLong = (num) =>
    `{"number":${num},"text":"Write your question here","options":[],"marks":5,"answer":"Comprehensive model answer","solution":"Full detailed solution with all steps"}`

  return `You are a senior CBSE examiner with 20 years of experience setting board papers.

═══════════════════════════════════════════════════════
PAPER SPECIFICATION — FOLLOW EVERY POINT EXACTLY
═══════════════════════════════════════════════════════
Subject    : ${subject}
Class      : ${cls}
Chapters   : ${chapters.join(', ')}
Total Marks: ${totalMarks}
Duration   : ${duration}
${desc ? `Special Notes: ${desc}` : ''}

MANDATORY SECTION BREAKDOWN — DO NOT CHANGE THESE NUMBERS:
${nA > 0 ? `Section A : ${nA} MCQ questions  ×  1 mark  =  ${secA} marks  (Q${a1}–Q${a2})` : ''}
${nB > 0 ? `Section B : ${nB} short questions ×  2 marks =  ${secB} marks  (Q${b1}–Q${b2})` : ''}
${nC > 0 ? `Section C : ${nC} questions       ×  3 marks =  ${secC} marks  (Q${c1}–Q${c2})` : ''}
${nD > 0 ? `Section D : ${nD} long questions  ×  5 marks =  ${secD} marks  (Q${d1}–Q${d2})` : ''}
GRAND TOTAL: ${computed} marks  ← must match exactly

NON-NEGOTIABLE RULES:
1. Section A questions MUST have "marks": 1  (exactly 1, never 2 or more)
2. Section B questions MUST have "marks": 2  (exactly 2, never 1 or 3)
3. Section C questions MUST have "marks": 3  (exactly 3, never 2 or 5)
4. Section D questions MUST have "marks": 5  (exactly 5, never 3 or 4)
5. Question numbers must run sequentially from 1 to ${totalQ} — no gaps, no repeats
6. Section A options: exactly 4, labeled "A. ...", "B. ...", "C. ...", "D. ..."
7. Section B/C/D options: empty array []
8. ZERO emojis, ZERO asterisks, ZERO markdown, ZERO special symbols in any field
9. Questions must be genuinely exam-quality, CBSE-standard, chapter-appropriate
10. Every question needs a correct "answer" and a brief "solution"
═══════════════════════════════════════════════════════

Return ONLY this exact JSON (no markdown fences, no explanation before or after):

{
  "header": {
    "subject": "${subject}",
    "class_level": "${cls}",
    "board": "CBSE",
    "max_marks": ${totalMarks},
    "duration": "${duration}",
    "year": "2024-25"
  },
  "general_instructions": [
    "All questions are compulsory.",
    "This paper consists of ${totalQ} questions in ${[nA>0,nB>0,nC>0,nD>0].filter(Boolean).length} sections.",
    ${nA > 0 ? `"Section A: ${nA} Multiple Choice Questions of 1 mark each.",` : ''}
    ${nB > 0 ? `"Section B: ${nB} Short Answer Questions of 2 marks each.",` : ''}
    ${nC > 0 ? `"Section C: ${nC} Questions of 3 marks each.",` : ''}
    ${nD > 0 ? `"Section D: ${nD} Long Answer Questions of 5 marks each.",` : ''}
    "Draw neat, labelled diagrams wherever required.",
    "Show all working steps to earn full credit."
  ],
  "sections": [
    ${nA > 0 ? `{
      "name": "Section A",
      "type": "mcq",
      "description": "Multiple Choice Questions. Select the most appropriate answer. (${nA} x 1 = ${secA} Marks)",
      "marks_per_question": 1,
      "questions": [
        ${Array.from({length: nA}, (_, i) => makeExampleMCQ(a1 + i)).join(',\n        ')}
      ]
    }` : ''}${nA > 0 && nB > 0 ? ',' : ''}
    ${nB > 0 ? `{
      "name": "Section B",
      "type": "short",
      "description": "Short Answer Questions. Answer in 2-3 sentences. (${nB} x 2 = ${secB} Marks)",
      "marks_per_question": 2,
      "questions": [
        ${Array.from({length: nB}, (_, i) => makeExampleShort(b1 + i)).join(',\n        ')}
      ]
    }` : ''}${nB > 0 && nC > 0 ? ',' : ''}
    ${nC > 0 ? `{
      "name": "Section C",
      "type": "medium",
      "description": "Answer the following questions. (${nC} x 3 = ${secC} Marks)",
      "marks_per_question": 3,
      "questions": [
        ${Array.from({length: nC}, (_, i) => makeExampleMedium(c1 + i)).join(',\n        ')}
      ]
    }` : ''}${nC > 0 && nD > 0 ? ',' : ''}
    ${nD > 0 ? `{
      "name": "Section D",
      "type": "long",
      "description": "Long Answer Questions. Answer in detail. (${nD} x 5 = ${secD} Marks)",
      "marks_per_question": 5,
      "questions": [
        ${Array.from({length: nD}, (_, i) => makeExampleLong(d1 + i)).join(',\n        ')}
      ]
    }` : ''}
  ]
}`
}

  // ── Validate and fix marks after parsing ───────────────────
function validateAndFixPaper(parsed) {
  const sectionMarkMap = { mcq: 1, short: 2, medium: 3, long: 5 }
  let runningNum = 1

  for (const sec of parsed.sections || []) {
    const expectedMarks = sectionMarkMap[sec.type] || sec.marks_per_question || 1
    for (const q of sec.questions || []) {
      // Force correct marks regardless of what AI returned
      q.marks = expectedMarks
      // Fix sequential numbering
      q.number = runningNum++
      // Remove any stray symbols from text
      q.text = (q.text || '').replace(/\*\*/g, '').replace(/[^\x00-\x7F]/g, '').trim()
      q.answer = (q.answer || '').replace(/\*\*/g, '').trim()
      q.solution = (q.solution || '').replace(/\*\*/g, '').trim()
      // Fix options
      if (q.options) q.options = q.options.map(o => o.replace(/\*\*/g, '').replace(/[^\x00-\x7F]/g, '').trim())
    }
  }
  return parsed
}

// Inside generate():
async function generate() {
  if (chapters.length === 0) return alert('Please select at least one chapter')
  setErr(''); setLoading(true); setSaved(false); setPaper(null)
  try {
    const r = await api.post('/api/ai/paper', {
      messages: [{ role: 'user', content: buildPrompt() }],
      subject, chapters
    })
    const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
    let parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
    if (!parsed.sections) throw new Error('Invalid paper structure')

    // ✅ Always fix marks and numbering after AI response
    parsed = validateAndFixPaper(parsed)

    // ✅ Show mark summary in UI
    const total = parsed.sections.reduce((sum, sec) =>
      sum + sec.questions.reduce((s, q) => s + q.marks, 0), 0)
    if (total !== parseInt(marks)) {
      console.warn(`[QPMaker] Mark mismatch: expected ${marks}, got ${total}`)
    }

    setPaper(parsed)
    saveSessionContent({ tool:'paper', subject, chapters, classLevel:cls, content:parsed, extra:{ marks, duration } })
  } catch (e) {
    if (e.status === 402) setErr('Free trial ended. Please subscribe.')
    else setErr('Failed to generate paper. Try again.')
  }
  setLoading(false)
}

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="📄" title="Question Paper Maker" subtitle="Standard CBSE papers with answer key — edit questions inline, print or download PDF" color="#8B5CF6"/>

      <Card style={{ marginBottom: 18 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 16, marginBottom: 4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v => { setSubject(v); setChapters([]) }} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={v => { setCls(v); setChapters([]) }} options={CLASSES}/></Field>
          <Field label="Total Marks"><BSSelect value={marks} onChange={setMarks} options={['10','20','25','30','40','50','60','70','80','100']}/></Field>
          <Field label="Duration"><BSSelect value={duration} onChange={setDuration} options={['30 min','45 min','1 Hour','1.5 Hours','2 Hours','2.5 Hours','3 Hours']}/></Field>
        </div>
        <Field label="School Name (for header)">
          <BSInput value={schoolName} onChange={setSchoolName} placeholder="e.g. Delhi Public School"/>
        </Field>
        <Field label={`Select Chapters${chapters.length > 0 ? ` (${chapters.length} selected)` : ''}`}>
  <MultiChapterSelect subject={subject} cls={cls} selected={chapters} onChange={setChapters} />
</Field>
        <Field label="Additional Instructions (optional)">
          <BSTextarea value={desc} onChange={setDesc} rows={2} placeholder="e.g. 'Focus on derivations', 'Include case study', 'Competency-based questions'"/>
        </Field>
        <PrimaryBtn onClick={generate} disabled={loading || chapters.length === 0} color="#8B5CF6">
          {loading ? <><Spinner/> Generating paper...</> : `📄 Generate ${marks}M Paper`}
        </PrimaryBtn>
      </Card>

      <ErrMsg msg={err}/>

      {paper && (
        <>
          <QPaperDocument
            paper={paper}
            onPaperChange={setPaper}
            schoolName={schoolName}
            onSchoolNameChange={setSchoolName}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            {!saved
              ? <GhostBtn small onClick={async () => {
                  try {
                    await api.post('/api/user/papers', { subject, classLevel: cls, chapters, marks: parseInt(marks), duration, description: desc, content: JSON.stringify(paper) })
                    setSaved(true)
                  } catch (e) { alert(e.message) }
                }}>💾 Save Paper</GhostBtn>
              : <SuccessMsg msg="Saved!"/>
            }
          </div>
        </>
      )}
      <XPBadge amount={25} label="per paper generated"/>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  LESSON PLANNER
// ══════════════════════════════════════════════════════════════
function LessonPlanner({ user, prefill, onClearPrefill }) {
  const [subject,setSubject]=useState('Mathematics'); const [topic,setTopic]=useState(''); const [cls,setCls]=useState('Class 9'); const [duration,setDuration]=useState(45); const [notes,setNotes]=useState('')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState(''); const [rating,setRating]=useState(0)


  const buildPrompt=()=>`You are a world-class master teacher and pedagogy expert. Create an exceptional, fully detailed lesson plan for "${topic}" — ${subject} ${cls} — ${duration} minutes.
Teacher's context: ${notes||'Standard classroom with mixed ability students'}
MINIMUM 1500 words. This must be genuinely useful and specific.

# 🎓 MASTER LESSON PLAN: ${topic}
**Subject:** ${subject} | **Class:** ${cls} | **Duration:** ${duration} minutes

## ⚡ LESSON SNAPSHOT
(Learning objectives, prerequisites, materials needed)

## ⏱️ MINUTE-BY-MINUTE PLAN
### 🚀 OPENING: Hook & Connect [0:00 – ${Math.round(duration*.1)}:00]
(Exact opening statement, hook activity, connecting to prior knowledge)

### 📖 MAIN TEACHING [${Math.round(duration*.1)}:00 – ${Math.round(duration*.6)}:00]
(Step-by-step teaching with exact explanations, board work, examples)

### 🔧 WORKED EXAMPLES [${Math.round(duration*.6)}:00 – ${Math.round(duration*.75)}:00]
(2-3 solved examples with full working)

### 💬 SOCRATIC QUESTIONS TO ASK
(10 questions from basic to challenging to check understanding)

### 🎯 CLOSING & ASSESSMENT [${Math.round(duration*.75)}:00 – ${duration}:00]
(Summary, exit ticket, homework)

## 🏆 DIFFERENTIATION STRATEGIES
## 📊 ASSESSMENT CRITERIA
## 🔗 CONNECTIONS TO CBSE EXAM`

  
  useEffect(() => {
  if (!prefill) return
  if (prefill.subject) setSubject(prefill.subject)
  if (prefill.chapter) setTopic(prefill.chapter)   // topic = chapter for lesson plans
  onClearPrefill?.()
  loadSavedContent('lessonplan', prefill.subject, prefill.chapter, []).then(content => {
    if (content) { setResult(content); setSaved(true) }
  })
}, [])

  async function generate() {
    if(!topic.trim()) return alert('Please enter a topic')
    setErr(''); setLoading(true); setSaved(false); setRating(0)
    try{ const r=await api.post('/api/ai/lessonplan',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:topic}); setResult(r.content) 
  saveSessionContent({ tool:'cheatsheet', subject, chapters, classLevel:cls, content:r.content })}
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <div style={{ display:'flex', alignItems:'flex-start', gap:12, marginBottom:4 }}>
        <PageHeader icon="🎓" title="AI Lesson Planner" subtitle="Minute-by-minute plans with teaching scripts and Socratic questions" color="#7C3AED"/>
        <span style={{ background:'#7C3AED', color:'#fff', borderRadius:20, padding:'2px 12px', fontSize:11, fontWeight:800, flexShrink:0, height:'fit-content', marginTop:6 }}>TEACHER ONLY</span>
      </div>
      <Card style={{ marginBottom:18, borderColor:'#7C3AED' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={setSubject} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Topic to Teach"><BSInput value={topic} onChange={setTopic} placeholder="e.g. Quadratic Equations, Photosynthesis, French Revolution"/></Field>
        <Field label={`Teaching Duration: ${duration} minutes`}>
          <input type="range" min={20} max={90} step={5} value={duration} onChange={e=>setDuration(+e.target.value)} style={{ width:'100%', accentColor:'#7C3AED', marginBottom:4 }}/>
          <div style={{ display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--text)', fontWeight:600 }}><span>20 min</span><span style={{ fontWeight:800, color:'#7C3AED' }}>{duration} min</span><span>90 min</span></div>
        </Field>
        <Field label="Your Notes (optional)"><BSTextarea value={notes} onChange={setNotes} rows={3} placeholder="e.g. 'Students already know linear equations. I want real-world examples. Class is weak in algebra.'"/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||!topic.trim()} gradient="linear-gradient(135deg,#7C3AED,#6366F1)">{loading?<><Spinner/> Crafting your lesson plan...</>:'🎓 Generate Master Lesson Plan'}</PrimaryBtn>
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
        <ContentBox content={result} label={`Lesson Plan: ${topic} — ${subject} ${cls}`} downloadName={`lesson-${topic.replace(/\s+/g,'-')}.txt`} onDownload={()=>downloadText(result,`lesson-plan-${topic.replace(/\s+/g,'-')}-${duration}min.txt`)}/>
        <Card style={{ marginTop:12, display:'flex', alignItems:'center', gap:14 }}>
          <span style={{ fontSize:13.5, fontWeight:700, color:'var(--text)' }}>How was this plan?</span>
          {[1,2,3,4,5].map(n=>(<span key={n} onClick={()=>setRating(n)} style={{ fontSize:22, cursor:'pointer', opacity:n<=rating?1:.3, transition:'opacity .2s' }}>⭐</span>))}
          {rating>0&&<span style={{ fontSize:12.5, color:'#6ee7b7', fontWeight:700 }}>Thank you!</span>}
        </Card>
        <div style={{ display:'flex', gap:8, marginTop:12 }}>
          {!saved?<GhostBtn small onClick={async()=>{try{await api.post('/api/user/lessonplans',{subject,topic,classLevel:cls,durationMinutes:duration,customPrompt:notes,content:result});setSaved(true)}catch(e){alert(e.message)}}}>💾 Save</GhostBtn>:<SuccessMsg msg="Saved!"/>}
        </div>
      </>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  QUIZ GENERATOR
// ══════════════════════════════════════════════════════════════
function QuizGenerator({ user, prefill, onClearPrefill }) {
  const [sel, setSel]     = useState(emptyPicker())
  const [diff, setDiff]   = useState('Medium')
  const [num, setNum]     = useState('5')
  const [quiz, setQuiz]   = useState(null)
  const [answers, setAnswers]     = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading]     = useState(false)
  const [err, setErr]             = useState('')
  const [timeLeft, setTimeLeft]   = useState(null)
  const [timerId, setTimerId]     = useState(null)
  const [timeUp, setTimeUp]       = useState(false)
  const [finalScore, setFinalScore] = useState(null)

  const [randomTopic, setRandomTopic] = useState('')
  const [randomLoading, setRandomLoading] = useState(false)

  const topic          = pickerTopic(sel)
  const ready          = isPickerReady(sel)
  const subjectForSave = sel.subject
  const SECS_PER_Q = { Easy: 30, Medium: 45, Hard: 60, Mixed: 45 }

  useEffect(() => {
    if (!quiz) return
    const totalSecs = parseInt(num) * (SECS_PER_Q[diff] || 45)
    setTimeLeft(totalSecs); setTimeUp(false)
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id); setTimeUp(true); setSubmitted(true)
          const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
          setFinalScore({ correct, xpEarned: Math.round((correct / quiz.questions.length) * 50) + 5 })
          saveSessionContent({ tool: 'quiz', subject: quiz.subjectUsed, chapter: quiz.topicUsed, classLevel: sel.cls, content: { ...quiz, score: correct, total: quiz.questions.length, timeUp: true } })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimerId(id)
    return () => clearInterval(id)
  }, [quiz])

  useEffect(() => () => { if (timerId) clearInterval(timerId) }, [timerId])

  useEffect(() => {
    if (!prefill) return
    setSel(s => ({ ...s, subject: prefill.subject || s.subject, chapter: prefill.chapter || s.chapter, cls: prefill.cls || s.cls, subTopicChoice: 'full', customText: '' }))
    onClearPrefill?.()
  }, [prefill])

  const cleanQuiz = parsed => {
    const BAD = /\b(wait|let me|recalculat|recheck|actually|however|revising|correcting|reconsider|hmm|option [0-9]|answer should be)\b/i
    parsed.questions = (parsed.questions || []).map(q => {
      if (q.explanation && BAD.test(q.explanation)) {
        const clean = q.explanation.split(/(?<=[.!?])\s+/).filter(s => !BAD.test(s)).join(' ').trim()
        q.explanation = clean || 'See the correct option marked above.'
      }
      return q
    })
    return parsed
  }

  async function generate() {
    if (!ready) return
    const subject = subjectForSave
    const PROMPT = `You are a CBSE examiner creating a ${num}-question multiple-choice quiz.
SCOPE: ${pickerContext(sel)}
Difficulty: ${diff}.

RULES — follow every one:
1. Solve each question completely BEFORE writing. Decide the correct answer first.
2. Write ONLY the final, polished explanation in 1-2 sentences. Never show your working.
3. FORBIDDEN in "explanation": "wait","let me","recalculate","rechecking","actually","however","revising","correcting","hmm","answer should be","reconsider".
4. "answer" is the 0-based index (0,1,2,3) of the correct option and MUST match your solved result.
5. Exactly ONE option correct; three plausible distractors.
6. If SCOPE names a sub-topic, keep every question inside that sub-topic only.
7. Output VALID JSON ONLY — no markdown.

Format:
{"title":"${topic} Quiz","questions":[{"q":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"Short reason."}]}`
    setErr(''); setLoading(true); setQuiz(null)
    try {
      const r = await api.post('/api/ai/quiz', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = cleanQuiz(JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim()))
      parsed.subjectUsed = subject; parsed.topicUsed = topic
      setQuiz(parsed)
      saveSessionContent({ tool: 'quiz', subject, chapter: topic, classLevel: sel.cls, content: parsed })
      setAnswers({}); setSubmitted(false)
    } catch (e) { setErr(e.status === 402 ? 'Free trial ended. Please subscribe.' : 'Failed to generate quiz. Try again.') }
    setLoading(false)
  }

  async function generateRandom() {
    if (!randomTopic.trim()) return
    const topicR = randomTopic.trim()
    const PROMPT = `You are a CBSE examiner creating a ${num}-question multiple-choice quiz.
SCOPE: ${randomTopicContext(topicR, sel.cls)}
Difficulty: ${diff}.

RULES — follow every one:
1. Solve each question completely BEFORE writing. Decide the correct answer first.
2. Write ONLY the final, polished explanation in 1-2 sentences. Never show your working.
3. FORBIDDEN in "explanation": "wait","let me","recalculate","rechecking","actually","however","revising","correcting","hmm","answer should be","reconsider".
4. "answer" is the 0-based index (0,1,2,3) of the correct option and MUST match your solved result.
5. Exactly ONE option correct; three plausible distractors.
6. Output VALID JSON ONLY — no markdown.

Format:
{"title":"${topicR} Quiz","questions":[{"q":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"Short reason."}]}`
    setErr(''); setRandomLoading(true); setQuiz(null)
    try {
      const r = await api.post('/api/ai/quiz', { messages: [{ role: 'user', content: PROMPT }], subject: 'General', chapter: topicR })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = cleanQuiz(JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim()))
      parsed.subjectUsed = 'General'; parsed.topicUsed = topicR
      setQuiz(parsed)
      saveSessionContent({ tool: 'quiz', subject: 'General', chapter: topicR, classLevel: sel.cls, content: parsed })
      setAnswers({}); setSubmitted(false)
    } catch (e) { setErr(e.status === 402 ? 'Free trial ended. Please subscribe.' : 'Failed to generate quiz. Try again.') }
    setRandomLoading(false)
  }

  async function submit() {
    if (timerId) clearInterval(timerId)
    setSubmitted(true)
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
    setFinalScore({ correct, xpEarned: Math.round((correct / quiz.questions.length) * 50) + 5 })
    saveSessionContent({ tool: 'quiz', subject: quiz.subjectUsed, chapter: quiz.topicUsed, classLevel: sel.cls, content: { ...quiz, score: correct, total: quiz.questions.length } })
    try { await api.post('/api/user/quiz-history', { subject: quiz.subjectUsed, topic: quiz.topicUsed, difficulty: diff, totalQuestions: quiz.questions.length, correctAnswers: correct, xpEarned: Math.round((correct / quiz.questions.length) * 50) + 5, isPerfect: correct === quiz.questions.length }) } catch {}
  }

  const score = submitted ? quiz.questions.filter((q, i) => answers[i] === q.answer).length : 0
  const pct   = submitted ? Math.round((score / quiz.questions.length) * 100) : 0

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🎯" title="Quiz Generator" subtitle="Pick class, subject, chapter and sub-topic - get a timed MCQ quiz with instant scoring" color="#F59E0B" />

      {!quiz ? (
        <>
          <Card>
            <LessonPicker value={sel} onChange={setSel} accent="#F59E0B" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 4 }}>
              <Field label="Questions"><BSSelect value={num} onChange={setNum} options={['5', '8', '10', '15']} /></Field>
              <Field label="Difficulty"><BSSelect value={diff} onChange={setDiff} options={['Easy', 'Medium', 'Hard', 'Mixed']} /></Field>
            </div>
            <ErrMsg msg={err} />
            <PrimaryBtn onClick={generate} disabled={loading || !ready} color="#F59E0B" style={{ marginTop: 4 }}>
              {loading ? <><Spinner /> Generating…</> : '✨ Generate Quiz'}
            </PrimaryBtn>
          </Card>

          <RandomTopicBox
            value={randomTopic}
            onChange={setRandomTopic}
            onGenerate={generateRandom}
            loading={randomLoading}
            accent="#F59E0B"
            buttonLabel="🎯 Generate"
          />
        </>
      ) : (
        <div>
          {!submitted && timeLeft !== null && (
            <div style={{ marginBottom: 16, background: 'var(--bg2)', border: `1px solid ${timeLeft <= 30 ? 'rgba(239,68,68,.4)' : 'var(--border)'}`, borderRadius: 12, padding: '10px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft <= 30 ? '#fca5a5' : 'var(--text-h)' }}>{timeLeft <= 30 ? '⚠️' : '⏱'} Time Remaining</span>
                <span style={{ fontFamily: "'Sora', monospace", fontWeight: 900, fontSize: 20, color: timeLeft <= 30 ? '#ef4444' : 'var(--accent)', animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none', letterSpacing: 1 }}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 999, height: 6 }}>
                <div style={{ background: timeLeft <= 30 ? '#ef4444' : timeLeft <= 60 ? '#f59e0b' : 'var(--accent)', width: `${(timeLeft / (parseInt(num) * (SECS_PER_Q[diff] || 45))) * 100}%`, height: '100%', borderRadius: 999, transition: 'width 1s linear, background .3s' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text)' }}>
                <span>{Object.keys(answers).length}/{quiz.questions.length} answered</span>
                <span>{SECS_PER_Q[diff] || 45}s per question</span>
              </div>
            </div>
          )}

          {timeUp && !submitted && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, textAlign: 'center', color: '#fca5a5', fontWeight: 700 }}>
              ⏰ Time’s up! Your answers were submitted automatically.
            </div>
          )}

          {submitted && (
            <div style={{ background: `linear-gradient(135deg,${pct >= 80 ? '#F97316' : '#F59E0B'},${pct >= 80 ? '#FB923C' : '#FBBF24'})`, borderRadius: 18, padding: 24, textAlign: 'center', color: '#fff', marginBottom: 18 }}>
              <div style={{ fontSize: 48, marginBottom: 6 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
              <h3 style={{ fontFamily: "'Sora', sans-serif", fontSize: 28, fontWeight: 900, margin: '0 0 6px' }}>{score}/{quiz.questions.length}</h3>
              <p style={{ opacity: .9, marginBottom: 10 }}>{pct === 100 ? 'Perfect score! 🌟' : pct >= 80 ? 'Excellent!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</p>
              <div style={{ background: 'rgba(255,255,255,.2)', padding: '4px 16px', borderRadius: 20, display: 'inline-block', fontWeight: 700, fontSize: 13 }}>+{Math.round((score / quiz.questions.length) * 50) + 5} XP ⚡</div>
              <br /><br />
              <GhostBtn small onClick={() => { setQuiz(null); setAnswers({}); setSubmitted(false) }} style={{ background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff' }}>New Quiz</GhostBtn>
            </div>
          )}
          <h3 style={{ marginBottom: 18, fontFamily: "'Sora', sans-serif", color: 'var(--text-h)' }}>{quiz.title}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(400px,1fr))', gap: 14 }}>
            {quiz.questions.map((q, i) => {
              const sel_ = answers[i], correct = q.answer, isRight = submitted && sel_ === correct, isWrong = submitted && sel_ !== undefined && sel_ !== correct
              return (
                <Card key={i} style={{ borderLeft: submitted ? `4px solid ${isRight ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border)'}` : '' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, j) => {
                      const isSelected = sel_ === j, isAnswer = j === correct
                      let bg = 'var(--social-bg)', border = 'var(--border)', color = 'var(--text-h)'
                      if (submitted) { if (isAnswer) { bg = 'rgba(16,185,129,.1)'; border = '#6ee7b7'; color = '#6ee7b7' } else if (isSelected) { bg = 'rgba(239,68,68,.1)'; border = '#fca5a5'; color = '#fca5a5' } }
                      else if (isSelected) { bg = 'var(--accent-bg)'; border = 'var(--accent)'; color = 'var(--accent)' }
                      return <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))} style={{ padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600 }}><span style={{ fontWeight: 800, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}{submitted && isAnswer ? ' ✓' : ''}</button>
                    })}
                  </div>
                  {submitted && q.explanation && <div style={{ marginTop: 11, padding: '9px 13px', background: 'var(--accent-bg)', borderRadius: 9, fontSize: 13, color: 'var(--accent)' }}>💡 {q.explanation}</div>}
                </Card>
              )
            })}
          </div>
          {!submitted && <PrimaryBtn onClick={submit} disabled={Object.keys(answers).length < quiz.questions.length} color="#F59E0B" style={{ marginTop: 16 }}>Submit ({Object.keys(answers).length}/{quiz.questions.length} answered) →</PrimaryBtn>}
        </div>
      )}
      <XPBadge amount="5–50" label="per quiz" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  FLASHCARDS
// ══════════════════════════════════════════════════════════════
function FlashCards({ user, prefill, onClearPrefill }) {
  const [sel, setSel]   = useState(emptyPicker())
  const [cards, setCards] = useState([])
  const [cardsMeta, setCardsMeta] = useState({ subject: '', topic: '' })
  const [current, setCurrent] = useState(0)
  const [flipped, setFlipped] = useState({})
  const [mode, setMode] = useState('grid')
  const [loading, setLoading] = useState(false)
  const [err, setErr]   = useState('')

  const [randomTopic, setRandomTopic] = useState('')
  const [randomLoading, setRandomLoading] = useState(false)

  const topic = pickerTopic(sel)
  const ready = isPickerReady(sel)

  useEffect(() => {
    if (!prefill) return
    setSel(s => ({ ...s, subject: prefill.subject || s.subject, chapter: prefill.chapter || s.chapter, cls: prefill.cls || s.cls, subTopicChoice: 'full', customText: '' }))
    onClearPrefill?.()
  }, [prefill])

  async function generate() {
    if (!ready) return
    const subject = sel.subject
    const PROMPT = `Create 8 high-quality flashcards.
SCOPE: ${pickerContext(sel)}
Cover the most important terms, formulas and concepts within that scope. If a sub-topic is named, stay inside it.
Return ONLY valid JSON:
{"cards":[{"front":"Key term or concept","back":"Clear, concise definition (1-2 sentences max)"}]}`
    setErr(''); setLoading(true); setCurrent(0); setFlipped({})
    try {
      const r = await api.post('/api/ai/flashcards', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
      if (!parsed.cards?.length) throw new Error('No cards')
      setCards(parsed.cards)
      setCardsMeta({ subject, topic })
      saveSessionContent({ tool: 'flashcards', subject, chapter: topic, classLevel: sel.cls, content: parsed.cards })
    } catch (e) { setErr(e.status === 402 ? 'Free trial ended. Please subscribe.' : 'Failed to generate flashcards. Try again.') }
    setLoading(false)
  }

  async function generateRandom() {
    if (!randomTopic.trim()) return
    const topicR = randomTopic.trim()
    const PROMPT = `Create 8 high-quality flashcards.
SCOPE: ${randomTopicContext(topicR, sel.cls)}
Cover the most important terms, formulas and concepts within that scope.
Return ONLY valid JSON:
{"cards":[{"front":"Key term or concept","back":"Clear, concise definition (1-2 sentences max)"}]}`
    setErr(''); setRandomLoading(true); setCurrent(0); setFlipped({})
    try {
      const r = await api.post('/api/ai/flashcards', { messages: [{ role: 'user', content: PROMPT }], subject: 'General', chapter: topicR })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
      if (!parsed.cards?.length) throw new Error('No cards')
      setCards(parsed.cards)
      setCardsMeta({ subject: 'General', topic: topicR })
      saveSessionContent({ tool: 'flashcards', subject: 'General', chapter: topicR, classLevel: sel.cls, content: parsed.cards })
    } catch (e) { setErr(e.status === 402 ? 'Free trial ended. Please subscribe.' : 'Failed to generate flashcards. Try again.') }
    setRandomLoading(false)
  }

  const card = cards[current]

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🃏" title="Flashcards" subtitle="Class → Subject → Chapter → Sub Topic → flip-cards for fast revision" color="#EF4444" />

      {cards.length === 0 && (
        <>
          <Card style={{ marginBottom: 4 }}>
            <LessonPicker value={sel} onChange={setSel} accent="#EF4444" />
            <ErrMsg msg={err} />
            <PrimaryBtn onClick={generate} disabled={loading || !ready} color="#EF4444">
              {loading ? <><Spinner /> Creating cards…</> : '🃏 Generate Flashcards'}
            </PrimaryBtn>
          </Card>

          <RandomTopicBox
            value={randomTopic}
            onChange={setRandomTopic}
            onGenerate={generateRandom}
            loading={randomLoading}
            accent="#EF4444"
            buttonLabel="🃏 Generate"
          />
        </>
      )}

      {cards.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-h)', margin: 0 }}>{cardsMeta.topic} — {cards.length} Cards</h3>
            <div style={{ display: 'flex', gap: 7 }}>
              {[['grid', '⊞ Grid'], ['study', '▶ Study']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: mode === m ? '#EF4444' : 'var(--social-bg)', color: mode === m ? '#fff' : 'var(--text-h)' }}>{l}</button>
              ))}
            </div>
          </div>

          {mode === 'grid' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))', gap: 14 }}>
              {cards.map((c, i) => (
                <div key={i} onClick={() => setFlipped(f => ({ ...f, [i]: !f[i] }))} style={{ height: 130, borderRadius: 14, cursor: 'pointer', perspective: 1000 }}>
                  <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d', transition: 'transform .5s', transform: flipped[i] ? 'rotateY(180deg)' : 'none' }}>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', background: 'linear-gradient(135deg,#EF4444,#F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                      <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', fontWeight: 800, marginBottom: 7, letterSpacing: 1 }}>TAP TO REVEAL</span>
                      <span style={{ color: '#fff', fontWeight: 800, fontSize: 13.5, lineHeight: 1.4 }}>{c.front}</span>
                    </div>
                    <div style={{ position: 'absolute', inset: 0, backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', background: 'var(--bg2)', borderRadius: 14, border: '2px solid #EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, textAlign: 'center' }}>
                      <span style={{ color: 'var(--text-h)', fontWeight: 700, fontSize: 13, lineHeight: 1.5 }}>{c.back}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Card style={{ textAlign: 'center', maxWidth: 560, margin: '0 auto' }}>
              <div style={{ fontSize: 12, color: 'var(--text)', marginBottom: 8, fontWeight: 700 }}>Card {current + 1} of {cards.length}</div>
              <div style={{ background: 'var(--border)', borderRadius: 999, height: 5, margin: '0 auto 18px', maxWidth: 240 }}>
                <div style={{ background: '#EF4444', width: `${((current + 1) / cards.length) * 100}%`, height: '100%', borderRadius: 999 }} />
              </div>
              <div onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))} style={{ height: 180, background: flipped[current] ? 'var(--code-bg)' : 'linear-gradient(135deg,#EF4444,#F97316)', borderRadius: 14, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: flipped[current] ? '2px solid #EF4444' : 'none', marginBottom: 18, padding: 24 }}>
                <span style={{ fontSize: 10, color: flipped[current] ? 'var(--text)' : 'rgba(255,255,255,.7)', fontWeight: 800, letterSpacing: 1, marginBottom: 10 }}>{flipped[current] ? 'ANSWER' : 'TERM — TAP TO FLIP'}</span>
                <span style={{ color: flipped[current] ? 'var(--text-h)' : '#fff', fontWeight: 800, fontSize: 16, lineHeight: 1.5 }}>{flipped[current] ? card.back : card.front}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                <GhostBtn disabled={current === 0} onClick={() => { setCurrent(c => c - 1); setFlipped({}) }}>← Prev</GhostBtn>
                <PrimaryBtn color="#EF4444" onClick={() => setFlipped(f => ({ ...f, [current]: !f[current] }))}>Flip</PrimaryBtn>
                <GhostBtn disabled={current === cards.length - 1} onClick={() => { setCurrent(c => c + 1); setFlipped({}) }}>Next →</GhostBtn>
              </div>
            </Card>
          )}
          <GhostBtn small onClick={() => setCards([])} style={{ marginTop: 14 }}>↺ New Flashcards</GhostBtn>
        </>
      )}
      <XPBadge amount={15} label="per set" />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS PAGE
// ══════════════════════════════════════════════════════════════
function AchievementsPage() {
  const [achs,setAchs]=useState([]); const [filter,setFilter]=useState('all')
  useEffect(()=>{api.get('/api/user/achievements').then(setAchs).catch(()=>{})},[])
  const unlocked=achs.filter(a=>a.unlocked)
  const cats=['all','unlocked','streak','xp','tools','special','legendary']
  const shown=achs.filter(a=>filter==='all'||(filter==='unlocked'&&a.unlocked)||a.category===filter)
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🏆" title={`Achievements (${unlocked.length}/${achs.length})`} subtitle="Unlock achievements by completing activities and earning XP" color="#F59E0B"/>
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:22 }}>
        {cats.map(c=>(<button key={c} onClick={()=>setFilter(c)} style={{ padding:'6px 16px', borderRadius:20, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===c?'var(--accent)':'var(--social-bg)', color:filter===c?'#fff':'var(--text-h)', transition:'all .15s', textTransform:'capitalize' }}>{c}</button>))}
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:13 }}>
        {shown.map(a=>(
          <Card key={a.id} style={{ opacity:a.unlocked?1:.5, borderColor:a.unlocked?DIFF_COLORS[a.difficulty]:'var(--border)', position:'relative' }}>
            {a.unlocked&&<div style={{ position:'absolute', top:10, right:10, width:8, height:8, background:'#22c55e', borderRadius:'50%' }}/>}
            <div style={{ fontSize:32, marginBottom:8 }}>{a.unlocked?a.emoji:'🔒'}</div>
            <div style={{ fontWeight:800, fontSize:14, color:'var(--text-h)', marginBottom:5, fontFamily:"'Sora',sans-serif" }}>{a.name}</div>
            <div style={{ fontSize:12.5, color:'var(--text)', marginBottom:10 }}>{a.description}</div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontSize:11, fontWeight:800, color:DIFF_COLORS[a.difficulty], textTransform:'capitalize' }}>{a.difficulty}</span>
              <span style={{ fontSize:11.5, color:'var(--accent)', fontWeight:700 }}>+{a.xp_reward} XP</span>
            </div>
            {a.unlocked&&a.unlocked_at&&<div style={{ fontSize:10.5, color:'var(--text)', marginTop:6 }}>Unlocked {new Date(a.unlocked_at).toLocaleDateString('en-IN')}</div>}
          </Card>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  CHAPTER COURSES
// ══════════════════════════════════════════════════════════════
function ChapterCourses({ user, prefill, onClearPrefill }) {
  const isMobile = useIsMobile()
  const [subj,     setSubj]    = useState('Mathematics')
  const [cls,      setCls]     = useState(user?.class_level || 'Class 10')
  const [chapter,  setChapter] = useState('')
  const [phase,    setPhase]   = useState('select')
  const [courseKey,setCourseKey] = useState('')
  const [modules,  setModules] = useState([])
  const [activeModuleId, setActiveModuleId] = useState(null)
  const [moduleData, setModuleData] = useState(null)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [statusMsg, setStatusMsg] = useState('')
  const [err, setErr] = useState('')
  const [completedIds, setCompletedIds] = useState(new Set())

  const chs       = getChapters(subj, cls)
  const sseRef    = useRef(null)
  const autoGenRef = useRef(false)

  // ── Prefill from history ──────────────────────────────────
  useEffect(() => {
    if (!prefill?.chapter) return
    if (prefill.subject) setSubj(prefill.subject)
    if (prefill.cls) setCls(prefill.cls)
    setChapter(prefill.chapter)
    autoGenRef.current = true
    onClearPrefill?.()
  }, [prefill])

  useEffect(() => {
    if (!autoGenRef.current || !chapter) return
    autoGenRef.current = false
    generateCourse()
  }, [chapter, subj])

  useEffect(() => () => sseRef.current?.close(), [])

  useEffect(() => {
    if (!courseKey) return
    api.get(`/api/chapter-courses/progress/${courseKey}`)
      .then(ids => setCompletedIds(new Set(ids)))
      .catch(() => setCompletedIds(new Set()))
  }, [courseKey])

  // ── When subject/class changes, reset chapter selection ──
  const handleSubjChange = v => { setSubj(v); setChapter('') }
  const handleClsChange  = v => { setCls(v);  setChapter('') }

  function markComplete(id) {
    setCompletedIds(prev => new Set([...prev, id]))
    api.post('/api/chapter-courses/progress', { courseKey, moduleId: id }).catch(() => {})
  }
  function unmarkComplete(id) {
    setCompletedIds(prev => { const next = new Set(prev); next.delete(id); return next })
    api.del(`/api/chapter-courses/progress/${courseKey}/${id}`).catch(() => {})
  }
  const isComplete = id => completedIds.has(id)

  // ── Generate ──────────────────────────────────────────────
  async function generateCourse() {
  if (!chapter) return
  setErr(''); setPhase('generating'); setModules([]); setProgress({ done: 0, total: 0 })
  setStatusMsg(`Designing modules for "${chapter}"     Wait for 40-60 seconds while we generate your course.`)
  try {
    const { courseKey: key, existing, resuming } = await api.post('/api/chapter-courses/generate', {
      subject: subj, cls, chapter,
    })
    setCourseKey(key)

    if (existing) {
      // ✅ FIX 1: always load and display cached modules first, BEFORE connecting SSE
      const cached = await api.get(`/api/chapter-courses/list/${key}?t=${Date.now()}`)
      if (cached?.modules) {
        setModules(cached.modules)
        const doneCount = cached.modules.filter(m => m.status === 'done').length
        setProgress({ done: doneCount, total: cached.modules.length })
        setPhase('course')  // ✅ show course UI immediately, not blank generating screen

        // If backend is still building remaining modules, listen for updates
        if (resuming) {
          connectSSE(key)
        }
        return
      }
    }

    // Fresh generation — connect SSE and wait for modules_listed event
    connectSSE(key)
  } catch (e) { setErr(e.message); setPhase('select') }
}

  function connectSSE(key) {
  const token = localStorage.getItem('bs_token')
  const es = new EventSource(`${API_URL}/api/chapter-courses/stream/${key}?token=${token}`)
  sseRef.current = es
  es.onmessage = e => { try { handleSSEMessage(JSON.parse(e.data)) } catch {} }
  es.onerror = () => {
    es.close()
    let attempts = 0
    const poll = setInterval(async () => {
      attempts++
      const cached = await api.get(`/api/chapter-courses/list/${key}?t=${Date.now()}`).catch(() => null)
      const mods = cached?.modules || cached?.data?.modules
      if (mods?.length) {
        clearInterval(poll)
        setModules(mods)
        setPhase('course')
      }
      if (attempts > 24) clearInterval(poll)
    }, 5000)
  }
}

  const handleSSEMessage = useCallback((msg) => {
  switch (msg.type) {
    case 'status':
      setStatusMsg(msg.message)
      break
    case 'modules_listed':
      // Only reset module list if we're in generating phase (fresh build)
      // If already in course phase (resume), merge instead of replace
      setModules(prev => {
        if (prev.length > 0) return prev  // ✅ already have modules, don't wipe them
        return msg.modules || []
      })
      setProgress({ done: 0, total: msg.modules?.length || 0 })
      setStatusMsg('Searching YouTube & generating content…')
      setPhase('course')
      break
    case 'module_building':
      setModules(p => p.map(m => m.id === msg.moduleId ? { ...m, status: 'building' } : m))
      setStatusMsg(`Building: "${msg.title}"…`)
      break
    case 'module_done':
      setModules(p => {
        const updated = p.map(m => m.id === msg.moduleId
          ? { ...m, status: 'done', videoId: msg.videoId, transcriptStatus: msg.transcriptStatus }
          : m
        )
        // Auto-open first completed module
        const firstDone = updated.find(m => m.status === 'done')
        if (firstDone) setTimeout(() => setActiveModuleId(prev => prev ?? firstDone.id), 100)
        return updated
      })
      setProgress(p => ({ ...p, done: p.done + 1 }))
      break
    case 'module_error':
      setModules(p => p.map(m => m.id === msg.moduleId ? { ...m, status: 'error' } : m))
      break
    case 'generation_complete':
      if (msg.modules) setModules(msg.modules)
      setPhase('course')
      sseRef.current?.close()
      break
    case 'already_done':
      if (msg.data?.modules) setModules(msg.data.modules)
      setPhase('course')
      sseRef.current?.close()
      break
    case 'error':
      setErr(msg.message || 'Generation failed')
      setPhase('select')
      sseRef.current?.close()
      break
  }
}, [])

  function openModule(mod) {
  if (mod.status !== 'done') return
  setActiveModuleId(mod.id)
}

useEffect(() => {
  if (!activeModuleId) return
  const mod = modules.find(m => m.id === activeModuleId)
  if (!mod || mod.status !== 'done') return
  setModuleData(null)
  const modKey = buildModKey(subj, cls, chapter, mod.id)
  api.get(`/api/chapter-courses/module/${modKey}`)
    .then(setModuleData)
    .catch(e => setErr('Could not load module: ' + e.message))
}, [activeModuleId])

  function buildModKey(subject, c, ch, moduleId) {
    const safe = s => s.replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 16)
    return `bscm-mod-${safe(subject)}-${safe(c)}-${safe(ch)}-${moduleId}`
  }

  // ── PHASE: generating ─────────────────────────────────────
  if (phase === 'generating') {
    return (
      <div style={{ padding: 24, fontFamily: "'Nunito', sans-serif", maxWidth: 800, margin: '0 auto' }}>
        <GhostBtn small onClick={() => { sseRef.current?.close(); setPhase('select') }} style={{ marginBottom: 20 }}>← Back</GhostBtn>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, color: 'var(--text-h)', margin: '0 0 4px' }}>📚 Building Your Course</h2>
          <p style={{ color: 'var(--text)', margin: 0, fontSize: 13 }}>{chapter} · {subj} · {cls}</p>
        </div>
        <Card style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-h)' }}>{statusMsg}</span>
            {progress.total > 0 && <span style={{ fontSize: 13, color: 'var(--accent)', fontWeight: 800 }}>{progress.done}/{progress.total}</span>}
          </div>
          {progress.total > 0 && (
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 8 }}>
              <div style={{ background: 'linear-gradient(90deg,#6366F1,#8B5CF6)', width: `${Math.round((progress.done / progress.total) * 100)}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
          )}
        </Card>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
          {modules.map(mod => (
            <div key={mod.id} style={{ background: 'var(--bg2)', border: `1px solid ${mod.status === 'done' ? '#6366F1' : mod.status === 'building' ? '#F59E0B' : mod.status === 'error' ? '#EF4444' : 'var(--border)'}`, borderRadius: 12, padding: '12px 14px', transition: 'border-color .3s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 20 }}>{mod.emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod.title}</div>
                </div>
                <StatusDot status={mod.status} />
              </div>
              {mod.status === 'building' && (
  <div style={{ fontSize: 11, color: '#F59E0B', display: 'flex', alignItems: 'center', gap: 4 }}>
    <Spinner size={10} /> Searching…
  </div>
)}
{mod.status === 'error' && (
  <button
    onClick={async e => {
      e.stopPropagation();
      setModules(p => p.map(m => m.id === mod.id ? { ...m, status: 'building' } : m));
      await api.post('/api/chapter-courses/module/retry', {
        subject: subj, cls, chapter,
        moduleId: mod.id,
        moduleTitle: mod.title,
        searchQuery: mod.searchQuery,
      });
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const modKey = buildModKey(subj, cls, chapter, mod.id);
        const data = await api.get(`/api/chapter-courses/module/${modKey}`).catch(() => null);
        if (data?.notes || attempts > 12) {
          clearInterval(poll);
          const updated = await api.get(`/api/chapter-courses/list/${courseKey}`);
          if (updated?.modules) setModules(updated.modules);
        }
      }, 5000);
    }}
    style={{
      padding: '3px 8px', borderRadius: 6,
      border: '1px solid rgba(239,68,68,.4)',
      background: 'rgba(239,68,68,.1)', color: '#fca5a5',
      fontSize: 11, cursor: 'pointer',
      fontFamily: "'Nunito', sans-serif", fontWeight: 700, marginTop: 4,
    }}
  >
    🔄 Retry
  </button>
)}
              {mod.status === 'done' && mod.videoId && <div style={{ fontSize: 10.5, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>▶ {mod.videoTitle?.slice(0, 35) || 'Video found'}</div>}
            </div>
          ))}
        </div>
        <ErrMsg msg={err} />
      </div>
    )
  }

  // ── PHASE: course (sidebar + module view) ─────────────────
  if (phase === 'course') {
    const doneCount = modules.filter(m => m.status === 'done').length
    const compCount = modules.filter(m => isComplete(m.id)).length
    const pct       = doneCount > 0 ? Math.round((compCount / doneCount) * 100) : 0
    const activeMod = modules.find(m => m.id === activeModuleId)
    const showSidebar = !isMobile || !activeModuleId
    const showContent = !isMobile || !!activeModuleId
    return (
      <div style={{ display: 'flex', height: 'calc(100vh - 120px)', fontFamily: "'Nunito', sans-serif", overflow: 'hidden' }}>
        {/* Sidebar */}
        {showSidebar && (
        <div style={{ width: isMobile ? '100%' : 272, flexShrink: 0, borderRight: isMobile ? 'none' : '1px solid var(--border)', display: 'flex', flexDirection: 'column', background: 'var(--bg2)', overflow: 'hidden' }}>
          <div style={{ padding: '14px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
            <GhostBtn small onClick={() => setPhase('select')} style={{ marginBottom: 10 }}>← Change Chapter</GhostBtn>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 4 }}>Course Content</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.3, marginBottom: 2 }}>{chapter}</div>
            <div style={{ fontSize: 11, color: 'var(--text)', marginBottom: 8 }}>{subj} · {cls} · {doneCount} modules</div>
            <div style={{ background: 'var(--border)', borderRadius: 999, height: 3 }}>
              <div style={{ background: 'linear-gradient(90deg,var(--accent),#8B5CF6)', width: `${pct}%`, height: '100%', borderRadius: 999, transition: 'width .5s ease' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
  <span style={{ fontSize: 10, color: 'var(--text)' }}>{pct}% complete</span>
  <span style={{ fontSize: 10, color: 'var(--text)' }}>{compCount}/{doneCount} done</span>
</div>
{modules.some(m => m.status === 'building' || m.status === 'pending') && (
  <div style={{ 
    fontSize: 11, color: '#F59E0B', display: 'flex', 
    alignItems: 'center', gap: 5, marginTop: 6,
    padding: '5px 8px', background: 'rgba(245,158,11,.08)',
    borderRadius: 6, border: '1px solid rgba(245,158,11,.15)'
  }}>
    <Spinner size={9}/> Preparing remaining modules…
  </div>
)}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
            {modules.map((mod, idx) => {
              const done     = mod.status === 'done'
              const comp     = isComplete(mod.id)
              const building = mod.status === 'building'
              const isActive = activeModuleId === mod.id
              return (
                <div key={mod.id} onClick={() => done && openModule(mod)}
                    style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 10, cursor: done ? 'pointer' : 'default', border: `1px solid ${isActive ? 'var(--accent-border)' : 'transparent'}`, background: isActive ? 'var(--accent-bg)' : 'transparent', opacity: !done && !building ? .5 : 1, marginBottom: 2, transition: 'all .15s' }}
                  onMouseEnter={e => { if (done && !isActive) e.currentTarget.style.background = 'rgba(15,23,42,.04)' }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, marginTop: 1, background: comp ? 'rgba(34,197,94,.2)' : isActive ? 'rgba(99,102,241,.2)' : building ? 'rgba(245,158,11,.15)' : 'var(--code-bg)', color: comp ? '#34d399' : isActive ? 'var(--accent)' : building ? '#fbbf24' : '#374151' }}>
                    {comp ? '✓' : building ? <Spinner size={9} /> : idx + 1}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12.5, color: isActive ? 'var(--text-h)' : 'var(--text)', fontWeight: isActive ? 600 : 400, lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {mod.emoji && <span style={{ marginRight: 4 }}>{mod.emoji}</span>}{mod.title || '…'}
                    </div>
                    <div style={{ display: 'flex', gap: 4, marginTop: 4, flexWrap: 'wrap' }}>
                      {done && mod.videoId       && <span style={{ fontSize: 9.5, background: 'rgba(34,197,94,.1)', color: '#34d399', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>▶ Video</span>}
                      {done && mod.transcriptStatus === 'success' && <span style={{ fontSize: 9.5, background: 'rgba(6,182,212,.1)', color: '#22d3ee', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>✓ Transcript</span>}
                      {comp  && <span style={{ fontSize: 9.5, background: 'rgba(245,158,11,.1)', color: '#fbbf24', borderRadius: 10, padding: '1px 6px', fontWeight: 700 }}>🏆 Done</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        )}
        {/* Module content area */}
        {showContent && (
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {activeMod ? (
            <ModuleView
              mod={activeMod}
              moduleData={moduleData}
              subject={subj}
              cls={cls}
              chapter={chapter}
              courseKey={courseKey}
              isComplete={isComplete(activeModuleId)}
              onComplete={() => markComplete(activeModuleId)}
              onUncomplete={() => unmarkComplete(activeModuleId)}
              onBackToList={isMobile ? () => setActiveModuleId(null) : undefined}
              onPrev={() => { const idx = modules.findIndex(m => m.id === activeModuleId); if (idx > 0) openModule(modules[idx - 1]) }}
              onNext={() => { const idx = modules.findIndex(m => m.id === activeModuleId); const next = modules.slice(idx + 1).find(m => m.status === 'done'); if (next) openModule(next) }}
              hasPrev={modules.findIndex(m => m.id === activeModuleId) > 0}
              hasNext={modules.slice(modules.findIndex(m => m.id === activeModuleId) + 1).some(m => m.status === 'done')}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 52 }}>📚</div>
              <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text-h)' }}>Select a module to start</div>
              <p style={{ fontSize: 13, color: 'var(--text)', maxWidth: 300, lineHeight: 1.7, margin: 0 }}>Click any module from the list on the left.</p>
              <ErrMsg msg={err} />
            </div>
          )}
        </div>
        )}
      </div>
    )
  }

  // ── PHASE: select — clean dropdown UI like NotesMaker ─────
  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif" }}>
      <PageHeader icon="📚" title="Chapter Courses" subtitle="AI selects the best YouTube videos per topic & generates notes + quiz from transcripts" color="#8B5CF6" />

      <Card style={{ marginBottom: 18 }}>
        {/* Row 1: Subject + Class */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 4 }}>
  <Field label="① Class">
  <BSSelect value={cls} onChange={v => { setCls(v); setSubj(''); setChapter('') }} options={CLASSES} />
</Field>
<Field label="② Subject">
  <BSSelect value={subj} disabled={!cls}
    onChange={v => { setSubj(v); setChapter('') }}
    options={[{ value: '', label: 'Select subject' }, ...getSubjectsForClass(cls).map(s => ({ value: s, label: s }))]} />
</Field>
</div>

        {/* Row 2: Chapter dropdown */}
        <Field label="Chapter">
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: 'Select a Chapter' }, ...chs.map(c => ({ value: c, label: c }))]}
          />
        </Field>

        {/* Generate button — appears once a chapter is chosen */}
        {chapter && (
          <div style={{ marginTop: 16, padding: '16px 18px', background: 'var(--accent-bg)', border: '1px solid var(--accent-border)', borderRadius: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontWeight: 800, color: 'var(--text-h)', fontSize: 14, marginBottom: 3 }}>{chapter}</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.6 }}>
                  AI builds 8–12 focused modules · Best YouTube video per sub-topic · Notes + Quiz from transcript
                </div>
              </div>
              <PrimaryBtn onClick={generateCourse} color="#8B5CF6">🚀 Build Course</PrimaryBtn>
            </div>
          </div>
        )}
      </Card>

      {/* Feature highlights */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 10 }}>
        {[
          ['🎬', 'Best Video Selected',  'YouTube searched per sub-topic — best video with transcript chosen'],
          ['📄', 'Transcript-Based',     'Notes & quiz generated from actual video content, not guesswork'],
          ['🎯', 'Per-Module Quiz',      '8 MCQs per module based on what the video teaches'],
          ['💬', 'Deep Q&A',             '6 practice questions per module from Hard to Easy'],
        ].map(([e, t, d]) => (
          <div key={t} style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 15px' }}>
            <div style={{ fontSize: 22, marginBottom: 6 }}>{e}</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 4 }}>{t}</div>
            <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{d}</div>
          </div>
        ))}
      </div>
      <ErrMsg msg={err} />
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  STATUS DOT (module status indicator)
// ══════════════════════════════════════════════════════════════
function StatusDot({ status }) {
  const MAP = {
    done:     { color: '#22c55e', label: '✓' },
    building: { color: '#F59E0B', label: '…' },
    error:    { color: '#EF4444', label: '!' },
    pending:  { color: '#64748b', label: '' },
  };
  const { color, label } = MAP[status] || MAP.pending;
  return (
    <div style={{ width: 18, height: 18, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#fff', fontWeight: 900, flexShrink: 0 }}>
      {status === 'building' ? <Spinner size={10} /> : label}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════
//  MODULE VIEW — Video player + Notes/Q&A/Quiz tabs
// ══════════════════════════════════════════════════════════════
function ModuleView({ mod, moduleData, subject, cls, chapter, courseKey, isComplete, onComplete, onUncomplete, onBackToList, onPrev, onNext, hasPrev, hasNext }) {
  const [tab,    setTab]    = useState('video')
  const [qAns,   setQAns]   = useState({})
  const [qDone,  setQDone]  = useState(false)
  const [qScore, setQScore] = useState(0)
  const [qaOpen, setQaOpen] = useState(null)
  const [swapping, setSwapping] = useState(false)

  // Reset when module changes
  useEffect(() => {
    setTab('video'); setQAns({}); setQDone(false); setQScore(0); setQaOpen(null); setSwapping(false)
  }, [mod?.id])

  const notes          = moduleData?.notes
  const qa             = moduleData?.qa   || []
  const quiz           = moduleData?.quiz || []
  const currentVideoId = moduleData?.videoId || mod?.videoId
  const searchResults  = moduleData?.searchResults || []
  const pct = qDone ? Math.round((qScore / Math.max(quiz.length, 1)) * 100) : 0

  function submitQuiz() {
    let s = 0; quiz.forEach((q, i) => { if (qAns[i] === q.ans) s++ })
    setQScore(s); setQDone(true); if (!isComplete) onComplete?.()
  }

  async function swapVideo(newVideoId) {
    try { await api.patch('/api/chapter-courses/module/video', { subject, cls, chapter, moduleId: mod.id, newVideoId, moduleTitle: mod.title }); setSwapping(false) }
    catch (e) { alert('Swap failed: ' + e.message) }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>

      {/* ── Module title bar ── */}
      <div style={{ padding: '13px 20px 11px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {onBackToList && (
          <button onClick={onBackToList} title="Back to modules"
            style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--code-bg)', color: 'var(--text-h)', fontSize: 15, cursor: 'pointer', flexShrink: 0, fontFamily: "'Nunito', sans-serif" }}>←</button>
        )}
        <span style={{ fontSize: 20 }}>{mod?.emoji}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 15, color: 'var(--text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{mod?.title}</div>
          <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 1 }}>{subject} · {cls} · {chapter}</div>
        </div>
        {isComplete && (
          <button
            onClick={onUncomplete}
            title="Click to mark as not completed"
            style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '2px 10px', fontSize: 11, fontWeight: 700, flexShrink: 0, cursor: 'pointer', fontFamily: "'Nunito', sans-serif" }}
          >
            ✓ Done · Undo
          </button>
        )}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <GhostBtn small onClick={onPrev} disabled={!hasPrev}>← Prev</GhostBtn>
          <GhostBtn small onClick={onNext} disabled={!hasNext}>Next →</GhostBtn>
        </div>
      </div>

      {/* ── Tabs at top ── */}
      <div style={{ display: 'flex', gap: 2, padding: '7px 12px', background: 'var(--code-bg)', borderBottom: '1px solid var(--border)', flexShrink: 0, overflowX: 'auto' }}>
        {[['video', '▶ Video'], ['notes', '📝 Notes'], ['qa', `💬 Q&A (${qa.length})`], ['quiz', `🎯 Quiz (${quiz.length})`]].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            style={{ padding: '7px 18px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: "'Nunito', sans-serif", transition: 'all .15s', flexShrink: 0, background: tab === id ? 'var(--accent)' : 'transparent', color: tab === id ? '#fff' : 'var(--text)' }}>
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

        {/* VIDEO */}
        {tab === 'video' && (
          <div>
            {currentVideoId ? (
              <>
                <div style={{ position: 'relative', paddingBottom: '56.25%', borderRadius: 13, overflow: 'hidden', background: '#000', boxShadow: '0 8px 28px rgba(0,0,0,.4)', marginBottom: 12 }}>
                  <iframe src={`https://www.youtube.com/embed/${currentVideoId}?rel=0&modestbranding=1`}
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                    allowFullScreen title={mod?.title} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--text-h)' }}>{moduleData?.videoTitle || 'YouTube Video'}</div>
                    {moduleData?.videoChannel && <div style={{ fontSize: 12, color: 'var(--text)', marginTop: 2 }}>📺 {moduleData.videoChannel}</div>}
                    <div style={{ fontSize: 11, marginTop: 3, color: moduleData?.transcriptStatus === 'success' ? '#6ee7b7' : '#94a3b8' }}>
                      {moduleData?.transcriptStatus === 'success' ? '✓ Transcript-based notes' : '🧠 AI knowledge used'}
                    </div>
                  </div>
                  {searchResults.length > 1 && <GhostBtn small onClick={() => setSwapping(!swapping)}>{swapping ? '✕ Close' : '🔄 Different Video'}</GhostBtn>}
                </div>
                {swapping && (
                  <Card style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 10 }}>Pick a different video:</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {searchResults.map(v => (
                        <div key={v.videoId} onClick={() => swapVideo(v.videoId)}
                          style={{ display: 'flex', gap: 10, padding: '9px 12px', borderRadius: 10, border: `1.5px solid ${v.videoId === currentVideoId ? 'var(--accent)' : 'var(--border)'}`, background: v.videoId === currentVideoId ? 'var(--accent-bg)' : 'transparent', cursor: 'pointer', alignItems: 'center', transition: 'all .15s' }}>
                          {v.thumbnail && <img src={v.thumbnail} alt="" style={{ width: 80, height: 54, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-h)', marginBottom: 2 }}>{v.title}</div>
                            <div style={{ fontSize: 11, color: 'var(--text)' }}>{v.channel}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}
                {mod?.keyTopics?.length > 0 && (
                  <Card style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-h)', marginBottom: 8 }}>🎯 What you'll learn</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {mod.keyTopics.map((t, i) => <span key={i} style={{ background: 'var(--accent-bg)', color: 'var(--accent)', border: '1px solid var(--accent-border)', borderRadius: 20, padding: '3px 11px', fontSize: 12, fontWeight: 700 }}>{t}</span>)}
                    </div>
                  </Card>
                )}
              </>
            ) : (
              <div style={{ ...T.card, textAlign: 'center', padding: 40 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🎬</div>
                <p style={{ color: 'var(--text)', fontSize: 13 }}>No video found. Notes were generated from AI knowledge.</p>
              </div>
            )}
          </div>
        )}

        {/* NOTES */}
        {tab === 'notes' && (
          !moduleData ? <PageSpinner /> : !notes ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Notes not available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {notes.summary && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 7, fontFamily: "'Sora', sans-serif" }}>Summary</div>
                  <p style={{ fontSize: 14, color: 'var(--text-h)', lineHeight: 1.8, margin: 0 }}>{notes.summary}</p>
                </div>
              )}
              {notes.keyConcepts?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Key Concepts</div>
                  {notes.keyConcepts.map((c, i) => (
                    <div key={i} style={{ padding: '9px 13px', background: 'rgba(6,182,212,.05)', borderRadius: 9, border: '1px solid rgba(6,182,212,.1)', marginBottom: 6 }}>
                      <span style={{ fontSize: 12.5, color: '#38bdf8', fontWeight: 700 }}>{c.term}: </span>
                      <span style={{ fontSize: 13, color: 'var(--text)' }}>{c.definition}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.keyPoints?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Key Points</div>
                  {notes.keyPoints.map((p, i) => (
                    <div key={i} style={{ display: 'flex', gap: 9, marginBottom: 7, padding: '8px 11px', background: 'var(--code-bg)', borderRadius: 8, border: '1px solid var(--border)' }}>
                      <span style={{ color: 'var(--accent)', fontWeight: 800, flexShrink: 0 }}>{i + 1}.</span>
                      <span style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.6 }}>{p}</span>
                    </div>
                  ))}
                </div>
              )}
              {notes.formulas?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Formulas</div>
                  {notes.formulas.map((f, i) => (
                    <div key={i} style={{ padding: '9px 13px', background: 'rgba(245,158,11,.06)', borderRadius: 8, border: '1px solid rgba(245,158,11,.12)', fontFamily: 'monospace', fontSize: 13, color: '#fcd34d', marginBottom: 6 }}>{f}</div>
                  ))}
                </div>
              )}
              {notes.solvedExample && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#6ee7b7', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Solved Example</div>
                  <p style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-wrap', padding: '13px 15px', background: 'rgba(16,185,129,.05)', borderRadius: 9, border: '1px solid rgba(16,185,129,.12)' }}>{notes.solvedExample}</p>
                </div>
              )}
              {notes.commonMistakes?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ef4444', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Common Mistakes</div>
                  {notes.commonMistakes.map((m, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.55 }}>
                      <span style={{ color: '#ef4444', flexShrink: 0 }}>✗</span>{m}
                    </div>
                  ))}
                </div>
              )}
              {notes.examTips?.length > 0 && (
                <div>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 8, fontFamily: "'Sora', sans-serif" }}>Exam Tips</div>
                  {notes.examTips.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 7, fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.55 }}>
                      <span style={{ color: 'var(--accent)', flexShrink: 0 }}>★</span>{t}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}

        {/* Q&A */}
        {tab === 'qa' && (
          !moduleData ? <PageSpinner /> : qa.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Q&A not available.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {qa.map((item, i) => (
                <div key={i} style={{ borderRadius: 11, border: `1px solid ${qaOpen === i ? 'var(--accent-border)' : 'var(--border)'}`, background: qaOpen === i ? 'var(--accent-bg)' : 'transparent', overflow: 'hidden', transition: 'all .15s' }}>
                  <div onClick={() => setQaOpen(qaOpen === i ? null : i)} style={{ padding: '12px 14px', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <div style={{ width: 21, height: 21, borderRadius: '50%', background: 'var(--accent-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, color: 'var(--accent)', fontWeight: 700, flexShrink: 0, marginTop: 1 }}>Q{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      {item.difficulty && <div style={{ fontSize: 10.5, fontWeight: 700, color: item.difficulty === 'Easy' ? '#22c55e' : item.difficulty === 'Hard' ? '#ef4444' : '#06b6d4', marginBottom: 3 }}>{item.difficulty}</div>}
                      <div style={{ fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.5 }}>{item.q}</div>
                    </div>
                    <span style={{ color: 'var(--text)', fontSize: 12, flexShrink: 0 }}>{qaOpen === i ? '▲' : '▼'}</span>
                  </div>
                  {qaOpen === i && (
                    <div style={{ padding: '0 14px 14px 45px', fontSize: 13.5, color: 'var(--text-h)', lineHeight: 1.8, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                      💡 {item.a}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* QUIZ */}
        {tab === 'quiz' && (
          !moduleData ? <PageSpinner /> : quiz.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 30, color: 'var(--text)', fontSize: 13 }}>Quiz not available.</div>
          ) : qDone ? (
            <div>
              <div style={{ padding: '28px', borderRadius: 16, background: `linear-gradient(135deg,${pct >= 80 ? '#6366F1' : pct >= 50 ? '#F59E0B' : '#EF4444'},${pct >= 80 ? '#8B5CF6' : pct >= 50 ? '#FBBF24' : '#F87171'})`, textAlign: 'center', color: '#fff', marginBottom: 20 }}>
                <div style={{ fontSize: 48, marginBottom: 6 }}>{pct === 100 ? '🏆' : pct >= 80 ? '🎉' : pct >= 50 ? '👍' : '📚'}</div>
                <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 32, marginBottom: 4 }}>{qScore}/{quiz.length}</div>
                <div style={{ fontSize: 14, opacity: .85, marginBottom: 14 }}>{pct >= 80 ? 'Excellent work!' : pct >= 50 ? 'Good effort!' : 'Keep practicing!'}</div>
                <button onClick={() => { setQAns({}); setQDone(false) }} style={{ padding: '7px 22px', borderRadius: 9, background: 'rgba(255,255,255,.2)', border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>↺ Retake</button>
              </div>
              {quiz.map((q, i) => (
                <Card key={i} style={{ marginBottom: 10, borderLeft: `4px solid ${qAns[i] === q.ans ? '#22c55e' : '#ef4444'}` }}>
                  <p style={{ margin: '0 0 10px', fontWeight: 700, fontSize: 14, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 8 }}>
                    {q.opts.map((opt, j) => {
                      const isAns = j === q.ans, isSel = qAns[i] === j
                      return <div key={j} style={{ padding: '8px 11px', borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1.5px solid ${isAns ? '#6ee7b7' : isSel && !isAns ? '#fca5a5' : 'var(--border)'}`, background: isAns ? 'rgba(34,197,94,.08)' : isSel && !isAns ? 'rgba(239,68,68,.07)' : 'transparent', color: isAns ? '#6ee7b7' : isSel && !isAns ? '#fca5a5' : 'var(--text-h)' }}>{String.fromCharCode(65 + j)}. {opt}{isAns ? ' ✓' : ''}</div>
                    })}
                  </div>
                  {q.exp && <div style={{ padding: '8px 12px', background: 'var(--accent-bg)', borderRadius: 8, fontSize: 12.5, color: 'var(--accent)' }}>💡 {q.exp}</div>}
                </Card>
              ))}
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 20, flexWrap: 'wrap' }}>
                {quiz.map((_, i) => <div key={i} style={{ flex: '1 0 auto', maxWidth: 32, height: 4, borderRadius: 100, background: qAns[i] !== undefined ? 'var(--accent)' : 'rgba(255,255,255,.09)', transition: 'background .2s' }} />)}
              </div>
              {quiz.map((q, i) => (
                <Card key={i} style={{ marginBottom: 14 }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)', lineHeight: 1.45 }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.opts.map((opt, j) => (
                      <button key={j} onClick={() => setQAns(a => ({ ...a, [i]: j }))}
                        style={{ padding: '10px 13px', borderRadius: 9, border: `1.5px solid ${qAns[i] === j ? 'var(--accent)' : 'var(--border)'}`, background: qAns[i] === j ? 'var(--accent-bg)' : 'var(--code-bg)', color: qAns[i] === j ? 'var(--accent)' : 'var(--text-h)', cursor: 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}>
                        <span style={{ fontWeight: 800, marginRight: 5 }}>{String.fromCharCode(65 + j)}.</span>{opt}
                      </button>
                    ))}
                  </div>
                </Card>
              ))}
              {Object.keys(qAns).length === quiz.length && (
                <PrimaryBtn onClick={submitQuiz} color="#8B5CF6" style={{ width: '100%', justifyContent: 'center', marginTop: 4 }}>
                  Submit Quiz ({Object.keys(qAns).length}/{quiz.length} answered) →
                </PrimaryBtn>
              )}
            </div>
          )
        )}

      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  VIDEO LEARNING
// ══════════════════════════════════════════════════════════════
function VideoLearn({ user }) {
  const [phase,setPhase]=useState('search'); const [query,setQuery]=useState(''); const [urlIn,setUrlIn]=useState('')
  const [vidId,setVidId]=useState(null); const [title,setTitle]=useState(''); const [gen,setGen]=useState(false)
  const [notes,setNotes]=useState(null); const [quiz,setQuiz]=useState([]); const [tab,setTab]=useState('video')
  const [ans,setAns]=useState({}); const [done,setDone]=useState(false); const [score,setScore]=useState(0); const [err,setErr]=useState('')
  const SUGG=['Photosynthesis CBSE Class 10','Quadratic Equations Class 10','French Revolution Class 9','Newton Laws of Motion Class 9','Chemical Bonding Class 11']
  const getId=s=>{
    if(!s?.trim()) return null
    if(/^[a-zA-Z0-9_-]{11}$/.test(s.trim())) return s.trim()
    const m=s.match(/(?:[?&]v=|youtu\.be\/|embed\/|shorts\/)([a-zA-Z0-9_-]{11})/)
    return m?.[1]||null
  }
  const load=async(vid,t='')=>{
    const id=getId(vid)||null
    setVidId(id||'dQw4w9WgXcQ');setTitle(t||`Video Study: ${vid}`)
    setPhase('watch');setTab('video');setNotes(null);setQuiz([]);setGen(true);setAns({});setDone(false);setErr('')
    const ck=`bsv-${(id||vid.replace(/\W/g,'').slice(0,12))}`
    const cached=await api.get(`/api/courses/${ck}`).catch(()=>null)
    if(cached?.notes){setNotes(cached.notes);setQuiz(cached.quiz||[]);setGen(false);return}
    try{
      const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:`A student is watching a YouTube video on "${t||vid}". Generate:
1. Study notes with ## headings, **bold** key terms (~400 words)
2. Then on a new line write EXACTLY: ===JSON===
3. Then ONLY this JSON (no markdown): {"quiz":[{"q":"...","opts":["A","B","C","D"],"ans":0,"exp":"..."}]}
Generate 6 quiz questions.`}],subject:'General'})
      let content=r.content,pqz=[]
      const sep=content.indexOf('===JSON===')
      if(sep>-1){try{const jsonPart=content.slice(sep+10).trim();const parsed=JSON.parse(jsonPart.replace(/```[\w]*\n?/g,''));pqz=parsed.quiz||[]}catch{}content=content.slice(0,sep).trim()}
      api.post('/api/courses',{cacheKey:ck,notes:content,quiz:pqz,subject:'Video',cls:'',chapter:t||vid}).catch(()=>{})
      setNotes(content);setQuiz(pqz)
    }catch(e){setErr(e.status===402?'Subscribe to generate video notes.':e.message)}
    setGen(false)
  }
  if(phase==='watch') return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:16, flexWrap:'wrap' }}>
        <OutlineBtn small onClick={()=>setPhase('search')}>← Back</OutlineBtn>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontSize:14, color:'var(--text-h)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{title}</div>
          {gen&&<div style={{ fontSize:11, color:'#f59e0b', display:'flex', alignItems:'center', gap:4 }}><Spinner size={10}/> Generating AI notes…</div>}
        </div>
      </div>
      <div style={{ display:'flex', gap:3, marginBottom:14, background:'var(--code-bg)', borderRadius:10, padding:3 }}>
        {[['video','📹 Video'],['notes','📝 Notes'],['quiz',`🎯 Quiz (${quiz.length})`]].map(([id,l])=>(
          <button key={id} onClick={()=>setTab(id)} style={{ padding:'7px 15px', borderRadius:7, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', background:tab===id?'var(--accent)':'transparent', color:tab===id?'#fff':'var(--text)', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>{l}</button>
        ))}
      </div>
      {tab==='video'&&<div style={{ position:'relative', paddingBottom:'56.25%', borderRadius:12, overflow:'hidden', background:'#000' }}>
        <iframe src={`https://www.youtube.com/embed/${vidId}?rel=0&modestbranding=1`} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', border:'none' }} allowFullScreen/>
      </div>}
      {tab==='notes'&&(notes?<ContentBox content={notes} label={title} downloadName="video-notes.txt" onDownload={()=>downloadText(notes,'video-notes.txt')}/>:<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<><PageSpinner/><p style={{ marginTop:10 }}>Generating notes…</p></>:<p>Notes unavailable.</p>}</div>)}
      {tab==='quiz'&&(!quiz||quiz.length===0?<div style={{ padding:24, textAlign:'center', color:'var(--text)' }}>{gen?<PageSpinner/>:<p>Quiz not generated yet.</p>}</div>:
        done?(<div><div style={{ textAlign:'center', padding:22, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', borderRadius:14, marginBottom:14 }}><div style={{ fontFamily:"'Sora',sans-serif", fontSize:24, fontWeight:900, color:'var(--accent)' }}>{score}/{quiz.length}</div><div style={{ color:'var(--text)', fontSize:13 }}>{Math.round(score/quiz.length*100)}% correct</div></div><OutlineBtn small onClick={()=>{setAns({});setDone(false)}}>Retake →</OutlineBtn></div>):
        (<div>{quiz.map((q,i)=>(<Card key={i} style={{marginBottom:10}}><p style={{fontWeight:700,fontSize:14,color:'var(--text-h)',margin:'0 0 10px'}}><span style={{color:'var(--accent)'}}>Q{i+1}.</span> {q.q}</p><div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:7}}>{q.opts.map((o,j)=><button key={j} onClick={()=>setAns(a=>({...a,[i]:j}))} style={{padding:'8px 12px',borderRadius:9,border:`1.5px solid ${ans[i]===j?'var(--accent)':'var(--border)'}`,background:ans[i]===j?'var(--accent-bg)':'var(--code-bg)',color:ans[i]===j?'var(--accent)':'var(--text-h)',cursor:'pointer',textAlign:'left',fontSize:13.5,fontFamily:"'Nunito',sans-serif",fontWeight:600}}>{String.fromCharCode(65+j)}. {o}</button>)}</div></Card>))}{Object.keys(ans).length===quiz.length&&<PrimaryBtn onClick={()=>{let s=0;quiz.forEach((q,i)=>{if(ans[i]===q.ans)s++});setScore(s);setDone(true)}}>Submit →</PrimaryBtn>}</div>)
      )}
      <ErrMsg msg={err}/>
    </div>
  )
  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", maxWidth:700, margin:'0 auto' }}>
      <PageHeader icon="🎬" title="Video Learning" subtitle="Paste any YouTube URL → AI generates notes, Q&A and quiz" color="#06b6d4"/>
      <Card style={{ marginBottom:16 }}>
        <Field label="Search a topic or enter YouTube URL">
          <div style={{ display:'flex', gap:8, marginBottom:10 }}>
            <BSInput value={query} onChange={setQuery} placeholder="e.g. Photosynthesis Class 10 CBSE" style={{ flex:1 }}/>
            <PrimaryBtn onClick={()=>query&&load(query,query)} gradient="linear-gradient(135deg,#06b6d4,#6366F1)">Search</PrimaryBtn>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <BSInput value={urlIn} onChange={setUrlIn} placeholder="https://youtube.com/watch?v=..." style={{ flex:1 }}/>
            <OutlineBtn onClick={()=>urlIn&&load(urlIn)} color="#06b6d4">Load →</OutlineBtn>
          </div>
        </Field>
      </Card>
      <Label>Suggested Topics</Label>
      <div style={{ display:'flex', flexWrap:'wrap', gap:7, marginTop:7 }}>
        {SUGG.map(s=><button key={s} onClick={()=>{setQuery(s);load(s,s)}} style={{ padding:'5px 12px', borderRadius:20, border:'1.5px solid var(--accent-border)', background:'var(--accent-bg)', color:'var(--accent)', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Nunito',sans-serif" }}>{s}</button>)}
      </div>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════
//  HISTORY SESSION VIEW  (full-screen modal)
// ══════════════════════════════════════════════════════════════
function HistorySessionView({ item, session, onClose }) {
  const TOOL_META_LOCAL = {
    doubt:      { icon:'🤔', label:'Doubt',        color:'#818CF8', bg:'rgba(129,140,248,.13)' },
    notes:      { icon:'📖', label:'Notes',         color:'#10B981', bg:'rgba(16,185,129,.13)'  },
    quiz:       { icon:'🎯', label:'Quiz',          color:'#F59E0B', bg:'rgba(245,158,11,.13)'  },
    paper:      { icon:'📄', label:'Paper',         color:'#A855F7', bg:'rgba(168,85,247,.13)'  },
    flashcards: { icon:'🃏', label:'Flashcards',    color:'#EF4444', bg:'rgba(239,68,68,.13)'   },
    cheatsheet: { icon:'📋', label:'Cheat Sheet',   color:'#F97316', bg:'rgba(249,115,22,.13)'  },
    lessonplan: { icon:'🎓', label:'Lesson Plan',   color:'#7C3AED', bg:'rgba(124,58,237,.13)'  },
    courses:    { icon:'📚', label:'Course Module', color:'#8B5CF6', bg:'rgba(139,92,246,.13)'  },
  }
  const meta    = TOOL_META_LOCAL[item?.tool] || { icon:'⚡', label:item?.tool, color:'#6366F1', bg:'rgba(99,102,241,.13)' }
  const chapter = session?.chapter || item?.chapter || (item?.chapters||[])[0] || ''

  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  // ── Render content using EXISTING app components ─────────
  function renderContent() {
    if (!session?.content) return null
    const { tool, content, subject, chapter: ch, classLevel } = session

    if (tool === 'notes' || tool === 'cheatsheet' || tool === 'lessonplan') {
      return (
        <NotesDocument
          content={content}
          title={`${ch || subject} Notes — ${subject} ${classLevel}`}
          onDownload={() => downloadText(content, `${ch}-notes.txt`)}
        />
      )
    }

    if (tool === 'paper') {
      const parsed = typeof content === 'string' ? JSON.parse(content) : content
      return (
        <QPaperDocument
          paper={parsed}
          onPaperChange={() => {}}
          schoolName={session.extra?.schoolName || ''}
          onSchoolNameChange={() => {}}
        />
      )
    }

    if (tool === 'quiz') {
      return <ReplayQuiz session={session}/>
    }

    if (tool === 'flashcards') {
      return <ReplayFlashcards session={session}/>
    }

    if (tool === 'doubt') {
      return <ReplayDoubt session={session}/>
    }

    return null
  }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:2000, background:'rgba(5,5,14,.94)', backdropFilter:'blur(14px)', overflowY:'auto' }}>
      {/* Header */}
      <div style={{ position:'sticky', top:0, zIndex:10, background:'rgba(11,11,30,.97)', backdropFilter:'blur(20px)', borderBottom:'1px solid rgba(255,255,255,.07)', padding:'12px 24px', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.05)', color:'#e2e8f0', fontSize:16, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Nunito',sans-serif" }}>←</button>
        <div style={{ width:36, height:36, borderRadius:10, background:meta.bg, border:`1px solid ${meta.color}44`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{meta.icon}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:15, color:'#e2e8f0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {meta.label}: {chapter || item?.subject}
          </div>
          <div style={{ fontSize:11.5, color:'#64748b' }}>
            {item?.subject} {session?.classLevel ? `· ${session.classLevel}` : ''} · {new Date(item?.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
            {!session && <span style={{ color:'#F59E0B', marginLeft:8 }}>⚠ No saved content for this session</span>}
          </div>
        </div>
        <div style={{ fontSize:11, fontWeight:700, color:meta.color, background:meta.bg, borderRadius:20, padding:'3px 12px', border:`1px solid ${meta.color}33`, flexShrink:0 }}>
          {session ? '📂 Session Replay' : '📋 Activity Record'}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth:920, margin:'0 auto', padding:'28px 24px 60px' }}>
        {session ? renderContent() || (
          <div style={{ padding:32, textAlign:'center', color:'var(--text)' }}>Content type not supported for replay yet.</div>
        ) : (
          <div style={{ textAlign:'center', padding:'60px 24px', background:'rgba(255,255,255,.02)', borderRadius:16, border:'1px solid rgba(255,255,255,.07)' }}>
            <div style={{ fontSize:52, marginBottom:14 }}>{meta.icon}</div>
            <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:18, color:'#e2e8f0', marginBottom:8 }}>No saved content</div>
            <p style={{ fontSize:13.5, color:'#64748b', maxWidth:360, margin:'0 auto 24px', lineHeight:1.7 }}>
              Content is now auto-saved after every generation. Older records show your stats only.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center', flexWrap:'wrap' }}>
              <div style={{ padding:'10px 18px', borderRadius:10, background:meta.bg, border:`1px solid ${meta.color}33`, fontSize:13, color:meta.color, fontWeight:700 }}>
                📅 {new Date(item?.created_at).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})}
              </div>
              {item?.xp_earned > 0 && <div style={{ padding:'10px 18px', borderRadius:10, background:'rgba(252,211,77,.08)', border:'1px solid rgba(252,211,77,.2)', fontSize:13, color:'#FCD34D', fontWeight:700 }}>⚡ +{item.xp_earned} XP earned</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Small replay components (only used for tools that don't have
//    a dedicated app-level component) ─────────────────────────

function ReplayQuiz({ session }) {
  const quizData = session.content
  const quiz = quizData?.questions || (Array.isArray(quizData) ? quizData : [])
  const savedScore = quizData?.score
  const savedTotal = quizData?.total
  const wasTimeUp  = quizData?.timeUp
  const [ans, setAns] = useState({})
  const [done, setDone] = useState(false)
  const [bestScore, setBestScore] = useState(savedScore ?? null)
  const [currentScore, setCurrentScore] = useState(0)

  const score = done ? Math.max(currentScore, bestScore ?? 0) : (bestScore ?? 0)
  const isNewBest = done && currentScore > (savedScore ?? 0)
  return (
    <div>
      {/* Show saved score from when quiz was taken */}
      {savedScore !== undefined && !done && (
        <div style={{ background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', borderRadius: 14, padding: '16px 20px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#fff' }}>
          <div>
            <div style={{ fontSize: 12, opacity: .8, marginBottom: 3 }}>Original Score {wasTimeUp ? '(Time Up)' : ''}</div>
            <div style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 26 }}>{savedScore}/{savedTotal}</div>
            <div style={{ fontSize: 12, opacity: .75 }}>{Math.round((savedScore/savedTotal)*100)}% correct</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, opacity: .8, marginBottom: 4 }}>Retake to beat your score</div>
            <div style={{ fontSize: 32 }}>{savedScore === savedTotal ? '🏆' : savedScore >= savedTotal * .8 ? '🎉' : '📚'}</div>
          </div>
        </div>
      )}
      {done && (
        <div style={{ background:'linear-gradient(135deg,#F59E0B,#F97316)', borderRadius:16, padding:24, textAlign:'center', marginBottom:20, color:'#fff' }}>
          <div style={{ fontSize:42, marginBottom:6 }}>{score===quiz.length?'🏆':score>=quiz.length*.7?'🎉':'📚'}</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:900, fontSize:28 }}>{score}/{quiz.length}</div>
          <div style={{ opacity:.85, fontSize:14, marginBottom: isNewBest ? 4 : 12 }}>{Math.round((score/quiz.length)*100)}% correct</div>
          {isNewBest && (
            <div style={{ background:'rgba(255,255,255,.2)', borderRadius:20, padding:'3px 14px', fontSize:12, fontWeight:700, marginBottom:12, display:'inline-block' }}>
              🔥 New Best Score! ({savedScore ?? 0} → {currentScore})
            </div>
          )}
          <button onClick={() => { setAns({}); setDone(false); setCurrentScore(0) }} style={{ padding:'7px 20px', borderRadius:9, background:'rgba(255,255,255,.2)', border:'none', color:'#fff', fontSize:13, fontWeight:600, cursor:'pointer' }}>↺ Retake</button>
        </div>
      )}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(340px,1fr))', gap:12 }}>
        {quiz.map((q,i) => {
          const sel=ans[i], correct=q.answer??q.ans
          return (
            <Card key={i} style={{ borderLeft: done ? `4px solid ${sel===correct?'#22c55e':'#ef4444'}` : '' }}>
              <p style={{ fontWeight:700, fontSize:14.5, color:'var(--text-h)', margin:'0 0 12px', lineHeight:1.5 }}><span style={{ color:'var(--accent)' }}>Q{i+1}.</span> {q.q||q.text}</p>
              <div className="bs-opts-grid">
                {(q.options||q.opts||[]).map((opt,j)=>{
                  const isAns=j===correct, isSel=sel===j
                  let bg='var(--social-bg)', border='var(--border)', color='var(--text-h)'
                  if(done){if(isAns){bg='rgba(34,197,94,.1)';border='#6ee7b7';color='#6ee7b7';}else if(isSel){bg='rgba(239,68,68,.1)';border='#fca5a5';color='#fca5a5';}}
                  else if(isSel){bg='var(--accent-bg)';border='var(--accent)';color='var(--accent)';}
                  return <button key={j} disabled={done} onClick={()=>setAns(a=>({...a,[i]:j}))} style={{ padding:'9px 12px', borderRadius:9, border:`1.5px solid ${border}`, background:bg, color, cursor:done?'default':'pointer', textAlign:'left', fontSize:13.5, fontFamily:"'Nunito',sans-serif", fontWeight:600 }}><span style={{ fontWeight:800, marginRight:4 }}>{String.fromCharCode(65+j)}.</span>{typeof opt==='string'?opt.replace(/^[A-D]\.\s*/,''):opt}{done&&isAns?' ✓':''}</button>
                })}
              </div>
              {done&&(q.explanation||q.exp)&&<div style={{ marginTop:10, padding:'9px 13px', background:'var(--accent-bg)', borderRadius:9, fontSize:13, color:'var(--accent)' }}>💡 {q.explanation||q.exp}</div>}
            </Card>
          )
        })}
      </div>
      {!done && Object.keys(ans).length===quiz.length && <PrimaryBtn onClick={()=>{
        const s = quiz.filter((q, i) => ans[i] === (q.answer ?? q.ans)).length
        setCurrentScore(s)
        setBestScore(prev => (prev === null ? s : Math.max(prev, s)))
        setDone(true)
      }} color='#F59E0B' style={{ marginTop:16 }}>Submit Quiz →</PrimaryBtn>}
    </div>
  )
}

function ReplayFlashcards({ session }) {
  const cards   = Array.isArray(session.content) ? session.content : (session.content?.cards||[])
  const [flipped, setFlipped] = useState({})
  const [mode, setMode]       = useState('grid')
  const [cur, setCur]         = useState(0)
  const card = cards[cur]
  return (
    <div>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
        <h3 style={{ margin:0, fontFamily:"'Sora',sans-serif", fontWeight:800, fontSize:16, color:'var(--text-h)' }}>{session.chapter} — {cards.length} Cards</h3>
        <div style={{ display:'flex', gap:7 }}>
          {[['grid','⊞ Grid'],['study','▶ Study']].map(([m,l])=>(
            <button key={m} onClick={()=>setMode(m)} style={{ padding:'6px 14px', borderRadius:8, border:'none', fontWeight:700, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'#EF4444':'var(--social-bg)', color:mode===m?'#fff':'var(--text-h)' }}>{l}</button>
          ))}
        </div>
      </div>
      {mode==='grid'?(
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(210px,1fr))', gap:14 }}>
          {cards.map((c,i)=>(
            <div key={i} onClick={()=>setFlipped(f=>({...f,[i]:!f[i]}))} style={{ height:130, borderRadius:14, cursor:'pointer', perspective:1000 }}>
              <div style={{ width:'100%', height:'100%', position:'relative', transformStyle:'preserve-3d', transition:'transform .5s', transform:flipped[i]?'rotateY(180deg)':'none' }}>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', background:'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}><span style={{ fontSize:9, color:'rgba(255,255,255,.7)', fontWeight:800, marginBottom:7, letterSpacing:1 }}>TAP TO REVEAL</span><span style={{ color:'#fff', fontWeight:800, fontSize:13.5, lineHeight:1.4 }}>{c.front}</span></div>
                <div style={{ position:'absolute', inset:0, backfaceVisibility:'hidden', transform:'rotateY(180deg)', background:'var(--bg2)', borderRadius:14, border:'2px solid #EF4444', display:'flex', alignItems:'center', justifyContent:'center', padding:14, textAlign:'center' }}><span style={{ color:'var(--text-h)', fontWeight:700, fontSize:13, lineHeight:1.5 }}>{c.back}</span></div>
              </div>
            </div>
          ))}
        </div>
      ):(
        <Card style={{ textAlign:'center', maxWidth:560, margin:'0 auto' }}>
          <div style={{ fontSize:12, color:'var(--text)', marginBottom:8, fontWeight:700 }}>Card {cur+1} of {cards.length}</div>
          <div style={{ background:'var(--border)', borderRadius:999, height:5, margin:'0 auto 18px', maxWidth:240 }}><div style={{ background:'#EF4444', width:`${((cur+1)/cards.length)*100}%`, height:'100%', borderRadius:999 }}/></div>
          <div onClick={()=>setFlipped(f=>({...f,[cur]:!f[cur]}))} style={{ height:180, background:flipped[cur]?'var(--code-bg)':'linear-gradient(135deg,#EF4444,#F97316)', borderRadius:14, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', border:flipped[cur]?'2px solid #EF4444':'none', marginBottom:18, padding:24 }}>
            <span style={{ fontSize:10, color:flipped[cur]?'var(--text)':'rgba(255,255,255,.7)', fontWeight:800, letterSpacing:1, marginBottom:10 }}>{flipped[cur]?'ANSWER':'TERM — TAP TO FLIP'}</span>
            <span style={{ color:flipped[cur]?'var(--text-h)':'#fff', fontWeight:800, fontSize:16, lineHeight:1.5 }}>{flipped[cur]?card?.back:card?.front}</span>
          </div>
          <div style={{ display:'flex', justifyContent:'center', gap:12 }}>
            <GhostBtn disabled={cur===0} onClick={()=>{setCur(c=>c-1);setFlipped({})}}>← Prev</GhostBtn>
            <PrimaryBtn color='#EF4444' onClick={()=>setFlipped(f=>({...f,[cur]:!f[cur]}))}>Flip</PrimaryBtn>
            <GhostBtn disabled={cur===cards.length-1} onClick={()=>{setCur(c=>c+1);setFlipped({})}}>Next →</GhostBtn>
          </div>
        </Card>
      )}
    </div>
  )
}

function ReplayDoubt({ session }) {
  const messages = Array.isArray(session.content) ? session.content : []
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      {messages.filter(m=>m.role!=='system').map((m,i)=>(
        <div key={i} style={{ display:'flex', justifyContent:m.role==='user'?'flex-end':'flex-start', alignItems:'flex-start', gap:10 }}>
          {m.role==='assistant'&&<div style={{ width:32, height:32, borderRadius:9, background:'linear-gradient(135deg,#6366F1,#8B5CF6)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, fontSize:16, marginTop:2 }}>🧠</div>}
          <div style={{ maxWidth:'78%', padding:'11px 15px', borderRadius:m.role==='user'?'14px 4px 14px 14px':'4px 14px 14px 14px', fontSize:14, lineHeight:1.75, background:m.role==='user'?'linear-gradient(135deg,#6366F1,#8B5CF6)':'var(--code-bg)', color:m.role==='user'?'#fff':'var(--text-h)', border:m.role==='assistant'?'1px solid var(--border)':'none' }}
            dangerouslySetInnerHTML={{ __html: m.content.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>') }}
          />
        </div>
      ))}
    </div>
  )
}


const CHAPTER_GRADIENTS = [
  '135deg,#6366F1,#8B5CF6', '135deg,#F59E0B,#EF4444', '135deg,#06b6d4,#6366F1',
  '135deg,#10B981,#06b6d4', '135deg,#EC4899,#8B5CF6', '135deg,#F97316,#F59E0B',
]

function ChapterCard({ group, onOpen, index = 0 }) {
  const [hov, setHov] = useState(false)
  const [hasCourse, setHasCourse] = useState(null)
  useEffect(() => {
    const key = courseListKey(group.subject, group.cls, group.chapterName)
    api.get(`/api/chapter-courses/list/${key}`).then(d => setHasCourse(!!d)).catch(() => setHasCourse(false))
  }, [group.key])

  const grad = CHAPTER_GRADIENTS[index % CHAPTER_GRADIENTS.length]

  return (
    <div onClick={() => onOpen(group)} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ position: 'relative', borderRadius: 18, padding: '20px 20px 18px', cursor: 'pointer', overflow: 'hidden',
        background: `linear-gradient(${grad})`, color: '#fff', minHeight: 150, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', boxShadow: hov ? '0 14px 34px rgba(0,0,0,.22)' : '0 4px 16px rgba(0,0,0,.12)',
        transform: hov ? 'translateY(-3px)' : 'none', transition: 'all .2s' }}>
      <div style={{ position: 'absolute', top: -30, right: -30, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,.12)' }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '2px 10px' }}>{group.subject}</span>
          <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '2px 10px' }}>{group.cls}</span>
          {group.isRandomGroup && <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '2px 10px' }}>🎲 Topic</span>}
        </div>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 17, lineHeight: 1.3 }}>{group.chapterName}</div>
      </div>
      <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: group.counts.notes ? 1 : .45 }}>📖 {group.counts.notes || 0}</span>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: group.counts.quiz ? 1 : .45 }}>🎯 {group.counts.quiz || 0}</span>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: group.counts.flashcards ? 1 : .45 }}>🃏 {group.counts.flashcards || 0}</span>
          <span style={{ fontSize: 12, fontWeight: 700, opacity: hasCourse ? 1 : .45 }}>📚 {hasCourse ? '1' : '0'}</span>
        </div>
        <span style={{ fontSize: 13, fontWeight: 800 }}>{hov ? 'Open →' : '→'}</span>
      </div>
    </div>
  )
}

function StarterChapterCard({ subject, chapter, cls, onStart, index = 0 }) {
  const [hov, setHov] = useState(false)
  const grad = CHAPTER_GRADIENTS[index % CHAPTER_GRADIENTS.length]
  return (
    <div onClick={() => onStart({ subject, chapter, cls })} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ borderRadius: 18, padding: 20, cursor: 'pointer', border: '2px dashed rgba(255,255,255,.28)',
        background: `linear-gradient(${grad})`, color: '#fff', minHeight: 150, display: 'flex', flexDirection: 'column',
        justifyContent: 'space-between', opacity: hov ? 1 : .92, transform: hov ? 'translateY(-3px)' : 'none', transition: 'all .2s' }}>
      <div>
        <span style={{ fontSize: 10.5, fontWeight: 800, background: 'rgba(255,255,255,.22)', borderRadius: 20, padding: '2px 10px' }}>{subject} · {cls}</span>
        <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, marginTop: 10, lineHeight: 1.3 }}>{chapter}</div>
      </div>
      <div style={{ fontSize: 12.5, fontWeight: 800 }}>✨ Start Learning →</div>
    </div>
  )
}

function ChapterHub({ group, onClose, onNavigate }) {
  const [tab, setTab] = useState('notes')
  const [hasCourse, setHasCourse] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  useEffect(() => {
    const key = courseListKey(group.subject, group.cls, group.chapterName)
    api.get(`/api/chapter-courses/list/${key}`).then(d => setHasCourse(!!d)).catch(() => setHasCourse(false))
  }, [group.key])

  const byTool = t => group.items.filter(i => i.tool === t)
  const TOOL_LABEL = { notes: 'Notes', quiz: 'Quiz', flashcards: 'Flashcards' }
const TOOL_ICON  = { notes: '📖', quiz: '🎯', flashcards: '🃏' }
const labelFor = it => {
  const suffix = TOOL_LABEL[it.tool] ? ` ${TOOL_LABEL[it.tool]}` : ''
  const icon   = TOOL_ICON[it.tool]  || '📘'
  if (it.isFull)    return `${icon} Full Chapter${suffix}`
  if (it.isRandom)  return `🎲 Random Topic${suffix}`
  return `📌 ${it.chapter}${suffix}`
}

  const TABS = [
    ['notes', '📖 Notes', byTool('notes').length],
    ['quiz', '🎯 Quiz', byTool('quiz').length],
    ['flashcards', '🃏 Flashcards', byTool('flashcards').length],
    ['courses', '📚 Course', hasCourse ? 1 : 0],
  ]

  function renderList(tool) {
    const items = byTool(tool)
    if (!items.length) return (
      <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94a3b8' }}>
        <div style={{ fontSize: 38, marginBottom: 10 }}>{tool === 'notes' ? '📖' : tool === 'quiz' ? '🎯' : '🃏'}</div>
        <p style={{ fontSize: 13.5 }}>No {tool} generated yet for this chapter.</p>
      </div>
    )
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((it, i) => (
          <div key={i} onClick={() => setSelectedItem(it)}
            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px',
              borderRadius: 12, background: it.isFull ? 'rgba(99,102,241,.1)' : 'rgba(255,255,255,.04)',
              border: `1px solid ${it.isFull ? 'rgba(99,102,241,.3)' : 'rgba(255,255,255,.08)'}`, cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#e2e8f0' }}>{labelFor(it)}</div>
              <div style={{ fontSize: 11.5, color: '#64748b', marginTop: 2 }}>{new Date(it.savedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
            </div>
            <span style={{ color: '#818cf8' }}>→</span>
          </div>
        ))}
      </div>
    )
  }

  function renderContent() {
    if (!selectedItem) return null
    const { tool, content, subject, chapter, classLevel } = selectedItem
    if (tool === 'notes') return <NotesDocument content={content} title={`${chapter} Notes — ${subject} ${classLevel}`} onDownload={() => downloadText(content, `${chapter}-notes.txt`)} />
    if (tool === 'quiz') return <ReplayQuiz session={selectedItem} />
    if (tool === 'flashcards') return <ReplayFlashcards session={selectedItem} />
    return null
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(5,5,14,.96)', backdropFilter: 'blur(14px)', overflowY: 'auto' }}>
      <div style={{ position: 'sticky', top: 0, zIndex: 10, background: 'rgba(11,11,30,.97)', backdropFilter: 'blur(20px)', borderBottom: '1px solid rgba(255,255,255,.07)', padding: '14px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: selectedItem ? 12 : 0 }}>
          <button onClick={() => selectedItem ? setSelectedItem(null) : onClose()}
            style={{ width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,.1)', background: 'rgba(255,255,255,.05)', color: '#e2e8f0', fontSize: 16, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>←</button>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Sora',sans-serif", fontWeight: 800, fontSize: 16, color: '#e2e8f0' }}>{group.chapterName}</div>
            <div style={{ fontSize: 11.5, color: '#64748b' }}>{group.subject} · {group.cls}</div>
          </div>
        </div>
        {!selectedItem && (
          <div style={{ display: 'flex', gap: 6, overflowX: 'auto' }}>
            {TABS.map(([id, label, count]) => (
              <button key={id} onClick={() => setTab(id)}
                style={{ padding: '8px 16px', borderRadius: 10, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer',
                  fontFamily: "'Nunito',sans-serif", whiteSpace: 'nowrap',
                  background: tab === id ? 'linear-gradient(135deg,#6366F1,#8B5CF6)' : 'rgba(255,255,255,.06)',
                  color: tab === id ? '#fff' : '#94a3b8' }}>
                {label}{count > 0 ? ` (${count})` : ''}
              </button>
            ))}
          </div>
        )}
      </div>

      <div style={{ maxWidth: 860, margin: '0 auto', padding: '26px 24px 60px' }}>
        {selectedItem ? renderContent() : (
          tab === 'courses' ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: 44, marginBottom: 12 }}>📚</div>
              <p style={{ color: '#94a3b8', marginBottom: 18, fontSize: 13.5 }}>
                {hasCourse ? 'A video course exists for this chapter.' : 'No video course generated yet for this chapter.'}
              </p>
              <PrimaryBtn color="#8B5CF6" onClick={() => onNavigate('courses', { subject: group.subject, chapter: group.chapterName, cls: group.cls })}>
                {hasCourse ? '▶ Continue Course' : '🚀 Build Course'}
              </PrimaryBtn>
            </div>
          ) : renderList(tab)
        )}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  HISTORY PAGE  (Coursera-style grid)
// ══════════════════════════════════════════════════════════════
function HistoryPage({ onNavigate }) {
  const TOOL_META_H = {
    notes:      { icon:'📖', label:'Notes',         color:'#10B981' },
    quiz:       { icon:'🎯', label:'Quiz',          color:'#F59E0B' },
    paper:      { icon:'📄', label:'Paper',         color:'#A855F7' },
    flashcards: { icon:'🃏', label:'Flashcards',    color:'#EF4444' },
    cheatsheet: { icon:'📋', label:'Cheat Sheet',   color:'#F97316' },
    lessonplan: { icon:'🎓', label:'Lesson Plan',   color:'#7C3AED' },
    courses:    { icon:'📚', label:'Course Module', color:'#8B5CF6' },
  }

  const [history,  setHistory]  = useState([])
  const [loading,  setLoading]  = useState(true)
  const [page,     setPage]     = useState(1)
  const [hasMore,  setHasMore]  = useState(true)
  const [filter,   setFilter]   = useState('all')
  const [selected, setSelected] = useState(null)   // { item, session }
  const [sessions, setSessions] = useState([])

  useEffect(() => { setSessions(listAllSessions()) }, [])

  useEffect(() => {
    setLoading(true)
    api.get(`/api/user/history?page=${page}`)
      .then(data => {
        setHistory(prev => page===1 ? data : [...prev, ...data])
        setHasMore(data.length === 50)
      })
      .catch(()=>{})
      .finally(()=>setLoading(false))
  }, [page])

  const shown   = (filter==='all' ? history : history.filter(h=>h.tool===filter)).filter(h=>h.tool!=='doubt')
  const grouped = shown.reduce((acc,item) => {
    const key = new Date(item.created_at).toLocaleDateString('en-IN',{weekday:'long',day:'numeric',month:'long',year:'numeric'})
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  const hasSessionFor = useCallback(item =>
    sessions.some(s =>
      s.tool===item.tool && s.subject===item.subject &&
      (s.chapter===item.chapter || (item.chapters||[]).some(c=>s.chapter===c||(s.chapters||[]).includes(c))) &&
      Math.abs(new Date(s.savedAt)-new Date(item.created_at)) < 2*60*60*1000
    ), [sessions])

  const openItem = useCallback(item => {
    if (item.tool === 'courses') {
      onNavigate?.('courses', {
        subject: item.subject || '',
        chapter: item.chapter || (item.chapters || [])[0] || '',
        cls: item.metadata?.cls,
      })
      return
    }
    const sess = findSessionForActivity(item)
    setSelected({ item, session: sess })
  }, [onNavigate])

  const tools = ['all', ...Object.keys(TOOL_META_H)]

  function HistoryCard({ item }) {
    const meta = TOOL_META_H[item.tool] || { icon:'⚡', label:item.tool, color:'#6366F1' }
    const [hov, setHov] = useState(false)
    const chapter = item.chapter || (item.chapters||[])[0] || ''
    return (
      <div
        onClick={()=>openItem(item)}
        onMouseEnter={()=>setHov(true)}
        onMouseLeave={()=>setHov(false)}
        style={{
          position:'relative', width:'100%', aspectRatio:'1 / 1.1',
          borderRadius:16, cursor:'pointer', padding:'14px 12px 12px',
          display:'flex', flexDirection:'column', justifyContent:'space-between',
          background: hov ? `${meta.color}14` : 'var(--bg2)',
          border: `1.5px solid ${hov ? meta.color+'55' : 'var(--border)'}`,
          transition:'all .18s ease',
          transform: hov ? 'translateY(-3px)' : 'none',
          boxShadow: hov ? `0 8px 28px ${meta.color}20` : '0 1px 8px rgba(15,23,42,.05)',
          fontFamily:"'Nunito',sans-serif", overflow:'hidden',
        }}
      >
        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:`linear-gradient(90deg,${meta.color},transparent)`, borderRadius:'16px 16px 0 0', opacity:hov?1:0, transition:'opacity .18s' }}/>
        {hasSessionFor(item) && <div style={{ position:'absolute', top:9, right:9, width:7, height:7, borderRadius:'50%', background:meta.color, boxShadow:`0 0 7px ${meta.color}` }}/>}
        <div style={{ width:42, height:42, borderRadius:11, background:`${meta.color}18`, border:`1px solid ${meta.color}33`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:21, flexShrink:0, marginBottom:7 }}>{meta.icon}</div>
        <div style={{ flex:1, minHeight:0 }}>
          <div style={{ fontSize:10.5, fontWeight:800, color:meta.color, textTransform:'uppercase', letterSpacing:'.5px', marginBottom:3 }}>{meta.label}</div>
          {item.subject && <div style={{ fontSize:12.5, fontWeight:700, color:'var(--text-h)', marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.subject}</div>}
          {chapter && <div style={{ fontSize:11, color:'var(--text)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{chapter}</div>}
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.05)' }}>
          <span style={{ fontSize:10, color:'#475569' }}>{(() => { const diff=(Date.now()-new Date(item.created_at))/1000; if(diff<3600) return `${Math.floor(diff/60)}m ago`; if(diff<86400) return `${Math.floor(diff/3600)}h ago`; return new Date(item.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short'}) })()}</span>
          {item.xp_earned>0 && <span style={{ fontSize:10, fontWeight:800, color:'#FCD34D', background:'rgba(252,211,77,.08)', borderRadius:20, padding:'1px 7px' }}>+{item.xp_earned}</span>}
        </div>
        <div style={{ position:'absolute', bottom:10, right:10, fontSize:13, color:meta.color, opacity:hov?1:0, transition:'opacity .15s' }}>→</div>
      </div>
    )
  }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="🕘" title="Activity History" subtitle="Tap any card to replay the full session" color="#6366F1"/>

      {/* Filter pills */}
      <div style={{ display:'flex', gap:7, flexWrap:'wrap', marginBottom:20 }}>
        {tools.map(t => {
          const meta = TOOL_META_H[t]
          return (
            <button key={t} onClick={()=>setFilter(t)} style={{ padding:'5px 14px', borderRadius:20, border:'none', fontWeight:700, fontSize:12, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:filter===t?(meta?.color||'#6366F1'):'var(--social-bg)', color:filter===t?'#fff':'var(--text-h)', transition:'all .15s', display:'flex', alignItems:'center', gap:4 }}>
              {meta ? `${meta.icon} ${meta.label}` : '⚡ All'}
            </button>
          )
        })}
      </div>

      {/* Legend */}
      <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:22, padding:'9px 14px', background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)', fontSize:12, color:'var(--text)', flexWrap:'wrap' }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}><span style={{ background:'rgba(255,255,255,.95)', color:'#6366F1', borderRadius:20, padding:'2px 9px', fontSize:10.5, fontWeight:800 }}>▶ Replay</span> = full session saved — tap to reopen it</div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>No badge = activity record only (older sessions)</div>
      </div>

      {loading && page===1 && <PageSpinner/>}
      {!loading && shown.length===0 && (
        <div style={{ textAlign:'center', padding:60, color:'var(--text)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>🕘</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)', marginBottom:6 }}>No history yet</div>
          <p style={{ fontSize:13 }}>Start using AI tools and every session will appear here.</p>
        </div>
      )}

      {/* Grouped grids */}
      {Object.entries(grouped).map(([date,items]) => (
        <div key={date} style={{ marginBottom:32 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
            <div style={{ height:1, width:14, background:'var(--border)' }}/>
            <span style={{ fontSize:11, fontWeight:800, color:'var(--text)', textTransform:'uppercase', letterSpacing:'.6px', whiteSpace:'nowrap' }}>{date}</span>
            <div style={{ height:1, flex:1, background:'var(--border)' }}/>
            <span style={{ fontSize:11, color:'#1e293b', fontWeight:700 }}>{items.length} session{items.length!==1?'s':''}</span>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
            {items.map((item,i) => <HistoryCard key={item.id||i} item={item}/>)}
          </div>
        </div>
      ))}

      {hasMore && !loading && shown.length>0 && (
        <div style={{ textAlign:'center', marginTop:16 }}>
          <GhostBtn onClick={()=>setPage(p=>p+1)}>Load More</GhostBtn>
        </div>
      )}
      {loading && page>1 && <div style={{ display:'flex', justifyContent:'center', padding:16 }}><Spinner size={22}/></div>}

      {selected && <HistorySessionView item={selected.item} session={selected.session} onClose={()=>setSelected(null)}/>}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  MAIN APP
// ══════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════
//  TRIAL / SUBSCRIPTION BADGE (header)
// ══════════════════════════════════════════════════════════════
function TrialBadge({ user, onUpgrade }) {
  const isMobile = useIsMobile()
  const [info, setInfo] = useState(null)
  useEffect(() => {
    if (!user || user.type === 'school') return
    api.get('/api/user/subscription').then(setInfo).catch(() => {})
  }, [user?.id, user?.subscription_status])

  if (!info || info.state === 'school') return null

  // Subscribed and not near expiry → quiet "Pro" pill, no upgrade button
  if (info.state === 'active') {
    return <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 12px', borderRadius:20, background:'var(--accent-bg)', border:'1px solid var(--accent-border)', color:'var(--accent)', fontWeight:800, fontSize:12, fontFamily:"'Nunito',sans-serif" }}>⭐ Pro</span>
  }

  const days     = info.daysLeft || 0
  const expired  = info.state === 'trial_expired'
  const expiring = info.state === 'sub_expiring'
  const danger   = expired || days <= 3
  const label    = expired  ? 'Trial ended'
                 : isMobile ? `${days}d free`
                 : expiring ? `${days} day${days!==1?'s':''} left`
                 : `${days} day${days!==1?'s':''} free left`

  return (
    <div style={{ display:'inline-flex', alignItems:'center', gap:8 }}>
      <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'6px 11px', borderRadius:20, background: danger ? 'rgba(239,68,68,.1)' : 'var(--accent-bg)', border:`1px solid ${danger ? 'rgba(239,68,68,.3)' : 'var(--accent-border)'}`, color: danger ? '#dc2626' : 'var(--accent)', fontWeight:700, fontSize:12, fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>
        {danger ? '⚠️' : '⏱'} {label}
      </span>
      <button onClick={onUpgrade} style={{ padding:'6px 14px', borderRadius:9, border:'none', background:'linear-gradient(135deg,#4f46e5,#8B5CF6)', color:'#fff', fontWeight:800, fontSize:12.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", whiteSpace:'nowrap' }}>
        ⚡ {(expired||expiring) ? 'Renew' : (isMobile ? 'Pro' : 'Go Pro')}
      </button>
    </div>
  )
}

const BOTTOM_TABS = [
  { id: 'dashboard', icon: '🏠', label: 'Home',  color: '#4f46e5' },
  { id: 'doubt',     icon: '🤔', label: 'Ask',   color: '#818CF8' },
  { id: 'notes',     icon: '📖', label: 'Notes', color: '#10B981' },
  { id: 'quiz',      icon: '🎯', label: 'Quiz',  color: '#F59E0B' },

]


function MobileBottomNav({ activeTab, onTabChange, onMoreOpen, unreadCount = 0 }) {
  const isMoreActive = !BOTTOM_TABS.some(t => t.id === activeTab)
  const activeColor  = BOTTOM_TABS.find(t => t.id === activeTab)?.color || '#4f46e5'
 
  return (
    <nav className="bs-bottom-nav" aria-label="Main navigation">
      <div style={{ display: 'flex', alignItems: 'stretch', height: 58 }}>
 
        {BOTTOM_TABS.map(t => {
          const active = activeTab === t.id
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              aria-label={t.label}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1, display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center', gap: 3,
                border: 'none', background: 'none', cursor: 'pointer',
                padding: '6px 4px 5px', minHeight: 48,
                color: active ? t.color : '#94a3b8',
                fontFamily: "'Nunito', sans-serif",
                position: 'relative', transition: 'color .12s',
              }}
            >
              {/* Active pill indicator at top */}
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%',
                  transform: 'translateX(-50%)',
                  width: 30, height: 3, borderRadius: '0 0 4px 4px',
                  background: t.color,
                }} />
              )}
              <span style={{
                fontSize: 22, lineHeight: 1,
                transform: active ? 'scale(1.1) translateY(-1px)' : 'scale(1)',
                transition: 'transform .15s',
                display: 'block',
              }}>{t.icon}</span>
              <span style={{ fontSize: 9.5, fontWeight: active ? 800 : 600, letterSpacing: '.15px' }}>
                {t.label}
              </span>
            </button>
          )
        })}
 
        {/* More button */}
        <button
          onClick={onMoreOpen}
          aria-label="More tools"
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 3,
            border: 'none', background: 'none', cursor: 'pointer',
            padding: '6px 4px 5px', minHeight: 48,
            color: isMoreActive ? '#4f46e5' : '#94a3b8',
            fontFamily: "'Nunito', sans-serif",
            position: 'relative', transition: 'color .12s',
          }}
        >
          {isMoreActive && (
            <span style={{
              position: 'absolute', top: 0, left: '50%',
              transform: 'translateX(-50%)',
              width: 30, height: 3, borderRadius: '0 0 4px 4px', background: '#4f46e5',
            }} />
          )}
          <span style={{ fontSize: 22, lineHeight: 1, position: 'relative', display: 'block' }}>
            ⋯
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute', top: -5, right: -9,
                minWidth: 14, height: 14, padding: '0 3px',
                borderRadius: 7, background: '#ef4444', color: '#fff',
                fontSize: 8, fontWeight: 800,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>{unreadCount > 9 ? '9+' : unreadCount}</span>
            )}
          </span>
          <span style={{ fontSize: 9.5, fontWeight: isMoreActive ? 800 : 600, letterSpacing: '.15px' }}>
            More
          </span>
        </button>
 
      </div>
    </nav>
  )
}
 
// ─────────────────────────────────────────────────────────────
//  MobileMoreSheet  —  full tool picker in a bottom sheet
// ─────────────────────────────────────────────────────────────
function MobileMoreSheet({ user, activeTab, onTabChange, onLogout, onClose, unreadCount = 0 }) {
  const isSchool  = user?.type === 'school'
  const isTeacher = user?.role === 'teacher'
 
  // All non-primary tools, grouped into rows of 3
  const ALL_TOOLS = [
    { id: 'flashcards',  icon: '🃏', label: 'Flashcards', color: '#EF4444' },
    { id: 'courses',     icon: '📚', label: 'Courses',    color: '#8B5CF6' },
    { id: 'history',     icon: '🕘', label: 'History',    color: '#6366F1' },
    { id: 'feed',        icon: '📣', label: 'Feed',       color: '#6366F1' },
    { id: 'search',      icon: '🔍', label: 'Search',     color: '#06b6d4' },
    { id: 'messages',    icon: '💬', label: 'Messages',   color: '#10B981', badge: unreadCount },
    ...(isSchool ? [
      { id: 'assignments', icon: '📝', label: 'Homework',  color: '#F59E0B' },
      { id: 'notices',     icon: '📢', label: 'Notices',   color: '#F97316' },
      { id: 'timetable',   icon: '📅', label: 'Timetable', color: '#06b6d4' },
    ] : []),
    ...(isTeacher ? [
      { id: 'lessonplan', icon: '🎓', label: 'Lesson',   color: '#7C3AED' },
      { id: 'paper',      icon: '📄', label: 'QP Maker', color: '#A855F7' },
    ] : []),
  ]
 
  // Split into rows of 3 for the grid
  const ROWS = []
  for (let i = 0; i < ALL_TOOLS.length; i += 3) ROWS.push(ALL_TOOLS.slice(i, i + 3))
 
  const goTo = id => { onTabChange(id); onClose() }
 
  return (
    <>
      {/* Dim backdrop — tap to close */}
      <div className="bs-backdrop" onClick={onClose} />
 
      <div className="bs-sheet" style={{ fontFamily: "'Nunito', sans-serif" }}>
 
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 8px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>
 
        {/* User identity card */}
        <div style={{
          margin: '0 16px 16px',
          padding: '14px 16px',
          borderRadius: 16,
          background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)',
          border: '1px solid #e0e7ff',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 46, height: 46, borderRadius: '50%',
            background: 'linear-gradient(135deg,#6366F1,#8B5CF6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 900, fontSize: 20, flexShrink: 0, overflow: 'hidden',
          }}>
            {user?.avatar_url
              ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : (user?.name?.[0]?.toUpperCase() || '?')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800, color: '#1e293b', fontSize: 15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name}
            </div>
            <div style={{ fontSize: 12, color: '#6366F1', fontWeight: 700 }}>
              {user?.role === 'teacher' ? '👨‍🏫 Teacher' : `🎒 ${user?.class_level || 'Student'}`}
            </div>
          </div>
          <button onClick={() => goTo('profile')} style={{
            padding: '7px 14px', borderRadius: 20,
            border: 'none', background: '#6366F1', color: '#fff',
            fontSize: 12.5, fontWeight: 700, cursor: 'pointer', flexShrink: 0,
            fontFamily: "'Nunito', sans-serif",
          }}>Profile →</button>
        </div>
 
        {/* ── Tool grid ── */}
        <div style={{ padding: '0 16px' }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.6px', marginBottom: 10, fontFamily: "'Nunito', sans-serif" }}>
            All Tools
          </div>
          {ROWS.map((row, ri) => (
            <div key={ri} style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${row.length}, 1fr)`,
              gap: 10, marginBottom: 10,
            }}>
              {row.map(item => {
                const active = activeTab === item.id
                return (
                  <button key={item.id} onClick={() => goTo(item.id)} style={{
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 7, padding: '16px 6px', borderRadius: 16,
                    border: `1.5px solid ${active ? item.color : '#f1f5f9'}`,
                    background: active ? `${item.color}14` : '#f8fafc',
                    cursor: 'pointer', position: 'relative',
                    minHeight: 88,   /* big enough to tap easily */
                    transition: 'all .12s',
                    fontFamily: "'Nunito', sans-serif",
                  }}>
                    <span style={{ fontSize: 28, lineHeight: 1 }}>{item.icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: active ? item.color : '#475569', lineHeight: 1.2, textAlign: 'center' }}>
                      {item.label}
                    </span>
                    {item.badge > 0 && (
                      <span style={{
                        position: 'absolute', top: 8, right: 8,
                        minWidth: 17, height: 17, padding: '0 4px',
                        borderRadius: 9, background: '#ef4444', color: '#fff',
                        fontSize: 9, fontWeight: 800,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{item.badge > 9 ? '9+' : item.badge}</span>
                    )}
                  </button>
                )
              })}
            </div>
          ))}
        </div>
 
        {/* ── Bottom action rows ── */}
        <div style={{ padding: '12px 16px 4px', borderTop: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => goTo('achievements')} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 16px', borderRadius: 12,
            border: '1px solid #f1f5f9', background: '#f8fafc',
            cursor: 'pointer', textAlign: 'left', minHeight: 50,
            fontFamily: "'Nunito', sans-serif",
          }}>
            <span style={{ fontSize: 22 }}>🏆</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Achievements</span>
          </button>
 
          {user?.type !== 'school' && (
            <button onClick={() => goTo('subscription')} style={{
              display: 'flex', alignItems: 'center', gap: 14,
              padding: '13px 16px', borderRadius: 12,
              border: '1px solid #e0e7ff',
              background: 'linear-gradient(135deg,#eef2ff,#f5f3ff)',
              cursor: 'pointer', textAlign: 'left', minHeight: 50,
              fontFamily: "'Nunito', sans-serif",
            }}>
              <span style={{ fontSize: 22 }}>⚡</span>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#4f46e5' }}>Upgrade to Pro</span>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: '#818cf8', fontWeight: 700 }}>→</span>
            </button>
          )}
 
          <button onClick={() => { onClose(); onLogout() }} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '13px 16px', borderRadius: 12,
            border: '1px solid #fee2e2', background: '#fff5f5',
            cursor: 'pointer', textAlign: 'left', minHeight: 50,
            fontFamily: "'Nunito', sans-serif",
          }}>
            <span style={{ fontSize: 22 }}>⏻</span>
            <span style={{ fontSize: 14, fontWeight: 700, color: '#ef4444' }}>Sign Out</span>
          </button>
        </div>
 
      </div>
    </>
  )
}
 
// ─────────────────────────────────────────────────────────────
//  BottomSheet  —  reusable utility for confirms, pickers, etc.
// ─────────────────────────────────────────────────────────────
function BottomSheet({ isOpen, onClose, title, children }) {
  if (!isOpen) return null
  return (
    <>
      <div className="bs-backdrop" onClick={onClose} />
      <div className="bs-sheet" style={{ fontFamily: "'Nunito', sans-serif" }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#e2e8f0' }} />
        </div>
        {title && (
          <div style={{
            padding: '4px 20px 14px',
            fontFamily: "'Sora', sans-serif", fontWeight: 800,
            fontSize: 17, color: '#1e293b', borderBottom: '1px solid #f1f5f9',
          }}>{title}</div>
        )}
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </>
  )
}
 


export default function App() {
  useFonts()
  const isMobile = useIsMobile()

  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('bs_user')) } catch { return null }
  })
  const [page, setPage]               = useState(() => localStorage.getItem('bs_user') ? 'app' : 'landing')
  const [tab, setTab]                 = useState('dashboard')
  const [initAuthMode, setInitAuthMode] = useState('login')
  const [viewProfileId, setViewProfileId] = useState(null)
  const [msgUserId, setMsgUserId]     = useState(null)
  const [trialExpired, setTrialExpired] = useState(false)
  const [prefill, setPrefill]         = useState(null)
  const [unreadCount, setUnreadCount] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeChapterGroup, setActiveChapterGroup] = useState(null)
  const [moreOpen, setMoreOpen] = useState(false)

  

  const fetchUnread = useCallback(() => {
    api.get('/api/messages/unread-count').then(d => setUnreadCount(d.count || 0)).catch(() => {})
  }, [])

  useEffect(() => {
    if (!user) return
    fetchUnread()
    const i = setInterval(fetchUnread, 15000)
    return () => clearInterval(i)
  }, [user, fetchUnread])

  useEffect(() => {
    if (!user) return
    api.get('/api/auth/me')
      .then(u => { setUser(u); localStorage.setItem('bs_user', JSON.stringify(u)) })
      .catch(e => {
        if (e.code === 'SESSION_REPLACED') { alert('You have been signed in on another device.'); logout() }
        else if (e.status === 401) logout()
      })
  }, [])

  function handleAuth(data) {
    if (data === 'forgot') { setPage('forgot'); return }
    setUser(data); setPage('app'); setTab('dashboard')
    localStorage.setItem('bs_user', JSON.stringify(data))
  }

  function logout() {
    api.post('/api/auth/logout', {}).catch(() => {})
    localStorage.clear()
    setUser(null); setPage('landing'); setTab('dashboard')
  }

  function updateUser(u) {
    setUser(u); localStorage.setItem('bs_user', JSON.stringify(u))
  }

  function clearPrefill() { setPrefill(null) }

  if (page === 'landing') return (
    <LandingPage onStart={mode => { setInitAuthMode(mode === 'signup' ? 'register' : 'login'); setPage('auth') }} />
  )
  if (!user || page === 'auth') return (
    <AuthPage onAuth={handleAuth} initMode={initAuthMode} />
  )
  if (page === 'forgot') return (
    <ForgotPasswordPage onBack={() => setPage('auth')} />
  )

  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isSchool  = user.type === 'school'

  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard',      color: '#6366F1' },
    { id: 'doubt',       icon: '🤔', label: 'Doubt Solver',    color: '#818CF8' },
    { id: 'notes',       icon: '📖', label: 'Notes',           color: '#10B981' },
    { id: 'quiz',        icon: '🎯', label: 'Quiz',            color: '#F59E0B' },
    { id: 'flashcards',  icon: '🃏', label: 'Flashcards',      color: '#EF4444' },
    { id: 'courses',     icon: '📚', label: 'Youtube Courses', color: '#8B5CF6' },
    { id: 'search',      icon: '🔍', label: 'Search',          color: '#06b6d4' },
    { id: 'messages',    icon: '💬', label: 'Messages',        color: '#10B981' },
    ...(isSchool ? [
      { id: 'assignments', icon: '📝', label: 'Assignments', color: '#F59E0B' },
      { id: 'notices',     icon: '📢', label: 'Notices',     color: '#F97316' },
      { id: 'timetable',   icon: '📅', label: 'Timetable',   color: '#06b6d4' },
    ] : []),
    ...(isTeacher && isSchool ? [{ id: 'school', icon: '🏫', label: 'Analytics', color: '#A855F7' }] : []),
    { id: 'feed',        icon: '📣', label: 'Study Feed',      color: '#6366F1' },
    { id: 'history',     icon: '🕘', label: 'History',         color: '#6366F1' }
  ]

  const LEARN_TAB_IDS = new Set(['dashboard', 'doubt', 'notes', 'quiz', 'flashcards', 'courses', 'history'])

  const navSectionLabel = text => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px 4px' }}>
      <span style={{ fontSize: 9.5, fontWeight: 800, letterSpacing: '.7px', textTransform: 'uppercase', color: 'var(--text)', whiteSpace: 'nowrap' }}>{text}</span>
      <span style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )

  const renderTab = t => {
    const active = tab === t.id
    return (
      <button key={t.id} onClick={() => setTab(t.id)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: active ? `linear-gradient(135deg,${t.color},${t.color}bb)` : 'transparent', color: active ? '#fff' : 'var(--text-h)', fontWeight: active ? 800 : 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}
        onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.05)' }}
        onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
        <span style={{ fontSize: 16 }}>{t.icon}</span>
        {t.id === 'messages' && unreadCount > 0 && (
          <span style={{ marginLeft: 'auto', minWidth: 18, height: 18, padding: '0 5px', borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        {t.label}
      </button>
    )
  }

  const renderPage = () => {
    if (tab === 'subscription') return (
      <SubscriptionPage
        user={user}
        onSuccess={() => { api.get('/api/auth/me').then(updateUser); setTab('dashboard') }}
        onBack={() => setTab('dashboard')}
      />
    )
    if (tab === 'achievements') return <AchievementsPage />
    if (tab === 'profile')      return (
      <ProfilePage
        userId={viewProfileId || undefined}
        currentUser={user}
        onBack={() => { setTab(viewProfileId ? 'search' : 'dashboard'); setViewProfileId(null) }}
        onMessage={id => { setMsgUserId(id); setTab('messages') }}
      />
    )
    if (tab === 'dashboard')  return <Dashboard user={user} onNavigate={(t, pf) => { if (pf) setPrefill(pf); setTab(t) }} onOpenChapter={setActiveChapterGroup} />
    if (tab === 'feed')       return <SocialFeed user={user} />
    if (tab === 'search')     return <SearchPage currentUser={user} onViewProfile={id => { setViewProfileId(id); setTab('profile') }} onMessage={id => { setMsgUserId(id); setTab('messages') }} />
    if (tab === 'messages')   return <MessagingPage currentUser={user} startWithUserId={msgUserId} onConversationRead={fetchUnread} />
    if (tab === 'history')    return <HistoryPage onNavigate={(t, pf) => { if (pf) setPrefill(pf); setTab(t) }} />
    if (tab === 'video')      return <VideoLearn user={user} />
    if (tab === 'cheatsheet') return <CheatSheetMaker user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'paper')      return <QPMaker         user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'lessonplan') return <LessonPlanner   user={user} prefill={prefill} onClearPrefill={clearPrefill} />
    if (tab === 'assignments') return <AssignmentsPage user={user} />
    if (tab === 'notices')    return <NoticesPage user={user} />
    if (tab === 'timetable')  return <TimetablePage user={user} />
    if (tab === 'school')     return <SchoolDashboard user={user} />
    return <Dashboard user={user} onNavigate={(t, pf) => { if (pf) setPrefill(pf); setTab(t) }} onOpenChapter={setActiveChapterGroup} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'transparent', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header ───────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100, background: 'var(--bg2)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 12px rgba(15,23,42,.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => setTab('dashboard')}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🧠</div>
          <span style={{ fontFamily: "'Sora', sans-serif", fontWeight: 900, fontSize: 17, color: 'var(--text-h)' }}>
            BrainSpark<span style={{ color: '#818CF8' }}> AI</span>
          </span>
          {isSchool && user.schools && (
            <span style={{ fontSize: 11.5, color: 'var(--accent)', fontWeight: 700, background: 'var(--accent-bg)', padding: '2px 10px', borderRadius: 20, border: '1px solid var(--accent-border)' }}>
              🏫 {user.schools.name}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', gap: isMobile ? 6 : 8, alignItems: 'center', minWidth: 0 }}>


        

          {/* Messages — visible on both sizes */}
          <button onClick={() => setTab('messages')} title="Messages"
            style={{ position: 'relative', width: isMobile ? 34 : 36, height: isMobile ? 34 : 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--social-bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            💬
            {unreadCount > 0 && (
              <span style={{ position: 'absolute', top: -5, right: -5, minWidth: 17, height: 17, padding: '0 4px', borderRadius: 9, background: '#ef4444', color: '#fff', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid var(--bg)' }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* ── DESKTOP: original layout, unchanged ── */}
          {!isMobile && <>
            {!isSchool && <TrialBadge user={user} onUpgrade={() => setTab('subscription')} />}
            <button onClick={() => setTab('achievements')} title="Achievements" style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--social-bg)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>🏆</button>
            <button onClick={() => { setViewProfileId(null); setTab('profile') }} title="My Profile" style={{ width: 36, height: 36, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", flexShrink: 0, overflow: 'hidden' }}>
              {user.avatar_url
                ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 9, objectFit: 'cover' }} />
                : (user.name?.[0]?.toUpperCase() || '?')}
            </button>
            <button onClick={logout} title="Sign Out" style={{ padding: '6px 13px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', color: 'var(--text)', cursor: 'pointer', fontSize: 13, fontWeight: 700, fontFamily: "'Nunito', sans-serif", flexShrink: 0 }}>Sign Out</button>
          </>}

          {/* ── MOBILE ONLY: avatar dropdown ── */}
          {isMobile && (
            <div style={{ position: 'relative' }}>
              <button onClick={() => setMenuOpen(o => !o)} title="Menu"
                style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#6366F1,#8B5CF6)', cursor: 'pointer', fontSize: 14, fontWeight: 900, color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Sora', sans-serif", flexShrink: 0, overflow: 'hidden' }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 9, objectFit: 'cover' }} />
                  : (user.name?.[0]?.toUpperCase() || '?')}
              </button>
              {menuOpen && (
                <>
                  <div onClick={() => setMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 200 }} />
                  <div style={{ position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 201, minWidth: 190, background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: '0 12px 40px rgba(15,23,42,.18)', overflow: 'hidden', padding: 6 }}>
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid var(--border)', marginBottom: 4 }}>
                      <div style={{ fontWeight: 800, fontSize: 13.5, color: 'var(--text-h)', fontFamily: "'Sora',sans-serif" }}>{user.name}</div>
                      <div style={{ fontSize: 11.5, color: 'var(--text)' }}>{user.role}{user.class_level ? ` · ${user.class_level}` : ''}</div>
                    </div>
                    {[
                      ['👤 My Profile',   () => { setViewProfileId(null); setTab('profile') }],
                      ['🏆 Achievements', () => setTab('achievements')],
                      ...(!isSchool ? [['⚡ Upgrade', () => setTab('subscription')]] : []),
                    ].map(([label, fn]) => (
                      <button key={label} onClick={() => { setMenuOpen(false); fn() }}
                        style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: 'none', background: 'transparent', color: 'var(--text-h)', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: "'Nunito',sans-serif" }}>{label}</button>
                    ))}
                    <button onClick={() => { setMenuOpen(false); logout() }}
                      style={{ width: '100%', textAlign: 'left', padding: '9px 12px', borderRadius: 8, border: 'none', borderTop: '1px solid var(--border)', background: 'transparent', color: '#ef4444', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: "'Nunito',sans-serif", marginTop: 4 }}>⏻ Sign Out</button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </header>

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Desktop sidebar ──────────────────────────────────── */}
        <nav className="desktop-sidebar" style={{ width: 210, borderRight: '1px solid var(--border)', padding: '12px 8px', background: 'var(--bg2)', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {isSchool ? (
            <>
              {navSectionLabel('Learn')}
              {tabs.filter(t => LEARN_TAB_IDS.has(t.id)).map(renderTab)}
              {navSectionLabel('My School')}
              {tabs.filter(t => !LEARN_TAB_IDS.has(t.id)).map(renderTab)}
            </>
          ) : (
            tabs.map(renderTab)
          )}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <button onClick={() => setTab('achievements')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === 'achievements' ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' : 'transparent', color: tab === 'achievements' ? '#fff' : 'var(--text-h)', fontWeight: 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}>
            <span style={{ fontSize: 16 }}>🏆</span> Achievements
          </button>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main className="bs-main" style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '16px 24px 0', paddingBottom: 0 }}>
          </div>

          <div style={{ display: tab === 'doubt'      ? 'block' : 'none', height: '100%' }}><DoubtSolver    user={user} prefill={tab === 'doubt'      ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'notes'      ? 'block' : 'none', height: '100%' }}><NotesMaker     user={user} prefill={tab === 'notes'      ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'quiz'       ? 'block' : 'none', height: '100%' }}><QuizGenerator  user={user} prefill={tab === 'quiz'       ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'flashcards' ? 'block' : 'none', height: '100%' }}><FlashCards     user={user} prefill={tab === 'flashcards' ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'courses'    ? 'block' : 'none', height: '100%' }}><ChapterCourses user={user} prefill={tab === 'courses'    ? prefill : null} onClearPrefill={clearPrefill} /></div>

          {!['doubt','notes','quiz','flashcards','courses'].includes(tab) && renderPage()}
        </main>

      </div>

      {/* ── AI Buddy (all users) ─────────────────────── */}
      {user && <TalkingBuddy user={user} />}

      {/* ── Chapter Hub overlay ─────────────────────── */}
      {activeChapterGroup && (
        <ChapterHub
          group={activeChapterGroup}
          onClose={() => setActiveChapterGroup(null)}
          onNavigate={(t, pf) => { setActiveChapterGroup(null); if (pf) setPrefill(pf); setTab(t) }}
        />
      )}

      {/* ── Mobile bottom nav + More sheet ───────────── */}  {/* ← NEW */}
      {isMobile && (
        <>
          <MobileBottomNav
            activeTab={tab}
            onTabChange={t => { setTab(t); setMoreOpen(false) }}
            onMoreOpen={() => setMoreOpen(true)}
            unreadCount={unreadCount}
          />
          {moreOpen && (
            <MobileMoreSheet
              user={user}
              activeTab={tab}
              onTabChange={t => { setTab(t); setMoreOpen(false) }}
              onLogout={logout}
              onClose={() => setMoreOpen(false)}
              unreadCount={unreadCount}
            />
          )}
        </>
      )}

    </div>
  )
}
