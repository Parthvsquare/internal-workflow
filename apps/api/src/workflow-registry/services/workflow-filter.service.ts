import { Injectable, Logger } from '@nestjs/common';

export interface FilterCondition {
  field: string;
  operator: string;
  value: any;
  type?: string;
}

export interface FilterGroup {
  operator: 'AND' | 'OR';
  conditions: (FilterCondition | FilterGroup)[];
}

@Injectable()
export class WorkflowFilterService {
  private readonly logger = new Logger(WorkflowFilterService.name);

  /**
   * Evaluate a single filter condition against data
   */
  async evaluateFilter(
    filter: FilterCondition | FilterGroup,
    data: Record<string, any>
  ): Promise<boolean> {
    try {
      if ('operator' in filter && ['AND', 'OR'].includes(filter.operator)) {
        return await this.evaluateFilterGroup(filter as FilterGroup, data);
      } else {
        return await this.evaluateCondition(filter as FilterCondition, data);
      }
    } catch (error) {
      this.logger.error('Filter evaluation failed:', error);
      return false;
    }
  }

  /**
   * Evaluate multiple filters (backward compatibility)
   */
  async evaluateFilters(
    filters: (FilterCondition | FilterGroup)[],
    data: Record<string, any>
  ): Promise<boolean> {
    if (!filters || filters.length === 0) return true;

    // Default to AND behavior for multiple filters
    for (const filter of filters) {
      const result = await this.evaluateFilter(filter, data);
      if (!result) return false;
    }

    return true;
  }

  /**
   * Evaluate a filter group (AND/OR)
   */
  private async evaluateFilterGroup(
    group: FilterGroup,
    data: Record<string, any>
  ): Promise<boolean> {
    if (!group.conditions || group.conditions.length === 0) return true;

    const results = await Promise.all(
      group.conditions.map((condition) => this.evaluateFilter(condition, data))
    );

    if (group.operator === 'AND') {
      return results.every((result) => result === true);
    } else if (group.operator === 'OR') {
      return results.some((result) => result === true);
    }

    return false;
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: FilterCondition,
    data: Record<string, any>
  ): Promise<boolean> {
    const fieldValue = this.extractFieldValue(data, condition.field);
    const filterValue = condition.value;

    switch (condition.operator.toLowerCase()) {
      case 'equals':
      case 'eq':
      case '=':
        return this.compareValues(fieldValue, filterValue, 'equals');

      case 'not_equals':
      case 'ne':
      case '!=':
        return !this.compareValues(fieldValue, filterValue, 'equals');

      case 'contains':
        return this.compareValues(fieldValue, filterValue, 'contains');

      case 'not_contains':
        return !this.compareValues(fieldValue, filterValue, 'contains');

      case 'starts_with':
        return this.compareValues(fieldValue, filterValue, 'starts_with');

      case 'ends_with':
        return this.compareValues(fieldValue, filterValue, 'ends_with');

      case 'greater_than':
      case 'gt':
      case '>':
        return this.compareValues(fieldValue, filterValue, 'greater_than');

      case 'greater_than_or_equal':
      case 'gte':
      case '>=':
        return this.compareValues(
          fieldValue,
          filterValue,
          'greater_than_or_equal'
        );

      case 'less_than':
      case 'lt':
      case '<':
        return this.compareValues(fieldValue, filterValue, 'less_than');

      case 'less_than_or_equal':
      case 'lte':
      case '<=':
        return this.compareValues(
          fieldValue,
          filterValue,
          'less_than_or_equal'
        );

      case 'in':
        return this.compareValues(fieldValue, filterValue, 'in');

      case 'not_in':
        return !this.compareValues(fieldValue, filterValue, 'in');

      case 'is_empty':
      case 'is_null':
        return (
          fieldValue == null || fieldValue === '' || fieldValue === undefined
        );

      case 'is_not_empty':
      case 'is_not_null':
        return (
          fieldValue != null && fieldValue !== '' && fieldValue !== undefined
        );

      case 'between':
        return this.compareValues(fieldValue, filterValue, 'between');

      case 'regex':
      case 'matches':
        return this.compareValues(fieldValue, filterValue, 'regex');

      default:
        this.logger.warn(`Unknown filter operator: ${condition.operator}`);
        return false;
    }
  }

