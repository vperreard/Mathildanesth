import { prisma } from '@/lib/prisma';
import { User, Site, Surgeon } from '@prisma/client';

jest.mock('@/lib/prisma');


export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  professionalRole?: string;
  sites?: Site[];
  skills?: string[];
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  siteId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class TeamService {
  /**
   * Get all team members for a specific site
   */
  async getTeamBySite(siteId: string): Promise<TeamMember[]> {
    const users = await prisma.user.findMany({
      where: {
        sites: {
          some: {
            id: siteId
          }
        }
      },
      include: {
        sites: true,
      }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professionalRole: user.professionalRole || undefined,
      sites: user.sites,
      skills: [],
    }));
  }

  /**
   * Get team members by professional role
   */
  async getTeamByRole(professionalRole: string, siteId?: string): Promise<TeamMember[]> {
    const where: any = {
      professionalRole,
    };

    if (siteId) {
      where.sites = {
        some: {
          id: siteId
        }
      };
    }

    const users = await prisma.user.findMany({
      where,
      include: {
        sites: true,
      }
    });

    return users.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professionalRole: user.professionalRole || undefined,
      sites: user.sites,
      skills: [],
    }));
  }

  /**
   * Get available team members for a specific date
   */
  async getAvailableTeamMembers(
    date: Date,
    siteId?: string,
    professionalRole?: string
  ): Promise<TeamMember[]> {
    const where: any = {};

    if (siteId) {
      where.sites = {
        some: {
          id: siteId
        }
      };
    }

    if (professionalRole) {
      where.professionalRole = professionalRole;
    }

    // Get all users matching criteria
    const users = await prisma.user.findMany({
      where,
      include: {
        sites: true,
        leaves: {
          where: {
            startDate: { lte: date },
            endDate: { gte: date },
            status: { in: ['PENDING', 'APPROVED'] }
          }
        }
      }
    });

    // Filter out users who are on leave
    const availableUsers = users.filter(user => user.leaves.length === 0);

    return availableUsers.map(user => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      professionalRole: user.professionalRole || undefined,
      sites: user.sites,
      skills: [],
    }));
  }

  /**
   * Get surgeons as team members
   */
  async getSurgeonTeamMembers(siteId?: string): Promise<TeamMember[]> {
    const where: any = {};

    if (siteId) {
      where.sites = {
        some: {
          id: siteId
        }
      };
    }

    const surgeons = await prisma.surgeon.findMany({
      where,
      include: {
        sites: true,
      }
    });

    return surgeons.map(surgeon => ({
      id: surgeon.id,
      name: surgeon.name,
      email: surgeon.email || '',
      role: 'SURGEON',
      professionalRole: 'SURGEON',
      sites: surgeon.sites,
      skills: surgeon.specialties || [],
    }));
  }

  /**
   * Create a team (for future team management features)
   */
  async createTeam(data: {
    name: string;
    description?: string;
    siteId?: string;
    memberIds: string[];
  }): Promise<Team> {
    // This is a placeholder for future team management functionality
    // For now, we just return a mock team
    const members = await prisma.user.findMany({
      where: {
        id: { in: data.memberIds }
      },
      include: {
        sites: true,
      }
    });

    return {
      id: 'team-' + Date.now(),
      name: data.name,
      description: data.description,
      siteId: data.siteId,
      members: members.map(user => ({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        professionalRole: user.professionalRole || undefined,
        sites: user.sites,
        skills: [],
      })),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }
}

// Export singleton instance
export const teamService = new TeamService();