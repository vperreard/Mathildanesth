import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RuleVersioningService } from '@/modules/dynamicRules/v2/services/RuleVersioningService';
import { z } from 'zod';

const querySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform(val => parseInt(val || '10')),
  offset: z
    .string()
    .optional()
    .transform(val => parseInt(val || '0')),
});

// GET /api/admin/rules/v2/[ruleId]/versions - Get version history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { limit, offset } = querySchema.parse(searchParams);

    const versioningService = RuleVersioningService.getInstance();
    const versions = await versioningService.getVersionHistory(params.ruleId, limit, offset);

    return NextResponse.json({
      versions,
      ruleId: params.ruleId,
    });
  } catch (error: unknown) {
    logger.error('Error fetching version history:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Erreur lors de la récupération de l'historique" },
      { status: 500 }
    );
  }
}

// POST /api/admin/rules/v2/[ruleId]/versions - Compare versions or revert
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ruleId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const body = await request.json();
    const versioningService = RuleVersioningService.getInstance();

    if (body.action === 'compare') {
      const { version1, version2 } = body;

      if (!version1 || !version2) {
        return NextResponse.json(
          { error: 'Deux versions sont requises pour la comparaison' },
          { status: 400 }
        );
      }

      const comparison = await versioningService.compareVersions(params.ruleId, version1, version2);

      return NextResponse.json(comparison);
    } else if (body.action === 'revert') {
      const { targetVersion } = body;

      if (!targetVersion) {
        return NextResponse.json({ error: 'Version cible requise' }, { status: 400 });
      }

      const revertedRule = await versioningService.revertToVersion(
        params.ruleId,
        targetVersion,
        session.user.id
      );

      return NextResponse.json({
        rule: revertedRule,
        message: `Règle restaurée à la version ${targetVersion}`,
      });
    } else if (body.action === 'diff') {
      const { fromVersion, toVersion } = body;

      const diff = await versioningService.getDiff(params.ruleId, fromVersion, toVersion);

      return NextResponse.json({
        diff,
        ruleId: params.ruleId,
        fromVersion,
        toVersion,
      });
    } else {
      return NextResponse.json({ error: 'Action non reconnue' }, { status: 400 });
    }
  } catch (error: unknown) {
    logger.error('Error in version action:', error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Erreur lors de l'opération sur les versions" },
      { status: 500 }
    );
  }
}