  /**
   * Extract field value using dot notation
   */
  private extractFieldValue(data: any, fieldPath: string): any {
    if (!fieldPath) return data;

    return fieldPath.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, data);
  }

  /**
   * Compare values based on operator
   */
  private compareValues(
    fieldValue: any,
    filterValue: any,
    operator: string
  ): boolean {
    switch (operator) {
      case 'equals':
        return fieldValue === filterValue;

      case 'contains':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().includes(filterValue.toLowerCase());
        }
        if (Array.isArray(fieldValue)) {
          return fieldValue.includes(filterValue);
        }
        return false;

      case 'starts_with':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().startsWith(filterValue.toLowerCase());
        }
        return false;

      case 'ends_with':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          return fieldValue.toLowerCase().endsWith(filterValue.toLowerCase());
        }
        return false;

      case 'greater_than':
        return this.compareNumbers(fieldValue, filterValue, '>');

      case 'greater_than_or_equal':
        return this.compareNumbers(fieldValue, filterValue, '>=');

      case 'less_than':
        return this.compareNumbers(fieldValue, filterValue, '<');

      case 'less_than_or_equal':
        return this.compareNumbers(fieldValue, filterValue, '<=');

      case 'in':
        if (Array.isArray(filterValue)) {
          return filterValue.includes(fieldValue);
        }
        return false;

      case 'between':
        if (Array.isArray(filterValue) && filterValue.length === 2) {
          const [min, max] = filterValue;
          return (
            this.compareNumbers(fieldValue, min, '>=') &&
            this.compareNumbers(fieldValue, max, '<=')
          );
        }
        return false;

      case 'regex':
        if (typeof fieldValue === 'string' && typeof filterValue === 'string') {
          try {
            const regex = new RegExp(filterValue, 'i');
            return regex.test(fieldValue);
          } catch {
            return false;
          }
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Compare numeric values or dates
   */
  private compareNumbers(
    fieldValue: any,
    filterValue: any,
    operator: string
  ): boolean {
    // Try to convert to numbers first
    const numField = Number(fieldValue);
    const numFilter = Number(filterValue);

    if (!isNaN(numField) && !isNaN(numFilter)) {
      switch (operator) {
        case '>':
          return numField > numFilter;
        case '>=':
          return numField >= numFilter;
        case '<':
          return numField < numFilter;
        case '<=':
          return numField <= numFilter;
        default:
          return false;
      }
    }

    // Try to compare as dates
    const dateField = new Date(fieldValue);
    const dateFilter = new Date(filterValue);

    if (!isNaN(dateField.getTime()) && !isNaN(dateFilter.getTime())) {
      switch (operator) {
        case '>':
          return dateField > dateFilter;
        case '>=':
          return dateField >= dateFilter;
        case '<':
          return dateField < dateFilter;
        case '<=':
          return dateField <= dateFilter;
        default:
          return false;
      }
    }

    // String comparison as fallback
    switch (operator) {
      case '>':
        return String(fieldValue) > String(filterValue);
      case '>=':
        return String(fieldValue) >= String(filterValue);
      case '<':
        return String(fieldValue) < String(filterValue);
      case '<=':
        return String(fieldValue) <= String(filterValue);
      default:
        return false;
    }
  }

  /**
   * Validate filter structure
   */
  validateFilter(filter: any): boolean {
    try {
      if (!filter) return false;

      if ('operator' in filter && ['AND', 'OR'].includes(filter.operator)) {
        const group = filter as FilterGroup;
        return (
          Array.isArray(group.conditions) &&
          group.conditions.every((condition) => this.validateFilter(condition))
        );
      } else {
        const condition = filter as FilterCondition;
        return (
          typeof condition.field === 'string' &&
          typeof condition.operator === 'string' &&
          condition.value !== undefined
        );
      }
    } catch {
      return false;
    }
  }
}
