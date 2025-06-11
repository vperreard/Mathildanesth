/**
 * API pour la gestion des quotas de congés, transferts et reports
 */
import { AxiosInstance } from 'axios';
import { LeaveType } from '../types/leave';
import {
  QuotaTransferRule,
  QuotaTransferRequest,
  QuotaTransferResult,
  EmployeeQuota,
  QuotaAdjustment,
  QuotaTransfer,
  QuotaCarryOverRule,
  QuotaCarryOverCalculationRequest,
  QuotaCarryOverCalculationResult,
} from '../types/quota';

export interface TransferHistoryResponse {
  id: string;
  userId: string;
  sourceType: LeaveType;
  destinationType: LeaveType;
  daysDebited: number;
  daysCredit: number;
  reason: string;
  status: 'completed' | 'failed' | 'pending';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Service API pour la gestion des quotas de congés
 */
export class QuotaApiService {
  private apiClient: AxiosInstance;
  private baseUrl: string = '/api/leaves/quotas';

  constructor(apiClient: AxiosInstance) {
    this.apiClient = apiClient;
  }

  /**
   * Récupère les quotas d'un employé
   */
  async getEmployeeQuotas(employeeId: string, year?: number): Promise<EmployeeQuota[]> {
    const params = year ? { year } : {};
    const response = await this.apiClient.get(`${this.baseUrl}/employee/${employeeId}`, { params });
    return response.data;
  }

  /**
   * Récupère toutes les règles de transfert disponibles
   */
  async getTransferRules(): Promise<QuotaTransferRule[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/transfer-rules`);
    return response.data;
  }

  /**
   * Récupère les règles de transfert actives pour un utilisateur
   */
  async getActiveTransferRulesForUser(userId: string): Promise<QuotaTransferRule[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/transfer-rules/user/${userId}`);
    return response.data;
  }

  /**
   * Simule un transfert de quota sans l'exécuter
   */
  async simulateTransfer(request: QuotaTransferRequest): Promise<QuotaTransferResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/transfers/simulate`, request);
    return response.data;
  }

  /**
   * Exécute un transfert de quota
   */
  async executeTransfer(request: QuotaTransferRequest): Promise<QuotaTransferResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/transfers`, request);
    return response.data;
  }

  /**
   * Récupère l'historique des transferts d'un employé
   */
  async getTransferHistory(employeeId: string): Promise<TransferHistoryResponse[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/transfers/history/${employeeId}`);
    return response.data;
  }

  /**
   * Récupère toutes les règles de report disponibles
   */
  async getCarryOverRules(): Promise<QuotaCarryOverRule[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/carry-over-rules`);
    return response.data;
  }

  /**
   * Récupère les règles de report actives pour un utilisateur
   */
  async getActiveCarryOverRulesForUser(userId: string): Promise<QuotaCarryOverRule[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/carry-over-rules/user/${userId}`);
    return response.data;
  }

  /**
   * Simule un report de quota sans l'exécuter
   */
  async simulateCarryOver(
    request: QuotaCarryOverCalculationRequest
  ): Promise<QuotaCarryOverCalculationResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/carry-overs/simulate`, request);
    return response.data;
  }

  /**
   * Exécute un report de quota
   */
  async executeCarryOver(
    request: QuotaCarryOverCalculationRequest
  ): Promise<QuotaCarryOverCalculationResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/carry-overs`, request);
    return response.data;
  }

  /**
   * Récupère l'historique des reports d'un employé
   */
  async getCarryOverHistory(employeeId: string): Promise<any[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/carry-overs/history/${employeeId}`);
    return response.data;
  }

  /**
   * Récupère les types de congés disponibles pour le transfert (source)
   */
  async getAvailableSourceTypes(userId: string): Promise<LeaveType[]> {
    const response = await this.apiClient.get(
      `${this.baseUrl}/transfers/available-source-types/${userId}`
    );
    return response.data;
  }

  /**
   * Récupère les types de congés disponibles pour le transfert (cible) en fonction du type source
   */
  async getAvailableTargetTypes(userId: string, sourceType: LeaveType): Promise<LeaveType[]> {
    const response = await this.apiClient.get(
      `${this.baseUrl}/transfers/available-target-types/${userId}`,
      {
        params: { sourceType },
      }
    );
    return response.data;
  }

  /**
   * Récupère les types de congés éligibles au report
   */
  async getEligibleCarryOverTypes(
    userId: string,
    fromYear: number,
    toYear: number
  ): Promise<LeaveType[]> {
    const response = await this.apiClient.get(
      `${this.baseUrl}/carry-overs/eligible-types/${userId}`,
      {
        params: { fromYear, toYear },
      }
    );
    return response.data;
  }

  /**
   * Met à jour une règle de transfert
   */
  async updateTransferRule(
    ruleId: string,
    rule: Partial<QuotaTransferRule>
  ): Promise<QuotaTransferRule> {
    const response = await this.apiClient.put(`${this.baseUrl}/transfer-rules/${ruleId}`, rule);
    return response.data;
  }

  /**
   * Met à jour une règle de report
   */
  async updateCarryOverRule(
    ruleId: string,
    rule: Partial<QuotaCarryOverRule>
  ): Promise<QuotaCarryOverRule> {
    const response = await this.apiClient.put(`${this.baseUrl}/carry-over-rules/${ruleId}`, rule);
    return response.data;
  }

  /**
   * Approuve un transfert de quota
   */
  async approveTransfer(transferId: string, comments?: string): Promise<QuotaTransferResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/transfers/${transferId}/approve`, {
      comments,
    });
    return response.data;
  }

  /**
   * Rejette un transfert de quota
   */
  async rejectTransfer(transferId: string, comments?: string): Promise<QuotaTransferResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/transfers/${transferId}/reject`, {
      comments,
    });
    return response.data;
  }

  /**
   * Approuve un report de quota
   */
  async approveCarryOver(
    carryOverId: string,
    comments?: string
  ): Promise<QuotaCarryOverCalculationResult> {
    const response = await this.apiClient.post(
      `${this.baseUrl}/carry-overs/${carryOverId}/approve`,
      { comments }
    );
    return response.data;
  }

  /**
   * Rejette un report de quota
   */
  async rejectCarryOver(
    carryOverId: string,
    comments?: string
  ): Promise<QuotaCarryOverCalculationResult> {
    const response = await this.apiClient.post(
      `${this.baseUrl}/carry-overs/${carryOverId}/reject`,
      { comments }
    );
    return response.data;
  }

  /**
   * Ajuste manuellement un quota avec raison (admin uniquement)
   */
  async adjustQuota(
    quotaId: string,
    adjustment: Omit<QuotaAdjustment, 'id' | 'quotaId' | 'timestamp'>
  ): Promise<EmployeeQuota> {
    const response = await this.apiClient.post(`${this.baseUrl}/adjust/${quotaId}`, adjustment);
    return response.data;
  }

  /**
   * Annule un transfert de quota
   */
  async cancelTransfer(transferId: string, reason: string): Promise<QuotaTransferResult> {
    const response = await this.apiClient.post(`${this.baseUrl}/transfers/cancel/${transferId}`, {
      reason,
    });
    return response.data;
  }

  /**
   * Obtient les règles de transfert applicables entre deux types de congés
   */
  async getApplicableTransferRules(
    sourceType: LeaveType,
    targetType: LeaveType
  ): Promise<QuotaTransferRule[]> {
    const response = await this.apiClient.get(`${this.baseUrl}/transfer-rules/applicable`, {
      params: { sourceType, targetType },
    });
    return response.data;
  }
}

export default QuotaApiService;
