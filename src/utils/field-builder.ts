/**
 * Configuration builder patterns to eliminate long parameter lists and data clumps
 */

import { FrameworkField } from '../types';

/**
 * Field builder class to eliminate long parameter lists
 */
export class FieldBuilder {
  private config: Partial<FrameworkField> = {};

  constructor(name: string, label: string) {
    this.config.name = name;
    this.config.label = label;
  }

  static text(name: string, label: string): FieldBuilder {
    return new FieldBuilder(name, label).type('text');
  }

  static textarea(name: string, label: string): FieldBuilder {
    return new FieldBuilder(name, label).type('textarea');
  }

  static number(name: string, label: string): FieldBuilder {
    return new FieldBuilder(name, label).type('number');
  }

  static multiSelect(name: string, label: string): FieldBuilder {
    return new FieldBuilder(name, label).type('multi-select-criteria');
  }

  type(type: 'text' | 'textarea' | 'number' | 'multi-select-criteria'): FieldBuilder {
    this.config.type = type;
    return this;
  }

  placeholder(placeholder: string): FieldBuilder {
    this.config.placeholder = placeholder;
    return this;
  }

  required(required: boolean = true): FieldBuilder {
    this.config.required = required;
    return this;
  }

  optional(optional: boolean = true): FieldBuilder {
    this.config.optional = optional;
    return this;
  }

  defaultValue(value: string | string[]): FieldBuilder {
    this.config.defaultValue = value;
    return this;
  }

  options(options: string[]): FieldBuilder {
    this.config.options = options;
    return this;
  }

  build(): FrameworkField {
    if (!this.config.name || !this.config.label || !this.config.type) {
      throw new Error('Field must have name, label, and type');
    }
    return this.config as FrameworkField;
  }
}

/**
 * Common field configurations to eliminate data clumps
 */
export class CommonFields {
  static role(defaultRole: string = 'expert'): FrameworkField {
    return FieldBuilder.text('role', 'Role')
      .placeholder(`e.g., ${defaultRole}`)
      .required()
      .defaultValue(defaultRole)
      .build();
  }

  static approaches(defaultValue: string = '3'): FrameworkField {
    return FieldBuilder.number('approaches', 'Number of Approaches')
      .placeholder(defaultValue)
      .required()
      .defaultValue(defaultValue)
      .build();
  }

  static versions(defaultValue: string = '3'): FrameworkField {
    return FieldBuilder.number('versions', 'Number of Versions')
      .placeholder(defaultValue)
      .required()
      .defaultValue(defaultValue)
      .build();
  }

  static criteria(defaultCriteria: string[]): FrameworkField {
    return FieldBuilder.multiSelect('criteria', 'Evaluation Criteria')
      .placeholder('Select or add criteria')
      .required()
      .defaultValue(defaultCriteria)
      .build();
  }

  static objective(): FrameworkField {
    return FieldBuilder.textarea('objective', 'Objective/Decision')
      .placeholder('What decision needs to be made?')
      .required()
      .build();
  }

  static goal(): FrameworkField {
    return FieldBuilder.textarea('goal', 'Goal')
      .placeholder('What goal do you want to achieve?')
      .required()
      .build();
  }

  static problem(): FrameworkField {
    return FieldBuilder.textarea('problem', 'Problem')
      .placeholder('What problem needs to be solved?')
      .required()
      .build();
  }

  static task(): FrameworkField {
    return FieldBuilder.textarea('task', 'Task')
      .placeholder('What should be produced?')
      .required()
      .build();
  }

  static tone(defaultTone?: string): FrameworkField {
    return FieldBuilder.textarea('tone', 'Tone Sample')
      .placeholder(defaultTone || 'Example of desired tone/style')
      .required()
      .build();
  }

  static examples(): FrameworkField {
    return FieldBuilder.textarea('examples', 'Examples')
      .placeholder('Provide 2-3 examples')
      .optional()
      .build();
  }

  static criteriaField(): FrameworkField {
    return FieldBuilder.textarea('criteria', 'Criteria')
      .placeholder('What criteria should be used for evaluation?')
      .required()
      .build();
  }
}