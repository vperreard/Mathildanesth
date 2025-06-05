import { NextRequest, NextResponse } from 'next/server';
import { logger } from "@/lib/logger";
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { RuleTemplate } from '@/modules/dynamicRules/v2/types/ruleV2.types';

// Predefined templates
const RULE_TEMPLATES: RuleTemplate[] = [
  {
    id: 'max-guards-week',
    name: 'Limitation gardes hebdomadaires',
    category: 'Charge de travail',
    description: 'Limite le nombre de gardes qu\'un utilisateur peut effectuer par semaine',
    icon: 'shield',
    baseRule: {
      name: 'Limite gardes hebdomadaires - {role}',
      description: 'Limite à {maxGuards} garde(s) par semaine pour les {role}',
      type: 'PLANNING',
      priority: 10,
      enabled: true,
      status: 'draft',
      conditions: [
        {
          field: 'user.role',
          operator: 'EQUALS',
          value: '{role}'
        },
        {
          field: 'planning.guardCount',
          operator: 'GREATER_THAN',
          value: '{maxGuards}'
        },
        {
          field: 'period',
          operator: 'EQUALS',
          value: 'week'
        }
      ],
      actions: [
        {
          type: 'PREVENT',
          target: 'attribution',
          message: 'Limite de {maxGuards} garde(s) par semaine dépassée'
        },
        {
          type: 'NOTIFY',
          target: 'manager',
          message: '{user.name} a atteint sa limite de gardes hebdomadaires'
        }
      ]
    },
    parameters: [
      {
        name: 'role',
        type: 'select',
        label: 'Rôle concerné',
        required: true,
        default: 'IADE',
        options: [
          { value: 'IADE', label: 'IADE' },
          { value: 'MAR', label: 'MAR' }
        ]
      },
      {
        name: 'maxGuards',
        type: 'number',
        label: 'Nombre maximum de gardes',
        required: true,
        default: 2,
        validation: { min: 1, max: 7 }
      }
    ],
    examples: [
      {
        title: 'IADE - 2 gardes max',
        description: 'Limite les IADEs à 2 gardes par semaine',
        parameters: { role: 'IADE', maxGuards: 2 },
        expectedBehavior: 'Empêche l\'affectation d\'une 3ème garde dans la semaine'
      }
    ]
  },
  {
    id: 'rest-after-guard',
    name: 'Repos après garde',
    category: 'Repos et récupération',
    description: 'Impose une période de repos minimum après une garde',
    icon: 'clock',
    baseRule: {
      name: 'Repos obligatoire après garde',
      description: 'Impose {restHours}h de repos après une garde',
      type: 'CONSTRAINT',
      priority: 20,
      enabled: true,
      status: 'draft',
      conditions: [
        {
          field: 'previous.type',
          operator: 'EQUALS',
          value: 'GUARD'
        },
        {
          field: 'timeSincePrevious',
          operator: 'LESS_THAN',
          value: '{restHours}'
        }
      ],
      actions: [
        {
          type: 'PREVENT',
          target: 'attribution',
          message: 'Repos de {restHours}h requis après une garde'
        }
      ]
    },
    parameters: [
      {
        name: 'restHours',
        type: 'number',
        label: 'Heures de repos minimum',
        required: true,
        default: 48,
        validation: { min: 24, max: 72 }
      }
    ],
    examples: [
      {
        title: 'Repos 48h standard',
        description: 'Impose 48h de repos après chaque garde',
        parameters: { restHours: 48 },
        expectedBehavior: 'Bloque toute affectation dans les 48h suivant une garde'
      }
    ]
  },
  {
    id: 'min-senior-per-shift',
    name: 'Minimum senior par vacation',
    category: 'Supervision',
    description: 'Assure la présence d\'un nombre minimum de seniors par vacation',
    icon: 'users',
    baseRule: {
      name: 'Minimum {minSeniors} senior(s) - {sector}',
      description: 'Exige au moins {minSeniors} MAR senior(s) dans le secteur {sector}',
      type: 'SUPERVISION',
      priority: 15,
      enabled: true,
      status: 'draft',
      conditions: [
        {
          field: 'attribution.sector',
          operator: 'EQUALS',
          value: '{sector}'
        },
        {
          field: 'seniorCount',
          operator: 'LESS_THAN',
          value: '{minSeniors}'
        }
      ],
      actions: [
        {
          type: 'SUGGEST',
          target: 'attribution',
          message: 'Ajouter un MAR senior dans ce secteur'
        },
        {
          type: 'NOTIFY',
          target: 'admin',
          message: 'Manque de supervision senior dans le secteur {sector}'
        }
      ]
    },
    parameters: [
      {
        name: 'sector',
        type: 'select',
        label: 'Secteur',
        required: true,
        options: [
          { value: 'URGENCES', label: 'Urgences' },
          { value: 'PEDIATRIE', label: 'Pédiatrie' },
          { value: 'CARDIOLOGIE', label: 'Cardiologie' }
        ]
      },
      {
        name: 'minSeniors',
        type: 'number',
        label: 'Nombre minimum de seniors',
        required: true,
        default: 1,
        validation: { min: 1, max: 3 }
      }
    ],
    examples: [
      {
        title: 'Urgences - 1 senior minimum',
        description: 'Au moins 1 MAR senior aux urgences',
        parameters: { sector: 'URGENCES', minSeniors: 1 },
        expectedBehavior: 'Alerte si aucun senior n\'est affecté aux urgences'
      }
    ]
  },
  {
    id: 'workload-balance',
    name: 'Équilibrage charge de travail',
    category: 'Équité',
    description: 'Équilibre la charge de travail entre les membres de l\'équipe',
    icon: 'balance',
    baseRule: {
      name: 'Équilibrage charge - {team}',
      description: 'Limite l\'écart de charge à {maxDifference}% dans l\'équipe {team}',
      type: 'ALLOCATION',
      priority: 5,
      enabled: true,
      status: 'draft',
      conditions: [
        {
          field: 'user.team',
          operator: 'EQUALS',
          value: '{team}'
        },
        {
          field: 'workloadDifference',
          operator: 'GREATER_THAN',
          value: '{maxDifference}'
        }
      ],
      actions: [
        {
          type: 'SUGGEST',
          target: 'planning',
          message: 'Rééquilibrer la charge de travail'
        },
        {
          type: 'LOG',
          message: 'Déséquilibre de charge détecté dans l\'équipe {team}'
        }
      ]
    },
    parameters: [
      {
        name: 'team',
        type: 'string',
        label: 'Équipe',
        required: true,
        default: 'Équipe A'
      },
      {
        name: 'maxDifference',
        type: 'number',
        label: 'Écart maximum (%)',
        required: true,
        default: 20,
        validation: { min: 10, max: 50 }
      }
    ],
    examples: [
      {
        title: 'Équipe A - 20% max',
        description: 'Limite l\'écart de charge à 20% dans l\'équipe A',
        parameters: { team: 'Équipe A', maxDifference: 20 },
        expectedBehavior: 'Suggère un rééquilibrage si l\'écart dépasse 20%'
      }
    ]
  },
  {
    id: 'leave-conflict-prevention',
    name: 'Prévention conflits congés',
    category: 'Congés',
    description: 'Empêche les conflits de congés dans une équipe',
    icon: 'calendar',
    baseRule: {
      name: 'Limite congés simultanés - {team}',
      description: 'Maximum {maxSimultaneous} personne(s) en congé simultanément',
      type: 'LEAVE',
      priority: 10,
      enabled: true,
      status: 'draft',
      conditions: [
        {
          field: 'leave.team',
          operator: 'EQUALS',
          value: '{team}'
        },
        {
          field: 'simultaneousLeaves',
          operator: 'GREATER_THAN',
          value: '{maxSimultaneous}'
        }
      ],
      actions: [
        {
          type: 'PREVENT',
          target: 'leave',
          message: 'Trop de personnes en congé simultanément'
        }
      ]
    },
    parameters: [
      {
        name: 'team',
        type: 'string',
        label: 'Équipe',
        required: true
      },
      {
        name: 'maxSimultaneous',
        type: 'number',
        label: 'Maximum en congé',
        required: true,
        default: 2,
        validation: { min: 1, max: 5 }
      }
    ],
    examples: [
      {
        title: 'Équipe IADE - Max 2',
        description: 'Maximum 2 IADEs en congé en même temps',
        parameters: { team: 'IADE', maxSimultaneous: 2 },
        expectedBehavior: 'Bloque le 3ème congé simultané'
      }
    ]
  }
];

