
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
  getRuntime,
  skip
} = require('./runtime/index-browser.js')


const Prisma = {}

exports.Prisma = Prisma
exports.$Enums = {}

/**
 * Prisma Client JS version: 6.6.0
 * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
 */
Prisma.prismaVersion = {
  client: "6.6.0",
  engine: "f676762280b54cd07c770017ed3711ddde35f37a"
}

Prisma.PrismaClientKnownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientKnownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientUnknownRequestError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientRustPanicError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientRustPanicError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientInitializationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientInitializationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.PrismaClientValidationError = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`PrismaClientValidationError is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`sqltag is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.empty = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`empty is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.join = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`join is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.raw = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`raw is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.getExtensionContext is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}
Prisma.defineExtension = () => {
  const runtimeName = getRuntime().prettyName;
  throw new Error(`Extensions.defineExtension is unable to run in this browser environment, or has been bundled for the browser (running in ${runtimeName}).
In case this error is unexpected for you, please report it in https://pris.ly/prisma-prisma-bug-report`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}



/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  email: 'email',
  motDePasse: 'motDePasse',
  type: 'type',
  niveauAcces: 'niveauAcces',
  configurationTravail: 'configurationTravail',
  droitsConges: 'droitsConges',
  specialites: 'specialites',
  dateCreation: 'dateCreation'
};

exports.Prisma.SurgeonScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  prenom: 'prenom',
  specialites: 'specialites',
  actif: 'actif',
  reglesSpecifiques: 'reglesSpecifiques'
};

exports.Prisma.RoomScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  numero: 'numero',
  type: 'type',
  secteur: 'secteur',
  codeCouleur: 'codeCouleur',
  reglesSupervision: 'reglesSupervision'
};

exports.Prisma.AffectationScalarFieldEnum = {
  id: 'id',
  date: 'date',
  demiJournee: 'demiJournee',
  type: 'type',
  specialite: 'specialite',
  statut: 'statut',
  situationExceptionnelle: 'situationExceptionnelle',
  utilisateurId: 'utilisateurId',
  salleId: 'salleId',
  chirurgienId: 'chirurgienId',
  trameId: 'trameId'
};

exports.Prisma.LeaveScalarFieldEnum = {
  id: 'id',
  dateDebut: 'dateDebut',
  dateFin: 'dateFin',
  type: 'type',
  statut: 'statut',
  commentaire: 'commentaire',
  decompte: 'decompte',
  utilisateurId: 'utilisateurId'
};

exports.Prisma.CounterScalarFieldEnum = {
  id: 'id',
  annee: 'annee',
  congesPris: 'congesPris',
  congesRestants: 'congesRestants',
  heuresSupplementaires: 'heuresSupplementaires',
  statsSpecialites: 'statsSpecialites',
  statsGardes: 'statsGardes',
  utilisateurId: 'utilisateurId'
};

exports.Prisma.FrameScalarFieldEnum = {
  id: 'id',
  nom: 'nom',
  type: 'type',
  configuration: 'configuration',
  dateDebutValidite: 'dateDebutValidite',
  dateFinValidite: 'dateFinValidite',
  details: 'details'
};

exports.Prisma.NotificationScalarFieldEnum = {
  id: 'id',
  dateCreation: 'dateCreation',
  type: 'type',
  message: 'message',
  lue: 'lue',
  utilisateurId: 'utilisateurId'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};
exports.UserType = exports.$Enums.UserType = {
  MAR: 'MAR',
  IADE: 'IADE',
  Admin: 'Admin'
};

exports.AccessLevel = exports.$Enums.AccessLevel = {
  AdminComplet: 'AdminComplet',
  AdminPartiel: 'AdminPartiel',
  Utilisateur: 'Utilisateur'
};

exports.HalfDay = exports.$Enums.HalfDay = {
  Matin: 'Matin',
  ApresMidi: 'ApresMidi'
};

exports.AffectationType = exports.$Enums.AffectationType = {
  Garde: 'Garde',
  Astreinte: 'Astreinte',
  Consultation: 'Consultation',
  BlocAnesthesie: 'BlocAnesthesie',
  BlocSupervision: 'BlocSupervision'
};

exports.AffectationStatus = exports.$Enums.AffectationStatus = {
  GenereAuto: 'GenereAuto',
  Valide: 'Valide',
  ModifieManuel: 'ModifieManuel'
};

exports.LeaveType = exports.$Enums.LeaveType = {
  CA: 'CA',
  Maladie: 'Maladie',
  Formation: 'Formation',
  Recuperation: 'Recuperation'
};

exports.LeaveStatus = exports.$Enums.LeaveStatus = {
  Demande: 'Demande',
  Approuve: 'Approuve',
  Refuse: 'Refuse'
};

exports.FrameType = exports.$Enums.FrameType = {
  Bloc: 'Bloc',
  Consultation: 'Consultation',
  Garde: 'Garde'
};

exports.FrameConfiguration = exports.$Enums.FrameConfiguration = {
  SemainePaire: 'SemainePaire',
  SemaineImpaire: 'SemaineImpaire'
};

exports.NotificationType = exports.$Enums.NotificationType = {
  ValidationConge: 'ValidationConge',
  RefusConge: 'RefusConge',
  NouveauPlanning: 'NouveauPlanning',
  DemandeChangement: 'DemandeChangement'
};

exports.Prisma.ModelName = {
  User: 'User',
  Surgeon: 'Surgeon',
  Room: 'Room',
  Affectation: 'Affectation',
  Leave: 'Leave',
  Counter: 'Counter',
  Frame: 'Frame',
  Notification: 'Notification'
};

/**
 * This is a stub Prisma Client that will error at runtime if called.
 */
class PrismaClient {
  constructor() {
    return new Proxy(this, {
      get(target, prop) {
        let message
        const runtime = getRuntime()
        if (runtime.isEdge) {
          message = `PrismaClient is not configured to run in ${runtime.prettyName}. In order to run Prisma Client on edge runtime, either:
- Use Prisma Accelerate: https://pris.ly/d/accelerate
- Use Driver Adapters: https://pris.ly/d/driver-adapters
`;
        } else {
          message = 'PrismaClient is unable to run in this browser environment, or has been bundled for the browser (running in `' + runtime.prettyName + '`).'
        }

        message += `
If this is unexpected, please open an issue: https://pris.ly/prisma-prisma-bug-report`

        throw new Error(message)
      }
    })
  }
}

exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
