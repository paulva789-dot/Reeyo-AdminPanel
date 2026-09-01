// Interface strings — specification §2.1.
//
// French first, because French is the default and writing it second is how a
// translation ends up being a translation. Each entry is [fr, en].
//
// What is NOT here, deliberately: vendor names, item names, customer names,
// addresses and zone names. §2.1 is explicit that entered data stays exactly as
// entered — only interface text is translated. A console that "translated"
// Carrefour Obili would be worse than one that did not translate at all.

export type Language = 'fr' | 'en';

type Entry = readonly [fr: string, en: string];

export const STRINGS = {
  /* Navigation ---------------------------------------------------------- */
  'nav.group.operate': ['Exploitation', 'Operate'],
  'nav.group.supply': ['Offre', 'Supply'],
  'nav.group.growth': ['Croissance', 'Growth'],
  'nav.group.money': ['Finances', 'Money'],
  'nav.group.configure': ['Configuration', 'Configure'],
  'nav.overview': ['Vue d’ensemble', 'Overview'],
  'nav.orders': ['Commandes', 'Orders'],
  'nav.dispatch': ['Répartition', 'Dispatch'],
  'nav.disputes': ['Litiges', 'Disputes'],
  'nav.vendors': ['Marchands', 'Vendors'],
  'nav.approvals': ['Validations', 'Approvals'],
  'nav.riders': ['Livreurs', 'Riders'],
  'nav.customers': ['Clients', 'Customers'],
  'nav.storefront': ['Vitrine', 'Storefront'],
  'nav.marketing': ['Marketing', 'Marketing'],
  'nav.payments': ['Paiements', 'Payments'],
  'nav.analytics': ['Analyses', 'Analytics'],
  'nav.settings': ['Paramètres', 'Settings'],
  'nav.signOut': ['Se déconnecter', 'Sign out'],

  /* Topbar -------------------------------------------------------------- */
  'top.search': ['Rechercher commandes, marchands, livreurs', 'Search orders, vendors, riders'],
  'top.searchLabel': ['Rechercher', 'Search'],
  'top.alerts': ['Alertes', 'Alerts'],
  'top.refresh': ['Actualiser', 'Refresh data'],
  'top.openNav': ['Ouvrir la navigation', 'Open navigation'],
  'top.allRegions': ['Toutes les régions', 'All regions'],
  'top.theme': ['Thème', 'Theme'],
  'top.themeLight': ['Clair', 'Light'],
  'top.themeDark': ['Sombre', 'Dark'],
  'top.themeSystem': ['Système', 'System'],
  'top.language': ['Langue', 'Language'],

  /* Order workflow, §3.2 ------------------------------------------------- */
  'status.pending': ['en attente', 'pending'],
  'status.confirmed': ['confirmée', 'confirmed'],
  'status.ready for pickup': ['prête', 'ready for pickup'],
  'status.rider assigned': ['livreur assigné', 'rider assigned'],
  'status.picked up': ['récupérée', 'picked up'],
  'status.in transit': ['en route', 'in transit'],
  'status.delivered': ['livrée', 'delivered'],
  'status.cancelled': ['annulée', 'cancelled'],
  'status.failed': ['échouée', 'failed'],
  'status.late': ['en retard', 'late'],

  /* Payment, §8.1 -------------------------------------------------------- */
  'pay.Cash on delivery': ['Paiement à la livraison', 'Cash on delivery'],
  'pay.MoMo': ['MoMo', 'MoMo'],
  'pay.Orange Money': ['Orange Money', 'Orange Money'],
  'pay.Pay online': ['Paiement en ligne', 'Pay online'],
  'payStatus.Paid': ['payée', 'paid'],
  'payStatus.Unpaid': ['non payée', 'unpaid'],
  'payStatus.Pending confirmation': ['confirmation en attente', 'pending confirmation'],
  'payStatus.Refunded': ['remboursée', 'refunded'],

  /* Services ------------------------------------------------------------- */
  'service.food': ['Restauration', 'Food'],
  'service.grocery': ['Épicerie', 'Grocery'],
  'service.parcel': ['Colis', 'Parcel'],
  'service.all': ['Tous', 'All'],

  /* Common actions ------------------------------------------------------- */
  'action.save': ['Enregistrer', 'Save'],
  'action.cancel': ['Annuler', 'Cancel'],
  'action.close': ['Fermer', 'Close'],
  'action.delete': ['Supprimer', 'Delete'],
  'action.edit': ['Modifier', 'Edit'],
  'action.export': ['Exporter', 'Export'],
  'action.filter': ['Filtrer', 'Filter'],
  'action.clearFilter': ['Effacer le filtre', 'Clear filter'],
  'action.approve': ['Approuver', 'Approve'],
  'action.reject': ['Refuser', 'Reject'],
  'action.suspend': ['Suspendre', 'Suspend'],
  'action.reinstate': ['Réactiver', 'Reinstate'],
  'action.open': ['Ouvrir', 'Open'],
  'action.assignRider': ['Assigner un livreur', 'Assign rider'],
  'action.reassignRider': ['Changer de livreur', 'Reassign rider'],
  'action.editStatus': ['Modifier le statut', 'Edit status'],
  'action.markPaid': ['Marquer comme payé', 'Mark as paid'],
  'action.addFunds': ['Créditer', 'Add funds'],
  'action.removeFunds': ['Débiter', 'Remove funds'],
  'action.createTeam': ['Créer une équipe', 'Create team'],
  'action.addDeliveryFee': ['Ajouter un tarif', 'Add delivery fee'],
  'action.call': ['Appeler', 'Call'],
  'action.copy': ['Copier', 'Copy'],
  'action.openInMaps': ['Ouvrir dans Google Maps', 'Open in Google Maps'],

  /* Table headers -------------------------------------------------------- */
  'col.order': ['Commande', 'Order'],
  'col.service': ['Service', 'Service'],
  'col.placed': ['Passée le', 'Date placed'],
  'col.customer': ['Client', 'Customer'],
  'col.vendor': ['Marchand', 'Vendor'],
  'col.rider': ['Livreur', 'Rider'],
  'col.zone': ['Zone', 'Zone'],
  'col.total': ['Total', 'Total'],
  'col.payment': ['Paiement', 'Payment method'],
  'col.status': ['Statut', 'Status'],
  'col.eta': ['Délai', 'ETA'],
  'col.amount': ['Montant', 'Amount'],
  'col.date': ['Date', 'Date'],
  'col.commission': ['Commission', 'Commission'],
  'col.reference': ['Référence', 'Reference'],
  'col.wallet': ['Portefeuille', 'Wallet'],
  'col.actions': ['Actions', 'Actions'],

  /* Date filter, §2.3 ----------------------------------------------------- */
  'date.today': ['Aujourd’hui', 'Today'],
  'date.yesterday': ['Hier', 'Yesterday'],
  'date.last7': ['7 derniers jours', 'Last 7 days'],
  'date.last30': ['30 derniers jours', 'Last 30 days'],
  'date.thisMonth': ['Ce mois-ci', 'This month'],
  'date.lastMonth': ['Le mois dernier', 'Last month'],
  'date.custom': ['Période personnalisée', 'Custom range'],
  'date.range': ['Période', 'Date range'],
  'date.start': ['Début', 'Start'],
  'date.end': ['Fin', 'End'],
  'date.apply': ['Appliquer', 'Apply'],

  /* Sound alerts, §2.4 ---------------------------------------------------- */
  'sound.title': ['Alerte nouvelle commande', 'Incoming order alert'],
  'sound.tone': ['Sonnerie', 'Tone'],
  'sound.volume': ['Volume', 'Volume'],
  'sound.preview': ['Écouter', 'Preview'],
  'sound.muted': ['Son coupé', 'Sound is muted'],
  'sound.enable': ['Activer le son', 'Enable sound'],
  'sound.blocked': [
    'Le navigateur bloque le son jusqu’à une interaction avec la page.',
    'The browser blocks sound until the page is interacted with.',
  ],

  /* Validation and empty states ------------------------------------------- */
  'error.required': ['Ce champ est obligatoire', 'This field is required'],
  'error.reasonRequired': [
    'Indiquez une raison — le client et le marchand la voient tous les deux',
    'Give a reason — the customer and vendor both see it',
  ],
  'empty.noResults': ['Aucun résultat', 'Nothing matches'],
  'empty.clearToSeeAll': [
    'Rien ici ne correspond à ce que vous avez saisi.',
    'Nothing here matches what you typed.',
  ],

  /* Toasts ---------------------------------------------------------------- */
  'toast.saved': ['Enregistré', 'Saved'],
  'toast.statusChanged': ['{id} est maintenant {status}', '{id} is now {status}'],
  'toast.newOrder': ['Nouvelle commande {id}', 'New order {id}'],
} as const satisfies Record<string, Entry>;

export type StringKey = keyof typeof STRINGS;

/**
 * Looks a string up, substituting {placeholders}.
 *
 * A missing key returns the key itself rather than an empty space — a visible
 * `nav.orders` in the interface is a bug report; a blank label is a mystery.
 */
export function translate(
  language: Language,
  key: StringKey,
  vars?: Record<string, string | number>,
): string {
  const entry = STRINGS[key] as Entry | undefined;
  if (!entry) return key;
  let text = language === 'fr' ? entry[0] : entry[1];
  if (vars) {
    for (const [name, value] of Object.entries(vars)) {
      text = text.replace(new RegExp(`\\{${name}\\}`, 'g'), String(value));
    }
  }
  return text;
}
