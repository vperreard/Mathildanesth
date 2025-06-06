import { RuleV2, RuleVersion, RuleChange } from '../types/ruleV2.types';
import { prisma } from '@/lib/prisma';
import { diff } from 'deep-object-diff';

export class RuleVersioningService {
  private static instance: RuleVersioningService;

  private constructor() {}

  static getInstance(): RuleVersioningService {
    if (!RuleVersioningService.instance) {
      RuleVersioningService.instance = new RuleVersioningService();
    }
    return RuleVersioningService.instance;
  }

  async createVersion(
    rule: RuleV2,
    userId: string,
    message?: string
  ): Promise<RuleVersion> {
    // Get previous version
    const previousVersion = await this.getLatestVersion(rule.id);
    const versionNumber = previousVersion ? previousVersion.version + 1 : 1;

    // Calculate changes
    const changes = previousVersion 
      ? this.calculateChanges(previousVersion.snapshot, rule)
      : this.calculateInitialChanges(rule);

    // Create version record
    const version: RuleVersion = {
      id: `${rule.id}-v${versionNumber}`,
      ruleId: rule.id,
      version: versionNumber,
      changes,
      createdBy: userId,
      createdAt: new Date(),
      message: message || this.generateVersionMessage(changes),
      snapshot: { ...rule }
    };

    // Save to database
    await this.saveVersion(version);

    return version;
  }

  async getVersionHistory(
    ruleId: string,
    limit: number = 10,
    offset: number = 0
  ): Promise<RuleVersion[]> {
    const versions = await prisma.ruleVersion.findMany({
      where: { ruleId },
      orderBy: { version: 'desc' },
      take: limit,
      skip: offset
    });

    return versions.map(v => ({
      ...v,
      snapshot: JSON.parse(v.snapshot as string)
    })) as any as RuleVersion[];
  }

  async getVersion(ruleId: string, version: number): Promise<RuleVersion | null> {
    const versionRecord = await prisma.ruleVersion.findUnique({
      where: {
        ruleId_version: {
          ruleId,
          version
        }
      }
    });

    if (!versionRecord) return null;

    return {
      ...versionRecord,
      snapshot: JSON.parse(versionRecord.snapshot as string)
    } as any as RuleVersion;
  }

  async compareVersions(
    ruleId: string,
    version1: number,
    version2: number
  ): Promise<{
    version1: RuleVersion;
    version2: RuleVersion;
    changes: RuleChange[];
    summary: string;
  }> {
    const [v1, v2] = await Promise.all([
      this.getVersion(ruleId, version1),
      this.getVersion(ruleId, version2)
    ]);

    if (!v1 || !v2) {
      throw new Error('Version not found');
    }

    const changes = this.calculateChanges(v1.snapshot, v2.snapshot);
    const summary = this.generateChangeSummary(changes);

    return {
      version1: v1,
      version2: v2,
      changes,
      summary
    };
  }

  async revertToVersion(
    ruleId: string,
    targetVersion: number,
    userId: string
  ): Promise<RuleV2> {
    const version = await this.getVersion(ruleId, targetVersion);
    if (!version) {
      throw new Error('Version not found');
    }

    // Create new version with reverted state
    const revertedRule: RuleV2 = {
      ...version.snapshot,
      version: await this.getNextVersionNumber(ruleId),
      updatedBy: userId,
      updatedAt: new Date()
    };

    // Save as new version
    await this.createVersion(
      revertedRule,
      userId,
      `Reverted to version ${targetVersion}`
    );

    // Update current rule
    await this.updateCurrentRule(revertedRule);

    return revertedRule;
  }

  async getDiff(
    ruleId: string,
    fromVersion?: number,
    toVersion?: number
  ): Promise<string> {
    const versions = await this.getVersionHistory(ruleId, 2);
    
    const from = fromVersion 
      ? await this.getVersion(ruleId, fromVersion)
      : versions[1];
    const to = toVersion
      ? await this.getVersion(ruleId, toVersion)
      : versions[0];

    if (!from || !to) {
      throw new Error('Version not found');
    }

    return this.generateDiff(from.snapshot, to.snapshot);
  }

  private calculateChanges(oldRule: RuleV2, newRule: RuleV2): RuleChange[] {
    const changes: RuleChange[] = [];
    const differences = diff(oldRule, newRule) as any;

    this.extractChanges(differences, '', changes, oldRule, newRule);

    return changes;
  }

  private extractChanges(
    differences: unknown,
    path: string,
    changes: RuleChange[],
    oldObj: unknown,
    newObj: unknown
  ): void {
    for (const key in differences) {
      const currentPath = path ? `${path}.${key}` : key;
      const diffValue = differences[key];

      if (diffValue === undefined) {
        // Deleted
        changes.push({
          field: currentPath,
          oldValue: this.getValueAtPath(oldObj, currentPath),
          newValue: undefined,
          type: 'delete'
        });
      } else if (this.getValueAtPath(oldObj, currentPath) === undefined) {
        // Added
        changes.push({
          field: currentPath,
          oldValue: undefined,
          newValue: diffValue,
          type: 'add'
        });
      } else if (typeof diffValue === 'object' && !Array.isArray(diffValue)) {
        // Nested object
        this.extractChanges(diffValue, currentPath, changes, oldObj, newObj);
      } else {
        // Modified
        changes.push({
          field: currentPath,
          oldValue: this.getValueAtPath(oldObj, currentPath),
          newValue: diffValue,
          type: 'modify'
        });
      }
    }
  }

