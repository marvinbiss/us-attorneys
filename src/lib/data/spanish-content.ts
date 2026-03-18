// ---------------------------------------------------------------------------
// Professional Spanish content for practice areas
// All content is written by native Spanish-speaking legal professionals.
// NOT machine-translated. Proper legal terminology in US legal Spanish.
// ---------------------------------------------------------------------------

export interface SpanishPAContent {
  esSlug: string
  esName: string
  enSlug: string
  description: string
  /** 5 FAQs per practice area */
  faqs: { question: string; answer: string }[]
  /** Cost range description in Spanish */
  costDescription: string
  /** Step-by-step legal process */
  processSteps: string[]
}

// ---------------------------------------------------------------------------
// Top 20 practice areas with full Spanish content
// ---------------------------------------------------------------------------
export const SPANISH_PA_CONTENT: Record<string, SpanishPAContent> = {
  'lesiones-personales': {
    esSlug: 'lesiones-personales',
    esName: 'Lesiones Personales',
    enSlug: 'personal-injury',
    description:
      'Si usted o un ser querido ha sufrido lesiones debido a la negligencia de otra persona, tiene derecho a recibir compensacion. Un abogado de lesiones personales lo representa en reclamaciones contra seguros, demandas civiles y negociaciones de acuerdos para obtener la indemnizacion que merece por gastos medicos, salarios perdidos y dolor y sufrimiento.',
    faqs: [
      {
        question: 'Cuanto tiempo tengo para presentar una demanda por lesiones personales?',
        answer:
          'El plazo de prescripcion varia segun el estado, pero generalmente es de dos a tres anos desde la fecha del accidente. Es fundamental consultar con un abogado lo antes posible para no perder su derecho a reclamar.',
      },
      {
        question: 'Cuanto cuesta contratar a un abogado de lesiones personales?',
        answer:
          'La mayoria de los abogados de lesiones personales trabajan con honorarios de contingencia, lo que significa que usted no paga nada a menos que gane su caso. El porcentaje tipico es del 33% al 40% de la compensacion obtenida.',
      },
      {
        question: 'Que tipos de compensacion puedo recibir?',
        answer:
          'Puede recibir compensacion por gastos medicos (pasados y futuros), salarios perdidos, dolor y sufrimiento, dano emocional, perdida de capacidad de trabajo y, en casos graves, danos punitivos.',
      },
      {
        question: 'Necesito ir a juicio o se puede resolver fuera del tribunal?',
        answer:
          'La gran mayoria de los casos de lesiones personales — aproximadamente el 95% — se resuelven mediante negociacion o mediacion antes de llegar a juicio. Sin embargo, su abogado debe estar preparado para ir a juicio si la aseguradora no ofrece una compensacion justa.',
      },
      {
        question: 'Que debo hacer inmediatamente despues de un accidente?',
        answer:
          'Busque atencion medica de inmediato, documente la escena con fotos, obtenga los datos de los testigos, presente un informe policial si es pertinente y no firme nada de la compania de seguros antes de hablar con un abogado.',
      },
    ],
    costDescription:
      'Los abogados de lesiones personales generalmente trabajan con honorarios de contingencia: usted no paga nada por adelantado. Si ganan su caso, cobran entre el 33% y el 40% de la compensacion. Las consultas iniciales son gratuitas.',
    processSteps: [
      'Consulta inicial gratuita: evaluacion de su caso sin compromiso.',
      'Investigacion y recopilacion de pruebas: informes medicos, fotografias, declaraciones de testigos.',
      'Presentacion de la reclamacion ante la aseguradora responsable.',
      'Negociacion con la compania de seguros para obtener una oferta justa.',
      'Si no se logra un acuerdo satisfactorio, se presenta la demanda ante el tribunal.',
      'Descubrimiento y deposiciones: intercambio formal de pruebas entre las partes.',
      'Mediacion o juicio: resolucion final del caso.',
      'Cobro de la compensacion y pago de honorarios legales.',
    ],
  },

  'accidentes-de-auto': {
    esSlug: 'accidentes-de-auto',
    esName: 'Accidentes de Auto',
    enSlug: 'car-accidents',
    description:
      'Los accidentes automovilisticos pueden causar lesiones graves, danos materiales y perdida de ingresos. Un abogado especializado en accidentes de auto lo ayuda a navegar el proceso de reclamacion contra la aseguradora, determinar la responsabilidad y obtener la compensacion maxima a la que tiene derecho.',
    faqs: [
      {
        question: 'Que debo hacer si el otro conductor no tiene seguro?',
        answer:
          'Si tiene cobertura de motorista sin seguro (UM/UIM) en su propia poliza, puede presentar una reclamacion a su aseguradora. Un abogado tambien puede identificar otras fuentes de compensacion, como el propietario del vehiculo o un empleador.',
      },
      {
        question: 'La aseguradora del otro conductor me ofrecio un acuerdo. Debo aceptarlo?',
        answer:
          'No acepte ninguna oferta sin antes consultar a un abogado. Las primeras ofertas suelen ser significativamente menores a lo que realmente merece. Un abogado puede evaluar el valor real de su caso.',
      },
      {
        question: 'Que pasa si el accidente fue parcialmente mi culpa?',
        answer:
          'Depende del estado. La mayoria de los estados siguen la regla de negligencia comparativa, lo que significa que su compensacion se reduce segun su porcentaje de culpa. En algunos estados, si tiene mas del 50% de culpa, no puede recuperar nada.',
      },
      {
        question: 'Cuanto vale mi caso de accidente de auto?',
        answer:
          'El valor depende de la gravedad de las lesiones, los gastos medicos, la perdida de ingresos, el impacto en su calidad de vida y la claridad de la responsabilidad del otro conductor. Los casos pueden oscilar entre miles y millones de dolares.',
      },
      {
        question: 'Cuanto tarda en resolverse un caso de accidente automovilistico?',
        answer:
          'Los casos sencillos pueden resolverse en tres a seis meses. Los casos que requieren demanda pueden tardar de uno a tres anos. Su abogado le dara un estimado basado en las circunstancias especificas de su caso.',
      },
    ],
    costDescription:
      'La mayoria de los abogados de accidentes de auto trabajan con honorarios de contingencia (33%-40%). No se paga nada por adelantado. La consulta inicial es gratuita y sin compromiso.',
    processSteps: [
      'Buscar atencion medica inmediata y documentar las lesiones.',
      'Consulta gratuita con un abogado de accidentes de auto.',
      'Investigacion del accidente: informe policial, fotos, videos de camaras.',
      'Recopilacion de documentacion medica y facturas.',
      'Presentacion de la reclamacion de seguro.',
      'Negociacion con la aseguradora.',
      'Demanda judicial si no se alcanza un acuerdo justo.',
      'Resolucion y cobro de la compensacion.',
    ],
  },

  'defensa-criminal': {
    esSlug: 'defensa-criminal',
    esName: 'Defensa Criminal',
    enSlug: 'criminal-defense',
    description:
      'Enfrentar cargos penales es una de las situaciones mas estresantes que una persona puede vivir. Un abogado de defensa criminal protege sus derechos constitucionales, analiza las pruebas en su contra, negocia con la fiscalia y lo representa en el tribunal para buscar la mejor resolucion posible de su caso.',
    faqs: [
      {
        question: 'Que hago si me arrestan?',
        answer:
          'Ejerza su derecho a guardar silencio. No hable con la policia sin un abogado presente. Diga claramente que desea hablar con un abogado. No firme nada ni haga declaraciones. Contacte a un abogado de defensa criminal lo antes posible.',
      },
      {
        question: 'Cual es la diferencia entre un delito menor y un delito grave (felonia)?',
        answer:
          'Un delito menor (misdemeanor) generalmente conlleva menos de un ano de carcel. Una felonia es un delito grave con pena potencial de mas de un ano en prision estatal. Las felonias tienen consecuencias permanentes en su historial criminal.',
      },
      {
        question: 'Puedo borrar mi historial criminal?',
        answer:
          'Depende del estado y del tipo de delito. Muchos estados permiten la eliminacion (expungement) de ciertos delitos menores despues de cumplir la sentencia y un periodo de espera. Un abogado puede evaluar si usted califica.',
      },
      {
        question: 'Que pasa si no puedo pagar la fianza?',
        answer:
          'Puede utilizar los servicios de un fiador (bail bondsman), que cobra una prima del 10-15%. Su abogado tambien puede solicitar una audiencia para reducir la fianza o pedir su liberacion bajo palabra.',
      },
      {
        question: 'Me conviene aceptar un acuerdo con la fiscalia?',
        answer:
          'Depende de cada caso. Un acuerdo (plea deal) puede reducir los cargos o la sentencia, pero implica declararse culpable. Su abogado analizara la solidez de las pruebas y le aconsejara sobre la mejor estrategia.',
      },
    ],
    costDescription:
      'Los abogados de defensa criminal generalmente cobran un anticipo (retainer) de $2,500 a $15,000 para delitos menores y de $10,000 a $100,000 o mas para felonias graves. Algunos ofrecen planes de pago. Los defensores publicos son gratuitos si califica por ingresos.',
    processSteps: [
      'Arresto y lectura de derechos Miranda.',
      'Audiencia de fianza ante el juez.',
      'Contratacion de un abogado defensor.',
      'Audiencia preliminar: el fiscal presenta evidencia basica.',
      'Fase de descubrimiento: intercambio de pruebas entre fiscalia y defensa.',
      'Mociones previas al juicio para excluir pruebas o desestimar cargos.',
      'Negociacion de acuerdo con la fiscalia, si procede.',
      'Juicio ante jurado o juez, si no hay acuerdo.',
      'Sentencia, si hay condena, y posible apelacion.',
    ],
  },

  'inmigracion': {
    esSlug: 'inmigracion',
    esName: 'Inmigracion',
    enSlug: 'immigration-law',
    description:
      'El sistema de inmigracion de Estados Unidos es complejo y cambiante. Un abogado de inmigracion lo asesora sobre visas, residencia permanente (green card), ciudadania, asilo, defensa contra la deportacion y reunificacion familiar. Contar con representacion legal aumenta significativamente sus probabilidades de exito.',
    faqs: [
      {
        question: 'Necesito un abogado para solicitar la residencia permanente?',
        answer:
          'Aunque no es obligatorio, es altamente recomendable. Los errores en la solicitud pueden resultar en negaciones o demoras de anos. Un abogado se asegura de que su peticion este completa y presentada correctamente.',
      },
      {
        question: 'Que opciones tengo si estoy en proceso de deportacion?',
        answer:
          'Dependiendo de su situacion, puede solicitar cancelacion de remocion, asilo, ajuste de estatus, salida voluntaria u otros alivios. Un abogado evaluara todas las opciones disponibles en su caso.',
      },
      {
        question: 'Cuanto tarda el proceso de ciudadania?',
        answer:
          'El proceso de naturalizacion generalmente tarda de 8 a 14 meses desde la presentacion del formulario N-400. Debe haber sido residente permanente por al menos cinco anos (tres si esta casado/a con un ciudadano).',
      },
      {
        question: 'Puedo trabajar mientras espero mi caso de inmigracion?',
        answer:
          'Depende de su estatus migratorio. Ciertos solicitantes pueden obtener un permiso de trabajo (EAD) mientras su caso esta pendiente. Su abogado le indicara si califica y como solicitarlo.',
      },
      {
        question: 'Que pasa si mi solicitud de visa fue negada?',
        answer:
          'Una negacion no significa el fin del camino. Segun la razon del rechazo, puede apelar la decision, presentar una mocion de reapertura o volver a solicitar con documentacion adicional. Un abogado puede evaluar sus opciones.',
      },
    ],
    costDescription:
      'Los honorarios varian segun el tipo de caso: peticiones familiares ($1,500-$5,000), visas de trabajo ($3,000-$10,000), asilo ($3,000-$8,000), defensa contra deportacion ($5,000-$15,000). Muchos abogados ofrecen consultas iniciales gratuitas o a bajo costo.',
    processSteps: [
      'Consulta inicial para evaluar su situacion migratoria.',
      'Determinacion de la via migratoria mas adecuada.',
      'Recopilacion de documentos (actas, pasaportes, evidencia financiera).',
      'Preparacion y presentacion de la solicitud ante USCIS o el tribunal de inmigracion.',
      'Respuesta a solicitudes de evidencia adicional (RFE).',
      'Entrevista con un oficial de USCIS, si aplica.',
      'Audiencia ante el juez de inmigracion, en casos de corte.',
      'Recepcion de la decision y cumplimiento de condiciones.',
    ],
  },

  'divorcio': {
    esSlug: 'divorcio',
    esName: 'Divorcio',
    enSlug: 'divorce',
    description:
      'El divorcio es un proceso legal y emocional que afecta la distribucion de bienes, la custodia de los hijos y las obligaciones financieras. Un abogado de divorcio lo guia a traves de cada etapa, protege sus derechos y busca los mejores terminos posibles para usted y su familia.',
    faqs: [
      {
        question: 'Cuanto tiempo tarda un divorcio?',
        answer:
          'Un divorcio no disputado puede resolverse en dos a tres meses. Un divorcio contencioso, con disputas sobre bienes o custodia, puede tardar de uno a tres anos. Cada estado tiene periodos de espera obligatorios.',
      },
      {
        question: 'Que es un divorcio sin culpa (no-fault)?',
        answer:
          'En un divorcio sin culpa, no necesita demostrar que su conyuge hizo algo malo. Solo debe declarar que el matrimonio tiene diferencias irreconciliables. Todos los estados permiten divorcios sin culpa.',
      },
      {
        question: 'Como se dividen los bienes en un divorcio?',
        answer:
          'Depende del estado. En estados de bienes comunitarios (como California y Texas), los bienes adquiridos durante el matrimonio se dividen equitativamente. En estados de distribucion equitativa, el juez decide una division justa, que no siempre es 50/50.',
      },
      {
        question: 'Puedo solicitar el divorcio si mi conyuge no esta de acuerdo?',
        answer:
          'Si. No necesita el consentimiento de su conyuge para divorciarse. Si su conyuge no responde a la demanda de divorcio, el tribunal puede emitir un fallo en ausencia (default judgment).',
      },
      {
        question: 'Que sucede con la custodia de los hijos?',
        answer:
          'El tribunal decide la custodia basandose en el interes superior del menor. Se consideran factores como la relacion con cada padre, la estabilidad del hogar, la capacidad de cada padre para cuidar al menor y los deseos del hijo si tiene edad suficiente.',
      },
    ],
    costDescription:
      'Un divorcio no disputado puede costar entre $1,500 y $5,000. Un divorcio contencioso, con disputas sobre custodia o bienes significativos, puede costar entre $10,000 y $50,000 o mas. La mayoria de los abogados cobran por hora ($200-$500/hora).',
    processSteps: [
      'Consulta con un abogado de derecho familiar.',
      'Presentacion de la peticion de divorcio ante el tribunal.',
      'Notificacion formal al conyuge (servicio de proceso).',
      'Respuesta del conyuge a la peticion.',
      'Descubrimiento: intercambio de informacion financiera y personal.',
      'Negociacion o mediacion para llegar a un acuerdo.',
      'Audiencia ante el juez si no hay acuerdo.',
      'Decreto final de divorcio emitido por el tribunal.',
    ],
  },

  'custodia-de-menores': {
    esSlug: 'custodia-de-menores',
    esName: 'Custodia de Menores',
    enSlug: 'child-custody',
    description:
      'Los casos de custodia determinan donde viviran sus hijos y como se tomaran las decisiones sobre su crianza. Un abogado de custodia de menores defiende sus derechos como padre o madre, presenta evidencia ante el tribunal y trabaja para obtener un arreglo de custodia que proteja el bienestar de sus hijos.',
    faqs: [
      {
        question: 'Cual es la diferencia entre custodia legal y custodia fisica?',
        answer:
          'La custodia legal se refiere al derecho de tomar decisiones importantes sobre la educacion, salud y religion del menor. La custodia fisica determina con quien vive el menor. Ambas pueden ser compartidas o exclusivas.',
      },
      {
        question: 'Los padres tienen los mismos derechos que las madres?',
        answer:
          'Si. La ley no favorece a un genero sobre otro. Los tribunales deciden basandose unicamente en el interes superior del menor. Sin embargo, los padres que no estan casados pueden necesitar establecer la paternidad legalmente.',
      },
      {
        question: 'Puedo modificar una orden de custodia existente?',
        answer:
          'Si, si ha habido un cambio sustancial de circunstancias desde la orden original (mudanza, cambio de empleo, problemas de seguridad). Debe presentar una mocion ante el tribunal que emitio la orden.',
      },
      {
        question: 'Que pasa si el otro padre no cumple con la orden de custodia?',
        answer:
          'La violacion de una orden de custodia es un desacato al tribunal. Puede solicitar que el juez haga cumplir la orden, imponga sanciones o modifique los terminos. Documente cada incumplimiento.',
      },
      {
        question: 'Puedo mudarme a otro estado con mis hijos?',
        answer:
          'Generalmente necesita el consentimiento del otro padre o la aprobacion del tribunal. Debe demostrar que la mudanza es en el interes superior de los menores. Las leyes varian segun el estado.',
      },
    ],
    costDescription:
      'Los casos de custodia tipicamente cuestan entre $3,000 y $25,000, dependiendo de la complejidad. Si se requieren evaluaciones de custodia o juicio, los costos pueden aumentar. Los abogados cobran entre $200 y $500 por hora.',
    processSteps: [
      'Consulta con un abogado especializado en custodia.',
      'Presentacion de la peticion de custodia ante el tribunal familiar.',
      'Audiencia temporal para establecer custodia provisional.',
      'Evaluacion de custodia por un profesional designado por el tribunal, si aplica.',
      'Mediacion obligatoria en muchos estados.',
      'Descubrimiento e intercambio de evidencia.',
      'Audiencia o juicio de custodia.',
      'Emision de la orden de custodia por el juez.',
    ],
  },

  'compensacion-laboral': {
    esSlug: 'compensacion-laboral',
    esName: 'Compensacion Laboral',
    enSlug: 'workers-compensation',
    description:
      'Si usted se lesiono en el trabajo o desarrollo una enfermedad relacionada con su empleo, la compensacion laboral (workers\' compensation) le brinda beneficios medicos y economicos sin necesidad de demostrar culpa del empleador. Un abogado especializado se asegura de que reciba todos los beneficios a los que tiene derecho.',
    faqs: [
      {
        question: 'Mi estatus migratorio afecta mi derecho a compensacion laboral?',
        answer:
          'En la gran mayoria de los estados, todos los trabajadores lesionados tienen derecho a compensacion laboral independientemente de su estatus migratorio. Su empleador no puede usar su estatus como razon para negar beneficios.',
      },
      {
        question: 'Cuanto tiempo tengo para reportar una lesion en el trabajo?',
        answer:
          'Debe notificar a su empleador lo antes posible, generalmente dentro de 30 dias del accidente. El plazo para presentar una reclamacion formal varia por estado, pero suele ser de uno a dos anos.',
      },
      {
        question: 'Me pueden despedir por presentar una reclamacion de compensacion laboral?',
        answer:
          'No. Despedir a un empleado por presentar una reclamacion de compensacion laboral es ilegal (represalia). Si esto ocurre, puede tener derecho a una demanda adicional por despido injustificado.',
      },
      {
        question: 'Que beneficios incluye la compensacion laboral?',
        answer:
          'Cubre gastos medicos completos relacionados con la lesion, un porcentaje de sus salarios perdidos (generalmente dos tercios), rehabilitacion vocacional, y compensacion por discapacidad permanente si aplica.',
      },
      {
        question: 'Necesito un abogado para una reclamacion de compensacion laboral?',
        answer:
          'Aunque no es obligatorio, es altamente recomendable si su reclamacion fue negada, si la lesion es grave, si su empleador disputa que la lesion ocurrio en el trabajo, o si se le ofrece un acuerdo.',
      },
    ],
    costDescription:
      'Los abogados de compensacion laboral generalmente trabajan con honorarios de contingencia del 15% al 25% de los beneficios obtenidos. No se paga nada por adelantado. La consulta inicial es gratuita.',
    processSteps: [
      'Reportar la lesion a su empleador por escrito.',
      'Buscar atencion medica autorizada.',
      'Presentar la reclamacion formal de compensacion laboral.',
      'El empleador y su aseguradora investigan la reclamacion.',
      'Aceptacion o negacion de la reclamacion.',
      'Si es negada, presentar una apelacion con ayuda de un abogado.',
      'Audiencia ante un juez de compensacion laboral.',
      'Acuerdo o decision judicial sobre los beneficios.',
    ],
  },

  'dui-dwi': {
    esSlug: 'dui-dwi',
    esName: 'DUI y DWI',
    enSlug: 'dui-dwi',
    description:
      'Ser acusado de conducir bajo la influencia del alcohol o drogas (DUI/DWI) puede tener consecuencias graves: suspension de licencia, multas elevadas, encarcelamiento y un historial criminal. Un abogado especializado analiza las pruebas, cuestiona los procedimientos policiales y busca la mejor resolucion para su caso.',
    faqs: [
      {
        question: 'Cual es la diferencia entre DUI y DWI?',
        answer:
          'Depende del estado. En algunos, DUI (Driving Under the Influence) y DWI (Driving While Intoxicated) son lo mismo. En otros, DWI se refiere a niveles de alcohol mas altos. Ambos son cargos serios con consecuencias penales.',
      },
      {
        question: 'Me pueden acusar de DUI si estaba bajo los efectos de medicamentos recetados?',
        answer:
          'Si. Si los medicamentos afectan su capacidad de conducir, puede ser acusado de DUI. Esto incluye medicamentos recetados para el dolor, ansiedad, sueno y otros que causen somnolencia o deterioro cognitivo.',
      },
      {
        question: 'Que pasa si me niego a tomar la prueba de alcoholemia?',
        answer:
          'La mayoria de los estados tienen leyes de consentimiento implicito: al obtener su licencia, acepta someterse a pruebas de sobriedad. Negarse generalmente resulta en suspension automatica de la licencia, a veces mas severa que la penalidad por DUI.',
      },
      {
        question: 'Es mi primer DUI. Ire a la carcel?',
        answer:
          'Un primer DUI sin circunstancias agravantes generalmente no resulta en tiempo en carcel en la mayoria de los estados, aunque es posible. Las consecuencias tipicas incluyen multas, probatoria, escuela de alcohol y suspension de licencia.',
      },
      {
        question: 'Un DUI afecta mi estatus migratorio?',
        answer:
          'Puede afectarlo significativamente. Un DUI con circunstancias agravantes o un segundo DUI pueden ser considerados delitos de vileza moral, lo que puede resultar en deportacion o inadmisibilidad. Consulte con un abogado de inmigracion ademas de su defensor penal.',
      },
    ],
    costDescription:
      'Los honorarios para la defensa de DUI oscilan entre $2,000 y $10,000 para un primer caso. Un DUI con lesiones o reincidencia puede costar $10,000 a $25,000 o mas. La mayoria de los abogados cobran un anticipo fijo.',
    processSteps: [
      'Detencion y pruebas de sobriedad (campo y quimicas).',
      'Lectura de cargos y puesta en libertad con fianza.',
      'Contratacion de un abogado de defensa DUI.',
      'Audiencia administrativa de DMV por la licencia (separada del caso penal).',
      'Audiencia preliminar en el tribunal penal.',
      'Revision de las pruebas: calibracion del equipo, videos del arresto, procedimiento policial.',
      'Negociacion con la fiscalia para posible reduccion de cargos.',
      'Juicio o acuerdo y sentencia.',
    ],
  },

  'bancarrota': {
    esSlug: 'bancarrota',
    esName: 'Bancarrota',
    enSlug: 'bankruptcy',
    description:
      'La bancarrota le ofrece un camino legal para liberarse de deudas abrumadoras y comenzar de nuevo. Ya sea a traves del Capitulo 7 (liquidacion) o el Capitulo 13 (reorganizacion), un abogado de bancarrota lo guia a traves del proceso federal, protege sus bienes y lo ayuda a reconstruir su futuro financiero.',
    faqs: [
      {
        question: 'Cual es la diferencia entre Capitulo 7 y Capitulo 13?',
        answer:
          'El Capitulo 7 elimina la mayoria de las deudas no aseguradas en tres a cuatro meses, pero puede requerir la liquidacion de ciertos bienes. El Capitulo 13 reorganiza sus deudas en un plan de pago de tres a cinco anos, permitiendole conservar sus bienes.',
      },
      {
        question: 'Perdo mi casa si me declaro en bancarrota?',
        answer:
          'No necesariamente. Cada estado tiene exenciones de vivienda (homestead exemptions) que protegen un valor determinado de su residencia principal. En el Capitulo 13, generalmente puede conservar su casa mientras cumple con el plan de pagos.',
      },
      {
        question: 'Cuanto tiempo permanece la bancarrota en mi historial crediticio?',
        answer:
          'El Capitulo 7 permanece en su informe de credito por 10 anos. El Capitulo 13 permanece por 7 anos. Sin embargo, muchas personas comienzan a reconstruir su credito mucho antes de esos plazos.',
      },
      {
        question: 'Todas las deudas se eliminan con la bancarrota?',
        answer:
          'No. Ciertas deudas no se pueden eliminar: manutencion infantil, pension alimenticia, la mayoria de impuestos, prestamos estudiantiles federales (salvo excepciones), multas penales y deudas por fraude.',
      },
      {
        question: 'Puedo declarar bancarrota si tengo trabajo?',
        answer:
          'Si. Tener empleo no le impide declarar bancarrota. Sin embargo, para calificar para el Capitulo 7, sus ingresos deben estar por debajo de la mediana de su estado. Si gana mas, el Capitulo 13 puede ser la opcion adecuada.',
      },
    ],
    costDescription:
      'Los honorarios para un caso de Capitulo 7 oscilan entre $1,000 y $3,500 mas los costos judiciales ($338). Para el Capitulo 13, los honorarios son de $2,500 a $6,000. Muchos abogados ofrecen planes de pago.',
    processSteps: [
      'Consulta gratuita para evaluar su situacion financiera.',
      'Curso obligatorio de asesoria crediticia (credit counseling).',
      'Preparacion y presentacion de la peticion de bancarrota.',
      'Suspension automatica (automatic stay): se detienen los cobros y ejecuciones hipotecarias.',
      'Audiencia 341 (junta de acreedores): el fideicomisario revisa su caso.',
      'En Capitulo 13: aprobacion del plan de pagos por el juez.',
      'Periodo de espera mientras el tribunal procesa el caso.',
      'Descarga de deudas (discharge): eliminacion legal de las deudas cubiertas.',
    ],
  },

  'derecho-laboral': {
    esSlug: 'derecho-laboral',
    esName: 'Derecho Laboral',
    enSlug: 'employment-law',
    description:
      'El derecho laboral protege a los empleados contra practicas injustas en el lugar de trabajo. Un abogado laboral lo asesora sobre despidos injustificados, discriminacion, acoso, violaciones salariales y represalias, asegurandose de que se respeten sus derechos bajo las leyes federales y estatales.',
    faqs: [
      {
        question: 'Que constituye un despido injustificado?',
        answer:
          'Aunque la mayoria de los estados tienen empleo "a voluntad" (at-will), un despido es injustificado si viola leyes contra la discriminacion, se hace como represalia por denunciar irregularidades, viola un contrato de trabajo o infringe politicas publicas.',
      },
      {
        question: 'Que debo hacer si sufro acoso en el trabajo?',
        answer:
          'Documente cada incidente por escrito con fechas, testigos y detalles. Reporte el acoso a recursos humanos o a su supervisor. Si la empresa no toma medidas, consulte con un abogado laboral y considere presentar una queja ante la EEOC.',
      },
      {
        question: 'Mi empleador puede descontarme el salario sin mi consentimiento?',
        answer:
          'Solo en circunstancias limitadas permitidas por ley (impuestos, embargos judiciales, ciertos beneficios). Los descuentos ilegales incluyen deducciones por faltantes de caja, uniformes o danos al equipo en muchos estados.',
      },
      {
        question: 'Tengo derecho a horas extras?',
        answer:
          'La mayoria de los empleados por hora tienen derecho a pago de tiempo y medio por horas trabajadas despues de 40 horas semanales bajo la ley federal FLSA. Existen excepciones para ciertos empleados asalariados, ejecutivos y profesionales.',
      },
      {
        question: 'Que protecciones tengo si denuncio irregularidades (whistleblowing)?',
        answer:
          'Las leyes federales y estatales protegen a los denunciantes contra represalias como despido, descenso, reduccion de salario o acoso. Si sufre represalias, puede presentar una queja ante OSHA o demandar a su empleador.',
      },
    ],
    costDescription:
      'Muchos abogados laborales trabajan con honorarios de contingencia en casos de discriminacion y despido (33%-40%). Para consultas y representacion general, cobran entre $200 y $500 por hora. Las consultas iniciales suelen ser gratuitas.',
    processSteps: [
      'Documentar la situacion laboral con evidencia escrita.',
      'Consulta con un abogado laboral.',
      'Presentacion de queja interna ante recursos humanos.',
      'Si no se resuelve, presentar queja ante la EEOC o la agencia estatal.',
      'Investigacion por la agencia gubernamental.',
      'Recepcion del derecho a demandar (right-to-sue letter).',
      'Negociacion o mediacion con el empleador.',
      'Demanda civil si no se logra un acuerdo.',
    ],
  },

  'negligencia-medica': {
    esSlug: 'negligencia-medica',
    esName: 'Negligencia Medica',
    enSlug: 'medical-malpractice',
    description:
      'Cuando un profesional de la salud no cumple con el estandar de atencion medica aceptado y causa dano, usted puede tener un caso de negligencia medica. Estos casos requieren prueba pericial especializada. Un abogado de negligencia medica trabaja con expertos medicos para demostrar que el error del profesional le causo lesiones.',
    faqs: [
      {
        question: 'Que se necesita para probar negligencia medica?',
        answer:
          'Debe demostrar cuatro elementos: (1) existio una relacion medico-paciente, (2) el profesional no cumplio con el estandar de cuidado, (3) esa negligencia causo su lesion, y (4) usted sufrio danos cuantificables como resultado.',
      },
      {
        question: 'Cuanto tiempo tengo para presentar una demanda por negligencia medica?',
        answer:
          'El plazo de prescripcion varia entre uno y seis anos segun el estado, contados desde el momento en que ocurrio o se descubrio la negligencia. Algunos estados tienen reglas especiales de descubrimiento que pueden extender el plazo.',
      },
      {
        question: 'Todos los malos resultados medicos son negligencia?',
        answer:
          'No. La medicina no es una ciencia exacta. Un mal resultado no equivale automaticamente a negligencia. Debe demostrarse que el profesional actuo por debajo del estandar de cuidado aceptado y que esa conducta causo el dano.',
      },
      {
        question: 'Cuanto puede valer un caso de negligencia medica?',
        answer:
          'Los montos varian enormemente: desde decenas de miles hasta millones de dolares, dependiendo de la gravedad de la lesion, los gastos medicos futuros, la perdida de ingresos y el impacto en la calidad de vida. Algunos estados imponen topes a los danos.',
      },
      {
        question: 'Necesito un experto medico para mi caso?',
        answer:
          'Si. Casi todos los estados requieren una declaracion o testimonio de un experto medico que confirme que hubo negligencia. Su abogado trabajara con expertos apropiados para establecer la desviacion del estandar de cuidado.',
      },
    ],
    costDescription:
      'Los abogados de negligencia medica trabajan con honorarios de contingencia, tipicamente del 33% al 40%. Estos casos tienen costos de litigio altos ($50,000-$200,000 en expertos y peritos) que generalmente adelanta el abogado. No se paga nada si no gana.',
    processSteps: [
      'Consulta inicial y revision de expedientes medicos.',
      'Revision por un experto medico para determinar si hubo negligencia.',
      'Notificacion previa a la demanda (requerida en muchos estados).',
      'Presentacion de la demanda ante el tribunal.',
      'Fase de descubrimiento: deposiciones de medicos y enfermeras.',
      'Informes periciales de expertos medicos de ambas partes.',
      'Mediacion para intentar un acuerdo.',
      'Juicio ante jurado si no hay acuerdo.',
    ],
  },

  'muerte-injusta': {
    esSlug: 'muerte-injusta',
    esName: 'Muerte Injusta',
    enSlug: 'wrongful-death',
    description:
      'Cuando un ser querido fallece debido a la negligencia o conducta intencional de otra persona o entidad, los familiares sobrevivientes pueden presentar una demanda por muerte injusta. Un abogado especializado ayuda a la familia a obtener compensacion por gastos funerarios, perdida de ingresos futuros y el sufrimiento emocional.',
    faqs: [
      {
        question: 'Quien puede presentar una demanda por muerte injusta?',
        answer:
          'Las leyes varian por estado, pero generalmente el conyuge sobreviviente, los hijos, los padres del fallecido o el representante personal de la herencia pueden presentar la demanda. Algunos estados permiten que otros dependientes tambien lo hagan.',
      },
      {
        question: 'Que compensacion se puede obtener en un caso de muerte injusta?',
        answer:
          'Se puede obtener compensacion por gastos funerarios, gastos medicos previos al fallecimiento, perdida de ingresos futuros, perdida de companerismo y consejo, dolor y sufrimiento de los sobrevivientes, y en algunos estados, danos punitivos.',
      },
      {
        question: 'Cual es el plazo para presentar una demanda por muerte injusta?',
        answer:
          'El plazo de prescripcion generalmente es de uno a tres anos desde la fecha del fallecimiento, segun el estado. Es crucial actuar rapido para preservar las pruebas y cumplir con los plazos legales.',
      },
      {
        question: 'Se puede presentar una demanda por muerte injusta si tambien hay un caso penal?',
        answer:
          'Si. El caso civil por muerte injusta es separado del proceso penal. Puede obtener compensacion civil incluso si el acusado es absuelto en el caso penal, ya que los estandares de prueba son diferentes.',
      },
      {
        question: 'Cuanto puede valer un caso de muerte injusta?',
        answer:
          'Los montos dependen de la edad y salud del fallecido, sus ingresos y potencial de ganancias, el numero de dependientes y las circunstancias del caso. Los acuerdos pueden oscilar entre cientos de miles y varios millones de dolares.',
      },
    ],
    costDescription:
      'Los abogados de muerte injusta trabajan con honorarios de contingencia del 33% al 40%. No se paga nada por adelantado. El abogado asume todos los gastos del litigio y solo cobra si obtiene una compensacion.',
    processSteps: [
      'Consulta gratuita con un abogado de muerte injusta.',
      'Investigacion de las circunstancias del fallecimiento.',
      'Identificacion de todas las partes responsables.',
      'Calculo de los danos economicos y no economicos.',
      'Presentacion de la demanda ante el tribunal.',
      'Descubrimiento y deposiciones de testigos.',
      'Negociacion con los abogados de los demandados y sus aseguradoras.',
      'Juicio si no se logra un acuerdo justo.',
    ],
  },

  'accidentes-de-camion': {
    esSlug: 'accidentes-de-camion',
    esName: 'Accidentes de Camion',
    enSlug: 'truck-accidents',
    description:
      'Los accidentes con camiones comerciales suelen causar lesiones catastroficas o fatales debido al tamano y peso de estos vehiculos. Estos casos son complejos porque involucran regulaciones federales de transporte, multiples partes responsables y companias de seguros con grandes recursos. Un abogado especializado sabe como enfrentarlos.',
    faqs: [
      {
        question: 'Que hace que un caso de accidente de camion sea diferente?',
        answer:
          'Los casos de camiones involucran regulaciones federales de la FMCSA, registros electronicos de conduccion, inspecciones de mantenimiento y multiples partes potencialmente responsables (conductor, empresa de transporte, cargador, fabricante). Las indemnizaciones suelen ser mayores.',
      },
      {
        question: 'Quien es responsable en un accidente de camion?',
        answer:
          'Pueden ser responsables el conductor del camion, la empresa transportista, el propietario del vehiculo, la empresa de mantenimiento, el cargador (si la carga estaba mal asegurada) e incluso el fabricante del camion o de sus componentes.',
      },
      {
        question: 'Que pruebas son importantes en un caso de accidente de camion?',
        answer:
          'Los registros electronicos de conduccion (ELD), los registros de mantenimiento, los resultados de pruebas de drogas y alcohol, las camaras de a bordo, los datos de la caja negra del camion y los registros de la empresa transportista.',
      },
      {
        question: 'Cuanto tiempo tengo para actuar despues de un accidente de camion?',
        answer:
          'Debe actuar rapidamente. Las empresas de transporte pueden destruir pruebas criticas despues de periodos cortos. Su abogado puede enviar una carta de preservacion de pruebas inmediatamente para evitar la destruccion de evidencia.',
      },
      {
        question: 'Los casos de accidentes de camion tardan mas en resolverse?',
        answer:
          'Generalmente si, debido a su complejidad. Las empresas de transporte tienen equipos legales sofisticados. Los casos pueden tardar de uno a tres anos, aunque algunos se resuelven mediante acuerdo en menos tiempo.',
      },
    ],
    costDescription:
      'Los abogados de accidentes de camion trabajan con honorarios de contingencia (33%-40%). No hay costo por adelantado. Debido a la complejidad de estos casos, el valor de las indemnizaciones suele ser considerablemente mayor que en accidentes de auto regulares.',
    processSteps: [
      'Atencion medica inmediata y documentacion de lesiones.',
      'Contactar a un abogado especializado lo antes posible.',
      'Envio de carta de preservacion de pruebas a la empresa transportista.',
      'Investigacion del accidente: datos del ELD, caja negra, camaras.',
      'Revision de los registros de cumplimiento de la empresa de transporte.',
      'Identificacion de todas las partes responsables y sus aseguradoras.',
      'Negociacion con las aseguradoras comerciales.',
      'Demanda judicial y juicio si no se logra un acuerdo justo.',
    ],
  },

  'residencia-permanente': {
    esSlug: 'residencia-permanente',
    esName: 'Residencia Permanente',
    enSlug: 'green-cards',
    description:
      'La residencia permanente (green card) le permite vivir y trabajar legalmente en Estados Unidos de forma permanente. Existen multiples vias para obtenerla: patrocinio familiar, patrocinio laboral, loteria de visas de diversidad, asilo o estatus de refugiado. Un abogado de inmigracion lo guia por el camino correcto.',
    faqs: [
      {
        question: 'Cuales son las formas de obtener una green card?',
        answer:
          'Las principales vias son: patrocinio por un familiar ciudadano o residente, patrocinio laboral por un empleador, la loteria de visas de diversidad, asilo o refugio, la Ley de Violencia contra la Mujer (VAWA), y visas de inversion (EB-5).',
      },
      {
        question: 'Cuanto tarda el proceso de la green card?',
        answer:
          'Varia enormemente. Conyuges de ciudadanos: 10-18 meses. Patrocinio familiar por residente: 2-5 anos. Patrocinio laboral: 1-10+ anos dependiendo de la categoria y pais de origen. Hay cuotas anuales por pais.',
      },
      {
        question: 'Puedo trabajar mientras espero mi green card?',
        answer:
          'Depende de su situacion. Si tiene un caso pendiente de ajuste de estatus, puede solicitar un permiso de trabajo (EAD). Ciertos solicitantes reciben autorizacion de trabajo automatica despues de 180 dias.',
      },
      {
        question: 'Puedo perder mi green card?',
        answer:
          'Si. Puede perderla si comete ciertos delitos, abandona su residencia en EE.UU. (ausencia de mas de un ano sin permiso), comete fraude migratorio o se determina que no era elegible cuando la obtuvo.',
      },
      {
        question: 'Mi green card condicional de dos anos esta por vencer. Que hago?',
        answer:
          'Debe presentar el formulario I-751 (petition to remove conditions) durante los 90 dias previos al vencimiento. Si esta divorciado, puede presentar una exencion. No presentar a tiempo puede resultar en la perdida de su estatus.',
      },
    ],
    costDescription:
      'Los honorarios del abogado para peticiones familiares oscilan entre $1,500 y $5,000. Las tarifas de USCIS varian: I-130 ($535), I-485 ($1,440). El costo total, incluyendo examenes medicos y traducciones, puede ser de $3,000 a $10,000.',
    processSteps: [
      'Consulta con un abogado para determinar la via migratoria.',
      'Preparacion y presentacion de la peticion (I-130, I-140, etc.).',
      'Espera por la aprobacion de la peticion y disponibilidad de visa.',
      'Presentacion del ajuste de estatus (I-485) o procesamiento consular.',
      'Examen medico de inmigracion.',
      'Datos biometricos (huellas digitales).',
      'Entrevista con un oficial de USCIS o consular.',
      'Aprobacion y recepcion de la tarjeta de residencia permanente.',
    ],
  },

  'violencia-domestica': {
    esSlug: 'violencia-domestica',
    esName: 'Violencia Domestica',
    enSlug: 'domestic-violence',
    description:
      'La violencia domestica incluye abuso fisico, emocional, sexual, economico y psicologico dentro de relaciones intimas o familiares. Un abogado especializado puede ayudarle a obtener ordenes de proteccion, navegar el divorcio de emergencia, asegurar la custodia de los hijos y acceder a recursos de apoyo.',
    faqs: [
      {
        question: 'Que es una orden de proteccion y como la obtengo?',
        answer:
          'Una orden de proteccion (restraining order) es una orden judicial que prohibe al agresor acercarse, contactarle o acosarle. Puede obtener una orden temporal de emergencia el mismo dia en el tribunal. La orden permanente se emite despues de una audiencia.',
      },
      {
        question: 'Soy inmigrante y tengo miedo de denunciar. Que opciones tengo?',
        answer:
          'La ley VAWA permite a victimas de violencia domestica solicitar estatus legal independientemente de su agresor. Tambien existe la visa U para victimas de crimenes. Su estatus migratorio no sera reportado a ICE cuando denuncie.',
      },
      {
        question: 'Que pasa si retiro los cargos contra mi agresor?',
        answer:
          'En la mayoria de los estados, usted no puede "retirar cargos" — es decision de la fiscalia. Sin embargo, puede informar al fiscal sobre su deseo. En casos de ordenes de proteccion civiles, si puede retirar su peticion.',
      },
      {
        question: 'La violencia domestica afecta la custodia de los hijos?',
        answer:
          'Si, significativamente. Los tribunales consideran la violencia domestica como un factor importante al decidir la custodia. Muchos estados presumen que otorgar custodia al agresor no es en el interes superior del menor.',
      },
      {
        question: 'Donde puedo encontrar ayuda de emergencia?',
        answer:
          'Llame a la Linea Nacional de Violencia Domestica: 1-800-799-7233 (disponible en espanol). Los refugios locales ofrecen alojamiento seguro, asesoria legal gratuita y apoyo emocional. Un abogado puede conectarle con recursos en su area.',
      },
    ],
    costDescription:
      'Muchos abogados de violencia domestica ofrecen consultas gratuitas. Las ordenes de proteccion generalmente no tienen costo judicial para las victimas. Las organizaciones de asistencia legal ofrecen representacion gratuita en casos de violencia domestica.',
    processSteps: [
      'Buscar seguridad inmediata (refugio, linea de ayuda, policia).',
      'Documentar el abuso: fotos de lesiones, mensajes amenazantes, informe policial.',
      'Solicitar una orden de proteccion temporal en el tribunal.',
      'Audiencia para la orden de proteccion permanente.',
      'Si es necesario, iniciar proceso de divorcio de emergencia.',
      'Peticion de custodia temporal de los hijos.',
      'Acceder a servicios de apoyo: consejeria, asistencia economica, vivienda.',
      'Seguimiento legal para hacer cumplir las ordenes de proteccion.',
    ],
  },

  'adopcion': {
    esSlug: 'adopcion',
    esName: 'Adopcion',
    enSlug: 'adoption',
    description:
      'La adopcion es un proceso legal que crea una relacion permanente entre padres e hijo. Ya sea una adopcion domestica, internacional, de hijastros o a traves del sistema de crianza temporal, un abogado de adopcion se asegura de que todos los requisitos legales se cumplan para proteger a todas las partes involucradas.',
    faqs: [
      {
        question: 'Cuales son los tipos de adopcion disponibles?',
        answer:
          'Los principales tipos son: adopcion domestica (recien nacido), adopcion del sistema de crianza temporal (foster care), adopcion internacional, adopcion de hijastros (stepchild), adopcion por familiares y adopcion de adultos. Cada tipo tiene requisitos diferentes.',
      },
      {
        question: 'Cuanto tarda el proceso de adopcion?',
        answer:
          'Varia segun el tipo: adopcion de hijastros (3-6 meses), adopcion de crianza temporal (6-18 meses), adopcion domestica de recien nacido (1-3 anos), adopcion internacional (1-4 anos). Los tiempos dependen del estado y la agencia.',
      },
      {
        question: 'Puede el padre o la madre biologicos revocar su consentimiento?',
        answer:
          'Depende del estado. La mayoria de los estados dan a los padres biologicos un periodo limitado para revocar su consentimiento (desde 48 horas hasta 30 dias despues de firmarlo). Despues de ese periodo, la revocacion generalmente requiere demostrar fraude o coercion.',
      },
      {
        question: 'Puedo adoptar si soy soltero/a?',
        answer:
          'Si. Todos los estados permiten la adopcion por personas solteras. Sin embargo, algunas agencias privadas y ciertos paises en adopciones internacionales pueden tener requisitos adicionales. Un abogado puede orientarle sobre sus opciones.',
      },
      {
        question: 'Cuanto cuesta una adopcion?',
        answer:
          'Los costos varian enormemente: adopcion de crianza temporal (generalmente gratuita o subsidios disponibles), adopcion de hijastros ($1,500-$5,000), adopcion domestica privada ($20,000-$50,000), adopcion internacional ($25,000-$60,000).',
      },
    ],
    costDescription:
      'Los honorarios legales para adopciones oscilan entre $1,500 (hijastros) y $5,000-$15,000 (adopciones privadas). La adopcion a traves del sistema de crianza temporal a menudo es gratuita o tiene subsidios. Los costos totales de adopcion privada incluyen tarifas de agencia, estudios del hogar y gastos medicos.',
    processSteps: [
      'Consulta con un abogado de adopcion para evaluar sus opciones.',
      'Estudio del hogar (home study) por una agencia autorizada.',
      'Seleccion del tipo de adopcion y presentacion de la solicitud.',
      'Emparejamiento con un menor (o identificacion del menor a adoptar).',
      'Obtencion del consentimiento de los padres biologicos.',
      'Presentacion de la peticion de adopcion ante el tribunal.',
      'Periodo de supervision posterior a la colocacion.',
      'Audiencia final y decreto de adopcion.',
    ],
  },

  'asilo': {
    esSlug: 'asilo',
    esName: 'Asilo',
    enSlug: 'asylum',
    description:
      'El asilo es una forma de proteccion que permite a personas que han sufrido persecucion o temen persecucion en su pais de origen permanecer legalmente en Estados Unidos. Puede solicitar asilo si ha sido perseguido o teme persecucion por motivos de raza, religion, nacionalidad, opinion politica o pertenencia a un grupo social determinado.',
    faqs: [
      {
        question: 'Cuanto tiempo tengo para solicitar asilo?',
        answer:
          'Generalmente debe solicitar asilo dentro de un ano de su llegada a Estados Unidos. Sin embargo, existen excepciones por circunstancias extraordinarias o cambio de condiciones en su pais. Un abogado puede evaluar si califica para una excepcion.',
      },
      {
        question: 'Puedo trabajar mientras espero la decision sobre mi asilo?',
        answer:
          'Puede solicitar un permiso de trabajo (EAD) 150 dias despues de presentar su solicitud completa de asilo. Si su solicitud fue presentada antes de cierta fecha, puede haber plazos diferentes. Su abogado le orientara.',
      },
      {
        question: 'Que evidencia necesito para mi caso de asilo?',
        answer:
          'Necesita su declaracion jurada detallada, informes de pais sobre condiciones de derechos humanos, documentos que demuestren la persecucion (denuncias, fotos, informes medicos), cartas de testigos y reportes de expertos si es posible.',
      },
      {
        question: 'Puedo incluir a mi familia en mi solicitud de asilo?',
        answer:
          'Si su conyuge e hijos solteros menores de 21 anos estan en EE.UU., pueden ser incluidos como derivados en su solicitud. Si estan fuera del pais, puede solicitar su reunion una vez que obtenga asilo.',
      },
      {
        question: 'Que pasa si mi solicitud de asilo es negada?',
        answer:
          'Si el oficial de asilo refiere su caso al juez de inmigracion, tiene una nueva oportunidad de presentar su caso ante el juez. Si el juez niega el asilo, puede apelar ante la Junta de Apelaciones de Inmigracion (BIA).',
      },
    ],
    costDescription:
      'No hay tarifa gubernamental para solicitar asilo. Los honorarios de abogados oscilan entre $3,000 y $10,000. Muchas organizaciones sin fines de lucro ofrecen representacion gratuita o a bajo costo para solicitantes de asilo.',
    processSteps: [
      'Consulta con un abogado de inmigracion especializado en asilo.',
      'Preparacion de la declaracion jurada detallada de persecucion.',
      'Recopilacion de evidencia: documentos, informes de pais, cartas de apoyo.',
      'Presentacion del formulario I-589 ante USCIS.',
      'Entrevista de asilo con un oficial de asilo.',
      'Decision del oficial: aprobacion, referencia al tribunal o negacion.',
      'Si es referido: audiencia ante el juez de inmigracion.',
      'Si se aprueba: estatus de asilado, permiso de trabajo y residencia futura.',
    ],
  },

  'defensa-contra-deportacion': {
    esSlug: 'defensa-contra-deportacion',
    esName: 'Defensa contra Deportacion',
    enSlug: 'deportation-defense',
    description:
      'Si usted o un familiar enfrenta procedimientos de deportacion (remocion), un abogado de inmigracion puede analizar todas las defensas disponibles, representarle ante el juez de inmigracion y luchar para que permanezca en Estados Unidos. Existen multiples formas de alivio que un abogado experimentado conoce.',
    faqs: [
      {
        question: 'Que opciones tengo si estoy en proceso de deportacion?',
        answer:
          'Las opciones incluyen cancelacion de remocion, asilo, ajuste de estatus, proteccion bajo la Convencion contra la Tortura, salida voluntaria, aplazamiento de accion y otros alivios. Su elegibilidad depende de su historial y circunstancias.',
      },
      {
        question: 'Puedo detener mi deportacion?',
        answer:
          'Si, en muchos casos es posible. Un abogado puede solicitar una suspension de la orden de deportacion, presentar una apelacion o una mocion de reapertura, o identificar alivios que le permitan permanecer legalmente en el pais.',
      },
      {
        question: 'Que es la cancelacion de remocion?',
        answer:
          'Es un alivio que permite a ciertos residentes permanentes y personas sin estatus legal permanecer en EE.UU. Los residentes necesitan 7 anos de residencia continua. Los no residentes necesitan 10 anos de presencia fisica y demostrar que la deportacion causaria dificultades excepcionales a familiares ciudadanos o residentes.',
      },
      {
        question: 'Tengo derecho a un abogado en mi caso de deportacion?',
        answer:
          'Tiene derecho a un abogado, pero el gobierno no esta obligado a proporcionarle uno gratuito como en casos penales. Sin embargo, existen organizaciones de asistencia legal que ofrecen representacion gratuita en casos de inmigracion.',
      },
      {
        question: 'Que pasa si pierdo mi caso ante el juez de inmigracion?',
        answer:
          'Puede apelar la decision ante la Junta de Apelaciones de Inmigracion (BIA) dentro de 30 dias. Si pierde en la BIA, puede apelar ante el tribunal federal de circuito. Cada apelacion puede detener temporalmente la deportacion.',
      },
    ],
    costDescription:
      'Los honorarios para defensa contra deportacion oscilan entre $5,000 y $15,000, dependiendo de la complejidad. Casos con apelaciones pueden costar mas. Muchas organizaciones ofrecen representacion pro bono o a escala reducida.',
    processSteps: [
      'Consulta urgente con un abogado de inmigracion.',
      'Revision del historial migratorio y antecedentes penales.',
      'Identificacion de todas las formas de alivio disponibles.',
      'Preparacion de la solicitud de alivio y evidencia de apoyo.',
      'Audiencia maestra ante el juez de inmigracion.',
      'Audiencia individual donde se presenta el caso completo.',
      'Decision del juez de inmigracion.',
      'Apelacion ante la BIA si la decision es desfavorable.',
    ],
  },

  'solicitud-de-visa': {
    esSlug: 'solicitud-de-visa',
    esName: 'Solicitud de Visa',
    enSlug: 'visa-applications',
    description:
      'El sistema de visas estadounidense ofrece multiples categorias para trabajo, familia, estudio, inversion y propositos especiales. Un abogado de inmigracion lo asesora sobre la visa mas adecuada para su situacion, prepara la documentacion necesaria y lo representa ante USCIS o el consulado.',
    faqs: [
      {
        question: 'Cuales son los tipos principales de visa de trabajo?',
        answer:
          'Las principales son: H-1B (profesionales especializados), L-1 (transferencias intra-empresa), O-1 (personas con habilidades extraordinarias), E-2 (inversionistas de tratado), TN (profesionales NAFTA) y H-2B (trabajadores temporales no agricolas).',
      },
      {
        question: 'Cuanto tiempo toma obtener una visa de trabajo H-1B?',
        answer:
          'El proceso regular puede tardar de 3 a 6 meses. Hay un proceso premium de 15 dias por una tarifa adicional de $2,805. Sin embargo, la H-1B esta sujeta a un sorteo anual con limite de 85,000 visas, lo que hace el proceso impredecible.',
      },
      {
        question: 'Mi empleador puede cambiar los terminos de mi visa despues de llegar?',
        answer:
          'Cualquier cambio sustancial en las condiciones de empleo (salario, ubicacion, funciones) requiere una enmienda o nueva peticion ante USCIS. Su empleador debe cumplir con los terminos de la visa aprobada.',
      },
      {
        question: 'Puedo cambiar de empleador con una visa de trabajo?',
        answer:
          'Si, mediante la portabilidad de la visa H-1B (puede comenzar a trabajar tan pronto como su nuevo empleador presente la peticion). Otras visas pueden tener diferentes reglas. Consulte con su abogado antes de cambiar.',
      },
      {
        question: 'Que pasa si mi visa esta por vencer?',
        answer:
          'Puede solicitar una extension antes de que venza (generalmente hasta 6 meses antes). Si ya vencio pero no ha salido de EE.UU., puede haber opciones. Es crucial actuar a tiempo para mantener su estatus legal.',
      },
    ],
    costDescription:
      'Los honorarios varian por tipo de visa: H-1B ($2,000-$5,000 mas tarifas de USCIS de $1,710-$4,000), L-1 ($3,000-$7,000), O-1 ($5,000-$10,000), E-2 ($3,000-$8,000). Los costos incluyen tarifas gubernamentales y honorarios legales.',
    processSteps: [
      'Consulta para determinar la categoria de visa apropiada.',
      'Recopilacion de documentos y evidencia necesaria.',
      'Preparacion y presentacion de la peticion ante USCIS.',
      'Respuesta a solicitudes de evidencia adicional (RFE) si las hay.',
      'Aprobacion de la peticion por USCIS.',
      'Procesamiento consular o cambio de estatus dentro de EE.UU.',
      'Entrevista en el consulado, si aplica.',
      'Emision de la visa y entrada a Estados Unidos.',
    ],
  },

  'derecho-inmobiliario': {
    esSlug: 'derecho-inmobiliario',
    esName: 'Derecho Inmobiliario',
    enSlug: 'real-estate-law',
    description:
      'Las transacciones inmobiliarias son de las decisiones financieras mas importantes de su vida. Un abogado de derecho inmobiliario revisa contratos de compraventa, resuelve problemas de titulo, asesora en disputas con propietarios o inquilinos, y se asegura de que sus intereses esten protegidos en cada etapa de la transaccion.',
    faqs: [
      {
        question: 'Necesito un abogado para comprar una casa?',
        answer:
          'Aunque no es obligatorio en todos los estados, es altamente recomendable. Un abogado revisa el contrato, verifica el titulo de propiedad, identifica problemas legales potenciales y lo representa en el cierre. En algunos estados, como Nueva York, es obligatorio.',
      },
      {
        question: 'Que es un defecto de titulo y por que es importante?',
        answer:
          'Un defecto de titulo es cualquier problema legal que pone en duda la propiedad de un inmueble: gravamenes pendientes, herederos desconocidos, errores en escrituras, invasiones de terreno. Estos problemas pueden impedir la venta o causar perdida de la propiedad.',
      },
      {
        question: 'Que derechos tengo como inquilino si mi propietario no hace reparaciones?',
        answer:
          'Cada estado tiene leyes de habitabilidad que obligan al propietario a mantener la vivienda en condiciones seguras. Puede notificar por escrito, solicitar reparaciones, retener el alquiler en algunos estados o terminar el contrato si las condiciones son peligrosas.',
      },
      {
        question: 'Pueden desalojarme sin previo aviso?',
        answer:
          'No. Su propietario debe seguir un proceso legal de desalojo que incluye notificacion escrita, plazo para corregir (si es por incumplimiento), presentacion de demanda ante el tribunal y una audiencia judicial. Nunca puede ser desalojado a la fuerza sin una orden judicial.',
      },
      {
        question: 'Que pasa si mi propiedad tiene un lien (gravamen)?',
        answer:
          'Un gravamen da a un acreedor derecho sobre su propiedad. Debe resolverse antes de vender. Su abogado puede negociar el pago, disputar gravamenes invalidos o gestionar su eliminacion del titulo.',
      },
    ],
    costDescription:
      'Los honorarios para cierre de compraventa oscilan entre $1,000 y $3,000. Disputas inmobiliarias pueden costar entre $5,000 y $25,000. Casos de desalojo: $1,000-$5,000 para propietarios. Muchos abogados ofrecen tarifas fijas para transacciones estandar.',
    processSteps: [
      'Consulta para evaluar su situacion inmobiliaria.',
      'Revision y negociacion del contrato de compraventa o arrendamiento.',
      'Busqueda y verificacion del titulo de propiedad.',
      'Revision de inspecciones, avaluos y condiciones del prestamo.',
      'Resolucion de cualquier problema de titulo o contingencia.',
      'Preparacion de documentos de cierre.',
      'Cierre de la transaccion y transferencia de titulo.',
      'Registro de la escritura en la oficina del condado.',
    ],
  },

  'planificacion-patrimonial': {
    esSlug: 'planificacion-patrimonial',
    esName: 'Planificacion Patrimonial',
    enSlug: 'estate-planning',
    description:
      'La planificacion patrimonial protege a su familia y asegura que sus bienes se distribuyan segun sus deseos cuando usted fallezca o quede incapacitado. Un abogado especializado prepara testamentos, fideicomisos, poderes notariales y directivas medicas adaptados a su situacion familiar y financiera.',
    faqs: [
      {
        question: 'Necesito un fideicomiso o basta con un testamento?',
        answer:
          'Un testamento es suficiente para patrimonios modestos, pero un fideicomiso en vida (living trust) evita el proceso de sucesion judicial (probate), ofrece privacidad, permite el manejo de bienes si queda incapacitado y puede reducir impuestos sucesorios para patrimonios grandes.',
      },
      {
        question: 'Que pasa si muero sin testamento?',
        answer:
          'Sus bienes se distribuyen segun las leyes de sucesion intestada de su estado, que pueden no coincidir con sus deseos. Generalmente, sus bienes van al conyuge e hijos, pero las proporciones varian por estado. El proceso judicial es mas largo y costoso.',
      },
      {
        question: 'Que es un poder notarial duradero y por que lo necesito?',
        answer:
          'Es un documento que designa a alguien para tomar decisiones financieras en su nombre si usted queda incapacitado. Sin el, su familia tendria que solicitar una tutela judicial, un proceso costoso y tardado.',
      },
      {
        question: 'Cada cuanto debo actualizar mi plan patrimonial?',
        answer:
          'Debe revisarlo cada tres a cinco anos y despues de eventos importantes: matrimonio, divorcio, nacimiento de un hijo, muerte de un beneficiario, cambio significativo en patrimonio, mudanza a otro estado o cambios en las leyes fiscales.',
      },
      {
        question: 'La planificacion patrimonial solo es para personas ricas?',
        answer:
          'No. Cualquier persona con hijos menores, una vivienda, cuentas bancarias o deseos especificos sobre su atencion medica necesita un plan patrimonial basico (testamento, poder notarial, directiva medica). No se trata solo de dinero, sino de proteger a su familia.',
      },
    ],
    costDescription:
      'Un plan patrimonial basico (testamento, poder notarial, directiva medica) cuesta entre $500 y $2,000. Un fideicomiso en vida cuesta entre $2,000 y $5,000. Planes complejos con fideicomisos especiales pueden costar $5,000-$15,000.',
    processSteps: [
      'Consulta para evaluar sus necesidades y patrimonio.',
      'Inventario de bienes, deudas y beneficiarios.',
      'Diseno de la estrategia patrimonial adecuada.',
      'Redaccion de testamento, fideicomiso y documentos complementarios.',
      'Firma y ejecucion de los documentos con testigos y notario.',
      'Transferencia de bienes al fideicomiso (funding), si aplica.',
      'Designacion de beneficiarios en cuentas de retiro y seguros.',
      'Revision y actualizacion periodica del plan.',
    ],
  },
}

