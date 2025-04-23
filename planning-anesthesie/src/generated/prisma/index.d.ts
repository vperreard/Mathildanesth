
/**
 * Client
**/

import * as runtime from './runtime/library.js';
import $Types = runtime.Types // general types
import $Public = runtime.Types.Public
import $Utils = runtime.Types.Utils
import $Extensions = runtime.Types.Extensions
import $Result = runtime.Types.Result

export type PrismaPromise<T> = $Public.PrismaPromise<T>


/**
 * Model User
 * 
 */
export type User = $Result.DefaultSelection<Prisma.$UserPayload>
/**
 * Model Surgeon
 * 
 */
export type Surgeon = $Result.DefaultSelection<Prisma.$SurgeonPayload>
/**
 * Model Room
 * 
 */
export type Room = $Result.DefaultSelection<Prisma.$RoomPayload>
/**
 * Model Affectation
 * 
 */
export type Affectation = $Result.DefaultSelection<Prisma.$AffectationPayload>
/**
 * Model Leave
 * 
 */
export type Leave = $Result.DefaultSelection<Prisma.$LeavePayload>
/**
 * Model Counter
 * 
 */
export type Counter = $Result.DefaultSelection<Prisma.$CounterPayload>
/**
 * Model Frame
 * 
 */
export type Frame = $Result.DefaultSelection<Prisma.$FramePayload>
/**
 * Model Notification
 * 
 */
export type Notification = $Result.DefaultSelection<Prisma.$NotificationPayload>

/**
 * Enums
 */
export namespace $Enums {
  export const UserType: {
  MAR: 'MAR',
  IADE: 'IADE',
  Admin: 'Admin'
};

export type UserType = (typeof UserType)[keyof typeof UserType]


export const AccessLevel: {
  AdminComplet: 'AdminComplet',
  AdminPartiel: 'AdminPartiel',
  Utilisateur: 'Utilisateur'
};

export type AccessLevel = (typeof AccessLevel)[keyof typeof AccessLevel]


export const AffectationType: {
  Garde: 'Garde',
  Astreinte: 'Astreinte',
  Consultation: 'Consultation',
  BlocAnesthesie: 'BlocAnesthesie',
  BlocSupervision: 'BlocSupervision'
};

export type AffectationType = (typeof AffectationType)[keyof typeof AffectationType]


export const HalfDay: {
  Matin: 'Matin',
  ApresMidi: 'ApresMidi'
};

export type HalfDay = (typeof HalfDay)[keyof typeof HalfDay]


export const AffectationStatus: {
  GenereAuto: 'GenereAuto',
  Valide: 'Valide',
  ModifieManuel: 'ModifieManuel'
};

export type AffectationStatus = (typeof AffectationStatus)[keyof typeof AffectationStatus]


export const LeaveType: {
  CA: 'CA',
  Maladie: 'Maladie',
  Formation: 'Formation',
  Recuperation: 'Recuperation'
};

export type LeaveType = (typeof LeaveType)[keyof typeof LeaveType]


export const LeaveStatus: {
  Demande: 'Demande',
  Approuve: 'Approuve',
  Refuse: 'Refuse'
};

export type LeaveStatus = (typeof LeaveStatus)[keyof typeof LeaveStatus]


export const NotificationType: {
  ValidationConge: 'ValidationConge',
  RefusConge: 'RefusConge',
  NouveauPlanning: 'NouveauPlanning',
  DemandeChangement: 'DemandeChangement'
};

export type NotificationType = (typeof NotificationType)[keyof typeof NotificationType]


export const FrameType: {
  Bloc: 'Bloc',
  Consultation: 'Consultation',
  Garde: 'Garde'
};

export type FrameType = (typeof FrameType)[keyof typeof FrameType]


export const FrameConfiguration: {
  SemainePaire: 'SemainePaire',
  SemaineImpaire: 'SemaineImpaire'
};

export type FrameConfiguration = (typeof FrameConfiguration)[keyof typeof FrameConfiguration]

}

export type UserType = $Enums.UserType

export const UserType: typeof $Enums.UserType

export type AccessLevel = $Enums.AccessLevel

export const AccessLevel: typeof $Enums.AccessLevel

export type AffectationType = $Enums.AffectationType

export const AffectationType: typeof $Enums.AffectationType

export type HalfDay = $Enums.HalfDay

export const HalfDay: typeof $Enums.HalfDay

export type AffectationStatus = $Enums.AffectationStatus

export const AffectationStatus: typeof $Enums.AffectationStatus

export type LeaveType = $Enums.LeaveType

export const LeaveType: typeof $Enums.LeaveType

export type LeaveStatus = $Enums.LeaveStatus

export const LeaveStatus: typeof $Enums.LeaveStatus

export type NotificationType = $Enums.NotificationType

export const NotificationType: typeof $Enums.NotificationType

export type FrameType = $Enums.FrameType

export const FrameType: typeof $Enums.FrameType

export type FrameConfiguration = $Enums.FrameConfiguration

export const FrameConfiguration: typeof $Enums.FrameConfiguration

/**
 * ##  Prisma Client ʲˢ
 *
 * Type-safe database client for TypeScript & Node.js
 * @example
 * ```
 * const prisma = new PrismaClient()
 * // Fetch zero or more Users
 * const users = await prisma.user.findMany()
 * ```
 *
 *
 * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
 */
export class PrismaClient<
  ClientOptions extends Prisma.PrismaClientOptions = Prisma.PrismaClientOptions,
  U = 'log' extends keyof ClientOptions ? ClientOptions['log'] extends Array<Prisma.LogLevel | Prisma.LogDefinition> ? Prisma.GetEvents<ClientOptions['log']> : never : never,
  ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs
