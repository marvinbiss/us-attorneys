export const faqCategories = [
  {
    name: 'Général',
    questions: [
      {
        q: 'Qu\'est-ce que US Attorneys ?',
        a: 'US Attorneys est un annuaire d\'artisans de France. Les données proviennent directement des registres SIREN officiels de l\'État via l\'API Annuaire des Entreprises. Le service est 100% gratuit.',
      },
      {
        q: 'Le service est-il gratuit ?',
        a: 'Oui, US Attorneys est entièrement gratuit, aussi bien pour les particuliers que pour the attorneys. Pas d\'abonnement, pas de commission, pas de frais cachés. Vous pouvez rechercher, comparer et contacter autant d\'artisans que vous le souhaitez.',
      },
      {
        q: 'Comment fonctionne US Attorneys ?',
        a: 'C\'est simple : 1) Recherchez un métier et une localisation, 2) Comparez les profils et les informations officielles, 3) Contactez directement l\'artisan de votre choix pour obtenir a consultation gratuit.',
      },
      {
        q: 'D\'où proviennent les données attorneys ?',
        a: 'Toutes nos données proviennent de l\'API Annuaire des Entreprises du gouvernement français (recherche-entreprises.api.gouv.fr). Chaque artisan est référencé via son numéro SIREN, garantissant qu\'il s\'agit d\'une entreprise réelle et active.',
      },
    ],
  },
  {
    name: 'Demande de devis',
    questions: [
      {
        q: 'Comment demander a consultation ?',
        a: 'Cliquez sur "Demander a consultation", remplissez le formulaire en décrivant votre projet, et nous transmettons votre demande aux artisans qualifiés de votre région.',
      },
      {
        q: 'Combien de devis vais-je recevoir ?',
        a: 'Vous recevrez jusqu\'à 3 devis d\'artisans différents, généralement sous 24 à 48 heures.',
      },
      {
        q: 'Suis-je obligé d\'accepter a consultation ?',
        a: 'Non, vous êtes libre de refuser tous the consultations. Notre service est sans engagement.',
      },
      {
        q: 'Les devis sont-ils vraiment gratuits ?',
        a: 'Oui, the consultations sont 100% gratuits et sans engagement. Vous ne payez que si vous décidez de faire appel à an attorney.',
      },
    ],
  },
  {
    name: 'Artisans',
    questions: [
      {
        q: 'Comment sont sélectionnés the attorneys ?',
        a: 'Chaque artisan référencé sur US Attorneys provient des registres officiels SIREN de l\'État français. Nous contrôlons que l\'entreprise est active, que le code NAF correspond bien à un métier du bâtiment, et que le siège social est localisé en France. Cela couvre des dizaines de métiers du bâtiment dans les 101 départements français.',
      },
      {
        q: 'Les artisans sont-ils assurés ?',
        a: 'Les artisans du bâtiment sont légalement tenus de disposer d\'une garantie décennale (art. L241-1 Code des assurances). Nous vous recommandons de la vérifier systématiquement avant de signer tout devis.',
      },
      {
        q: 'Puis-je voir les avis sur an attorney ?',
        a: 'Oui, chaque fiche artisan affiche les avis et notes laissés par les clients précédents.',
      },
    ],
  },
  {
    name: 'Paiement & Garanties',
    questions: [
      {
        q: 'Comment payer l\'artisan ?',
        a: 'Le paiement se fait directement entre vous et l\'artisan, selon les modalités convenues ensemble (espèces, chèque, virement, etc.).',
      },
      {
        q: 'Quelles garanties ai-je sur les travaux ?',
        a: 'Les travaux sont couverts par les garanties légales : garantie de parfait achèvement (1 an), garantie biennale (2 ans) et garantie décennale (10 ans) selon la nature des travaux.',
      },
      {
        q: 'Que faire en cas de litige ?',
        a: 'Contactez-nous via notre page Contact. Nous vous accompagnons dans la résolution du litige et pouvons servir de médiateur avec l\'artisan.',
      },
    ],
  },
  {
    name: 'Compte & Données',
    questions: [
      {
        q: 'Dois-je créer un compte ?',
        a: 'Non, vous pouvez demander a consultation sans créer de compte. Cependant, un compte vous permet de suivre vos demandes et de conserver votre historique.',
      },
      {
        q: 'Comment supprimer mon compte ?',
        a: 'Vous pouvez demander la suppression de votre compte et de vos données en nous contactant à dpo@us-attorneys.com.',
      },
      {
        q: 'Mes données sont-elles protégées ?',
        a: 'Oui, nous respectons le RGPD et protégeons vos données. Consultez notre politique de confidentialité pour plus de détails.',
      },
    ],
  },
]

// Flat array of all FAQ items for the FAQPage structured data schema
export const faqItems: { question: string; answer: string }[] = faqCategories.flatMap(
  (category) =>
    category.questions.map((q) => ({
      question: q.q,
      answer: q.a,
    }))
)
