import { NextRequest, NextResponse } from 'next/server';
import { analyticsService, LeavePeakAggregationUnit } from '@/modules/analytics/services/analyticsService';
import { LeaveType } from '@prisma/client';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const startDateString = searchParams.get('startDate');
    const endDateString = searchParams.get('endDate');
    const aggregationUnitString = searchParams.get('aggregationUnit');
    const leaveTypesString = searchParams.get('leaveTypes');
    const siteId = searchParams.get('siteId') || undefined;

    if (!startDateString || !endDateString || !aggregationUnitString) {
        return NextResponse.json({ error: 'startDate, endDate, and aggregationUnit are required' }, { status: 400 });
    }

    const startDate = new Date(startDateString);
    const endDate = new Date(endDateString);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return NextResponse.json({ error: 'Invalid date format for startDate or endDate' }, { status: 400 });
    }

    const aggregationUnit = aggregationUnitString.toUpperCase() as LeavePeakAggregationUnit;
    if (!['DAY', 'WEEK', 'MONTH'].includes(aggregationUnit)) {
        return NextResponse.json({ error: 'Invalid aggregationUnit. Must be DAY, WEEK, or MONTH' }, { status: 400 });
    }

    let leaveTypes: LeaveType[] | undefined = undefined;
    if (leaveTypesString) {
        leaveTypes = leaveTypesString.split(',') as LeaveType[];
        const validLeaveTypes = Object.values(LeaveType);
        if (leaveTypes.some(lt => !validLeaveTypes.includes(lt))) {
            return NextResponse.json({ error: 'Invalid leaveType provided. Valid types are: ' + validLeaveTypes.join(', ') }, { status: 400 });
        }
    }

    try {
        const stats = await analyticsService.getLeavePeakAnalysis({
            startDate,
            endDate,
            aggregationUnit,
            leaveTypes,
            siteId,
        });
        return NextResponse.json(stats);
    } catch (error) {
        console.error('Error fetching leave peak analysis:', error);
        const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
        return NextResponse.json({ error: 'Failed to fetch leave peak statistics', details: errorMessage }, { status: 500 });
    }
} 