// GET /api/admin/rules/v2/templates - Get available templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category');

    let templates = RULE_TEMPLATES;
    
    if (category) {
      templates = templates.filter(t => t.category === category);
    }

    const categories = [...new Set(RULE_TEMPLATES.map(t => t.category))];

    return NextResponse.json({
      templates,
      categories,
      total: templates.length
    });

  } catch (error) {
    logger.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la récupération des templates' },
      { status: 500 }
    );
  }
}

// POST /api/admin/rules/v2/templates - Create rule from template
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 401 });
    }

    const { templateId, parameters } = await request.json();

    const template = RULE_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
      return NextResponse.json(
        { error: 'Modèle non trouvé' },
        { status: 404 }
      );
    }

    // Validate parameters
    for (const param of template.parameters) {
      if (param.required && !(param.name in parameters)) {
        return NextResponse.json(
          { error: `Paramètre requis manquant: ${param.label}` },
          { status: 400 }
        );
      }

      const value = parameters[param.name];
      if (value !== undefined && param.validation) {
        if (param.validation.min !== undefined && value < param.validation.min) {
          return NextResponse.json(
            { error: `${param.label} doit être au moins ${param.validation.min}` },
            { status: 400 }
          );
        }
        if (param.validation.max !== undefined && value > param.validation.max) {
          return NextResponse.json(
            { error: `${param.label} ne peut pas dépasser ${param.validation.max}` },
            { status: 400 }
          );
        }
      }
    }

    // Apply parameters to template
    const rule = JSON.parse(JSON.stringify(template.baseRule));
    
    // Replace placeholders in all string fields
    const replacePlaceholders = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\{(\w+)\}/g, (match, key) => {
          return parameters[key] !== undefined ? parameters[key] : match;
        });
      } else if (Array.isArray(obj)) {
        return obj.map(replacePlaceholders);
      } else if (typeof obj === 'object' && obj !== null) {
        const result: any = {};
        for (const key in obj) {
          result[key] = replacePlaceholders(obj[key]);
        }
        return result;
      }
      return obj;
    };

    const processedRule = replacePlaceholders(rule);

    return NextResponse.json({
      rule: processedRule,
      template: {
        id: template.id,
        name: template.name
      },
      parameters
    });

  } catch (error) {
    logger.error('Error creating from template:', error);
    return NextResponse.json(
      { error: 'Erreur lors de la création depuis le template' },
      { status: 500 }
    );
  }
}