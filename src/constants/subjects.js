export const SUBJECTS = ['Mathematics','Science','Physics','Chemistry','Biology','English','Hindi',
  'Social Science','History','Geography','Civics','Economics','Computer Science','Sanskrit','Environmental Science']

export const CLASSES = ['Class 1','Class 2','Class 3','Class 4','Class 5','Class 6','Class 7',
  'Class 8','Class 9','Class 10','Class 11','Class 12']

export const CBSE_CHAPTERS = {
  Mathematics: {
    'Class 9':  ['Number Systems','Polynomials','Coordinate Geometry','Linear Equations in Two Variables',"Euclid's Geometry",'Lines and Angles','Triangles','Quadrilaterals','Areas of Parallelograms and Triangles','Circles','Constructions',"Heron's Formula",'Surface Areas and Volumes','Statistics','Probability'],
    'Class 10': ['Real Numbers','Polynomials','Pair of Linear Equations in Two Variables','Quadratic Equations','Arithmetic Progressions','Triangles','Coordinate Geometry','Introduction to Trigonometry','Some Applications of Trigonometry','Circles','Constructions','Areas Related to Circles','Surface Areas and Volumes','Statistics','Probability'],
    'Class 11': ['Sets','Relations and Functions','Trigonometric Functions','Complex Numbers and Quadratic Equations','Linear Inequalities','Permutations and Combinations','Binomial Theorem','Sequences and Series','Straight Lines','Conic Sections','Introduction to Three Dimensional Geometry','Limits and Derivatives','Statistics','Probability'],
    'Class 12': ['Relations and Functions','Inverse Trigonometric Functions','Matrices','Determinants','Continuity and Differentiability','Application of Derivatives','Integrals','Application of Integrals','Differential Equations','Vector Algebra','Three Dimensional Geometry','Linear Programming','Probability'],
  },
  Science: {
    'Class 9':  ['Matter in Our Surroundings','Is Matter Around Us Pure?','Atoms and Molecules','Structure of the Atom','The Fundamental Unit of Life','Tissues','Diversity in Living Organisms','Motion','Force and Laws of Motion','Gravitation','Work and Energy','Sound','Why Do We Fall Ill?','Natural Resources','Improvement in Food Resources'],
    'Class 10': ['Chemical Reactions and Equations','Acids, Bases and Salts','Metals and Non-Metals','Carbon and its Compounds','Periodic Classification of Elements','Life Processes','Control and Coordination','How Do Organisms Reproduce?','Heredity and Evolution','Light - Reflection and Refraction','The Human Eye and the Colourful World','Electricity','Magnetic Effects of Electric Current','Sources of Energy','Our Environment','Management of Natural Resources'],
  },
  Physics: {
    'Class 11': ['Physical World','Units and Measurements','Motion in a Straight Line','Motion in a Plane','Laws of Motion','Work, Energy and Power','Systems of Particles and Rotational Motion','Gravitation','Mechanical Properties of Solids','Mechanical Properties of Fluids','Thermal Properties of Matter','Thermodynamics','Kinetic Theory','Oscillations','Waves'],
    'Class 12': ['Electric Charges and Fields','Electrostatic Potential and Capacitance','Current Electricity','Moving Charges and Magnetism','Magnetism and Matter','Electromagnetic Induction','Alternating Current','Electromagnetic Waves','Ray Optics and Optical Instruments','Wave Optics','Dual Nature of Radiation and Matter','Atoms','Nuclei','Semiconductor Electronics'],
  },
  Chemistry: {
    'Class 11': ['Some Basic Concepts of Chemistry','Structure of Atom','Classification of Elements and Periodicity','Chemical Bonding and Molecular Structure','States of Matter','Thermodynamics','Equilibrium','Redox Reactions','Hydrogen','The s-Block Elements','The p-Block Elements','Organic Chemistry: Basic Principles','Hydrocarbons'],
    'Class 12': ['The Solid State','Solutions','Electrochemistry','Chemical Kinetics','Surface Chemistry','General Principles of Isolation of Elements','The p-Block Elements','The d and f-Block Elements','Coordination Compounds','Haloalkanes and Haloarenes','Alcohols, Phenols and Ethers','Aldehydes, Ketones and Carboxylic Acids','Amines','Biomolecules','Polymers','Chemistry in Everyday Life'],
  },
  Biology: {
    'Class 11': ['The Living World','Biological Classification','Plant Kingdom','Animal Kingdom','Morphology of Flowering Plants','Anatomy of Flowering Plants','Structural Organisation in Animals','Cell: The Unit of Life','Biomolecules','Cell Cycle and Cell Division','Transport in Plants','Photosynthesis in Higher Plants','Cellular Respiration','Plant Growth and Development','Digestion and Absorption','Breathing and Exchange of Gases','Body Fluids and Circulation','Neural Control and Coordination','Chemical Coordination and Integration'],
    'Class 12': ['Sexual Reproduction in Flowering Plants','Human Reproduction','Reproductive Health','Principles of Inheritance and Variation','Molecular Basis of Inheritance','Evolution','Human Health and Disease','Biotechnology: Principles and Processes','Biotechnology and its Applications','Organisms and Populations','Ecosystem','Biodiversity and Conservation','Environmental Issues'],
  },
}

export const getChapters = (subject, cls) =>
  CBSE_CHAPTERS[subject]?.[cls] || Array.from({ length: 15 }, (_, i) => `Chapter ${i + 1}`)