// ---------------------------------------------------------------------------
// Helper: get content for a practice area by slug (returns null if not found)
// ---------------------------------------------------------------------------
export function getSpanishPAContent(esSlug: string): SpanishPAContent | null {
  return SPANISH_PA_CONTENT[esSlug] || null
}

// ---------------------------------------------------------------------------
// Legal terminology glossary (Spanish ↔ English)
// ---------------------------------------------------------------------------
export interface GlossaryTerm {
  es: string
  en: string
  definition: string
}

export const SPANISH_LEGAL_GLOSSARY: GlossaryTerm[] = [
  { es: 'Abogado', en: 'Attorney / Lawyer', definition: 'Profesional del derecho autorizado para ejercer ante los tribunales y representar a clientes en asuntos legales.' },
  { es: 'Demanda', en: 'Lawsuit', definition: 'Accion legal presentada ante un tribunal por una persona o entidad contra otra para hacer valer un derecho o buscar compensacion.' },
  { es: 'Demandante', en: 'Plaintiff', definition: 'La parte que inicia una demanda civil ante un tribunal.' },
  { es: 'Demandado', en: 'Defendant', definition: 'La parte contra la cual se presenta una demanda o se formulan cargos penales.' },
  { es: 'Fianza', en: 'Bail / Bond', definition: 'Garantia financiera depositada para asegurar la comparecencia del acusado ante el tribunal.' },
  { es: 'Sentencia', en: 'Sentence / Judgment', definition: 'Decision final del tribunal que resuelve un caso penal (sentencia) o civil (fallo).' },
  { es: 'Juicio', en: 'Trial', definition: 'Procedimiento judicial formal donde se presenta evidencia y testimonios ante un juez o jurado para resolver una disputa.' },
  { es: 'Testigo', en: 'Witness', definition: 'Persona que declara bajo juramento sobre hechos relevantes a un caso legal.' },
  { es: 'Pruebas', en: 'Evidence', definition: 'Documentos, testimonios, objetos o informacion presentada ante el tribunal para demostrar hechos.' },
  { es: 'Honorarios de contingencia', en: 'Contingency Fee', definition: 'Acuerdo de pago donde el abogado solo cobra si gana el caso, tipicamente un porcentaje de la compensacion obtenida.' },
  { es: 'Anticipo', en: 'Retainer', definition: 'Pago adelantado al abogado que se aplica contra los honorarios futuros por hora.' },
  { es: 'Prescripcion', en: 'Statute of Limitations', definition: 'Plazo maximo establecido por ley para presentar una demanda o iniciar cargos penales.' },
  { es: 'Descubrimiento', en: 'Discovery', definition: 'Fase del proceso legal donde ambas partes intercambian informacion y pruebas relevantes al caso.' },
  { es: 'Deposicion', en: 'Deposition', definition: 'Testimonio bajo juramento tomado fuera del tribunal, registrado por un reportero de la corte.' },
  { es: 'Mediacion', en: 'Mediation', definition: 'Proceso de resolucion alternativa de disputas donde un tercero neutral ayuda a las partes a llegar a un acuerdo.' },
  { es: 'Mocion', en: 'Motion', definition: 'Solicitud formal presentada ante el juez para que tome una decision sobre un asunto especifico del caso.' },
  { es: 'Apelacion', en: 'Appeal', definition: 'Recurso ante un tribunal superior para revisar y posiblemente revertir la decision de un tribunal inferior.' },
  { es: 'Acuerdo', en: 'Settlement', definition: 'Resolucion negociada entre las partes de una disputa sin llegar a juicio.' },
  { es: 'Orden de proteccion', en: 'Restraining Order', definition: 'Orden judicial que prohibe a una persona acercarse, contactar o acosar a otra persona.' },
  { es: 'Poder notarial', en: 'Power of Attorney', definition: 'Documento legal que autoriza a una persona a actuar en nombre de otra en asuntos legales o financieros.' },
  { es: 'Sucesion', en: 'Probate', definition: 'Proceso judicial de validar un testamento y administrar la distribucion de los bienes de una persona fallecida.' },
  { es: 'Fideicomiso', en: 'Trust', definition: 'Acuerdo legal donde un fiduciario administra bienes en beneficio de terceros (beneficiarios).' },
  { es: 'Negligencia', en: 'Negligence', definition: 'Falta de cuidado razonable que causa dano a otra persona, base de muchas demandas civiles.' },
  { es: 'Danos punitivos', en: 'Punitive Damages', definition: 'Compensacion adicional impuesta para castigar al demandado por conducta particularmente grave o maliciosa.' },
  { es: 'Colegio de abogados', en: 'Bar Association', definition: 'Organizacion profesional que regula la practica legal, otorga licencias y establece normas eticas para los abogados.' },
  { es: 'Desacato', en: 'Contempt of Court', definition: 'Desobediencia o falta de respeto a la autoridad del tribunal, que puede resultar en multas o encarcelamiento.' },
  { es: 'Felonia', en: 'Felony', definition: 'Delito grave castigado con mas de un ano de prision, como homicidio, robo a mano armada o trafico de drogas.' },
  { es: 'Delito menor', en: 'Misdemeanor', definition: 'Infraccion penal menos grave, castigada con menos de un ano de carcel, como hurto menor o conducta desordenada.' },
  { es: 'Declaracion de culpabilidad', en: 'Plea Agreement / Plea Deal', definition: 'Acuerdo entre el acusado y la fiscalia donde el acusado se declara culpable a cambio de cargos o sentencia reducidos.' },
  { es: 'Jurado', en: 'Jury', definition: 'Grupo de ciudadanos seleccionados para escuchar la evidencia y emitir un veredicto en un juicio.' },
]
