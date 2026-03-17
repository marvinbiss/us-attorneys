// Script to generate attorney-content.ts with all 200 practice areas
// Run: node scripts/gen-attorney-content.cjs > src/lib/data/attorney-content.ts

const areas = [
  // ===== PERSONAL INJURY (25) =====
  { slug:'personal-injury', name:'Personal Injury', spanishName:'Lesiones Personales', cat:'pi',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$2,500-$10,000'},
    related:['car-accidents','truck-accidents','medical-malpractice','wrongful-death','premises-liability','workers-compensation'] },
  { slug:'car-accidents', name:'Car Accidents', spanishName:'Accidentes de Auto', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$5,000'},
    related:['personal-injury','truck-accidents','motorcycle-accidents','pedestrian-accidents','uber-lyft-accidents','uninsured-motorist'] },
  { slug:'truck-accidents', name:'Truck Accidents', spanishName:'Accidentes de Camión', cat:'pi',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','car-accidents','wrongful-death','catastrophic-injury','brain-injury','spinal-cord-injury'] },
  { slug:'motorcycle-accidents', name:'Motorcycle Accidents', spanishName:'Accidentes de Motocicleta', cat:'pi',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$2,500-$7,500'},
    related:['personal-injury','car-accidents','brain-injury','spinal-cord-injury','wrongful-death','catastrophic-injury'] },
  { slug:'slip-and-fall', name:'Slip & Fall', spanishName:'Resbalones y Caídas', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$5,000'},
    related:['personal-injury','premises-liability','nursing-home-abuse','brain-injury','spinal-cord-injury','workers-compensation'] },
  { slug:'medical-malpractice', name:'Medical Malpractice', spanishName:'Negligencia Médica', cat:'pi',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','wrongful-death','birth-injury','nursing-malpractice','dental-malpractice','medical-device-injury'] },
  { slug:'wrongful-death', name:'Wrongful Death', spanishName:'Muerte Injusta', cat:'pi',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','medical-malpractice','car-accidents','truck-accidents','workplace-injury','product-liability'] },
  { slug:'product-liability', name:'Product Liability', spanishName:'Responsabilidad por Productos', cat:'pi',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','medical-device-injury','class-action','wrongful-death','consumer-protection','mesothelioma'] },
  { slug:'workers-compensation', name:'Workers Compensation', spanishName:'Compensación Laboral', cat:'pi',
    price:{min:200,max:400,contingencyFee:'15-25% of award',retainerRange:'$1,500-$5,000'},
    related:['personal-injury','workplace-injury','construction-accidents','brain-injury','spinal-cord-injury','wrongful-termination'] },
  { slug:'nursing-home-abuse', name:'Nursing Home Abuse', spanishName:'Abuso en Hogares de Ancianos', cat:'pi',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$2,500-$10,000'},
    related:['personal-injury','elder-law','wrongful-death','medical-malpractice','nursing-malpractice','premises-liability'] },
  { slug:'bicycle-accidents', name:'Bicycle Accidents', spanishName:'Accidentes de Bicicleta', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$5,000'},
    related:['personal-injury','car-accidents','pedestrian-accidents','brain-injury','spinal-cord-injury','wrongful-death'] },
  { slug:'pedestrian-accidents', name:'Pedestrian Accidents', spanishName:'Accidentes de Peatones', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$5,000'},
    related:['personal-injury','car-accidents','bicycle-accidents','brain-injury','wrongful-death','uber-lyft-accidents'] },
  { slug:'brain-injury', name:'Brain Injury', spanishName:'Lesión Cerebral', cat:'pi',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','car-accidents','truck-accidents','slip-and-fall','medical-malpractice','catastrophic-injury'] },
  { slug:'spinal-cord-injury', name:'Spinal Cord Injury', spanishName:'Lesión de Médula Espinal', cat:'pi',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','car-accidents','truck-accidents','construction-accidents','medical-malpractice','catastrophic-injury'] },
  { slug:'burn-injury', name:'Burn Injury', spanishName:'Lesiones por Quemaduras', cat:'pi',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$10,000'},
    related:['personal-injury','product-liability','workplace-injury','construction-accidents','premises-liability','wrongful-death'] },
  { slug:'dog-bite', name:'Dog Bite', spanishName:'Mordedura de Perro', cat:'pi',
    price:{min:200,max:400,contingencyFee:'33-40% of settlement',retainerRange:'$1,500-$5,000'},
    related:['personal-injury','premises-liability','insurance-law','animal-law','slip-and-fall','brain-injury'] },
  { slug:'uber-lyft-accidents', name:'Uber & Lyft Accidents', spanishName:'Accidentes de Uber y Lyft', cat:'pi',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$7,500'},
    related:['personal-injury','car-accidents','pedestrian-accidents','rideshare-law','uninsured-motorist','bicycle-accidents'] },
  { slug:'boat-accidents', name:'Boat Accidents', spanishName:'Accidentes de Embarcaciones', cat:'pi',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$3,000-$10,000'},
    related:['personal-injury','maritime-law','wrongful-death','brain-injury','premises-liability','product-liability'] },
  { slug:'aviation-accidents', name:'Aviation Accidents', spanishName:'Accidentes de Aviación', cat:'pi',
    price:{min:300,max:700,contingencyFee:'25-40% of settlement',retainerRange:'$10,000-$25,000'},
    related:['personal-injury','wrongful-death','product-liability','aviation-law','catastrophic-injury','class-action'] },
  { slug:'construction-accidents', name:'Construction Accidents', spanishName:'Accidentes de Construcción', cat:'pi',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$3,000-$10,000'},
    related:['personal-injury','workers-compensation','workplace-injury','wrongful-death','construction-law','premises-liability'] },
  { slug:'premises-liability', name:'Premises Liability', spanishName:'Responsabilidad de Instalaciones', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$7,500'},
    related:['personal-injury','slip-and-fall','nursing-home-abuse','swimming-pool-accidents','dog-bite','construction-accidents'] },
  { slug:'catastrophic-injury', name:'Catastrophic Injury', spanishName:'Lesiones Catastróficas', cat:'pi',
    price:{min:250,max:650,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$20,000'},
    related:['personal-injury','brain-injury','spinal-cord-injury','truck-accidents','wrongful-death','medical-malpractice'] },
  { slug:'toxic-exposure', name:'Toxic Exposure', spanishName:'Exposición Tóxica', cat:'pi',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','mesothelioma','class-action','environmental-law','workers-compensation','product-liability'] },
  { slug:'railroad-injury', name:'Railroad Injury', spanishName:'Lesiones Ferroviarias', cat:'pi',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['personal-injury','workers-compensation','wrongful-death','catastrophic-injury','workplace-injury','brain-injury'] },
  { slug:'swimming-pool-accidents', name:'Swimming Pool Accidents', spanishName:'Accidentes en Piscinas', cat:'pi',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$7,500'},
    related:['personal-injury','premises-liability','wrongful-death','brain-injury','slip-and-fall','construction-law'] },

  // ===== CRIMINAL DEFENSE (25) =====
  { slug:'criminal-defense', name:'Criminal Defense', spanishName:'Defensa Criminal', cat:'cd',
    price:{min:250,max:750,flatFeeRange:'$2,500-$25,000',retainerRange:'$5,000-$25,000'},
    related:['dui-dwi','drug-crimes','white-collar-crime','federal-crimes','assault-battery','expungement'] },
  { slug:'dui-dwi', name:'DUI / DWI', spanishName:'DUI y DWI', cat:'cd',
    price:{min:200,max:500,flatFeeRange:'$2,500-$10,000',retainerRange:'$3,000-$10,000'},
    related:['criminal-defense','traffic-violations','hit-and-run','expungement','probation-violations','drug-crimes'] },
  { slug:'drug-crimes', name:'Drug Crimes', spanishName:'Delitos de Drogas', cat:'cd',
    price:{min:250,max:600,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['criminal-defense','federal-crimes','conspiracy','probation-violations','expungement','cannabis-law'] },
  { slug:'white-collar-crime', name:'White Collar Crime', spanishName:'Delitos de Cuello Blanco', cat:'cd',
    price:{min:350,max:1000,retainerRange:'$10,000-$100,000'},
    related:['criminal-defense','fraud','embezzlement','federal-crimes','tax-fraud-defense','securities-law'] },
  { slug:'federal-crimes', name:'Federal Crimes', spanishName:'Delitos Federales', cat:'cd',
    price:{min:350,max:1000,retainerRange:'$15,000-$100,000'},
    related:['criminal-defense','white-collar-crime','drug-crimes','conspiracy','fraud','gun-charges'] },
  { slug:'juvenile-crimes', name:'Juvenile Crimes', spanishName:'Delitos Juveniles', cat:'cd',
    price:{min:200,max:500,flatFeeRange:'$2,000-$10,000',retainerRange:'$3,000-$10,000'},
    related:['criminal-defense','drug-crimes','theft-robbery','expungement','assault-battery','education-law'] },
  { slug:'sex-crimes', name:'Sex Crimes', spanishName:'Delitos Sexuales', cat:'cd',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','federal-crimes','assault-battery','violent-crimes','expungement','appeals'] },
  { slug:'theft-robbery', name:'Theft & Robbery', spanishName:'Robo y Hurto', cat:'cd',
    price:{min:200,max:500,flatFeeRange:'$2,500-$10,000',retainerRange:'$3,000-$10,000'},
    related:['criminal-defense','fraud','embezzlement','juvenile-crimes','expungement','probation-violations'] },
  { slug:'violent-crimes', name:'Violent Crimes', spanishName:'Crímenes Violentos', cat:'cd',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','assault-battery','manslaughter','domestic-assault','gun-charges','conspiracy'] },
  { slug:'traffic-violations', name:'Traffic Violations', spanishName:'Infracciones de Tránsito', cat:'cd',
    price:{min:150,max:350,flatFeeRange:'$250-$2,500'},
    related:['criminal-defense','dui-dwi','hit-and-run','car-accidents','expungement','probation-violations'] },
  { slug:'assault-battery', name:'Assault & Battery', spanishName:'Agresión y Lesiones', cat:'cd',
    price:{min:250,max:600,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['criminal-defense','violent-crimes','domestic-assault','manslaughter','expungement','restraining-orders'] },
  { slug:'domestic-assault', name:'Domestic Assault', spanishName:'Agresión Doméstica', cat:'cd',
    price:{min:250,max:600,flatFeeRange:'$3,000-$12,000',retainerRange:'$5,000-$15,000'},
    related:['criminal-defense','assault-battery','domestic-violence','restraining-orders','violent-crimes','expungement'] },
  { slug:'gun-charges', name:'Gun Charges', spanishName:'Cargos por Armas', cat:'cd',
    price:{min:250,max:700,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$20,000'},
    related:['criminal-defense','federal-crimes','violent-crimes','assault-battery','conspiracy','drug-crimes'] },
  { slug:'probation-violations', name:'Probation Violations', spanishName:'Violaciones de Probatoria', cat:'cd',
    price:{min:200,max:450,flatFeeRange:'$1,500-$5,000',retainerRange:'$2,000-$7,500'},
    related:['criminal-defense','drug-crimes','dui-dwi','theft-robbery','expungement','traffic-violations'] },
  { slug:'expungement', name:'Expungement', spanishName:'Eliminación de Antecedentes', cat:'cd',
    price:{min:150,max:400,flatFeeRange:'$1,000-$5,000'},
    related:['criminal-defense','dui-dwi','drug-crimes','juvenile-crimes','traffic-violations','probation-violations'] },
  { slug:'embezzlement', name:'Embezzlement', spanishName:'Malversación', cat:'cd',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','white-collar-crime','fraud','theft-robbery','federal-crimes','tax-fraud-defense'] },
  { slug:'fraud', name:'Fraud', spanishName:'Fraude', cat:'cd',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','white-collar-crime','embezzlement','federal-crimes','tax-fraud-defense','conspiracy'] },
  { slug:'manslaughter', name:'Manslaughter', spanishName:'Homicidio Involuntario', cat:'cd',
    price:{min:350,max:1000,retainerRange:'$15,000-$75,000'},
    related:['criminal-defense','violent-crimes','assault-battery','wrongful-death','dui-dwi','appeals'] },
  { slug:'conspiracy', name:'Conspiracy', spanishName:'Conspiración', cat:'cd',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','federal-crimes','drug-crimes','fraud','white-collar-crime','gun-charges'] },
  { slug:'hit-and-run', name:'Hit and Run', spanishName:'Fuga tras Accidente', cat:'cd',
    price:{min:200,max:500,flatFeeRange:'$2,500-$10,000',retainerRange:'$3,000-$10,000'},
    related:['criminal-defense','dui-dwi','car-accidents','traffic-violations','manslaughter','expungement'] },

  // ===== FAMILY LAW (15) =====
  { slug:'divorce', name:'Divorce', spanishName:'Divorcio', cat:'fl',
    price:{min:200,max:500,flatFeeRange:'$1,500-$5,000 (uncontested)',retainerRange:'$3,000-$15,000'},
    related:['child-custody','child-support','alimony-spousal-support','prenuptial-agreements','military-divorce','same-sex-divorce'] },
  { slug:'child-custody', name:'Child Custody', spanishName:'Custodia de Menores', cat:'fl',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['divorce','child-support','relocation-custody','father-rights','mother-rights','modification-orders'] },
  { slug:'child-support', name:'Child Support', spanishName:'Manutención Infantil', cat:'fl',
    price:{min:200,max:450,flatFeeRange:'$1,500-$5,000',retainerRange:'$2,500-$10,000'},
    related:['divorce','child-custody','paternity','modification-orders','father-rights','mother-rights'] },
  { slug:'adoption', name:'Adoption', spanishName:'Adopción', cat:'fl',
    price:{min:200,max:450,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['divorce','child-custody','surrogacy-law','egg-donor-law','grandparents-rights','family-immigration'] },
  { slug:'alimony-spousal-support', name:'Alimony & Spousal Support', spanishName:'Pensión Alimenticia', cat:'fl',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['divorce','child-support','prenuptial-agreements','modification-orders','military-divorce','same-sex-divorce'] },
  { slug:'domestic-violence', name:'Domestic Violence', spanishName:'Violencia Doméstica', cat:'fl',
    price:{min:200,max:450,flatFeeRange:'$1,500-$5,000',retainerRange:'$2,500-$10,000'},
    related:['divorce','restraining-orders','child-custody','criminal-defense','domestic-assault','civil-rights'] },
  { slug:'prenuptial-agreements', name:'Prenuptial Agreements', spanishName:'Acuerdos Prenupciales', cat:'fl',
    price:{min:250,max:600,flatFeeRange:'$2,500-$10,000'},
    related:['divorce','alimony-spousal-support','estate-planning','business-law','contract-law','same-sex-divorce'] },
  { slug:'paternity', name:'Paternity', spanishName:'Paternidad', cat:'fl',
    price:{min:200,max:400,flatFeeRange:'$2,000-$5,000',retainerRange:'$2,500-$7,500'},
    related:['child-custody','child-support','father-rights','divorce','adoption','modification-orders'] },
  { slug:'grandparents-rights', name:'Grandparents Rights', spanishName:'Derechos de Abuelos', cat:'fl',
    price:{min:200,max:450,retainerRange:'$3,000-$10,000'},
    related:['child-custody','adoption','divorce','guardianship','elder-law','modification-orders'] },
  { slug:'military-divorce', name:'Military Divorce', spanishName:'Divorcio Militar', cat:'fl',
    price:{min:250,max:550,retainerRange:'$5,000-$15,000'},
    related:['divorce','child-custody','alimony-spousal-support','military-law','veterans-benefits','modification-orders'] },
  { slug:'same-sex-divorce', name:'Same-Sex Divorce', spanishName:'Divorcio del Mismo Sexo', cat:'fl',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['divorce','child-custody','adoption','prenuptial-agreements','alimony-spousal-support','civil-rights'] },
  { slug:'modification-orders', name:'Modification of Orders', spanishName:'Modificación de Órdenes', cat:'fl',
    price:{min:200,max:400,flatFeeRange:'$1,500-$5,000',retainerRange:'$2,500-$7,500'},
    related:['child-custody','child-support','alimony-spousal-support','divorce','relocation-custody','father-rights'] },
  { slug:'relocation-custody', name:'Relocation & Custody', spanishName:'Reubicación y Custodia', cat:'fl',
    price:{min:250,max:500,retainerRange:'$5,000-$15,000'},
    related:['child-custody','divorce','modification-orders','father-rights','mother-rights','military-divorce'] },
  { slug:'father-rights', name:'Father\'s Rights', spanishName:'Derechos del Padre', cat:'fl',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['child-custody','paternity','child-support','divorce','modification-orders','relocation-custody'] },
  { slug:'mother-rights', name:'Mother\'s Rights', spanishName:'Derechos de la Madre', cat:'fl',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['child-custody','child-support','divorce','domestic-violence','restraining-orders','relocation-custody'] },

  // ===== BUSINESS & CORPORATE (15) =====
  { slug:'business-law', name:'Business Law', spanishName:'Derecho Empresarial', cat:'bc',
    price:{min:250,max:700,flatFeeRange:'$1,500-$10,000',retainerRange:'$5,000-$25,000'},
    related:['corporate-law','contract-law','business-litigation','small-business-law','business-bankruptcy','non-compete-agreements'] },
  { slug:'corporate-law', name:'Corporate Law', spanishName:'Derecho Corporativo', cat:'bc',
    price:{min:300,max:1000,retainerRange:'$10,000-$50,000'},
    related:['business-law','mergers-acquisitions','securities-law','shareholder-disputes','venture-capital','corporate-law'] },
  { slug:'mergers-acquisitions', name:'Mergers & Acquisitions', spanishName:'Fusiones y Adquisiciones', cat:'bc',
    price:{min:400,max:1200,retainerRange:'$25,000-$100,000'},
    related:['corporate-law','business-law','securities-law','contract-law','tax-planning','venture-capital'] },
  { slug:'contract-law', name:'Contract Law', spanishName:'Derecho Contractual', cat:'bc',
    price:{min:250,max:600,flatFeeRange:'$1,000-$7,500',retainerRange:'$3,000-$15,000'},
    related:['business-law','business-litigation','non-compete-agreements','commercial-lease','licensing-agreements','franchise-law'] },
  { slug:'business-litigation', name:'Business Litigation', spanishName:'Litigio Comercial', cat:'bc',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['business-law','contract-law','partnership-disputes','shareholder-disputes','non-compete-agreements','trade-secrets'] },
  { slug:'startup-law', name:'Startup Law', spanishName:'Derecho para Startups', cat:'bc',
    price:{min:250,max:600,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['business-law','venture-capital','intellectual-property','corporate-law','contract-law','software-ip'] },
  { slug:'franchise-law', name:'Franchise Law', spanishName:'Derecho de Franquicias', cat:'bc',
    price:{min:300,max:700,retainerRange:'$5,000-$25,000'},
    related:['business-law','contract-law','business-litigation','small-business-law','trademark','regulatory-compliance'] },
  { slug:'partnership-disputes', name:'Partnership Disputes', spanishName:'Disputas de Sociedad', cat:'bc',
    price:{min:300,max:700,retainerRange:'$10,000-$30,000'},
    related:['business-law','business-litigation','shareholder-disputes','contract-law','mediation-arbitration','corporate-law'] },
  { slug:'shareholder-disputes', name:'Shareholder Disputes', spanishName:'Disputas de Accionistas', cat:'bc',
    price:{min:350,max:900,retainerRange:'$15,000-$50,000'},
    related:['business-law','corporate-law','business-litigation','partnership-disputes','securities-law','mergers-acquisitions'] },
  { slug:'non-compete-agreements', name:'Non-Compete Agreements', spanishName:'Acuerdos de No Competencia', cat:'bc',
    price:{min:250,max:600,flatFeeRange:'$2,000-$7,500',retainerRange:'$5,000-$15,000'},
    related:['business-law','employment-law','contract-law','trade-secrets','non-compete-employment','business-litigation'] },
  { slug:'trade-secrets', name:'Trade Secrets', spanishName:'Secretos Comerciales', cat:'bc',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['intellectual-property','non-compete-agreements','business-litigation','contract-law','ip-litigation','corporate-law'] },
  { slug:'securities-law', name:'Securities Law', spanishName:'Derecho de Valores', cat:'bc',
    price:{min:400,max:1200,retainerRange:'$25,000-$100,000'},
    related:['corporate-law','mergers-acquisitions','white-collar-crime','fraud','venture-capital','regulatory-compliance'] },
  { slug:'venture-capital', name:'Venture Capital', spanishName:'Capital de Riesgo', cat:'bc',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['corporate-law','startup-law','securities-law','mergers-acquisitions','contract-law','intellectual-property'] },
  { slug:'commercial-lease', name:'Commercial Lease', spanishName:'Arrendamiento Comercial', cat:'bc',
    price:{min:250,max:550,flatFeeRange:'$2,000-$7,500',retainerRange:'$3,000-$10,000'},
    related:['real-estate-law','commercial-real-estate','contract-law','business-law','landlord-tenant','small-business-law'] },
  { slug:'small-business-law', name:'Small Business Law', spanishName:'Derecho para Pequeñas Empresas', cat:'bc',
    price:{min:200,max:500,flatFeeRange:'$1,000-$5,000',retainerRange:'$3,000-$10,000'},
    related:['business-law','contract-law','franchise-law','commercial-lease','employment-law','tax-planning'] },

  // ===== INTELLECTUAL PROPERTY (8) =====
  { slug:'intellectual-property', name:'Intellectual Property', spanishName:'Propiedad Intelectual', cat:'ip',
    price:{min:300,max:800,retainerRange:'$5,000-$25,000'},
    related:['trademark','patent','copyright','trade-secrets','ip-litigation','software-ip'] },
  { slug:'trademark', name:'Trademark', spanishName:'Marcas Registradas', cat:'ip',
    price:{min:250,max:700,flatFeeRange:'$1,500-$5,000 per application',retainerRange:'$3,000-$15,000'},
    related:['intellectual-property','copyright','trade-dress','ip-litigation','licensing-agreements','business-law'] },
  { slug:'patent', name:'Patent', spanishName:'Patentes', cat:'ip',
    price:{min:350,max:1000,flatFeeRange:'$8,000-$20,000 per patent',retainerRange:'$10,000-$50,000'},
    related:['intellectual-property','ip-litigation','trade-secrets','licensing-agreements','software-ip','startup-law'] },
  { slug:'copyright', name:'Copyright', spanishName:'Derechos de Autor', cat:'ip',
    price:{min:250,max:600,flatFeeRange:'$500-$3,000 per registration',retainerRange:'$3,000-$15,000'},
    related:['intellectual-property','trademark','entertainment-law','software-ip','ip-litigation','digital-media-law'] },
  { slug:'trade-dress', name:'Trade Dress', spanishName:'Imagen Comercial', cat:'ip',
    price:{min:300,max:750,retainerRange:'$5,000-$25,000'},
    related:['intellectual-property','trademark','ip-litigation','licensing-agreements','consumer-protection','business-litigation'] },
  { slug:'licensing-agreements', name:'Licensing Agreements', spanishName:'Acuerdos de Licencia', cat:'ip',
    price:{min:250,max:650,flatFeeRange:'$2,000-$10,000',retainerRange:'$5,000-$15,000'},
    related:['intellectual-property','trademark','patent','copyright','contract-law','entertainment-law'] },
  { slug:'ip-litigation', name:'IP Litigation', spanishName:'Litigio de Propiedad Intelectual', cat:'ip',
    price:{min:400,max:1200,retainerRange:'$25,000-$100,000'},
    related:['intellectual-property','patent','trademark','copyright','trade-secrets','business-litigation'] },
  { slug:'software-ip', name:'Software IP', spanishName:'Propiedad Intelectual de Software', cat:'ip',
    price:{min:300,max:800,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$25,000'},
    related:['intellectual-property','patent','copyright','licensing-agreements','cyber-law','startup-law'] },

  // ===== REAL ESTATE (10) =====
  { slug:'real-estate-law', name:'Real Estate Law', spanishName:'Derecho Inmobiliario', cat:'re',
    price:{min:200,max:500,flatFeeRange:'$1,000-$5,000',retainerRange:'$3,000-$10,000'},
    related:['landlord-tenant','foreclosure','commercial-real-estate','construction-law','title-disputes','eminent-domain'] },
  { slug:'landlord-tenant', name:'Landlord-Tenant', spanishName:'Propietarios e Inquilinos', cat:'re',
    price:{min:200,max:400,flatFeeRange:'$500-$3,000',retainerRange:'$2,000-$7,500'},
    related:['real-estate-law','commercial-lease','hoa-disputes','consumer-protection','civil-rights','debt-collection-defense'] },
  { slug:'foreclosure', name:'Foreclosure', spanishName:'Ejecución Hipotecaria', cat:'re',
    price:{min:200,max:500,flatFeeRange:'$2,000-$5,000',retainerRange:'$3,000-$10,000'},
    related:['real-estate-law','foreclosure-defense','bankruptcy','debt-relief','consumer-protection','title-disputes'] },
  { slug:'zoning-land-use', name:'Zoning & Land Use', spanishName:'Zonificación y Uso del Suelo', cat:'re',
    price:{min:250,max:600,retainerRange:'$5,000-$20,000'},
    related:['real-estate-law','construction-law','eminent-domain','administrative-law','municipal-law','environmental-law'] },
  { slug:'construction-law', name:'Construction Law', spanishName:'Derecho de Construcción', cat:'re',
    price:{min:250,max:600,retainerRange:'$5,000-$25,000'},
    related:['real-estate-law','construction-accidents','contract-law','business-litigation','zoning-land-use','commercial-real-estate'] },
  { slug:'commercial-real-estate', name:'Commercial Real Estate', spanishName:'Bienes Raíces Comerciales', cat:'re',
    price:{min:300,max:700,retainerRange:'$5,000-$25,000'},
    related:['real-estate-law','commercial-lease','construction-law','zoning-land-use','business-law','title-disputes'] },
  { slug:'title-disputes', name:'Title Disputes', spanishName:'Disputas de Título', cat:'re',
    price:{min:250,max:550,retainerRange:'$5,000-$15,000'},
    related:['real-estate-law','boundary-disputes','foreclosure','eminent-domain','insurance-law','construction-law'] },
  { slug:'boundary-disputes', name:'Boundary Disputes', spanishName:'Disputas de Límites', cat:'re',
    price:{min:200,max:500,retainerRange:'$3,000-$10,000'},
    related:['real-estate-law','title-disputes','zoning-land-use','hoa-disputes','construction-law','eminent-domain'] },
  { slug:'hoa-disputes', name:'HOA Disputes', spanishName:'Disputas de HOA', cat:'re',
    price:{min:200,max:450,flatFeeRange:'$1,000-$5,000',retainerRange:'$2,500-$10,000'},
    related:['real-estate-law','landlord-tenant','boundary-disputes','construction-law','consumer-protection','mediation-arbitration'] },
  { slug:'eminent-domain', name:'Eminent Domain', spanishName:'Dominio Eminente', cat:'re',
    price:{min:300,max:700,retainerRange:'$5,000-$25,000',contingencyFee:'25-33% of excess condemnation award'},
    related:['real-estate-law','administrative-law','zoning-land-use','title-disputes','government-contracts','civil-rights'] },

  // ===== IMMIGRATION (12) =====
  { slug:'immigration-law', name:'Immigration Law', spanishName:'Derecho Migratorio', cat:'im',
    price:{min:200,max:500,flatFeeRange:'$1,500-$10,000',retainerRange:'$3,000-$15,000'},
    related:['green-cards','visa-applications','deportation-defense','asylum','citizenship-naturalization','family-immigration'] },
  { slug:'green-cards', name:'Green Cards', spanishName:'Tarjetas Verdes', cat:'im',
    price:{min:200,max:500,flatFeeRange:'$2,000-$8,000'},
    related:['immigration-law','visa-applications','citizenship-naturalization','family-immigration','work-permits','investor-visas'] },
  { slug:'visa-applications', name:'Visa Applications', spanishName:'Solicitudes de Visa', cat:'im',
    price:{min:200,max:500,flatFeeRange:'$1,500-$7,500'},
    related:['immigration-law','green-cards','work-permits','investor-visas','family-immigration','daca'] },
  { slug:'deportation-defense', name:'Deportation Defense', spanishName:'Defensa contra Deportación', cat:'im',
    price:{min:250,max:600,retainerRange:'$5,000-$15,000'},
    related:['immigration-law','asylum','immigration-detention','immigration-appeals','criminal-defense','daca'] },
  { slug:'asylum', name:'Asylum', spanishName:'Asilo', cat:'im',
    price:{min:250,max:600,flatFeeRange:'$5,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['immigration-law','deportation-defense','immigration-detention','immigration-appeals','civil-rights','human-rights'] },
  { slug:'citizenship-naturalization', name:'Citizenship & Naturalization', spanishName:'Ciudadanía y Naturalización', cat:'im',
    price:{min:200,max:400,flatFeeRange:'$1,500-$5,000'},
    related:['immigration-law','green-cards','family-immigration','daca','immigration-appeals','visa-applications'] },
  { slug:'daca', name:'DACA', spanishName:'DACA', cat:'im',
    price:{min:200,max:400,flatFeeRange:'$1,000-$3,000'},
    related:['immigration-law','deportation-defense','citizenship-naturalization','work-permits','immigration-appeals','civil-rights'] },
  { slug:'work-permits', name:'Work Permits', spanishName:'Permisos de Trabajo', cat:'im',
    price:{min:200,max:450,flatFeeRange:'$1,500-$5,000'},
    related:['immigration-law','visa-applications','green-cards','investor-visas','employment-law','daca'] },
  { slug:'investor-visas', name:'Investor Visas', spanishName:'Visas de Inversionista', cat:'im',
    price:{min:300,max:700,flatFeeRange:'$5,000-$15,000'},
    related:['immigration-law','visa-applications','green-cards','business-law','international-tax','work-permits'] },
  { slug:'family-immigration', name:'Family Immigration', spanishName:'Inmigración Familiar', cat:'im',
    price:{min:200,max:450,flatFeeRange:'$2,000-$7,500'},
    related:['immigration-law','green-cards','citizenship-naturalization','visa-applications','deportation-defense','adoption'] },
  { slug:'immigration-appeals', name:'Immigration Appeals', spanishName:'Apelaciones Migratorias', cat:'im',
    price:{min:300,max:700,flatFeeRange:'$5,000-$15,000',retainerRange:'$5,000-$15,000'},
    related:['immigration-law','deportation-defense','asylum','appeals','citizenship-naturalization','immigration-detention'] },
  { slug:'immigration-detention', name:'Immigration Detention', spanishName:'Detención Migratoria', cat:'im',
    price:{min:250,max:600,retainerRange:'$5,000-$15,000'},
    related:['immigration-law','deportation-defense','asylum','immigration-appeals','civil-rights','criminal-defense'] },

  // ===== ESTATE PLANNING (10) =====
  { slug:'estate-planning', name:'Estate Planning', spanishName:'Planificación Patrimonial', cat:'ep',
    price:{min:250,max:600,flatFeeRange:'$1,500-$5,000',retainerRange:'$3,000-$10,000'},
    related:['wills-trusts','probate','elder-law','guardianship','living-trusts','estate-tax'] },
  { slug:'wills-trusts', name:'Wills & Trusts', spanishName:'Testamentos y Fideicomisos', cat:'ep',
    price:{min:200,max:500,flatFeeRange:'$500-$3,000 (simple will) / $2,000-$7,500 (trust)'},
    related:['estate-planning','probate','living-trusts','trust-administration','power-of-attorney','estate-tax'] },
  { slug:'probate', name:'Probate', spanishName:'Sucesión Testamentaria', cat:'ep',
    price:{min:200,max:500,flatFeeRange:'$3,000-$10,000',retainerRange:'$3,000-$10,000'},
    related:['estate-planning','wills-trusts','estate-litigation','trust-administration','guardianship','elder-law'] },
  { slug:'elder-law', name:'Elder Law', spanishName:'Derecho de Adultos Mayores', cat:'ep',
    price:{min:200,max:500,flatFeeRange:'$2,000-$7,500',retainerRange:'$3,000-$10,000'},
    related:['estate-planning','medicaid-planning','guardianship','nursing-home-abuse','wills-trusts','social-security-disability'] },
  { slug:'guardianship', name:'Guardianship', spanishName:'Tutela Legal', cat:'ep',
    price:{min:200,max:500,flatFeeRange:'$3,000-$7,500',retainerRange:'$3,000-$10,000'},
    related:['estate-planning','elder-law','probate','power-of-attorney','grandparents-rights','medicaid-planning'] },
  { slug:'living-trusts', name:'Living Trusts', spanishName:'Fideicomisos en Vida', cat:'ep',
    price:{min:250,max:550,flatFeeRange:'$2,000-$7,500'},
    related:['estate-planning','wills-trusts','trust-administration','probate','estate-tax','medicaid-planning'] },
  { slug:'power-of-attorney', name:'Power of Attorney', spanishName:'Poder Notarial', cat:'ep',
    price:{min:150,max:400,flatFeeRange:'$200-$1,000'},
    related:['estate-planning','elder-law','guardianship','wills-trusts','medicaid-planning','living-trusts'] },
  { slug:'trust-administration', name:'Trust Administration', spanishName:'Administración de Fideicomisos', cat:'ep',
    price:{min:250,max:600,retainerRange:'$5,000-$15,000'},
    related:['estate-planning','wills-trusts','living-trusts','probate','estate-litigation','estate-tax'] },
  { slug:'estate-litigation', name:'Estate Litigation', spanishName:'Litigio Sucesorio', cat:'ep',
    price:{min:300,max:700,retainerRange:'$10,000-$30,000'},
    related:['estate-planning','probate','wills-trusts','trust-administration','guardianship','elder-law'] },
  { slug:'medicaid-planning', name:'Medicaid Planning', spanishName:'Planificación de Medicaid', cat:'ep',
    price:{min:200,max:500,flatFeeRange:'$2,500-$7,500'},
    related:['elder-law','estate-planning','guardianship','nursing-home-abuse','social-security-disability','veterans-benefits'] },

  // ===== EMPLOYMENT (13) =====
  { slug:'employment-law', name:'Employment Law', spanishName:'Derecho Laboral', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['wrongful-termination','workplace-discrimination','sexual-harassment','wage-hour-claims','non-compete-employment','retaliation'] },
  { slug:'wrongful-termination', name:'Wrongful Termination', spanishName:'Despido Injustificado', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['employment-law','workplace-discrimination','retaliation','whistleblower','sexual-harassment','fmla-violations'] },
  { slug:'workplace-discrimination', name:'Workplace Discrimination', spanishName:'Discriminación Laboral', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['employment-law','wrongful-termination','sexual-harassment','civil-rights','ada-violations','retaliation'] },
  { slug:'sexual-harassment', name:'Sexual Harassment', spanishName:'Acoso Sexual', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['employment-law','workplace-discrimination','wrongful-termination','civil-rights','retaliation','whistleblower'] },
  { slug:'wage-hour-claims', name:'Wage & Hour Claims', spanishName:'Reclamos de Salarios y Horas', cat:'em',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$3,000-$10,000'},
    related:['employment-law','class-action','wrongful-termination','retaliation','employment-contracts','workplace-injury'] },
  { slug:'fmla-violations', name:'FMLA Violations', spanishName:'Violaciones de FMLA', cat:'em',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement',retainerRange:'$3,000-$10,000'},
    related:['employment-law','wrongful-termination','workplace-discrimination','retaliation','ada-violations','employment-contracts'] },
  { slug:'whistleblower', name:'Whistleblower', spanishName:'Denunciante', cat:'em',
    price:{min:250,max:600,contingencyFee:'25-40% of recovery',retainerRange:'$5,000-$15,000'},
    related:['employment-law','wrongful-termination','retaliation','fraud','qui-tam','federal-crimes'] },
  { slug:'non-compete-employment', name:'Non-Compete (Employment)', spanishName:'No Competencia Laboral', cat:'em',
    price:{min:250,max:600,flatFeeRange:'$2,500-$7,500',retainerRange:'$5,000-$15,000'},
    related:['employment-law','non-compete-agreements','trade-secrets','contract-law','wrongful-termination','business-litigation'] },
  { slug:'executive-compensation', name:'Executive Compensation', spanishName:'Compensación Ejecutiva', cat:'em',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['employment-law','employment-contracts','wrongful-termination','securities-law','tax-planning','corporate-law'] },
  { slug:'workplace-injury', name:'Workplace Injury', spanishName:'Lesiones en el Trabajo', cat:'em',
    price:{min:200,max:450,contingencyFee:'15-25% of award',retainerRange:'$2,000-$7,500'},
    related:['workers-compensation','personal-injury','construction-accidents','workplace-discrimination','wrongful-termination','ada-violations'] },
  { slug:'retaliation', name:'Retaliation', spanishName:'Represalias Laborales', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['employment-law','wrongful-termination','whistleblower','workplace-discrimination','sexual-harassment','fmla-violations'] },
  { slug:'unemployment-claims', name:'Unemployment Claims', spanishName:'Reclamos de Desempleo', cat:'em',
    price:{min:150,max:350,flatFeeRange:'$500-$3,000'},
    related:['employment-law','wrongful-termination','wage-hour-claims','administrative-law','retaliation','ada-violations'] },
  { slug:'ada-violations', name:'ADA Violations', spanishName:'Violaciones de ADA', cat:'em',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['employment-law','workplace-discrimination','civil-rights','fmla-violations','disability-rights','wrongful-termination'] },

  // ===== BANKRUPTCY (7) =====
  { slug:'bankruptcy', name:'Bankruptcy', spanishName:'Bancarrota', cat:'bk',
    price:{min:200,max:500,flatFeeRange:'$1,500-$4,000 (Ch 7) / $3,000-$6,000 (Ch 13)',retainerRange:'$2,000-$10,000'},
    related:['chapter-7-bankruptcy','chapter-13-bankruptcy','debt-relief','business-bankruptcy','foreclosure-defense','student-loan-debt'] },
  { slug:'chapter-7-bankruptcy', name:'Chapter 7 Bankruptcy', spanishName:'Capítulo 7', cat:'bk',
    price:{min:200,max:400,flatFeeRange:'$1,500-$4,000'},
    related:['bankruptcy','chapter-13-bankruptcy','debt-relief','foreclosure-defense','debt-collection-defense','consumer-protection'] },
  { slug:'chapter-13-bankruptcy', name:'Chapter 13 Bankruptcy', spanishName:'Capítulo 13', cat:'bk',
    price:{min:250,max:500,flatFeeRange:'$3,000-$6,000'},
    related:['bankruptcy','chapter-7-bankruptcy','debt-relief','foreclosure-defense','debt-collection-defense','consumer-protection'] },
  { slug:'debt-relief', name:'Debt Relief', spanishName:'Alivio de Deudas', cat:'bk',
    price:{min:200,max:400,flatFeeRange:'$1,000-$5,000',retainerRange:'$2,000-$7,500'},
    related:['bankruptcy','chapter-7-bankruptcy','chapter-13-bankruptcy','debt-collection-defense','consumer-protection','foreclosure-defense'] },
  { slug:'business-bankruptcy', name:'Business Bankruptcy', spanishName:'Bancarrota Empresarial', cat:'bk',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['bankruptcy','business-law','corporate-law','chapter-7-bankruptcy','chapter-13-bankruptcy','debt-relief'] },
  { slug:'foreclosure-defense', name:'Foreclosure Defense', spanishName:'Defensa contra Ejecución Hipotecaria', cat:'bk',
    price:{min:200,max:500,flatFeeRange:'$2,000-$5,000',retainerRange:'$3,000-$10,000'},
    related:['bankruptcy','foreclosure','real-estate-law','chapter-13-bankruptcy','debt-relief','consumer-protection'] },
  { slug:'student-loan-debt', name:'Student Loan Debt', spanishName:'Deuda de Préstamos Estudiantiles', cat:'bk',
    price:{min:200,max:400,flatFeeRange:'$1,500-$5,000'},
    related:['bankruptcy','debt-relief','consumer-protection','education-law','debt-collection-defense','administrative-law'] },

  // ===== TAX (7) =====
  { slug:'tax-law', name:'Tax Law', spanishName:'Derecho Fiscal', cat:'tx',
    price:{min:300,max:700,retainerRange:'$5,000-$25,000'},
    related:['irs-disputes','tax-planning','tax-fraud-defense','international-tax','estate-tax','back-taxes'] },
  { slug:'irs-disputes', name:'IRS Disputes', spanishName:'Disputas con el IRS', cat:'tx',
    price:{min:250,max:600,flatFeeRange:'$3,000-$10,000',retainerRange:'$5,000-$15,000'},
    related:['tax-law','back-taxes','tax-fraud-defense','tax-planning','administrative-law','appeals'] },
  { slug:'tax-planning', name:'Tax Planning', spanishName:'Planificación Fiscal', cat:'tx',
    price:{min:300,max:700,flatFeeRange:'$2,500-$10,000',retainerRange:'$5,000-$20,000'},
    related:['tax-law','estate-tax','international-tax','estate-planning','corporate-law','business-law'] },
  { slug:'back-taxes', name:'Back Taxes', spanishName:'Impuestos Atrasados', cat:'tx',
    price:{min:200,max:500,flatFeeRange:'$2,000-$7,500',retainerRange:'$3,000-$10,000'},
    related:['tax-law','irs-disputes','tax-fraud-defense','debt-relief','bankruptcy','wage-hour-claims'] },
  { slug:'tax-fraud-defense', name:'Tax Fraud Defense', spanishName:'Defensa por Fraude Fiscal', cat:'tx',
    price:{min:350,max:1000,retainerRange:'$15,000-$75,000'},
    related:['tax-law','irs-disputes','white-collar-crime','fraud','federal-crimes','criminal-defense'] },
  { slug:'international-tax', name:'International Tax', spanishName:'Impuestos Internacionales', cat:'tx',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['tax-law','tax-planning','corporate-law','international-business-law','investor-visas','regulatory-compliance'] },
  { slug:'estate-tax', name:'Estate Tax', spanishName:'Impuesto sobre Herencias', cat:'tx',
    price:{min:300,max:700,flatFeeRange:'$3,000-$10,000',retainerRange:'$5,000-$20,000'},
    related:['tax-law','estate-planning','wills-trusts','trust-administration','tax-planning','probate'] },

  // ===== SPECIALIZED (25) =====
  { slug:'entertainment-law', name:'Entertainment Law', spanishName:'Derecho del Entretenimiento', cat:'sp',
    price:{min:300,max:800,retainerRange:'$5,000-$25,000'},
    related:['intellectual-property','copyright','contract-law','licensing-agreements','sports-law','trademark'] },
  { slug:'environmental-law', name:'Environmental Law', spanishName:'Derecho Ambiental', cat:'sp',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['toxic-exposure','regulatory-compliance','administrative-law','class-action','real-estate-law','zoning-land-use'] },
  { slug:'health-care-law', name:'Health Care Law', spanishName:'Derecho de Salud', cat:'sp',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['medical-malpractice','regulatory-compliance','medical-license-defense','nursing-license-defense','insurance-law','administrative-law'] },
  { slug:'insurance-law', name:'Insurance Law', spanishName:'Derecho de Seguros', cat:'sp',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['insurance-bad-faith','personal-injury','car-accidents','health-care-law','consumer-protection','class-action'] },
  { slug:'civil-rights', name:'Civil Rights', spanishName:'Derechos Civiles', cat:'sp',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['workplace-discrimination','ada-violations','criminal-defense','immigration-law','class-action','appeals'] },
  { slug:'consumer-protection', name:'Consumer Protection', spanishName:'Protección al Consumidor', cat:'sp',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$3,000-$10,000'},
    related:['class-action','lemon-law','insurance-bad-faith','debt-collection-defense','product-liability','fraud'] },
  { slug:'social-security-disability', name:'Social Security Disability', spanishName:'Discapacidad del Seguro Social', cat:'sp',
    price:{min:200,max:400,contingencyFee:'25% of back benefits (capped at $7,200)'},
    related:['disability-rights','elder-law','veterans-benefits','ada-violations','workers-compensation','medicaid-planning'] },
  { slug:'veterans-benefits', name:'Veterans Benefits', spanishName:'Beneficios para Veteranos', cat:'sp',
    price:{min:200,max:450,flatFeeRange:'$2,000-$7,500',retainerRange:'$3,000-$10,000'},
    related:['military-law','military-defense','social-security-disability','disability-rights','administrative-law','appeals'] },
  { slug:'class-action', name:'Class Action', spanishName:'Demanda Colectiva', cat:'sp',
    price:{min:300,max:800,contingencyFee:'25-33% of settlement'},
    related:['consumer-protection','product-liability','wage-hour-claims','securities-law','environmental-law','civil-rights'] },
  { slug:'appeals', name:'Appeals', spanishName:'Apelaciones', cat:'sp',
    price:{min:300,max:800,flatFeeRange:'$5,000-$25,000',retainerRange:'$10,000-$50,000'},
    related:['criminal-defense','civil-rights','immigration-appeals','class-action','administrative-law','business-litigation'] },
  { slug:'mediation-arbitration', name:'Mediation & Arbitration', spanishName:'Mediación y Arbitraje', cat:'sp',
    price:{min:200,max:500,flatFeeRange:'$2,000-$10,000'},
    related:['business-litigation','divorce','employment-law','contract-law','construction-law','partnership-disputes'] },
  { slug:'military-law', name:'Military Law', spanishName:'Derecho Militar', cat:'sp',
    price:{min:250,max:600,retainerRange:'$5,000-$20,000'},
    related:['military-defense','veterans-benefits','military-divorce','criminal-defense','appeals','administrative-law'] },
  { slug:'maritime-law', name:'Maritime Law', spanishName:'Derecho Marítimo', cat:'sp',
    price:{min:300,max:700,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$25,000'},
    related:['boat-accidents','personal-injury','workers-compensation','wrongful-death','insurance-law','environmental-law'] },
  { slug:'aviation-law', name:'Aviation Law', spanishName:'Derecho Aeronáutico', cat:'sp',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['aviation-accidents','personal-injury','wrongful-death','product-liability','regulatory-compliance','insurance-law'] },
  { slug:'sports-law', name:'Sports Law', spanishName:'Derecho Deportivo', cat:'sp',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['entertainment-law','contract-law','intellectual-property','personal-injury','licensing-agreements','employment-law'] },
  { slug:'cannabis-law', name:'Cannabis Law', spanishName:'Derecho del Cannabis', cat:'sp',
    price:{min:250,max:600,flatFeeRange:'$3,000-$15,000',retainerRange:'$5,000-$20,000'},
    related:['drug-crimes','business-law','regulatory-compliance','licensing-permits','administrative-law','criminal-defense'] },
  { slug:'education-law', name:'Education Law', spanishName:'Derecho Educativo', cat:'sp',
    price:{min:200,max:500,retainerRange:'$3,000-$10,000'},
    related:['ada-violations','civil-rights','administrative-law','juvenile-crimes','disability-rights','student-loan-debt'] },
  { slug:'animal-law', name:'Animal Law', spanishName:'Derecho Animal', cat:'sp',
    price:{min:200,max:450,flatFeeRange:'$1,000-$5,000',retainerRange:'$2,000-$7,500'},
    related:['dog-bite','consumer-protection','environmental-law','criminal-defense','landlord-tenant','civil-rights'] },
  { slug:'election-law', name:'Election Law', spanishName:'Derecho Electoral', cat:'sp',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['administrative-law','civil-rights','government-ethics','municipal-law','regulatory-compliance','appeals'] },
  { slug:'native-american-law', name:'Native American Law', spanishName:'Derecho Indígena', cat:'sp',
    price:{min:250,max:600,retainerRange:'$5,000-$20,000'},
    related:['civil-rights','administrative-law','environmental-law','water-rights','government-contracts','gaming-law'] },
  { slug:'water-rights', name:'Water Rights', spanishName:'Derechos de Agua', cat:'sp',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['environmental-law','real-estate-law','administrative-law','native-american-law','eminent-domain','agricultural-law'] },
  { slug:'agricultural-law', name:'Agricultural Law', spanishName:'Derecho Agrícola', cat:'sp',
    price:{min:200,max:500,retainerRange:'$3,000-$15,000'},
    related:['environmental-law','water-rights','real-estate-law','business-law','regulatory-compliance','contract-law'] },
  { slug:'energy-law', name:'Energy Law', spanishName:'Derecho Energético', cat:'sp',
    price:{min:350,max:900,retainerRange:'$15,000-$75,000'},
    related:['environmental-law','regulatory-compliance','administrative-law','real-estate-law','corporate-law','government-contracts'] },
  { slug:'telecommunications-law', name:'Telecommunications Law', spanishName:'Derecho de Telecomunicaciones', cat:'sp',
    price:{min:350,max:800,retainerRange:'$10,000-$50,000'},
    related:['regulatory-compliance','administrative-law','cyber-law','data-privacy','internet-law','government-contracts'] },

  // ===== GOVERNMENT & ADMINISTRATIVE (8) =====
  { slug:'administrative-law', name:'Administrative Law', spanishName:'Derecho Administrativo', cat:'ga',
    price:{min:250,max:600,retainerRange:'$5,000-$20,000'},
    related:['regulatory-compliance','government-contracts','foia-requests','licensing-permits','municipal-law','appeals'] },
  { slug:'government-contracts', name:'Government Contracts', spanishName:'Contratos Gubernamentales', cat:'ga',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['administrative-law','regulatory-compliance','business-law','contract-law','whistleblower','fraud'] },
  { slug:'regulatory-compliance', name:'Regulatory Compliance', spanishName:'Cumplimiento Regulatorio', cat:'ga',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['administrative-law','government-contracts','environmental-law','health-care-law','cannabis-law','corporate-law'] },
  { slug:'foia-requests', name:'FOIA Requests', spanishName:'Solicitudes FOIA', cat:'ga',
    price:{min:200,max:450,flatFeeRange:'$1,000-$5,000'},
    related:['administrative-law','public-records','civil-rights','government-ethics','municipal-law','data-privacy'] },
  { slug:'licensing-permits', name:'Licensing & Permits', spanishName:'Licencias y Permisos', cat:'ga',
    price:{min:200,max:500,flatFeeRange:'$1,500-$7,500',retainerRange:'$3,000-$10,000'},
    related:['administrative-law','regulatory-compliance','cannabis-law','zoning-land-use','health-care-law','municipal-law'] },
  { slug:'municipal-law', name:'Municipal Law', spanishName:'Derecho Municipal', cat:'ga',
    price:{min:250,max:600,retainerRange:'$5,000-$25,000'},
    related:['administrative-law','zoning-land-use','government-contracts','regulatory-compliance','election-law','eminent-domain'] },
  { slug:'government-ethics', name:'Government Ethics', spanishName:'Ética Gubernamental', cat:'ga',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['administrative-law','election-law','regulatory-compliance','whistleblower','criminal-defense','public-records'] },
  { slug:'public-records', name:'Public Records', spanishName:'Registros Públicos', cat:'ga',
    price:{min:200,max:400,flatFeeRange:'$500-$3,000'},
    related:['foia-requests','administrative-law','government-ethics','civil-rights','data-privacy','municipal-law'] },

  // ===== TECHNOLOGY & CYBER (7) =====
  { slug:'cyber-law', name:'Cyber Law', spanishName:'Derecho Cibernético', cat:'tc',
    price:{min:300,max:750,retainerRange:'$5,000-$25,000'},
    related:['data-privacy','internet-law','e-commerce-law','social-media-law','ai-law','cryptocurrency-law'] },
  { slug:'data-privacy', name:'Data Privacy', spanishName:'Privacidad de Datos', cat:'tc',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['cyber-law','regulatory-compliance','health-care-law','e-commerce-law','class-action','consumer-protection'] },
  { slug:'ai-law', name:'AI Law', spanishName:'Derecho de Inteligencia Artificial', cat:'tc',
    price:{min:350,max:900,retainerRange:'$10,000-$50,000'},
    related:['cyber-law','data-privacy','intellectual-property','software-ip','regulatory-compliance','employment-law'] },
  { slug:'cryptocurrency-law', name:'Cryptocurrency Law', spanishName:'Derecho de Criptomonedas', cat:'tc',
    price:{min:300,max:800,retainerRange:'$10,000-$50,000'},
    related:['cyber-law','securities-law','tax-law','regulatory-compliance','fraud','white-collar-crime'] },
  { slug:'internet-law', name:'Internet Law', spanishName:'Derecho de Internet', cat:'tc',
    price:{min:250,max:600,retainerRange:'$5,000-$20,000'},
    related:['cyber-law','e-commerce-law','data-privacy','copyright','trademark','social-media-law'] },
  { slug:'e-commerce-law', name:'E-Commerce Law', spanishName:'Derecho del Comercio Electrónico', cat:'tc',
    price:{min:250,max:600,flatFeeRange:'$2,000-$10,000',retainerRange:'$5,000-$15,000'},
    related:['internet-law','cyber-law','consumer-protection','data-privacy','contract-law','trademark'] },
  { slug:'social-media-law', name:'Social Media Law', spanishName:'Derecho de Redes Sociales', cat:'tc',
    price:{min:250,max:600,retainerRange:'$3,000-$15,000'},
    related:['internet-law','cyber-law','data-privacy','copyright','employment-law','consumer-protection'] },

  // ===== PERSONAL & FAMILY ADDITIONAL (19) =====
  { slug:'name-change', name:'Name Change', spanishName:'Cambio de Nombre', cat:'pfa',
    price:{min:150,max:350,flatFeeRange:'$500-$2,000'},
    related:['gender-marker-change','divorce','family-immigration','adoption','civil-rights','immigration-law'] },
  { slug:'gender-marker-change', name:'Gender Marker Change', spanishName:'Cambio de Marcador de Género', cat:'pfa',
    price:{min:150,max:400,flatFeeRange:'$500-$2,500'},
    related:['name-change','civil-rights','disability-rights','immigration-law','administrative-law','employment-law'] },
  { slug:'surrogacy-law', name:'Surrogacy Law', spanishName:'Derecho de Subrogación', cat:'pfa',
    price:{min:300,max:700,flatFeeRange:'$5,000-$15,000'},
    related:['adoption','egg-donor-law','family-immigration','contract-law','same-sex-divorce','child-custody'] },
  { slug:'egg-donor-law', name:'Egg Donor Law', spanishName:'Derecho de Donación de Óvulos', cat:'pfa',
    price:{min:300,max:650,flatFeeRange:'$3,000-$10,000'},
    related:['surrogacy-law','adoption','contract-law','health-care-law','same-sex-divorce','family-immigration'] },
  { slug:'restraining-orders', name:'Restraining Orders', spanishName:'Órdenes de Restricción', cat:'pfa',
    price:{min:200,max:400,flatFeeRange:'$1,000-$3,000'},
    related:['domestic-violence','domestic-assault','criminal-defense','divorce','child-custody','stalking-harassment'] },
  { slug:'lemon-law', name:'Lemon Law', spanishName:'Ley del Limón', cat:'pfa',
    price:{min:200,max:450,contingencyFee:'Attorney fees paid by manufacturer in most states'},
    related:['consumer-protection','car-accidents','product-liability','contract-law','class-action','insurance-law'] },
  { slug:'medical-device-injury', name:'Medical Device Injury', spanishName:'Lesiones por Dispositivos Médicos', cat:'pfa',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement'},
    related:['product-liability','medical-malpractice','class-action','personal-injury','wrongful-death','consumer-protection'] },
  { slug:'rideshare-law', name:'Rideshare Law', spanishName:'Derecho de Transporte Compartido', cat:'pfa',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement',retainerRange:'$2,000-$7,500'},
    related:['uber-lyft-accidents','car-accidents','personal-injury','insurance-law','employment-law','consumer-protection'] },
  { slug:'insurance-bad-faith', name:'Insurance Bad Faith', spanishName:'Mala Fe de Seguros', cat:'pfa',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement',retainerRange:'$5,000-$15,000'},
    related:['insurance-law','consumer-protection','personal-injury','car-accidents','class-action','product-liability'] },
  { slug:'uninsured-motorist', name:'Uninsured Motorist', spanishName:'Conductor Sin Seguro', cat:'pfa',
    price:{min:200,max:450,contingencyFee:'33-40% of settlement'},
    related:['car-accidents','personal-injury','insurance-law','insurance-bad-faith','motorcycle-accidents','pedestrian-accidents'] },
  { slug:'military-defense', name:'Military Defense', spanishName:'Defensa Militar', cat:'pfa',
    price:{min:300,max:700,retainerRange:'$10,000-$50,000'},
    related:['military-law','criminal-defense','veterans-benefits','military-divorce','appeals','administrative-law'] },
  { slug:'birth-injury', name:'Birth Injury', spanishName:'Lesiones de Nacimiento', cat:'pfa',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement'},
    related:['medical-malpractice','wrongful-death','personal-injury','catastrophic-injury','brain-injury','nursing-malpractice'] },
  { slug:'mesothelioma', name:'Mesothelioma', spanishName:'Mesotelioma', cat:'pfa',
    price:{min:250,max:600,contingencyFee:'25-40% of settlement'},
    related:['toxic-exposure','personal-injury','wrongful-death','class-action','workers-compensation','product-liability'] },
  { slug:'nursing-malpractice', name:'Nursing Malpractice', spanishName:'Negligencia de Enfermería', cat:'pfa',
    price:{min:250,max:550,contingencyFee:'33-40% of settlement'},
    related:['medical-malpractice','nursing-home-abuse','wrongful-death','nursing-license-defense','health-care-law','personal-injury'] },
  { slug:'dental-malpractice', name:'Dental Malpractice', spanishName:'Negligencia Dental', cat:'pfa',
    price:{min:200,max:500,contingencyFee:'33-40% of settlement'},
    related:['medical-malpractice','personal-injury','consumer-protection','health-care-law','product-liability','insurance-law'] },
  { slug:'church-abuse', name:'Church Abuse', spanishName:'Abuso Eclesiástico', cat:'pfa',
    price:{min:250,max:600,contingencyFee:'33-40% of settlement'},
    related:['personal-injury','sex-crimes','civil-rights','class-action','wrongful-death','child-custody'] },
  { slug:'debt-collection-defense', name:'Debt Collection Defense', spanishName:'Defensa contra Cobro de Deudas', cat:'pfa',
    price:{min:150,max:400,flatFeeRange:'$500-$3,000',contingencyFee:'Statutory fees in FDCPA cases'},
    related:['consumer-protection','bankruptcy','debt-relief','wage-hour-claims','class-action','landlord-tenant'] },
  { slug:'nursing-license-defense', name:'Nursing License Defense', spanishName:'Defensa de Licencia de Enfermería', cat:'pfa',
    price:{min:250,max:550,flatFeeRange:'$3,000-$10,000',retainerRange:'$5,000-$15,000'},
    related:['medical-license-defense','administrative-law','health-care-law','nursing-malpractice','criminal-defense','employment-law'] },
  { slug:'medical-license-defense', name:'Medical License Defense', spanishName:'Defensa de Licencia Médica', cat:'pfa',
    price:{min:300,max:700,retainerRange:'$10,000-$30,000'},
    related:['nursing-license-defense','administrative-law','health-care-law','medical-malpractice','criminal-defense','regulatory-compliance'] },
];

// ===== Content generation templates per category =====

const catConfig = {
  pi: {
    certifications: ['Board Certified in Personal Injury Trial Law (NBTA)', 'Certified Civil Trial Specialist', 'Member of American Association for Justice (AAJ)', 'State Bar Certified Personal Injury Specialist'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: true, proBonoAvailable: false,
  },
  cd: {
    certifications: ['Board Certified in Criminal Law (NBTA)', 'Certified Criminal Trial Specialist', 'Member of National Association of Criminal Defense Lawyers (NACDL)', 'State Bar Criminal Law Specialist'],
    responseTime: 'Within 2 hours',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: true,
  },
  fl: {
    certifications: ['Board Certified in Family Law', 'Certified Family Law Specialist', 'Member of American Academy of Matrimonial Lawyers (AAML)', 'Collaborative Law Certified'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: true,
  },
  bc: {
    certifications: ['Board Certified in Business Litigation', 'Certified Commercial Law Specialist', 'Member of American Bar Association Business Law Section', 'Certified Corporate Governance Professional'],
    responseTime: 'Within 24 hours',
    freeConsultation: false, contingencyAvailable: false, proBonoAvailable: false,
  },
  ip: {
    certifications: ['Patent Attorney (USPTO Registered)', 'Board Certified in Intellectual Property Law', 'Member of American Intellectual Property Law Association (AIPLA)', 'Certified Licensing Professional'],
    responseTime: 'Within 24 hours',
    freeConsultation: false, contingencyAvailable: false, proBonoAvailable: false,
  },
  re: {
    certifications: ['Board Certified in Real Property Law', 'Certified Real Estate Specialist', 'Member of American College of Real Estate Lawyers', 'State Bar Real Property Specialist'],
    responseTime: 'Within 24 hours',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: false,
  },
  im: {
    certifications: ['Board Certified in Immigration and Nationality Law', 'Certified Immigration Specialist', 'Member of American Immigration Lawyers Association (AILA)', 'Accredited Representative (DOJ)'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: true,
  },
  ep: {
    certifications: ['Board Certified in Estate Planning and Probate Law', 'Certified Elder Law Attorney (CELA)', 'Accredited Estate Planner (AEP)', 'Member of National Academy of Elder Law Attorneys (NAELA)'],
    responseTime: 'Within 24 hours',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: false,
  },
  em: {
    certifications: ['Board Certified in Labor and Employment Law', 'Certified Employment Law Specialist', 'Member of National Employment Lawyers Association (NELA)', 'State Bar Employment Law Specialist'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: true, proBonoAvailable: false,
  },
  bk: {
    certifications: ['Board Certified in Consumer Bankruptcy Law', 'Certified Bankruptcy Specialist', 'Member of National Association of Consumer Bankruptcy Attorneys', 'American Board of Certification in Bankruptcy'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: true,
  },
  tx: {
    certifications: ['Board Certified in Tax Law', 'Certified Tax Specialist', 'Member of American Bar Association Tax Section', 'IRS Enrolled Agent or Former IRS Attorney'],
    responseTime: 'Within 24 hours',
    freeConsultation: false, contingencyAvailable: false, proBonoAvailable: false,
  },
  sp: {
    certifications: ['Board Certified in relevant specialty area', 'Certified Specialist in practice focus', 'Member of relevant national bar association', 'State Bar Specialist Certification'],
    responseTime: 'Within 24 hours',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: false,
  },
  ga: {
    certifications: ['Board Certified in Administrative Law', 'Certified Government Contracts Specialist', 'Member of relevant government bar associations', 'Former Government Attorney or Official'],
    responseTime: 'Within 24 hours',
    freeConsultation: false, contingencyAvailable: false, proBonoAvailable: false,
  },
  tc: {
    certifications: ['Certified Information Privacy Professional (CIPP)', 'Board Certified in Technology Law', 'Member of International Association of Privacy Professionals', 'Certified Cybersecurity Law Specialist'],
    responseTime: 'Within 24 hours',
    freeConsultation: false, contingencyAvailable: false, proBonoAvailable: false,
  },
  pfa: {
    certifications: ['Certified specialist in relevant practice area', 'Member of relevant national association', 'State bar specialist certification', 'Board certified in applicable area'],
    responseTime: 'Same day',
    freeConsultation: true, contingencyAvailable: false, proBonoAvailable: true,
  },
};

// Category-specific laws, timelines, win rates
const catLegal = {
  pi: {
    laws: (n) => ['State tort law and negligence statutes', 'Comparative and contributory negligence rules', `Statute of limitations for ${n.toLowerCase()} claims`, 'Joint and several liability doctrines', 'Damages caps where applicable', 'Insurance bad faith statutes'],
    timeline: '3-24 months from incident to resolution; litigation may extend to 2-4 years',
    winRate: 'Plaintiffs prevail in approximately 50-60% of cases that go to trial',
    settlement: (p) => ({ min: p.min * 50, max: p.max * 3000 }),
    barCerts: ['NBTA Board Certified Personal Injury Trial Law', 'State Bar Personal Injury Specialist Certification'],
  },
  cd: {
    laws: (n) => ['U.S. Constitution Fourth, Fifth, and Sixth Amendments', 'State criminal code provisions', `State and federal statutes governing ${n.toLowerCase()}`, 'Federal Sentencing Guidelines', 'State sentencing guidelines', 'Rules of Criminal Procedure'],
    timeline: '1-12 months for misdemeanors; 6-24 months for felonies; complex federal cases may take 1-3 years',
    winRate: 'Approximately 90% of criminal cases are resolved through plea bargains',
    settlement: () => undefined,
    barCerts: ['NBTA Board Certified Criminal Law', 'State Bar Criminal Law Specialist Certification'],
  },
  fl: {
    laws: (n) => ['State family code and domestic relations statutes', `State laws governing ${n.toLowerCase()}`, 'Uniform Child Custody Jurisdiction and Enforcement Act (UCCJEA)', 'Child support guidelines', 'Equitable distribution or community property laws', 'Best interests of the child standard'],
    timeline: '3-18 months; contested cases may take 1-2 years',
    winRate: 'Most family law cases settle; approximately 95% resolve without trial',
    settlement: () => undefined,
    barCerts: ['Board Certified Family Law Specialist', 'AAML Certified Matrimonial Lawyer'],
  },
  bc: {
    laws: (n) => ['State business organization statutes', `Laws governing ${n.toLowerCase()}`, 'Uniform Commercial Code (UCC)', 'Securities Exchange Act', 'State unfair business practices laws', 'Federal and state antitrust laws'],
    timeline: '3-24 months for transactional matters; litigation may take 1-3 years',
    winRate: 'Business disputes settle approximately 70% of the time before trial',
    settlement: (p) => ({ min: p.min * 100, max: p.max * 5000 }),
    barCerts: ['Board Certified Business Litigation Specialist', 'State Bar Business Law Specialist'],
  },
  ip: {
    laws: (n) => ['Lanham Act (trademarks)', 'Patent Act (35 U.S.C.)', 'Copyright Act (17 U.S.C.)', 'Defend Trade Secrets Act (DTSA)', `Laws specific to ${n.toLowerCase()}`, 'Digital Millennium Copyright Act (DMCA)'],
    timeline: '6-24 months for prosecution; 1-3 years for litigation',
    winRate: 'Patent holders prevail in approximately 35-40% of trials; trademark plaintiffs win about 60%',
    settlement: (p) => ({ min: p.min * 100, max: p.max * 5000 }),
    barCerts: ['USPTO Registered Patent Attorney', 'Board Certified IP Law Specialist'],
  },
  re: {
    laws: (n) => ['State real property statutes', `Laws governing ${n.toLowerCase()}`, 'State landlord-tenant codes', 'Recording acts and title insurance regulations', 'State zoning and land use laws', 'Environmental site assessment requirements'],
    timeline: '1-12 months for transactions; 6-24 months for disputes and litigation',
    winRate: 'Real estate disputes settle approximately 75% of the time',
    settlement: (p) => ({ min: p.min * 50, max: p.max * 2000 }),
    barCerts: ['Board Certified Real Property Law Specialist', 'State Bar Real Estate Specialist'],
  },
  im: {
    laws: (n) => ['Immigration and Nationality Act (INA)', `Regulations governing ${n.toLowerCase()}`, 'USCIS Policy Manual', 'Immigration Court Practice Manual', 'State immigration-related laws', 'Executive orders affecting immigration'],
    timeline: '3-24 months for applications; deportation defense can take 1-3 years with appeals',
    winRate: 'Asylum grant rates vary by immigration court from 10% to 80%; overall denial rate approximately 57%',
    settlement: () => undefined,
    barCerts: ['Board Certified Immigration and Nationality Law', 'AILA Member in Good Standing'],
  },
  ep: {
    laws: (n) => ['State probate and trust codes', `Laws governing ${n.toLowerCase()}`, 'Uniform Trust Code', 'Uniform Probate Code', 'Federal estate and gift tax (IRC)', 'State estate and inheritance tax laws'],
    timeline: '1-4 weeks for estate planning documents; probate 6-18 months; litigation 1-3 years',
    winRate: 'Estate disputes settle approximately 80% of the time before trial',
    settlement: (p) => ({ min: p.min * 50, max: p.max * 2000 }),
    barCerts: ['Board Certified Estate Planning and Probate Specialist', 'Certified Elder Law Attorney (CELA)'],
  },
  em: {
    laws: (n) => ['Title VII of the Civil Rights Act of 1964', 'Fair Labor Standards Act (FLSA)', `Laws governing ${n.toLowerCase()}`, 'Americans with Disabilities Act (ADA)', 'Family and Medical Leave Act (FMLA)', 'State employment and labor codes'],
    timeline: '3-18 months with EEOC process; litigation may add 1-3 years',
    winRate: 'Employment discrimination plaintiffs win approximately 15-20% of cases at trial; most settle',
    settlement: (p) => ({ min: p.min * 30, max: p.max * 2000 }),
    barCerts: ['Board Certified Labor and Employment Law', 'State Bar Employment Law Specialist'],
  },
  bk: {
    laws: (n) => ['U.S. Bankruptcy Code (Title 11)', `Provisions governing ${n.toLowerCase()}`, 'Federal Rules of Bankruptcy Procedure', 'Means test requirements', 'Automatic stay provisions', 'State exemption laws'],
    timeline: 'Chapter 7: 3-6 months; Chapter 13: 3-5 years for payment plan; Chapter 11: 6-24 months',
    winRate: 'Approximately 95% of Chapter 7 cases result in discharge; Chapter 13 completion rate approximately 33-40%',
    settlement: () => undefined,
    barCerts: ['Board Certified Consumer Bankruptcy Law', 'American Board of Certification in Bankruptcy'],
  },
  tx: {
    laws: (n) => ['Internal Revenue Code (IRC)', `Provisions governing ${n.toLowerCase()}`, 'Treasury Regulations', 'State tax codes', 'Tax Court Rules of Practice', 'IRS administrative procedures'],
    timeline: '3-18 months for audits and disputes; Tax Court cases may take 1-3 years',
    winRate: 'IRS settles approximately 85% of cases before Tax Court trial',
    settlement: (p) => ({ min: p.min * 20, max: p.max * 2000 }),
    barCerts: ['Board Certified Tax Law Specialist', 'IRS Enrolled Agent'],
  },
  sp: {
    laws: (n) => [`Federal laws governing ${n.toLowerCase()}`, `State laws governing ${n.toLowerCase()}`, 'Applicable regulatory frameworks', 'Constitutional provisions where relevant', 'Administrative procedure acts', 'Industry-specific regulations'],
    timeline: '3-24 months depending on complexity and whether litigation is involved',
    winRate: 'Resolution rates vary significantly by specialty and case type',
    settlement: (p) => ({ min: p.min * 30, max: p.max * 2000 }),
    barCerts: ['Board Certified in relevant specialty', 'State Bar Specialist Certification'],
  },
  ga: {
    laws: (n) => ['Administrative Procedure Act (APA)', `Laws governing ${n.toLowerCase()}`, 'Freedom of Information Act (FOIA)', 'Federal Acquisition Regulation (FAR)', 'State administrative procedure acts', 'Government ethics statutes'],
    timeline: '3-18 months for administrative proceedings; judicial review may add 1-2 years',
    winRate: 'Administrative appeals succeed approximately 30-40% of the time',
    settlement: (p) => ({ min: p.min * 20, max: p.max * 1000 }),
    barCerts: ['Board Certified Administrative Law Specialist', 'Government Contracts Specialist Certification'],
  },
  tc: {
    laws: (n) => ['Computer Fraud and Abuse Act (CFAA)', `Laws governing ${n.toLowerCase()}`, 'General Data Protection Regulation (GDPR) for international clients', 'California Consumer Privacy Act (CCPA)', 'State data breach notification laws', 'Electronic Communications Privacy Act'],
    timeline: '3-18 months for compliance matters; litigation may take 1-3 years',
    winRate: 'Data privacy enforcement actions settle approximately 80% of the time',
    settlement: (p) => ({ min: p.min * 50, max: p.max * 3000 }),
    barCerts: ['CIPP/US Certification', 'Board Certified in Technology Law'],
  },
  pfa: {
    laws: (n) => [`Federal laws governing ${n.toLowerCase()}`, `State laws governing ${n.toLowerCase()}`, 'Constitutional protections where applicable', 'Applicable consumer protection statutes', 'Administrative regulations', 'Industry-specific federal and state statutes'],
    timeline: '2-18 months depending on matter complexity',
    winRate: 'Resolution rates vary by specific practice area',
    settlement: (p) => ({ min: p.min * 30, max: p.max * 2000 }),
    barCerts: ['Relevant specialty board certification', 'State Bar Specialist Certification'],
  },
};

// Generate case types per area
function genCaseTypes(area) {
  const n = area.name;
  const p = area.price;
  const cat = area.cat;

  // Category-specific case type templates
  const templates = {
    pi: [
      [`${n} with soft tissue injuries — average settlement $15,000-$40,000`],
      [`${n} requiring surgery — average settlement $50,000-$200,000`],
      [`${n} with permanent disability — average settlement $150,000-$500,000`],
      [`${n} resulting in lost wages — average settlement $25,000-$75,000`],
      [`${n} involving multiple parties — average settlement $50,000-$250,000`],
      [`${n} with traumatic brain injury — average settlement $100,000-$1,000,000`],
      [`${n} causing emotional distress — average settlement $20,000-$60,000`],
      [`${n} wrongful death claims — average settlement $250,000-$1,000,000+`],
    ],
    cd: [
      [`Misdemeanor ${n.toLowerCase()} charges — potential penalties include fines and up to 1 year in jail`],
      [`Felony ${n.toLowerCase()} charges — potential penalties include 1-20+ years in prison`],
      [`Federal ${n.toLowerCase()} charges — subject to federal sentencing guidelines`],
      [`${n} charges with prior convictions — enhanced sentencing exposure`],
      [`${n} charges involving minors — elevated charges and penalties`],
      [`First offense ${n.toLowerCase()} — diversion programs may be available`],
      [`${n} charges with probation violation — potential revocation hearing`],
      [`${n} charges requiring plea negotiation — reduced charges possible`],
    ],
    fl: [
      [`Contested ${n.toLowerCase()} proceedings — average cost $10,000-$30,000`],
      [`Uncontested ${n.toLowerCase()} filings — average cost $2,000-$5,000`],
      [`${n} with complex asset division — average cost $15,000-$50,000`],
      [`${n} involving custody disputes — average cost $10,000-$30,000`],
      [`${n} requiring mediation — average cost $3,000-$10,000`],
      [`Emergency ${n.toLowerCase()} motions — average cost $2,000-$7,500`],
      [`${n} modification petitions — average cost $2,000-$7,500`],
      [`High-conflict ${n.toLowerCase()} cases — average cost $20,000-$75,000`],
    ],
    bc: [
      [`${n} contract drafting and review — typical fee $2,000-$10,000`],
      [`${n} dispute resolution — typical cost $10,000-$50,000`],
      [`${n} regulatory compliance — typical fee $5,000-$25,000`],
      [`${n} litigation defense — typical cost $25,000-$150,000`],
      [`${n} transaction structuring — typical fee $10,000-$75,000`],
      [`${n} intellectual property protection — typical fee $3,000-$15,000`],
      [`${n} entity formation and governance — typical fee $2,000-$10,000`],
      [`${n} merger or acquisition advisory — typical fee $25,000-$200,000`],
    ],
    ip: [
      [`${n} application and prosecution — typical fee $3,000-$15,000`],
      [`${n} infringement litigation — typical cost $100,000-$2,000,000`],
      [`${n} licensing negotiations — typical fee $5,000-$25,000`],
      [`${n} opposition or cancellation proceedings — typical cost $15,000-$50,000`],
      [`${n} portfolio management — typical annual fee $5,000-$25,000`],
      [`${n} cease and desist actions — typical fee $2,000-$10,000`],
      [`${n} due diligence for transactions — typical fee $5,000-$25,000`],
      [`${n} international protection strategy — typical fee $10,000-$50,000`],
    ],
    re: [
      [`${n} residential transaction — typical fee $1,000-$3,000`],
      [`${n} commercial transaction — typical fee $5,000-$25,000`],
      [`${n} dispute litigation — typical cost $10,000-$75,000`],
      [`${n} title review and resolution — typical fee $2,000-$7,500`],
      [`${n} lease negotiation — typical fee $2,000-$10,000`],
      [`${n} zoning or permit matter — typical fee $5,000-$20,000`],
      [`${n} foreclosure defense — typical cost $3,000-$10,000`],
      [`${n} construction defect claim — typical cost $10,000-$50,000`],
    ],
    im: [
      [`${n} initial application filing — typical fee $2,000-$7,500`],
      [`${n} appeal or motion to reopen — typical fee $3,000-$10,000`],
      [`${n} removal defense — typical fee $5,000-$15,000`],
      [`${n} waiver application — typical fee $3,000-$10,000`],
      [`${n} employer petition — typical fee $3,000-$10,000`],
      [`${n} family-based petition — typical fee $2,000-$7,500`],
      [`${n} adjustment of status — typical fee $3,000-$8,000`],
      [`${n} emergency motion or stay — typical fee $2,000-$7,500`],
    ],
    ep: [
      [`${n} basic document preparation — typical fee $500-$3,000`],
      [`${n} comprehensive estate plan — typical fee $3,000-$10,000`],
      [`${n} trust creation and funding — typical fee $3,000-$7,500`],
      [`${n} estate administration — typical fee $5,000-$20,000`],
      [`${n} guardianship petition — typical fee $3,000-$10,000`],
      [`${n} beneficiary dispute — typical cost $10,000-$50,000`],
      [`${n} tax planning strategy — typical fee $3,000-$15,000`],
      [`${n} Medicaid asset protection — typical fee $3,000-$10,000`],
    ],
    em: [
      [`${n} EEOC charge filing and investigation — typical fee $3,000-$7,500`],
      [`${n} pre-litigation demand and negotiation — typical fee $5,000-$15,000`],
      [`${n} federal court litigation — typical cost $25,000-$150,000`],
      [`${n} class or collective action — typical contingency 33-40% of recovery`],
      [`${n} arbitration proceedings — typical cost $10,000-$50,000`],
      [`${n} severance negotiation — typical fee $2,000-$7,500`],
      [`${n} administrative hearing — typical cost $5,000-$15,000`],
      [`${n} mediation and settlement — typical fee $3,000-$10,000`],
    ],
    bk: [
      [`${n} means test evaluation and counseling — typical fee $500-$1,500`],
      [`${n} petition preparation and filing — typical fee $1,500-$5,000`],
      [`${n} creditor negotiation — typical fee $2,000-$7,500`],
      [`${n} 341 meeting representation — included in filing fee`],
      [`${n} adversary proceeding defense — typical cost $5,000-$15,000`],
      [`${n} plan modification — typical fee $1,000-$3,000`],
      [`${n} discharge hearing — included in filing fee`],
      [`${n} motion for relief from stay — typical cost $2,000-$5,000`],
    ],
    tx: [
      [`${n} audit representation — typical fee $3,000-$15,000`],
      [`${n} offer in compromise — typical fee $3,000-$10,000`],
      [`${n} installment agreement negotiation — typical fee $1,500-$5,000`],
      [`${n} penalty abatement request — typical fee $2,000-$7,500`],
      [`${n} Tax Court petition — typical fee $5,000-$25,000`],
      [`${n} innocent spouse relief — typical fee $3,000-$10,000`],
      [`${n} liens and levies resolution — typical fee $2,000-$7,500`],
      [`${n} voluntary disclosure — typical fee $5,000-$25,000`],
    ],
    sp: [
      [`${n} initial consultation and case evaluation — typical fee $250-$1,000`],
      [`${n} pre-litigation strategy and demand — typical fee $3,000-$10,000`],
      [`${n} regulatory proceeding — typical cost $5,000-$25,000`],
      [`${n} federal litigation — typical cost $25,000-$150,000`],
      [`${n} state court litigation — typical cost $15,000-$75,000`],
      [`${n} administrative appeal — typical cost $5,000-$15,000`],
      [`${n} compliance audit and advisory — typical fee $5,000-$25,000`],
      [`${n} mediation or arbitration — typical fee $3,000-$15,000`],
    ],
    ga: [
      [`${n} agency proceeding representation — typical fee $5,000-$20,000`],
      [`${n} rule-making comment and advocacy — typical fee $5,000-$25,000`],
      [`${n} administrative appeal — typical fee $5,000-$15,000`],
      [`${n} compliance review and audit — typical fee $3,000-$15,000`],
      [`${n} government investigation response — typical fee $10,000-$50,000`],
      [`${n} bid protest — typical fee $10,000-$30,000`],
      [`${n} permit application — typical fee $3,000-$10,000`],
      [`${n} judicial review action — typical cost $10,000-$50,000`],
    ],
    tc: [
      [`${n} compliance assessment — typical fee $5,000-$25,000`],
      [`${n} data breach response — typical fee $10,000-$50,000`],
      [`${n} policy drafting and review — typical fee $3,000-$15,000`],
      [`${n} regulatory investigation response — typical fee $10,000-$75,000`],
      [`${n} vendor contract negotiation — typical fee $3,000-$10,000`],
      [`${n} class action defense — typical cost $50,000-$500,000`],
      [`${n} incident response planning — typical fee $5,000-$20,000`],
      [`${n} litigation and enforcement — typical cost $25,000-$200,000`],
    ],
    pfa: [
      [`${n} case evaluation and strategy — typical fee $250-$2,000`],
      [`${n} pre-litigation negotiation — typical fee $2,000-$10,000`],
      [`${n} court filing and representation — typical fee $3,000-$15,000`],
      [`${n} administrative proceeding — typical fee $2,000-$10,000`],
      [`${n} emergency motion filing — typical fee $1,500-$5,000`],
      [`${n} mediation and settlement — typical fee $2,000-$7,500`],
      [`${n} trial preparation and advocacy — typical cost $10,000-$50,000`],
      [`${n} appeal if necessary — typical cost $5,000-$25,000`],
    ],
  };

  return (templates[cat] || templates.sp).map(t => t[0]);
}

function genTips(area) {
  const n = area.name;
  const cat = area.cat;

  const tips = {
    pi: [
      `Choose a ${n.toLowerCase()} attorney who works on contingency so you pay nothing upfront`,
      `Verify the attorney has specific experience with ${n.toLowerCase()} cases like yours`,
      `Check their track record of settlements and trial verdicts in ${n.toLowerCase()} matters`,
      `Ask about their caseload to ensure your ${n.toLowerCase()} case gets proper attention`,
      `Confirm they have resources for expert witnesses and accident reconstruction if needed`,
      `Request references from past ${n.toLowerCase()} clients`,
      `Meet the actual attorney who will handle your case, not just the intake coordinator`,
      `Ensure they can explain the statute of limitations and legal process clearly`,
    ],
    cd: [
      `Look for a ${n.toLowerCase()} attorney with experience in the specific court handling your case`,
      `Verify they have handled cases with charges similar to yours`,
      `Ask about their trial experience versus plea negotiation success rate`,
      `Check if they are former prosecutors who understand both sides of ${n.toLowerCase()} cases`,
      `Ensure they respond quickly to calls, especially if you are in custody`,
      `Confirm they will personally handle your case, not delegate to a junior associate`,
      `Ask about potential defenses and realistic outcomes for your specific situation`,
      `Verify their standing with the state bar and check for any disciplinary history`,
    ],
    fl: [
      `Look for a ${n.toLowerCase()} attorney who emphasizes negotiation before litigation`,
      `Verify they have experience with cases involving similar financial and family dynamics`,
      `Ask whether they offer collaborative law or mediation as alternatives to court`,
      `Check if they are familiar with the local family court judges and procedures`,
      `Ensure they can explain the financial implications of different ${n.toLowerCase()} outcomes`,
      `Ask about their approach to protecting children's interests in ${n.toLowerCase()} matters`,
      `Confirm they will keep you informed and respond to communications promptly`,
      `Verify they have handled high-conflict cases if your situation is contentious`,
    ],
    bc: [
      `Choose a ${n.toLowerCase()} attorney with industry-specific experience relevant to your business`,
      `Verify they can handle both transactional and litigation aspects of ${n.toLowerCase()}`,
      `Ask about their experience with businesses of similar size and complexity`,
      `Check their understanding of regulatory requirements affecting your industry`,
      `Ensure they have a clear fee structure and can estimate total costs`,
      `Ask about their approach to risk management and preventive legal strategy`,
      `Confirm they have experience negotiating with sophisticated counterparties`,
      `Verify they can provide strategic business advice, not just legal technicalities`,
    ],
    ip: [
      `Choose a ${n.toLowerCase()} attorney with technical expertise in your field`,
      `Verify their success rate in obtaining and defending ${n.toLowerCase()} rights`,
      `Ask about their experience with USPTO proceedings and federal court litigation`,
      `Check whether they can develop a comprehensive ${n.toLowerCase()} portfolio strategy`,
      `Ensure they understand international ${n.toLowerCase()} protection if you operate globally`,
      `Ask about their approach to monitoring and enforcing ${n.toLowerCase()} rights`,
      `Confirm they can explain complex ${n.toLowerCase()} concepts in understandable terms`,
      `Verify they stay current with evolving ${n.toLowerCase()} law and technology`,
    ],
    re: [
      `Choose a ${n.toLowerCase()} attorney with experience in your type of property transaction or dispute`,
      `Verify they are familiar with local zoning laws and property regulations`,
      `Ask about their experience with title searches and resolving title issues`,
      `Check if they have handled cases in the county where your property is located`,
      `Ensure they can review and negotiate contracts to protect your interests`,
      `Ask about their approach to resolving disputes through negotiation before litigation`,
      `Confirm they understand environmental and building code requirements`,
      `Verify they have relationships with surveyors, inspectors, and other real estate professionals`,
    ],
    im: [
      `Choose a ${n.toLowerCase()} attorney who is a member of AILA and stays current on policy changes`,
      `Verify they have handled cases with the same visa category or immigration benefit`,
      `Ask about their success rates with the specific USCIS office or immigration court`,
      `Check if they speak your language or have multilingual staff available`,
      `Ensure they provide realistic timelines and do not make guarantees about outcomes`,
      `Ask about their experience with RFEs, appeals, and difficult cases`,
      `Confirm they will prepare you thoroughly for interviews and hearings`,
      `Verify they monitor case processing times and proactively address delays`,
    ],
    ep: [
      `Choose a ${n.toLowerCase()} attorney who takes time to understand your family situation and goals`,
      `Verify they are experienced with the specific planning or probate issues you face`,
      `Ask whether they recommend trusts or other tools to avoid probate`,
      `Check if they provide ongoing plan review and updates as laws change`,
      `Ensure they coordinate with your financial advisor and accountant`,
      `Ask about their approach to minimizing taxes and protecting assets`,
      `Confirm they explain documents in plain language so you understand each provision`,
      `Verify they have experience with estates of similar size and complexity`,
    ],
    em: [
      `Choose a ${n.toLowerCase()} attorney who has handled cases against your type of employer`,
      `Verify they understand EEOC procedures and state employment agency requirements`,
      `Ask about their experience with both negotiation and trial in ${n.toLowerCase()} cases`,
      `Check whether they work on contingency or require a retainer`,
      `Ensure they can explain the strengths and weaknesses of your case honestly`,
      `Ask about their track record of settlements and verdicts in similar cases`,
      `Confirm they will handle communications with your employer professionally`,
      `Verify they understand the emotional impact of ${n.toLowerCase()} and provide supportive counsel`,
    ],
    bk: [
      `Choose a ${n.toLowerCase()} attorney who offers a free initial consultation to evaluate your options`,
      `Verify they have experience with your specific type of bankruptcy or debt situation`,
      `Ask whether bankruptcy is truly the best option or if alternatives exist`,
      `Check that they explain the means test and exemptions clearly`,
      `Ensure they handle all creditor communications and stop harassment`,
      `Ask about their experience with the local bankruptcy court and trustees`,
      `Confirm they will prepare and review all filings carefully to avoid dismissal`,
      `Verify their fee structure and whether payments can be made over time`,
    ],
    tx: [
      `Choose a ${n.toLowerCase()} attorney with experience before the IRS or relevant tax authority`,
      `Verify they are either a CPA-attorney, enrolled agent, or former IRS counsel`,
      `Ask about their success rate in resolving cases similar to yours`,
      `Check whether they can handle both tax planning and controversy matters`,
      `Ensure they understand both federal and state tax implications`,
      `Ask about their approach to minimizing penalties and interest`,
      `Confirm they maintain confidentiality and understand attorney-client privilege for tax advice`,
      `Verify they stay current with annual tax law changes and IRS policy updates`,
    ],
  };

  return tips[cat] || [
    `Choose a ${n.toLowerCase()} attorney with specific experience in your type of legal matter`,
    `Verify they have a strong track record handling ${n.toLowerCase()} cases`,
    `Ask about their approach to your specific situation and potential strategies`,
    `Check their standing with the state bar and look for any disciplinary history`,
    `Ensure they communicate clearly and respond to your questions promptly`,
    `Ask about their fee structure and get a clear written engagement agreement`,
    `Confirm they will personally handle your case rather than delegating entirely`,
    `Verify they have the resources and experience to see your case through to resolution`,
  ];
}

function genFaqs(area) {
  const n = area.name;
  const slug = area.slug;
  const cat = area.cat;
  const p = area.price;

  // Generate 7 FAQs per practice area
  return [
    {
      q: `How much does a ${n.toLowerCase()} attorney cost?`,
      a: `The cost of a ${n.toLowerCase()} attorney varies based on case complexity, attorney experience, geographic location, and billing method. Hourly rates typically range from $${p.min} to $${p.max} per hour. ${p.contingencyFee ? `Many ${n.toLowerCase()} attorneys work on a contingency fee basis, typically ${p.contingencyFee}, meaning you pay nothing unless you win.` : ''} ${p.flatFeeRange ? `Some attorneys offer flat fee arrangements ranging from ${p.flatFeeRange} for straightforward matters.` : ''} ${p.retainerRange ? `Retainer fees typically range from ${p.retainerRange}.` : ''} Major metropolitan areas command higher rates than rural areas. Attorney experience significantly impacts pricing, with seasoned specialists charging more than general practitioners. Always get a detailed written fee agreement before hiring an attorney, and ask about all potential costs including filing fees, expert witnesses, and other expenses that may arise during your case.`
    },
    {
      q: `How do I find the best ${n.toLowerCase()} attorney near me?`,
      a: `Finding the best ${n.toLowerCase()} attorney requires research across multiple sources. Start by checking your state bar association directory which verifies licensure and shows disciplinary history. Ask for referrals from friends, family, or other attorneys who may know qualified ${n.toLowerCase()} specialists. Online legal directories like Martindale-Hubbell, Avvo, and Super Lawyers provide ratings and reviews. Look for board certification in the relevant specialty area, which indicates advanced competence. Schedule consultations with two or three attorneys to compare their approach, experience, and communication style. During consultations ask about their specific experience with cases like yours, their success rate, who will actually handle your case, and their availability. Check online reviews but weigh them carefully as individual experiences vary. The best attorney for you combines relevant expertise with communication and responsiveness that matches your needs.`
    },
    {
      q: `What should I expect during my first consultation with a ${n.toLowerCase()} attorney?`,
      a: `During your first consultation with a ${n.toLowerCase()} attorney, you should expect a thorough discussion of your legal situation. Bring all relevant documents including contracts, correspondence, court papers, police reports, medical records, or financial records depending on your case. The attorney will ask detailed questions about the facts, timeline, and parties involved. They should explain the legal framework applicable to your situation, potential strategies, likely outcomes, and realistic timelines. Ask about their experience with similar cases, who will handle your case day-to-day, their communication practices, and their fee structure. A good attorney will be honest about the strengths and weaknesses of your case rather than making unrealistic promises. The consultation typically lasts 30 to 60 minutes. ${catConfig[cat].freeConsultation ? 'Many ' + n.toLowerCase() + ' attorneys offer free initial consultations.' : 'Some attorneys charge for initial consultations, typically $100-$500, which may be applied toward fees if you hire them.'}`
    },
    {
      q: `How long does a ${n.toLowerCase()} case typically take to resolve?`,
      a: `The timeline for resolving a ${n.toLowerCase()} case depends on multiple factors including case complexity, the number of parties involved, court schedules, and whether the matter settles or goes to trial. ${catLegal[cat].timeline} Key factors that can extend the timeline include disputed facts or legal issues, the need for extensive discovery or expert analysis, court backlogs in busy jurisdictions, appeals, and the willingness of both parties to negotiate. Your attorney should provide a realistic timeline estimate based on the specific facts of your case and keep you informed about progress and any changes. While it may be tempting to push for a quick resolution, rushing can sometimes result in a worse outcome. Trust your attorney guidance on when to be patient and when to push for resolution.`
    },
    {
      q: `What questions should I ask before hiring a ${n.toLowerCase()} attorney?`,
      a: `Before hiring a ${n.toLowerCase()} attorney, ask these essential questions: How many years have you practiced ${n.toLowerCase()} law specifically? How many cases similar to mine have you handled, and what were the outcomes? Will you personally handle my case or delegate it to associates or paralegals? What is your fee structure, and what total costs should I anticipate? How will you keep me informed about case progress, and how quickly do you respond to client communications? What is your assessment of my case strengths and weaknesses? What is the likely timeline for resolution? Are you board certified or have any specialty certifications? What is your trial experience if my case cannot be settled? Can you provide references from past clients with similar cases? The answers to these questions will help you evaluate both competence and compatibility, which are equally important in choosing the right attorney for your situation.`
    },
    {
      q: `What are the most common mistakes people make in ${n.toLowerCase()} cases?`,
      a: `The most common mistakes in ${n.toLowerCase()} cases include waiting too long to consult an attorney, which can result in missing critical deadlines or losing important evidence. Many people try to handle matters themselves initially and only seek legal help after making statements or taking actions that hurt their case. Talking to the opposing party or their representatives without legal counsel present is another frequent error. Failing to document everything including keeping copies of all communications, records, and evidence can weaken your position. Some people choose an attorney based solely on cost rather than relevant experience and specialization. Not being completely honest with your attorney prevents them from developing the best strategy and preparing for potential problems. Finally, having unrealistic expectations about outcomes or timelines can lead to frustration and poor decision-making. The earlier you involve a qualified ${n.toLowerCase()} attorney, the better your chances of a favorable outcome.`
    },
    {
      q: `Can I handle a ${n.toLowerCase()} matter without an attorney?`,
      a: `While you have the legal right to represent yourself in most ${n.toLowerCase()} matters, doing so carries significant risks. The legal system is complex, and ${n.toLowerCase()} cases involve specialized rules, procedures, deadlines, and strategic considerations that attorneys spend years learning. Self-represented parties are held to the same standards as attorneys and receive no special accommodations from courts. Common risks include missing filing deadlines that bar your claims permanently, making statements that damage your case, failing to preserve important evidence, not understanding your full legal rights, and accepting unfavorable terms because you do not know what a fair outcome looks like. ${catConfig[cat].contingencyAvailable ? 'Since many ' + n.toLowerCase() + ' attorneys work on contingency, you may be able to obtain quality representation with no upfront cost.' : 'While attorney fees represent a significant investment, the cost of mistakes from self-representation often far exceeds legal fees.'} For minor or straightforward matters, some people successfully handle things themselves, but for anything involving significant rights, money, or liberty, professional representation is strongly recommended.`
    },
  ];
}

function genEmergency(area) {
  const n = area.name;
  const cat = area.cat;
  const emergencies = {
    pi: `If you or someone else has been seriously injured, call 911 immediately. Do not move an injured person unless they are in immediate danger. Seek emergency medical treatment first. Contact a ${n.toLowerCase()} attorney within 24 to 48 hours to preserve evidence and protect your legal rights. Do not discuss fault with anyone at the scene or give recorded statements to insurance companies.`,
    cd: `If you have been arrested or are being investigated for ${n.toLowerCase()}, exercise your right to remain silent and request an attorney immediately. Do not answer police questions, consent to searches, or sign any documents without legal counsel present. Contact a ${n.toLowerCase()} defense attorney as soon as possible, ideally before any questioning takes place. If you cannot afford an attorney, request a public defender at your arraignment.`,
    fl: `If you or your children are in immediate danger from domestic violence, call 911 or the National Domestic Violence Hotline at 1-800-799-7233. If you need emergency custody orders, a temporary restraining order, or protection from asset dissipation, contact a ${n.toLowerCase()} attorney immediately. Many courts offer emergency ex parte orders that can be obtained the same day.`,
    im: `If you or a family member is in immigration detention or has received a notice to appear in removal proceedings, contact a ${n.toLowerCase()} attorney immediately. Do not sign any documents or agree to voluntary departure without legal counsel. If you are stopped by immigration authorities, you have the right to remain silent and to speak with an attorney. Call the National Immigrant Legal Services hotline for emergency referrals.`,
    bk: `If you are facing imminent foreclosure, wage garnishment, repossession, or a lawsuit from creditors, contact a ${n.toLowerCase()} attorney immediately. Filing for bankruptcy triggers an automatic stay that stops most collection actions immediately. Emergency bankruptcy filings can sometimes be completed within 24 to 48 hours when necessary to prevent loss of property or income.`,
  };
  return emergencies[cat] || `If you are facing an urgent ${n.toLowerCase()} matter with imminent deadlines, potential loss of rights, or emergency circumstances, contact a ${n.toLowerCase()} attorney immediately. Many attorneys offer same-day consultations for urgent matters. If you cannot reach an attorney, contact your local bar association lawyer referral service for emergency assistance.`;
}

function genWhenToHire(area) {
  const n = area.name;
  const cat = area.cat;

  const w = {
    pi: [
      `You have suffered injuries due to someone else\'s negligence in a ${n.toLowerCase()} incident`,
      `An insurance company has denied your claim or is offering an unfairly low settlement`,
      `You are facing substantial medical bills, lost wages, or ongoing treatment costs`,
      `The liable party or their insurer is disputing responsibility`,
      `Your injuries may result in permanent disability or long-term impairment`,
    ],
    cd: [
      `You have been arrested, charged, or are under investigation for ${n.toLowerCase()}`,
      `Police want to question you about a potential ${n.toLowerCase()} matter`,
      `You have received a target letter or grand jury subpoena`,
      `You are facing potential jail time, fines, or a criminal record`,
      `You need to negotiate a plea agreement or explore diversion programs`,
    ],
    fl: [
      `You are considering or facing ${n.toLowerCase()} proceedings`,
      `Your spouse or the other party has already retained an attorney`,
      `Children, significant assets, or complex finances are involved`,
      `You need to protect your parental rights or financial interests`,
      `Domestic violence, substance abuse, or safety concerns are present`,
    ],
    bc: [
      `You are starting, acquiring, or restructuring a business requiring ${n.toLowerCase()} guidance`,
      `You are facing a business dispute that could result in significant financial exposure`,
      `You need contracts, agreements, or corporate documents drafted or reviewed`,
      `Regulatory compliance issues require specialized ${n.toLowerCase()} knowledge`,
      `You are considering a major transaction such as a merger, acquisition, or investment`,
    ],
    ip: [
      `You have developed intellectual property that needs ${n.toLowerCase()} protection`,
      `Someone is infringing on your ${n.toLowerCase()} rights`,
      `You have received a cease and desist letter alleging ${n.toLowerCase()} infringement`,
      `You need to license, transfer, or commercialize ${n.toLowerCase()} assets`,
      `You are entering a market where ${n.toLowerCase()} protection is critical to your business`,
    ],
    re: [
      `You are buying, selling, or leasing property that involves ${n.toLowerCase()} considerations`,
      `You have a dispute with a neighbor, landlord, tenant, or HOA`,
      `You are facing foreclosure, eminent domain, or zoning issues`,
      `A title defect or boundary issue needs resolution`,
      `You need contracts reviewed or negotiated for a real estate transaction`,
    ],
    im: [
      `You need to apply for an immigration benefit related to ${n.toLowerCase()}`,
      `You are in removal or deportation proceedings`,
      `Your immigration application has been denied or delayed`,
      `You need to change or extend your immigration status`,
      `An employer or family member needs to sponsor your immigration case`,
    ],
    ep: [
      `You need to create or update your ${n.toLowerCase()} documents`,
      `A family member has passed away and their estate needs administration`,
      `You have concerns about a loved one\'s mental capacity or need guardianship`,
      `Your assets or family situation has changed significantly`,
      `You want to minimize estate taxes or protect assets from creditors or long-term care costs`,
    ],
    em: [
      `You believe your employer has violated your rights regarding ${n.toLowerCase()}`,
      `You have been terminated, demoted, or retaliated against unfairly`,
      `You are experiencing harassment or discrimination in the workplace`,
      `Your employer is not paying proper wages, overtime, or benefits`,
      `You need to negotiate a severance agreement or non-compete clause`,
    ],
    bk: [
      `You are unable to pay your debts and need ${n.toLowerCase()} relief options`,
      `Creditors are threatening lawsuits, garnishment, or foreclosure`,
      `You want to understand the differences between bankruptcy chapters`,
      `Your business is insolvent and needs to restructure or liquidate debts`,
      `You are being harassed by debt collectors and need the automatic stay protection`,
    ],
    tx: [
      `You have received a notice of audit, assessment, or collection from the IRS or state tax authority`,
      `You need to plan a transaction or strategy to minimize ${n.toLowerCase()} obligations`,
      `You are facing potential penalties, interest, or criminal tax charges`,
      `You have unfiled tax returns or unpaid ${n.toLowerCase()} obligations`,
      `You need representation in Tax Court or administrative proceedings`,
    ],
  };

  return w[cat] || [
    `You are facing a legal issue involving ${n.toLowerCase()} that affects your rights or finances`,
    `The complexity of your situation requires specialized ${n.toLowerCase()} knowledge`,
    `The other party has legal representation and you need to level the playing field`,
    `There are deadlines, filing requirements, or procedural rules you need to navigate`,
    `The potential consequences of your ${n.toLowerCase()} matter are too significant to handle alone`,
  ];
}

function genRedFlags(area) {
  const n = area.name;
  return [
    `Attorney guarantees a specific outcome for your ${n.toLowerCase()} case`,
    `Pressure to sign a retainer agreement immediately without time to review`,
    `Attorney is not responsive to calls, emails, or client communications`,
    `No clear written explanation of fee structure and anticipated costs`,
    `Attorney has disciplinary actions or unresolved complaints on their record`,
    `Lack of specific experience with ${n.toLowerCase()} cases similar to yours`,
    `Attorney delegates your case entirely to unsupervised junior staff`,
    `No written engagement letter or fee agreement provided before representation begins`,
  ];
}

// ===== MAIN OUTPUT =====

let out = `/**
 * Rich SEO content for each legal practice area.
 * Used on practice area hub pages to add contextual content
 * (pricing guide, FAQ, practical tips, legal-specific data).
 *
 * Generated for all 200 practice areas from practice-areas-200.ts
 */

export interface AttorneyContent {
  slug: string
  name: string
  spanishName: string
  priceRange: {
    min: number
    max: number
    unit: string
    contingencyFee?: string
    flatFeeRange?: string
    retainerRange?: string
  }
  commonCaseTypes: string[]
  tips: string[]
  faq: { q: string; a: string }[]
  emergencyInfo?: string
  certifications: string[]
  averageResponseTime: string
  relevantLaws: string[]
  typicalTimeline: string
  winRate?: string
  settlementRange?: { min: number; max: number }
  barCertifications: string[]
  relatedPracticeAreas: string[]
  whenToHire: string[]
  redFlags: string[]
  freeConsultation: boolean
  contingencyAvailable: boolean
  proBonoAvailable: boolean
}

export const attorneyContent: Record<string, AttorneyContent> = {\n`;

for (const area of areas) {
  const cc = catConfig[area.cat];
  const cl = catLegal[area.cat];
  const settlement = cl.settlement(area.price);

  const entry = {
    slug: area.slug,
    name: area.name,
    spanishName: area.spanishName,
    priceRange: {
      min: area.price.min,
      max: area.price.max,
      unit: 'per hour',
      ...(area.price.contingencyFee && { contingencyFee: area.price.contingencyFee }),
      ...(area.price.flatFeeRange && { flatFeeRange: area.price.flatFeeRange }),
      ...(area.price.retainerRange && { retainerRange: area.price.retainerRange }),
    },
    commonCaseTypes: genCaseTypes(area),
    tips: genTips(area),
    faq: genFaqs(area),
    emergencyInfo: genEmergency(area),
    certifications: cc.certifications,
    averageResponseTime: cc.responseTime,
    relevantLaws: cl.laws(area.name),
    typicalTimeline: cl.timeline,
    winRate: cl.winRate,
    ...(settlement && { settlementRange: settlement }),
    barCertifications: cl.barCerts,
    relatedPracticeAreas: area.related,
    whenToHire: genWhenToHire(area),
    redFlags: genRedFlags(area),
    freeConsultation: cc.freeConsultation,
    contingencyAvailable: cc.contingencyAvailable,
    proBonoAvailable: cc.proBonoAvailable,
  };

  // Serialize manually to keep it readable
  out += `\n  '${area.slug}': ${JSON.stringify(entry, null, 4).replace(/^/gm, '  ').trimStart()},\n`;
}

out += `
}

// =============================================================================
// Helper functions
// =============================================================================

/**
 * Retrieves the content for a practice area by its slug.
 * Returns undefined if the slug does not exist.
 */
export function getAttorneyContent(slug: string): AttorneyContent | undefined {
  return attorneyContent[slug]
}

/**
 * Retrieves all available practice area slugs that have content.
 */
export function getAttorneyContentSlugs(): string[] {
  return Object.keys(attorneyContent)
}

/**
 * Retrieves content for multiple slugs at once.
 */
export function getAttorneyContentBatch(slugs: string[]): (AttorneyContent | undefined)[] {
  return slugs.map(slug => attorneyContent[slug])
}

/**
 * Returns all practice areas in a given category based on provided slugs.
 */
export function getAttorneyContentByCategory(categorySlugs: string[]): AttorneyContent[] {
  return categorySlugs
    .map(slug => attorneyContent[slug])
    .filter((c): c is AttorneyContent => c !== undefined)
}

/**
 * Returns related practice area content for a given slug.
 */
export function getRelatedAttorneyContent(slug: string): AttorneyContent[] {
  const content = attorneyContent[slug]
  if (!content) return []
  return content.relatedPracticeAreas
    .map(s => attorneyContent[s])
    .filter((c): c is AttorneyContent => c !== undefined)
}

/**
 * Slugifies a case type name for URL usage.
 */
export function slugifyCaseType(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\\u0300-\\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/**
 * Parses a case type string (format "description — average settlement $X-$Y").
 */
export function parseCaseType(caseType: string): { description: string; slug: string; settlementText: string } {
  const dashIdx = caseType.indexOf(' — ')
  if (dashIdx === -1) return { description: caseType.trim(), slug: slugifyCaseType(caseType.trim()), settlementText: '' }
  const description = caseType.substring(0, dashIdx).trim()
  const settlementText = caseType.substring(dashIdx + 3).trim()
  return { description, slug: slugifyCaseType(description), settlementText }
}

/**
 * Returns all parsed case types for a practice area.
 */
export function getCaseTypesForPracticeArea(slug: string): { description: string; slug: string; settlementText: string }[] {
  const content = attorneyContent[slug]
  if (!content) return []
  return content.commonCaseTypes.map(parseCaseType)
}
`;

process.stdout.write(out);
