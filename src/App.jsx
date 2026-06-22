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

// ══════════════════════════════════════════════════════════════
//  FONT + STYLE INJECTION
// ══════════════════════════════════════════════════════════════
function useFonts() {
  useEffect(() => {
    if (!document.getElementById('brainspark-fonts')) {
      const link = document.createElement('link')
      link.id = 'brainspark-fonts'
      link.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;500;600;700;800;900&family=Sora:wght@600;700;800;900&display=swap'
      link.rel = 'stylesheet'
      document.head.appendChild(link)
    }
    if (!document.getElementById('brainspark-styles')) {
      const style = document.createElement('style')
      style.id = 'brainspark-styles'
      style.textContent = `
        :root {
          --bg: #f4f4f0; --bg2: #ffffff; --text: #64748b; --text-h: #1e293b;
          --border: rgba(15,23,42,.10); --accent: #4f46e5;
          --accent-bg: rgba(79,70,229,.08); --accent-border: rgba(79,70,229,.20);
          --code-bg: rgba(15,23,42,.035); --social-bg: rgba(15,23,42,.035);
        }
        * { box-sizing: border-box; }
        html, body { overflow-x: clip; max-width: 100%; }
        body { margin: 0; background: var(--bg); color: var(--text-h); }
        @keyframes spin      { to { transform: rotate(360deg) } }
        @keyframes dotBounce { 0%,100%{opacity:.25;transform:scale(.8)} 50%{opacity:1;transform:scale(1)} }
        @keyframes slideUp   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:none} }
        @keyframes fadeIn    { from{opacity:0} to{opacity:1} }
        @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
        .brainspark-font { font-family: 'Nunito', system-ui, sans-serif; }
        @media (max-width: 768px) { .desktop-sidebar { display: none !important; } }
        @media (min-width: 769px) { .mobile-top-nav  { display: none !important; } }
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

const getChapters = (subject, cls) =>
  ALL_CHAPTERS[cls]?.[subject] || []

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
    doc.text('BrainSpark AI · CBSE Notes', MARGIN_X, PAGE_H - 8)
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



function downloadText(content, filename = 'brainspark.txt') {
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
  card:   { background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:'14px', padding:'20px', boxShadow:'0 2px 12px rgba(0,0,0,.12)' },
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
function Card({ children, style={} }) { return <div style={{ ...T.card, ...style }}>{children}</div> }
function Label({ children }) { return <div style={T.label}>{children}</div> }
function PrimaryBtn({ children, onClick, disabled, color='var(--accent)', small, style={}, gradient }) {
  const bg = gradient
    || (color.startsWith('var(') ? color : `linear-gradient(135deg, ${color}, ${color}cc)`)
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ background:bg, color:'#fff', padding:small?'7px 14px':'11px 22px', borderRadius:small?9:11, border:'none', fontWeight:800, fontSize:small?12.5:14.5, cursor:disabled?'not-allowed':'pointer', display:'inline-flex', alignItems:'center', gap:6, fontFamily:"'Nunito', sans-serif", opacity:disabled?.6:1, transition:'opacity .15s', ...style }}
      onMouseEnter={e=>{ if(!disabled) e.currentTarget.style.opacity='.88' }}
      onMouseLeave={e=>{ e.currentTarget.style.opacity='1' }}>
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
function BSInput({ value, onChange, placeholder, type='text', required, disabled, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <input value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} type={type}
      required={required} disabled={disabled}
      style={{ ...T.input, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}
function BSSelect({ value, onChange, options, style = {} }) {
  const [focused, setFocused] = useState(false)
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      style={{
        width: '100%',
        padding: '10px 14px',
        borderRadius: '10px',
        border: `1.5px solid ${focused ? 'var(--accent)' : 'var(--border)'}`,
        background: '#ffffff',
        color: '#1e293b',                // ← always light text
        fontSize: '14px',
        fontFamily: "'Nunito', sans-serif",
        appearance: 'auto',
        outline: 'none',
        cursor: 'pointer',
        transition: 'border-color .2s',
        ...style,
      }}
    >
      {options.map(o => (
        <option
          key={o.value ?? o}
          value={o.value ?? o}
          style={{ background: '#ffffff', color: '#1e293b' }}   // ← fixes option visibility
        >
          {o.label ?? o}
        </option>
      ))}
    </select>
  )
}
function BSTextarea({ value, onChange, placeholder, rows=4, style={} }) {
  const [focused, setFocused] = useState(false)
  return (
    <textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} rows={rows}
      style={{ ...T.input, resize:'vertical', lineHeight:1.6, borderColor:focused?'var(--accent)':'var(--border)', ...style }}
      onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)}/>
  )
}
function Spinner({ size=16 }) {
  return <div style={{ width:size, height:size, border:`2px solid rgba(255,255,255,.15)`, borderTopColor:'white', borderRadius:'50%', animation:'spin .7s linear infinite', flexShrink:0 }}/>
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
    ? '── Select chapters ──'
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
          background: '#0f0f23', color: selected.length ? '#e2e8f0' : '#64748b',
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
          background: '#0f0f23', border: '1.5px solid var(--accent-border)',
          borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.5)',
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
                border: '1px solid var(--border)', background: 'rgba(255,255,255,.05)',
                color: '#e2e8f0', fontSize: 13, fontFamily: "'Nunito', sans-serif", outline: 'none',
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
                  <span style={{ fontSize: 13.5, color: checked ? 'var(--accent)' : '#e2e8f0', fontWeight: checked ? 700 : 400, fontFamily: "'Nunito', sans-serif" }}>
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
        try { setBusy(true); setErr(''); const data = await api.post('/api/auth/google',{idToken:resp.credential}); saveAuth(data); onAuth(data.user) }
        catch(e){ setErr(e.message) } finally{ setBusy(false) }
      }})
      window.google.accounts.id.renderButton(gBtnRef.current,{ theme:'outline', size:'large', width:280 })
    }).catch(()=>{})
  },[tab])

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
            <button key={r} onClick={()=>setRole(r)} style={{ flex:1, padding:'8px 12px', borderRadius:9, border:`2px solid ${role===r?'var(--accent)':'var(--border'}`, fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:role===r?'var(--accent-bg)':'transparent', color:role===r?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
          ))}
        </div>
        {tab==='personal'&&<>
          <div style={{ display:'flex', gap:8, marginBottom:18 }}>
            {[['login','Sign In'],['register','Register']].map(([m,l])=>(
              <button key={m} onClick={()=>{setMode(m);setErr('')}} style={{ flex:1, padding:'8px', borderRadius:9, border:`2px solid ${mode===m?'var(--accent)':'var(--border'}`, fontWeight:700, fontSize:13.5, cursor:'pointer', fontFamily:"'Nunito',sans-serif", background:mode===m?'var(--accent-bg)':'transparent', color:mode===m?'var(--accent)':'#64748b', transition:'all .2s' }}>{l}</button>
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
            <div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/><span style={{ fontSize:12, color:'#64748b', fontWeight:600 }}>OR</span><div style={{ flex:1, height:1, background:'rgba(255,255,255,.08)' }}/>
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
function Dashboard({ user, onNavigate }) {
  const [stats,setStats]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('bs_dash_stats')) }catch{ return null } })
  const [achs,setAchs]=useState(()=>{ try{ return JSON.parse(localStorage.getItem('bs_dash_achs'))||[] }catch{ return [] } })
  useEffect(()=>{
    api.get('/api/user/stats').then(s=>{ setStats(s); try{localStorage.setItem('bs_dash_stats',JSON.stringify(s))}catch{} }).catch(()=>{})
    api.get('/api/user/achievements').then(a=>{ setAchs(a); try{localStorage.setItem('bs_dash_achs',JSON.stringify(a))}catch{} }).catch(()=>{})
  },[])
  const xp=stats?.stats?.total_xp||0; const level=getLevel(xp); const nextLevel=getNextLevel(xp)
  const pct=nextLevel?Math.round(((xp-level.min)/(nextLevel.min-level.min))*100):100
  const streak=stats?.stats?.current_streak||0; const unlocked=achs.filter(a=>a.unlocked).slice(0,3)
  const hour=new Date().getHours(); const greeting=hour<12?'Good morning':hour<17?'Good afternoon':'Good evening'
  const quickStart = [
    {icon:'🤔',label:'Ask a Doubt',    tab:'doubt',      color:'#818CF8', desc:'Step-by-step answers'},
    {icon:'📖',label:'Generate Notes', tab:'notes',      color:'#10B981', desc:'Chapter-wise notes'},
    {icon:'🎯',label:'Take a Quiz',    tab:'quiz',       color:'#F59E0B', desc:'Timed MCQ practice'},
    {icon:'🃏',label:'Flashcards',     tab:'flashcards', color:'#EF4444', desc:'Quick revision cards'},
    {icon:'📚',label:'Youtube-Courses',tab:'courses',    color:'#8B5CF6', desc:'Video-based lessons'},
    // HIDDEN FOR NOW — uncomment to re-enable:
    {icon:'🕘',label:'My History',     tab:'history',    color:'#6366F1', desc:'Replay past sessions'},
    {icon:'📣',label:'Study Feed',     tab:'feed',       color:'#6366F1', desc:'Share & ask peers'},
    // ...(user.type==='school'?[{icon:'📝',label:'Assignments',tab:'assignments',color:'#F59E0B'}]:[]),
    // ...(user.role==='student'?[{icon:'📋',label:'Exam Cheat Sheet',tab:'cheatsheet',color:'#F97316'}]:[{icon:'🎓',label:'Lesson Planner',tab:'lessonplan',color:'#7C3AED'}]),
    // {icon:'🔍',label:'Find People',tab:'search',color:'#06b6d4'},
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
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))', gap:12, marginBottom:22 }}>
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
  ? <MultiSelectDropdown options={SUBJECTS} selected={form.teaches_subjects || []} onChange={v => setF('teaches_subjects', v)} placeholder="── Select subjects ──" />
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
function TimetablePage({ user }) {
  const [timetable,setTimetable]=useState(null); const [loading,setLoading]=useState(true); const [editing,setEditing]=useState(false)
  const [rawSchedule,setRawSchedule]=useState(''); const [saving,setSaving]=useState(false)
  const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const COLORS = {'Mathematics':'#6366F1','Science':'#10B981','Physics':'#06b6d4','Chemistry':'#F59E0B','Biology':'#22c55e','English':'#EF4444','Hindi':'#A855F7','Social Science':'#F97316','History':'#ec4899','Geography':'#34d399','default':'#64748b'}

  useEffect(()=>{
    api.get('/api/school/timetable').then(d=>{ setTimetable(d); if(d) setRawSchedule(JSON.stringify(d.schedule, null, 2)) }).catch(()=>{}).finally(()=>setLoading(false))
  },[])

  const save=async()=>{
    setSaving(true)
    try{
      const schedule = JSON.parse(rawSchedule)
      const result = await api.post('/api/school/timetable',{class_level:user.class_level,section:user.section||'A',schedule})
      setTimetable(result); setEditing(false)
    } catch(e){ alert('Invalid JSON or save failed: '+e.message) }
    setSaving(false)
  }

  if(loading) return <PageSpinner/>

  const schedule = timetable?.schedule?.week || []

  return (
    <div style={{ padding:24, fontFamily:"'Nunito',sans-serif" }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
        <PageHeader icon="📅" title="Timetable" subtitle={`${user.class_level||'Your class'} schedule`} color="#06b6d4"/>
        {user.role==='teacher'&&!editing&&<PrimaryBtn onClick={()=>setEditing(true)} color="#06b6d4">✏️ Edit</PrimaryBtn>}
      </div>

      {editing&&(
        <Card style={{ marginBottom:20 }}>
          <h3 style={{ fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text-h)', margin:'0 0 12px', fontSize:15 }}>Edit Timetable (JSON)</h3>
          <div style={{ background:'rgba(245,158,11,.1)', border:'1px solid rgba(245,158,11,.25)', borderRadius:9, padding:'10px 14px', marginBottom:12, fontSize:12.5, color:'#FCD34D' }}>
            Format: {"{"}"week": [{"{"}"day": "Monday", "periods": [{"{"}"period": 1, "subject": "Mathematics", "teacher": "Mr. Ramesh", "time_start": "08:00", "time_end": "08:45"{"}"}]{"}"}]{"}"}
          </div>
          <textarea value={rawSchedule} onChange={e=>setRawSchedule(e.target.value)} rows={12} style={{ ...T.input, resize:'vertical', fontFamily:'monospace', fontSize:12 }}/>
          <div style={{ display:'flex', gap:10, marginTop:12 }}>
            <PrimaryBtn onClick={save} disabled={saving} color="#06b6d4">{saving?<><Spinner/> Saving...</>:'💾 Save Timetable'}</PrimaryBtn>
            <GhostBtn onClick={()=>setEditing(false)}>Cancel</GhostBtn>
          </div>
        </Card>
      )}

      {!timetable&&!editing&&(
        <div style={{ textAlign:'center', padding:44, color:'var(--text)' }}>
          <div style={{ fontSize:48, marginBottom:12 }}>📅</div>
          <div style={{ fontFamily:"'Sora',sans-serif", fontWeight:700, fontSize:16, color:'var(--text-h)', marginBottom:8 }}>No timetable uploaded yet</div>
          {user.role==='teacher'&&<PrimaryBtn onClick={()=>setEditing(true)} color="#06b6d4">Upload Timetable</PrimaryBtn>}
        </div>
      )}

      {schedule.length>0&&(
        <div style={{ overflowX:'auto' }}>
          <div style={{ display:'grid', gridTemplateColumns:`120px repeat(${Math.max(...schedule.map(d=>d.periods?.length||0))},1fr)`, gap:6, minWidth:600 }}>
            <div style={{ padding:'10px 12px', fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text)', fontSize:11, textTransform:'uppercase' }}>Day</div>
            {Array.from({length:Math.max(...schedule.map(d=>d.periods?.length||0))},(_, i)=>(
              <div key={i} style={{ padding:'10px 8px', textAlign:'center', fontFamily:"'Sora',sans-serif", fontWeight:800, color:'var(--text)', fontSize:11, textTransform:'uppercase' }}>Period {i+1}</div>
            ))}
            {schedule.map((day,di)=>(
              <div key={di} style={{ display:'contents' }}>
                <div style={{ padding:'10px 12px', display:'flex', alignItems:'center', fontWeight:800, color:'var(--text-h)', fontSize:13, fontFamily:"'Sora',sans-serif", background:'var(--bg2)', borderRadius:10, border:'1px solid var(--border)' }}>{day.day}</div>
                {(day.periods||[]).map((p,pi)=>{
                  const color = COLORS[p.subject]||COLORS.default
                  return (
                    <div key={pi} style={{ background:`${color}15`, border:`1px solid ${color}25`, borderRadius:10, padding:'10px 10px', textAlign:'center' }}>
                      <div style={{ fontWeight:800, fontSize:12.5, color, fontFamily:"'Sora',sans-serif", marginBottom:2 }}>{p.subject}</div>
                      <div style={{ fontSize:10.5, color:'var(--text)' }}>{p.teacher}</div>
                      <div style={{ fontSize:10, color:'var(--text)', marginTop:2 }}>{p.time_start}–{p.time_end}</div>
                    </div>
                  )
                })}
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
const DOUBT_GREETING = { role: 'assistant', content: "👋 Hi! Ask me any doubt — I'll give you a **clear, step-by-step explanation** tailored to your CBSE syllabus. 🎯", ts: 0 }

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
- Stay on the ${cls} level — do not bring in concepts beyond this class's NCERT scope.
- If the question belongs to a different chapter, answer it correctly but note the actual chapter in one short line.
- If a question is outside the syllabus or unclear, say so briefly and ask one focused clarifying question.

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
        <PageHeader icon="🤔" title="AI Doubt Solver" subtitle="Ask anything — your full chat history is saved here" color="#6366F1" />
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
            options={[{ value: '', label: '── All chapters ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
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
  const [subject,setSubject]=useState('Mathematics'); const [cls,setCls]=useState('Class 10')
  const [chapter,setChapter]=useState(''); const [customCh,setCustomCh]=useState(''); const [style_,setStyle_]=useState('Detailed')
  const [result,setResult]=useState(''); const [loading,setLoading]=useState(false); const [saved,setSaved]=useState(false); const [err,setErr]=useState('')
  const chapters=getChapters(subject,cls); const finalChapter=chapter||customCh||chapters[0]

  const STYLE_INSTRUCTIONS = {
  'Detailed': `Write in thorough prose under every heading. Explain the "why" behind every concept, not just the "what". Every sub-topic gets its own ### heading with at least 3-4 full paragraphs of explanation.`,
  'Concise': `Write in tight, information-dense paragraphs. No filler. Every sentence must carry a fact, definition, or insight useful for exams.`,
  'Bullet Points': `Use nested bullet points throughout. Main bullets = concepts. Sub-bullets = explanation, example, formula. Every bullet must be a complete, exam-useful thought — not just a label.`,
  'Q&A Format': `Present every concept as a Question followed by a detailed Answer. Use the format:\n**Q: [question]**\nA: [full answer with examples]. Minimum 20 Q&A pairs covering all sub-topics.`,
  'Mind Map Style': `Organize as a hierarchy: Chapter → Topics → Sub-topics → Key facts/formulas/examples. Use indentation and bold headings to show relationships clearly. Still write full explanatory sentences under each node.`,
}

const buildPrompt = () => `You are a world-class CBSE textbook author and examiner with 20+ years of experience. Your task is to write EXHAUSTIVE, publication-quality study notes.

SUBJECT: ${subject} | CLASS: ${cls} | CHAPTER: "${finalChapter}" | BOARD: CBSE
STYLE: ${style_}

STYLE INSTRUCTION: ${STYLE_INSTRUCTIONS[style_] || STYLE_INSTRUCTIONS['Detailed']}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STRICT REQUIREMENTS — YOU MUST FOLLOW ALL OF THESE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✦ MINIMUM LENGTH: 3500 words. Do NOT stop writing until you have covered every single sub-topic completely.
✦ COVER EVERYTHING: List every sub-topic of this chapter from the CBSE textbook and cover each one in depth.
✦ DO NOT SKIP: If you are running out of content, that means you have not gone deep enough. Go deeper.
✦ REAL EXAMPLES: Every concept needs a real-world example or a worked numerical example.
✦ EXAM FOCUS: After every major concept, add a line: "📝 Exam tip: [specific tip for this concept]"
✦ BOLD only key terms on their FIRST use.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

# ${finalChapter}
**Subject:** ${subject} | **Class:** ${cls} | **Board:** CBSE 2024-25

---

## 1. 📌 Chapter Overview & Importance
- Where this chapter fits in the bigger picture of ${subject}
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
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) { setChapter(prefill.chapter); setCustomCh('') }
    onClearPrefill?.()
    // Try to load previously saved note
    loadSavedContent('notes', prefill.subject, prefill.chapter, []).then(content => {
      if (content) { setResult(content); setSaved(true) }
    })
  }, [prefill])

  // Shared cache key — everyone who picks this same subject+class+chapter+style shares one note
  const notesCacheKey = () => {
    const safe = s => String(s || '').replace(/[^a-zA-Z0-9]/g, '').toLowerCase().slice(0, 24)
    return `bsnotes-${safe(subject)}-${safe(cls)}-${safe(finalChapter)}-${safe(style_)}`
  }

  async function generate() {
    if(!finalChapter) return; setErr(''); setLoading(true); setSaved(false)
    try{
      // ── Check the SHARED cache first — if ANY user already made this, reuse it ──
      const shared = await api.get(`/api/shared-notes/${notesCacheKey()}`).catch(()=>null)
      if (shared?.content) {
        setResult(shared.content); setLoading(false); return
      }
      // ── Not cached anywhere — generate fresh ──
      const r=await api.post('/api/ai/notes',{messages:[{role:'user',content:buildPrompt()}],subject,chapter:finalChapter})
      setResult(r.content)
      // Save to the SHARED cache so the next person (anyone) gets it instantly
      try { await api.post('/api/shared-notes',{subject,classLevel:cls,chapter:finalChapter,style:style_,content:r.content}) } catch{}
      saveSessionContent({ tool:'notes', subject, chapter:finalChapter, classLevel:cls, content:r.content })
    }
    catch(e){ if(e.status===402){setErr('Free trial ended. Please subscribe.')}else{setErr(e.message)} }
    setLoading(false)
  }
  async function saveNote() { try{await api.post('/api/user/notes',{subject,classLevel:cls,chapter:finalChapter,style:style_,content:result});setSaved(true)}catch(e){alert(e.message)} }

  return (
    <div style={{ padding:24, width:'100%', boxSizing:'border-box', fontFamily:"'Nunito',sans-serif", animation:'slideUp .25s ease-out' }}>
      <PageHeader icon="📖" title="Chapter Notes Maker" subtitle="Textbook-quality comprehensive notes — download or print as PDF" color="#10B981"/>
      <Card style={{ marginBottom:18 }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:16, marginBottom:4 }}>
          <Field label="Subject"><BSSelect value={subject} onChange={v=>{setSubject(v);setChapter('')}} options={SUBJECTS}/></Field>
          <Field label="Class"><BSSelect value={cls} onChange={setCls} options={CLASSES}/></Field>
        </div>
        <Field label="Chapter">
          <BSSelect value={chapter} onChange={setChapter} options={[{value:'',label:'-- Select Chapter --'},...chapters.map(c=>({value:c,label:c}))]}/>
        </Field>
        {!chapter&&<Field label="Or enter chapter name manually"><BSInput value={customCh} onChange={setCustomCh} placeholder="e.g. Gravitation, Mughal Empire"/></Field>}
        <Field label="Notes Style"><BSSelect value={style_} onChange={setStyle_} options={['Detailed','Concise','Bullet Points','Q&A Format','Mind Map Style']}/></Field>
        <PrimaryBtn onClick={generate} disabled={loading||(!chapter&&!customCh)} color="#10B981">{loading?<><Spinner/> Generating notes...</>:'📖 Generate Comprehensive Notes'}</PrimaryBtn>
        {loading && (
          <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'rgba(16,185,129,.08)', border:'1px solid rgba(16,185,129,.25)', display:'flex', alignItems:'center', gap:10, fontFamily:"'Nunito', sans-serif" }}>
            <Spinner size={16}/>
            <span style={{ fontSize:13, color:'#10B981', fontWeight:700 }}>
              ⏳ Please wait 30–40 seconds — we're writing comprehensive, exam-ready notes for you. Don't close or switch tabs.
            </span>
          </div>
        )}
      </Card>
      <ErrMsg msg={err}/>
      {result&&<>
  <NotesDocument
    content={result}
    title={`${finalChapter} Notes — ${subject} ${cls}`}
    onDownload={()=>downloadText(result,`${finalChapter}-notes.txt`)}
  />
  <div style={{ display:'flex', gap:8, marginTop:12 }}>
    {!saved?<GhostBtn small onClick={saveNote}>💾 Save to Library</GhostBtn>:<SuccessMsg msg="Saved to Library!"/>}
  </div>
</>}
      <XPBadge amount={20} label="per notes generated"/>
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
  const [subject,   setSubject]   = useState('Mathematics')
  const [cls,       setCls]       = useState('Class 10')
  const [chapter,   setChapter]   = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [diff,      setDiff]      = useState('Medium')
  const [num,       setNum]       = useState('5')
  const [quiz,      setQuiz]      = useState(null)
  const [answers,   setAnswers]   = useState({})
  const [submitted, setSubmitted] = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [err,       setErr]       = useState('')
  const [timeLeft,  setTimeLeft]  = useState(null)
  const [timerId,   setTimerId]   = useState(null)
  const [timeUp,    setTimeUp]    = useState(false)
  const [finalScore, setFinalScore] = useState(null)

  const chapters = getChapters(subject, cls)
  const topic    = chapter || customTopic

  // seconds per question based on difficulty
  const SECS_PER_Q = { Easy: 30, Medium: 45, Hard: 60, Mixed: 45 }

  useEffect(() => {
    if (!quiz) return
    const totalSecs = parseInt(num) * (SECS_PER_Q[diff] || 45)
    setTimeLeft(totalSecs)
    setTimeUp(false)
    const id = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(id)
          setTimeUp(true)
          // auto-submit
          setSubmitted(true)
          const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
          const xpEarned = Math.round((correct / quiz.questions.length) * 50) + 5
          setFinalScore({ correct, xpEarned })
          saveSessionContent({ tool:'quiz', subject, chapter:topic, classLevel:cls, content:{ ...quiz, score:correct, total:quiz.questions.length, timeUp:true } })
          return 0
        }
        return prev - 1
      })
    }, 1000)
    setTimerId(id)
    return () => clearInterval(id)
  }, [quiz])

  useEffect(() => { return () => { if (timerId) clearInterval(timerId) } }, [timerId]) // what gets sent to the AI

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [prefill])

  async function generate() {
    if (!topic.trim()) return alert('Please select or enter a chapter/topic')
    const PROMPT = `You are a CBSE examiner creating a ${num}-question multiple-choice quiz on "${topic}" in ${subject} for ${cls}. Difficulty: ${diff}.

RULES — follow every one:
1. Solve each question completely in your head BEFORE writing anything. Decide the single correct answer first.
2. Write ONLY the final, polished explanation. State the method and result directly in 1-2 sentences.
3. NEVER show your working process. FORBIDDEN words/phrases anywhere in "explanation": "wait", "let me", "recalculate", "rechecking", "actually", "however", "revising", "correcting", "hmm", "but checking", "option 0", "option 1", "answer should be", "let me reconsider". If you catch yourself writing these, delete the whole explanation and write a fresh clean one.
4. "answer" is the 0-based index (0,1,2,3) of the correct option. It MUST match your solved result exactly.
5. Exactly ONE option is correct; the other three are plausible but wrong.
6. Output VALID JSON ONLY — no markdown, no text before or after.

Format:
{"title":"${topic} Quiz","questions":[{"q":"Question text?","options":["A","B","C","D"],"answer":0,"explanation":"The discriminant b²-4ac determines the nature of roots; here it equals 16, so roots are real and distinct."}]}`
    setErr(''); setLoading(true); setQuiz(null); 
    try {
      const r = await api.post('/api/ai/quiz', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())

      // Strip any self-correcting ramble from explanations (small-model safety net)
      const BAD = /\b(wait|let me|recalculat|recheck|recheckin|actually|however|revising|correcting|reconsider|hmm|option [0-9]|answer should be|but checking)\b/i
      parsed.questions = (parsed.questions || []).map(q => {
        if (q.explanation && BAD.test(q.explanation)) {
          const clean = q.explanation
            .split(/(?<=[.!?])\s+/)
            .filter(s => !BAD.test(s))
            .join(' ')
            .trim()
          q.explanation = clean || 'See the correct option marked above.'
        }
        return q
      })

      setQuiz(parsed)
      saveSessionContent({ tool:'quiz', subject, chapter:topic, classLevel:cls, content:parsed })
      setAnswers({}); setSubmitted(false)
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate quiz. Try again.')
    }
    setLoading(false)
  }

  async function submit() {
    if (timerId) clearInterval(timerId)
    setSubmitted(true)
    const correct = quiz.questions.filter((q, i) => answers[i] === q.answer).length
    const xpEarned = Math.round((correct / quiz.questions.length) * 50) + 5
    setFinalScore({ correct, xpEarned })
    // Save score into session so history can show it
    saveSessionContent({ tool:'quiz', subject, chapter:topic, classLevel:cls, content:{ ...quiz, score:correct, total:quiz.questions.length, timeTaken: (parseInt(num) * (SECS_PER_Q[diff]||45)) - timeLeft } })
    try { await api.post('/api/user/quiz-history', { subject, topic, difficulty: diff, totalQuestions: quiz.questions.length, correctAnswers: correct, xpEarned, isPerfect: correct === quiz.questions.length }) } catch {}
  }

  const score = submitted ? quiz.questions.filter((q, i) => answers[i] === q.answer).length : 0
  const pct   = submitted ? Math.round((score / quiz.questions.length) * 100) : 0

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🎯" title="Quiz Generator" subtitle="Auto-generate MCQ quizzes with instant scoring and explanations" color="#F59E0B" />

      {!quiz ? (
        <Card>
          {/* Row 1: Subject + Class + Question count */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 4 }}>
            <Field label="Subject">
              <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
            </Field>
            <Field label="Class">
              <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
            </Field>
            <Field label="Questions">
              <BSSelect value={num} onChange={setNum} options={['5','8','10','15']} />
            </Field>
            <Field label="Difficulty">
              <BSSelect value={diff} onChange={setDiff} options={['Easy','Medium','Hard','Mixed']} />
            </Field>
          </div>

          {/* Chapter dropdown */}
          <Field label="Chapter">
            <BSSelect
              value={chapter}
              onChange={setChapter}
              options={[{ value: '', label: '── Select a Chapter ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
            />
          </Field>

          {/* Custom topic fallback */}
          {!chapter && (
            <Field label="Or enter a custom topic">
              <BSInput value={customTopic} onChange={setCustomTopic} placeholder="e.g. Pythagorean Theorem- How confident are you on the sub-topic?    Test your knowledge!" />
            </Field>
          )}

          <ErrMsg msg={err} />
          <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#F59E0B" style={{ marginTop: 4 }}>
            {loading ? <><Spinner /> Generating…</> : '✨ Generate Quiz'}
          </PrimaryBtn>
        </Card>
      ) : (
        <div>
          {/* ── Timer bar ── */}
          {!submitted && timeLeft !== null && (
            <div style={{ marginBottom: 16, background: 'var(--bg2)', border: `1px solid ${timeLeft <= 30 ? 'rgba(239,68,68,.4)' : 'var(--border)'}`, borderRadius: 12, padding: '10px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: timeLeft <= 30 ? '#fca5a5' : 'var(--text-h)' }}>
                  {timeLeft <= 30 ? '⚠️' : '⏱'} Time Remaining
                </span>
                <span style={{ fontFamily: "'Sora', monospace", fontWeight: 900, fontSize: 20, color: timeLeft <= 30 ? '#ef4444' : 'var(--accent)', animation: timeLeft <= 10 ? 'pulse 1s infinite' : 'none', letterSpacing: 1 }}>
                  {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                </span>
              </div>
              <div style={{ background: 'var(--border)', borderRadius: 999, height: 6 }}>
                <div style={{ background: timeLeft <= 30 ? '#ef4444' : timeLeft <= 60 ? '#f59e0b' : 'var(--accent)', width: `${(timeLeft / (parseInt(num) * (SECS_PER_Q[diff] || 45))) * 100}%`, height: '100%', borderRadius: 999, transition: 'width 1s linear, background .3s' }}/>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5, fontSize: 11, color: 'var(--text)' }}>
                <span>{Object.keys(answers).length}/{quiz.questions.length} answered</span>
                <span>{parseInt(num) * (SECS_PER_Q[diff] || 45)}s total · {SECS_PER_Q[diff] || 45}s per question</span>
              </div>
            </div>
          )}

          {timeUp && !submitted && (
            <div style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', borderRadius: 12, padding: '12px 16px', marginBottom: 14, textAlign: 'center', color: '#fca5a5', fontWeight: 700, fontSize: 14 }}>
              ⏰ Time's up! Your answers have been submitted automatically.
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
              const sel = answers[i], correct = q.answer, isRight = submitted && sel === correct, isWrong = submitted && sel !== undefined && sel !== correct
              return (
                <Card key={i} style={{ borderLeft: submitted ? `4px solid ${isRight ? '#22c55e' : isWrong ? '#ef4444' : 'var(--border)'}` : '' }}>
                  <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 14.5, color: 'var(--text-h)' }}><span style={{ color: 'var(--accent)' }}>Q{i + 1}.</span> {q.q}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {q.options.map((opt, j) => {
                      const isSelected = sel === j, isAnswer = j === correct
                      let bg = 'var(--social-bg)', border = 'var(--border)', color = 'var(--text-h)'
                      if (submitted) { if (isAnswer) { bg = 'rgba(16,185,129,.1)'; border = '#6ee7b7'; color = '#6ee7b7' } else if (isSelected && !isAnswer) { bg = 'rgba(239,68,68,.1)'; border = '#fca5a5'; color = '#fca5a5' } }
                      else if (isSelected) { bg = 'var(--accent-bg)'; border = 'var(--accent)'; color = 'var(--accent)' }
                      return <button key={j} disabled={submitted} onClick={() => setAnswers(a => ({ ...a, [i]: j }))} style={{ padding: '9px 12px', borderRadius: 9, border: `1.5px solid ${border}`, background: bg, color, cursor: submitted ? 'default' : 'pointer', textAlign: 'left', fontSize: 13.5, fontFamily: "'Nunito', sans-serif", fontWeight: 600, transition: 'all .15s' }}><span style={{ fontWeight: 800, marginRight: 4 }}>{String.fromCharCode(65 + j)}.</span>{opt}{submitted && isAnswer ? ' ✓' : ''}</button>
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
  const [subject,     setSubject]     = useState('Mathematics')
  const [cls,         setCls]         = useState('Class 10')
  const [chapter,     setChapter]     = useState('')
  const [customTopic, setCustomTopic] = useState('')
  const [cards,       setCards]       = useState([])
  const [current,     setCurrent]     = useState(0)
  const [flipped,     setFlipped]     = useState({})
  const [mode,        setMode]        = useState('grid')
  const [loading,     setLoading]     = useState(false)
  const [err,         setErr]         = useState('')

  const chapters = getChapters(subject, cls)
  const topic    = chapter || customTopic

  useEffect(() => {
    if (!prefill) return
    if (prefill.subject) setSubject(prefill.subject)
    if (prefill.chapter) setChapter(prefill.chapter)
    onClearPrefill?.()
  }, [prefill])

  async function generate() {
    if (!topic.trim()) return alert('Please select or enter a chapter/topic')
    const PROMPT = `Create 8 high-quality flashcards for "${topic}" in ${subject} ${cls} CBSE. Cover the most important terms, formulas, and concepts.
Return ONLY valid JSON:
{"cards":[{"front":"Key term or concept","back":"Clear, concise definition or explanation (1-2 sentences max)"}]}`
    setErr(''); setLoading(true); setCurrent(0); setFlipped({})
    try {
      const r = await api.post('/api/ai/flashcards', { messages: [{ role: 'user', content: PROMPT }], subject, chapter: topic })
      const raw = typeof r.content === 'string' ? r.content : r.content[0]?.text || ''
      const parsed = JSON.parse(raw.replace(/```[\w]*\n?/gi, '').trim())
      if (!parsed.cards?.length) throw new Error('No cards in response')
      setCards(parsed.cards)
    saveSessionContent({ tool:'flashcards', subject, chapter:topic, classLevel:cls, content:parsed.cards })
    } catch (e) {
      if (e.status === 402) setErr('Free trial ended. Please subscribe.')
      else setErr('Failed to generate flashcards. Try again.')
    }
    setLoading(false)
  }

  const card = cards[current]

  return (
    <div style={{ padding: 24, width: '100%', boxSizing: 'border-box', fontFamily: "'Nunito', sans-serif", animation: 'slideUp .25s ease-out' }}>
      <PageHeader icon="🃏" title="Flashcards" subtitle="Grid mode & Study mode for fast revision" color="#EF4444" />

      <Card style={{ marginBottom: 18 }}>
        {/* Subject + Class */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: 14, marginBottom: 4 }}>
          <Field label="Subject">
            <BSSelect value={subject} onChange={v => { setSubject(v); setChapter('') }} options={SUBJECTS} />
          </Field>
          <Field label="Class">
            <BSSelect value={cls} onChange={v => { setCls(v); setChapter('') }} options={CLASSES} />
          </Field>
        </div>

        {/* Chapter dropdown */}
        <Field label="Chapter">
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: '── Select a Chapter ──' }, ...chapters.map(c => ({ value: c, label: c }))]}
          />
        </Field>

        {!chapter && (
          <Field label="Or enter a custom topic">
            <BSInput value={customTopic} onChange={setCustomTopic} placeholder="Lets discuss the important concepts of subtopics..." />
          </Field>
        )}

        <ErrMsg msg={err} />
        <PrimaryBtn onClick={generate} disabled={loading || !topic.trim()} color="#EF4444">
          {loading ? <><Spinner /> Creating cards…</> : '🃏 Generate Flashcards'}
        </PrimaryBtn>
      </Card>

      {cards.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontFamily: "'Sora', sans-serif", fontWeight: 800, fontSize: 16, color: 'var(--text-h)', margin: 0 }}>{topic} — {cards.length} Cards</h3>
            <div style={{ display: 'flex', gap: 7 }}>
              {[['grid', '⊞ Grid'], ['study', '▶ Study']].map(([m, l]) => (
                <button key={m} onClick={() => setMode(m)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', fontWeight: 700, fontSize: 12.5, cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: mode === m ? '#EF4444' : 'var(--social-bg)', color: mode === m ? '#fff' : 'var(--text-h)', transition: 'all .15s' }}>{l}</button>
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
          <Field label="Subject">
            <BSSelect value={subj} onChange={handleSubjChange} options={SUBJECTS} />
          </Field>
          <Field label="Class">
            <BSSelect value={cls} onChange={handleClsChange} options={CLASSES} />
          </Field>
        </div>

        {/* Row 2: Chapter dropdown */}
        <Field label="Chapter">
          <BSSelect
            value={chapter}
            onChange={setChapter}
            options={[{ value: '', label: '── Select a Chapter ──' }, ...chs.map(c => ({ value: c, label: c }))]}
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
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
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

const fetchUnread = useCallback(() => {
  api.get('/api/messages/unread-count').then(d => setUnreadCount(d.count || 0)).catch(() => {})
}, [])

useEffect(() => {
  if (!user) return
  fetchUnread()
  const i = setInterval(fetchUnread, 15000)
  return () => clearInterval(i)
}, [user, fetchUnread])
  // Refresh user on mount
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

  // function handleHistoryNav(item) {
  //   setPrefill({
  //     tool:     item.tool,
  //     subject:  item.subject  || '',
  //     chapter:  item.chapter  || '',
  //     chapters: item.chapters || [],
  //   })
  //   setTab(item.tool)
  // }

  function clearPrefill() { setPrefill(null) }

  // ── Landing ──────────────────────────────────────────────────
  if (page === 'landing') return (
    <LandingPage onStart={mode => { setInitAuthMode(mode === 'signup' ? 'register' : 'login'); setPage('auth') }} />
  )
  if (!user || page === 'auth') return (
    <AuthPage onAuth={handleAuth} initMode={initAuthMode} />
  )
  if (page === 'forgot') return (
    <ForgotPasswordPage onBack={() => setPage('auth')} />
  )

  // ── App tabs ─────────────────────────────────────────────────
  const isStudent = user.role === 'student'
  const isTeacher = user.role === 'teacher'
  const isSchool  = user.type === 'school'

  const tabs = [
    { id: 'dashboard',   icon: '🏠', label: 'Dashboard',      color: '#6366F1' },
    { id: 'doubt',       icon: '🤔', label: 'Doubt Solver',    color: '#818CF8' },
    { id: 'notes',       icon: '📖', label: 'Notes',           color: '#10B981' },
    // { id: 'paper',       icon: '📄', label: 'Question Paper',  color: '#A855F7' },
    { id: 'quiz',        icon: '🎯', label: 'Quiz',            color: '#F59E0B' },
    { id: 'flashcards',  icon: '🃏', label: 'Flashcards',      color: '#EF4444' },
    { id: 'courses',     icon: '📚', label: 'Youtube Courses', color: '#8B5CF6' },
    { id: 'search',      icon: '🔍', label: 'Search',          color: '#06b6d4' },
    { id: 'messages',    icon: '💬', label: 'Messages',        color: '#10B981' },
    // { id: 'video',       icon: '🎬', label: 'Video Learning',  color: '#06b6d4' },
    // ...(isStudent ? [{ id: 'cheatsheet', icon: '📋', label: 'Cheat Sheet',   color: '#F97316' }] : []),
    // ...(isTeacher ? [{ id: 'lessonplan', icon: '🎓', label: 'Lesson Planner', color: '#7C3AED' }] : []),
    ...(isSchool ? [
      { id: 'assignments', icon: '📝', label: 'Assignments', color: '#F59E0B' },
      { id: 'notices',     icon: '📢', label: 'Notices',     color: '#F97316' },
      { id: 'timetable',   icon: '📅', label: 'Timetable',   color: '#06b6d4' },
    ] : []),
    ...(isTeacher && isSchool ? [{ id: 'school', icon: '🏫', label: 'Analytics', color: '#A855F7' }] : []),
    { id: 'feed',        icon: '📣', label: 'Study Feed',      color: '#6366F1' },
    { id: 'history',     icon: '🕘', label: 'History',         color: '#6366F1' }
  ]

//   const tabs = [
//   { id: 'dashboard',  icon: '🏠', label: 'Dashboard',       color: '#6366F1' },
//   { id: 'courses',    icon: '📚', label: 'Chapter Courses',  color: '#8B5CF6' },
//   { id: 'notes',      icon: '📖', label: 'Notes',            color: '#10B981' },
//   { id: 'paper',      icon: '📄', label: 'Question Paper',   color: '#A855F7' },
//   { id: 'quiz',       icon: '🎯', label: 'Quiz',             color: '#F59E0B' },
//   { id: 'flashcards', icon: '🃏', label: 'Flashcards',       color: '#EF4444' },
//   { id: 'doubt',      icon: '🤔', label: 'Doubt Solver',     color: '#818CF8' },
//   { id: 'history',    icon: '🕘', label: 'History',          color: '#6366F1' },
  // { id: 'feed',       icon: '📣', label: 'Study Feed',       color: '#6366F1' },
// ]

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
    if (tab === 'dashboard')  return <Dashboard user={user} onNavigate={setTab} />
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
    return <Dashboard user={user} onNavigate={setTab} />
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top header ───────────────────────────────────────── */}
      <header style={{ borderBottom: '1px solid var(--border)', padding: '0 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 58, position: 'sticky', top: 0, zIndex: 100,background: 'rgba(255,255,255,.92)', backdropFilter: 'blur(20px)', boxShadow: '0 1px 12px rgba(15,23,42,.06)' }}>
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

          {/* ── MOBILE ONLY: avatar dropdown holds the rest ── */}
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

      {/* ── Mobile top nav ───────────────────────────────────── */}
      <MobileTopNav tabs={tabs} activeTab={tab} onTabChange={setTab} unreadCount={unreadCount} />

      <div style={{ display: 'flex', flex: 1 }}>

        {/* ── Desktop sidebar ──────────────────────────────────── */}
        <nav className="desktop-sidebar" style={{ width: 210, borderRight: '1px solid var(--border)', padding: '12px 8px', background: 'rgba(255,255,255,.7)', flexShrink: 0, position: 'sticky', top: 58, height: 'calc(100vh - 58px)', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {tabs.map(t => {
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
          })}
          <div style={{ height: 1, background: 'var(--border)', margin: '6px 0' }} />
          <button onClick={() => setTab('achievements')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 12px', borderRadius: 10, border: 'none', cursor: 'pointer', fontFamily: "'Nunito', sans-serif", background: tab === 'achievements' ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' : 'transparent', color: tab === 'achievements' ? '#fff' : 'var(--text-h)', fontWeight: 600, fontSize: 13.5, textAlign: 'left', transition: 'all .15s' }}>
            <span style={{ fontSize: 16 }}>🏆</span> Achievements
          </button>
        </nav>

        {/* ── Main content ─────────────────────────────────────── */}
        <main style={{ flex: 1, overflowY: 'auto', minWidth: 0 }}>
          <div style={{ padding: '16px 24px 0', paddingBottom: 0 }}>
            {/* FREE TRIAL COUNTDOWN HIDDEN FOR NOW — uncomment to re-enable:
            <FreeTierCountdown
              user={user}
              onSubscribe={() => setTab('subscription')}
              onExpired={() => { setTrialExpired(true); setTab('subscription') }}
            />
            */}
          </div>

          {/* Tool tabs stay mounted — generation keeps running and progress
              is preserved when you switch tabs (only reset via their own New button) */}
          <div style={{ display: tab === 'doubt'      ? 'block' : 'none', height: '100%' }}><DoubtSolver    user={user} prefill={tab === 'doubt'      ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'notes'      ? 'block' : 'none', height: '100%' }}><NotesMaker     user={user} prefill={tab === 'notes'      ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'quiz'       ? 'block' : 'none', height: '100%' }}><QuizGenerator  user={user} prefill={tab === 'quiz'       ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'flashcards' ? 'block' : 'none', height: '100%' }}><FlashCards     user={user} prefill={tab === 'flashcards' ? prefill : null} onClearPrefill={clearPrefill} /></div>
          <div style={{ display: tab === 'courses'    ? 'block' : 'none', height: '100%' }}><ChapterCourses user={user} prefill={tab === 'courses'    ? prefill : null} onClearPrefill={clearPrefill} /></div>

          {/* Everything else renders only when its tab is active */}
          {!['doubt','notes','quiz','flashcards','courses'].includes(tab) && renderPage()}
        </main>

      </div>

      {/* ── AI Buddy (school users only) ─────────────────────── */}
      {isSchool && <AIBuddy user={user} />}

    </div>
  )
}
