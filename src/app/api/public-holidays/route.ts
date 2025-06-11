import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
// Importer depuis le service existant
import { publicHolidayService } from '@/modules/leaves/services/publicHolidayService';
import { PublicHoliday } from '@/modules/leaves/types/public-holiday'; // Assurez-vous que ce type est correct
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { calculateEaster } from '@/utils/dateUtils';
import { format, addDays } from 'date-fns';

// Schéma de validation pour les paramètres
const querySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  region: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;

  const queryParams = {
    year: searchParams.get('year'),
    startDate: searchParams.get('startDate'),
    endDate: searchParams.get('endDate'),
    region: searchParams.get('region'),
  };

  const validationResult = querySchema.safeParse(queryParams);

  if (!validationResult.success) {
    return NextResponse.json(
      { error: 'Paramètres invalides', details: validationResult.error.errors },
      { status: 400 }
    );
  }

  const { year, startDate, endDate, region } = validationResult.data;

  try {
    let holidays: PublicHoliday[];

    if (startDate && endDate) {
      // Utiliser les jours fériés calculés localement au lieu d'appeler le service
      // pour éviter la récursion infinie
      holidays = await getHolidaysInRange(startDate, endDate, region);
    } else if (year) {
      holidays = await getHolidaysForYear(year);
    } else {
      return NextResponse.json(
        { error: 'Paramètre year ou (startDate et endDate) requis' },
        { status: 400 }
      );
    }

    return NextResponse.json(holidays);
  } catch (error: unknown) {
    logger.error(`Erreur API [GET /api/public-holidays]:`, { error: error });
    return NextResponse.json(
      { error: 'Erreur serveur lors de la récupération des jours fériés.' },
      { status: 500 }
    );
  }
}

// Fonctions helper pour éviter la récursion avec le service
async function getHolidaysForYear(year: number): Promise<PublicHoliday[]> {
  // Calcul local des jours fériés français
  return calculateFrenchPublicHolidays(year);
}

async function getHolidaysInRange(
  startDate: string,
  endDate: string,
  region?: string
): Promise<PublicHoliday[]> {
  const start = new Date(startDate);
  const end = new Date(endDate);

  const startYear = start.getFullYear();
  const endYear = end.getFullYear();

  let allHolidays: PublicHoliday[] = [];

  // Récupérer les jours fériés pour toutes les années concernées
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = await getHolidaysForYear(year);
    allHolidays = [...allHolidays, ...yearHolidays];
  }

  // Filtrer par plage de dates
  return allHolidays.filter(holiday => {
    const holidayDate = new Date(holiday.date);
    return (
      holidayDate >= start &&
      holidayDate <= end &&
      (!region || holiday.region === region || holiday.isNational)
    );
  });
}

function calculateFrenchPublicHolidays(year: number): PublicHoliday[] {
  const holidays: PublicHoliday[] = [];

  // Jours fériés fixes
  const fixedHolidays = [
    { date: `${year}-01-01`, name: "Jour de l'An", isNational: true },
    { date: `${year}-05-01`, name: 'Fête du Travail', isNational: true },
    { date: `${year}-05-08`, name: 'Victoire 1945', isNational: true },
    { date: `${year}-07-14`, name: 'Fête Nationale', isNational: true },
    { date: `${year}-08-15`, name: 'Assomption', isNational: true },
    { date: `${year}-11-01`, name: 'Toussaint', isNational: true },
    { date: `${year}-11-11`, name: 'Armistice 1918', isNational: true },
    { date: `${year}-12-25`, name: 'Noël', isNational: true },
  ];

  fixedHolidays.forEach(holiday => {
    holidays.push({
      id: uuidv4(),
      ...holiday,
      country: 'FR',
      isWorkingDay: false,
    });
  });

  // Calcul de Pâques et jours fériés associés
  const easter = calculateEaster(year);

  const easterBasedHolidays = [
    {
      date: format(addDays(easter, 1), 'yyyy-MM-dd'),
      name: 'Lundi de Pâques',
      isNational: true,
    },
    {
      date: format(addDays(easter, 39), 'yyyy-MM-dd'),
      name: 'Ascension',
      isNational: true,
    },
    {
      date: format(addDays(easter, 50), 'yyyy-MM-dd'),
      name: 'Lundi de Pentecôte',
      isNational: true,
    },
  ];

  easterBasedHolidays.forEach(holiday => {
    holidays.push({
      id: uuidv4(),
      ...holiday,
      country: 'FR',
      isWorkingDay: false,
    });
  });

  return holidays;
}
