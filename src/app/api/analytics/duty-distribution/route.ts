import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/modules/analytics/services/analyticsService';
import { ActivityCategory, ProfessionalRole } from '@prisma/client'; // Import enums

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDateString = searchParams.get('startDate');
    const endDateString = searchParams.get('endDate');
    const siteId = searchParams.get('siteId') || undefined;
    const rolesString = searchParams.get('roles');

    if (!startDateString || !endDateString) {
        return NextResponse.json({ error: 'startDate and endDate are required' }, { status: 400 });
    }

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for startDate or endDate' }, { status: 400 });
    }

    let roles: ProfessionalRole[] | undefined = undefined;
    if (rolesString) {
        roles = rolesString.split(',') as ProfessionalRole[];
        // Basic validation if roles are valid ProfessionalRole enum values
        const validRoles = Object.values(ProfessionalRole);
        if (roles.some(role => !validRoles.includes(role))) {
            return NextResponse.json({ error: 'Invalid role provided. Valid roles are: ' + validRoles.join(', ') }, { status: 400 });
        }
    }

    try {
        const stats = await analyticsService.getGuardDutyDistributionStats(
            startDate,
            endDate,
            siteId,
            roles
        );
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching guard duty distribution stats:', error);
        // Linter/type error potential: error might not have a 'message' property depending on its type.
        // Consider a more robust error handling like: 
        // const message = error instanceof Error ? error.message : 'An unexpected error occurred';
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ error: 'Failed to fetch statistics', details: errorMessage }, { status: 500 });
    }
} 