  private getValueAtPath(obj: unknown, path: string): any {
    const parts = path.split('.');
    let current = obj;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = current[part];
      } else {
        return undefined;
      }
    }

    return current;
  }

  private calculateInitialChanges(rule: RuleV2): RuleChange[] {
    const changes: RuleChange[] = [];

    // Mark all fields as added
    const addFieldAsChange = (obj: unknown, path: string = '') => {
      for (const key in obj) {
        const currentPath = path ? `${path}.${key}` : key;
        const value = obj[key];

        if (value !== undefined && value !== null) {
          if (typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            addFieldAsChange(value, currentPath);
          } else {
            changes.push({
              field: currentPath,
              oldValue: undefined,
              newValue: value,
              type: 'add'
            });
          }
        }
      }
    };

    addFieldAsChange(rule);
    return changes;
  }

  private generateVersionMessage(changes: RuleChange[]): string {
    const summary: string[] = [];
    
    const addedCount = changes.filter(c => c.type === 'add').length;
    const modifiedCount = changes.filter(c => c.type === 'modify').length;
    const deletedCount = changes.filter(c => c.type === 'delete').length;

    if (addedCount > 0) summary.push(`${addedCount} ajout${addedCount > 1 ? 's' : ''}`);
    if (modifiedCount > 0) summary.push(`${modifiedCount} modification${modifiedCount > 1 ? 's' : ''}`);
    if (deletedCount > 0) summary.push(`${deletedCount} suppression${deletedCount > 1 ? 's' : ''}`);

    return summary.join(', ') || 'Aucun changement';
  }

  private generateChangeSummary(changes: RuleChange[]): string {
    const importantFields = ['name', 'type', 'priority', 'status', 'conditions', 'actions'];
    const importantChanges = changes.filter(c => 
      importantFields.some(f => c.field.startsWith(f))
    );

    if (importantChanges.length === 0) {
      return 'Changements mineurs';
    }

    const summaryParts: string[] = [];
    
    const nameChange = importantChanges.find(c => c.field === 'name');
    if (nameChange) {
      summaryParts.push(`Nom: "${nameChange.oldValue}" → "${nameChange.newValue}"`);
    }

    const statusChange = importantChanges.find(c => c.field === 'status');
    if (statusChange) {
      summaryParts.push(`Statut: ${statusChange.oldValue} → ${statusChange.newValue}`);
    }

    const conditionChanges = importantChanges.filter(c => c.field.startsWith('conditions'));
    if (conditionChanges.length > 0) {
      summaryParts.push(`${conditionChanges.length} changement${conditionChanges.length > 1 ? 's' : ''} de conditions`);
    }

    const actionChanges = importantChanges.filter(c => c.field.startsWith('actions'));
    if (actionChanges.length > 0) {
      summaryParts.push(`${actionChanges.length} changement${actionChanges.length > 1 ? 's' : ''} d'actions`);
    }

    return summaryParts.join(', ');
  }

  private generateDiff(oldRule: RuleV2, newRule: RuleV2): string {
    const changes = this.calculateChanges(oldRule, newRule);
    const lines: string[] = [];

    lines.push(`--- Version ${oldRule.version}`);
    lines.push(`+++ Version ${newRule.version}`);
    lines.push('');

    for (const change of changes) {
      switch (change.type) {
        case 'add':
          lines.push(`+ ${change.field}: ${JSON.stringify(change.newValue)}`);
          break;
        case 'delete':
          lines.push(`- ${change.field}: ${JSON.stringify(change.oldValue)}`);
          break;
        case 'modify':
          lines.push(`  ${change.field}:`);
          lines.push(`- ${JSON.stringify(change.oldValue)}`);
          lines.push(`+ ${JSON.stringify(change.newValue)}`);
          break;
      }
    }

    return lines.join('\n');
  }

  private async getLatestVersion(ruleId: string): Promise<RuleVersion | null> {
    const versions = await this.getVersionHistory(ruleId, 1);
    return versions[0] || null;
  }

  private async getNextVersionNumber(ruleId: string): Promise<number> {
    const latest = await this.getLatestVersion(ruleId);
    return latest ? latest.version + 1 : 1;
  }

  private async saveVersion(version: RuleVersion): Promise<void> {
    await prisma.ruleVersion.create({
      data: {
        id: version.id,
        ruleId: version.ruleId,
        version: version.version,
        changes: version.changes,
        createdBy: version.createdBy,
        createdAt: version.createdAt,
        message: version.message,
        snapshot: JSON.stringify(version.snapshot)
      }
    });
  }

  private async updateCurrentRule(rule: RuleV2): Promise<void> {
    await prisma.planningRule.update({
      where: { id: rule.id },
      data: {
        ...rule,
        id: undefined, // Don't update ID
        createdAt: undefined, // Don't update creation date
        updatedAt: new Date()
      }
    });
  }
}