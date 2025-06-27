import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  WorkflowSubscriptionEntity,
  WorkflowDefinitionEntity,
  WorkflowTriggerRegistryEntity,
} from '@internal-workflow/storage';

export interface CreateSubscriptionDto {
  workflowId: string;
  triggerKey: string;
  filterConditions?: Record<string, any>;
  isActive?: boolean;
}

export interface UpdateSubscriptionDto {
  filterConditions?: Record<string, any>;
  isActive?: boolean;
}

@Injectable()
export class WorkflowSubscriptionService {
  private readonly logger = new Logger(WorkflowSubscriptionService.name);

  constructor(
    @InjectRepository(WorkflowSubscriptionEntity)
    private readonly subscriptionRepository: Repository<WorkflowSubscriptionEntity>,
    @InjectRepository(WorkflowDefinitionEntity)
    private readonly workflowRepository: Repository<WorkflowDefinitionEntity>,
    @InjectRepository(WorkflowTriggerRegistryEntity)
    private readonly triggerRepository: Repository<WorkflowTriggerRegistryEntity>
  ) {}

  /**
   * Create a new workflow subscription
   */
  async createSubscription(
    dto: CreateSubscriptionDto
  ): Promise<WorkflowSubscriptionEntity> {
    // Validate workflow exists
    const workflow = await this.workflowRepository.findOne({
      where: { id: dto.workflowId },
    });
    if (!workflow) {
      throw new NotFoundException(`Workflow ${dto.workflowId} not found`);
    }

    // Validate trigger exists
    const trigger = await this.triggerRepository.findOne({
      where: { key: dto.triggerKey },
    });
    if (!trigger) {
      throw new NotFoundException(`Trigger ${dto.triggerKey} not found`);
    }

    // Check if subscription already exists
    const existingSubscription = await this.subscriptionRepository.findOne({
      where: {
        workflow_id: dto.workflowId,
        trigger_key: dto.triggerKey,
      },
    });

    if (existingSubscription) {
      // Update existing subscription
      existingSubscription.filter_conditions = dto.filterConditions;
      existingSubscription.is_active = dto.isActive ?? true;
      return await this.subscriptionRepository.save(existingSubscription);
    }

    // Create new subscription
    const subscription = this.subscriptionRepository.create({
      workflow_id: dto.workflowId,
      trigger_key: dto.triggerKey,
      filter_conditions: dto.filterConditions,
      is_active: dto.isActive ?? true,
    });

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Update a workflow subscription
   */
  async updateSubscription(
    subscriptionId: string,
    dto: UpdateSubscriptionDto
  ): Promise<WorkflowSubscriptionEntity> {
    const subscription = await this.subscriptionRepository.findOne({
      where: { id: subscriptionId },
    });

    if (!subscription) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }

    if (dto.filterConditions !== undefined) {
      subscription.filter_conditions = dto.filterConditions;
    }

    if (dto.isActive !== undefined) {
      subscription.is_active = dto.isActive;
    }

    return await this.subscriptionRepository.save(subscription);
  }

  /**
   * Get all subscriptions for a workflow
   */
  async getWorkflowSubscriptions(
    workflowId: string
  ): Promise<WorkflowSubscriptionEntity[]> {
    return await this.subscriptionRepository.find({
      where: { workflow_id: workflowId },
      relations: ['triggerRegistry'],
    });
  }

  /**
   * Get all subscriptions for a trigger
   */
  async getTriggerSubscriptions(
    triggerKey: string
  ): Promise<WorkflowSubscriptionEntity[]> {
    return await this.subscriptionRepository.find({
      where: { trigger_key: triggerKey, is_active: true },
      relations: ['workflow'],
    });
  }

  /**
   * Delete a subscription
   */
  async deleteSubscription(subscriptionId: string): Promise<void> {
    const result = await this.subscriptionRepository.delete(subscriptionId);
    if (result.affected === 0) {
      throw new NotFoundException(`Subscription ${subscriptionId} not found`);
    }
  }

  /**
   * Subscribe a workflow to a trigger with conditions
   */
  async subscribeWorkflowToTrigger(
    workflowId: string,
    triggerKey: string,
    filterConditions?: Record<string, any>
  ): Promise<WorkflowSubscriptionEntity> {
    return await this.createSubscription({
      workflowId,
      triggerKey,
      filterConditions,
      isActive: true,
    });
  }

  /**
   * Unsubscribe a workflow from a trigger
   */
  async unsubscribeWorkflowFromTrigger(
    workflowId: string,
    triggerKey: string
  ): Promise<void> {
    const subscription = await this.subscriptionRepository.findOne({
      where: {
        workflow_id: workflowId,
        trigger_key: triggerKey,
      },
    });

    if (!subscription) {
      throw new NotFoundException(
        `Subscription for workflow ${workflowId} and trigger ${triggerKey} not found`
      );
    }

    await this.subscriptionRepository.delete(subscription.id);
  }
}