> {
  [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['other'] }

    /**
   * ##  Prisma Client ʲˢ
   *
   * Type-safe database client for TypeScript & Node.js
   * @example
   * ```
   * const prisma = new PrismaClient()
   * // Fetch zero or more Users
   * const users = await prisma.user.findMany()
   * ```
   *
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client).
   */

  constructor(optionsArg ?: Prisma.Subset<ClientOptions, Prisma.PrismaClientOptions>);
  $on<V extends U>(eventType: V, callback: (event: V extends 'query' ? Prisma.QueryEvent : Prisma.LogEvent) => void): PrismaClient;

  /**
   * Connect with the database
   */
  $connect(): $Utils.JsPromise<void>;

  /**
   * Disconnect from the database
   */
  $disconnect(): $Utils.JsPromise<void>;

  /**
   * Add a middleware
   * @deprecated since 4.16.0. For new code, prefer client extensions instead.
   * @see https://pris.ly/d/extensions
   */
  $use(cb: Prisma.Middleware): void

/**
   * Executes a prepared raw query and returns the number of affected rows.
   * @example
   * ```
   * const result = await prisma.$executeRaw`UPDATE User SET cool = ${true} WHERE email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Executes a raw query and returns the number of affected rows.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$executeRawUnsafe('UPDATE User SET cool = $1 WHERE email = $2 ;', true, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $executeRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<number>;

  /**
   * Performs a prepared raw query and returns the `SELECT` data.
   * @example
   * ```
   * const result = await prisma.$queryRaw`SELECT * FROM User WHERE id = ${1} OR email = ${'user@email.com'};`
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRaw<T = unknown>(query: TemplateStringsArray | Prisma.Sql, ...values: any[]): Prisma.PrismaPromise<T>;

  /**
   * Performs a raw query and returns the `SELECT` data.
   * Susceptible to SQL injections, see documentation.
   * @example
   * ```
   * const result = await prisma.$queryRawUnsafe('SELECT * FROM User WHERE id = $1 OR email = $2;', 1, 'user@email.com')
   * ```
   *
   * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/raw-database-access).
   */
  $queryRawUnsafe<T = unknown>(query: string, ...values: any[]): Prisma.PrismaPromise<T>;


  /**
   * Allows the running of a sequence of read/write operations that are guaranteed to either succeed or fail as a whole.
   * @example
   * ```
   * const [george, bob, alice] = await prisma.$transaction([
   *   prisma.user.create({ data: { name: 'George' } }),
   *   prisma.user.create({ data: { name: 'Bob' } }),
   *   prisma.user.create({ data: { name: 'Alice' } }),
   * ])
   * ```
   * 
   * Read more in our [docs](https://www.prisma.io/docs/concepts/components/prisma-client/transactions).
   */
  $transaction<P extends Prisma.PrismaPromise<any>[]>(arg: [...P], options?: { isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<runtime.Types.Utils.UnwrapTuple<P>>

  $transaction<R>(fn: (prisma: Omit<PrismaClient, runtime.ITXClientDenyList>) => $Utils.JsPromise<R>, options?: { maxWait?: number, timeout?: number, isolationLevel?: Prisma.TransactionIsolationLevel }): $Utils.JsPromise<R>


  $extends: $Extensions.ExtendsHook<"extends", Prisma.TypeMapCb<ClientOptions>, ExtArgs, $Utils.Call<Prisma.TypeMapCb<ClientOptions>, {
    extArgs: ExtArgs
  }>>

      /**
   * `prisma.user`: Exposes CRUD operations for the **User** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Users
    * const users = await prisma.user.findMany()
    * ```
    */
  get user(): Prisma.UserDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.surgeon`: Exposes CRUD operations for the **Surgeon** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Surgeons
    * const surgeons = await prisma.surgeon.findMany()
    * ```
    */
  get surgeon(): Prisma.SurgeonDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.room`: Exposes CRUD operations for the **Room** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Rooms
    * const rooms = await prisma.room.findMany()
    * ```
    */
  get room(): Prisma.RoomDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.affectation`: Exposes CRUD operations for the **Affectation** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Affectations
    * const affectations = await prisma.affectation.findMany()
    * ```
    */
  get affectation(): Prisma.AffectationDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.leave`: Exposes CRUD operations for the **Leave** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Leaves
    * const leaves = await prisma.leave.findMany()
    * ```
    */
  get leave(): Prisma.LeaveDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.counter`: Exposes CRUD operations for the **Counter** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Counters
    * const counters = await prisma.counter.findMany()
    * ```
    */
  get counter(): Prisma.CounterDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.frame`: Exposes CRUD operations for the **Frame** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Frames
    * const frames = await prisma.frame.findMany()
    * ```
    */
  get frame(): Prisma.FrameDelegate<ExtArgs, ClientOptions>;

  /**
   * `prisma.notification`: Exposes CRUD operations for the **Notification** model.
    * Example usage:
    * ```ts
    * // Fetch zero or more Notifications
    * const notifications = await prisma.notification.findMany()
    * ```
    */
  get notification(): Prisma.NotificationDelegate<ExtArgs, ClientOptions>;
}

export namespace Prisma {
  export import DMMF = runtime.DMMF

  export type PrismaPromise<T> = $Public.PrismaPromise<T>

  /**
   * Validator
   */
  export import validator = runtime.Public.validator

  /**
   * Prisma Errors
   */
  export import PrismaClientKnownRequestError = runtime.PrismaClientKnownRequestError
  export import PrismaClientUnknownRequestError = runtime.PrismaClientUnknownRequestError
  export import PrismaClientRustPanicError = runtime.PrismaClientRustPanicError
  export import PrismaClientInitializationError = runtime.PrismaClientInitializationError
  export import PrismaClientValidationError = runtime.PrismaClientValidationError

  /**
   * Re-export of sql-template-tag
   */
  export import sql = runtime.sqltag
  export import empty = runtime.empty
  export import join = runtime.join
  export import raw = runtime.raw
  export import Sql = runtime.Sql



  /**
   * Decimal.js
   */
  export import Decimal = runtime.Decimal

  export type DecimalJsLike = runtime.DecimalJsLike

  /**
   * Metrics
   */
  export type Metrics = runtime.Metrics
  export type Metric<T> = runtime.Metric<T>
  export type MetricHistogram = runtime.MetricHistogram
  export type MetricHistogramBucket = runtime.MetricHistogramBucket

  /**
  * Extensions
  */
  export import Extension = $Extensions.UserArgs
  export import getExtensionContext = runtime.Extensions.getExtensionContext
  export import Args = $Public.Args
  export import Payload = $Public.Payload
  export import Result = $Public.Result
  export import Exact = $Public.Exact

  /**
   * Prisma Client JS version: 6.6.0
   * Query Engine version: f676762280b54cd07c770017ed3711ddde35f37a
   */
  export type PrismaVersion = {
    client: string
  }

  export const prismaVersion: PrismaVersion

  /**
   * Utility Types
   */


  export import JsonObject = runtime.JsonObject
  export import JsonArray = runtime.JsonArray
  export import JsonValue = runtime.JsonValue
  export import InputJsonObject = runtime.InputJsonObject
  export import InputJsonArray = runtime.InputJsonArray
  export import InputJsonValue = runtime.InputJsonValue

  /**
   * Types of the values used to represent different kinds of `null` values when working with JSON fields.
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  namespace NullTypes {
    /**
    * Type of `Prisma.DbNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.DbNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class DbNull {
      private DbNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.JsonNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.JsonNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class JsonNull {
      private JsonNull: never
      private constructor()
    }

    /**
    * Type of `Prisma.AnyNull`.
    *
    * You cannot use other instances of this class. Please use the `Prisma.AnyNull` value.
    *
    * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
    */
    class AnyNull {
      private AnyNull: never
      private constructor()
    }
  }

  /**
   * Helper for filtering JSON entries that have `null` on the database (empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const DbNull: NullTypes.DbNull

  /**
   * Helper for filtering JSON entries that have JSON `null` values (not empty on the db)
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const JsonNull: NullTypes.JsonNull

  /**
   * Helper for filtering JSON entries that are `Prisma.DbNull` or `Prisma.JsonNull`
   *
   * @see https://www.prisma.io/docs/concepts/components/prisma-client/working-with-fields/working-with-json-fields#filtering-on-a-json-field
   */
  export const AnyNull: NullTypes.AnyNull

  type SelectAndInclude = {
    select: any
    include: any
  }

  type SelectAndOmit = {
    select: any
    omit: any
  }

  /**
   * Get the type of the value, that the Promise holds.
   */
  export type PromiseType<T extends PromiseLike<any>> = T extends PromiseLike<infer U> ? U : T;

  /**
   * Get the return type of a function which returns a Promise.
   */
  export type PromiseReturnType<T extends (...args: any) => $Utils.JsPromise<any>> = PromiseType<ReturnType<T>>

  /**
   * From T, pick a set of properties whose keys are in the union K
   */
  type Prisma__Pick<T, K extends keyof T> = {
      [P in K]: T[P];
  };


  export type Enumerable<T> = T | Array<T>;

  export type RequiredKeys<T> = {
    [K in keyof T]-?: {} extends Prisma__Pick<T, K> ? never : K
  }[keyof T]

  export type TruthyKeys<T> = keyof {
    [K in keyof T as T[K] extends false | undefined | null ? never : K]: K
  }

  export type TrueKeys<T> = TruthyKeys<Prisma__Pick<T, RequiredKeys<T>>>

  /**
   * Subset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection
   */
  export type Subset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never;
  };

  /**
   * SelectSubset
   * @desc From `T` pick properties that exist in `U`. Simple version of Intersection.
   * Additionally, it validates, if both select and include are present. If the case, it errors.
   */
  export type SelectSubset<T, U> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    (T extends SelectAndInclude
      ? 'Please either choose `select` or `include`.'
      : T extends SelectAndOmit
        ? 'Please either choose `select` or `omit`.'
        : {})

  /**
   * Subset + Intersection
   * @desc From `T` pick properties that exist in `U` and intersect `K`
   */
  export type SubsetIntersection<T, U, K> = {
    [key in keyof T]: key extends keyof U ? T[key] : never
  } &
    K

  type Without<T, U> = { [P in Exclude<keyof T, keyof U>]?: never };

  /**
   * XOR is needed to have a real mutually exclusive union type
   * https://stackoverflow.com/questions/42123407/does-typescript-support-mutually-exclusive-types
   */
  type XOR<T, U> =
    T extends object ?
    U extends object ?
      (Without<T, U> & U) | (Without<U, T> & T)
    : U : T


  /**
   * Is T a Record?
   */
  type IsObject<T extends any> = T extends Array<any>
  ? False
  : T extends Date
  ? False
  : T extends Uint8Array
  ? False
  : T extends BigInt
  ? False
  : T extends object
  ? True
  : False


  /**
   * If it's T[], return T
   */
  export type UnEnumerate<T extends unknown> = T extends Array<infer U> ? U : T

  /**
   * From ts-toolbelt
   */

  type __Either<O extends object, K extends Key> = Omit<O, K> &
    {
      // Merge all but K
      [P in K]: Prisma__Pick<O, P & keyof O> // With K possibilities
    }[K]

  type EitherStrict<O extends object, K extends Key> = Strict<__Either<O, K>>

  type EitherLoose<O extends object, K extends Key> = ComputeRaw<__Either<O, K>>

  type _Either<
    O extends object,
    K extends Key,
    strict extends Boolean
  > = {
    1: EitherStrict<O, K>
    0: EitherLoose<O, K>
  }[strict]

  type Either<
    O extends object,
    K extends Key,
    strict extends Boolean = 1
  > = O extends unknown ? _Either<O, K, strict> : never

  export type Union = any

  type PatchUndefined<O extends object, O1 extends object> = {
    [K in keyof O]: O[K] extends undefined ? At<O1, K> : O[K]
  } & {}

  /** Helper Types for "Merge" **/
  export type IntersectOf<U extends Union> = (
    U extends unknown ? (k: U) => void : never
  ) extends (k: infer I) => void
    ? I
    : never

  export type Overwrite<O extends object, O1 extends object> = {
      [K in keyof O]: K extends keyof O1 ? O1[K] : O[K];
  } & {};

  type _Merge<U extends object> = IntersectOf<Overwrite<U, {
      [K in keyof U]-?: At<U, K>;
  }>>;

  type Key = string | number | symbol;
  type AtBasic<O extends object, K extends Key> = K extends keyof O ? O[K] : never;
  type AtStrict<O extends object, K extends Key> = O[K & keyof O];
  type AtLoose<O extends object, K extends Key> = O extends unknown ? AtStrict<O, K> : never;
  export type At<O extends object, K extends Key, strict extends Boolean = 1> = {
      1: AtStrict<O, K>;
      0: AtLoose<O, K>;
  }[strict];

  export type ComputeRaw<A extends any> = A extends Function ? A : {
    [K in keyof A]: A[K];
  } & {};

  export type OptionalFlat<O> = {
    [K in keyof O]?: O[K];
  } & {};

  type _Record<K extends keyof any, T> = {
    [P in K]: T;
  };

  // cause typescript not to expand types and preserve names
  type NoExpand<T> = T extends unknown ? T : never;

  // this type assumes the passed object is entirely optional
  type AtLeast<O extends object, K extends string> = NoExpand<
    O extends unknown
    ? | (K extends keyof O ? { [P in K]: O[P] } & O : O)
      | {[P in keyof O as P extends K ? P : never]-?: O[P]} & O
    : never>;

  type _Strict<U, _U = U> = U extends unknown ? U & OptionalFlat<_Record<Exclude<Keys<_U>, keyof U>, never>> : never;

  export type Strict<U extends object> = ComputeRaw<_Strict<U>>;
  /** End Helper Types for "Merge" **/

  export type Merge<U extends object> = ComputeRaw<_Merge<Strict<U>>>;

  /**
  A [[Boolean]]
  */
  export type Boolean = True | False

  // /**
  // 1
  // */
  export type True = 1

  /**
  0
  */
  export type False = 0

  export type Not<B extends Boolean> = {
    0: 1
    1: 0
  }[B]

  export type Extends<A1 extends any, A2 extends any> = [A1] extends [never]
    ? 0 // anything `never` is false
    : A1 extends A2
    ? 1
    : 0

  export type Has<U extends Union, U1 extends Union> = Not<
    Extends<Exclude<U1, U>, U1>
  >

  export type Or<B1 extends Boolean, B2 extends Boolean> = {
    0: {
      0: 0
      1: 1
    }
    1: {
      0: 1
      1: 1
    }
  }[B1][B2]

  export type Keys<U extends Union> = U extends unknown ? keyof U : never

  type Cast<A, B> = A extends B ? A : B;

  export const type: unique symbol;



  /**
   * Used by group by
   */

  export type GetScalarType<T, O> = O extends object ? {
    [P in keyof T]: P extends keyof O
      ? O[P]
      : never
  } : never

  type FieldPaths<
    T,
    U = Omit<T, '_avg' | '_sum' | '_count' | '_min' | '_max'>
  > = IsObject<T> extends True ? U : T

  type GetHavingFields<T> = {
    [K in keyof T]: Or<
      Or<Extends<'OR', K>, Extends<'AND', K>>,
      Extends<'NOT', K>
    > extends True
      ? // infer is only needed to not hit TS limit
        // based on the brilliant idea of Pierre-Antoine Mills
        // https://github.com/microsoft/TypeScript/issues/30188#issuecomment-478938437
        T[K] extends infer TK
        ? GetHavingFields<UnEnumerate<TK> extends object ? Merge<UnEnumerate<TK>> : never>
        : never
      : {} extends FieldPaths<T[K]>
      ? never
      : K
  }[keyof T]

  /**
   * Convert tuple to union
   */
  type _TupleToUnion<T> = T extends (infer E)[] ? E : never
  type TupleToUnion<K extends readonly any[]> = _TupleToUnion<K>
  type MaybeTupleToUnion<T> = T extends any[] ? TupleToUnion<T> : T

  /**
   * Like `Pick`, but additionally can also accept an array of keys
   */
  type PickEnumerable<T, K extends Enumerable<keyof T> | keyof T> = Prisma__Pick<T, MaybeTupleToUnion<K>>

  /**
   * Exclude all keys with underscores
   */
  type ExcludeUnderscoreKeys<T extends string> = T extends `_${string}` ? never : T


  export type FieldRef<Model, FieldType> = runtime.FieldRef<Model, FieldType>

  type FieldRefInputType<Model, FieldType> = Model extends never ? never : FieldRef<Model, FieldType>


  export const ModelName: {
    User: 'User',
    Surgeon: 'Surgeon',
    Room: 'Room',
    Affectation: 'Affectation',
    Leave: 'Leave',
    Counter: 'Counter',
    Frame: 'Frame',
    Notification: 'Notification'
  };

  export type ModelName = (typeof ModelName)[keyof typeof ModelName]


  export type Datasources = {
    db?: Datasource
  }

  interface TypeMapCb<ClientOptions = {}> extends $Utils.Fn<{extArgs: $Extensions.InternalArgs }, $Utils.Record<string, any>> {
    returns: Prisma.TypeMap<this['params']['extArgs'], ClientOptions extends { omit: infer OmitOptions } ? OmitOptions : {}>
  }

  export type TypeMap<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> = {
    globalOmitOptions: {
      omit: GlobalOmitOptions
    }
    meta: {
      modelProps: "user" | "surgeon" | "room" | "affectation" | "leave" | "counter" | "frame" | "notification"
      txIsolationLevel: Prisma.TransactionIsolationLevel
    }
    model: {
      User: {
        payload: Prisma.$UserPayload<ExtArgs>
        fields: Prisma.UserFieldRefs
        operations: {
          findUnique: {
            args: Prisma.UserFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.UserFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findFirst: {
            args: Prisma.UserFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.UserFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          findMany: {
            args: Prisma.UserFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          create: {
            args: Prisma.UserCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          createMany: {
            args: Prisma.UserCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.UserCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          delete: {
            args: Prisma.UserDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          update: {
            args: Prisma.UserUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          deleteMany: {
            args: Prisma.UserDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.UserUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.UserUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>[]
          }
          upsert: {
            args: Prisma.UserUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$UserPayload>
          }
          aggregate: {
            args: Prisma.UserAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateUser>
          }
          groupBy: {
            args: Prisma.UserGroupByArgs<ExtArgs>
            result: $Utils.Optional<UserGroupByOutputType>[]
          }
          count: {
            args: Prisma.UserCountArgs<ExtArgs>
            result: $Utils.Optional<UserCountAggregateOutputType> | number
          }
        }
      }
      Surgeon: {
        payload: Prisma.$SurgeonPayload<ExtArgs>
        fields: Prisma.SurgeonFieldRefs
        operations: {
          findUnique: {
            args: Prisma.SurgeonFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.SurgeonFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          findFirst: {
            args: Prisma.SurgeonFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.SurgeonFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          findMany: {
            args: Prisma.SurgeonFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>[]
          }
          create: {
            args: Prisma.SurgeonCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          createMany: {
            args: Prisma.SurgeonCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.SurgeonCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>[]
          }
          delete: {
            args: Prisma.SurgeonDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          update: {
            args: Prisma.SurgeonUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          deleteMany: {
            args: Prisma.SurgeonDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.SurgeonUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.SurgeonUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>[]
          }
          upsert: {
            args: Prisma.SurgeonUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$SurgeonPayload>
          }
          aggregate: {
            args: Prisma.SurgeonAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateSurgeon>
          }
          groupBy: {
            args: Prisma.SurgeonGroupByArgs<ExtArgs>
            result: $Utils.Optional<SurgeonGroupByOutputType>[]
          }
          count: {
            args: Prisma.SurgeonCountArgs<ExtArgs>
            result: $Utils.Optional<SurgeonCountAggregateOutputType> | number
          }
        }
      }
      Room: {
        payload: Prisma.$RoomPayload<ExtArgs>
        fields: Prisma.RoomFieldRefs
        operations: {
          findUnique: {
            args: Prisma.RoomFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.RoomFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          findFirst: {
            args: Prisma.RoomFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.RoomFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          findMany: {
            args: Prisma.RoomFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          create: {
            args: Prisma.RoomCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          createMany: {
            args: Prisma.RoomCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.RoomCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          delete: {
            args: Prisma.RoomDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          update: {
            args: Prisma.RoomUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          deleteMany: {
            args: Prisma.RoomDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.RoomUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.RoomUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>[]
          }
          upsert: {
            args: Prisma.RoomUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$RoomPayload>
          }
          aggregate: {
            args: Prisma.RoomAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateRoom>
          }
          groupBy: {
            args: Prisma.RoomGroupByArgs<ExtArgs>
            result: $Utils.Optional<RoomGroupByOutputType>[]
          }
          count: {
            args: Prisma.RoomCountArgs<ExtArgs>
            result: $Utils.Optional<RoomCountAggregateOutputType> | number
          }
        }
      }
      Affectation: {
        payload: Prisma.$AffectationPayload<ExtArgs>
        fields: Prisma.AffectationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.AffectationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.AffectationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          findFirst: {
            args: Prisma.AffectationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.AffectationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          findMany: {
            args: Prisma.AffectationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>[]
          }
          create: {
            args: Prisma.AffectationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          createMany: {
            args: Prisma.AffectationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.AffectationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>[]
          }
          delete: {
            args: Prisma.AffectationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          update: {
            args: Prisma.AffectationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          deleteMany: {
            args: Prisma.AffectationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.AffectationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.AffectationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>[]
          }
          upsert: {
            args: Prisma.AffectationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$AffectationPayload>
          }
          aggregate: {
            args: Prisma.AffectationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateAffectation>
          }
          groupBy: {
            args: Prisma.AffectationGroupByArgs<ExtArgs>
            result: $Utils.Optional<AffectationGroupByOutputType>[]
          }
          count: {
            args: Prisma.AffectationCountArgs<ExtArgs>
            result: $Utils.Optional<AffectationCountAggregateOutputType> | number
          }
        }
      }
      Leave: {
        payload: Prisma.$LeavePayload<ExtArgs>
        fields: Prisma.LeaveFieldRefs
        operations: {
          findUnique: {
            args: Prisma.LeaveFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.LeaveFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          findFirst: {
            args: Prisma.LeaveFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.LeaveFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          findMany: {
            args: Prisma.LeaveFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>[]
          }
          create: {
            args: Prisma.LeaveCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          createMany: {
            args: Prisma.LeaveCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.LeaveCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>[]
          }
          delete: {
            args: Prisma.LeaveDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          update: {
            args: Prisma.LeaveUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          deleteMany: {
            args: Prisma.LeaveDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.LeaveUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.LeaveUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>[]
          }
          upsert: {
            args: Prisma.LeaveUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$LeavePayload>
          }
          aggregate: {
            args: Prisma.LeaveAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateLeave>
          }
          groupBy: {
            args: Prisma.LeaveGroupByArgs<ExtArgs>
            result: $Utils.Optional<LeaveGroupByOutputType>[]
          }
          count: {
            args: Prisma.LeaveCountArgs<ExtArgs>
            result: $Utils.Optional<LeaveCountAggregateOutputType> | number
          }
        }
      }
      Counter: {
        payload: Prisma.$CounterPayload<ExtArgs>
        fields: Prisma.CounterFieldRefs
        operations: {
          findUnique: {
            args: Prisma.CounterFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.CounterFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          findFirst: {
            args: Prisma.CounterFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.CounterFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          findMany: {
            args: Prisma.CounterFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>[]
          }
          create: {
            args: Prisma.CounterCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          createMany: {
            args: Prisma.CounterCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.CounterCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>[]
          }
          delete: {
            args: Prisma.CounterDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          update: {
            args: Prisma.CounterUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          deleteMany: {
            args: Prisma.CounterDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.CounterUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.CounterUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>[]
          }
          upsert: {
            args: Prisma.CounterUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$CounterPayload>
          }
          aggregate: {
            args: Prisma.CounterAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateCounter>
          }
          groupBy: {
            args: Prisma.CounterGroupByArgs<ExtArgs>
            result: $Utils.Optional<CounterGroupByOutputType>[]
          }
          count: {
            args: Prisma.CounterCountArgs<ExtArgs>
            result: $Utils.Optional<CounterCountAggregateOutputType> | number
          }
        }
      }
      Frame: {
        payload: Prisma.$FramePayload<ExtArgs>
        fields: Prisma.FrameFieldRefs
        operations: {
          findUnique: {
            args: Prisma.FrameFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.FrameFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          findFirst: {
            args: Prisma.FrameFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.FrameFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          findMany: {
            args: Prisma.FrameFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>[]
          }
          create: {
            args: Prisma.FrameCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          createMany: {
            args: Prisma.FrameCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.FrameCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>[]
          }
          delete: {
            args: Prisma.FrameDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          update: {
            args: Prisma.FrameUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          deleteMany: {
            args: Prisma.FrameDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.FrameUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.FrameUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>[]
          }
          upsert: {
            args: Prisma.FrameUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$FramePayload>
          }
          aggregate: {
            args: Prisma.FrameAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateFrame>
          }
          groupBy: {
            args: Prisma.FrameGroupByArgs<ExtArgs>
            result: $Utils.Optional<FrameGroupByOutputType>[]
          }
          count: {
            args: Prisma.FrameCountArgs<ExtArgs>
            result: $Utils.Optional<FrameCountAggregateOutputType> | number
          }
        }
      }
      Notification: {
        payload: Prisma.$NotificationPayload<ExtArgs>
        fields: Prisma.NotificationFieldRefs
        operations: {
          findUnique: {
            args: Prisma.NotificationFindUniqueArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findUniqueOrThrow: {
            args: Prisma.NotificationFindUniqueOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findFirst: {
            args: Prisma.NotificationFindFirstArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload> | null
          }
          findFirstOrThrow: {
            args: Prisma.NotificationFindFirstOrThrowArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          findMany: {
            args: Prisma.NotificationFindManyArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          create: {
            args: Prisma.NotificationCreateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          createMany: {
            args: Prisma.NotificationCreateManyArgs<ExtArgs>
            result: BatchPayload
          }
          createManyAndReturn: {
            args: Prisma.NotificationCreateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          delete: {
            args: Prisma.NotificationDeleteArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          update: {
            args: Prisma.NotificationUpdateArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          deleteMany: {
            args: Prisma.NotificationDeleteManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateMany: {
            args: Prisma.NotificationUpdateManyArgs<ExtArgs>
            result: BatchPayload
          }
          updateManyAndReturn: {
            args: Prisma.NotificationUpdateManyAndReturnArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>[]
          }
          upsert: {
            args: Prisma.NotificationUpsertArgs<ExtArgs>
            result: $Utils.PayloadToResult<Prisma.$NotificationPayload>
          }
          aggregate: {
            args: Prisma.NotificationAggregateArgs<ExtArgs>
            result: $Utils.Optional<AggregateNotification>
          }
          groupBy: {
            args: Prisma.NotificationGroupByArgs<ExtArgs>
            result: $Utils.Optional<NotificationGroupByOutputType>[]
          }
          count: {
            args: Prisma.NotificationCountArgs<ExtArgs>
            result: $Utils.Optional<NotificationCountAggregateOutputType> | number
          }
        }
      }
    }
  } & {
    other: {
      payload: any
      operations: {
        $executeRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $executeRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
        $queryRaw: {
          args: [query: TemplateStringsArray | Prisma.Sql, ...values: any[]],
          result: any
        }
        $queryRawUnsafe: {
          args: [query: string, ...values: any[]],
          result: any
        }
      }
    }
  }
  export const defineExtension: $Extensions.ExtendsHook<"define", Prisma.TypeMapCb, $Extensions.DefaultArgs>
  export type DefaultPrismaClient = PrismaClient
  export type ErrorFormat = 'pretty' | 'colorless' | 'minimal'
  export interface PrismaClientOptions {
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasources?: Datasources
    /**
     * Overwrites the datasource url from your schema.prisma file
     */
    datasourceUrl?: string
    /**
     * @default "colorless"
     */
    errorFormat?: ErrorFormat
    /**
     * @example
     * ```
     * // Defaults to stdout
     * log: ['query', 'info', 'warn', 'error']
     * 
     * // Emit as events
     * log: [
     *   { emit: 'stdout', level: 'query' },
     *   { emit: 'stdout', level: 'info' },
     *   { emit: 'stdout', level: 'warn' }
     *   { emit: 'stdout', level: 'error' }
     * ]
     * ```
     * Read more in our [docs](https://www.prisma.io/docs/reference/tools-and-interfaces/prisma-client/logging#the-log-option).
     */
    log?: (LogLevel | LogDefinition)[]
    /**
     * The default values for transactionOptions
     * maxWait ?= 2000
     * timeout ?= 5000
     */
    transactionOptions?: {
      maxWait?: number
      timeout?: number
      isolationLevel?: Prisma.TransactionIsolationLevel
    }
    /**
     * Global configuration for omitting model fields by default.
     * 
     * @example
     * ```
     * const prisma = new PrismaClient({
     *   omit: {
     *     user: {
     *       password: true
     *     }
     *   }
     * })
     * ```
     */
    omit?: Prisma.GlobalOmitConfig
  }
  export type GlobalOmitConfig = {
    user?: UserOmit
    surgeon?: SurgeonOmit
    room?: RoomOmit
    affectation?: AffectationOmit
    leave?: LeaveOmit
    counter?: CounterOmit
    frame?: FrameOmit
    notification?: NotificationOmit
  }

  /* Types for Logging */
  export type LogLevel = 'info' | 'query' | 'warn' | 'error'
  export type LogDefinition = {
    level: LogLevel
    emit: 'stdout' | 'event'
  }

  export type GetLogType<T extends LogLevel | LogDefinition> = T extends LogDefinition ? T['emit'] extends 'event' ? T['level'] : never : never
  export type GetEvents<T extends any> = T extends Array<LogLevel | LogDefinition> ?
    GetLogType<T[0]> | GetLogType<T[1]> | GetLogType<T[2]> | GetLogType<T[3]>
    : never

  export type QueryEvent = {
    timestamp: Date
    query: string
    params: string
    duration: number
    target: string
  }

  export type LogEvent = {
    timestamp: Date
    message: string
    target: string
  }
  /* End Types for Logging */


  export type PrismaAction =
    | 'findUnique'
    | 'findUniqueOrThrow'
    | 'findMany'
    | 'findFirst'
    | 'findFirstOrThrow'
    | 'create'
    | 'createMany'
    | 'createManyAndReturn'
    | 'update'
    | 'updateMany'
    | 'updateManyAndReturn'
    | 'upsert'
    | 'delete'
    | 'deleteMany'
    | 'executeRaw'
    | 'queryRaw'
    | 'aggregate'
    | 'count'
    | 'runCommandRaw'
    | 'findRaw'
    | 'groupBy'

  /**
   * These options are being passed into the middleware as "params"
   */
  export type MiddlewareParams = {
    model?: ModelName
    action: PrismaAction
    args: any
    dataPath: string[]
    runInTransaction: boolean
  }

  /**
   * The `T` type makes sure, that the `return proceed` is not forgotten in the middleware implementation
   */
  export type Middleware<T = any> = (
    params: MiddlewareParams,
    next: (params: MiddlewareParams) => $Utils.JsPromise<T>,
  ) => $Utils.JsPromise<T>

  // tested in getLogLevel.test.ts
  export function getLogLevel(log: Array<LogLevel | LogDefinition>): LogLevel | undefined;

  /**
   * `PrismaClient` proxy available in interactive transactions.
   */
  export type TransactionClient = Omit<Prisma.DefaultPrismaClient, runtime.ITXClientDenyList>

  export type Datasource = {
    url?: string
  }

  /**
   * Count Types
   */


  /**
   * Count Type UserCountOutputType
   */

  export type UserCountOutputType = {
    affectations: number
    conges: number
    notifications: number
  }

  export type UserCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | UserCountOutputTypeCountAffectationsArgs
    conges?: boolean | UserCountOutputTypeCountCongesArgs
    notifications?: boolean | UserCountOutputTypeCountNotificationsArgs
  }

  // Custom InputTypes
  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the UserCountOutputType
     */
    select?: UserCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountAffectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AffectationWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountCongesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeaveWhereInput
  }

  /**
   * UserCountOutputType without action
   */
  export type UserCountOutputTypeCountNotificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
  }


  /**
   * Count Type SurgeonCountOutputType
   */

  export type SurgeonCountOutputType = {
    affectations: number
  }

  export type SurgeonCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | SurgeonCountOutputTypeCountAffectationsArgs
  }

  // Custom InputTypes
  /**
   * SurgeonCountOutputType without action
   */
  export type SurgeonCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the SurgeonCountOutputType
     */
    select?: SurgeonCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * SurgeonCountOutputType without action
   */
  export type SurgeonCountOutputTypeCountAffectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AffectationWhereInput
  }


  /**
   * Count Type RoomCountOutputType
   */

  export type RoomCountOutputType = {
    affectations: number
  }

  export type RoomCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | RoomCountOutputTypeCountAffectationsArgs
  }

  // Custom InputTypes
  /**
   * RoomCountOutputType without action
   */
  export type RoomCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the RoomCountOutputType
     */
    select?: RoomCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * RoomCountOutputType without action
   */
  export type RoomCountOutputTypeCountAffectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AffectationWhereInput
  }


  /**
   * Count Type FrameCountOutputType
   */

  export type FrameCountOutputType = {
    affectations: number
  }

  export type FrameCountOutputTypeSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | FrameCountOutputTypeCountAffectationsArgs
  }

  // Custom InputTypes
  /**
   * FrameCountOutputType without action
   */
  export type FrameCountOutputTypeDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the FrameCountOutputType
     */
    select?: FrameCountOutputTypeSelect<ExtArgs> | null
  }

  /**
   * FrameCountOutputType without action
   */
  export type FrameCountOutputTypeCountAffectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AffectationWhereInput
  }


  /**
   * Models
   */

  /**
   * Model User
   */

  export type AggregateUser = {
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  export type UserAvgAggregateOutputType = {
    id: number | null
    droitsConges: number | null
  }

  export type UserSumAggregateOutputType = {
    id: number | null
    droitsConges: number | null
  }

  export type UserMinAggregateOutputType = {
    id: number | null
    nom: string | null
    prenom: string | null
    email: string | null
    motDePasse: string | null
    type: $Enums.UserType | null
    niveauAcces: $Enums.AccessLevel | null
    droitsConges: number | null
    dateCreation: Date | null
  }

  export type UserMaxAggregateOutputType = {
    id: number | null
    nom: string | null
    prenom: string | null
    email: string | null
    motDePasse: string | null
    type: $Enums.UserType | null
    niveauAcces: $Enums.AccessLevel | null
    droitsConges: number | null
    dateCreation: Date | null
  }

  export type UserCountAggregateOutputType = {
    id: number
    nom: number
    prenom: number
    email: number
    motDePasse: number
    type: number
    niveauAcces: number
    configurationTravail: number
    droitsConges: number
    specialites: number
    dateCreation: number
    _all: number
  }


  export type UserAvgAggregateInputType = {
    id?: true
    droitsConges?: true
  }

  export type UserSumAggregateInputType = {
    id?: true
    droitsConges?: true
  }

  export type UserMinAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    email?: true
    motDePasse?: true
    type?: true
    niveauAcces?: true
    droitsConges?: true
    dateCreation?: true
  }

  export type UserMaxAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    email?: true
    motDePasse?: true
    type?: true
    niveauAcces?: true
    droitsConges?: true
    dateCreation?: true
  }

  export type UserCountAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    email?: true
    motDePasse?: true
    type?: true
    niveauAcces?: true
    configurationTravail?: true
    droitsConges?: true
    specialites?: true
    dateCreation?: true
    _all?: true
  }

  export type UserAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which User to aggregate.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Users
    **/
    _count?: true | UserCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: UserAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: UserSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: UserMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: UserMaxAggregateInputType
  }

  export type GetUserAggregateType<T extends UserAggregateArgs> = {
        [P in keyof T & keyof AggregateUser]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateUser[P]>
      : GetScalarType<T[P], AggregateUser[P]>
  }




  export type UserGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: UserWhereInput
    orderBy?: UserOrderByWithAggregationInput | UserOrderByWithAggregationInput[]
    by: UserScalarFieldEnum[] | UserScalarFieldEnum
    having?: UserScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: UserCountAggregateInputType | true
    _avg?: UserAvgAggregateInputType
    _sum?: UserSumAggregateInputType
    _min?: UserMinAggregateInputType
    _max?: UserMaxAggregateInputType
  }

  export type UserGroupByOutputType = {
    id: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonValue
    droitsConges: number
    specialites: JsonValue | null
    dateCreation: Date
    _count: UserCountAggregateOutputType | null
    _avg: UserAvgAggregateOutputType | null
    _sum: UserSumAggregateOutputType | null
    _min: UserMinAggregateOutputType | null
    _max: UserMaxAggregateOutputType | null
  }

  type GetUserGroupByPayload<T extends UserGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<UserGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof UserGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], UserGroupByOutputType[P]>
            : GetScalarType<T[P], UserGroupByOutputType[P]>
        }
      >
    >


  export type UserSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    email?: boolean
    motDePasse?: boolean
    type?: boolean
    niveauAcces?: boolean
    configurationTravail?: boolean
    droitsConges?: boolean
    specialites?: boolean
    dateCreation?: boolean
    affectations?: boolean | User$affectationsArgs<ExtArgs>
    conges?: boolean | User$congesArgs<ExtArgs>
    compteur?: boolean | User$compteurArgs<ExtArgs>
    notifications?: boolean | User$notificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["user"]>

  export type UserSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    email?: boolean
    motDePasse?: boolean
    type?: boolean
    niveauAcces?: boolean
    configurationTravail?: boolean
    droitsConges?: boolean
    specialites?: boolean
    dateCreation?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    email?: boolean
    motDePasse?: boolean
    type?: boolean
    niveauAcces?: boolean
    configurationTravail?: boolean
    droitsConges?: boolean
    specialites?: boolean
    dateCreation?: boolean
  }, ExtArgs["result"]["user"]>

  export type UserSelectScalar = {
    id?: boolean
    nom?: boolean
    prenom?: boolean
    email?: boolean
    motDePasse?: boolean
    type?: boolean
    niveauAcces?: boolean
    configurationTravail?: boolean
    droitsConges?: boolean
    specialites?: boolean
    dateCreation?: boolean
  }

  export type UserOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "prenom" | "email" | "motDePasse" | "type" | "niveauAcces" | "configurationTravail" | "droitsConges" | "specialites" | "dateCreation", ExtArgs["result"]["user"]>
  export type UserInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | User$affectationsArgs<ExtArgs>
    conges?: boolean | User$congesArgs<ExtArgs>
    compteur?: boolean | User$compteurArgs<ExtArgs>
    notifications?: boolean | User$notificationsArgs<ExtArgs>
    _count?: boolean | UserCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type UserIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type UserIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $UserPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "User"
    objects: {
      affectations: Prisma.$AffectationPayload<ExtArgs>[]
      conges: Prisma.$LeavePayload<ExtArgs>[]
      compteur: Prisma.$CounterPayload<ExtArgs> | null
      notifications: Prisma.$NotificationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nom: string
      prenom: string
      email: string
      motDePasse: string
      type: $Enums.UserType
      niveauAcces: $Enums.AccessLevel
      configurationTravail: Prisma.JsonValue
      droitsConges: number
      specialites: Prisma.JsonValue | null
      dateCreation: Date
    }, ExtArgs["result"]["user"]>
    composites: {}
  }

  type UserGetPayload<S extends boolean | null | undefined | UserDefaultArgs> = $Result.GetResult<Prisma.$UserPayload, S>

  type UserCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<UserFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: UserCountAggregateInputType | true
    }

  export interface UserDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['User'], meta: { name: 'User' } }
    /**
     * Find zero or one User that matches the filter.
     * @param {UserFindUniqueArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends UserFindUniqueArgs>(args: SelectSubset<T, UserFindUniqueArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one User that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {UserFindUniqueOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends UserFindUniqueOrThrowArgs>(args: SelectSubset<T, UserFindUniqueOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends UserFindFirstArgs>(args?: SelectSubset<T, UserFindFirstArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first User that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindFirstOrThrowArgs} args - Arguments to find a User
     * @example
     * // Get one User
     * const user = await prisma.user.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends UserFindFirstOrThrowArgs>(args?: SelectSubset<T, UserFindFirstOrThrowArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Users that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Users
     * const users = await prisma.user.findMany()
     * 
     * // Get first 10 Users
     * const users = await prisma.user.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const userWithIdOnly = await prisma.user.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends UserFindManyArgs>(args?: SelectSubset<T, UserFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a User.
     * @param {UserCreateArgs} args - Arguments to create a User.
     * @example
     * // Create one User
     * const User = await prisma.user.create({
     *   data: {
     *     // ... data to create a User
     *   }
     * })
     * 
     */
    create<T extends UserCreateArgs>(args: SelectSubset<T, UserCreateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Users.
     * @param {UserCreateManyArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends UserCreateManyArgs>(args?: SelectSubset<T, UserCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Users and returns the data saved in the database.
     * @param {UserCreateManyAndReturnArgs} args - Arguments to create many Users.
     * @example
     * // Create many Users
     * const user = await prisma.user.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Users and only return the `id`
     * const userWithIdOnly = await prisma.user.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends UserCreateManyAndReturnArgs>(args?: SelectSubset<T, UserCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a User.
     * @param {UserDeleteArgs} args - Arguments to delete one User.
     * @example
     * // Delete one User
     * const User = await prisma.user.delete({
     *   where: {
     *     // ... filter to delete one User
     *   }
     * })
     * 
     */
    delete<T extends UserDeleteArgs>(args: SelectSubset<T, UserDeleteArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one User.
     * @param {UserUpdateArgs} args - Arguments to update one User.
     * @example
     * // Update one User
     * const user = await prisma.user.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends UserUpdateArgs>(args: SelectSubset<T, UserUpdateArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Users.
     * @param {UserDeleteManyArgs} args - Arguments to filter Users to delete.
     * @example
     * // Delete a few Users
     * const { count } = await prisma.user.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends UserDeleteManyArgs>(args?: SelectSubset<T, UserDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends UserUpdateManyArgs>(args: SelectSubset<T, UserUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Users and returns the data updated in the database.
     * @param {UserUpdateManyAndReturnArgs} args - Arguments to update many Users.
     * @example
     * // Update many Users
     * const user = await prisma.user.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Users and only return the `id`
     * const userWithIdOnly = await prisma.user.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends UserUpdateManyAndReturnArgs>(args: SelectSubset<T, UserUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one User.
     * @param {UserUpsertArgs} args - Arguments to update or create a User.
     * @example
     * // Update or create a User
     * const user = await prisma.user.upsert({
     *   create: {
     *     // ... data to create a User
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the User we want to update
     *   }
     * })
     */
    upsert<T extends UserUpsertArgs>(args: SelectSubset<T, UserUpsertArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Users.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserCountArgs} args - Arguments to filter Users to count.
     * @example
     * // Count the number of Users
     * const count = await prisma.user.count({
     *   where: {
     *     // ... the filter for the Users we want to count
     *   }
     * })
    **/
    count<T extends UserCountArgs>(
      args?: Subset<T, UserCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], UserCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends UserAggregateArgs>(args: Subset<T, UserAggregateArgs>): Prisma.PrismaPromise<GetUserAggregateType<T>>

    /**
     * Group by User.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {UserGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends UserGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: UserGroupByArgs['orderBy'] }
        : { orderBy?: UserGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, UserGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetUserGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the User model
   */
  readonly fields: UserFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for User.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__UserClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    affectations<T extends User$affectationsArgs<ExtArgs> = {}>(args?: Subset<T, User$affectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    conges<T extends User$congesArgs<ExtArgs> = {}>(args?: Subset<T, User$congesArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    compteur<T extends User$compteurArgs<ExtArgs> = {}>(args?: Subset<T, User$compteurArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    notifications<T extends User$notificationsArgs<ExtArgs> = {}>(args?: Subset<T, User$notificationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the User model
   */
  interface UserFieldRefs {
    readonly id: FieldRef<"User", 'Int'>
    readonly nom: FieldRef<"User", 'String'>
    readonly prenom: FieldRef<"User", 'String'>
    readonly email: FieldRef<"User", 'String'>
    readonly motDePasse: FieldRef<"User", 'String'>
    readonly type: FieldRef<"User", 'UserType'>
    readonly niveauAcces: FieldRef<"User", 'AccessLevel'>
    readonly configurationTravail: FieldRef<"User", 'Json'>
    readonly droitsConges: FieldRef<"User", 'Int'>
    readonly specialites: FieldRef<"User", 'Json'>
    readonly dateCreation: FieldRef<"User", 'DateTime'>
  }
    

  // Custom InputTypes
  /**
   * User findUnique
   */
  export type UserFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findUniqueOrThrow
   */
  export type UserFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User findFirst
   */
  export type UserFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findFirstOrThrow
   */
  export type UserFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which User to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Users.
     */
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User findMany
   */
  export type UserFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter, which Users to fetch.
     */
    where?: UserWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Users to fetch.
     */
    orderBy?: UserOrderByWithRelationInput | UserOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Users.
     */
    cursor?: UserWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Users from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Users.
     */
    skip?: number
    distinct?: UserScalarFieldEnum | UserScalarFieldEnum[]
  }

  /**
   * User create
   */
  export type UserCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to create a User.
     */
    data: XOR<UserCreateInput, UserUncheckedCreateInput>
  }

  /**
   * User createMany
   */
  export type UserCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User createManyAndReturn
   */
  export type UserCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to create many Users.
     */
    data: UserCreateManyInput | UserCreateManyInput[]
  }

  /**
   * User update
   */
  export type UserUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The data needed to update a User.
     */
    data: XOR<UserUpdateInput, UserUncheckedUpdateInput>
    /**
     * Choose, which User to update.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User updateMany
   */
  export type UserUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User updateManyAndReturn
   */
  export type UserUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * The data used to update Users.
     */
    data: XOR<UserUpdateManyMutationInput, UserUncheckedUpdateManyInput>
    /**
     * Filter which Users to update
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to update.
     */
    limit?: number
  }

  /**
   * User upsert
   */
  export type UserUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * The filter to search for the User to update in case it exists.
     */
    where: UserWhereUniqueInput
    /**
     * In case the User found by the `where` argument doesn't exist, create a new User with this data.
     */
    create: XOR<UserCreateInput, UserUncheckedCreateInput>
    /**
     * In case the User was found with the provided `where` argument, update it with this data.
     */
    update: XOR<UserUpdateInput, UserUncheckedUpdateInput>
  }

  /**
   * User delete
   */
  export type UserDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
    /**
     * Filter which User to delete.
     */
    where: UserWhereUniqueInput
  }

  /**
   * User deleteMany
   */
  export type UserDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Users to delete
     */
    where?: UserWhereInput
    /**
     * Limit how many Users to delete.
     */
    limit?: number
  }

  /**
   * User.affectations
   */
  export type User$affectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    where?: AffectationWhereInput
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    cursor?: AffectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * User.conges
   */
  export type User$congesArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    where?: LeaveWhereInput
    orderBy?: LeaveOrderByWithRelationInput | LeaveOrderByWithRelationInput[]
    cursor?: LeaveWhereUniqueInput
    take?: number
    skip?: number
    distinct?: LeaveScalarFieldEnum | LeaveScalarFieldEnum[]
  }

  /**
   * User.compteur
   */
  export type User$compteurArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    where?: CounterWhereInput
  }

  /**
   * User.notifications
   */
  export type User$notificationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    cursor?: NotificationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * User without action
   */
  export type UserDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the User
     */
    select?: UserSelect<ExtArgs> | null
    /**
     * Omit specific fields from the User
     */
    omit?: UserOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: UserInclude<ExtArgs> | null
  }


  /**
   * Model Surgeon
   */

  export type AggregateSurgeon = {
    _count: SurgeonCountAggregateOutputType | null
    _avg: SurgeonAvgAggregateOutputType | null
    _sum: SurgeonSumAggregateOutputType | null
    _min: SurgeonMinAggregateOutputType | null
    _max: SurgeonMaxAggregateOutputType | null
  }

  export type SurgeonAvgAggregateOutputType = {
    id: number | null
  }

  export type SurgeonSumAggregateOutputType = {
    id: number | null
  }

  export type SurgeonMinAggregateOutputType = {
    id: number | null
    nom: string | null
    prenom: string | null
    actif: boolean | null
  }

  export type SurgeonMaxAggregateOutputType = {
    id: number | null
    nom: string | null
    prenom: string | null
    actif: boolean | null
  }

  export type SurgeonCountAggregateOutputType = {
    id: number
    nom: number
    prenom: number
    specialites: number
    actif: number
    reglesSpecifiques: number
    _all: number
  }


  export type SurgeonAvgAggregateInputType = {
    id?: true
  }

  export type SurgeonSumAggregateInputType = {
    id?: true
  }

  export type SurgeonMinAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    actif?: true
  }

  export type SurgeonMaxAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    actif?: true
  }

  export type SurgeonCountAggregateInputType = {
    id?: true
    nom?: true
    prenom?: true
    specialites?: true
    actif?: true
    reglesSpecifiques?: true
    _all?: true
  }

  export type SurgeonAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Surgeon to aggregate.
     */
    where?: SurgeonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Surgeons to fetch.
     */
    orderBy?: SurgeonOrderByWithRelationInput | SurgeonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: SurgeonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Surgeons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Surgeons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Surgeons
    **/
    _count?: true | SurgeonCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: SurgeonAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: SurgeonSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: SurgeonMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: SurgeonMaxAggregateInputType
  }

  export type GetSurgeonAggregateType<T extends SurgeonAggregateArgs> = {
        [P in keyof T & keyof AggregateSurgeon]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateSurgeon[P]>
      : GetScalarType<T[P], AggregateSurgeon[P]>
  }




  export type SurgeonGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: SurgeonWhereInput
    orderBy?: SurgeonOrderByWithAggregationInput | SurgeonOrderByWithAggregationInput[]
    by: SurgeonScalarFieldEnum[] | SurgeonScalarFieldEnum
    having?: SurgeonScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: SurgeonCountAggregateInputType | true
    _avg?: SurgeonAvgAggregateInputType
    _sum?: SurgeonSumAggregateInputType
    _min?: SurgeonMinAggregateInputType
    _max?: SurgeonMaxAggregateInputType
  }

  export type SurgeonGroupByOutputType = {
    id: number
    nom: string
    prenom: string
    specialites: JsonValue
    actif: boolean
    reglesSpecifiques: JsonValue | null
    _count: SurgeonCountAggregateOutputType | null
    _avg: SurgeonAvgAggregateOutputType | null
    _sum: SurgeonSumAggregateOutputType | null
    _min: SurgeonMinAggregateOutputType | null
    _max: SurgeonMaxAggregateOutputType | null
  }

  type GetSurgeonGroupByPayload<T extends SurgeonGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<SurgeonGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof SurgeonGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], SurgeonGroupByOutputType[P]>
            : GetScalarType<T[P], SurgeonGroupByOutputType[P]>
        }
      >
    >


  export type SurgeonSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    specialites?: boolean
    actif?: boolean
    reglesSpecifiques?: boolean
    affectations?: boolean | Surgeon$affectationsArgs<ExtArgs>
    _count?: boolean | SurgeonCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["surgeon"]>

  export type SurgeonSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    specialites?: boolean
    actif?: boolean
    reglesSpecifiques?: boolean
  }, ExtArgs["result"]["surgeon"]>

  export type SurgeonSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    prenom?: boolean
    specialites?: boolean
    actif?: boolean
    reglesSpecifiques?: boolean
  }, ExtArgs["result"]["surgeon"]>

  export type SurgeonSelectScalar = {
    id?: boolean
    nom?: boolean
    prenom?: boolean
    specialites?: boolean
    actif?: boolean
    reglesSpecifiques?: boolean
  }

  export type SurgeonOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "prenom" | "specialites" | "actif" | "reglesSpecifiques", ExtArgs["result"]["surgeon"]>
  export type SurgeonInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | Surgeon$affectationsArgs<ExtArgs>
    _count?: boolean | SurgeonCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type SurgeonIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type SurgeonIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $SurgeonPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Surgeon"
    objects: {
      affectations: Prisma.$AffectationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nom: string
      prenom: string
      specialites: Prisma.JsonValue
      actif: boolean
      reglesSpecifiques: Prisma.JsonValue | null
    }, ExtArgs["result"]["surgeon"]>
    composites: {}
  }

  type SurgeonGetPayload<S extends boolean | null | undefined | SurgeonDefaultArgs> = $Result.GetResult<Prisma.$SurgeonPayload, S>

  type SurgeonCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<SurgeonFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: SurgeonCountAggregateInputType | true
    }

  export interface SurgeonDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Surgeon'], meta: { name: 'Surgeon' } }
    /**
     * Find zero or one Surgeon that matches the filter.
     * @param {SurgeonFindUniqueArgs} args - Arguments to find a Surgeon
     * @example
     * // Get one Surgeon
     * const surgeon = await prisma.surgeon.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends SurgeonFindUniqueArgs>(args: SelectSubset<T, SurgeonFindUniqueArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Surgeon that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {SurgeonFindUniqueOrThrowArgs} args - Arguments to find a Surgeon
     * @example
     * // Get one Surgeon
     * const surgeon = await prisma.surgeon.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends SurgeonFindUniqueOrThrowArgs>(args: SelectSubset<T, SurgeonFindUniqueOrThrowArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Surgeon that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonFindFirstArgs} args - Arguments to find a Surgeon
     * @example
     * // Get one Surgeon
     * const surgeon = await prisma.surgeon.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends SurgeonFindFirstArgs>(args?: SelectSubset<T, SurgeonFindFirstArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Surgeon that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonFindFirstOrThrowArgs} args - Arguments to find a Surgeon
     * @example
     * // Get one Surgeon
     * const surgeon = await prisma.surgeon.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends SurgeonFindFirstOrThrowArgs>(args?: SelectSubset<T, SurgeonFindFirstOrThrowArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Surgeons that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Surgeons
     * const surgeons = await prisma.surgeon.findMany()
     * 
     * // Get first 10 Surgeons
     * const surgeons = await prisma.surgeon.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const surgeonWithIdOnly = await prisma.surgeon.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends SurgeonFindManyArgs>(args?: SelectSubset<T, SurgeonFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Surgeon.
     * @param {SurgeonCreateArgs} args - Arguments to create a Surgeon.
     * @example
     * // Create one Surgeon
     * const Surgeon = await prisma.surgeon.create({
     *   data: {
     *     // ... data to create a Surgeon
     *   }
     * })
     * 
     */
    create<T extends SurgeonCreateArgs>(args: SelectSubset<T, SurgeonCreateArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Surgeons.
     * @param {SurgeonCreateManyArgs} args - Arguments to create many Surgeons.
     * @example
     * // Create many Surgeons
     * const surgeon = await prisma.surgeon.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends SurgeonCreateManyArgs>(args?: SelectSubset<T, SurgeonCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Surgeons and returns the data saved in the database.
     * @param {SurgeonCreateManyAndReturnArgs} args - Arguments to create many Surgeons.
     * @example
     * // Create many Surgeons
     * const surgeon = await prisma.surgeon.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Surgeons and only return the `id`
     * const surgeonWithIdOnly = await prisma.surgeon.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends SurgeonCreateManyAndReturnArgs>(args?: SelectSubset<T, SurgeonCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Surgeon.
     * @param {SurgeonDeleteArgs} args - Arguments to delete one Surgeon.
     * @example
     * // Delete one Surgeon
     * const Surgeon = await prisma.surgeon.delete({
     *   where: {
     *     // ... filter to delete one Surgeon
     *   }
     * })
     * 
     */
    delete<T extends SurgeonDeleteArgs>(args: SelectSubset<T, SurgeonDeleteArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Surgeon.
     * @param {SurgeonUpdateArgs} args - Arguments to update one Surgeon.
     * @example
     * // Update one Surgeon
     * const surgeon = await prisma.surgeon.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends SurgeonUpdateArgs>(args: SelectSubset<T, SurgeonUpdateArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Surgeons.
     * @param {SurgeonDeleteManyArgs} args - Arguments to filter Surgeons to delete.
     * @example
     * // Delete a few Surgeons
     * const { count } = await prisma.surgeon.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends SurgeonDeleteManyArgs>(args?: SelectSubset<T, SurgeonDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Surgeons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Surgeons
     * const surgeon = await prisma.surgeon.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends SurgeonUpdateManyArgs>(args: SelectSubset<T, SurgeonUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Surgeons and returns the data updated in the database.
     * @param {SurgeonUpdateManyAndReturnArgs} args - Arguments to update many Surgeons.
     * @example
     * // Update many Surgeons
     * const surgeon = await prisma.surgeon.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Surgeons and only return the `id`
     * const surgeonWithIdOnly = await prisma.surgeon.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends SurgeonUpdateManyAndReturnArgs>(args: SelectSubset<T, SurgeonUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Surgeon.
     * @param {SurgeonUpsertArgs} args - Arguments to update or create a Surgeon.
     * @example
     * // Update or create a Surgeon
     * const surgeon = await prisma.surgeon.upsert({
     *   create: {
     *     // ... data to create a Surgeon
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Surgeon we want to update
     *   }
     * })
     */
    upsert<T extends SurgeonUpsertArgs>(args: SelectSubset<T, SurgeonUpsertArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Surgeons.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonCountArgs} args - Arguments to filter Surgeons to count.
     * @example
     * // Count the number of Surgeons
     * const count = await prisma.surgeon.count({
     *   where: {
     *     // ... the filter for the Surgeons we want to count
     *   }
     * })
    **/
    count<T extends SurgeonCountArgs>(
      args?: Subset<T, SurgeonCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], SurgeonCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Surgeon.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends SurgeonAggregateArgs>(args: Subset<T, SurgeonAggregateArgs>): Prisma.PrismaPromise<GetSurgeonAggregateType<T>>

    /**
     * Group by Surgeon.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {SurgeonGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends SurgeonGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: SurgeonGroupByArgs['orderBy'] }
        : { orderBy?: SurgeonGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, SurgeonGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetSurgeonGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Surgeon model
   */
  readonly fields: SurgeonFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Surgeon.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__SurgeonClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    affectations<T extends Surgeon$affectationsArgs<ExtArgs> = {}>(args?: Subset<T, Surgeon$affectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Surgeon model
   */
  interface SurgeonFieldRefs {
    readonly id: FieldRef<"Surgeon", 'Int'>
    readonly nom: FieldRef<"Surgeon", 'String'>
    readonly prenom: FieldRef<"Surgeon", 'String'>
    readonly specialites: FieldRef<"Surgeon", 'Json'>
    readonly actif: FieldRef<"Surgeon", 'Boolean'>
    readonly reglesSpecifiques: FieldRef<"Surgeon", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Surgeon findUnique
   */
  export type SurgeonFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter, which Surgeon to fetch.
     */
    where: SurgeonWhereUniqueInput
  }

  /**
   * Surgeon findUniqueOrThrow
   */
  export type SurgeonFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter, which Surgeon to fetch.
     */
    where: SurgeonWhereUniqueInput
  }

  /**
   * Surgeon findFirst
   */
  export type SurgeonFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter, which Surgeon to fetch.
     */
    where?: SurgeonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Surgeons to fetch.
     */
    orderBy?: SurgeonOrderByWithRelationInput | SurgeonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Surgeons.
     */
    cursor?: SurgeonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Surgeons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Surgeons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Surgeons.
     */
    distinct?: SurgeonScalarFieldEnum | SurgeonScalarFieldEnum[]
  }

  /**
   * Surgeon findFirstOrThrow
   */
  export type SurgeonFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter, which Surgeon to fetch.
     */
    where?: SurgeonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Surgeons to fetch.
     */
    orderBy?: SurgeonOrderByWithRelationInput | SurgeonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Surgeons.
     */
    cursor?: SurgeonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Surgeons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Surgeons.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Surgeons.
     */
    distinct?: SurgeonScalarFieldEnum | SurgeonScalarFieldEnum[]
  }

  /**
   * Surgeon findMany
   */
  export type SurgeonFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter, which Surgeons to fetch.
     */
    where?: SurgeonWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Surgeons to fetch.
     */
    orderBy?: SurgeonOrderByWithRelationInput | SurgeonOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Surgeons.
     */
    cursor?: SurgeonWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Surgeons from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Surgeons.
     */
    skip?: number
    distinct?: SurgeonScalarFieldEnum | SurgeonScalarFieldEnum[]
  }

  /**
   * Surgeon create
   */
  export type SurgeonCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * The data needed to create a Surgeon.
     */
    data: XOR<SurgeonCreateInput, SurgeonUncheckedCreateInput>
  }

  /**
   * Surgeon createMany
   */
  export type SurgeonCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Surgeons.
     */
    data: SurgeonCreateManyInput | SurgeonCreateManyInput[]
  }

  /**
   * Surgeon createManyAndReturn
   */
  export type SurgeonCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * The data used to create many Surgeons.
     */
    data: SurgeonCreateManyInput | SurgeonCreateManyInput[]
  }

  /**
   * Surgeon update
   */
  export type SurgeonUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * The data needed to update a Surgeon.
     */
    data: XOR<SurgeonUpdateInput, SurgeonUncheckedUpdateInput>
    /**
     * Choose, which Surgeon to update.
     */
    where: SurgeonWhereUniqueInput
  }

  /**
   * Surgeon updateMany
   */
  export type SurgeonUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Surgeons.
     */
    data: XOR<SurgeonUpdateManyMutationInput, SurgeonUncheckedUpdateManyInput>
    /**
     * Filter which Surgeons to update
     */
    where?: SurgeonWhereInput
    /**
     * Limit how many Surgeons to update.
     */
    limit?: number
  }

  /**
   * Surgeon updateManyAndReturn
   */
  export type SurgeonUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * The data used to update Surgeons.
     */
    data: XOR<SurgeonUpdateManyMutationInput, SurgeonUncheckedUpdateManyInput>
    /**
     * Filter which Surgeons to update
     */
    where?: SurgeonWhereInput
    /**
     * Limit how many Surgeons to update.
     */
    limit?: number
  }

  /**
   * Surgeon upsert
   */
  export type SurgeonUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * The filter to search for the Surgeon to update in case it exists.
     */
    where: SurgeonWhereUniqueInput
    /**
     * In case the Surgeon found by the `where` argument doesn't exist, create a new Surgeon with this data.
     */
    create: XOR<SurgeonCreateInput, SurgeonUncheckedCreateInput>
    /**
     * In case the Surgeon was found with the provided `where` argument, update it with this data.
     */
    update: XOR<SurgeonUpdateInput, SurgeonUncheckedUpdateInput>
  }

  /**
   * Surgeon delete
   */
  export type SurgeonDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    /**
     * Filter which Surgeon to delete.
     */
    where: SurgeonWhereUniqueInput
  }

  /**
   * Surgeon deleteMany
   */
  export type SurgeonDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Surgeons to delete
     */
    where?: SurgeonWhereInput
    /**
     * Limit how many Surgeons to delete.
     */
    limit?: number
  }

  /**
   * Surgeon.affectations
   */
  export type Surgeon$affectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    where?: AffectationWhereInput
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    cursor?: AffectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Surgeon without action
   */
  export type SurgeonDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
  }


  /**
   * Model Room
   */

  export type AggregateRoom = {
    _count: RoomCountAggregateOutputType | null
    _avg: RoomAvgAggregateOutputType | null
    _sum: RoomSumAggregateOutputType | null
    _min: RoomMinAggregateOutputType | null
    _max: RoomMaxAggregateOutputType | null
  }

  export type RoomAvgAggregateOutputType = {
    id: number | null
    numero: number | null
  }

  export type RoomSumAggregateOutputType = {
    id: number | null
    numero: number | null
  }

  export type RoomMinAggregateOutputType = {
    id: number | null
    nom: string | null
    numero: number | null
    type: string | null
    secteur: string | null
    codeCouleur: string | null
  }

  export type RoomMaxAggregateOutputType = {
    id: number | null
    nom: string | null
    numero: number | null
    type: string | null
    secteur: string | null
    codeCouleur: string | null
  }

  export type RoomCountAggregateOutputType = {
    id: number
    nom: number
    numero: number
    type: number
    secteur: number
    codeCouleur: number
    reglesSupervision: number
    _all: number
  }


  export type RoomAvgAggregateInputType = {
    id?: true
    numero?: true
  }

  export type RoomSumAggregateInputType = {
    id?: true
    numero?: true
  }

  export type RoomMinAggregateInputType = {
    id?: true
    nom?: true
    numero?: true
    type?: true
    secteur?: true
    codeCouleur?: true
  }

  export type RoomMaxAggregateInputType = {
    id?: true
    nom?: true
    numero?: true
    type?: true
    secteur?: true
    codeCouleur?: true
  }

  export type RoomCountAggregateInputType = {
    id?: true
    nom?: true
    numero?: true
    type?: true
    secteur?: true
    codeCouleur?: true
    reglesSupervision?: true
    _all?: true
  }

  export type RoomAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Room to aggregate.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Rooms
    **/
    _count?: true | RoomCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: RoomAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: RoomSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: RoomMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: RoomMaxAggregateInputType
  }

  export type GetRoomAggregateType<T extends RoomAggregateArgs> = {
        [P in keyof T & keyof AggregateRoom]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateRoom[P]>
      : GetScalarType<T[P], AggregateRoom[P]>
  }




  export type RoomGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: RoomWhereInput
    orderBy?: RoomOrderByWithAggregationInput | RoomOrderByWithAggregationInput[]
    by: RoomScalarFieldEnum[] | RoomScalarFieldEnum
    having?: RoomScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: RoomCountAggregateInputType | true
    _avg?: RoomAvgAggregateInputType
    _sum?: RoomSumAggregateInputType
    _min?: RoomMinAggregateInputType
    _max?: RoomMaxAggregateInputType
  }

  export type RoomGroupByOutputType = {
    id: number
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision: JsonValue | null
    _count: RoomCountAggregateOutputType | null
    _avg: RoomAvgAggregateOutputType | null
    _sum: RoomSumAggregateOutputType | null
    _min: RoomMinAggregateOutputType | null
    _max: RoomMaxAggregateOutputType | null
  }

  type GetRoomGroupByPayload<T extends RoomGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<RoomGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof RoomGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], RoomGroupByOutputType[P]>
            : GetScalarType<T[P], RoomGroupByOutputType[P]>
        }
      >
    >


  export type RoomSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    numero?: boolean
    type?: boolean
    secteur?: boolean
    codeCouleur?: boolean
    reglesSupervision?: boolean
    affectations?: boolean | Room$affectationsArgs<ExtArgs>
    _count?: boolean | RoomCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["room"]>

  export type RoomSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    numero?: boolean
    type?: boolean
    secteur?: boolean
    codeCouleur?: boolean
    reglesSupervision?: boolean
  }, ExtArgs["result"]["room"]>

  export type RoomSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    numero?: boolean
    type?: boolean
    secteur?: boolean
    codeCouleur?: boolean
    reglesSupervision?: boolean
  }, ExtArgs["result"]["room"]>

  export type RoomSelectScalar = {
    id?: boolean
    nom?: boolean
    numero?: boolean
    type?: boolean
    secteur?: boolean
    codeCouleur?: boolean
    reglesSupervision?: boolean
  }

  export type RoomOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "numero" | "type" | "secteur" | "codeCouleur" | "reglesSupervision", ExtArgs["result"]["room"]>
  export type RoomInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | Room$affectationsArgs<ExtArgs>
    _count?: boolean | RoomCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type RoomIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type RoomIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $RoomPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Room"
    objects: {
      affectations: Prisma.$AffectationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nom: string
      numero: number
      type: string
      secteur: string
      codeCouleur: string
      reglesSupervision: Prisma.JsonValue | null
    }, ExtArgs["result"]["room"]>
    composites: {}
  }

  type RoomGetPayload<S extends boolean | null | undefined | RoomDefaultArgs> = $Result.GetResult<Prisma.$RoomPayload, S>

  type RoomCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<RoomFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: RoomCountAggregateInputType | true
    }

  export interface RoomDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Room'], meta: { name: 'Room' } }
    /**
     * Find zero or one Room that matches the filter.
     * @param {RoomFindUniqueArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends RoomFindUniqueArgs>(args: SelectSubset<T, RoomFindUniqueArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Room that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {RoomFindUniqueOrThrowArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends RoomFindUniqueOrThrowArgs>(args: SelectSubset<T, RoomFindUniqueOrThrowArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Room that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindFirstArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends RoomFindFirstArgs>(args?: SelectSubset<T, RoomFindFirstArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Room that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindFirstOrThrowArgs} args - Arguments to find a Room
     * @example
     * // Get one Room
     * const room = await prisma.room.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends RoomFindFirstOrThrowArgs>(args?: SelectSubset<T, RoomFindFirstOrThrowArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Rooms that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Rooms
     * const rooms = await prisma.room.findMany()
     * 
     * // Get first 10 Rooms
     * const rooms = await prisma.room.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const roomWithIdOnly = await prisma.room.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends RoomFindManyArgs>(args?: SelectSubset<T, RoomFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Room.
     * @param {RoomCreateArgs} args - Arguments to create a Room.
     * @example
     * // Create one Room
     * const Room = await prisma.room.create({
     *   data: {
     *     // ... data to create a Room
     *   }
     * })
     * 
     */
    create<T extends RoomCreateArgs>(args: SelectSubset<T, RoomCreateArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Rooms.
     * @param {RoomCreateManyArgs} args - Arguments to create many Rooms.
     * @example
     * // Create many Rooms
     * const room = await prisma.room.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends RoomCreateManyArgs>(args?: SelectSubset<T, RoomCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Rooms and returns the data saved in the database.
     * @param {RoomCreateManyAndReturnArgs} args - Arguments to create many Rooms.
     * @example
     * // Create many Rooms
     * const room = await prisma.room.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Rooms and only return the `id`
     * const roomWithIdOnly = await prisma.room.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends RoomCreateManyAndReturnArgs>(args?: SelectSubset<T, RoomCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Room.
     * @param {RoomDeleteArgs} args - Arguments to delete one Room.
     * @example
     * // Delete one Room
     * const Room = await prisma.room.delete({
     *   where: {
     *     // ... filter to delete one Room
     *   }
     * })
     * 
     */
    delete<T extends RoomDeleteArgs>(args: SelectSubset<T, RoomDeleteArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Room.
     * @param {RoomUpdateArgs} args - Arguments to update one Room.
     * @example
     * // Update one Room
     * const room = await prisma.room.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends RoomUpdateArgs>(args: SelectSubset<T, RoomUpdateArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Rooms.
     * @param {RoomDeleteManyArgs} args - Arguments to filter Rooms to delete.
     * @example
     * // Delete a few Rooms
     * const { count } = await prisma.room.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends RoomDeleteManyArgs>(args?: SelectSubset<T, RoomDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Rooms
     * const room = await prisma.room.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends RoomUpdateManyArgs>(args: SelectSubset<T, RoomUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Rooms and returns the data updated in the database.
     * @param {RoomUpdateManyAndReturnArgs} args - Arguments to update many Rooms.
     * @example
     * // Update many Rooms
     * const room = await prisma.room.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Rooms and only return the `id`
     * const roomWithIdOnly = await prisma.room.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends RoomUpdateManyAndReturnArgs>(args: SelectSubset<T, RoomUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Room.
     * @param {RoomUpsertArgs} args - Arguments to update or create a Room.
     * @example
     * // Update or create a Room
     * const room = await prisma.room.upsert({
     *   create: {
     *     // ... data to create a Room
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Room we want to update
     *   }
     * })
     */
    upsert<T extends RoomUpsertArgs>(args: SelectSubset<T, RoomUpsertArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Rooms.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomCountArgs} args - Arguments to filter Rooms to count.
     * @example
     * // Count the number of Rooms
     * const count = await prisma.room.count({
     *   where: {
     *     // ... the filter for the Rooms we want to count
     *   }
     * })
    **/
    count<T extends RoomCountArgs>(
      args?: Subset<T, RoomCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], RoomCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Room.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends RoomAggregateArgs>(args: Subset<T, RoomAggregateArgs>): Prisma.PrismaPromise<GetRoomAggregateType<T>>

    /**
     * Group by Room.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {RoomGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends RoomGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: RoomGroupByArgs['orderBy'] }
        : { orderBy?: RoomGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, RoomGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetRoomGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Room model
   */
  readonly fields: RoomFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Room.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__RoomClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    affectations<T extends Room$affectationsArgs<ExtArgs> = {}>(args?: Subset<T, Room$affectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Room model
   */
  interface RoomFieldRefs {
    readonly id: FieldRef<"Room", 'Int'>
    readonly nom: FieldRef<"Room", 'String'>
    readonly numero: FieldRef<"Room", 'Int'>
    readonly type: FieldRef<"Room", 'String'>
    readonly secteur: FieldRef<"Room", 'String'>
    readonly codeCouleur: FieldRef<"Room", 'String'>
    readonly reglesSupervision: FieldRef<"Room", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Room findUnique
   */
  export type RoomFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room findUniqueOrThrow
   */
  export type RoomFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room findFirst
   */
  export type RoomFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rooms.
     */
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room findFirstOrThrow
   */
  export type RoomFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Room to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Rooms.
     */
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room findMany
   */
  export type RoomFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter, which Rooms to fetch.
     */
    where?: RoomWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Rooms to fetch.
     */
    orderBy?: RoomOrderByWithRelationInput | RoomOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Rooms.
     */
    cursor?: RoomWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Rooms from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Rooms.
     */
    skip?: number
    distinct?: RoomScalarFieldEnum | RoomScalarFieldEnum[]
  }

  /**
   * Room create
   */
  export type RoomCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The data needed to create a Room.
     */
    data: XOR<RoomCreateInput, RoomUncheckedCreateInput>
  }

  /**
   * Room createMany
   */
  export type RoomCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Rooms.
     */
    data: RoomCreateManyInput | RoomCreateManyInput[]
  }

  /**
   * Room createManyAndReturn
   */
  export type RoomCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * The data used to create many Rooms.
     */
    data: RoomCreateManyInput | RoomCreateManyInput[]
  }

  /**
   * Room update
   */
  export type RoomUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The data needed to update a Room.
     */
    data: XOR<RoomUpdateInput, RoomUncheckedUpdateInput>
    /**
     * Choose, which Room to update.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room updateMany
   */
  export type RoomUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Rooms.
     */
    data: XOR<RoomUpdateManyMutationInput, RoomUncheckedUpdateManyInput>
    /**
     * Filter which Rooms to update
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to update.
     */
    limit?: number
  }

  /**
   * Room updateManyAndReturn
   */
  export type RoomUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * The data used to update Rooms.
     */
    data: XOR<RoomUpdateManyMutationInput, RoomUncheckedUpdateManyInput>
    /**
     * Filter which Rooms to update
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to update.
     */
    limit?: number
  }

  /**
   * Room upsert
   */
  export type RoomUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * The filter to search for the Room to update in case it exists.
     */
    where: RoomWhereUniqueInput
    /**
     * In case the Room found by the `where` argument doesn't exist, create a new Room with this data.
     */
    create: XOR<RoomCreateInput, RoomUncheckedCreateInput>
    /**
     * In case the Room was found with the provided `where` argument, update it with this data.
     */
    update: XOR<RoomUpdateInput, RoomUncheckedUpdateInput>
  }

  /**
   * Room delete
   */
  export type RoomDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    /**
     * Filter which Room to delete.
     */
    where: RoomWhereUniqueInput
  }

  /**
   * Room deleteMany
   */
  export type RoomDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Rooms to delete
     */
    where?: RoomWhereInput
    /**
     * Limit how many Rooms to delete.
     */
    limit?: number
  }

  /**
   * Room.affectations
   */
  export type Room$affectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    where?: AffectationWhereInput
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    cursor?: AffectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Room without action
   */
  export type RoomDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
  }


  /**
   * Model Affectation
   */

  export type AggregateAffectation = {
    _count: AffectationCountAggregateOutputType | null
    _avg: AffectationAvgAggregateOutputType | null
    _sum: AffectationSumAggregateOutputType | null
    _min: AffectationMinAggregateOutputType | null
    _max: AffectationMaxAggregateOutputType | null
  }

  export type AffectationAvgAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
    salleId: number | null
    chirurgienId: number | null
    trameId: number | null
  }

  export type AffectationSumAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
    salleId: number | null
    chirurgienId: number | null
    trameId: number | null
  }

  export type AffectationMinAggregateOutputType = {
    id: number | null
    date: Date | null
    demiJournee: $Enums.HalfDay | null
    type: $Enums.AffectationType | null
    specialite: string | null
    statut: $Enums.AffectationStatus | null
    situationExceptionnelle: boolean | null
    utilisateurId: number | null
    salleId: number | null
    chirurgienId: number | null
    trameId: number | null
  }

  export type AffectationMaxAggregateOutputType = {
    id: number | null
    date: Date | null
    demiJournee: $Enums.HalfDay | null
    type: $Enums.AffectationType | null
    specialite: string | null
    statut: $Enums.AffectationStatus | null
    situationExceptionnelle: boolean | null
    utilisateurId: number | null
    salleId: number | null
    chirurgienId: number | null
    trameId: number | null
  }

  export type AffectationCountAggregateOutputType = {
    id: number
    date: number
    demiJournee: number
    type: number
    specialite: number
    statut: number
    situationExceptionnelle: number
    utilisateurId: number
    salleId: number
    chirurgienId: number
    trameId: number
    _all: number
  }


  export type AffectationAvgAggregateInputType = {
    id?: true
    utilisateurId?: true
    salleId?: true
    chirurgienId?: true
    trameId?: true
  }

  export type AffectationSumAggregateInputType = {
    id?: true
    utilisateurId?: true
    salleId?: true
    chirurgienId?: true
    trameId?: true
  }

  export type AffectationMinAggregateInputType = {
    id?: true
    date?: true
    demiJournee?: true
    type?: true
    specialite?: true
    statut?: true
    situationExceptionnelle?: true
    utilisateurId?: true
    salleId?: true
    chirurgienId?: true
    trameId?: true
  }

  export type AffectationMaxAggregateInputType = {
    id?: true
    date?: true
    demiJournee?: true
    type?: true
    specialite?: true
    statut?: true
    situationExceptionnelle?: true
    utilisateurId?: true
    salleId?: true
    chirurgienId?: true
    trameId?: true
  }

  export type AffectationCountAggregateInputType = {
    id?: true
    date?: true
    demiJournee?: true
    type?: true
    specialite?: true
    statut?: true
    situationExceptionnelle?: true
    utilisateurId?: true
    salleId?: true
    chirurgienId?: true
    trameId?: true
    _all?: true
  }

  export type AffectationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Affectation to aggregate.
     */
    where?: AffectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Affectations to fetch.
     */
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: AffectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Affectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Affectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Affectations
    **/
    _count?: true | AffectationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: AffectationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: AffectationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: AffectationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: AffectationMaxAggregateInputType
  }

  export type GetAffectationAggregateType<T extends AffectationAggregateArgs> = {
        [P in keyof T & keyof AggregateAffectation]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateAffectation[P]>
      : GetScalarType<T[P], AggregateAffectation[P]>
  }




  export type AffectationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: AffectationWhereInput
    orderBy?: AffectationOrderByWithAggregationInput | AffectationOrderByWithAggregationInput[]
    by: AffectationScalarFieldEnum[] | AffectationScalarFieldEnum
    having?: AffectationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: AffectationCountAggregateInputType | true
    _avg?: AffectationAvgAggregateInputType
    _sum?: AffectationSumAggregateInputType
    _min?: AffectationMinAggregateInputType
    _max?: AffectationMaxAggregateInputType
  }

  export type AffectationGroupByOutputType = {
    id: number
    date: Date
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle: boolean
    utilisateurId: number
    salleId: number | null
    chirurgienId: number | null
    trameId: number | null
    _count: AffectationCountAggregateOutputType | null
    _avg: AffectationAvgAggregateOutputType | null
    _sum: AffectationSumAggregateOutputType | null
    _min: AffectationMinAggregateOutputType | null
    _max: AffectationMaxAggregateOutputType | null
  }

  type GetAffectationGroupByPayload<T extends AffectationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<AffectationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof AffectationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], AffectationGroupByOutputType[P]>
            : GetScalarType<T[P], AffectationGroupByOutputType[P]>
        }
      >
    >


  export type AffectationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    demiJournee?: boolean
    type?: boolean
    specialite?: boolean
    statut?: boolean
    situationExceptionnelle?: boolean
    utilisateurId?: boolean
    salleId?: boolean
    chirurgienId?: boolean
    trameId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }, ExtArgs["result"]["affectation"]>

  export type AffectationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    demiJournee?: boolean
    type?: boolean
    specialite?: boolean
    statut?: boolean
    situationExceptionnelle?: boolean
    utilisateurId?: boolean
    salleId?: boolean
    chirurgienId?: boolean
    trameId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }, ExtArgs["result"]["affectation"]>

  export type AffectationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    date?: boolean
    demiJournee?: boolean
    type?: boolean
    specialite?: boolean
    statut?: boolean
    situationExceptionnelle?: boolean
    utilisateurId?: boolean
    salleId?: boolean
    chirurgienId?: boolean
    trameId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }, ExtArgs["result"]["affectation"]>

  export type AffectationSelectScalar = {
    id?: boolean
    date?: boolean
    demiJournee?: boolean
    type?: boolean
    specialite?: boolean
    statut?: boolean
    situationExceptionnelle?: boolean
    utilisateurId?: boolean
    salleId?: boolean
    chirurgienId?: boolean
    trameId?: boolean
  }

  export type AffectationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "date" | "demiJournee" | "type" | "specialite" | "statut" | "situationExceptionnelle" | "utilisateurId" | "salleId" | "chirurgienId" | "trameId", ExtArgs["result"]["affectation"]>
  export type AffectationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }
  export type AffectationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }
  export type AffectationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
    salle?: boolean | Affectation$salleArgs<ExtArgs>
    chirurgien?: boolean | Affectation$chirurgienArgs<ExtArgs>
    trame?: boolean | Affectation$trameArgs<ExtArgs>
  }

  export type $AffectationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Affectation"
    objects: {
      utilisateur: Prisma.$UserPayload<ExtArgs>
      salle: Prisma.$RoomPayload<ExtArgs> | null
      chirurgien: Prisma.$SurgeonPayload<ExtArgs> | null
      trame: Prisma.$FramePayload<ExtArgs> | null
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      date: Date
      demiJournee: $Enums.HalfDay
      type: $Enums.AffectationType
      specialite: string
      statut: $Enums.AffectationStatus
      situationExceptionnelle: boolean
      utilisateurId: number
      salleId: number | null
      chirurgienId: number | null
      trameId: number | null
    }, ExtArgs["result"]["affectation"]>
    composites: {}
  }

  type AffectationGetPayload<S extends boolean | null | undefined | AffectationDefaultArgs> = $Result.GetResult<Prisma.$AffectationPayload, S>

  type AffectationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<AffectationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: AffectationCountAggregateInputType | true
    }

  export interface AffectationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Affectation'], meta: { name: 'Affectation' } }
    /**
     * Find zero or one Affectation that matches the filter.
     * @param {AffectationFindUniqueArgs} args - Arguments to find a Affectation
     * @example
     * // Get one Affectation
     * const affectation = await prisma.affectation.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends AffectationFindUniqueArgs>(args: SelectSubset<T, AffectationFindUniqueArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Affectation that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {AffectationFindUniqueOrThrowArgs} args - Arguments to find a Affectation
     * @example
     * // Get one Affectation
     * const affectation = await prisma.affectation.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends AffectationFindUniqueOrThrowArgs>(args: SelectSubset<T, AffectationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Affectation that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationFindFirstArgs} args - Arguments to find a Affectation
     * @example
     * // Get one Affectation
     * const affectation = await prisma.affectation.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends AffectationFindFirstArgs>(args?: SelectSubset<T, AffectationFindFirstArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Affectation that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationFindFirstOrThrowArgs} args - Arguments to find a Affectation
     * @example
     * // Get one Affectation
     * const affectation = await prisma.affectation.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends AffectationFindFirstOrThrowArgs>(args?: SelectSubset<T, AffectationFindFirstOrThrowArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Affectations that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Affectations
     * const affectations = await prisma.affectation.findMany()
     * 
     * // Get first 10 Affectations
     * const affectations = await prisma.affectation.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const affectationWithIdOnly = await prisma.affectation.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends AffectationFindManyArgs>(args?: SelectSubset<T, AffectationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Affectation.
     * @param {AffectationCreateArgs} args - Arguments to create a Affectation.
     * @example
     * // Create one Affectation
     * const Affectation = await prisma.affectation.create({
     *   data: {
     *     // ... data to create a Affectation
     *   }
     * })
     * 
     */
    create<T extends AffectationCreateArgs>(args: SelectSubset<T, AffectationCreateArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Affectations.
     * @param {AffectationCreateManyArgs} args - Arguments to create many Affectations.
     * @example
     * // Create many Affectations
     * const affectation = await prisma.affectation.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends AffectationCreateManyArgs>(args?: SelectSubset<T, AffectationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Affectations and returns the data saved in the database.
     * @param {AffectationCreateManyAndReturnArgs} args - Arguments to create many Affectations.
     * @example
     * // Create many Affectations
     * const affectation = await prisma.affectation.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Affectations and only return the `id`
     * const affectationWithIdOnly = await prisma.affectation.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends AffectationCreateManyAndReturnArgs>(args?: SelectSubset<T, AffectationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Affectation.
     * @param {AffectationDeleteArgs} args - Arguments to delete one Affectation.
     * @example
     * // Delete one Affectation
     * const Affectation = await prisma.affectation.delete({
     *   where: {
     *     // ... filter to delete one Affectation
     *   }
     * })
     * 
     */
    delete<T extends AffectationDeleteArgs>(args: SelectSubset<T, AffectationDeleteArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Affectation.
     * @param {AffectationUpdateArgs} args - Arguments to update one Affectation.
     * @example
     * // Update one Affectation
     * const affectation = await prisma.affectation.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends AffectationUpdateArgs>(args: SelectSubset<T, AffectationUpdateArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Affectations.
     * @param {AffectationDeleteManyArgs} args - Arguments to filter Affectations to delete.
     * @example
     * // Delete a few Affectations
     * const { count } = await prisma.affectation.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends AffectationDeleteManyArgs>(args?: SelectSubset<T, AffectationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Affectations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Affectations
     * const affectation = await prisma.affectation.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends AffectationUpdateManyArgs>(args: SelectSubset<T, AffectationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Affectations and returns the data updated in the database.
     * @param {AffectationUpdateManyAndReturnArgs} args - Arguments to update many Affectations.
     * @example
     * // Update many Affectations
     * const affectation = await prisma.affectation.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Affectations and only return the `id`
     * const affectationWithIdOnly = await prisma.affectation.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends AffectationUpdateManyAndReturnArgs>(args: SelectSubset<T, AffectationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Affectation.
     * @param {AffectationUpsertArgs} args - Arguments to update or create a Affectation.
     * @example
     * // Update or create a Affectation
     * const affectation = await prisma.affectation.upsert({
     *   create: {
     *     // ... data to create a Affectation
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Affectation we want to update
     *   }
     * })
     */
    upsert<T extends AffectationUpsertArgs>(args: SelectSubset<T, AffectationUpsertArgs<ExtArgs>>): Prisma__AffectationClient<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Affectations.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationCountArgs} args - Arguments to filter Affectations to count.
     * @example
     * // Count the number of Affectations
     * const count = await prisma.affectation.count({
     *   where: {
     *     // ... the filter for the Affectations we want to count
     *   }
     * })
    **/
    count<T extends AffectationCountArgs>(
      args?: Subset<T, AffectationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], AffectationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Affectation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends AffectationAggregateArgs>(args: Subset<T, AffectationAggregateArgs>): Prisma.PrismaPromise<GetAffectationAggregateType<T>>

    /**
     * Group by Affectation.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {AffectationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends AffectationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: AffectationGroupByArgs['orderBy'] }
        : { orderBy?: AffectationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, AffectationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetAffectationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Affectation model
   */
  readonly fields: AffectationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Affectation.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__AffectationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    utilisateur<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    salle<T extends Affectation$salleArgs<ExtArgs> = {}>(args?: Subset<T, Affectation$salleArgs<ExtArgs>>): Prisma__RoomClient<$Result.GetResult<Prisma.$RoomPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    chirurgien<T extends Affectation$chirurgienArgs<ExtArgs> = {}>(args?: Subset<T, Affectation$chirurgienArgs<ExtArgs>>): Prisma__SurgeonClient<$Result.GetResult<Prisma.$SurgeonPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    trame<T extends Affectation$trameArgs<ExtArgs> = {}>(args?: Subset<T, Affectation$trameArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Affectation model
   */
  interface AffectationFieldRefs {
    readonly id: FieldRef<"Affectation", 'Int'>
    readonly date: FieldRef<"Affectation", 'DateTime'>
    readonly demiJournee: FieldRef<"Affectation", 'HalfDay'>
    readonly type: FieldRef<"Affectation", 'AffectationType'>
    readonly specialite: FieldRef<"Affectation", 'String'>
    readonly statut: FieldRef<"Affectation", 'AffectationStatus'>
    readonly situationExceptionnelle: FieldRef<"Affectation", 'Boolean'>
    readonly utilisateurId: FieldRef<"Affectation", 'Int'>
    readonly salleId: FieldRef<"Affectation", 'Int'>
    readonly chirurgienId: FieldRef<"Affectation", 'Int'>
    readonly trameId: FieldRef<"Affectation", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Affectation findUnique
   */
  export type AffectationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter, which Affectation to fetch.
     */
    where: AffectationWhereUniqueInput
  }

  /**
   * Affectation findUniqueOrThrow
   */
  export type AffectationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter, which Affectation to fetch.
     */
    where: AffectationWhereUniqueInput
  }

  /**
   * Affectation findFirst
   */
  export type AffectationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter, which Affectation to fetch.
     */
    where?: AffectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Affectations to fetch.
     */
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Affectations.
     */
    cursor?: AffectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Affectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Affectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Affectations.
     */
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Affectation findFirstOrThrow
   */
  export type AffectationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter, which Affectation to fetch.
     */
    where?: AffectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Affectations to fetch.
     */
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Affectations.
     */
    cursor?: AffectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Affectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Affectations.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Affectations.
     */
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Affectation findMany
   */
  export type AffectationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter, which Affectations to fetch.
     */
    where?: AffectationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Affectations to fetch.
     */
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Affectations.
     */
    cursor?: AffectationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Affectations from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Affectations.
     */
    skip?: number
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Affectation create
   */
  export type AffectationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * The data needed to create a Affectation.
     */
    data: XOR<AffectationCreateInput, AffectationUncheckedCreateInput>
  }

  /**
   * Affectation createMany
   */
  export type AffectationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Affectations.
     */
    data: AffectationCreateManyInput | AffectationCreateManyInput[]
  }

  /**
   * Affectation createManyAndReturn
   */
  export type AffectationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * The data used to create many Affectations.
     */
    data: AffectationCreateManyInput | AffectationCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Affectation update
   */
  export type AffectationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * The data needed to update a Affectation.
     */
    data: XOR<AffectationUpdateInput, AffectationUncheckedUpdateInput>
    /**
     * Choose, which Affectation to update.
     */
    where: AffectationWhereUniqueInput
  }

  /**
   * Affectation updateMany
   */
  export type AffectationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Affectations.
     */
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyInput>
    /**
     * Filter which Affectations to update
     */
    where?: AffectationWhereInput
    /**
     * Limit how many Affectations to update.
     */
    limit?: number
  }

  /**
   * Affectation updateManyAndReturn
   */
  export type AffectationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * The data used to update Affectations.
     */
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyInput>
    /**
     * Filter which Affectations to update
     */
    where?: AffectationWhereInput
    /**
     * Limit how many Affectations to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Affectation upsert
   */
  export type AffectationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * The filter to search for the Affectation to update in case it exists.
     */
    where: AffectationWhereUniqueInput
    /**
     * In case the Affectation found by the `where` argument doesn't exist, create a new Affectation with this data.
     */
    create: XOR<AffectationCreateInput, AffectationUncheckedCreateInput>
    /**
     * In case the Affectation was found with the provided `where` argument, update it with this data.
     */
    update: XOR<AffectationUpdateInput, AffectationUncheckedUpdateInput>
  }

  /**
   * Affectation delete
   */
  export type AffectationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    /**
     * Filter which Affectation to delete.
     */
    where: AffectationWhereUniqueInput
  }

  /**
   * Affectation deleteMany
   */
  export type AffectationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Affectations to delete
     */
    where?: AffectationWhereInput
    /**
     * Limit how many Affectations to delete.
     */
    limit?: number
  }

  /**
   * Affectation.salle
   */
  export type Affectation$salleArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Room
     */
    select?: RoomSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Room
     */
    omit?: RoomOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: RoomInclude<ExtArgs> | null
    where?: RoomWhereInput
  }

  /**
   * Affectation.chirurgien
   */
  export type Affectation$chirurgienArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Surgeon
     */
    select?: SurgeonSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Surgeon
     */
    omit?: SurgeonOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: SurgeonInclude<ExtArgs> | null
    where?: SurgeonWhereInput
  }

  /**
   * Affectation.trame
   */
  export type Affectation$trameArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    where?: FrameWhereInput
  }

  /**
   * Affectation without action
   */
  export type AffectationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
  }


  /**
   * Model Leave
   */

  export type AggregateLeave = {
    _count: LeaveCountAggregateOutputType | null
    _avg: LeaveAvgAggregateOutputType | null
    _sum: LeaveSumAggregateOutputType | null
    _min: LeaveMinAggregateOutputType | null
    _max: LeaveMaxAggregateOutputType | null
  }

  export type LeaveAvgAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
  }

  export type LeaveSumAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
  }

  export type LeaveMinAggregateOutputType = {
    id: number | null
    dateDebut: Date | null
    dateFin: Date | null
    type: $Enums.LeaveType | null
    statut: $Enums.LeaveStatus | null
    commentaire: string | null
    decompte: boolean | null
    utilisateurId: number | null
  }

  export type LeaveMaxAggregateOutputType = {
    id: number | null
    dateDebut: Date | null
    dateFin: Date | null
    type: $Enums.LeaveType | null
    statut: $Enums.LeaveStatus | null
    commentaire: string | null
    decompte: boolean | null
    utilisateurId: number | null
  }

  export type LeaveCountAggregateOutputType = {
    id: number
    dateDebut: number
    dateFin: number
    type: number
    statut: number
    commentaire: number
    decompte: number
    utilisateurId: number
    _all: number
  }


  export type LeaveAvgAggregateInputType = {
    id?: true
    utilisateurId?: true
  }

  export type LeaveSumAggregateInputType = {
    id?: true
    utilisateurId?: true
  }

  export type LeaveMinAggregateInputType = {
    id?: true
    dateDebut?: true
    dateFin?: true
    type?: true
    statut?: true
    commentaire?: true
    decompte?: true
    utilisateurId?: true
  }

  export type LeaveMaxAggregateInputType = {
    id?: true
    dateDebut?: true
    dateFin?: true
    type?: true
    statut?: true
    commentaire?: true
    decompte?: true
    utilisateurId?: true
  }

  export type LeaveCountAggregateInputType = {
    id?: true
    dateDebut?: true
    dateFin?: true
    type?: true
    statut?: true
    commentaire?: true
    decompte?: true
    utilisateurId?: true
    _all?: true
  }

  export type LeaveAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Leave to aggregate.
     */
    where?: LeaveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leaves to fetch.
     */
    orderBy?: LeaveOrderByWithRelationInput | LeaveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: LeaveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leaves from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leaves.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Leaves
    **/
    _count?: true | LeaveCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: LeaveAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: LeaveSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: LeaveMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: LeaveMaxAggregateInputType
  }

  export type GetLeaveAggregateType<T extends LeaveAggregateArgs> = {
        [P in keyof T & keyof AggregateLeave]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateLeave[P]>
      : GetScalarType<T[P], AggregateLeave[P]>
  }




  export type LeaveGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: LeaveWhereInput
    orderBy?: LeaveOrderByWithAggregationInput | LeaveOrderByWithAggregationInput[]
    by: LeaveScalarFieldEnum[] | LeaveScalarFieldEnum
    having?: LeaveScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: LeaveCountAggregateInputType | true
    _avg?: LeaveAvgAggregateInputType
    _sum?: LeaveSumAggregateInputType
    _min?: LeaveMinAggregateInputType
    _max?: LeaveMaxAggregateInputType
  }

  export type LeaveGroupByOutputType = {
    id: number
    dateDebut: Date
    dateFin: Date
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire: string | null
    decompte: boolean
    utilisateurId: number
    _count: LeaveCountAggregateOutputType | null
    _avg: LeaveAvgAggregateOutputType | null
    _sum: LeaveSumAggregateOutputType | null
    _min: LeaveMinAggregateOutputType | null
    _max: LeaveMaxAggregateOutputType | null
  }

  type GetLeaveGroupByPayload<T extends LeaveGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<LeaveGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof LeaveGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], LeaveGroupByOutputType[P]>
            : GetScalarType<T[P], LeaveGroupByOutputType[P]>
        }
      >
    >


  export type LeaveSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateDebut?: boolean
    dateFin?: boolean
    type?: boolean
    statut?: boolean
    commentaire?: boolean
    decompte?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leave"]>

  export type LeaveSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateDebut?: boolean
    dateFin?: boolean
    type?: boolean
    statut?: boolean
    commentaire?: boolean
    decompte?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leave"]>

  export type LeaveSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateDebut?: boolean
    dateFin?: boolean
    type?: boolean
    statut?: boolean
    commentaire?: boolean
    decompte?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["leave"]>

  export type LeaveSelectScalar = {
    id?: boolean
    dateDebut?: boolean
    dateFin?: boolean
    type?: boolean
    statut?: boolean
    commentaire?: boolean
    decompte?: boolean
    utilisateurId?: boolean
  }

  export type LeaveOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dateDebut" | "dateFin" | "type" | "statut" | "commentaire" | "decompte" | "utilisateurId", ExtArgs["result"]["leave"]>
  export type LeaveInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LeaveIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type LeaveIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $LeavePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Leave"
    objects: {
      utilisateur: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      dateDebut: Date
      dateFin: Date
      type: $Enums.LeaveType
      statut: $Enums.LeaveStatus
      commentaire: string | null
      decompte: boolean
      utilisateurId: number
    }, ExtArgs["result"]["leave"]>
    composites: {}
  }

  type LeaveGetPayload<S extends boolean | null | undefined | LeaveDefaultArgs> = $Result.GetResult<Prisma.$LeavePayload, S>

  type LeaveCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<LeaveFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: LeaveCountAggregateInputType | true
    }

  export interface LeaveDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Leave'], meta: { name: 'Leave' } }
    /**
     * Find zero or one Leave that matches the filter.
     * @param {LeaveFindUniqueArgs} args - Arguments to find a Leave
     * @example
     * // Get one Leave
     * const leave = await prisma.leave.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends LeaveFindUniqueArgs>(args: SelectSubset<T, LeaveFindUniqueArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Leave that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {LeaveFindUniqueOrThrowArgs} args - Arguments to find a Leave
     * @example
     * // Get one Leave
     * const leave = await prisma.leave.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends LeaveFindUniqueOrThrowArgs>(args: SelectSubset<T, LeaveFindUniqueOrThrowArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Leave that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveFindFirstArgs} args - Arguments to find a Leave
     * @example
     * // Get one Leave
     * const leave = await prisma.leave.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends LeaveFindFirstArgs>(args?: SelectSubset<T, LeaveFindFirstArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Leave that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveFindFirstOrThrowArgs} args - Arguments to find a Leave
     * @example
     * // Get one Leave
     * const leave = await prisma.leave.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends LeaveFindFirstOrThrowArgs>(args?: SelectSubset<T, LeaveFindFirstOrThrowArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Leaves that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Leaves
     * const leaves = await prisma.leave.findMany()
     * 
     * // Get first 10 Leaves
     * const leaves = await prisma.leave.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const leaveWithIdOnly = await prisma.leave.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends LeaveFindManyArgs>(args?: SelectSubset<T, LeaveFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Leave.
     * @param {LeaveCreateArgs} args - Arguments to create a Leave.
     * @example
     * // Create one Leave
     * const Leave = await prisma.leave.create({
     *   data: {
     *     // ... data to create a Leave
     *   }
     * })
     * 
     */
    create<T extends LeaveCreateArgs>(args: SelectSubset<T, LeaveCreateArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Leaves.
     * @param {LeaveCreateManyArgs} args - Arguments to create many Leaves.
     * @example
     * // Create many Leaves
     * const leave = await prisma.leave.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends LeaveCreateManyArgs>(args?: SelectSubset<T, LeaveCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Leaves and returns the data saved in the database.
     * @param {LeaveCreateManyAndReturnArgs} args - Arguments to create many Leaves.
     * @example
     * // Create many Leaves
     * const leave = await prisma.leave.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Leaves and only return the `id`
     * const leaveWithIdOnly = await prisma.leave.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends LeaveCreateManyAndReturnArgs>(args?: SelectSubset<T, LeaveCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Leave.
     * @param {LeaveDeleteArgs} args - Arguments to delete one Leave.
     * @example
     * // Delete one Leave
     * const Leave = await prisma.leave.delete({
     *   where: {
     *     // ... filter to delete one Leave
     *   }
     * })
     * 
     */
    delete<T extends LeaveDeleteArgs>(args: SelectSubset<T, LeaveDeleteArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Leave.
     * @param {LeaveUpdateArgs} args - Arguments to update one Leave.
     * @example
     * // Update one Leave
     * const leave = await prisma.leave.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends LeaveUpdateArgs>(args: SelectSubset<T, LeaveUpdateArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Leaves.
     * @param {LeaveDeleteManyArgs} args - Arguments to filter Leaves to delete.
     * @example
     * // Delete a few Leaves
     * const { count } = await prisma.leave.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends LeaveDeleteManyArgs>(args?: SelectSubset<T, LeaveDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Leaves.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Leaves
     * const leave = await prisma.leave.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends LeaveUpdateManyArgs>(args: SelectSubset<T, LeaveUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Leaves and returns the data updated in the database.
     * @param {LeaveUpdateManyAndReturnArgs} args - Arguments to update many Leaves.
     * @example
     * // Update many Leaves
     * const leave = await prisma.leave.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Leaves and only return the `id`
     * const leaveWithIdOnly = await prisma.leave.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends LeaveUpdateManyAndReturnArgs>(args: SelectSubset<T, LeaveUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Leave.
     * @param {LeaveUpsertArgs} args - Arguments to update or create a Leave.
     * @example
     * // Update or create a Leave
     * const leave = await prisma.leave.upsert({
     *   create: {
     *     // ... data to create a Leave
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Leave we want to update
     *   }
     * })
     */
    upsert<T extends LeaveUpsertArgs>(args: SelectSubset<T, LeaveUpsertArgs<ExtArgs>>): Prisma__LeaveClient<$Result.GetResult<Prisma.$LeavePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Leaves.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveCountArgs} args - Arguments to filter Leaves to count.
     * @example
     * // Count the number of Leaves
     * const count = await prisma.leave.count({
     *   where: {
     *     // ... the filter for the Leaves we want to count
     *   }
     * })
    **/
    count<T extends LeaveCountArgs>(
      args?: Subset<T, LeaveCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], LeaveCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Leave.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends LeaveAggregateArgs>(args: Subset<T, LeaveAggregateArgs>): Prisma.PrismaPromise<GetLeaveAggregateType<T>>

    /**
     * Group by Leave.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {LeaveGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends LeaveGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: LeaveGroupByArgs['orderBy'] }
        : { orderBy?: LeaveGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, LeaveGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetLeaveGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Leave model
   */
  readonly fields: LeaveFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Leave.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__LeaveClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    utilisateur<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Leave model
   */
  interface LeaveFieldRefs {
    readonly id: FieldRef<"Leave", 'Int'>
    readonly dateDebut: FieldRef<"Leave", 'DateTime'>
    readonly dateFin: FieldRef<"Leave", 'DateTime'>
    readonly type: FieldRef<"Leave", 'LeaveType'>
    readonly statut: FieldRef<"Leave", 'LeaveStatus'>
    readonly commentaire: FieldRef<"Leave", 'String'>
    readonly decompte: FieldRef<"Leave", 'Boolean'>
    readonly utilisateurId: FieldRef<"Leave", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Leave findUnique
   */
  export type LeaveFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter, which Leave to fetch.
     */
    where: LeaveWhereUniqueInput
  }

  /**
   * Leave findUniqueOrThrow
   */
  export type LeaveFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter, which Leave to fetch.
     */
    where: LeaveWhereUniqueInput
  }

  /**
   * Leave findFirst
   */
  export type LeaveFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter, which Leave to fetch.
     */
    where?: LeaveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leaves to fetch.
     */
    orderBy?: LeaveOrderByWithRelationInput | LeaveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Leaves.
     */
    cursor?: LeaveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leaves from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leaves.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Leaves.
     */
    distinct?: LeaveScalarFieldEnum | LeaveScalarFieldEnum[]
  }

  /**
   * Leave findFirstOrThrow
   */
  export type LeaveFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter, which Leave to fetch.
     */
    where?: LeaveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leaves to fetch.
     */
    orderBy?: LeaveOrderByWithRelationInput | LeaveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Leaves.
     */
    cursor?: LeaveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leaves from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leaves.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Leaves.
     */
    distinct?: LeaveScalarFieldEnum | LeaveScalarFieldEnum[]
  }

  /**
   * Leave findMany
   */
  export type LeaveFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter, which Leaves to fetch.
     */
    where?: LeaveWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Leaves to fetch.
     */
    orderBy?: LeaveOrderByWithRelationInput | LeaveOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Leaves.
     */
    cursor?: LeaveWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Leaves from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Leaves.
     */
    skip?: number
    distinct?: LeaveScalarFieldEnum | LeaveScalarFieldEnum[]
  }

  /**
   * Leave create
   */
  export type LeaveCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * The data needed to create a Leave.
     */
    data: XOR<LeaveCreateInput, LeaveUncheckedCreateInput>
  }

  /**
   * Leave createMany
   */
  export type LeaveCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Leaves.
     */
    data: LeaveCreateManyInput | LeaveCreateManyInput[]
  }

  /**
   * Leave createManyAndReturn
   */
  export type LeaveCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * The data used to create many Leaves.
     */
    data: LeaveCreateManyInput | LeaveCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Leave update
   */
  export type LeaveUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * The data needed to update a Leave.
     */
    data: XOR<LeaveUpdateInput, LeaveUncheckedUpdateInput>
    /**
     * Choose, which Leave to update.
     */
    where: LeaveWhereUniqueInput
  }

  /**
   * Leave updateMany
   */
  export type LeaveUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Leaves.
     */
    data: XOR<LeaveUpdateManyMutationInput, LeaveUncheckedUpdateManyInput>
    /**
     * Filter which Leaves to update
     */
    where?: LeaveWhereInput
    /**
     * Limit how many Leaves to update.
     */
    limit?: number
  }

  /**
   * Leave updateManyAndReturn
   */
  export type LeaveUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * The data used to update Leaves.
     */
    data: XOR<LeaveUpdateManyMutationInput, LeaveUncheckedUpdateManyInput>
    /**
     * Filter which Leaves to update
     */
    where?: LeaveWhereInput
    /**
     * Limit how many Leaves to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Leave upsert
   */
  export type LeaveUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * The filter to search for the Leave to update in case it exists.
     */
    where: LeaveWhereUniqueInput
    /**
     * In case the Leave found by the `where` argument doesn't exist, create a new Leave with this data.
     */
    create: XOR<LeaveCreateInput, LeaveUncheckedCreateInput>
    /**
     * In case the Leave was found with the provided `where` argument, update it with this data.
     */
    update: XOR<LeaveUpdateInput, LeaveUncheckedUpdateInput>
  }

  /**
   * Leave delete
   */
  export type LeaveDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
    /**
     * Filter which Leave to delete.
     */
    where: LeaveWhereUniqueInput
  }

  /**
   * Leave deleteMany
   */
  export type LeaveDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Leaves to delete
     */
    where?: LeaveWhereInput
    /**
     * Limit how many Leaves to delete.
     */
    limit?: number
  }

  /**
   * Leave without action
   */
  export type LeaveDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Leave
     */
    select?: LeaveSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Leave
     */
    omit?: LeaveOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: LeaveInclude<ExtArgs> | null
  }


  /**
   * Model Counter
   */

  export type AggregateCounter = {
    _count: CounterCountAggregateOutputType | null
    _avg: CounterAvgAggregateOutputType | null
    _sum: CounterSumAggregateOutputType | null
    _min: CounterMinAggregateOutputType | null
    _max: CounterMaxAggregateOutputType | null
  }

  export type CounterAvgAggregateOutputType = {
    id: number | null
    annee: number | null
    congesPris: number | null
    congesRestants: number | null
    heuresSupplementaires: number | null
    utilisateurId: number | null
  }

  export type CounterSumAggregateOutputType = {
    id: number | null
    annee: number | null
    congesPris: number | null
    congesRestants: number | null
    heuresSupplementaires: number | null
    utilisateurId: number | null
  }

  export type CounterMinAggregateOutputType = {
    id: number | null
    annee: number | null
    congesPris: number | null
    congesRestants: number | null
    heuresSupplementaires: number | null
    utilisateurId: number | null
  }

  export type CounterMaxAggregateOutputType = {
    id: number | null
    annee: number | null
    congesPris: number | null
    congesRestants: number | null
    heuresSupplementaires: number | null
    utilisateurId: number | null
  }

  export type CounterCountAggregateOutputType = {
    id: number
    annee: number
    congesPris: number
    congesRestants: number
    heuresSupplementaires: number
    statsSpecialites: number
    statsGardes: number
    utilisateurId: number
    _all: number
  }


  export type CounterAvgAggregateInputType = {
    id?: true
    annee?: true
    congesPris?: true
    congesRestants?: true
    heuresSupplementaires?: true
    utilisateurId?: true
  }

  export type CounterSumAggregateInputType = {
    id?: true
    annee?: true
    congesPris?: true
    congesRestants?: true
    heuresSupplementaires?: true
    utilisateurId?: true
  }

  export type CounterMinAggregateInputType = {
    id?: true
    annee?: true
    congesPris?: true
    congesRestants?: true
    heuresSupplementaires?: true
    utilisateurId?: true
  }

  export type CounterMaxAggregateInputType = {
    id?: true
    annee?: true
    congesPris?: true
    congesRestants?: true
    heuresSupplementaires?: true
    utilisateurId?: true
  }

  export type CounterCountAggregateInputType = {
    id?: true
    annee?: true
    congesPris?: true
    congesRestants?: true
    heuresSupplementaires?: true
    statsSpecialites?: true
    statsGardes?: true
    utilisateurId?: true
    _all?: true
  }

  export type CounterAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Counter to aggregate.
     */
    where?: CounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Counters to fetch.
     */
    orderBy?: CounterOrderByWithRelationInput | CounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: CounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Counters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Counters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Counters
    **/
    _count?: true | CounterCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: CounterAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: CounterSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: CounterMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: CounterMaxAggregateInputType
  }

  export type GetCounterAggregateType<T extends CounterAggregateArgs> = {
        [P in keyof T & keyof AggregateCounter]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateCounter[P]>
      : GetScalarType<T[P], AggregateCounter[P]>
  }




  export type CounterGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: CounterWhereInput
    orderBy?: CounterOrderByWithAggregationInput | CounterOrderByWithAggregationInput[]
    by: CounterScalarFieldEnum[] | CounterScalarFieldEnum
    having?: CounterScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: CounterCountAggregateInputType | true
    _avg?: CounterAvgAggregateInputType
    _sum?: CounterSumAggregateInputType
    _min?: CounterMinAggregateInputType
    _max?: CounterMaxAggregateInputType
  }

  export type CounterGroupByOutputType = {
    id: number
    annee: number
    congesPris: number
    congesRestants: number
    heuresSupplementaires: number
    statsSpecialites: JsonValue | null
    statsGardes: JsonValue | null
    utilisateurId: number
    _count: CounterCountAggregateOutputType | null
    _avg: CounterAvgAggregateOutputType | null
    _sum: CounterSumAggregateOutputType | null
    _min: CounterMinAggregateOutputType | null
    _max: CounterMaxAggregateOutputType | null
  }

  type GetCounterGroupByPayload<T extends CounterGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<CounterGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof CounterGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], CounterGroupByOutputType[P]>
            : GetScalarType<T[P], CounterGroupByOutputType[P]>
        }
      >
    >


  export type CounterSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    annee?: boolean
    congesPris?: boolean
    congesRestants?: boolean
    heuresSupplementaires?: boolean
    statsSpecialites?: boolean
    statsGardes?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["counter"]>

  export type CounterSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    annee?: boolean
    congesPris?: boolean
    congesRestants?: boolean
    heuresSupplementaires?: boolean
    statsSpecialites?: boolean
    statsGardes?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["counter"]>

  export type CounterSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    annee?: boolean
    congesPris?: boolean
    congesRestants?: boolean
    heuresSupplementaires?: boolean
    statsSpecialites?: boolean
    statsGardes?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["counter"]>

  export type CounterSelectScalar = {
    id?: boolean
    annee?: boolean
    congesPris?: boolean
    congesRestants?: boolean
    heuresSupplementaires?: boolean
    statsSpecialites?: boolean
    statsGardes?: boolean
    utilisateurId?: boolean
  }

  export type CounterOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "annee" | "congesPris" | "congesRestants" | "heuresSupplementaires" | "statsSpecialites" | "statsGardes" | "utilisateurId", ExtArgs["result"]["counter"]>
  export type CounterInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CounterIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type CounterIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $CounterPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Counter"
    objects: {
      utilisateur: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      annee: number
      congesPris: number
      congesRestants: number
      heuresSupplementaires: number
      statsSpecialites: Prisma.JsonValue | null
      statsGardes: Prisma.JsonValue | null
      utilisateurId: number
    }, ExtArgs["result"]["counter"]>
    composites: {}
  }

  type CounterGetPayload<S extends boolean | null | undefined | CounterDefaultArgs> = $Result.GetResult<Prisma.$CounterPayload, S>

  type CounterCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<CounterFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: CounterCountAggregateInputType | true
    }

  export interface CounterDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Counter'], meta: { name: 'Counter' } }
    /**
     * Find zero or one Counter that matches the filter.
     * @param {CounterFindUniqueArgs} args - Arguments to find a Counter
     * @example
     * // Get one Counter
     * const counter = await prisma.counter.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends CounterFindUniqueArgs>(args: SelectSubset<T, CounterFindUniqueArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Counter that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {CounterFindUniqueOrThrowArgs} args - Arguments to find a Counter
     * @example
     * // Get one Counter
     * const counter = await prisma.counter.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends CounterFindUniqueOrThrowArgs>(args: SelectSubset<T, CounterFindUniqueOrThrowArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Counter that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterFindFirstArgs} args - Arguments to find a Counter
     * @example
     * // Get one Counter
     * const counter = await prisma.counter.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends CounterFindFirstArgs>(args?: SelectSubset<T, CounterFindFirstArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Counter that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterFindFirstOrThrowArgs} args - Arguments to find a Counter
     * @example
     * // Get one Counter
     * const counter = await prisma.counter.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends CounterFindFirstOrThrowArgs>(args?: SelectSubset<T, CounterFindFirstOrThrowArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Counters that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Counters
     * const counters = await prisma.counter.findMany()
     * 
     * // Get first 10 Counters
     * const counters = await prisma.counter.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const counterWithIdOnly = await prisma.counter.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends CounterFindManyArgs>(args?: SelectSubset<T, CounterFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Counter.
     * @param {CounterCreateArgs} args - Arguments to create a Counter.
     * @example
     * // Create one Counter
     * const Counter = await prisma.counter.create({
     *   data: {
     *     // ... data to create a Counter
     *   }
     * })
     * 
     */
    create<T extends CounterCreateArgs>(args: SelectSubset<T, CounterCreateArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Counters.
     * @param {CounterCreateManyArgs} args - Arguments to create many Counters.
     * @example
     * // Create many Counters
     * const counter = await prisma.counter.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends CounterCreateManyArgs>(args?: SelectSubset<T, CounterCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Counters and returns the data saved in the database.
     * @param {CounterCreateManyAndReturnArgs} args - Arguments to create many Counters.
     * @example
     * // Create many Counters
     * const counter = await prisma.counter.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Counters and only return the `id`
     * const counterWithIdOnly = await prisma.counter.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends CounterCreateManyAndReturnArgs>(args?: SelectSubset<T, CounterCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Counter.
     * @param {CounterDeleteArgs} args - Arguments to delete one Counter.
     * @example
     * // Delete one Counter
     * const Counter = await prisma.counter.delete({
     *   where: {
     *     // ... filter to delete one Counter
     *   }
     * })
     * 
     */
    delete<T extends CounterDeleteArgs>(args: SelectSubset<T, CounterDeleteArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Counter.
     * @param {CounterUpdateArgs} args - Arguments to update one Counter.
     * @example
     * // Update one Counter
     * const counter = await prisma.counter.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends CounterUpdateArgs>(args: SelectSubset<T, CounterUpdateArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Counters.
     * @param {CounterDeleteManyArgs} args - Arguments to filter Counters to delete.
     * @example
     * // Delete a few Counters
     * const { count } = await prisma.counter.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends CounterDeleteManyArgs>(args?: SelectSubset<T, CounterDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Counters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Counters
     * const counter = await prisma.counter.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends CounterUpdateManyArgs>(args: SelectSubset<T, CounterUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Counters and returns the data updated in the database.
     * @param {CounterUpdateManyAndReturnArgs} args - Arguments to update many Counters.
     * @example
     * // Update many Counters
     * const counter = await prisma.counter.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Counters and only return the `id`
     * const counterWithIdOnly = await prisma.counter.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends CounterUpdateManyAndReturnArgs>(args: SelectSubset<T, CounterUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Counter.
     * @param {CounterUpsertArgs} args - Arguments to update or create a Counter.
     * @example
     * // Update or create a Counter
     * const counter = await prisma.counter.upsert({
     *   create: {
     *     // ... data to create a Counter
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Counter we want to update
     *   }
     * })
     */
    upsert<T extends CounterUpsertArgs>(args: SelectSubset<T, CounterUpsertArgs<ExtArgs>>): Prisma__CounterClient<$Result.GetResult<Prisma.$CounterPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Counters.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterCountArgs} args - Arguments to filter Counters to count.
     * @example
     * // Count the number of Counters
     * const count = await prisma.counter.count({
     *   where: {
     *     // ... the filter for the Counters we want to count
     *   }
     * })
    **/
    count<T extends CounterCountArgs>(
      args?: Subset<T, CounterCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], CounterCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Counter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends CounterAggregateArgs>(args: Subset<T, CounterAggregateArgs>): Prisma.PrismaPromise<GetCounterAggregateType<T>>

    /**
     * Group by Counter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {CounterGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends CounterGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: CounterGroupByArgs['orderBy'] }
        : { orderBy?: CounterGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, CounterGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetCounterGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Counter model
   */
  readonly fields: CounterFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Counter.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__CounterClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    utilisateur<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Counter model
   */
  interface CounterFieldRefs {
    readonly id: FieldRef<"Counter", 'Int'>
    readonly annee: FieldRef<"Counter", 'Int'>
    readonly congesPris: FieldRef<"Counter", 'Int'>
    readonly congesRestants: FieldRef<"Counter", 'Int'>
    readonly heuresSupplementaires: FieldRef<"Counter", 'Int'>
    readonly statsSpecialites: FieldRef<"Counter", 'Json'>
    readonly statsGardes: FieldRef<"Counter", 'Json'>
    readonly utilisateurId: FieldRef<"Counter", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Counter findUnique
   */
  export type CounterFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter, which Counter to fetch.
     */
    where: CounterWhereUniqueInput
  }

  /**
   * Counter findUniqueOrThrow
   */
  export type CounterFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter, which Counter to fetch.
     */
    where: CounterWhereUniqueInput
  }

  /**
   * Counter findFirst
   */
  export type CounterFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter, which Counter to fetch.
     */
    where?: CounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Counters to fetch.
     */
    orderBy?: CounterOrderByWithRelationInput | CounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Counters.
     */
    cursor?: CounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Counters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Counters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Counters.
     */
    distinct?: CounterScalarFieldEnum | CounterScalarFieldEnum[]
  }

  /**
   * Counter findFirstOrThrow
   */
  export type CounterFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter, which Counter to fetch.
     */
    where?: CounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Counters to fetch.
     */
    orderBy?: CounterOrderByWithRelationInput | CounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Counters.
     */
    cursor?: CounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Counters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Counters.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Counters.
     */
    distinct?: CounterScalarFieldEnum | CounterScalarFieldEnum[]
  }

  /**
   * Counter findMany
   */
  export type CounterFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter, which Counters to fetch.
     */
    where?: CounterWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Counters to fetch.
     */
    orderBy?: CounterOrderByWithRelationInput | CounterOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Counters.
     */
    cursor?: CounterWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Counters from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Counters.
     */
    skip?: number
    distinct?: CounterScalarFieldEnum | CounterScalarFieldEnum[]
  }

  /**
   * Counter create
   */
  export type CounterCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * The data needed to create a Counter.
     */
    data: XOR<CounterCreateInput, CounterUncheckedCreateInput>
  }

  /**
   * Counter createMany
   */
  export type CounterCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Counters.
     */
    data: CounterCreateManyInput | CounterCreateManyInput[]
  }

  /**
   * Counter createManyAndReturn
   */
  export type CounterCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * The data used to create many Counters.
     */
    data: CounterCreateManyInput | CounterCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Counter update
   */
  export type CounterUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * The data needed to update a Counter.
     */
    data: XOR<CounterUpdateInput, CounterUncheckedUpdateInput>
    /**
     * Choose, which Counter to update.
     */
    where: CounterWhereUniqueInput
  }

  /**
   * Counter updateMany
   */
  export type CounterUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Counters.
     */
    data: XOR<CounterUpdateManyMutationInput, CounterUncheckedUpdateManyInput>
    /**
     * Filter which Counters to update
     */
    where?: CounterWhereInput
    /**
     * Limit how many Counters to update.
     */
    limit?: number
  }

  /**
   * Counter updateManyAndReturn
   */
  export type CounterUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * The data used to update Counters.
     */
    data: XOR<CounterUpdateManyMutationInput, CounterUncheckedUpdateManyInput>
    /**
     * Filter which Counters to update
     */
    where?: CounterWhereInput
    /**
     * Limit how many Counters to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Counter upsert
   */
  export type CounterUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * The filter to search for the Counter to update in case it exists.
     */
    where: CounterWhereUniqueInput
    /**
     * In case the Counter found by the `where` argument doesn't exist, create a new Counter with this data.
     */
    create: XOR<CounterCreateInput, CounterUncheckedCreateInput>
    /**
     * In case the Counter was found with the provided `where` argument, update it with this data.
     */
    update: XOR<CounterUpdateInput, CounterUncheckedUpdateInput>
  }

  /**
   * Counter delete
   */
  export type CounterDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
    /**
     * Filter which Counter to delete.
     */
    where: CounterWhereUniqueInput
  }

  /**
   * Counter deleteMany
   */
  export type CounterDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Counters to delete
     */
    where?: CounterWhereInput
    /**
     * Limit how many Counters to delete.
     */
    limit?: number
  }

  /**
   * Counter without action
   */
  export type CounterDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Counter
     */
    select?: CounterSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Counter
     */
    omit?: CounterOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: CounterInclude<ExtArgs> | null
  }


  /**
   * Model Frame
   */

  export type AggregateFrame = {
    _count: FrameCountAggregateOutputType | null
    _avg: FrameAvgAggregateOutputType | null
    _sum: FrameSumAggregateOutputType | null
    _min: FrameMinAggregateOutputType | null
    _max: FrameMaxAggregateOutputType | null
  }

  export type FrameAvgAggregateOutputType = {
    id: number | null
  }

  export type FrameSumAggregateOutputType = {
    id: number | null
  }

  export type FrameMinAggregateOutputType = {
    id: number | null
    nom: string | null
    type: $Enums.FrameType | null
    configuration: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | null
    dateFinValidite: Date | null
  }

  export type FrameMaxAggregateOutputType = {
    id: number | null
    nom: string | null
    type: $Enums.FrameType | null
    configuration: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | null
    dateFinValidite: Date | null
  }

  export type FrameCountAggregateOutputType = {
    id: number
    nom: number
    type: number
    configuration: number
    dateDebutValidite: number
    dateFinValidite: number
    details: number
    _all: number
  }


  export type FrameAvgAggregateInputType = {
    id?: true
  }

  export type FrameSumAggregateInputType = {
    id?: true
  }

  export type FrameMinAggregateInputType = {
    id?: true
    nom?: true
    type?: true
    configuration?: true
    dateDebutValidite?: true
    dateFinValidite?: true
  }

  export type FrameMaxAggregateInputType = {
    id?: true
    nom?: true
    type?: true
    configuration?: true
    dateDebutValidite?: true
    dateFinValidite?: true
  }

  export type FrameCountAggregateInputType = {
    id?: true
    nom?: true
    type?: true
    configuration?: true
    dateDebutValidite?: true
    dateFinValidite?: true
    details?: true
    _all?: true
  }

  export type FrameAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Frame to aggregate.
     */
    where?: FrameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Frames to fetch.
     */
    orderBy?: FrameOrderByWithRelationInput | FrameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: FrameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Frames from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Frames.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Frames
    **/
    _count?: true | FrameCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: FrameAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: FrameSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: FrameMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: FrameMaxAggregateInputType
  }

  export type GetFrameAggregateType<T extends FrameAggregateArgs> = {
        [P in keyof T & keyof AggregateFrame]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateFrame[P]>
      : GetScalarType<T[P], AggregateFrame[P]>
  }




  export type FrameGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: FrameWhereInput
    orderBy?: FrameOrderByWithAggregationInput | FrameOrderByWithAggregationInput[]
    by: FrameScalarFieldEnum[] | FrameScalarFieldEnum
    having?: FrameScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: FrameCountAggregateInputType | true
    _avg?: FrameAvgAggregateInputType
    _sum?: FrameSumAggregateInputType
    _min?: FrameMinAggregateInputType
    _max?: FrameMaxAggregateInputType
  }

  export type FrameGroupByOutputType = {
    id: number
    nom: string
    type: $Enums.FrameType
    configuration: $Enums.FrameConfiguration | null
    dateDebutValidite: Date
    dateFinValidite: Date | null
    details: JsonValue
    _count: FrameCountAggregateOutputType | null
    _avg: FrameAvgAggregateOutputType | null
    _sum: FrameSumAggregateOutputType | null
    _min: FrameMinAggregateOutputType | null
    _max: FrameMaxAggregateOutputType | null
  }

  type GetFrameGroupByPayload<T extends FrameGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<FrameGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof FrameGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], FrameGroupByOutputType[P]>
            : GetScalarType<T[P], FrameGroupByOutputType[P]>
        }
      >
    >


  export type FrameSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    type?: boolean
    configuration?: boolean
    dateDebutValidite?: boolean
    dateFinValidite?: boolean
    details?: boolean
    affectations?: boolean | Frame$affectationsArgs<ExtArgs>
    _count?: boolean | FrameCountOutputTypeDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["frame"]>

  export type FrameSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    type?: boolean
    configuration?: boolean
    dateDebutValidite?: boolean
    dateFinValidite?: boolean
    details?: boolean
  }, ExtArgs["result"]["frame"]>

  export type FrameSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    nom?: boolean
    type?: boolean
    configuration?: boolean
    dateDebutValidite?: boolean
    dateFinValidite?: boolean
    details?: boolean
  }, ExtArgs["result"]["frame"]>

  export type FrameSelectScalar = {
    id?: boolean
    nom?: boolean
    type?: boolean
    configuration?: boolean
    dateDebutValidite?: boolean
    dateFinValidite?: boolean
    details?: boolean
  }

  export type FrameOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "nom" | "type" | "configuration" | "dateDebutValidite" | "dateFinValidite" | "details", ExtArgs["result"]["frame"]>
  export type FrameInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    affectations?: boolean | Frame$affectationsArgs<ExtArgs>
    _count?: boolean | FrameCountOutputTypeDefaultArgs<ExtArgs>
  }
  export type FrameIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}
  export type FrameIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {}

  export type $FramePayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Frame"
    objects: {
      affectations: Prisma.$AffectationPayload<ExtArgs>[]
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      nom: string
      type: $Enums.FrameType
      configuration: $Enums.FrameConfiguration | null
      dateDebutValidite: Date
      dateFinValidite: Date | null
      details: Prisma.JsonValue
    }, ExtArgs["result"]["frame"]>
    composites: {}
  }

  type FrameGetPayload<S extends boolean | null | undefined | FrameDefaultArgs> = $Result.GetResult<Prisma.$FramePayload, S>

  type FrameCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<FrameFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: FrameCountAggregateInputType | true
    }

  export interface FrameDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Frame'], meta: { name: 'Frame' } }
    /**
     * Find zero or one Frame that matches the filter.
     * @param {FrameFindUniqueArgs} args - Arguments to find a Frame
     * @example
     * // Get one Frame
     * const frame = await prisma.frame.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends FrameFindUniqueArgs>(args: SelectSubset<T, FrameFindUniqueArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Frame that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {FrameFindUniqueOrThrowArgs} args - Arguments to find a Frame
     * @example
     * // Get one Frame
     * const frame = await prisma.frame.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends FrameFindUniqueOrThrowArgs>(args: SelectSubset<T, FrameFindUniqueOrThrowArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Frame that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameFindFirstArgs} args - Arguments to find a Frame
     * @example
     * // Get one Frame
     * const frame = await prisma.frame.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends FrameFindFirstArgs>(args?: SelectSubset<T, FrameFindFirstArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Frame that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameFindFirstOrThrowArgs} args - Arguments to find a Frame
     * @example
     * // Get one Frame
     * const frame = await prisma.frame.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends FrameFindFirstOrThrowArgs>(args?: SelectSubset<T, FrameFindFirstOrThrowArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Frames that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Frames
     * const frames = await prisma.frame.findMany()
     * 
     * // Get first 10 Frames
     * const frames = await prisma.frame.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const frameWithIdOnly = await prisma.frame.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends FrameFindManyArgs>(args?: SelectSubset<T, FrameFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Frame.
     * @param {FrameCreateArgs} args - Arguments to create a Frame.
     * @example
     * // Create one Frame
     * const Frame = await prisma.frame.create({
     *   data: {
     *     // ... data to create a Frame
     *   }
     * })
     * 
     */
    create<T extends FrameCreateArgs>(args: SelectSubset<T, FrameCreateArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Frames.
     * @param {FrameCreateManyArgs} args - Arguments to create many Frames.
     * @example
     * // Create many Frames
     * const frame = await prisma.frame.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends FrameCreateManyArgs>(args?: SelectSubset<T, FrameCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Frames and returns the data saved in the database.
     * @param {FrameCreateManyAndReturnArgs} args - Arguments to create many Frames.
     * @example
     * // Create many Frames
     * const frame = await prisma.frame.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Frames and only return the `id`
     * const frameWithIdOnly = await prisma.frame.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends FrameCreateManyAndReturnArgs>(args?: SelectSubset<T, FrameCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Frame.
     * @param {FrameDeleteArgs} args - Arguments to delete one Frame.
     * @example
     * // Delete one Frame
     * const Frame = await prisma.frame.delete({
     *   where: {
     *     // ... filter to delete one Frame
     *   }
     * })
     * 
     */
    delete<T extends FrameDeleteArgs>(args: SelectSubset<T, FrameDeleteArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Frame.
     * @param {FrameUpdateArgs} args - Arguments to update one Frame.
     * @example
     * // Update one Frame
     * const frame = await prisma.frame.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends FrameUpdateArgs>(args: SelectSubset<T, FrameUpdateArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Frames.
     * @param {FrameDeleteManyArgs} args - Arguments to filter Frames to delete.
     * @example
     * // Delete a few Frames
     * const { count } = await prisma.frame.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends FrameDeleteManyArgs>(args?: SelectSubset<T, FrameDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Frames.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Frames
     * const frame = await prisma.frame.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends FrameUpdateManyArgs>(args: SelectSubset<T, FrameUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Frames and returns the data updated in the database.
     * @param {FrameUpdateManyAndReturnArgs} args - Arguments to update many Frames.
     * @example
     * // Update many Frames
     * const frame = await prisma.frame.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Frames and only return the `id`
     * const frameWithIdOnly = await prisma.frame.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends FrameUpdateManyAndReturnArgs>(args: SelectSubset<T, FrameUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Frame.
     * @param {FrameUpsertArgs} args - Arguments to update or create a Frame.
     * @example
     * // Update or create a Frame
     * const frame = await prisma.frame.upsert({
     *   create: {
     *     // ... data to create a Frame
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Frame we want to update
     *   }
     * })
     */
    upsert<T extends FrameUpsertArgs>(args: SelectSubset<T, FrameUpsertArgs<ExtArgs>>): Prisma__FrameClient<$Result.GetResult<Prisma.$FramePayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Frames.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameCountArgs} args - Arguments to filter Frames to count.
     * @example
     * // Count the number of Frames
     * const count = await prisma.frame.count({
     *   where: {
     *     // ... the filter for the Frames we want to count
     *   }
     * })
    **/
    count<T extends FrameCountArgs>(
      args?: Subset<T, FrameCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], FrameCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Frame.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends FrameAggregateArgs>(args: Subset<T, FrameAggregateArgs>): Prisma.PrismaPromise<GetFrameAggregateType<T>>

    /**
     * Group by Frame.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {FrameGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends FrameGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: FrameGroupByArgs['orderBy'] }
        : { orderBy?: FrameGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, FrameGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetFrameGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Frame model
   */
  readonly fields: FrameFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Frame.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__FrameClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    affectations<T extends Frame$affectationsArgs<ExtArgs> = {}>(args?: Subset<T, Frame$affectationsArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$AffectationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions> | Null>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Frame model
   */
  interface FrameFieldRefs {
    readonly id: FieldRef<"Frame", 'Int'>
    readonly nom: FieldRef<"Frame", 'String'>
    readonly type: FieldRef<"Frame", 'FrameType'>
    readonly configuration: FieldRef<"Frame", 'FrameConfiguration'>
    readonly dateDebutValidite: FieldRef<"Frame", 'DateTime'>
    readonly dateFinValidite: FieldRef<"Frame", 'DateTime'>
    readonly details: FieldRef<"Frame", 'Json'>
  }
    

  // Custom InputTypes
  /**
   * Frame findUnique
   */
  export type FrameFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter, which Frame to fetch.
     */
    where: FrameWhereUniqueInput
  }

  /**
   * Frame findUniqueOrThrow
   */
  export type FrameFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter, which Frame to fetch.
     */
    where: FrameWhereUniqueInput
  }

  /**
   * Frame findFirst
   */
  export type FrameFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter, which Frame to fetch.
     */
    where?: FrameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Frames to fetch.
     */
    orderBy?: FrameOrderByWithRelationInput | FrameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Frames.
     */
    cursor?: FrameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Frames from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Frames.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Frames.
     */
    distinct?: FrameScalarFieldEnum | FrameScalarFieldEnum[]
  }

  /**
   * Frame findFirstOrThrow
   */
  export type FrameFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter, which Frame to fetch.
     */
    where?: FrameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Frames to fetch.
     */
    orderBy?: FrameOrderByWithRelationInput | FrameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Frames.
     */
    cursor?: FrameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Frames from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Frames.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Frames.
     */
    distinct?: FrameScalarFieldEnum | FrameScalarFieldEnum[]
  }

  /**
   * Frame findMany
   */
  export type FrameFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter, which Frames to fetch.
     */
    where?: FrameWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Frames to fetch.
     */
    orderBy?: FrameOrderByWithRelationInput | FrameOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Frames.
     */
    cursor?: FrameWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Frames from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Frames.
     */
    skip?: number
    distinct?: FrameScalarFieldEnum | FrameScalarFieldEnum[]
  }

  /**
   * Frame create
   */
  export type FrameCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * The data needed to create a Frame.
     */
    data: XOR<FrameCreateInput, FrameUncheckedCreateInput>
  }

  /**
   * Frame createMany
   */
  export type FrameCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Frames.
     */
    data: FrameCreateManyInput | FrameCreateManyInput[]
  }

  /**
   * Frame createManyAndReturn
   */
  export type FrameCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * The data used to create many Frames.
     */
    data: FrameCreateManyInput | FrameCreateManyInput[]
  }

  /**
   * Frame update
   */
  export type FrameUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * The data needed to update a Frame.
     */
    data: XOR<FrameUpdateInput, FrameUncheckedUpdateInput>
    /**
     * Choose, which Frame to update.
     */
    where: FrameWhereUniqueInput
  }

  /**
   * Frame updateMany
   */
  export type FrameUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Frames.
     */
    data: XOR<FrameUpdateManyMutationInput, FrameUncheckedUpdateManyInput>
    /**
     * Filter which Frames to update
     */
    where?: FrameWhereInput
    /**
     * Limit how many Frames to update.
     */
    limit?: number
  }

  /**
   * Frame updateManyAndReturn
   */
  export type FrameUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * The data used to update Frames.
     */
    data: XOR<FrameUpdateManyMutationInput, FrameUncheckedUpdateManyInput>
    /**
     * Filter which Frames to update
     */
    where?: FrameWhereInput
    /**
     * Limit how many Frames to update.
     */
    limit?: number
  }

  /**
   * Frame upsert
   */
  export type FrameUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * The filter to search for the Frame to update in case it exists.
     */
    where: FrameWhereUniqueInput
    /**
     * In case the Frame found by the `where` argument doesn't exist, create a new Frame with this data.
     */
    create: XOR<FrameCreateInput, FrameUncheckedCreateInput>
    /**
     * In case the Frame was found with the provided `where` argument, update it with this data.
     */
    update: XOR<FrameUpdateInput, FrameUncheckedUpdateInput>
  }

  /**
   * Frame delete
   */
  export type FrameDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
    /**
     * Filter which Frame to delete.
     */
    where: FrameWhereUniqueInput
  }

  /**
   * Frame deleteMany
   */
  export type FrameDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Frames to delete
     */
    where?: FrameWhereInput
    /**
     * Limit how many Frames to delete.
     */
    limit?: number
  }

  /**
   * Frame.affectations
   */
  export type Frame$affectationsArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Affectation
     */
    select?: AffectationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Affectation
     */
    omit?: AffectationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: AffectationInclude<ExtArgs> | null
    where?: AffectationWhereInput
    orderBy?: AffectationOrderByWithRelationInput | AffectationOrderByWithRelationInput[]
    cursor?: AffectationWhereUniqueInput
    take?: number
    skip?: number
    distinct?: AffectationScalarFieldEnum | AffectationScalarFieldEnum[]
  }

  /**
   * Frame without action
   */
  export type FrameDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Frame
     */
    select?: FrameSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Frame
     */
    omit?: FrameOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: FrameInclude<ExtArgs> | null
  }


  /**
   * Model Notification
   */

  export type AggregateNotification = {
    _count: NotificationCountAggregateOutputType | null
    _avg: NotificationAvgAggregateOutputType | null
    _sum: NotificationSumAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  export type NotificationAvgAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
  }

  export type NotificationSumAggregateOutputType = {
    id: number | null
    utilisateurId: number | null
  }

  export type NotificationMinAggregateOutputType = {
    id: number | null
    dateCreation: Date | null
    type: $Enums.NotificationType | null
    message: string | null
    lue: boolean | null
    utilisateurId: number | null
  }

  export type NotificationMaxAggregateOutputType = {
    id: number | null
    dateCreation: Date | null
    type: $Enums.NotificationType | null
    message: string | null
    lue: boolean | null
    utilisateurId: number | null
  }

  export type NotificationCountAggregateOutputType = {
    id: number
    dateCreation: number
    type: number
    message: number
    lue: number
    utilisateurId: number
    _all: number
  }


  export type NotificationAvgAggregateInputType = {
    id?: true
    utilisateurId?: true
  }

  export type NotificationSumAggregateInputType = {
    id?: true
    utilisateurId?: true
  }

  export type NotificationMinAggregateInputType = {
    id?: true
    dateCreation?: true
    type?: true
    message?: true
    lue?: true
    utilisateurId?: true
  }

  export type NotificationMaxAggregateInputType = {
    id?: true
    dateCreation?: true
    type?: true
    message?: true
    lue?: true
    utilisateurId?: true
  }

  export type NotificationCountAggregateInputType = {
    id?: true
    dateCreation?: true
    type?: true
    message?: true
    lue?: true
    utilisateurId?: true
    _all?: true
  }

  export type NotificationAggregateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notification to aggregate.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the start position
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Count returned Notifications
    **/
    _count?: true | NotificationCountAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to average
    **/
    _avg?: NotificationAvgAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to sum
    **/
    _sum?: NotificationSumAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the minimum value
    **/
    _min?: NotificationMinAggregateInputType
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/aggregations Aggregation Docs}
     * 
     * Select which fields to find the maximum value
    **/
    _max?: NotificationMaxAggregateInputType
  }

  export type GetNotificationAggregateType<T extends NotificationAggregateArgs> = {
        [P in keyof T & keyof AggregateNotification]: P extends '_count' | 'count'
      ? T[P] extends true
        ? number
        : GetScalarType<T[P], AggregateNotification[P]>
      : GetScalarType<T[P], AggregateNotification[P]>
  }




  export type NotificationGroupByArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    where?: NotificationWhereInput
    orderBy?: NotificationOrderByWithAggregationInput | NotificationOrderByWithAggregationInput[]
    by: NotificationScalarFieldEnum[] | NotificationScalarFieldEnum
    having?: NotificationScalarWhereWithAggregatesInput
    take?: number
    skip?: number
    _count?: NotificationCountAggregateInputType | true
    _avg?: NotificationAvgAggregateInputType
    _sum?: NotificationSumAggregateInputType
    _min?: NotificationMinAggregateInputType
    _max?: NotificationMaxAggregateInputType
  }

  export type NotificationGroupByOutputType = {
    id: number
    dateCreation: Date
    type: $Enums.NotificationType
    message: string
    lue: boolean
    utilisateurId: number
    _count: NotificationCountAggregateOutputType | null
    _avg: NotificationAvgAggregateOutputType | null
    _sum: NotificationSumAggregateOutputType | null
    _min: NotificationMinAggregateOutputType | null
    _max: NotificationMaxAggregateOutputType | null
  }

  type GetNotificationGroupByPayload<T extends NotificationGroupByArgs> = Prisma.PrismaPromise<
    Array<
      PickEnumerable<NotificationGroupByOutputType, T['by']> &
        {
          [P in ((keyof T) & (keyof NotificationGroupByOutputType))]: P extends '_count'
            ? T[P] extends boolean
              ? number
              : GetScalarType<T[P], NotificationGroupByOutputType[P]>
            : GetScalarType<T[P], NotificationGroupByOutputType[P]>
        }
      >
    >


  export type NotificationSelect<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateCreation?: boolean
    type?: boolean
    message?: boolean
    lue?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateCreation?: boolean
    type?: boolean
    message?: boolean
    lue?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetSelect<{
    id?: boolean
    dateCreation?: boolean
    type?: boolean
    message?: boolean
    lue?: boolean
    utilisateurId?: boolean
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }, ExtArgs["result"]["notification"]>

  export type NotificationSelectScalar = {
    id?: boolean
    dateCreation?: boolean
    type?: boolean
    message?: boolean
    lue?: boolean
    utilisateurId?: boolean
  }

  export type NotificationOmit<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = $Extensions.GetOmit<"id" | "dateCreation" | "type" | "message" | "lue" | "utilisateurId", ExtArgs["result"]["notification"]>
  export type NotificationInclude<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NotificationIncludeCreateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }
  export type NotificationIncludeUpdateManyAndReturn<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    utilisateur?: boolean | UserDefaultArgs<ExtArgs>
  }

  export type $NotificationPayload<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    name: "Notification"
    objects: {
      utilisateur: Prisma.$UserPayload<ExtArgs>
    }
    scalars: $Extensions.GetPayloadResult<{
      id: number
      dateCreation: Date
      type: $Enums.NotificationType
      message: string
      lue: boolean
      utilisateurId: number
    }, ExtArgs["result"]["notification"]>
    composites: {}
  }

  type NotificationGetPayload<S extends boolean | null | undefined | NotificationDefaultArgs> = $Result.GetResult<Prisma.$NotificationPayload, S>

  type NotificationCountArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> =
    Omit<NotificationFindManyArgs, 'select' | 'include' | 'distinct' | 'omit'> & {
      select?: NotificationCountAggregateInputType | true
    }

  export interface NotificationDelegate<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> {
    [K: symbol]: { types: Prisma.TypeMap<ExtArgs>['model']['Notification'], meta: { name: 'Notification' } }
    /**
     * Find zero or one Notification that matches the filter.
     * @param {NotificationFindUniqueArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUnique({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUnique<T extends NotificationFindUniqueArgs>(args: SelectSubset<T, NotificationFindUniqueArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUnique", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find one Notification that matches the filter or throw an error with `error.code='P2025'`
     * if no matches were found.
     * @param {NotificationFindUniqueOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findUniqueOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findUniqueOrThrow<T extends NotificationFindUniqueOrThrowArgs>(args: SelectSubset<T, NotificationFindUniqueOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirst({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirst<T extends NotificationFindFirstArgs>(args?: SelectSubset<T, NotificationFindFirstArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirst", GlobalOmitOptions> | null, null, ExtArgs, GlobalOmitOptions>

    /**
     * Find the first Notification that matches the filter or
     * throw `PrismaKnownClientError` with `P2025` code if no matches were found.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindFirstOrThrowArgs} args - Arguments to find a Notification
     * @example
     * // Get one Notification
     * const notification = await prisma.notification.findFirstOrThrow({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     */
    findFirstOrThrow<T extends NotificationFindFirstOrThrowArgs>(args?: SelectSubset<T, NotificationFindFirstOrThrowArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findFirstOrThrow", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Find zero or more Notifications that matches the filter.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationFindManyArgs} args - Arguments to filter and select certain fields only.
     * @example
     * // Get all Notifications
     * const notifications = await prisma.notification.findMany()
     * 
     * // Get first 10 Notifications
     * const notifications = await prisma.notification.findMany({ take: 10 })
     * 
     * // Only select the `id`
     * const notificationWithIdOnly = await prisma.notification.findMany({ select: { id: true } })
     * 
     */
    findMany<T extends NotificationFindManyArgs>(args?: SelectSubset<T, NotificationFindManyArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "findMany", GlobalOmitOptions>>

    /**
     * Create a Notification.
     * @param {NotificationCreateArgs} args - Arguments to create a Notification.
     * @example
     * // Create one Notification
     * const Notification = await prisma.notification.create({
     *   data: {
     *     // ... data to create a Notification
     *   }
     * })
     * 
     */
    create<T extends NotificationCreateArgs>(args: SelectSubset<T, NotificationCreateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "create", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Create many Notifications.
     * @param {NotificationCreateManyArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createMany({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     *     
     */
    createMany<T extends NotificationCreateManyArgs>(args?: SelectSubset<T, NotificationCreateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Create many Notifications and returns the data saved in the database.
     * @param {NotificationCreateManyAndReturnArgs} args - Arguments to create many Notifications.
     * @example
     * // Create many Notifications
     * const notification = await prisma.notification.createManyAndReturn({
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Create many Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.createManyAndReturn({
     *   select: { id: true },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    createManyAndReturn<T extends NotificationCreateManyAndReturnArgs>(args?: SelectSubset<T, NotificationCreateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "createManyAndReturn", GlobalOmitOptions>>

    /**
     * Delete a Notification.
     * @param {NotificationDeleteArgs} args - Arguments to delete one Notification.
     * @example
     * // Delete one Notification
     * const Notification = await prisma.notification.delete({
     *   where: {
     *     // ... filter to delete one Notification
     *   }
     * })
     * 
     */
    delete<T extends NotificationDeleteArgs>(args: SelectSubset<T, NotificationDeleteArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "delete", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Update one Notification.
     * @param {NotificationUpdateArgs} args - Arguments to update one Notification.
     * @example
     * // Update one Notification
     * const notification = await prisma.notification.update({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    update<T extends NotificationUpdateArgs>(args: SelectSubset<T, NotificationUpdateArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "update", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>

    /**
     * Delete zero or more Notifications.
     * @param {NotificationDeleteManyArgs} args - Arguments to filter Notifications to delete.
     * @example
     * // Delete a few Notifications
     * const { count } = await prisma.notification.deleteMany({
     *   where: {
     *     // ... provide filter here
     *   }
     * })
     * 
     */
    deleteMany<T extends NotificationDeleteManyArgs>(args?: SelectSubset<T, NotificationDeleteManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationUpdateManyArgs} args - Arguments to update one or more rows.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateMany({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: {
     *     // ... provide data here
     *   }
     * })
     * 
     */
    updateMany<T extends NotificationUpdateManyArgs>(args: SelectSubset<T, NotificationUpdateManyArgs<ExtArgs>>): Prisma.PrismaPromise<BatchPayload>

    /**
     * Update zero or more Notifications and returns the data updated in the database.
     * @param {NotificationUpdateManyAndReturnArgs} args - Arguments to update many Notifications.
     * @example
     * // Update many Notifications
     * const notification = await prisma.notification.updateManyAndReturn({
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * 
     * // Update zero or more Notifications and only return the `id`
     * const notificationWithIdOnly = await prisma.notification.updateManyAndReturn({
     *   select: { id: true },
     *   where: {
     *     // ... provide filter here
     *   },
     *   data: [
     *     // ... provide data here
     *   ]
     * })
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * 
     */
    updateManyAndReturn<T extends NotificationUpdateManyAndReturnArgs>(args: SelectSubset<T, NotificationUpdateManyAndReturnArgs<ExtArgs>>): Prisma.PrismaPromise<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "updateManyAndReturn", GlobalOmitOptions>>

    /**
     * Create or update one Notification.
     * @param {NotificationUpsertArgs} args - Arguments to update or create a Notification.
     * @example
     * // Update or create a Notification
     * const notification = await prisma.notification.upsert({
     *   create: {
     *     // ... data to create a Notification
     *   },
     *   update: {
     *     // ... in case it already exists, update
     *   },
     *   where: {
     *     // ... the filter for the Notification we want to update
     *   }
     * })
     */
    upsert<T extends NotificationUpsertArgs>(args: SelectSubset<T, NotificationUpsertArgs<ExtArgs>>): Prisma__NotificationClient<$Result.GetResult<Prisma.$NotificationPayload<ExtArgs>, T, "upsert", GlobalOmitOptions>, never, ExtArgs, GlobalOmitOptions>


    /**
     * Count the number of Notifications.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationCountArgs} args - Arguments to filter Notifications to count.
     * @example
     * // Count the number of Notifications
     * const count = await prisma.notification.count({
     *   where: {
     *     // ... the filter for the Notifications we want to count
     *   }
     * })
    **/
    count<T extends NotificationCountArgs>(
      args?: Subset<T, NotificationCountArgs>,
    ): Prisma.PrismaPromise<
      T extends $Utils.Record<'select', any>
        ? T['select'] extends true
          ? number
          : GetScalarType<T['select'], NotificationCountAggregateOutputType>
        : number
    >

    /**
     * Allows you to perform aggregations operations on a Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationAggregateArgs} args - Select which aggregations you would like to apply and on what fields.
     * @example
     * // Ordered by age ascending
     * // Where email contains prisma.io
     * // Limited to the 10 users
     * const aggregations = await prisma.user.aggregate({
     *   _avg: {
     *     age: true,
     *   },
     *   where: {
     *     email: {
     *       contains: "prisma.io",
     *     },
     *   },
     *   orderBy: {
     *     age: "asc",
     *   },
     *   take: 10,
     * })
    **/
    aggregate<T extends NotificationAggregateArgs>(args: Subset<T, NotificationAggregateArgs>): Prisma.PrismaPromise<GetNotificationAggregateType<T>>

    /**
     * Group by Notification.
     * Note, that providing `undefined` is treated as the value not being there.
     * Read more here: https://pris.ly/d/null-undefined
     * @param {NotificationGroupByArgs} args - Group by arguments.
     * @example
     * // Group by city, order by createdAt, get count
     * const result = await prisma.user.groupBy({
     *   by: ['city', 'createdAt'],
     *   orderBy: {
     *     createdAt: true
     *   },
     *   _count: {
     *     _all: true
     *   },
     * })
     * 
    **/
    groupBy<
      T extends NotificationGroupByArgs,
      HasSelectOrTake extends Or<
        Extends<'skip', Keys<T>>,
        Extends<'take', Keys<T>>
      >,
      OrderByArg extends True extends HasSelectOrTake
        ? { orderBy: NotificationGroupByArgs['orderBy'] }
        : { orderBy?: NotificationGroupByArgs['orderBy'] },
      OrderFields extends ExcludeUnderscoreKeys<Keys<MaybeTupleToUnion<T['orderBy']>>>,
      ByFields extends MaybeTupleToUnion<T['by']>,
      ByValid extends Has<ByFields, OrderFields>,
      HavingFields extends GetHavingFields<T['having']>,
      HavingValid extends Has<ByFields, HavingFields>,
      ByEmpty extends T['by'] extends never[] ? True : False,
      InputErrors extends ByEmpty extends True
      ? `Error: "by" must not be empty.`
      : HavingValid extends False
      ? {
          [P in HavingFields]: P extends ByFields
            ? never
            : P extends string
            ? `Error: Field "${P}" used in "having" needs to be provided in "by".`
            : [
                Error,
                'Field ',
                P,
                ` in "having" needs to be provided in "by"`,
              ]
        }[HavingFields]
      : 'take' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "take", you also need to provide "orderBy"'
      : 'skip' extends Keys<T>
      ? 'orderBy' extends Keys<T>
        ? ByValid extends True
          ? {}
          : {
              [P in OrderFields]: P extends ByFields
                ? never
                : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
            }[OrderFields]
        : 'Error: If you provide "skip", you also need to provide "orderBy"'
      : ByValid extends True
      ? {}
      : {
          [P in OrderFields]: P extends ByFields
            ? never
            : `Error: Field "${P}" in "orderBy" needs to be provided in "by"`
        }[OrderFields]
    >(args: SubsetIntersection<T, NotificationGroupByArgs, OrderByArg> & InputErrors): {} extends InputErrors ? GetNotificationGroupByPayload<T> : Prisma.PrismaPromise<InputErrors>
  /**
   * Fields of the Notification model
   */
  readonly fields: NotificationFieldRefs;
  }

  /**
   * The delegate class that acts as a "Promise-like" for Notification.
   * Why is this prefixed with `Prisma__`?
   * Because we want to prevent naming conflicts as mentioned in
   * https://github.com/prisma/prisma-client-js/issues/707
   */
  export interface Prisma__NotificationClient<T, Null = never, ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs, GlobalOmitOptions = {}> extends Prisma.PrismaPromise<T> {
    readonly [Symbol.toStringTag]: "PrismaPromise"
    utilisateur<T extends UserDefaultArgs<ExtArgs> = {}>(args?: Subset<T, UserDefaultArgs<ExtArgs>>): Prisma__UserClient<$Result.GetResult<Prisma.$UserPayload<ExtArgs>, T, "findUniqueOrThrow", GlobalOmitOptions> | Null, Null, ExtArgs, GlobalOmitOptions>
    /**
     * Attaches callbacks for the resolution and/or rejection of the Promise.
     * @param onfulfilled The callback to execute when the Promise is resolved.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     */
    then<TResult1 = T, TResult2 = never>(onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null): $Utils.JsPromise<TResult1 | TResult2>
    /**
     * Attaches a callback for only the rejection of the Promise.
     * @param onrejected The callback to execute when the Promise is rejected.
     * @returns A Promise for the completion of the callback.
     */
    catch<TResult = never>(onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null): $Utils.JsPromise<T | TResult>
    /**
     * Attaches a callback that is invoked when the Promise is settled (fulfilled or rejected). The
     * resolved value cannot be modified from the callback.
     * @param onfinally The callback to execute when the Promise is settled (fulfilled or rejected).
     * @returns A Promise for the completion of the callback.
     */
    finally(onfinally?: (() => void) | undefined | null): $Utils.JsPromise<T>
  }




  /**
   * Fields of the Notification model
   */
  interface NotificationFieldRefs {
    readonly id: FieldRef<"Notification", 'Int'>
    readonly dateCreation: FieldRef<"Notification", 'DateTime'>
    readonly type: FieldRef<"Notification", 'NotificationType'>
    readonly message: FieldRef<"Notification", 'String'>
    readonly lue: FieldRef<"Notification", 'Boolean'>
    readonly utilisateurId: FieldRef<"Notification", 'Int'>
  }
    

  // Custom InputTypes
  /**
   * Notification findUnique
   */
  export type NotificationFindUniqueArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findUniqueOrThrow
   */
  export type NotificationFindUniqueOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification findFirst
   */
  export type NotificationFindFirstArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findFirstOrThrow
   */
  export type NotificationFindFirstOrThrowArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notification to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for searching for Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/distinct Distinct Docs}
     * 
     * Filter by unique combinations of Notifications.
     */
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification findMany
   */
  export type NotificationFindManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter, which Notifications to fetch.
     */
    where?: NotificationWhereInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/sorting Sorting Docs}
     * 
     * Determine the order of Notifications to fetch.
     */
    orderBy?: NotificationOrderByWithRelationInput | NotificationOrderByWithRelationInput[]
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination#cursor-based-pagination Cursor Docs}
     * 
     * Sets the position for listing Notifications.
     */
    cursor?: NotificationWhereUniqueInput
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Take `±n` Notifications from the position of the cursor.
     */
    take?: number
    /**
     * {@link https://www.prisma.io/docs/concepts/components/prisma-client/pagination Pagination Docs}
     * 
     * Skip the first `n` Notifications.
     */
    skip?: number
    distinct?: NotificationScalarFieldEnum | NotificationScalarFieldEnum[]
  }

  /**
   * Notification create
   */
  export type NotificationCreateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to create a Notification.
     */
    data: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
  }

  /**
   * Notification createMany
   */
  export type NotificationCreateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
  }

  /**
   * Notification createManyAndReturn
   */
  export type NotificationCreateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectCreateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * The data used to create many Notifications.
     */
    data: NotificationCreateManyInput | NotificationCreateManyInput[]
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationIncludeCreateManyAndReturn<ExtArgs> | null
  }

  /**
   * Notification update
   */
  export type NotificationUpdateArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The data needed to update a Notification.
     */
    data: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
    /**
     * Choose, which Notification to update.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification updateMany
   */
  export type NotificationUpdateManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to update.
     */
    limit?: number
  }

  /**
   * Notification updateManyAndReturn
   */
  export type NotificationUpdateManyAndReturnArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelectUpdateManyAndReturn<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * The data used to update Notifications.
     */
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyInput>
    /**
     * Filter which Notifications to update
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to update.
     */
    limit?: number
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationIncludeUpdateManyAndReturn<ExtArgs> | null
  }

  /**
   * Notification upsert
   */
  export type NotificationUpsertArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * The filter to search for the Notification to update in case it exists.
     */
    where: NotificationWhereUniqueInput
    /**
     * In case the Notification found by the `where` argument doesn't exist, create a new Notification with this data.
     */
    create: XOR<NotificationCreateInput, NotificationUncheckedCreateInput>
    /**
     * In case the Notification was found with the provided `where` argument, update it with this data.
     */
    update: XOR<NotificationUpdateInput, NotificationUncheckedUpdateInput>
  }

  /**
   * Notification delete
   */
  export type NotificationDeleteArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
    /**
     * Filter which Notification to delete.
     */
    where: NotificationWhereUniqueInput
  }

  /**
   * Notification deleteMany
   */
  export type NotificationDeleteManyArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Filter which Notifications to delete
     */
    where?: NotificationWhereInput
    /**
     * Limit how many Notifications to delete.
     */
    limit?: number
  }

  /**
   * Notification without action
   */
  export type NotificationDefaultArgs<ExtArgs extends $Extensions.InternalArgs = $Extensions.DefaultArgs> = {
    /**
     * Select specific fields to fetch from the Notification
     */
    select?: NotificationSelect<ExtArgs> | null
    /**
     * Omit specific fields from the Notification
     */
    omit?: NotificationOmit<ExtArgs> | null
    /**
     * Choose, which related nodes to fetch as well
     */
    include?: NotificationInclude<ExtArgs> | null
  }


  /**
   * Enums
   */

  export const TransactionIsolationLevel: {
    Serializable: 'Serializable'
  };

  export type TransactionIsolationLevel = (typeof TransactionIsolationLevel)[keyof typeof TransactionIsolationLevel]


  export const UserScalarFieldEnum: {
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

  export type UserScalarFieldEnum = (typeof UserScalarFieldEnum)[keyof typeof UserScalarFieldEnum]


  export const SurgeonScalarFieldEnum: {
    id: 'id',
    nom: 'nom',
    prenom: 'prenom',
    specialites: 'specialites',
    actif: 'actif',
    reglesSpecifiques: 'reglesSpecifiques'
  };

  export type SurgeonScalarFieldEnum = (typeof SurgeonScalarFieldEnum)[keyof typeof SurgeonScalarFieldEnum]


  export const RoomScalarFieldEnum: {
    id: 'id',
    nom: 'nom',
    numero: 'numero',
    type: 'type',
    secteur: 'secteur',
    codeCouleur: 'codeCouleur',
    reglesSupervision: 'reglesSupervision'
  };

  export type RoomScalarFieldEnum = (typeof RoomScalarFieldEnum)[keyof typeof RoomScalarFieldEnum]


  export const AffectationScalarFieldEnum: {
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

  export type AffectationScalarFieldEnum = (typeof AffectationScalarFieldEnum)[keyof typeof AffectationScalarFieldEnum]


  export const LeaveScalarFieldEnum: {
    id: 'id',
    dateDebut: 'dateDebut',
    dateFin: 'dateFin',
    type: 'type',
    statut: 'statut',
    commentaire: 'commentaire',
    decompte: 'decompte',
    utilisateurId: 'utilisateurId'
  };

  export type LeaveScalarFieldEnum = (typeof LeaveScalarFieldEnum)[keyof typeof LeaveScalarFieldEnum]


  export const CounterScalarFieldEnum: {
    id: 'id',
    annee: 'annee',
    congesPris: 'congesPris',
    congesRestants: 'congesRestants',
    heuresSupplementaires: 'heuresSupplementaires',
    statsSpecialites: 'statsSpecialites',
    statsGardes: 'statsGardes',
    utilisateurId: 'utilisateurId'
  };

  export type CounterScalarFieldEnum = (typeof CounterScalarFieldEnum)[keyof typeof CounterScalarFieldEnum]


  export const FrameScalarFieldEnum: {
    id: 'id',
    nom: 'nom',
    type: 'type',
    configuration: 'configuration',
    dateDebutValidite: 'dateDebutValidite',
    dateFinValidite: 'dateFinValidite',
    details: 'details'
  };

  export type FrameScalarFieldEnum = (typeof FrameScalarFieldEnum)[keyof typeof FrameScalarFieldEnum]


  export const NotificationScalarFieldEnum: {
    id: 'id',
    dateCreation: 'dateCreation',
    type: 'type',
    message: 'message',
    lue: 'lue',
    utilisateurId: 'utilisateurId'
  };

  export type NotificationScalarFieldEnum = (typeof NotificationScalarFieldEnum)[keyof typeof NotificationScalarFieldEnum]


  export const SortOrder: {
    asc: 'asc',
    desc: 'desc'
  };

  export type SortOrder = (typeof SortOrder)[keyof typeof SortOrder]


  export const JsonNullValueInput: {
    JsonNull: typeof JsonNull
  };

  export type JsonNullValueInput = (typeof JsonNullValueInput)[keyof typeof JsonNullValueInput]


  export const NullableJsonNullValueInput: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull
  };

  export type NullableJsonNullValueInput = (typeof NullableJsonNullValueInput)[keyof typeof NullableJsonNullValueInput]


  export const JsonNullValueFilter: {
    DbNull: typeof DbNull,
    JsonNull: typeof JsonNull,
    AnyNull: typeof AnyNull
  };

  export type JsonNullValueFilter = (typeof JsonNullValueFilter)[keyof typeof JsonNullValueFilter]


  export const QueryMode: {
    default: 'default',
    insensitive: 'insensitive'
  };

  export type QueryMode = (typeof QueryMode)[keyof typeof QueryMode]


  export const NullsOrder: {
    first: 'first',
    last: 'last'
  };

  export type NullsOrder = (typeof NullsOrder)[keyof typeof NullsOrder]


  /**
   * Field references
   */


  /**
   * Reference to a field of type 'Int'
   */
  export type IntFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Int'>
    


  /**
   * Reference to a field of type 'String'
   */
  export type StringFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'String'>
    


  /**
   * Reference to a field of type 'UserType'
   */
  export type EnumUserTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'UserType'>
    


  /**
   * Reference to a field of type 'AccessLevel'
   */
  export type EnumAccessLevelFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AccessLevel'>
    


  /**
   * Reference to a field of type 'Json'
   */
  export type JsonFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Json'>
    


  /**
   * Reference to a field of type 'QueryMode'
   */
  export type EnumQueryModeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'QueryMode'>
    


  /**
   * Reference to a field of type 'DateTime'
   */
  export type DateTimeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'DateTime'>
    


  /**
   * Reference to a field of type 'Boolean'
   */
  export type BooleanFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Boolean'>
    


  /**
   * Reference to a field of type 'HalfDay'
   */
  export type EnumHalfDayFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'HalfDay'>
    


  /**
   * Reference to a field of type 'AffectationType'
   */
  export type EnumAffectationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AffectationType'>
    


  /**
   * Reference to a field of type 'AffectationStatus'
   */
  export type EnumAffectationStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'AffectationStatus'>
    


  /**
   * Reference to a field of type 'LeaveType'
   */
  export type EnumLeaveTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LeaveType'>
    


  /**
   * Reference to a field of type 'LeaveStatus'
   */
  export type EnumLeaveStatusFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'LeaveStatus'>
    


  /**
   * Reference to a field of type 'FrameType'
   */
  export type EnumFrameTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FrameType'>
    


  /**
   * Reference to a field of type 'FrameConfiguration'
   */
  export type EnumFrameConfigurationFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'FrameConfiguration'>
    


  /**
   * Reference to a field of type 'NotificationType'
   */
  export type EnumNotificationTypeFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'NotificationType'>
    


  /**
   * Reference to a field of type 'Float'
   */
  export type FloatFieldRefInput<$PrismaModel> = FieldRefInputType<$PrismaModel, 'Float'>
    
  /**
   * Deep Input Types
   */


  export type UserWhereInput = {
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    id?: IntFilter<"User"> | number
    nom?: StringFilter<"User"> | string
    prenom?: StringFilter<"User"> | string
    email?: StringFilter<"User"> | string
    motDePasse?: StringFilter<"User"> | string
    type?: EnumUserTypeFilter<"User"> | $Enums.UserType
    niveauAcces?: EnumAccessLevelFilter<"User"> | $Enums.AccessLevel
    configurationTravail?: JsonFilter<"User">
    droitsConges?: IntFilter<"User"> | number
    specialites?: JsonNullableFilter<"User">
    dateCreation?: DateTimeFilter<"User"> | Date | string
    affectations?: AffectationListRelationFilter
    conges?: LeaveListRelationFilter
    compteur?: XOR<CounterNullableScalarRelationFilter, CounterWhereInput> | null
    notifications?: NotificationListRelationFilter
  }

  export type UserOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    email?: SortOrder
    motDePasse?: SortOrder
    type?: SortOrder
    niveauAcces?: SortOrder
    configurationTravail?: SortOrder
    droitsConges?: SortOrder
    specialites?: SortOrderInput | SortOrder
    dateCreation?: SortOrder
    affectations?: AffectationOrderByRelationAggregateInput
    conges?: LeaveOrderByRelationAggregateInput
    compteur?: CounterOrderByWithRelationInput
    notifications?: NotificationOrderByRelationAggregateInput
  }

  export type UserWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    email?: string
    AND?: UserWhereInput | UserWhereInput[]
    OR?: UserWhereInput[]
    NOT?: UserWhereInput | UserWhereInput[]
    nom?: StringFilter<"User"> | string
    prenom?: StringFilter<"User"> | string
    motDePasse?: StringFilter<"User"> | string
    type?: EnumUserTypeFilter<"User"> | $Enums.UserType
    niveauAcces?: EnumAccessLevelFilter<"User"> | $Enums.AccessLevel
    configurationTravail?: JsonFilter<"User">
    droitsConges?: IntFilter<"User"> | number
    specialites?: JsonNullableFilter<"User">
    dateCreation?: DateTimeFilter<"User"> | Date | string
    affectations?: AffectationListRelationFilter
    conges?: LeaveListRelationFilter
    compteur?: XOR<CounterNullableScalarRelationFilter, CounterWhereInput> | null
    notifications?: NotificationListRelationFilter
  }, "id" | "email">

  export type UserOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    email?: SortOrder
    motDePasse?: SortOrder
    type?: SortOrder
    niveauAcces?: SortOrder
    configurationTravail?: SortOrder
    droitsConges?: SortOrder
    specialites?: SortOrderInput | SortOrder
    dateCreation?: SortOrder
    _count?: UserCountOrderByAggregateInput
    _avg?: UserAvgOrderByAggregateInput
    _max?: UserMaxOrderByAggregateInput
    _min?: UserMinOrderByAggregateInput
    _sum?: UserSumOrderByAggregateInput
  }

  export type UserScalarWhereWithAggregatesInput = {
    AND?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    OR?: UserScalarWhereWithAggregatesInput[]
    NOT?: UserScalarWhereWithAggregatesInput | UserScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"User"> | number
    nom?: StringWithAggregatesFilter<"User"> | string
    prenom?: StringWithAggregatesFilter<"User"> | string
    email?: StringWithAggregatesFilter<"User"> | string
    motDePasse?: StringWithAggregatesFilter<"User"> | string
    type?: EnumUserTypeWithAggregatesFilter<"User"> | $Enums.UserType
    niveauAcces?: EnumAccessLevelWithAggregatesFilter<"User"> | $Enums.AccessLevel
    configurationTravail?: JsonWithAggregatesFilter<"User">
    droitsConges?: IntWithAggregatesFilter<"User"> | number
    specialites?: JsonNullableWithAggregatesFilter<"User">
    dateCreation?: DateTimeWithAggregatesFilter<"User"> | Date | string
  }

  export type SurgeonWhereInput = {
    AND?: SurgeonWhereInput | SurgeonWhereInput[]
    OR?: SurgeonWhereInput[]
    NOT?: SurgeonWhereInput | SurgeonWhereInput[]
    id?: IntFilter<"Surgeon"> | number
    nom?: StringFilter<"Surgeon"> | string
    prenom?: StringFilter<"Surgeon"> | string
    specialites?: JsonFilter<"Surgeon">
    actif?: BoolFilter<"Surgeon"> | boolean
    reglesSpecifiques?: JsonNullableFilter<"Surgeon">
    affectations?: AffectationListRelationFilter
  }

  export type SurgeonOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    specialites?: SortOrder
    actif?: SortOrder
    reglesSpecifiques?: SortOrderInput | SortOrder
    affectations?: AffectationOrderByRelationAggregateInput
  }

  export type SurgeonWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: SurgeonWhereInput | SurgeonWhereInput[]
    OR?: SurgeonWhereInput[]
    NOT?: SurgeonWhereInput | SurgeonWhereInput[]
    nom?: StringFilter<"Surgeon"> | string
    prenom?: StringFilter<"Surgeon"> | string
    specialites?: JsonFilter<"Surgeon">
    actif?: BoolFilter<"Surgeon"> | boolean
    reglesSpecifiques?: JsonNullableFilter<"Surgeon">
    affectations?: AffectationListRelationFilter
  }, "id">

  export type SurgeonOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    specialites?: SortOrder
    actif?: SortOrder
    reglesSpecifiques?: SortOrderInput | SortOrder
    _count?: SurgeonCountOrderByAggregateInput
    _avg?: SurgeonAvgOrderByAggregateInput
    _max?: SurgeonMaxOrderByAggregateInput
    _min?: SurgeonMinOrderByAggregateInput
    _sum?: SurgeonSumOrderByAggregateInput
  }

  export type SurgeonScalarWhereWithAggregatesInput = {
    AND?: SurgeonScalarWhereWithAggregatesInput | SurgeonScalarWhereWithAggregatesInput[]
    OR?: SurgeonScalarWhereWithAggregatesInput[]
    NOT?: SurgeonScalarWhereWithAggregatesInput | SurgeonScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Surgeon"> | number
    nom?: StringWithAggregatesFilter<"Surgeon"> | string
    prenom?: StringWithAggregatesFilter<"Surgeon"> | string
    specialites?: JsonWithAggregatesFilter<"Surgeon">
    actif?: BoolWithAggregatesFilter<"Surgeon"> | boolean
    reglesSpecifiques?: JsonNullableWithAggregatesFilter<"Surgeon">
  }

  export type RoomWhereInput = {
    AND?: RoomWhereInput | RoomWhereInput[]
    OR?: RoomWhereInput[]
    NOT?: RoomWhereInput | RoomWhereInput[]
    id?: IntFilter<"Room"> | number
    nom?: StringFilter<"Room"> | string
    numero?: IntFilter<"Room"> | number
    type?: StringFilter<"Room"> | string
    secteur?: StringFilter<"Room"> | string
    codeCouleur?: StringFilter<"Room"> | string
    reglesSupervision?: JsonNullableFilter<"Room">
    affectations?: AffectationListRelationFilter
  }

  export type RoomOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    numero?: SortOrder
    type?: SortOrder
    secteur?: SortOrder
    codeCouleur?: SortOrder
    reglesSupervision?: SortOrderInput | SortOrder
    affectations?: AffectationOrderByRelationAggregateInput
  }

  export type RoomWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: RoomWhereInput | RoomWhereInput[]
    OR?: RoomWhereInput[]
    NOT?: RoomWhereInput | RoomWhereInput[]
    nom?: StringFilter<"Room"> | string
    numero?: IntFilter<"Room"> | number
    type?: StringFilter<"Room"> | string
    secteur?: StringFilter<"Room"> | string
    codeCouleur?: StringFilter<"Room"> | string
    reglesSupervision?: JsonNullableFilter<"Room">
    affectations?: AffectationListRelationFilter
  }, "id">

  export type RoomOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    numero?: SortOrder
    type?: SortOrder
    secteur?: SortOrder
    codeCouleur?: SortOrder
    reglesSupervision?: SortOrderInput | SortOrder
    _count?: RoomCountOrderByAggregateInput
    _avg?: RoomAvgOrderByAggregateInput
    _max?: RoomMaxOrderByAggregateInput
    _min?: RoomMinOrderByAggregateInput
    _sum?: RoomSumOrderByAggregateInput
  }

  export type RoomScalarWhereWithAggregatesInput = {
    AND?: RoomScalarWhereWithAggregatesInput | RoomScalarWhereWithAggregatesInput[]
    OR?: RoomScalarWhereWithAggregatesInput[]
    NOT?: RoomScalarWhereWithAggregatesInput | RoomScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Room"> | number
    nom?: StringWithAggregatesFilter<"Room"> | string
    numero?: IntWithAggregatesFilter<"Room"> | number
    type?: StringWithAggregatesFilter<"Room"> | string
    secteur?: StringWithAggregatesFilter<"Room"> | string
    codeCouleur?: StringWithAggregatesFilter<"Room"> | string
    reglesSupervision?: JsonNullableWithAggregatesFilter<"Room">
  }

  export type AffectationWhereInput = {
    AND?: AffectationWhereInput | AffectationWhereInput[]
    OR?: AffectationWhereInput[]
    NOT?: AffectationWhereInput | AffectationWhereInput[]
    id?: IntFilter<"Affectation"> | number
    date?: DateTimeFilter<"Affectation"> | Date | string
    demiJournee?: EnumHalfDayFilter<"Affectation"> | $Enums.HalfDay
    type?: EnumAffectationTypeFilter<"Affectation"> | $Enums.AffectationType
    specialite?: StringFilter<"Affectation"> | string
    statut?: EnumAffectationStatusFilter<"Affectation"> | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFilter<"Affectation"> | boolean
    utilisateurId?: IntFilter<"Affectation"> | number
    salleId?: IntNullableFilter<"Affectation"> | number | null
    chirurgienId?: IntNullableFilter<"Affectation"> | number | null
    trameId?: IntNullableFilter<"Affectation"> | number | null
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
    salle?: XOR<RoomNullableScalarRelationFilter, RoomWhereInput> | null
    chirurgien?: XOR<SurgeonNullableScalarRelationFilter, SurgeonWhereInput> | null
    trame?: XOR<FrameNullableScalarRelationFilter, FrameWhereInput> | null
  }

  export type AffectationOrderByWithRelationInput = {
    id?: SortOrder
    date?: SortOrder
    demiJournee?: SortOrder
    type?: SortOrder
    specialite?: SortOrder
    statut?: SortOrder
    situationExceptionnelle?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrderInput | SortOrder
    chirurgienId?: SortOrderInput | SortOrder
    trameId?: SortOrderInput | SortOrder
    utilisateur?: UserOrderByWithRelationInput
    salle?: RoomOrderByWithRelationInput
    chirurgien?: SurgeonOrderByWithRelationInput
    trame?: FrameOrderByWithRelationInput
  }

  export type AffectationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: AffectationWhereInput | AffectationWhereInput[]
    OR?: AffectationWhereInput[]
    NOT?: AffectationWhereInput | AffectationWhereInput[]
    date?: DateTimeFilter<"Affectation"> | Date | string
    demiJournee?: EnumHalfDayFilter<"Affectation"> | $Enums.HalfDay
    type?: EnumAffectationTypeFilter<"Affectation"> | $Enums.AffectationType
    specialite?: StringFilter<"Affectation"> | string
    statut?: EnumAffectationStatusFilter<"Affectation"> | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFilter<"Affectation"> | boolean
    utilisateurId?: IntFilter<"Affectation"> | number
    salleId?: IntNullableFilter<"Affectation"> | number | null
    chirurgienId?: IntNullableFilter<"Affectation"> | number | null
    trameId?: IntNullableFilter<"Affectation"> | number | null
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
    salle?: XOR<RoomNullableScalarRelationFilter, RoomWhereInput> | null
    chirurgien?: XOR<SurgeonNullableScalarRelationFilter, SurgeonWhereInput> | null
    trame?: XOR<FrameNullableScalarRelationFilter, FrameWhereInput> | null
  }, "id">

  export type AffectationOrderByWithAggregationInput = {
    id?: SortOrder
    date?: SortOrder
    demiJournee?: SortOrder
    type?: SortOrder
    specialite?: SortOrder
    statut?: SortOrder
    situationExceptionnelle?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrderInput | SortOrder
    chirurgienId?: SortOrderInput | SortOrder
    trameId?: SortOrderInput | SortOrder
    _count?: AffectationCountOrderByAggregateInput
    _avg?: AffectationAvgOrderByAggregateInput
    _max?: AffectationMaxOrderByAggregateInput
    _min?: AffectationMinOrderByAggregateInput
    _sum?: AffectationSumOrderByAggregateInput
  }

  export type AffectationScalarWhereWithAggregatesInput = {
    AND?: AffectationScalarWhereWithAggregatesInput | AffectationScalarWhereWithAggregatesInput[]
    OR?: AffectationScalarWhereWithAggregatesInput[]
    NOT?: AffectationScalarWhereWithAggregatesInput | AffectationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Affectation"> | number
    date?: DateTimeWithAggregatesFilter<"Affectation"> | Date | string
    demiJournee?: EnumHalfDayWithAggregatesFilter<"Affectation"> | $Enums.HalfDay
    type?: EnumAffectationTypeWithAggregatesFilter<"Affectation"> | $Enums.AffectationType
    specialite?: StringWithAggregatesFilter<"Affectation"> | string
    statut?: EnumAffectationStatusWithAggregatesFilter<"Affectation"> | $Enums.AffectationStatus
    situationExceptionnelle?: BoolWithAggregatesFilter<"Affectation"> | boolean
    utilisateurId?: IntWithAggregatesFilter<"Affectation"> | number
    salleId?: IntNullableWithAggregatesFilter<"Affectation"> | number | null
    chirurgienId?: IntNullableWithAggregatesFilter<"Affectation"> | number | null
    trameId?: IntNullableWithAggregatesFilter<"Affectation"> | number | null
  }

  export type LeaveWhereInput = {
    AND?: LeaveWhereInput | LeaveWhereInput[]
    OR?: LeaveWhereInput[]
    NOT?: LeaveWhereInput | LeaveWhereInput[]
    id?: IntFilter<"Leave"> | number
    dateDebut?: DateTimeFilter<"Leave"> | Date | string
    dateFin?: DateTimeFilter<"Leave"> | Date | string
    type?: EnumLeaveTypeFilter<"Leave"> | $Enums.LeaveType
    statut?: EnumLeaveStatusFilter<"Leave"> | $Enums.LeaveStatus
    commentaire?: StringNullableFilter<"Leave"> | string | null
    decompte?: BoolFilter<"Leave"> | boolean
    utilisateurId?: IntFilter<"Leave"> | number
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type LeaveOrderByWithRelationInput = {
    id?: SortOrder
    dateDebut?: SortOrder
    dateFin?: SortOrder
    type?: SortOrder
    statut?: SortOrder
    commentaire?: SortOrderInput | SortOrder
    decompte?: SortOrder
    utilisateurId?: SortOrder
    utilisateur?: UserOrderByWithRelationInput
  }

  export type LeaveWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: LeaveWhereInput | LeaveWhereInput[]
    OR?: LeaveWhereInput[]
    NOT?: LeaveWhereInput | LeaveWhereInput[]
    dateDebut?: DateTimeFilter<"Leave"> | Date | string
    dateFin?: DateTimeFilter<"Leave"> | Date | string
    type?: EnumLeaveTypeFilter<"Leave"> | $Enums.LeaveType
    statut?: EnumLeaveStatusFilter<"Leave"> | $Enums.LeaveStatus
    commentaire?: StringNullableFilter<"Leave"> | string | null
    decompte?: BoolFilter<"Leave"> | boolean
    utilisateurId?: IntFilter<"Leave"> | number
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type LeaveOrderByWithAggregationInput = {
    id?: SortOrder
    dateDebut?: SortOrder
    dateFin?: SortOrder
    type?: SortOrder
    statut?: SortOrder
    commentaire?: SortOrderInput | SortOrder
    decompte?: SortOrder
    utilisateurId?: SortOrder
    _count?: LeaveCountOrderByAggregateInput
    _avg?: LeaveAvgOrderByAggregateInput
    _max?: LeaveMaxOrderByAggregateInput
    _min?: LeaveMinOrderByAggregateInput
    _sum?: LeaveSumOrderByAggregateInput
  }

  export type LeaveScalarWhereWithAggregatesInput = {
    AND?: LeaveScalarWhereWithAggregatesInput | LeaveScalarWhereWithAggregatesInput[]
    OR?: LeaveScalarWhereWithAggregatesInput[]
    NOT?: LeaveScalarWhereWithAggregatesInput | LeaveScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Leave"> | number
    dateDebut?: DateTimeWithAggregatesFilter<"Leave"> | Date | string
    dateFin?: DateTimeWithAggregatesFilter<"Leave"> | Date | string
    type?: EnumLeaveTypeWithAggregatesFilter<"Leave"> | $Enums.LeaveType
    statut?: EnumLeaveStatusWithAggregatesFilter<"Leave"> | $Enums.LeaveStatus
    commentaire?: StringNullableWithAggregatesFilter<"Leave"> | string | null
    decompte?: BoolWithAggregatesFilter<"Leave"> | boolean
    utilisateurId?: IntWithAggregatesFilter<"Leave"> | number
  }

  export type CounterWhereInput = {
    AND?: CounterWhereInput | CounterWhereInput[]
    OR?: CounterWhereInput[]
    NOT?: CounterWhereInput | CounterWhereInput[]
    id?: IntFilter<"Counter"> | number
    annee?: IntFilter<"Counter"> | number
    congesPris?: IntFilter<"Counter"> | number
    congesRestants?: IntFilter<"Counter"> | number
    heuresSupplementaires?: IntFilter<"Counter"> | number
    statsSpecialites?: JsonNullableFilter<"Counter">
    statsGardes?: JsonNullableFilter<"Counter">
    utilisateurId?: IntFilter<"Counter"> | number
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type CounterOrderByWithRelationInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    statsSpecialites?: SortOrderInput | SortOrder
    statsGardes?: SortOrderInput | SortOrder
    utilisateurId?: SortOrder
    utilisateur?: UserOrderByWithRelationInput
  }

  export type CounterWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    utilisateurId?: number
    AND?: CounterWhereInput | CounterWhereInput[]
    OR?: CounterWhereInput[]
    NOT?: CounterWhereInput | CounterWhereInput[]
    annee?: IntFilter<"Counter"> | number
    congesPris?: IntFilter<"Counter"> | number
    congesRestants?: IntFilter<"Counter"> | number
    heuresSupplementaires?: IntFilter<"Counter"> | number
    statsSpecialites?: JsonNullableFilter<"Counter">
    statsGardes?: JsonNullableFilter<"Counter">
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id" | "utilisateurId">

  export type CounterOrderByWithAggregationInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    statsSpecialites?: SortOrderInput | SortOrder
    statsGardes?: SortOrderInput | SortOrder
    utilisateurId?: SortOrder
    _count?: CounterCountOrderByAggregateInput
    _avg?: CounterAvgOrderByAggregateInput
    _max?: CounterMaxOrderByAggregateInput
    _min?: CounterMinOrderByAggregateInput
    _sum?: CounterSumOrderByAggregateInput
  }

  export type CounterScalarWhereWithAggregatesInput = {
    AND?: CounterScalarWhereWithAggregatesInput | CounterScalarWhereWithAggregatesInput[]
    OR?: CounterScalarWhereWithAggregatesInput[]
    NOT?: CounterScalarWhereWithAggregatesInput | CounterScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Counter"> | number
    annee?: IntWithAggregatesFilter<"Counter"> | number
    congesPris?: IntWithAggregatesFilter<"Counter"> | number
    congesRestants?: IntWithAggregatesFilter<"Counter"> | number
    heuresSupplementaires?: IntWithAggregatesFilter<"Counter"> | number
    statsSpecialites?: JsonNullableWithAggregatesFilter<"Counter">
    statsGardes?: JsonNullableWithAggregatesFilter<"Counter">
    utilisateurId?: IntWithAggregatesFilter<"Counter"> | number
  }

  export type FrameWhereInput = {
    AND?: FrameWhereInput | FrameWhereInput[]
    OR?: FrameWhereInput[]
    NOT?: FrameWhereInput | FrameWhereInput[]
    id?: IntFilter<"Frame"> | number
    nom?: StringFilter<"Frame"> | string
    type?: EnumFrameTypeFilter<"Frame"> | $Enums.FrameType
    configuration?: EnumFrameConfigurationNullableFilter<"Frame"> | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFilter<"Frame"> | Date | string
    dateFinValidite?: DateTimeNullableFilter<"Frame"> | Date | string | null
    details?: JsonFilter<"Frame">
    affectations?: AffectationListRelationFilter
  }

  export type FrameOrderByWithRelationInput = {
    id?: SortOrder
    nom?: SortOrder
    type?: SortOrder
    configuration?: SortOrderInput | SortOrder
    dateDebutValidite?: SortOrder
    dateFinValidite?: SortOrderInput | SortOrder
    details?: SortOrder
    affectations?: AffectationOrderByRelationAggregateInput
  }

  export type FrameWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: FrameWhereInput | FrameWhereInput[]
    OR?: FrameWhereInput[]
    NOT?: FrameWhereInput | FrameWhereInput[]
    nom?: StringFilter<"Frame"> | string
    type?: EnumFrameTypeFilter<"Frame"> | $Enums.FrameType
    configuration?: EnumFrameConfigurationNullableFilter<"Frame"> | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFilter<"Frame"> | Date | string
    dateFinValidite?: DateTimeNullableFilter<"Frame"> | Date | string | null
    details?: JsonFilter<"Frame">
    affectations?: AffectationListRelationFilter
  }, "id">

  export type FrameOrderByWithAggregationInput = {
    id?: SortOrder
    nom?: SortOrder
    type?: SortOrder
    configuration?: SortOrderInput | SortOrder
    dateDebutValidite?: SortOrder
    dateFinValidite?: SortOrderInput | SortOrder
    details?: SortOrder
    _count?: FrameCountOrderByAggregateInput
    _avg?: FrameAvgOrderByAggregateInput
    _max?: FrameMaxOrderByAggregateInput
    _min?: FrameMinOrderByAggregateInput
    _sum?: FrameSumOrderByAggregateInput
  }

  export type FrameScalarWhereWithAggregatesInput = {
    AND?: FrameScalarWhereWithAggregatesInput | FrameScalarWhereWithAggregatesInput[]
    OR?: FrameScalarWhereWithAggregatesInput[]
    NOT?: FrameScalarWhereWithAggregatesInput | FrameScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Frame"> | number
    nom?: StringWithAggregatesFilter<"Frame"> | string
    type?: EnumFrameTypeWithAggregatesFilter<"Frame"> | $Enums.FrameType
    configuration?: EnumFrameConfigurationNullableWithAggregatesFilter<"Frame"> | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeWithAggregatesFilter<"Frame"> | Date | string
    dateFinValidite?: DateTimeNullableWithAggregatesFilter<"Frame"> | Date | string | null
    details?: JsonWithAggregatesFilter<"Frame">
  }

  export type NotificationWhereInput = {
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    id?: IntFilter<"Notification"> | number
    dateCreation?: DateTimeFilter<"Notification"> | Date | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    message?: StringFilter<"Notification"> | string
    lue?: BoolFilter<"Notification"> | boolean
    utilisateurId?: IntFilter<"Notification"> | number
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }

  export type NotificationOrderByWithRelationInput = {
    id?: SortOrder
    dateCreation?: SortOrder
    type?: SortOrder
    message?: SortOrder
    lue?: SortOrder
    utilisateurId?: SortOrder
    utilisateur?: UserOrderByWithRelationInput
  }

  export type NotificationWhereUniqueInput = Prisma.AtLeast<{
    id?: number
    AND?: NotificationWhereInput | NotificationWhereInput[]
    OR?: NotificationWhereInput[]
    NOT?: NotificationWhereInput | NotificationWhereInput[]
    dateCreation?: DateTimeFilter<"Notification"> | Date | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    message?: StringFilter<"Notification"> | string
    lue?: BoolFilter<"Notification"> | boolean
    utilisateurId?: IntFilter<"Notification"> | number
    utilisateur?: XOR<UserScalarRelationFilter, UserWhereInput>
  }, "id">

  export type NotificationOrderByWithAggregationInput = {
    id?: SortOrder
    dateCreation?: SortOrder
    type?: SortOrder
    message?: SortOrder
    lue?: SortOrder
    utilisateurId?: SortOrder
    _count?: NotificationCountOrderByAggregateInput
    _avg?: NotificationAvgOrderByAggregateInput
    _max?: NotificationMaxOrderByAggregateInput
    _min?: NotificationMinOrderByAggregateInput
    _sum?: NotificationSumOrderByAggregateInput
  }

  export type NotificationScalarWhereWithAggregatesInput = {
    AND?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    OR?: NotificationScalarWhereWithAggregatesInput[]
    NOT?: NotificationScalarWhereWithAggregatesInput | NotificationScalarWhereWithAggregatesInput[]
    id?: IntWithAggregatesFilter<"Notification"> | number
    dateCreation?: DateTimeWithAggregatesFilter<"Notification"> | Date | string
    type?: EnumNotificationTypeWithAggregatesFilter<"Notification"> | $Enums.NotificationType
    message?: StringWithAggregatesFilter<"Notification"> | string
    lue?: BoolWithAggregatesFilter<"Notification"> | boolean
    utilisateurId?: IntWithAggregatesFilter<"Notification"> | number
  }

  export type UserCreateInput = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationCreateNestedManyWithoutUtilisateurInput
  }

  export type UserUncheckedCreateInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationUncheckedCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveUncheckedCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterUncheckedCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUtilisateurInput
  }

  export type UserUpdateInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUncheckedUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUncheckedUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUncheckedUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserCreateManyInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
  }

  export type UserUpdateManyMutationInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type UserUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
  }

  export type SurgeonCreateInput = {
    nom: string
    prenom: string
    specialites: JsonNullValueInput | InputJsonValue
    actif?: boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationCreateNestedManyWithoutChirurgienInput
  }

  export type SurgeonUncheckedCreateInput = {
    id?: number
    nom: string
    prenom: string
    specialites: JsonNullValueInput | InputJsonValue
    actif?: boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedCreateNestedManyWithoutChirurgienInput
  }

  export type SurgeonUpdateInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUpdateManyWithoutChirurgienNestedInput
  }

  export type SurgeonUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedUpdateManyWithoutChirurgienNestedInput
  }

  export type SurgeonCreateManyInput = {
    id?: number
    nom: string
    prenom: string
    specialites: JsonNullValueInput | InputJsonValue
    actif?: boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonUpdateManyMutationInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomCreateInput = {
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationCreateNestedManyWithoutSalleInput
  }

  export type RoomUncheckedCreateInput = {
    id?: number
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedCreateNestedManyWithoutSalleInput
  }

  export type RoomUpdateInput = {
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUpdateManyWithoutSalleNestedInput
  }

  export type RoomUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedUpdateManyWithoutSalleNestedInput
  }

  export type RoomCreateManyInput = {
    id?: number
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomUpdateManyMutationInput = {
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type AffectationCreateInput = {
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateur: UserCreateNestedOneWithoutAffectationsInput
    salle?: RoomCreateNestedOneWithoutAffectationsInput
    chirurgien?: SurgeonCreateNestedOneWithoutAffectationsInput
    trame?: FrameCreateNestedOneWithoutAffectationsInput
  }

  export type AffectationUncheckedCreateInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type AffectationUpdateInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutAffectationsNestedInput
    salle?: RoomUpdateOneWithoutAffectationsNestedInput
    chirurgien?: SurgeonUpdateOneWithoutAffectationsNestedInput
    trame?: FrameUpdateOneWithoutAffectationsNestedInput
  }

  export type AffectationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationCreateManyInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type AffectationUpdateManyMutationInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AffectationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type LeaveCreateInput = {
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
    utilisateur: UserCreateNestedOneWithoutCongesInput
  }

  export type LeaveUncheckedCreateInput = {
    id?: number
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
    utilisateurId: number
  }

  export type LeaveUpdateInput = {
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutCongesNestedInput
  }

  export type LeaveUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type LeaveCreateManyInput = {
    id?: number
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
    utilisateurId: number
  }

  export type LeaveUpdateManyMutationInput = {
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
  }

  export type LeaveUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type CounterCreateInput = {
    annee: number
    congesPris?: number
    congesRestants?: number
    heuresSupplementaires?: number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateur: UserCreateNestedOneWithoutCompteurInput
  }

  export type CounterUncheckedCreateInput = {
    id?: number
    annee: number
    congesPris?: number
    congesRestants?: number
    heuresSupplementaires?: number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateurId: number
  }

  export type CounterUpdateInput = {
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateur?: UserUpdateOneRequiredWithoutCompteurNestedInput
  }

  export type CounterUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type CounterCreateManyInput = {
    id?: number
    annee: number
    congesPris?: number
    congesRestants?: number
    heuresSupplementaires?: number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateurId: number
  }

  export type CounterUpdateManyMutationInput = {
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
  }

  export type CounterUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type FrameCreateInput = {
    nom: string
    type: $Enums.FrameType
    configuration?: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | string
    dateFinValidite?: Date | string | null
    details: JsonNullValueInput | InputJsonValue
    affectations?: AffectationCreateNestedManyWithoutTrameInput
  }

  export type FrameUncheckedCreateInput = {
    id?: number
    nom: string
    type: $Enums.FrameType
    configuration?: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | string
    dateFinValidite?: Date | string | null
    details: JsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedCreateNestedManyWithoutTrameInput
  }

  export type FrameUpdateInput = {
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
    affectations?: AffectationUpdateManyWithoutTrameNestedInput
  }

  export type FrameUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
    affectations?: AffectationUncheckedUpdateManyWithoutTrameNestedInput
  }

  export type FrameCreateManyInput = {
    id?: number
    nom: string
    type: $Enums.FrameType
    configuration?: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | string
    dateFinValidite?: Date | string | null
    details: JsonNullValueInput | InputJsonValue
  }

  export type FrameUpdateManyMutationInput = {
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
  }

  export type FrameUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
  }

  export type NotificationCreateInput = {
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
    utilisateur: UserCreateNestedOneWithoutNotificationsInput
  }

  export type NotificationUncheckedCreateInput = {
    id?: number
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
    utilisateurId: number
  }

  export type NotificationUpdateInput = {
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutNotificationsNestedInput
  }

  export type NotificationUncheckedUpdateInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type NotificationCreateManyInput = {
    id?: number
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
    utilisateurId: number
  }

  export type NotificationUpdateManyMutationInput = {
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
  }

  export type NotificationUncheckedUpdateManyInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
  }

  export type IntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type StringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type EnumUserTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.UserType | EnumUserTypeFieldRefInput<$PrismaModel>
    in?: $Enums.UserType[]
    notIn?: $Enums.UserType[]
    not?: NestedEnumUserTypeFilter<$PrismaModel> | $Enums.UserType
  }

  export type EnumAccessLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessLevel | EnumAccessLevelFieldRefInput<$PrismaModel>
    in?: $Enums.AccessLevel[]
    notIn?: $Enums.AccessLevel[]
    not?: NestedEnumAccessLevelFilter<$PrismaModel> | $Enums.AccessLevel
  }
  export type JsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonFilterBase<$PrismaModel>>, 'path'>>

  export type JsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }
  export type JsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type DateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type AffectationListRelationFilter = {
    every?: AffectationWhereInput
    some?: AffectationWhereInput
    none?: AffectationWhereInput
  }

  export type LeaveListRelationFilter = {
    every?: LeaveWhereInput
    some?: LeaveWhereInput
    none?: LeaveWhereInput
  }

  export type CounterNullableScalarRelationFilter = {
    is?: CounterWhereInput | null
    isNot?: CounterWhereInput | null
  }

  export type NotificationListRelationFilter = {
    every?: NotificationWhereInput
    some?: NotificationWhereInput
    none?: NotificationWhereInput
  }

  export type SortOrderInput = {
    sort: SortOrder
    nulls?: NullsOrder
  }

  export type AffectationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type LeaveOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type NotificationOrderByRelationAggregateInput = {
    _count?: SortOrder
  }

  export type UserCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    email?: SortOrder
    motDePasse?: SortOrder
    type?: SortOrder
    niveauAcces?: SortOrder
    configurationTravail?: SortOrder
    droitsConges?: SortOrder
    specialites?: SortOrder
    dateCreation?: SortOrder
  }

  export type UserAvgOrderByAggregateInput = {
    id?: SortOrder
    droitsConges?: SortOrder
  }

  export type UserMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    email?: SortOrder
    motDePasse?: SortOrder
    type?: SortOrder
    niveauAcces?: SortOrder
    droitsConges?: SortOrder
    dateCreation?: SortOrder
  }

  export type UserMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    email?: SortOrder
    motDePasse?: SortOrder
    type?: SortOrder
    niveauAcces?: SortOrder
    droitsConges?: SortOrder
    dateCreation?: SortOrder
  }

  export type UserSumOrderByAggregateInput = {
    id?: SortOrder
    droitsConges?: SortOrder
  }

  export type IntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type StringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type EnumUserTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserType | EnumUserTypeFieldRefInput<$PrismaModel>
    in?: $Enums.UserType[]
    notIn?: $Enums.UserType[]
    not?: NestedEnumUserTypeWithAggregatesFilter<$PrismaModel> | $Enums.UserType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserTypeFilter<$PrismaModel>
    _max?: NestedEnumUserTypeFilter<$PrismaModel>
  }

  export type EnumAccessLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessLevel | EnumAccessLevelFieldRefInput<$PrismaModel>
    in?: $Enums.AccessLevel[]
    notIn?: $Enums.AccessLevel[]
    not?: NestedEnumAccessLevelWithAggregatesFilter<$PrismaModel> | $Enums.AccessLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccessLevelFilter<$PrismaModel>
    _max?: NestedEnumAccessLevelFilter<$PrismaModel>
  }
  export type JsonWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedJsonFilter<$PrismaModel>
    _max?: NestedJsonFilter<$PrismaModel>
  }
  export type JsonNullableWithAggregatesFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, Exclude<keyof Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>,
        Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<JsonNullableWithAggregatesFilterBase<$PrismaModel>>, 'path'>>

  export type JsonNullableWithAggregatesFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedJsonNullableFilter<$PrismaModel>
    _max?: NestedJsonNullableFilter<$PrismaModel>
  }

  export type DateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type BoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type SurgeonCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    specialites?: SortOrder
    actif?: SortOrder
    reglesSpecifiques?: SortOrder
  }

  export type SurgeonAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type SurgeonMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    actif?: SortOrder
  }

  export type SurgeonMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    prenom?: SortOrder
    actif?: SortOrder
  }

  export type SurgeonSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type BoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type RoomCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    numero?: SortOrder
    type?: SortOrder
    secteur?: SortOrder
    codeCouleur?: SortOrder
    reglesSupervision?: SortOrder
  }

  export type RoomAvgOrderByAggregateInput = {
    id?: SortOrder
    numero?: SortOrder
  }

  export type RoomMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    numero?: SortOrder
    type?: SortOrder
    secteur?: SortOrder
    codeCouleur?: SortOrder
  }

  export type RoomMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    numero?: SortOrder
    type?: SortOrder
    secteur?: SortOrder
    codeCouleur?: SortOrder
  }

  export type RoomSumOrderByAggregateInput = {
    id?: SortOrder
    numero?: SortOrder
  }

  export type EnumHalfDayFilter<$PrismaModel = never> = {
    equals?: $Enums.HalfDay | EnumHalfDayFieldRefInput<$PrismaModel>
    in?: $Enums.HalfDay[]
    notIn?: $Enums.HalfDay[]
    not?: NestedEnumHalfDayFilter<$PrismaModel> | $Enums.HalfDay
  }

  export type EnumAffectationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationType | EnumAffectationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationType[]
    notIn?: $Enums.AffectationType[]
    not?: NestedEnumAffectationTypeFilter<$PrismaModel> | $Enums.AffectationType
  }

  export type EnumAffectationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationStatus | EnumAffectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationStatus[]
    notIn?: $Enums.AffectationStatus[]
    not?: NestedEnumAffectationStatusFilter<$PrismaModel> | $Enums.AffectationStatus
  }

  export type IntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }

  export type UserScalarRelationFilter = {
    is?: UserWhereInput
    isNot?: UserWhereInput
  }

  export type RoomNullableScalarRelationFilter = {
    is?: RoomWhereInput | null
    isNot?: RoomWhereInput | null
  }

  export type SurgeonNullableScalarRelationFilter = {
    is?: SurgeonWhereInput | null
    isNot?: SurgeonWhereInput | null
  }

  export type FrameNullableScalarRelationFilter = {
    is?: FrameWhereInput | null
    isNot?: FrameWhereInput | null
  }

  export type AffectationCountOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    demiJournee?: SortOrder
    type?: SortOrder
    specialite?: SortOrder
    statut?: SortOrder
    situationExceptionnelle?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrder
    chirurgienId?: SortOrder
    trameId?: SortOrder
  }

  export type AffectationAvgOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrder
    chirurgienId?: SortOrder
    trameId?: SortOrder
  }

  export type AffectationMaxOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    demiJournee?: SortOrder
    type?: SortOrder
    specialite?: SortOrder
    statut?: SortOrder
    situationExceptionnelle?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrder
    chirurgienId?: SortOrder
    trameId?: SortOrder
  }

  export type AffectationMinOrderByAggregateInput = {
    id?: SortOrder
    date?: SortOrder
    demiJournee?: SortOrder
    type?: SortOrder
    specialite?: SortOrder
    statut?: SortOrder
    situationExceptionnelle?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrder
    chirurgienId?: SortOrder
    trameId?: SortOrder
  }

  export type AffectationSumOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
    salleId?: SortOrder
    chirurgienId?: SortOrder
    trameId?: SortOrder
  }

  export type EnumHalfDayWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HalfDay | EnumHalfDayFieldRefInput<$PrismaModel>
    in?: $Enums.HalfDay[]
    notIn?: $Enums.HalfDay[]
    not?: NestedEnumHalfDayWithAggregatesFilter<$PrismaModel> | $Enums.HalfDay
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumHalfDayFilter<$PrismaModel>
    _max?: NestedEnumHalfDayFilter<$PrismaModel>
  }

  export type EnumAffectationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationType | EnumAffectationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationType[]
    notIn?: $Enums.AffectationType[]
    not?: NestedEnumAffectationTypeWithAggregatesFilter<$PrismaModel> | $Enums.AffectationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAffectationTypeFilter<$PrismaModel>
    _max?: NestedEnumAffectationTypeFilter<$PrismaModel>
  }

  export type EnumAffectationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationStatus | EnumAffectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationStatus[]
    notIn?: $Enums.AffectationStatus[]
    not?: NestedEnumAffectationStatusWithAggregatesFilter<$PrismaModel> | $Enums.AffectationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAffectationStatusFilter<$PrismaModel>
    _max?: NestedEnumAffectationStatusFilter<$PrismaModel>
  }

  export type IntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type EnumLeaveTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveType | EnumLeaveTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveType[]
    notIn?: $Enums.LeaveType[]
    not?: NestedEnumLeaveTypeFilter<$PrismaModel> | $Enums.LeaveType
  }

  export type EnumLeaveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveStatus | EnumLeaveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveStatus[]
    notIn?: $Enums.LeaveStatus[]
    not?: NestedEnumLeaveStatusFilter<$PrismaModel> | $Enums.LeaveStatus
  }

  export type StringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type LeaveCountOrderByAggregateInput = {
    id?: SortOrder
    dateDebut?: SortOrder
    dateFin?: SortOrder
    type?: SortOrder
    statut?: SortOrder
    commentaire?: SortOrder
    decompte?: SortOrder
    utilisateurId?: SortOrder
  }

  export type LeaveAvgOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
  }

  export type LeaveMaxOrderByAggregateInput = {
    id?: SortOrder
    dateDebut?: SortOrder
    dateFin?: SortOrder
    type?: SortOrder
    statut?: SortOrder
    commentaire?: SortOrder
    decompte?: SortOrder
    utilisateurId?: SortOrder
  }

  export type LeaveMinOrderByAggregateInput = {
    id?: SortOrder
    dateDebut?: SortOrder
    dateFin?: SortOrder
    type?: SortOrder
    statut?: SortOrder
    commentaire?: SortOrder
    decompte?: SortOrder
    utilisateurId?: SortOrder
  }

  export type LeaveSumOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
  }

  export type EnumLeaveTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveType | EnumLeaveTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveType[]
    notIn?: $Enums.LeaveType[]
    not?: NestedEnumLeaveTypeWithAggregatesFilter<$PrismaModel> | $Enums.LeaveType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLeaveTypeFilter<$PrismaModel>
    _max?: NestedEnumLeaveTypeFilter<$PrismaModel>
  }

  export type EnumLeaveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveStatus | EnumLeaveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveStatus[]
    notIn?: $Enums.LeaveStatus[]
    not?: NestedEnumLeaveStatusWithAggregatesFilter<$PrismaModel> | $Enums.LeaveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLeaveStatusFilter<$PrismaModel>
    _max?: NestedEnumLeaveStatusFilter<$PrismaModel>
  }

  export type StringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type CounterCountOrderByAggregateInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    statsSpecialites?: SortOrder
    statsGardes?: SortOrder
    utilisateurId?: SortOrder
  }

  export type CounterAvgOrderByAggregateInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    utilisateurId?: SortOrder
  }

  export type CounterMaxOrderByAggregateInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    utilisateurId?: SortOrder
  }

  export type CounterMinOrderByAggregateInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    utilisateurId?: SortOrder
  }

  export type CounterSumOrderByAggregateInput = {
    id?: SortOrder
    annee?: SortOrder
    congesPris?: SortOrder
    congesRestants?: SortOrder
    heuresSupplementaires?: SortOrder
    utilisateurId?: SortOrder
  }

  export type EnumFrameTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameType | EnumFrameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FrameType[]
    notIn?: $Enums.FrameType[]
    not?: NestedEnumFrameTypeFilter<$PrismaModel> | $Enums.FrameType
  }

  export type EnumFrameConfigurationNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameConfiguration | EnumFrameConfigurationFieldRefInput<$PrismaModel> | null
    in?: $Enums.FrameConfiguration[] | null
    notIn?: $Enums.FrameConfiguration[] | null
    not?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel> | $Enums.FrameConfiguration | null
  }

  export type DateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type FrameCountOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    type?: SortOrder
    configuration?: SortOrder
    dateDebutValidite?: SortOrder
    dateFinValidite?: SortOrder
    details?: SortOrder
  }

  export type FrameAvgOrderByAggregateInput = {
    id?: SortOrder
  }

  export type FrameMaxOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    type?: SortOrder
    configuration?: SortOrder
    dateDebutValidite?: SortOrder
    dateFinValidite?: SortOrder
  }

  export type FrameMinOrderByAggregateInput = {
    id?: SortOrder
    nom?: SortOrder
    type?: SortOrder
    configuration?: SortOrder
    dateDebutValidite?: SortOrder
    dateFinValidite?: SortOrder
  }

  export type FrameSumOrderByAggregateInput = {
    id?: SortOrder
  }

  export type EnumFrameTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameType | EnumFrameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FrameType[]
    notIn?: $Enums.FrameType[]
    not?: NestedEnumFrameTypeWithAggregatesFilter<$PrismaModel> | $Enums.FrameType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFrameTypeFilter<$PrismaModel>
    _max?: NestedEnumFrameTypeFilter<$PrismaModel>
  }

  export type EnumFrameConfigurationNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameConfiguration | EnumFrameConfigurationFieldRefInput<$PrismaModel> | null
    in?: $Enums.FrameConfiguration[] | null
    notIn?: $Enums.FrameConfiguration[] | null
    not?: NestedEnumFrameConfigurationNullableWithAggregatesFilter<$PrismaModel> | $Enums.FrameConfiguration | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel>
    _max?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel>
  }

  export type DateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type EnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type NotificationCountOrderByAggregateInput = {
    id?: SortOrder
    dateCreation?: SortOrder
    type?: SortOrder
    message?: SortOrder
    lue?: SortOrder
    utilisateurId?: SortOrder
  }

  export type NotificationAvgOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
  }

  export type NotificationMaxOrderByAggregateInput = {
    id?: SortOrder
    dateCreation?: SortOrder
    type?: SortOrder
    message?: SortOrder
    lue?: SortOrder
    utilisateurId?: SortOrder
  }

  export type NotificationMinOrderByAggregateInput = {
    id?: SortOrder
    dateCreation?: SortOrder
    type?: SortOrder
    message?: SortOrder
    lue?: SortOrder
    utilisateurId?: SortOrder
  }

  export type NotificationSumOrderByAggregateInput = {
    id?: SortOrder
    utilisateurId?: SortOrder
  }

  export type EnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type AffectationCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput> | AffectationCreateWithoutUtilisateurInput[] | AffectationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutUtilisateurInput | AffectationCreateOrConnectWithoutUtilisateurInput[]
    createMany?: AffectationCreateManyUtilisateurInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type LeaveCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput> | LeaveCreateWithoutUtilisateurInput[] | LeaveUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: LeaveCreateOrConnectWithoutUtilisateurInput | LeaveCreateOrConnectWithoutUtilisateurInput[]
    createMany?: LeaveCreateManyUtilisateurInputEnvelope
    connect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
  }

  export type CounterCreateNestedOneWithoutUtilisateurInput = {
    create?: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
    connectOrCreate?: CounterCreateOrConnectWithoutUtilisateurInput
    connect?: CounterWhereUniqueInput
  }

  export type NotificationCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput> | NotificationCreateWithoutUtilisateurInput[] | NotificationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUtilisateurInput | NotificationCreateOrConnectWithoutUtilisateurInput[]
    createMany?: NotificationCreateManyUtilisateurInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type AffectationUncheckedCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput> | AffectationCreateWithoutUtilisateurInput[] | AffectationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutUtilisateurInput | AffectationCreateOrConnectWithoutUtilisateurInput[]
    createMany?: AffectationCreateManyUtilisateurInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type LeaveUncheckedCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput> | LeaveCreateWithoutUtilisateurInput[] | LeaveUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: LeaveCreateOrConnectWithoutUtilisateurInput | LeaveCreateOrConnectWithoutUtilisateurInput[]
    createMany?: LeaveCreateManyUtilisateurInputEnvelope
    connect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
  }

  export type CounterUncheckedCreateNestedOneWithoutUtilisateurInput = {
    create?: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
    connectOrCreate?: CounterCreateOrConnectWithoutUtilisateurInput
    connect?: CounterWhereUniqueInput
  }

  export type NotificationUncheckedCreateNestedManyWithoutUtilisateurInput = {
    create?: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput> | NotificationCreateWithoutUtilisateurInput[] | NotificationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUtilisateurInput | NotificationCreateOrConnectWithoutUtilisateurInput[]
    createMany?: NotificationCreateManyUtilisateurInputEnvelope
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
  }

  export type StringFieldUpdateOperationsInput = {
    set?: string
  }

  export type EnumUserTypeFieldUpdateOperationsInput = {
    set?: $Enums.UserType
  }

  export type EnumAccessLevelFieldUpdateOperationsInput = {
    set?: $Enums.AccessLevel
  }

  export type IntFieldUpdateOperationsInput = {
    set?: number
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type DateTimeFieldUpdateOperationsInput = {
    set?: Date | string
  }

  export type AffectationUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput> | AffectationCreateWithoutUtilisateurInput[] | AffectationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutUtilisateurInput | AffectationCreateOrConnectWithoutUtilisateurInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutUtilisateurInput | AffectationUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: AffectationCreateManyUtilisateurInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutUtilisateurInput | AffectationUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutUtilisateurInput | AffectationUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type LeaveUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput> | LeaveCreateWithoutUtilisateurInput[] | LeaveUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: LeaveCreateOrConnectWithoutUtilisateurInput | LeaveCreateOrConnectWithoutUtilisateurInput[]
    upsert?: LeaveUpsertWithWhereUniqueWithoutUtilisateurInput | LeaveUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: LeaveCreateManyUtilisateurInputEnvelope
    set?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    disconnect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    delete?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    connect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    update?: LeaveUpdateWithWhereUniqueWithoutUtilisateurInput | LeaveUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: LeaveUpdateManyWithWhereWithoutUtilisateurInput | LeaveUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: LeaveScalarWhereInput | LeaveScalarWhereInput[]
  }

  export type CounterUpdateOneWithoutUtilisateurNestedInput = {
    create?: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
    connectOrCreate?: CounterCreateOrConnectWithoutUtilisateurInput
    upsert?: CounterUpsertWithoutUtilisateurInput
    disconnect?: CounterWhereInput | boolean
    delete?: CounterWhereInput | boolean
    connect?: CounterWhereUniqueInput
    update?: XOR<XOR<CounterUpdateToOneWithWhereWithoutUtilisateurInput, CounterUpdateWithoutUtilisateurInput>, CounterUncheckedUpdateWithoutUtilisateurInput>
  }

  export type NotificationUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput> | NotificationCreateWithoutUtilisateurInput[] | NotificationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUtilisateurInput | NotificationCreateOrConnectWithoutUtilisateurInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutUtilisateurInput | NotificationUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: NotificationCreateManyUtilisateurInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutUtilisateurInput | NotificationUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutUtilisateurInput | NotificationUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type AffectationUncheckedUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput> | AffectationCreateWithoutUtilisateurInput[] | AffectationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutUtilisateurInput | AffectationCreateOrConnectWithoutUtilisateurInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutUtilisateurInput | AffectationUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: AffectationCreateManyUtilisateurInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutUtilisateurInput | AffectationUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutUtilisateurInput | AffectationUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type LeaveUncheckedUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput> | LeaveCreateWithoutUtilisateurInput[] | LeaveUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: LeaveCreateOrConnectWithoutUtilisateurInput | LeaveCreateOrConnectWithoutUtilisateurInput[]
    upsert?: LeaveUpsertWithWhereUniqueWithoutUtilisateurInput | LeaveUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: LeaveCreateManyUtilisateurInputEnvelope
    set?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    disconnect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    delete?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    connect?: LeaveWhereUniqueInput | LeaveWhereUniqueInput[]
    update?: LeaveUpdateWithWhereUniqueWithoutUtilisateurInput | LeaveUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: LeaveUpdateManyWithWhereWithoutUtilisateurInput | LeaveUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: LeaveScalarWhereInput | LeaveScalarWhereInput[]
  }

  export type CounterUncheckedUpdateOneWithoutUtilisateurNestedInput = {
    create?: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
    connectOrCreate?: CounterCreateOrConnectWithoutUtilisateurInput
    upsert?: CounterUpsertWithoutUtilisateurInput
    disconnect?: CounterWhereInput | boolean
    delete?: CounterWhereInput | boolean
    connect?: CounterWhereUniqueInput
    update?: XOR<XOR<CounterUpdateToOneWithWhereWithoutUtilisateurInput, CounterUpdateWithoutUtilisateurInput>, CounterUncheckedUpdateWithoutUtilisateurInput>
  }

  export type NotificationUncheckedUpdateManyWithoutUtilisateurNestedInput = {
    create?: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput> | NotificationCreateWithoutUtilisateurInput[] | NotificationUncheckedCreateWithoutUtilisateurInput[]
    connectOrCreate?: NotificationCreateOrConnectWithoutUtilisateurInput | NotificationCreateOrConnectWithoutUtilisateurInput[]
    upsert?: NotificationUpsertWithWhereUniqueWithoutUtilisateurInput | NotificationUpsertWithWhereUniqueWithoutUtilisateurInput[]
    createMany?: NotificationCreateManyUtilisateurInputEnvelope
    set?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    disconnect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    delete?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    connect?: NotificationWhereUniqueInput | NotificationWhereUniqueInput[]
    update?: NotificationUpdateWithWhereUniqueWithoutUtilisateurInput | NotificationUpdateWithWhereUniqueWithoutUtilisateurInput[]
    updateMany?: NotificationUpdateManyWithWhereWithoutUtilisateurInput | NotificationUpdateManyWithWhereWithoutUtilisateurInput[]
    deleteMany?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
  }

  export type AffectationCreateNestedManyWithoutChirurgienInput = {
    create?: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput> | AffectationCreateWithoutChirurgienInput[] | AffectationUncheckedCreateWithoutChirurgienInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutChirurgienInput | AffectationCreateOrConnectWithoutChirurgienInput[]
    createMany?: AffectationCreateManyChirurgienInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type AffectationUncheckedCreateNestedManyWithoutChirurgienInput = {
    create?: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput> | AffectationCreateWithoutChirurgienInput[] | AffectationUncheckedCreateWithoutChirurgienInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutChirurgienInput | AffectationCreateOrConnectWithoutChirurgienInput[]
    createMany?: AffectationCreateManyChirurgienInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type BoolFieldUpdateOperationsInput = {
    set?: boolean
  }

  export type AffectationUpdateManyWithoutChirurgienNestedInput = {
    create?: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput> | AffectationCreateWithoutChirurgienInput[] | AffectationUncheckedCreateWithoutChirurgienInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutChirurgienInput | AffectationCreateOrConnectWithoutChirurgienInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutChirurgienInput | AffectationUpsertWithWhereUniqueWithoutChirurgienInput[]
    createMany?: AffectationCreateManyChirurgienInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutChirurgienInput | AffectationUpdateWithWhereUniqueWithoutChirurgienInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutChirurgienInput | AffectationUpdateManyWithWhereWithoutChirurgienInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type AffectationUncheckedUpdateManyWithoutChirurgienNestedInput = {
    create?: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput> | AffectationCreateWithoutChirurgienInput[] | AffectationUncheckedCreateWithoutChirurgienInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutChirurgienInput | AffectationCreateOrConnectWithoutChirurgienInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutChirurgienInput | AffectationUpsertWithWhereUniqueWithoutChirurgienInput[]
    createMany?: AffectationCreateManyChirurgienInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutChirurgienInput | AffectationUpdateWithWhereUniqueWithoutChirurgienInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutChirurgienInput | AffectationUpdateManyWithWhereWithoutChirurgienInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type AffectationCreateNestedManyWithoutSalleInput = {
    create?: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput> | AffectationCreateWithoutSalleInput[] | AffectationUncheckedCreateWithoutSalleInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutSalleInput | AffectationCreateOrConnectWithoutSalleInput[]
    createMany?: AffectationCreateManySalleInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type AffectationUncheckedCreateNestedManyWithoutSalleInput = {
    create?: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput> | AffectationCreateWithoutSalleInput[] | AffectationUncheckedCreateWithoutSalleInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutSalleInput | AffectationCreateOrConnectWithoutSalleInput[]
    createMany?: AffectationCreateManySalleInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type AffectationUpdateManyWithoutSalleNestedInput = {
    create?: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput> | AffectationCreateWithoutSalleInput[] | AffectationUncheckedCreateWithoutSalleInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutSalleInput | AffectationCreateOrConnectWithoutSalleInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutSalleInput | AffectationUpsertWithWhereUniqueWithoutSalleInput[]
    createMany?: AffectationCreateManySalleInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutSalleInput | AffectationUpdateWithWhereUniqueWithoutSalleInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutSalleInput | AffectationUpdateManyWithWhereWithoutSalleInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type AffectationUncheckedUpdateManyWithoutSalleNestedInput = {
    create?: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput> | AffectationCreateWithoutSalleInput[] | AffectationUncheckedCreateWithoutSalleInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutSalleInput | AffectationCreateOrConnectWithoutSalleInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutSalleInput | AffectationUpsertWithWhereUniqueWithoutSalleInput[]
    createMany?: AffectationCreateManySalleInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutSalleInput | AffectationUpdateWithWhereUniqueWithoutSalleInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutSalleInput | AffectationUpdateManyWithWhereWithoutSalleInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutAffectationsInput = {
    create?: XOR<UserCreateWithoutAffectationsInput, UserUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAffectationsInput
    connect?: UserWhereUniqueInput
  }

  export type RoomCreateNestedOneWithoutAffectationsInput = {
    create?: XOR<RoomCreateWithoutAffectationsInput, RoomUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: RoomCreateOrConnectWithoutAffectationsInput
    connect?: RoomWhereUniqueInput
  }

  export type SurgeonCreateNestedOneWithoutAffectationsInput = {
    create?: XOR<SurgeonCreateWithoutAffectationsInput, SurgeonUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: SurgeonCreateOrConnectWithoutAffectationsInput
    connect?: SurgeonWhereUniqueInput
  }

  export type FrameCreateNestedOneWithoutAffectationsInput = {
    create?: XOR<FrameCreateWithoutAffectationsInput, FrameUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: FrameCreateOrConnectWithoutAffectationsInput
    connect?: FrameWhereUniqueInput
  }

  export type EnumHalfDayFieldUpdateOperationsInput = {
    set?: $Enums.HalfDay
  }

  export type EnumAffectationTypeFieldUpdateOperationsInput = {
    set?: $Enums.AffectationType
  }

  export type EnumAffectationStatusFieldUpdateOperationsInput = {
    set?: $Enums.AffectationStatus
  }

  export type UserUpdateOneRequiredWithoutAffectationsNestedInput = {
    create?: XOR<UserCreateWithoutAffectationsInput, UserUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutAffectationsInput
    upsert?: UserUpsertWithoutAffectationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutAffectationsInput, UserUpdateWithoutAffectationsInput>, UserUncheckedUpdateWithoutAffectationsInput>
  }

  export type RoomUpdateOneWithoutAffectationsNestedInput = {
    create?: XOR<RoomCreateWithoutAffectationsInput, RoomUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: RoomCreateOrConnectWithoutAffectationsInput
    upsert?: RoomUpsertWithoutAffectationsInput
    disconnect?: RoomWhereInput | boolean
    delete?: RoomWhereInput | boolean
    connect?: RoomWhereUniqueInput
    update?: XOR<XOR<RoomUpdateToOneWithWhereWithoutAffectationsInput, RoomUpdateWithoutAffectationsInput>, RoomUncheckedUpdateWithoutAffectationsInput>
  }

  export type SurgeonUpdateOneWithoutAffectationsNestedInput = {
    create?: XOR<SurgeonCreateWithoutAffectationsInput, SurgeonUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: SurgeonCreateOrConnectWithoutAffectationsInput
    upsert?: SurgeonUpsertWithoutAffectationsInput
    disconnect?: SurgeonWhereInput | boolean
    delete?: SurgeonWhereInput | boolean
    connect?: SurgeonWhereUniqueInput
    update?: XOR<XOR<SurgeonUpdateToOneWithWhereWithoutAffectationsInput, SurgeonUpdateWithoutAffectationsInput>, SurgeonUncheckedUpdateWithoutAffectationsInput>
  }

  export type FrameUpdateOneWithoutAffectationsNestedInput = {
    create?: XOR<FrameCreateWithoutAffectationsInput, FrameUncheckedCreateWithoutAffectationsInput>
    connectOrCreate?: FrameCreateOrConnectWithoutAffectationsInput
    upsert?: FrameUpsertWithoutAffectationsInput
    disconnect?: FrameWhereInput | boolean
    delete?: FrameWhereInput | boolean
    connect?: FrameWhereUniqueInput
    update?: XOR<XOR<FrameUpdateToOneWithWhereWithoutAffectationsInput, FrameUpdateWithoutAffectationsInput>, FrameUncheckedUpdateWithoutAffectationsInput>
  }

  export type NullableIntFieldUpdateOperationsInput = {
    set?: number | null
    increment?: number
    decrement?: number
    multiply?: number
    divide?: number
  }

  export type UserCreateNestedOneWithoutCongesInput = {
    create?: XOR<UserCreateWithoutCongesInput, UserUncheckedCreateWithoutCongesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCongesInput
    connect?: UserWhereUniqueInput
  }

  export type EnumLeaveTypeFieldUpdateOperationsInput = {
    set?: $Enums.LeaveType
  }

  export type EnumLeaveStatusFieldUpdateOperationsInput = {
    set?: $Enums.LeaveStatus
  }

  export type NullableStringFieldUpdateOperationsInput = {
    set?: string | null
  }

  export type UserUpdateOneRequiredWithoutCongesNestedInput = {
    create?: XOR<UserCreateWithoutCongesInput, UserUncheckedCreateWithoutCongesInput>
    connectOrCreate?: UserCreateOrConnectWithoutCongesInput
    upsert?: UserUpsertWithoutCongesInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCongesInput, UserUpdateWithoutCongesInput>, UserUncheckedUpdateWithoutCongesInput>
  }

  export type UserCreateNestedOneWithoutCompteurInput = {
    create?: XOR<UserCreateWithoutCompteurInput, UserUncheckedCreateWithoutCompteurInput>
    connectOrCreate?: UserCreateOrConnectWithoutCompteurInput
    connect?: UserWhereUniqueInput
  }

  export type UserUpdateOneRequiredWithoutCompteurNestedInput = {
    create?: XOR<UserCreateWithoutCompteurInput, UserUncheckedCreateWithoutCompteurInput>
    connectOrCreate?: UserCreateOrConnectWithoutCompteurInput
    upsert?: UserUpsertWithoutCompteurInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutCompteurInput, UserUpdateWithoutCompteurInput>, UserUncheckedUpdateWithoutCompteurInput>
  }

  export type AffectationCreateNestedManyWithoutTrameInput = {
    create?: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput> | AffectationCreateWithoutTrameInput[] | AffectationUncheckedCreateWithoutTrameInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutTrameInput | AffectationCreateOrConnectWithoutTrameInput[]
    createMany?: AffectationCreateManyTrameInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type AffectationUncheckedCreateNestedManyWithoutTrameInput = {
    create?: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput> | AffectationCreateWithoutTrameInput[] | AffectationUncheckedCreateWithoutTrameInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutTrameInput | AffectationCreateOrConnectWithoutTrameInput[]
    createMany?: AffectationCreateManyTrameInputEnvelope
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
  }

  export type EnumFrameTypeFieldUpdateOperationsInput = {
    set?: $Enums.FrameType
  }

  export type NullableEnumFrameConfigurationFieldUpdateOperationsInput = {
    set?: $Enums.FrameConfiguration | null
  }

  export type NullableDateTimeFieldUpdateOperationsInput = {
    set?: Date | string | null
  }

  export type AffectationUpdateManyWithoutTrameNestedInput = {
    create?: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput> | AffectationCreateWithoutTrameInput[] | AffectationUncheckedCreateWithoutTrameInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutTrameInput | AffectationCreateOrConnectWithoutTrameInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutTrameInput | AffectationUpsertWithWhereUniqueWithoutTrameInput[]
    createMany?: AffectationCreateManyTrameInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutTrameInput | AffectationUpdateWithWhereUniqueWithoutTrameInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutTrameInput | AffectationUpdateManyWithWhereWithoutTrameInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type AffectationUncheckedUpdateManyWithoutTrameNestedInput = {
    create?: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput> | AffectationCreateWithoutTrameInput[] | AffectationUncheckedCreateWithoutTrameInput[]
    connectOrCreate?: AffectationCreateOrConnectWithoutTrameInput | AffectationCreateOrConnectWithoutTrameInput[]
    upsert?: AffectationUpsertWithWhereUniqueWithoutTrameInput | AffectationUpsertWithWhereUniqueWithoutTrameInput[]
    createMany?: AffectationCreateManyTrameInputEnvelope
    set?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    disconnect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    delete?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    connect?: AffectationWhereUniqueInput | AffectationWhereUniqueInput[]
    update?: AffectationUpdateWithWhereUniqueWithoutTrameInput | AffectationUpdateWithWhereUniqueWithoutTrameInput[]
    updateMany?: AffectationUpdateManyWithWhereWithoutTrameInput | AffectationUpdateManyWithWhereWithoutTrameInput[]
    deleteMany?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
  }

  export type UserCreateNestedOneWithoutNotificationsInput = {
    create?: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationsInput
    connect?: UserWhereUniqueInput
  }

  export type EnumNotificationTypeFieldUpdateOperationsInput = {
    set?: $Enums.NotificationType
  }

  export type UserUpdateOneRequiredWithoutNotificationsNestedInput = {
    create?: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    connectOrCreate?: UserCreateOrConnectWithoutNotificationsInput
    upsert?: UserUpsertWithoutNotificationsInput
    connect?: UserWhereUniqueInput
    update?: XOR<XOR<UserUpdateToOneWithWhereWithoutNotificationsInput, UserUpdateWithoutNotificationsInput>, UserUncheckedUpdateWithoutNotificationsInput>
  }

  export type NestedIntFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntFilter<$PrismaModel> | number
  }

  export type NestedStringFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringFilter<$PrismaModel> | string
  }

  export type NestedEnumUserTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.UserType | EnumUserTypeFieldRefInput<$PrismaModel>
    in?: $Enums.UserType[]
    notIn?: $Enums.UserType[]
    not?: NestedEnumUserTypeFilter<$PrismaModel> | $Enums.UserType
  }

  export type NestedEnumAccessLevelFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessLevel | EnumAccessLevelFieldRefInput<$PrismaModel>
    in?: $Enums.AccessLevel[]
    notIn?: $Enums.AccessLevel[]
    not?: NestedEnumAccessLevelFilter<$PrismaModel> | $Enums.AccessLevel
  }

  export type NestedDateTimeFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeFilter<$PrismaModel> | Date | string
  }

  export type NestedIntWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntWithAggregatesFilter<$PrismaModel> | number
    _count?: NestedIntFilter<$PrismaModel>
    _avg?: NestedFloatFilter<$PrismaModel>
    _sum?: NestedIntFilter<$PrismaModel>
    _min?: NestedIntFilter<$PrismaModel>
    _max?: NestedIntFilter<$PrismaModel>
  }

  export type NestedFloatFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel>
    in?: number[]
    notIn?: number[]
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatFilter<$PrismaModel> | number
  }

  export type NestedStringWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel>
    in?: string[]
    notIn?: string[]
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringWithAggregatesFilter<$PrismaModel> | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedStringFilter<$PrismaModel>
    _max?: NestedStringFilter<$PrismaModel>
  }

  export type NestedEnumUserTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.UserType | EnumUserTypeFieldRefInput<$PrismaModel>
    in?: $Enums.UserType[]
    notIn?: $Enums.UserType[]
    not?: NestedEnumUserTypeWithAggregatesFilter<$PrismaModel> | $Enums.UserType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumUserTypeFilter<$PrismaModel>
    _max?: NestedEnumUserTypeFilter<$PrismaModel>
  }

  export type NestedEnumAccessLevelWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AccessLevel | EnumAccessLevelFieldRefInput<$PrismaModel>
    in?: $Enums.AccessLevel[]
    notIn?: $Enums.AccessLevel[]
    not?: NestedEnumAccessLevelWithAggregatesFilter<$PrismaModel> | $Enums.AccessLevel
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAccessLevelFilter<$PrismaModel>
    _max?: NestedEnumAccessLevelFilter<$PrismaModel>
  }
  export type NestedJsonFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedIntNullableFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableFilter<$PrismaModel> | number | null
  }
  export type NestedJsonNullableFilter<$PrismaModel = never> =
    | PatchUndefined<
        Either<Required<NestedJsonNullableFilterBase<$PrismaModel>>, Exclude<keyof Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>,
        Required<NestedJsonNullableFilterBase<$PrismaModel>>
      >
    | OptionalFlat<Omit<Required<NestedJsonNullableFilterBase<$PrismaModel>>, 'path'>>

  export type NestedJsonNullableFilterBase<$PrismaModel = never> = {
    equals?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
    path?: string
    mode?: QueryMode | EnumQueryModeFieldRefInput<$PrismaModel>
    string_contains?: string | StringFieldRefInput<$PrismaModel>
    string_starts_with?: string | StringFieldRefInput<$PrismaModel>
    string_ends_with?: string | StringFieldRefInput<$PrismaModel>
    array_starts_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    array_ends_with?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | null
    not?: InputJsonValue | JsonFieldRefInput<$PrismaModel> | JsonNullValueFilter
  }

  export type NestedDateTimeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    in?: Date[] | string[]
    notIn?: Date[] | string[]
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeWithAggregatesFilter<$PrismaModel> | Date | string
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedDateTimeFilter<$PrismaModel>
    _max?: NestedDateTimeFilter<$PrismaModel>
  }

  export type NestedBoolFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolFilter<$PrismaModel> | boolean
  }

  export type NestedBoolWithAggregatesFilter<$PrismaModel = never> = {
    equals?: boolean | BooleanFieldRefInput<$PrismaModel>
    not?: NestedBoolWithAggregatesFilter<$PrismaModel> | boolean
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedBoolFilter<$PrismaModel>
    _max?: NestedBoolFilter<$PrismaModel>
  }

  export type NestedEnumHalfDayFilter<$PrismaModel = never> = {
    equals?: $Enums.HalfDay | EnumHalfDayFieldRefInput<$PrismaModel>
    in?: $Enums.HalfDay[]
    notIn?: $Enums.HalfDay[]
    not?: NestedEnumHalfDayFilter<$PrismaModel> | $Enums.HalfDay
  }

  export type NestedEnumAffectationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationType | EnumAffectationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationType[]
    notIn?: $Enums.AffectationType[]
    not?: NestedEnumAffectationTypeFilter<$PrismaModel> | $Enums.AffectationType
  }

  export type NestedEnumAffectationStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationStatus | EnumAffectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationStatus[]
    notIn?: $Enums.AffectationStatus[]
    not?: NestedEnumAffectationStatusFilter<$PrismaModel> | $Enums.AffectationStatus
  }

  export type NestedEnumHalfDayWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.HalfDay | EnumHalfDayFieldRefInput<$PrismaModel>
    in?: $Enums.HalfDay[]
    notIn?: $Enums.HalfDay[]
    not?: NestedEnumHalfDayWithAggregatesFilter<$PrismaModel> | $Enums.HalfDay
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumHalfDayFilter<$PrismaModel>
    _max?: NestedEnumHalfDayFilter<$PrismaModel>
  }

  export type NestedEnumAffectationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationType | EnumAffectationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationType[]
    notIn?: $Enums.AffectationType[]
    not?: NestedEnumAffectationTypeWithAggregatesFilter<$PrismaModel> | $Enums.AffectationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAffectationTypeFilter<$PrismaModel>
    _max?: NestedEnumAffectationTypeFilter<$PrismaModel>
  }

  export type NestedEnumAffectationStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.AffectationStatus | EnumAffectationStatusFieldRefInput<$PrismaModel>
    in?: $Enums.AffectationStatus[]
    notIn?: $Enums.AffectationStatus[]
    not?: NestedEnumAffectationStatusWithAggregatesFilter<$PrismaModel> | $Enums.AffectationStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumAffectationStatusFilter<$PrismaModel>
    _max?: NestedEnumAffectationStatusFilter<$PrismaModel>
  }

  export type NestedIntNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: number | IntFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | IntFieldRefInput<$PrismaModel>
    lte?: number | IntFieldRefInput<$PrismaModel>
    gt?: number | IntFieldRefInput<$PrismaModel>
    gte?: number | IntFieldRefInput<$PrismaModel>
    not?: NestedIntNullableWithAggregatesFilter<$PrismaModel> | number | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _avg?: NestedFloatNullableFilter<$PrismaModel>
    _sum?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedIntNullableFilter<$PrismaModel>
    _max?: NestedIntNullableFilter<$PrismaModel>
  }

  export type NestedFloatNullableFilter<$PrismaModel = never> = {
    equals?: number | FloatFieldRefInput<$PrismaModel> | null
    in?: number[] | null
    notIn?: number[] | null
    lt?: number | FloatFieldRefInput<$PrismaModel>
    lte?: number | FloatFieldRefInput<$PrismaModel>
    gt?: number | FloatFieldRefInput<$PrismaModel>
    gte?: number | FloatFieldRefInput<$PrismaModel>
    not?: NestedFloatNullableFilter<$PrismaModel> | number | null
  }

  export type NestedEnumLeaveTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveType | EnumLeaveTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveType[]
    notIn?: $Enums.LeaveType[]
    not?: NestedEnumLeaveTypeFilter<$PrismaModel> | $Enums.LeaveType
  }

  export type NestedEnumLeaveStatusFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveStatus | EnumLeaveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveStatus[]
    notIn?: $Enums.LeaveStatus[]
    not?: NestedEnumLeaveStatusFilter<$PrismaModel> | $Enums.LeaveStatus
  }

  export type NestedStringNullableFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableFilter<$PrismaModel> | string | null
  }

  export type NestedEnumLeaveTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveType | EnumLeaveTypeFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveType[]
    notIn?: $Enums.LeaveType[]
    not?: NestedEnumLeaveTypeWithAggregatesFilter<$PrismaModel> | $Enums.LeaveType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLeaveTypeFilter<$PrismaModel>
    _max?: NestedEnumLeaveTypeFilter<$PrismaModel>
  }

  export type NestedEnumLeaveStatusWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.LeaveStatus | EnumLeaveStatusFieldRefInput<$PrismaModel>
    in?: $Enums.LeaveStatus[]
    notIn?: $Enums.LeaveStatus[]
    not?: NestedEnumLeaveStatusWithAggregatesFilter<$PrismaModel> | $Enums.LeaveStatus
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumLeaveStatusFilter<$PrismaModel>
    _max?: NestedEnumLeaveStatusFilter<$PrismaModel>
  }

  export type NestedStringNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: string | StringFieldRefInput<$PrismaModel> | null
    in?: string[] | null
    notIn?: string[] | null
    lt?: string | StringFieldRefInput<$PrismaModel>
    lte?: string | StringFieldRefInput<$PrismaModel>
    gt?: string | StringFieldRefInput<$PrismaModel>
    gte?: string | StringFieldRefInput<$PrismaModel>
    contains?: string | StringFieldRefInput<$PrismaModel>
    startsWith?: string | StringFieldRefInput<$PrismaModel>
    endsWith?: string | StringFieldRefInput<$PrismaModel>
    not?: NestedStringNullableWithAggregatesFilter<$PrismaModel> | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedStringNullableFilter<$PrismaModel>
    _max?: NestedStringNullableFilter<$PrismaModel>
  }

  export type NestedEnumFrameTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameType | EnumFrameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FrameType[]
    notIn?: $Enums.FrameType[]
    not?: NestedEnumFrameTypeFilter<$PrismaModel> | $Enums.FrameType
  }

  export type NestedEnumFrameConfigurationNullableFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameConfiguration | EnumFrameConfigurationFieldRefInput<$PrismaModel> | null
    in?: $Enums.FrameConfiguration[] | null
    notIn?: $Enums.FrameConfiguration[] | null
    not?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel> | $Enums.FrameConfiguration | null
  }

  export type NestedDateTimeNullableFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableFilter<$PrismaModel> | Date | string | null
  }

  export type NestedEnumFrameTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameType | EnumFrameTypeFieldRefInput<$PrismaModel>
    in?: $Enums.FrameType[]
    notIn?: $Enums.FrameType[]
    not?: NestedEnumFrameTypeWithAggregatesFilter<$PrismaModel> | $Enums.FrameType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumFrameTypeFilter<$PrismaModel>
    _max?: NestedEnumFrameTypeFilter<$PrismaModel>
  }

  export type NestedEnumFrameConfigurationNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.FrameConfiguration | EnumFrameConfigurationFieldRefInput<$PrismaModel> | null
    in?: $Enums.FrameConfiguration[] | null
    notIn?: $Enums.FrameConfiguration[] | null
    not?: NestedEnumFrameConfigurationNullableWithAggregatesFilter<$PrismaModel> | $Enums.FrameConfiguration | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel>
    _max?: NestedEnumFrameConfigurationNullableFilter<$PrismaModel>
  }

  export type NestedDateTimeNullableWithAggregatesFilter<$PrismaModel = never> = {
    equals?: Date | string | DateTimeFieldRefInput<$PrismaModel> | null
    in?: Date[] | string[] | null
    notIn?: Date[] | string[] | null
    lt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    lte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gt?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    gte?: Date | string | DateTimeFieldRefInput<$PrismaModel>
    not?: NestedDateTimeNullableWithAggregatesFilter<$PrismaModel> | Date | string | null
    _count?: NestedIntNullableFilter<$PrismaModel>
    _min?: NestedDateTimeNullableFilter<$PrismaModel>
    _max?: NestedDateTimeNullableFilter<$PrismaModel>
  }

  export type NestedEnumNotificationTypeFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeFilter<$PrismaModel> | $Enums.NotificationType
  }

  export type NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel = never> = {
    equals?: $Enums.NotificationType | EnumNotificationTypeFieldRefInput<$PrismaModel>
    in?: $Enums.NotificationType[]
    notIn?: $Enums.NotificationType[]
    not?: NestedEnumNotificationTypeWithAggregatesFilter<$PrismaModel> | $Enums.NotificationType
    _count?: NestedIntFilter<$PrismaModel>
    _min?: NestedEnumNotificationTypeFilter<$PrismaModel>
    _max?: NestedEnumNotificationTypeFilter<$PrismaModel>
  }

  export type AffectationCreateWithoutUtilisateurInput = {
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    salle?: RoomCreateNestedOneWithoutAffectationsInput
    chirurgien?: SurgeonCreateNestedOneWithoutAffectationsInput
    trame?: FrameCreateNestedOneWithoutAffectationsInput
  }

  export type AffectationUncheckedCreateWithoutUtilisateurInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    salleId?: number | null
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type AffectationCreateOrConnectWithoutUtilisateurInput = {
    where: AffectationWhereUniqueInput
    create: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput>
  }

  export type AffectationCreateManyUtilisateurInputEnvelope = {
    data: AffectationCreateManyUtilisateurInput | AffectationCreateManyUtilisateurInput[]
  }

  export type LeaveCreateWithoutUtilisateurInput = {
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
  }

  export type LeaveUncheckedCreateWithoutUtilisateurInput = {
    id?: number
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
  }

  export type LeaveCreateOrConnectWithoutUtilisateurInput = {
    where: LeaveWhereUniqueInput
    create: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput>
  }

  export type LeaveCreateManyUtilisateurInputEnvelope = {
    data: LeaveCreateManyUtilisateurInput | LeaveCreateManyUtilisateurInput[]
  }

  export type CounterCreateWithoutUtilisateurInput = {
    annee: number
    congesPris?: number
    congesRestants?: number
    heuresSupplementaires?: number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
  }

  export type CounterUncheckedCreateWithoutUtilisateurInput = {
    id?: number
    annee: number
    congesPris?: number
    congesRestants?: number
    heuresSupplementaires?: number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
  }

  export type CounterCreateOrConnectWithoutUtilisateurInput = {
    where: CounterWhereUniqueInput
    create: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
  }

  export type NotificationCreateWithoutUtilisateurInput = {
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
  }

  export type NotificationUncheckedCreateWithoutUtilisateurInput = {
    id?: number
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
  }

  export type NotificationCreateOrConnectWithoutUtilisateurInput = {
    where: NotificationWhereUniqueInput
    create: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput>
  }

  export type NotificationCreateManyUtilisateurInputEnvelope = {
    data: NotificationCreateManyUtilisateurInput | NotificationCreateManyUtilisateurInput[]
  }

  export type AffectationUpsertWithWhereUniqueWithoutUtilisateurInput = {
    where: AffectationWhereUniqueInput
    update: XOR<AffectationUpdateWithoutUtilisateurInput, AffectationUncheckedUpdateWithoutUtilisateurInput>
    create: XOR<AffectationCreateWithoutUtilisateurInput, AffectationUncheckedCreateWithoutUtilisateurInput>
  }

  export type AffectationUpdateWithWhereUniqueWithoutUtilisateurInput = {
    where: AffectationWhereUniqueInput
    data: XOR<AffectationUpdateWithoutUtilisateurInput, AffectationUncheckedUpdateWithoutUtilisateurInput>
  }

  export type AffectationUpdateManyWithWhereWithoutUtilisateurInput = {
    where: AffectationScalarWhereInput
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyWithoutUtilisateurInput>
  }

  export type AffectationScalarWhereInput = {
    AND?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
    OR?: AffectationScalarWhereInput[]
    NOT?: AffectationScalarWhereInput | AffectationScalarWhereInput[]
    id?: IntFilter<"Affectation"> | number
    date?: DateTimeFilter<"Affectation"> | Date | string
    demiJournee?: EnumHalfDayFilter<"Affectation"> | $Enums.HalfDay
    type?: EnumAffectationTypeFilter<"Affectation"> | $Enums.AffectationType
    specialite?: StringFilter<"Affectation"> | string
    statut?: EnumAffectationStatusFilter<"Affectation"> | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFilter<"Affectation"> | boolean
    utilisateurId?: IntFilter<"Affectation"> | number
    salleId?: IntNullableFilter<"Affectation"> | number | null
    chirurgienId?: IntNullableFilter<"Affectation"> | number | null
    trameId?: IntNullableFilter<"Affectation"> | number | null
  }

  export type LeaveUpsertWithWhereUniqueWithoutUtilisateurInput = {
    where: LeaveWhereUniqueInput
    update: XOR<LeaveUpdateWithoutUtilisateurInput, LeaveUncheckedUpdateWithoutUtilisateurInput>
    create: XOR<LeaveCreateWithoutUtilisateurInput, LeaveUncheckedCreateWithoutUtilisateurInput>
  }

  export type LeaveUpdateWithWhereUniqueWithoutUtilisateurInput = {
    where: LeaveWhereUniqueInput
    data: XOR<LeaveUpdateWithoutUtilisateurInput, LeaveUncheckedUpdateWithoutUtilisateurInput>
  }

  export type LeaveUpdateManyWithWhereWithoutUtilisateurInput = {
    where: LeaveScalarWhereInput
    data: XOR<LeaveUpdateManyMutationInput, LeaveUncheckedUpdateManyWithoutUtilisateurInput>
  }

  export type LeaveScalarWhereInput = {
    AND?: LeaveScalarWhereInput | LeaveScalarWhereInput[]
    OR?: LeaveScalarWhereInput[]
    NOT?: LeaveScalarWhereInput | LeaveScalarWhereInput[]
    id?: IntFilter<"Leave"> | number
    dateDebut?: DateTimeFilter<"Leave"> | Date | string
    dateFin?: DateTimeFilter<"Leave"> | Date | string
    type?: EnumLeaveTypeFilter<"Leave"> | $Enums.LeaveType
    statut?: EnumLeaveStatusFilter<"Leave"> | $Enums.LeaveStatus
    commentaire?: StringNullableFilter<"Leave"> | string | null
    decompte?: BoolFilter<"Leave"> | boolean
    utilisateurId?: IntFilter<"Leave"> | number
  }

  export type CounterUpsertWithoutUtilisateurInput = {
    update: XOR<CounterUpdateWithoutUtilisateurInput, CounterUncheckedUpdateWithoutUtilisateurInput>
    create: XOR<CounterCreateWithoutUtilisateurInput, CounterUncheckedCreateWithoutUtilisateurInput>
    where?: CounterWhereInput
  }

  export type CounterUpdateToOneWithWhereWithoutUtilisateurInput = {
    where?: CounterWhereInput
    data: XOR<CounterUpdateWithoutUtilisateurInput, CounterUncheckedUpdateWithoutUtilisateurInput>
  }

  export type CounterUpdateWithoutUtilisateurInput = {
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
  }

  export type CounterUncheckedUpdateWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    annee?: IntFieldUpdateOperationsInput | number
    congesPris?: IntFieldUpdateOperationsInput | number
    congesRestants?: IntFieldUpdateOperationsInput | number
    heuresSupplementaires?: IntFieldUpdateOperationsInput | number
    statsSpecialites?: NullableJsonNullValueInput | InputJsonValue
    statsGardes?: NullableJsonNullValueInput | InputJsonValue
  }

  export type NotificationUpsertWithWhereUniqueWithoutUtilisateurInput = {
    where: NotificationWhereUniqueInput
    update: XOR<NotificationUpdateWithoutUtilisateurInput, NotificationUncheckedUpdateWithoutUtilisateurInput>
    create: XOR<NotificationCreateWithoutUtilisateurInput, NotificationUncheckedCreateWithoutUtilisateurInput>
  }

  export type NotificationUpdateWithWhereUniqueWithoutUtilisateurInput = {
    where: NotificationWhereUniqueInput
    data: XOR<NotificationUpdateWithoutUtilisateurInput, NotificationUncheckedUpdateWithoutUtilisateurInput>
  }

  export type NotificationUpdateManyWithWhereWithoutUtilisateurInput = {
    where: NotificationScalarWhereInput
    data: XOR<NotificationUpdateManyMutationInput, NotificationUncheckedUpdateManyWithoutUtilisateurInput>
  }

  export type NotificationScalarWhereInput = {
    AND?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    OR?: NotificationScalarWhereInput[]
    NOT?: NotificationScalarWhereInput | NotificationScalarWhereInput[]
    id?: IntFilter<"Notification"> | number
    dateCreation?: DateTimeFilter<"Notification"> | Date | string
    type?: EnumNotificationTypeFilter<"Notification"> | $Enums.NotificationType
    message?: StringFilter<"Notification"> | string
    lue?: BoolFilter<"Notification"> | boolean
    utilisateurId?: IntFilter<"Notification"> | number
  }

  export type AffectationCreateWithoutChirurgienInput = {
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateur: UserCreateNestedOneWithoutAffectationsInput
    salle?: RoomCreateNestedOneWithoutAffectationsInput
    trame?: FrameCreateNestedOneWithoutAffectationsInput
  }

  export type AffectationUncheckedCreateWithoutChirurgienInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    trameId?: number | null
  }

  export type AffectationCreateOrConnectWithoutChirurgienInput = {
    where: AffectationWhereUniqueInput
    create: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput>
  }

  export type AffectationCreateManyChirurgienInputEnvelope = {
    data: AffectationCreateManyChirurgienInput | AffectationCreateManyChirurgienInput[]
  }

  export type AffectationUpsertWithWhereUniqueWithoutChirurgienInput = {
    where: AffectationWhereUniqueInput
    update: XOR<AffectationUpdateWithoutChirurgienInput, AffectationUncheckedUpdateWithoutChirurgienInput>
    create: XOR<AffectationCreateWithoutChirurgienInput, AffectationUncheckedCreateWithoutChirurgienInput>
  }

  export type AffectationUpdateWithWhereUniqueWithoutChirurgienInput = {
    where: AffectationWhereUniqueInput
    data: XOR<AffectationUpdateWithoutChirurgienInput, AffectationUncheckedUpdateWithoutChirurgienInput>
  }

  export type AffectationUpdateManyWithWhereWithoutChirurgienInput = {
    where: AffectationScalarWhereInput
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyWithoutChirurgienInput>
  }

  export type AffectationCreateWithoutSalleInput = {
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateur: UserCreateNestedOneWithoutAffectationsInput
    chirurgien?: SurgeonCreateNestedOneWithoutAffectationsInput
    trame?: FrameCreateNestedOneWithoutAffectationsInput
  }

  export type AffectationUncheckedCreateWithoutSalleInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type AffectationCreateOrConnectWithoutSalleInput = {
    where: AffectationWhereUniqueInput
    create: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput>
  }

  export type AffectationCreateManySalleInputEnvelope = {
    data: AffectationCreateManySalleInput | AffectationCreateManySalleInput[]
  }

  export type AffectationUpsertWithWhereUniqueWithoutSalleInput = {
    where: AffectationWhereUniqueInput
    update: XOR<AffectationUpdateWithoutSalleInput, AffectationUncheckedUpdateWithoutSalleInput>
    create: XOR<AffectationCreateWithoutSalleInput, AffectationUncheckedCreateWithoutSalleInput>
  }

  export type AffectationUpdateWithWhereUniqueWithoutSalleInput = {
    where: AffectationWhereUniqueInput
    data: XOR<AffectationUpdateWithoutSalleInput, AffectationUncheckedUpdateWithoutSalleInput>
  }

  export type AffectationUpdateManyWithWhereWithoutSalleInput = {
    where: AffectationScalarWhereInput
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyWithoutSalleInput>
  }

  export type UserCreateWithoutAffectationsInput = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    conges?: LeaveCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationCreateNestedManyWithoutUtilisateurInput
  }

  export type UserUncheckedCreateWithoutAffectationsInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    conges?: LeaveUncheckedCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterUncheckedCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUtilisateurInput
  }

  export type UserCreateOrConnectWithoutAffectationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutAffectationsInput, UserUncheckedCreateWithoutAffectationsInput>
  }

  export type RoomCreateWithoutAffectationsInput = {
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomUncheckedCreateWithoutAffectationsInput = {
    id?: number
    nom: string
    numero: number
    type: string
    secteur: string
    codeCouleur: string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomCreateOrConnectWithoutAffectationsInput = {
    where: RoomWhereUniqueInput
    create: XOR<RoomCreateWithoutAffectationsInput, RoomUncheckedCreateWithoutAffectationsInput>
  }

  export type SurgeonCreateWithoutAffectationsInput = {
    nom: string
    prenom: string
    specialites: JsonNullValueInput | InputJsonValue
    actif?: boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonUncheckedCreateWithoutAffectationsInput = {
    id?: number
    nom: string
    prenom: string
    specialites: JsonNullValueInput | InputJsonValue
    actif?: boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonCreateOrConnectWithoutAffectationsInput = {
    where: SurgeonWhereUniqueInput
    create: XOR<SurgeonCreateWithoutAffectationsInput, SurgeonUncheckedCreateWithoutAffectationsInput>
  }

  export type FrameCreateWithoutAffectationsInput = {
    nom: string
    type: $Enums.FrameType
    configuration?: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | string
    dateFinValidite?: Date | string | null
    details: JsonNullValueInput | InputJsonValue
  }

  export type FrameUncheckedCreateWithoutAffectationsInput = {
    id?: number
    nom: string
    type: $Enums.FrameType
    configuration?: $Enums.FrameConfiguration | null
    dateDebutValidite: Date | string
    dateFinValidite?: Date | string | null
    details: JsonNullValueInput | InputJsonValue
  }

  export type FrameCreateOrConnectWithoutAffectationsInput = {
    where: FrameWhereUniqueInput
    create: XOR<FrameCreateWithoutAffectationsInput, FrameUncheckedCreateWithoutAffectationsInput>
  }

  export type UserUpsertWithoutAffectationsInput = {
    update: XOR<UserUpdateWithoutAffectationsInput, UserUncheckedUpdateWithoutAffectationsInput>
    create: XOR<UserCreateWithoutAffectationsInput, UserUncheckedCreateWithoutAffectationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutAffectationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutAffectationsInput, UserUncheckedUpdateWithoutAffectationsInput>
  }

  export type UserUpdateWithoutAffectationsInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    conges?: LeaveUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserUncheckedUpdateWithoutAffectationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    conges?: LeaveUncheckedUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUncheckedUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUtilisateurNestedInput
  }

  export type RoomUpsertWithoutAffectationsInput = {
    update: XOR<RoomUpdateWithoutAffectationsInput, RoomUncheckedUpdateWithoutAffectationsInput>
    create: XOR<RoomCreateWithoutAffectationsInput, RoomUncheckedCreateWithoutAffectationsInput>
    where?: RoomWhereInput
  }

  export type RoomUpdateToOneWithWhereWithoutAffectationsInput = {
    where?: RoomWhereInput
    data: XOR<RoomUpdateWithoutAffectationsInput, RoomUncheckedUpdateWithoutAffectationsInput>
  }

  export type RoomUpdateWithoutAffectationsInput = {
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type RoomUncheckedUpdateWithoutAffectationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    numero?: IntFieldUpdateOperationsInput | number
    type?: StringFieldUpdateOperationsInput | string
    secteur?: StringFieldUpdateOperationsInput | string
    codeCouleur?: StringFieldUpdateOperationsInput | string
    reglesSupervision?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonUpsertWithoutAffectationsInput = {
    update: XOR<SurgeonUpdateWithoutAffectationsInput, SurgeonUncheckedUpdateWithoutAffectationsInput>
    create: XOR<SurgeonCreateWithoutAffectationsInput, SurgeonUncheckedCreateWithoutAffectationsInput>
    where?: SurgeonWhereInput
  }

  export type SurgeonUpdateToOneWithWhereWithoutAffectationsInput = {
    where?: SurgeonWhereInput
    data: XOR<SurgeonUpdateWithoutAffectationsInput, SurgeonUncheckedUpdateWithoutAffectationsInput>
  }

  export type SurgeonUpdateWithoutAffectationsInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type SurgeonUncheckedUpdateWithoutAffectationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    specialites?: JsonNullValueInput | InputJsonValue
    actif?: BoolFieldUpdateOperationsInput | boolean
    reglesSpecifiques?: NullableJsonNullValueInput | InputJsonValue
  }

  export type FrameUpsertWithoutAffectationsInput = {
    update: XOR<FrameUpdateWithoutAffectationsInput, FrameUncheckedUpdateWithoutAffectationsInput>
    create: XOR<FrameCreateWithoutAffectationsInput, FrameUncheckedCreateWithoutAffectationsInput>
    where?: FrameWhereInput
  }

  export type FrameUpdateToOneWithWhereWithoutAffectationsInput = {
    where?: FrameWhereInput
    data: XOR<FrameUpdateWithoutAffectationsInput, FrameUncheckedUpdateWithoutAffectationsInput>
  }

  export type FrameUpdateWithoutAffectationsInput = {
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
  }

  export type FrameUncheckedUpdateWithoutAffectationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    type?: EnumFrameTypeFieldUpdateOperationsInput | $Enums.FrameType
    configuration?: NullableEnumFrameConfigurationFieldUpdateOperationsInput | $Enums.FrameConfiguration | null
    dateDebutValidite?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFinValidite?: NullableDateTimeFieldUpdateOperationsInput | Date | string | null
    details?: JsonNullValueInput | InputJsonValue
  }

  export type UserCreateWithoutCongesInput = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationCreateNestedManyWithoutUtilisateurInput
  }

  export type UserUncheckedCreateWithoutCongesInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationUncheckedCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterUncheckedCreateNestedOneWithoutUtilisateurInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUtilisateurInput
  }

  export type UserCreateOrConnectWithoutCongesInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCongesInput, UserUncheckedCreateWithoutCongesInput>
  }

  export type UserUpsertWithoutCongesInput = {
    update: XOR<UserUpdateWithoutCongesInput, UserUncheckedUpdateWithoutCongesInput>
    create: XOR<UserCreateWithoutCongesInput, UserUncheckedCreateWithoutCongesInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCongesInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCongesInput, UserUncheckedUpdateWithoutCongesInput>
  }

  export type UserUpdateWithoutCongesInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserUncheckedUpdateWithoutCongesInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUncheckedUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUncheckedUpdateOneWithoutUtilisateurNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserCreateWithoutCompteurInput = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveCreateNestedManyWithoutUtilisateurInput
    notifications?: NotificationCreateNestedManyWithoutUtilisateurInput
  }

  export type UserUncheckedCreateWithoutCompteurInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationUncheckedCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveUncheckedCreateNestedManyWithoutUtilisateurInput
    notifications?: NotificationUncheckedCreateNestedManyWithoutUtilisateurInput
  }

  export type UserCreateOrConnectWithoutCompteurInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutCompteurInput, UserUncheckedCreateWithoutCompteurInput>
  }

  export type UserUpsertWithoutCompteurInput = {
    update: XOR<UserUpdateWithoutCompteurInput, UserUncheckedUpdateWithoutCompteurInput>
    create: XOR<UserCreateWithoutCompteurInput, UserUncheckedCreateWithoutCompteurInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutCompteurInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutCompteurInput, UserUncheckedUpdateWithoutCompteurInput>
  }

  export type UserUpdateWithoutCompteurInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUpdateManyWithoutUtilisateurNestedInput
    notifications?: NotificationUpdateManyWithoutUtilisateurNestedInput
  }

  export type UserUncheckedUpdateWithoutCompteurInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUncheckedUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUncheckedUpdateManyWithoutUtilisateurNestedInput
    notifications?: NotificationUncheckedUpdateManyWithoutUtilisateurNestedInput
  }

  export type AffectationCreateWithoutTrameInput = {
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateur: UserCreateNestedOneWithoutAffectationsInput
    salle?: RoomCreateNestedOneWithoutAffectationsInput
    chirurgien?: SurgeonCreateNestedOneWithoutAffectationsInput
  }

  export type AffectationUncheckedCreateWithoutTrameInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    chirurgienId?: number | null
  }

  export type AffectationCreateOrConnectWithoutTrameInput = {
    where: AffectationWhereUniqueInput
    create: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput>
  }

  export type AffectationCreateManyTrameInputEnvelope = {
    data: AffectationCreateManyTrameInput | AffectationCreateManyTrameInput[]
  }

  export type AffectationUpsertWithWhereUniqueWithoutTrameInput = {
    where: AffectationWhereUniqueInput
    update: XOR<AffectationUpdateWithoutTrameInput, AffectationUncheckedUpdateWithoutTrameInput>
    create: XOR<AffectationCreateWithoutTrameInput, AffectationUncheckedCreateWithoutTrameInput>
  }

  export type AffectationUpdateWithWhereUniqueWithoutTrameInput = {
    where: AffectationWhereUniqueInput
    data: XOR<AffectationUpdateWithoutTrameInput, AffectationUncheckedUpdateWithoutTrameInput>
  }

  export type AffectationUpdateManyWithWhereWithoutTrameInput = {
    where: AffectationScalarWhereInput
    data: XOR<AffectationUpdateManyMutationInput, AffectationUncheckedUpdateManyWithoutTrameInput>
  }

  export type UserCreateWithoutNotificationsInput = {
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterCreateNestedOneWithoutUtilisateurInput
  }

  export type UserUncheckedCreateWithoutNotificationsInput = {
    id?: number
    nom: string
    prenom: string
    email: string
    motDePasse: string
    type: $Enums.UserType
    niveauAcces: $Enums.AccessLevel
    configurationTravail: JsonNullValueInput | InputJsonValue
    droitsConges: number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: Date | string
    affectations?: AffectationUncheckedCreateNestedManyWithoutUtilisateurInput
    conges?: LeaveUncheckedCreateNestedManyWithoutUtilisateurInput
    compteur?: CounterUncheckedCreateNestedOneWithoutUtilisateurInput
  }

  export type UserCreateOrConnectWithoutNotificationsInput = {
    where: UserWhereUniqueInput
    create: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
  }

  export type UserUpsertWithoutNotificationsInput = {
    update: XOR<UserUpdateWithoutNotificationsInput, UserUncheckedUpdateWithoutNotificationsInput>
    create: XOR<UserCreateWithoutNotificationsInput, UserUncheckedCreateWithoutNotificationsInput>
    where?: UserWhereInput
  }

  export type UserUpdateToOneWithWhereWithoutNotificationsInput = {
    where?: UserWhereInput
    data: XOR<UserUpdateWithoutNotificationsInput, UserUncheckedUpdateWithoutNotificationsInput>
  }

  export type UserUpdateWithoutNotificationsInput = {
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUpdateOneWithoutUtilisateurNestedInput
  }

  export type UserUncheckedUpdateWithoutNotificationsInput = {
    id?: IntFieldUpdateOperationsInput | number
    nom?: StringFieldUpdateOperationsInput | string
    prenom?: StringFieldUpdateOperationsInput | string
    email?: StringFieldUpdateOperationsInput | string
    motDePasse?: StringFieldUpdateOperationsInput | string
    type?: EnumUserTypeFieldUpdateOperationsInput | $Enums.UserType
    niveauAcces?: EnumAccessLevelFieldUpdateOperationsInput | $Enums.AccessLevel
    configurationTravail?: JsonNullValueInput | InputJsonValue
    droitsConges?: IntFieldUpdateOperationsInput | number
    specialites?: NullableJsonNullValueInput | InputJsonValue
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    affectations?: AffectationUncheckedUpdateManyWithoutUtilisateurNestedInput
    conges?: LeaveUncheckedUpdateManyWithoutUtilisateurNestedInput
    compteur?: CounterUncheckedUpdateOneWithoutUtilisateurNestedInput
  }

  export type AffectationCreateManyUtilisateurInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    salleId?: number | null
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type LeaveCreateManyUtilisateurInput = {
    id?: number
    dateDebut: Date | string
    dateFin: Date | string
    type: $Enums.LeaveType
    statut: $Enums.LeaveStatus
    commentaire?: string | null
    decompte?: boolean
  }

  export type NotificationCreateManyUtilisateurInput = {
    id?: number
    dateCreation?: Date | string
    type: $Enums.NotificationType
    message: string
    lue?: boolean
  }

  export type AffectationUpdateWithoutUtilisateurInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    salle?: RoomUpdateOneWithoutAffectationsNestedInput
    chirurgien?: SurgeonUpdateOneWithoutAffectationsNestedInput
    trame?: FrameUpdateOneWithoutAffectationsNestedInput
  }

  export type AffectationUncheckedUpdateWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationUncheckedUpdateManyWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type LeaveUpdateWithoutUtilisateurInput = {
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
  }

  export type LeaveUncheckedUpdateWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
  }

  export type LeaveUncheckedUpdateManyWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateDebut?: DateTimeFieldUpdateOperationsInput | Date | string
    dateFin?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumLeaveTypeFieldUpdateOperationsInput | $Enums.LeaveType
    statut?: EnumLeaveStatusFieldUpdateOperationsInput | $Enums.LeaveStatus
    commentaire?: NullableStringFieldUpdateOperationsInput | string | null
    decompte?: BoolFieldUpdateOperationsInput | boolean
  }

  export type NotificationUpdateWithoutUtilisateurInput = {
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
  }

  export type NotificationUncheckedUpdateWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
  }

  export type NotificationUncheckedUpdateManyWithoutUtilisateurInput = {
    id?: IntFieldUpdateOperationsInput | number
    dateCreation?: DateTimeFieldUpdateOperationsInput | Date | string
    type?: EnumNotificationTypeFieldUpdateOperationsInput | $Enums.NotificationType
    message?: StringFieldUpdateOperationsInput | string
    lue?: BoolFieldUpdateOperationsInput | boolean
  }

  export type AffectationCreateManyChirurgienInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    trameId?: number | null
  }

  export type AffectationUpdateWithoutChirurgienInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutAffectationsNestedInput
    salle?: RoomUpdateOneWithoutAffectationsNestedInput
    trame?: FrameUpdateOneWithoutAffectationsNestedInput
  }

  export type AffectationUncheckedUpdateWithoutChirurgienInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationUncheckedUpdateManyWithoutChirurgienInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationCreateManySalleInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    chirurgienId?: number | null
    trameId?: number | null
  }

  export type AffectationUpdateWithoutSalleInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutAffectationsNestedInput
    chirurgien?: SurgeonUpdateOneWithoutAffectationsNestedInput
    trame?: FrameUpdateOneWithoutAffectationsNestedInput
  }

  export type AffectationUncheckedUpdateWithoutSalleInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationUncheckedUpdateManyWithoutSalleInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
    trameId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationCreateManyTrameInput = {
    id?: number
    date: Date | string
    demiJournee: $Enums.HalfDay
    type: $Enums.AffectationType
    specialite: string
    statut: $Enums.AffectationStatus
    situationExceptionnelle?: boolean
    utilisateurId: number
    salleId?: number | null
    chirurgienId?: number | null
  }

  export type AffectationUpdateWithoutTrameInput = {
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateur?: UserUpdateOneRequiredWithoutAffectationsNestedInput
    salle?: RoomUpdateOneWithoutAffectationsNestedInput
    chirurgien?: SurgeonUpdateOneWithoutAffectationsNestedInput
  }

  export type AffectationUncheckedUpdateWithoutTrameInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
  }

  export type AffectationUncheckedUpdateManyWithoutTrameInput = {
    id?: IntFieldUpdateOperationsInput | number
    date?: DateTimeFieldUpdateOperationsInput | Date | string
    demiJournee?: EnumHalfDayFieldUpdateOperationsInput | $Enums.HalfDay
    type?: EnumAffectationTypeFieldUpdateOperationsInput | $Enums.AffectationType
    specialite?: StringFieldUpdateOperationsInput | string
    statut?: EnumAffectationStatusFieldUpdateOperationsInput | $Enums.AffectationStatus
    situationExceptionnelle?: BoolFieldUpdateOperationsInput | boolean
    utilisateurId?: IntFieldUpdateOperationsInput | number
    salleId?: NullableIntFieldUpdateOperationsInput | number | null
    chirurgienId?: NullableIntFieldUpdateOperationsInput | number | null
  }



  /**
   * Batch Payload for updateMany & deleteMany & createMany
   */

  export type BatchPayload = {
    count: number
  }

  /**
   * DMMF
   */
  export const dmmf: runtime.BaseDMMF
}