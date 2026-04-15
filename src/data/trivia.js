// Pool de preguntas para Cagatrivia. Cada pregunta tiene:
// - question: texto de la pregunta
// - answers: array de 4 opciones
// - correct: indice (0-3) de la respuesta correcta
// - explanation (opcional): texto corto que se muestra tras responder

export const TRIVIA_QUESTIONS = [
  {
    question: '¿Cuantos dias de su vida pasa la persona media sentada en el WC?',
    answers: ['15 dias', '40 dias', '92 dias', '180 dias'],
    correct: 2,
    explanation: 'Unos 92 dias. O lo que es lo mismo: unas 3 horas por semana durante toda tu vida.',
  },
  {
    question: '¿Quien invento el primer inodoro con cisterna para la reina Isabel I?',
    answers: ['Isaac Newton', 'Sir John Harington', 'Thomas Crapper', 'Leonardo da Vinci'],
    correct: 1,
    explanation: 'Sir John Harington lo invento en 1596. Irónicamente, la reina no lo uso por miedo al ruido.',
  },
  {
    question: '¿De que material era el inodoro que Maurizio Cattelan expuso en el Guggenheim?',
    answers: ['Marmol', 'Oro macizo de 18 quilates', 'Diamante', 'Platino'],
    correct: 1,
    explanation: 'Oro macizo de 18 quilates, titulado "America". Fue robado en 2019 y nunca se recupero.',
  },
  {
    question: '¿Como se llama el miedo irracional a los baños publicos?',
    answers: ['Latrinofobia', 'Parcopresis', 'Urofobia', 'Koprofobia'],
    correct: 1,
    explanation: 'Parcopresis, tambien conocida como "sindrome del baño publico". Afecta a millones de personas.',
  },
  {
    question: '¿Que porcentaje de la poblacion mundial sigue sin acceso a un baño digno?',
    answers: ['Menos del 5%', 'Alrededor del 20%', 'Alrededor del 33%', 'Mas del 50%'],
    correct: 2,
    explanation: 'Unos 3500 millones de personas carecen de saneamiento basico segun la OMS.',
  },
  {
    question: '¿En que año se patento el rollo de papel higienico perforado?',
    answers: ['1871', '1891', '1923', '1945'],
    correct: 1,
    explanation: 'En 1891 Seth Wheeler patento el rollo perforado. Antes se usaban hojas sueltas.',
  },
  {
    question: 'En Japon, los inodoros high-tech tienen un boton que emite un sonido falso. ¿Para que?',
    answers: [
      'Para relajar al usuario',
      'Para tapar el sonido real con agua corriendo',
      'Para detectar problemas digestivos',
      'Para avisar de que esta ocupado',
    ],
    correct: 1,
    explanation: 'Se llama "Otohime" (princesa del sonido). Evita verguenza tapando ruidos corporales.',
  },
  {
    question: '¿Cual es el nombre cientifico de la caca?',
    answers: ['Excremento', 'Heces', 'Deposicion', 'Todas son correctas'],
    correct: 3,
    explanation: 'Las tres son correctas. "Bolo fecal" tambien, si quieres impresionar en una cena.',
  },
  {
    question: '¿Cuanto pesa en promedio la caca diaria de un adulto?',
    answers: ['50-100 gramos', '100-250 gramos', '250-500 gramos', 'Mas de un kilo'],
    correct: 1,
    explanation: 'Entre 100 y 250 gramos por dia. Mas si comes mucha fibra.',
  },
  {
    question: '¿Que clasifica la escala de Bristol?',
    answers: [
      'La dureza del papel higienico',
      'La presion del agua del inodoro',
      'La forma y consistencia de las heces',
      'El olor del baño publico',
    ],
    correct: 2,
    explanation: 'La escala de Bristol clasifica las heces en 7 tipos, del 1 (estreñido) al 7 (diarrea).',
  },
  {
    question: '¿En que pais se inventó el primer papel higienico perfumado?',
    answers: ['Francia', 'China', 'Estados Unidos', 'Japon'],
    correct: 1,
    explanation: 'En China, siglo XIV, para uso exclusivo de la corte imperial.',
  },
  {
    question: '¿Cuanto tarda un rollo de papel higienico en biodegradarse?',
    answers: ['1-3 dias', '1-2 semanas', '1-3 meses', 'Mas de un año'],
    correct: 1,
    explanation: 'Entre una y dos semanas en condiciones normales. En seco puede durar años.',
  },
  {
    question: '¿Cual es el pais con mayor consumo de papel higienico per capita?',
    answers: ['España', 'Japon', 'Estados Unidos', 'Alemania'],
    correct: 2,
    explanation: 'Estados Unidos: cerca de 141 rollos por persona al año.',
  },
  {
    question: '¿Por que el agua del WC siempre gira en un sentido concreto?',
    answers: [
      'Por el efecto Coriolis (hemisferio norte o sur)',
      'Por el diseño del conducto de entrada del agua',
      'Por la gravedad',
      'Por magia',
    ],
    correct: 1,
    explanation: 'Es por el diseño del chorro de entrada, NO por el efecto Coriolis (mito popular).',
  },
  {
    question: '¿Que posicion es mas saludable para defecar segun varios estudios?',
    answers: ['Sentado en ángulo recto', 'Reclinado hacia atras', 'En cuclillas', 'De pie'],
    correct: 2,
    explanation: 'Cuclillas. Por eso algunos se compran un "Squatty Potty" (taburete) para levantar los pies.',
  },
  {
    question: '¿Cuanto tiempo de media aguantas sin ir al baño en un viaje de 2 horas?',
    answers: ['No se puede generalizar', 'Segun las Cocacolas', 'Segun el cine que vayas a ver', 'Todas'],
    correct: 3,
    explanation: 'Todas son validas. En Appreton cubrimos las emergencias inesperadas de las tres.',
  },
  {
    question: '¿Cual es la palabra coloquial mas usada en España para "hacer caca"?',
    answers: ['Obrar', 'Depositar', 'Plantar un pino', 'Todas las anteriores'],
    correct: 3,
    explanation: 'Las tres se usan. Tambien "bajar a firmar" o "ir a cantar a misa". Los sinonimos son infinitos.',
  },
  {
    question: '¿En que pais esta el Museo de la Caca?',
    answers: ['Japon', 'Holanda', 'Australia', 'Mexico'],
    correct: 0,
    explanation: 'Japon tiene al menos dos: el "Unko Museum" en Tokio y Yokohama. Dedicados al humor escatológico.',
  },
  {
    question: '¿Cual es la velocidad promedio a la que sale la caca del cuerpo?',
    answers: ['1 cm/s', '5 cm/s', '15 cm/s', '30 cm/s'],
    correct: 1,
    explanation: 'Unos 5 cm por segundo, segun un estudio del Georgia Institute of Technology.',
  },
  {
    question: '¿Cuantas bacterias hay aproximadamente en un gramo de caca?',
    answers: ['Miles', 'Millones', 'Miles de millones', 'Billones'],
    correct: 2,
    explanation: 'Entre 100 mil millones y un billon de bacterias por gramo. Mas que estrellas hay en la Via Lactea.',
  },
  {
    question: '¿Por que las cacas suelen ser marrones?',
    answers: [
      'Por los alimentos que comes',
      'Por la bilis descompuesta por las bacterias',
      'Por el contacto con el aire',
      'Por el agua del intestino',
    ],
    correct: 1,
    explanation: 'Por la estercobilina, producto de la bilis degradada en el colon.',
  },
  {
    question: '¿Que animal produce la caca mas grande del planeta?',
    answers: ['Elefante africano', 'Ballena azul', 'Hipopotamo', 'Dinosaurio (en su epoca)'],
    correct: 1,
    explanation: 'La ballena azul. Cada deposicion puede superar los 200 kilos.',
  },
  {
    question: '¿Como se llama el miedo intenso a hacer caca?',
    answers: ['Defecofobia', 'Parcopresis', 'Coprofobia', 'Rectofobia'],
    correct: 0,
    explanation: 'Defecofobia. No confundir con coprofobia (miedo a tocar caca) o parcopresis (solo en publico).',
  },
  {
    question: 'En el antiguo Imperio Romano, ¿que usaban para limpiarse en los baños publicos?',
    answers: ['Hojas', 'Agua corriente', 'Una esponja en un palo compartida', 'Papel de pergamino'],
    correct: 2,
    explanation: 'Una esponja natural ensartada en un palo (xylospongium). Se "lavaba" en agua salada entre usos.',
  },
  {
    question: '¿Que nombre recibe la empresa de Thomas Crapper, pionera en inodoros victorianos?',
    answers: ['Crapper & Co.', 'Crapperworks', 'Thomas & Sons', 'The Royal Toilet'],
    correct: 0,
    explanation: '"Thomas Crapper & Co. Ltd". Es de donde algunos creen que viene la palabra "crap" en ingles.',
  },
  {
    question: '¿Cuantos litros de agua consume un inodoro moderno por descarga?',
    answers: ['1-2 litros', '3-6 litros', '9-12 litros', 'Mas de 15 litros'],
    correct: 1,
    explanation: 'Los modernos de doble descarga: 3L corto, 6L largo. Los antiguos gastaban 12+ litros.',
  },
  {
    question: 'En "Trainspotting", famosa pelicula britanica, hay una escena iconica con un WC. ¿En que ciudad?',
    answers: ['Londres', 'Edimburgo', 'Manchester', 'Glasgow'],
    correct: 1,
    explanation: 'Edimburgo, Escocia. "The Worst Toilet in Scotland" — una metafora del fondo que toca el protagonista.',
  },
  {
    question: '¿Quien promovio el inodoro moderno en el Londres victoriano?',
    answers: ['La Reina Victoria', 'El Principe Alberto', 'El alcalde Bazalgette', 'Thomas Crapper'],
    correct: 2,
    explanation: 'Joseph Bazalgette, ingeniero que construyo el sistema de alcantarillado tras "El Gran Hedor" de 1858.',
  },
  {
    question: '¿Cual es la caca mas antigua fosilizada encontrada?',
    answers: ['500 mil años', '5 millones de años', '50 millones de años', '250 millones de años'],
    correct: 3,
    explanation: 'Unos 250 millones de años. Las caca fosilizadas se llaman coprolitos y son muy valiosas para arqueologos.',
  },
  {
    question: '¿Cuanto cuesta entrar a los baños publicos mas caros del mundo?',
    answers: ['5 euros', '10 euros', '25 euros', '50 euros'],
    correct: 2,
    explanation: 'En el Hotel Marques de Riscal (La Rioja) unos 25€ y te dan una copa de vino. El bar del Burj Al Arab es similar.',
  },
];

export function getRandomQuestions(n = 10) {
  const pool = [...TRIVIA_QUESTIONS];
  const result = [];
  while (result.length < n && pool.length > 0) {
    const idx = Math.floor(Math.random() * pool.length);
    result.push(pool.splice(idx, 1)[0]);
  }
  return result;
}
