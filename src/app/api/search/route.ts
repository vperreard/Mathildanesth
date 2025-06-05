import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface SearchResult {
  id: string;
  type: 'user' | 'leave' | 'planning' | 'surgeon' | 'site';
  title: string;
  subtitle?: string;
  description?: string;
  score: number;
  [key: string]: any;
}

// Simple fuzzy search implementation
function fuzzyMatch(text: string, query: string): number {
  const normalizedText = text.toLowerCase();
  const normalizedQuery = query.toLowerCase();
  
  // Exact match
  if (normalizedText === normalizedQuery) return 1;
  
  // Contains match
  if (normalizedText.includes(normalizedQuery)) {
    const position = normalizedText.indexOf(normalizedQuery);
    return 0.8 - (position * 0.01); // Higher score for matches at the beginning
  }
  
  // Word match
  const words = normalizedText.split(/\s+/);
  const queryWords = normalizedQuery.split(/\s+/);
  let matchCount = 0;
  
  for (const queryWord of queryWords) {
    if (words.some(word => word.includes(queryWord))) {
      matchCount++;
    }
  }
  
  if (matchCount > 0) {
    return (matchCount / queryWords.length) * 0.6;
  }
  
  // Character match
  let charMatches = 0;
  for (const char of normalizedQuery) {
    if (normalizedText.includes(char)) {
      charMatches++;
    }
  }
  
  return (charMatches / normalizedQuery.length) * 0.3;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results: SearchResult[] = [];

    // Search users
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
      take: 10,
    });

    for (const user of users) {
      const nameScore = fuzzyMatch(user.name || '', query);
      const emailScore = fuzzyMatch(user.email || '', query);
      const score = Math.max(nameScore, emailScore * 0.8);
      
      if (score > 0.3) {
        results.push({
          id: user.id,
          type: 'user',
          title: user.name || 'Utilisateur',
          name: user.name,
          email: user.email,
          role: user.role,
          score,
        });
      }
    }

    // Search leaves (if user has permission)
    if (session.user.role === 'ADMIN_TOTAL' || session.user.role === 'ADMIN_PARTIEL') {
      const leaves = await prisma.leaveRequest.findMany({
        where: {
          OR: [
            { user: { name: { contains: query, mode: 'insensitive' } } },
            { type: { name: { contains: query, mode: 'insensitive' } } },
            { status: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          user: true,
          type: true,
        },
        take: 10,
      });

      for (const leave of leaves) {
        const userNameScore = fuzzyMatch(leave.user.name || '', query);
        const typeScore = fuzzyMatch(leave.type.name || '', query);
        const score = Math.max(userNameScore, typeScore * 0.8);
        
        if (score > 0.3) {
          results.push({
            id: leave.id,
            type: 'leave',
            title: `Congé de ${leave.user.name}`,
            userName: leave.user.name,
            startDate: leave.startDate.toISOString().split('T')[0],
            endDate: leave.endDate.toISOString().split('T')[0],
            leaveType: leave.type.name,
            status: leave.status,
            score,
          });
        }
      }
    }

    // Search surgeons
    const surgeons = await prisma.surgeon.findMany({
      where: {
        name: { contains: query, mode: 'insensitive' },
      },
      include: {
        specialties: {
          include: {
            specialty: true,
          },
        },
        sites: {
          include: {
            site: true,
          },
        },
      },
      take: 10,
    });

    for (const surgeon of surgeons) {
      const score = fuzzyMatch(surgeon.name, query);
      
      if (score > 0.3) {
        results.push({
          id: surgeon.id,
          type: 'surgeon',
          title: surgeon.name,
          name: surgeon.name,
          specialties: surgeon.specialties.map(s => s.specialty.name),
          sites: surgeon.sites.map(s => s.site.name),
          score,
        });
      }
    }

    // Search sites
    const sites = await prisma.site.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        _count: {
          select: { operatingRooms: true },
        },
      },
      take: 10,
    });

    for (const site of sites) {
      const nameScore = fuzzyMatch(site.name, query);
      const descScore = site.description ? fuzzyMatch(site.description, query) : 0;
      const score = Math.max(nameScore, descScore * 0.6);
      
      if (score > 0.3) {
        results.push({
          id: site.id,
          type: 'site',
          title: site.name,
          name: site.name,
          description: site.description,
          roomsCount: site._count.operatingRooms,
          score,
        });
      }
    }

    // Sort results by score
    results.sort((a, b) => b.score - a.score);

    return NextResponse.json({ 
      results: results.slice(0, 20), // Limit to top 20 results
      query,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Search error:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}