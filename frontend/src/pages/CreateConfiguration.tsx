import React, { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configurationsAPI, ValidationRule, ParentCondition, Translation, ParentOption } from '../services/api';
import axios from 'axios';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import styles from './CreateConfiguration.module.css';
import trashIcon from '../assets/trash.svg';

type ConfigStep = 'parent' | 'definition' | 'localization';

type DataType = 'string' | 'number' | 'date' | 'list';

type ListOption = { label: string; value: string };

interface FormData {
  key: string;
  label: string;
  description: string;
  data_type: DataType;
  default_value: string;
  active: boolean;
  parent_config_id: string | null;
  parent_conditions: ParentCondition[];
  validation_rules: ValidationRule[];
  translations: Translation[];
}

type FormAction =
  | { type: 'SET_FIELD'; field: keyof FormData; value: FormData[keyof FormData] }
  | { type: 'SET_PARENT_CONDITIONS'; value: ParentCondition[] }
  | { type: 'SET_TRANSLATIONS'; value: Translation[] };

const formReducer = (state: FormData, action: FormAction): FormData => {
  switch (action.type) {
    case 'SET_FIELD':
      return { ...state, [action.field]: action.value } as FormData;
    case 'SET_PARENT_CONDITIONS':
      return { ...state, parent_conditions: action.value };
    case 'SET_TRANSLATIONS':
      return { ...state, translations: action.value };
    default:
      return state;
  }
};

type StepMeta = { id: ConfigStep; title: string; caption: string };

const steps: StepMeta[] = [
  {
    id: 'parent',
    title: 'Parent Configuration',
    caption: 'Set inheritance and conditional defaults.',
  },
  {
    id: 'definition',
    title: 'Configuration Definition',
    caption: 'Name, describe, and type the configuration.',
  },
  {
    id: 'localization',
    title: 'Localization & Translations',
    caption: 'Translate and set activation.',
  },
];

interface StepperProps {
  steps: StepMeta[];
  activeStepId: ConfigStep;
  completedSteps: Set<number>;
  // eslint-disable-next-line no-unused-vars
  onStepClick: (stepIndex: number) => void;
}

const Stepper = ({ steps, activeStepId, completedSteps, onStepClick }: StepperProps) => {
  return (
    <aside className={styles.stepperPanel} aria-label="Configuration steps">
      <div className={styles.stepperHeader}>Info</div>
      <div className={styles.stepList}>
        {steps.map((step, index) => {
          const isActive = activeStepId === step.id;
          const isComplete = completedSteps.has(index) || steps.findIndex((s) => s.id === activeStepId) > index;
          const isClickable = completedSteps.has(index) && index <= steps.findIndex((s) => s.id === activeStepId);
          return (
            <div key={step.id} className={styles.stepRow}>
              <div className={styles.connectorArea}>
                <div
                  className={`${styles.stepDotWrap} ${isActive ? styles.stepDotActiveWrap : ''} ${
                    isComplete ? styles.stepDotCompleteWrap : ''
                  }`}
                >
                  <span className={`${styles.stepDotInner} ${isActive ? styles.stepDotInnerActive : ''}`}></span>
                </div>
                <div className={styles.stub} aria-hidden="true"></div>
              </div>
              <button
                type="button"
                className={`${styles.stepCard} ${isActive ? styles.stepCardActive : ''} ${
                  isComplete ? styles.stepCardComplete : ''
                } ${!isClickable && !isActive ? styles.stepCardDisabled : ''}`}
                onClick={() => onStepClick(index)}
                disabled={!isClickable && !isActive}
                aria-current={isActive ? 'step' : undefined}
              >
                <span className={styles.stepText}>
                  <span className={styles.stepTitle}>{step.title}</span>
                  <span className={styles.stepCaption}>{step.caption}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </aside>
  );
};

const CreateConfiguration = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentConfigs, setParentConfigs] = useState<ParentOption[]>([]);
  const [parentConfigType, setParentConfigType] = useState<DataType | null>(null);
  const [parentListOptions, setParentListOptions] = useState<ListOption[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [validationState, setValidationState] = useState({
    number: { required: true, min: '', max: '' },
    string: { required: true, regex: '' },
    date: { required: true, startDate: '', endDate: '' },
    list: {
      required: true,
      mode: 'single' as 'single' | 'multi',
      options: [{ label: '', value: '' }] as ListOption[],
    },
  });

  const [validity, setValidity] = useState({ start: '', end: '' });

  const [form, dispatch] = useReducer(formReducer, {
    key: '',
    label: '',
    description: '',
    data_type: 'string',
    default_value: '',
    active: true,
    parent_config_id: null,
    parent_conditions: [],
    validation_rules: [],
    translations: [],
  });

  useEffect(() => {
    const loadParentConfigs = async () => {
      try {
        const options = await configurationsAPI.getParentOptions();
        setParentConfigs(options);
      } catch (err) {
        console.error('Failed to load parent configurations', err);
      }
    };

    loadParentConfigs();
  }, []);

  useEffect(() => {
    const loadParentDetails = async () => {
      if (!form.parent_config_id) {
        setParentConfigType(null);
        setParentListOptions([]);
        return;
      }

      try {
        const config = await configurationsAPI.getConfiguration(form.parent_config_id);
        const type = config.data_type as DataType;
        setParentConfigType(type);
        if (type === 'list') {
          const listRule = config.validation_rules?.find((rule) => rule.rule_type === 'list_options');
          const options = Array.isArray(listRule?.value) ? (listRule?.value as ListOption[]) : [];
          setParentListOptions(options);
        } else {
          setParentListOptions([]);
        }
      } catch (err) {
        console.error('Failed to load parent configuration details', err);
        setParentConfigType(null);
        setParentListOptions([]);
      }
    };

    loadParentDetails();
  }, [form.parent_config_id]);

  const isEmptyValue = (value: unknown) => value === null || value === undefined || `${value}`.trim() === '';

  const hasParentConditionGaps = useMemo(
    () =>
      form.parent_conditions.some((condition) => {
        if (isEmptyValue(condition.operator)) return true;
        if (parentConfigType === 'list') {
          const selections = `${condition.value || ''}`.split(',').map((v) => v.trim()).filter(Boolean);
          return selections.length === 0;
        }
        if (condition.operator === 'between') {
          const [min, max] = `${condition.value || ''}`.split(',').map((v) => v.trim());
          return isEmptyValue(min) || isEmptyValue(max);
        }
        return isEmptyValue(condition.value);
      }),
    [form.parent_conditions, parentConfigType],
  );

  const hasTranslationGaps = useMemo(
    () =>
      form.translations.some(
        (translation) => !translation.language.trim() || !translation.label.trim(),
      ),
    [form.translations],
  );

  const hasListOptionGaps = useMemo(
    () =>
      form.data_type === 'list' && validationState.list.options.some((opt) => isEmptyValue(opt.label) || isEmptyValue(opt.value)),
    [form.data_type, validationState.list.options],
  );

  const buildValidationErrors = useMemo(() => {
    const errors: Record<string, string> = {};
    if (!form.key.trim()) {
      errors.key = 'Key is required';
    }
    if (!form.label.trim()) {
      errors.label = 'Label is required';
    }
    if (!form.default_value || !`${form.default_value}`.trim()) {
      errors.default_value = 'Default value is required';
    }
    if (hasParentConditionGaps) {
      errors.parent_conditions = 'Complete or remove parent rules.';
    }
    if (form.data_type === 'list' && hasListOptionGaps) {
      errors.list_options = 'List options need both label and value.';
    }
    if (hasTranslationGaps) {
      errors.translations = 'Language and label are required for each translation row.';
    }
    if (form.data_type === 'number') {
      const { min, max } = validationState.number;
      if (min !== '' && max !== '' && !isNaN(Number(min)) && !isNaN(Number(max))) {
        if (Number(min) > Number(max)) {
          errors.number_range = 'Min cannot be greater than Max.';
        }
      }
    }
    if (form.data_type === 'date') {
      const { startDate, endDate } = validationState.date;
      if (startDate && endDate && startDate > endDate) {
        errors.date_range = 'Start Date cannot be after End Date.';
      }
    }
    if (validity.start && validity.end && validity.start > validity.end) {
      errors.validity_range = 'Validity Start cannot be after Validity End.';
    }
    return errors;
  }, [form.key, form.label, form.data_type, form.default_value, hasParentConditionGaps, hasListOptionGaps, hasTranslationGaps, validationState.number, validationState.date, validity]);

  const isFormValid = useMemo(() => Object.keys(buildValidationErrors).length === 0, [buildValidationErrors]);

  const validateStep = (stepIndex: number) => {
    const scopedErrors: Record<string, string> = {};
    const allErrors = buildValidationErrors;

    if (stepIndex === 0 && allErrors.parent_conditions) {
      scopedErrors.parent_conditions = allErrors.parent_conditions;
    }
    if (stepIndex === 1) {
      if (allErrors.key) scopedErrors.key = allErrors.key;
      if (allErrors.label) scopedErrors.label = allErrors.label;
    }
    if (stepIndex === 2 && allErrors.translations) {
      scopedErrors.translations = allErrors.translations;
    }

    setValidationErrors(scopedErrors);
    return Object.keys(scopedErrors).length === 0;
  };

  const validateAll = () => {
    const allErrors = buildValidationErrors;
    setValidationErrors(allErrors);
    return Object.keys(allErrors).length === 0;
  };

  const stepHasErrors = useCallback(
    (stepIndex: number) => {
      const allErrors = buildValidationErrors;
      if (stepIndex === 0) return Boolean(allErrors.parent_conditions);
      if (stepIndex === 1) return Boolean(allErrors.key || allErrors.label || allErrors.default_value || allErrors.list_options || allErrors.number_range || allErrors.date_range || allErrors.validity_range);
      if (stepIndex === 2) return Boolean(allErrors.translations);
      return false;
    },
    [buildValidationErrors],
  );

  const isCurrentStepValid = useMemo(() => !stepHasErrors(currentStep), [currentStep, stepHasErrors]);

  const handleNext = () => {
    if (!validateStep(currentStep)) return;
    setCompletedSteps((prev) => {
      const updated = new Set(prev);
      updated.add(currentStep);
      return updated;
    });
    setCurrentStep((prev) => Math.min(prev + 1, steps.length - 1));
  };

  const handleBack = () => {
    setValidationErrors({});
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const handleStepperClick = (index: number) => {
    const isClickable = completedSteps.has(index) && index <= currentStep;
    if (!isClickable) return;
    setCurrentStep(index);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateAll()) {
      const firstInvalid = steps.findIndex((_, idx) => !validateStep(idx));
      if (firstInvalid >= 0) {
        setCurrentStep(firstInvalid);
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    const validationRulesPayload: ValidationRule[] = [];
    // Required per current type
    if (form.data_type === 'number') {
      validationRulesPayload.push({ rule_type: 'required', value: true });
      if (validationState.number.min !== '') validationRulesPayload.push({ rule_type: 'min', value: Number(validationState.number.min) });
      if (validationState.number.max !== '') validationRulesPayload.push({ rule_type: 'max', value: Number(validationState.number.max) });
    } else if (form.data_type === 'string') {
      validationRulesPayload.push({ rule_type: 'required', value: true });
      if (validationState.string.regex) validationRulesPayload.push({ rule_type: 'regex', value: validationState.string.regex });
    } else if (form.data_type === 'date') {
      validationRulesPayload.push({ rule_type: 'required', value: true });
      if (validationState.date.startDate) validationRulesPayload.push({ rule_type: 'start_date', value: validationState.date.startDate });
      if (validationState.date.endDate) validationRulesPayload.push({ rule_type: 'end_date', value: validationState.date.endDate });
    } else if (form.data_type === 'list') {
      validationRulesPayload.push({ rule_type: 'required', value: true });
      validationRulesPayload.push({ rule_type: 'list_mode', value: validationState.list.mode });
      validationRulesPayload.push({ rule_type: 'list_options', value: validationState.list.options });
    }
    if (validity.start) validationRulesPayload.push({ rule_type: 'valid_from', value: validity.start });
    if (validity.end) validationRulesPayload.push({ rule_type: 'valid_until', value: validity.end });

    try {
      await configurationsAPI.createConfiguration({
        key: form.key,
        label: form.label,
        description: form.description || undefined,
        data_type: form.data_type,
        default_value: form.default_value || undefined,
        parent_config_id: form.parent_config_id || undefined,
        parent_conditions: form.parent_conditions,
        validation_rules: validationRulesPayload,
        translations: form.translations,
      });
      navigate('/');
    } catch (err) {
      let errorMessage = 'Failed to create configuration';
      if (axios.isAxiosError(err)) {
        // Handle axios errors
        if (err.response?.data?.detail) {
          errorMessage = err.response.data.detail;
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        } else if (err.message) {
          errorMessage = err.message;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // 'required' is always enforced; no toggle.

  const updateNumberField = (key: 'min' | 'max', value: string) =>
    setValidationState((prev) => ({ ...prev, number: { ...prev.number, [key]: value } }));

  const updateStringRegex = (value: string) =>
    setValidationState((prev) => ({ ...prev, string: { ...prev.string, regex: value } }));

  const updateDateField = (key: 'startDate' | 'endDate', value: string) =>
    setValidationState((prev) => ({ ...prev, date: { ...prev.date, [key]: value } }));

  const updateListMode = (mode: 'single' | 'multi') =>
    setValidationState((prev) => ({ ...prev, list: { ...prev.list, mode } }));

  const updateListOption = (index: number, key: keyof ListOption, value: string) => {
    setValidationState((prev) => {
      const next = [...prev.list.options];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, list: { ...prev.list, options: next } };
    });
  };

  const addListOption = () =>
    setValidationState((prev) => ({ ...prev, list: { ...prev.list, options: [...prev.list.options, { label: '', value: '' }] } }));

  const removeListOption = (index: number) =>
    setValidationState((prev) => ({ ...prev, list: { ...prev.list, options: prev.list.options.filter((_, i) => i !== index) } }));

  useEffect(() => {
    const rules: ValidationRule[] = [];
    if (form.data_type === 'number') {
      rules.push({ rule_type: 'required', value: true });
      if (validationState.number.min !== '') rules.push({ rule_type: 'min', value: Number(validationState.number.min) });
      if (validationState.number.max !== '') rules.push({ rule_type: 'max', value: Number(validationState.number.max) });
    } else if (form.data_type === 'string') {
      rules.push({ rule_type: 'required', value: true });
      if (validationState.string.regex) rules.push({ rule_type: 'regex', value: validationState.string.regex });
    } else if (form.data_type === 'date') {
      rules.push({ rule_type: 'required', value: true });
      if (validationState.date.startDate) rules.push({ rule_type: 'start_date', value: validationState.date.startDate });
      if (validationState.date.endDate) rules.push({ rule_type: 'end_date', value: validationState.date.endDate });
    } else if (form.data_type === 'list') {
      rules.push({ rule_type: 'required', value: true });
      rules.push({ rule_type: 'list_mode', value: validationState.list.mode });
      rules.push({ rule_type: 'list_options', value: validationState.list.options });
    }
    if (validity.start) rules.push({ rule_type: 'valid_from', value: validity.start });
    if (validity.end) rules.push({ rule_type: 'valid_until', value: validity.end });
    dispatch({ type: 'SET_FIELD', field: 'validation_rules', value: rules });
  }, [validationState, form.data_type, validity]);

  const handleParentConditionChange = (index: number, key: keyof ParentCondition, value: string) => {
    const updated = [...form.parent_conditions];
    const next = { ...updated[index], [key]: value } as ParentCondition;
    if (key === 'value') {
      next.default_value = value;
    }
    if (key === 'operator' && value !== 'between') {
      next.value = '';
      next.default_value = '';
    }
    updated[index] = next;
    dispatch({ type: 'SET_PARENT_CONDITIONS', value: updated });
  };

  const handleParentBetweenChange = (index: number, field: 'min' | 'max', value: string) => {
    const updated = [...form.parent_conditions];
    const current = updated[index];
    const [min, max] = `${current.value || ''}`.split(',').map((v) => v.trim());
    const nextMin = field === 'min' ? value : min;
    const nextMax = field === 'max' ? value : max;
    const nextValue = `${nextMin},${nextMax}`;
    updated[index] = { ...current, value: nextValue, default_value: nextValue } as ParentCondition;
    dispatch({ type: 'SET_PARENT_CONDITIONS', value: updated });
  };

  const handleParentListChange = (index: number, values: string[]) => {
    const updated = [...form.parent_conditions];
    const nextValue = values.join(',');
    updated[index] = { ...updated[index], value: nextValue, default_value: nextValue, operator: 'in' } as ParentCondition;
    dispatch({ type: 'SET_PARENT_CONDITIONS', value: updated });
  };

  const handleParentConfigSelect = (value: string | null) => {
    dispatch({ type: 'SET_FIELD', field: 'parent_config_id', value });
    dispatch({ type: 'SET_PARENT_CONDITIONS', value: [] });
  };

  const handleTranslationChange = (index: number, key: keyof Translation, value: string) => {
    const updated = [...form.translations];
    updated[index] = { ...updated[index], [key]: value } as Translation;
    dispatch({ type: 'SET_TRANSLATIONS', value: updated });
  };

  return (
    <div className={`${styles.page} landing-layout`}>
      <TopHeader />
      <div className="landing-content">
        <Sidebar />
        <div className={styles.canvas}>
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderText}>
              <h1 className={styles.pageTitle}>Axis Configuration Management</h1>
              <p className={styles.pageSubtitle}>Define configuration keys, validation rules and language-specific labels.</p>
            </div>
            <div className={styles.pageActions}>
              <button type="button" className={styles.pillButton} onClick={() => navigate('/')}>Cancel</button>
              <button
                type="submit"
                form="createConfigForm"
                className={`${styles.pillButton} ${styles.pillPrimary}`}
                disabled={isLoading || !isFormValid}
              >
                {isLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>

          <div className={styles.workspace}>
            <div className={styles.mainColumn}>
              <div className={styles.formCard}>
                {error && <div className="error-message">{error}</div>}

                <form id="createConfigForm" onSubmit={handleSubmit}>
                  {currentStep === 0 && (
                    <>
                      <div className={styles.parentCard}>
                        <h2 className="section-title">Parent Configuration</h2>
                        <div className="form-group">
                          <label className="form-label">Parent Configuration Key</label>
                          <select
                            className="form-select"
                            value={form.parent_config_id || ''}
                            onChange={(e) => handleParentConfigSelect(e.target.value || null)}
                          >
                            <option value="">None (Root configuration)</option>
                            {parentConfigs.map((config) => (
                              <option key={config.id} value={config.id}>
                                {config.label} ({config.key})
                              </option>
                            ))}
                          </select>
                          <p className={styles.helperText}>
                            Select a parent configuration for inheritance and conditional defaults.
                          </p>
                        </div>

                        {form.parent_config_id && (
                          <div className="form-group">
                            <label className="form-label">Parent Condition</label>
                            <p className={`${styles.helperText} ${styles.helperTextSpaced}`}>
                              Define the rules that must be met for inheritance to apply.
                            </p>
                            <div className={styles.parentConditionCard}>
                              {form.parent_conditions.map((rule, index) => (
                                <div key={index} className="condition-row">
                                  {parentConfigType !== 'list' && (
                                    <div className="condition-field flex-1">
                                      <label className="condition-field-label">Operator</label>
                                      <select
                                        className="form-select"
                                        value={rule.operator}
                                        onChange={(e) => handleParentConditionChange(index, 'operator', e.target.value)}
                                      >
                                        <option>=</option>
                                        <option>!=</option>
                                        <option>&gt;</option>
                                        <option>&gt;=</option>
                                        <option>&lt;</option>
                                        <option>&lt;=</option>
                                        <option>between</option>
                                      </select>
                                    </div>
                                  )}
                                  <div className="condition-field flex-1">
                                    <label className="condition-field-label">
                                      {parentConfigType === 'list' ? 'Values' : 'Value'}
                                    </label>
                                    {parentConfigType === 'list' ? (
                                      <select
                                        multiple
                                        className={`form-select ${styles.multiSelect}`}
                                        value={`${rule.value || ''}`.split(',').map((v) => v.trim()).filter(Boolean)}
                                        onChange={(e) =>
                                          handleParentListChange(
                                            index,
                                            Array.from(e.currentTarget.selectedOptions).map((opt) => opt.value),
                                          )
                                        }
                                      >
                                        {parentListOptions.map((option) => (
                                          <option key={option.value} value={option.value}>
                                            {option.label || option.value}
                                          </option>
                                        ))}
                                      </select>
                                    ) : rule.operator === 'between' ? (
                                      <div className={styles.betweenInputs}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Min"
                                          value={`${rule.value || ''}`.split(',')[0]?.trim() || ''}
                                          onChange={(e) => handleParentBetweenChange(index, 'min', e.target.value)}
                                        />
                                        <input
                                          type="text"
                                          className="form-input"
                                          placeholder="Max"
                                          value={`${rule.value || ''}`.split(',')[1]?.trim() || ''}
                                          onChange={(e) => handleParentBetweenChange(index, 'max', e.target.value)}
                                        />
                                      </div>
                                    ) : (
                                      <input
                                        type="text"
                                        className="form-input"
                                        value={rule.value}
                                        onChange={(e) => handleParentConditionChange(index, 'value', e.target.value)}
                                      />
                                    )}
                                  </div>
                                  <div className="condition-actions">
                                    <button
                                      type="button"
                                      className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                                      onClick={() =>
                                        dispatch({
                                          type: 'SET_PARENT_CONDITIONS',
                                          value: form.parent_conditions.filter((_, i) => i !== index),
                                        })
                                      }
                                      aria-label="Remove condition"
                                    >
                                      <img src={trashIcon} alt="" className={styles.iconImg} aria-hidden="true" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                              <button
                                type="button"
                                className="add-rule-button"
                                onClick={() =>
                                  dispatch({
                                    type: 'SET_PARENT_CONDITIONS',
                                    value: [
                                      ...form.parent_conditions,
                                      {
                                        operator: parentConfigType === 'list' ? 'in' : '=',
                                        value: '',
                                        default_value: '',
                                      },
                                    ],
                                  })
                                }
                              >
                                + Add Condition
                              </button>
                              {validationErrors.parent_conditions && (
                                <div className={styles.errorText}>{validationErrors.parent_conditions}</div>
                              )}
                            </div>
                          </div>
                        )}
                        <div className={styles.cardDivider}></div>
                        <div className={styles.cardFooterRow}>
                          <button type="button" className={styles.secondaryButton} onClick={() => navigate('/')}>Cancel</button>
                          <button type="button" className={styles.primaryButton} onClick={handleNext} disabled={!isCurrentStepValid}>Next</button>
                        </div>
                      </div>
                    </>
                  )}

                  {currentStep === 1 && (
                    <>
                      <div className="section">
                        <h2 className="section-title">Configuration Definition</h2>
                        <div className={styles.fieldRow}>
                            <div className={`${styles.flex1} form-group`}>
                              <label className="form-label required">Key</label>
                              <input
                                type="text"
                                className={`form-input ${validationErrors.key ? styles.inputError : ''}`}
                                value={form.key}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'key', value: e.target.value })}
                                placeholder="e.g., max_connections"
                              />
                              <p className={styles.helperText}>Unique identifier for this configuration.</p>
                              {validationErrors.key && <div className={styles.errorText}>{validationErrors.key}</div>}
                            </div>
                            <div className={`${styles.flex1} form-group`}>
                              <label className="form-label required">Label</label>
                              <input
                                type="text"
                                className={`form-input ${validationErrors.label ? styles.inputError : ''}`}
                                value={form.label}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'label', value: e.target.value })}
                                placeholder="e.g., Maximum Connections"
                              />
                              <p className={styles.helperText}>Human-readable name displayed to users.</p>
                              {validationErrors.label && <div className={styles.errorText}>{validationErrors.label}</div>}
                            </div>
                        </div>

                        <div className="form-group">
                          <label className="form-label">Description</label>
                          <textarea
                            className="form-textarea"
                            value={form.description}
                            onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'description', value: e.target.value })}
                            placeholder="Detailed explanation of this configuration..."
                          />
                        </div>
                      </div>

                      <div className="section">
                        <h2 className="section-title">Data Type &amp; Validation</h2>
                        <div className="form-group-row">
                          <div className="form-group">
                            <label className="form-label required">Data Type</label>
                            <select
                              className="form-select"
                              value={form.data_type}
                              onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'data_type', value: e.target.value as DataType })}
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="list">List</option>
                            </select>
                          </div>
                        </div>

                        <div className={styles.validationCard}>
                          <div className={styles.validationHeader}>
                            <div>
                              <div className={styles.validationTitle}>Validation Rules</div>
                              <div className={styles.validationSubtitle}>Required is always enforced. Fields adapt to data type.</div>
                            </div>
                            <label className={styles.toggleRow} aria-disabled="true">
                              <span className={styles.toggleLabel}>Required</span>
                              <button
                                type="button"
                                className={`toggle active ${styles.toggleDisabled}`}
                                aria-pressed={true}
                                tabIndex={-1}
                              >
                                <span className="toggle-knob"></span>
                              </button>
                            </label>
                          </div>

                          {form.data_type === 'number' && (
                            <div className="form-group-row">
                              <div className="form-group">
                                <label className="form-label">Min</label>
                                <input
                                  type="number"
                                  className={`form-input ${validationErrors.number_range ? styles.inputError : ''}`}
                                  value={validationState.number.min}
                                  onChange={(e) => updateNumberField('min', e.target.value)}
                                  placeholder="Minimum value"
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">Max</label>
                                <input
                                  type="number"
                                  className={`form-input ${validationErrors.number_range ? styles.inputError : ''}`}
                                  value={validationState.number.max}
                                  onChange={(e) => updateNumberField('max', e.target.value)}
                                  placeholder="Maximum value"
                                />
                              </div>
                              {validationErrors.number_range && (
                                <div className={`${styles.errorText} ${styles.errorTextFullSpan}`}>
                                  {validationErrors.number_range}
                                </div>
                              )}
                            </div>
                          )}

                          {form.data_type === 'string' && (
                            <div className="form-group">
                              <label className="form-label">Regex Pattern</label>
                              <input
                                type="text"
                                className="form-input"
                                value={validationState.string.regex}
                                onChange={(e) => updateStringRegex(e.target.value)}
                                placeholder="e.g., ^[a-zA-Z0-9_]+$"
                              />
                              <p className={styles.helperText}>Enter a regex pattern to validate the input.</p>
                            </div>
                          )}

                          {form.data_type === 'date' && (
                            <div className="form-group-row">
                              <div className="form-group">
                                <label className="form-label">Start Date</label>
                                <input
                                  type="date"
                                  className={`form-input ${validationErrors.date_range ? styles.inputError : ''}`}
                                  value={validationState.date.startDate}
                                  onChange={(e) => updateDateField('startDate', e.target.value)}
                                />
                              </div>
                              <div className="form-group">
                                <label className="form-label">End Date</label>
                                <input
                                  type="date"
                                  className={`form-input ${validationErrors.date_range ? styles.inputError : ''}`}
                                  value={validationState.date.endDate}
                                  onChange={(e) => updateDateField('endDate', e.target.value)}
                                />
                              </div>
                              {validationErrors.date_range && (
                                <div className={`${styles.errorText} ${styles.errorTextFullSpan}`}>
                                  {validationErrors.date_range}
                                </div>
                              )}
                            </div>
                          )}

                          {form.data_type === 'list' && (
                            <div className={styles.listBlock}>
                              <div className={styles.listModeRow}>
                                <div className={styles.listModeTitle}>List Mode</div>
                                <div className={styles.listModeOptions}>
                                  <label className={styles.radioOption}>
                                    <input
                                      type="radio"
                                      name="list-mode"
                                      checked={validationState.list.mode === 'single'}
                                      onChange={() => updateListMode('single')}
                                    />
                                    <span>Single Select</span>
                                  </label>
                                  <label className={styles.radioOption}>
                                    <input
                                      type="radio"
                                      name="list-mode"
                                      checked={validationState.list.mode === 'multi'}
                                      onChange={() => updateListMode('multi')}
                                    />
                                    <span>Multi Select</span>
                                  </label>
                                </div>
                                <div className={styles.helperText}>Single: pick one | Multi: pick multiple.</div>
                              </div>

                              <div className={styles.listOptionsHeader}>
                                <div className={styles.listOptionsTitle}>List Options</div>
                                {validationErrors.list_options && (
                                  <div className={styles.errorText}>{validationErrors.list_options}</div>
                                )}
                              </div>
                              <div className={styles.listOptionsGrid}>
                                {validationState.list.options.map((opt, index) => (
                                  <div key={index} className={styles.optionRow}>
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="Label"
                                      value={opt.label}
                                      onChange={(e) => updateListOption(index, 'label', e.target.value)}
                                    />
                                    <input
                                      type="text"
                                      className="form-input"
                                      placeholder="Value"
                                      value={opt.value}
                                      onChange={(e) => updateListOption(index, 'value', e.target.value)}
                                    />
                                    <button
                                      type="button"
                                      className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                                      aria-label="Remove option"
                                      onClick={() => removeListOption(index)}
                                    >
                                      <img src={trashIcon} alt="" className={styles.iconImg} aria-hidden="true" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              <button type="button" className={styles.addLink} onClick={addListOption}>
                                + Add Option
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="section">
                        <h2 className="section-title">Default &amp; Validity</h2>
                        <div className={styles.twoColumnGrid}>
                          <div className="form-group">
                            <label className="form-label required">Default Value</label>
                            {form.data_type === 'string' && (
                              <input
                                type="text"
                                className={`form-input ${validationErrors.default_value ? styles.inputError : ''}`}
                                value={form.default_value}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'default_value', value: e.target.value })}
                                placeholder="Default value..."
                              />
                            )}
                            {form.data_type === 'number' && (
                              <input
                                type="number"
                                className={`form-input ${validationErrors.default_value ? styles.inputError : ''}`}
                                value={form.default_value}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'default_value', value: e.target.value })}
                                placeholder="Default numeric value..."
                              />
                            )}
                            {form.data_type === 'date' && (
                              <input
                                type="date"
                                className={`form-input ${validationErrors.default_value ? styles.inputError : ''}`}
                                value={form.default_value}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'default_value', value: e.target.value })}
                              />
                            )}
                            {form.data_type === 'list' && validationState.list.mode === 'single' && (
                              <select
                                className={`form-select ${validationErrors.default_value ? styles.inputError : ''}`}
                                value={form.default_value}
                                onChange={(e) => dispatch({ type: 'SET_FIELD', field: 'default_value', value: e.target.value })}
                              >
                                <option value="">-- Select default --</option>
                                {validationState.list.options.map((opt, i) => (
                                  <option key={i} value={opt.value}>{opt.label || opt.value}</option>
                                ))}
                              </select>
                            )}
                            {form.data_type === 'list' && validationState.list.mode === 'multi' && (
                              <>
                                <select
                                  className="form-select"
                                  multiple
                                  value={(form.default_value || '').split(',').filter(Boolean)}
                                  onChange={(e) => {
                                    const values = Array.from(e.currentTarget.selectedOptions).map(o => o.value);
                                    dispatch({ type: 'SET_FIELD', field: 'default_value', value: values.join(',') });
                                  }}
                                >
                                  {validationState.list.options.map((opt, i) => (
                                    <option key={i} value={opt.value}>{opt.label || opt.value}</option>
                                  ))}
                                </select>
                                <p className={styles.helperText}>Multi-select stores comma-separated defaults.</p>
                              </>
                            )}
                            {validationErrors.default_value && (
                              <div className={styles.errorText}>{validationErrors.default_value}</div>
                            )}
                          </div>
                          <div className="form-group">
                            <label className="form-label">Validity Date</label>
                            <div className={styles.validitySingle}>
                              <input
                                type="date"
                                className={`form-input ${validationErrors.validity_range ? styles.inputError : ''}`}
                                value={validity.end}
                                onChange={(e) => setValidity((v) => ({ ...v, end: e.target.value }))}
                              />
                            </div>
                            {validationErrors.validity_range && (
                              <div className={styles.errorText}>{validationErrors.validity_range}</div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className={styles.navRow}>
                        <button type="button" className={styles.secondaryButton} onClick={handleBack}>
                          Back
                        </button>
                        <button type="button" className={styles.primaryButton} onClick={handleNext} disabled={!isCurrentStepValid}>
                          Next
                        </button>
                      </div>
                    </>
                  )}

                  {currentStep === 2 && (
                    <>
                      <div className="section">
                        <h2 className="section-title">Localization &amp; Translations</h2>
                        <div className={styles.translationList}>
                          {form.translations.map((translation, index) => (
                            <div key={index} className={styles.translationRow}>
                              <div className={styles.translationFields}>
                                <div className="form-group">
                                  <label className="form-label">Language *</label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={translation.language}
                                    onChange={(e) => handleTranslationChange(index, 'language', e.target.value)}
                                    placeholder="e.g., es, fr, de"
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Label *</label>
                                  <input
                                    type="text"
                                    className="form-input"
                                    value={translation.label}
                                    onChange={(e) => handleTranslationChange(index, 'label', e.target.value)}
                                  />
                                </div>
                                <div className="form-group">
                                  <label className="form-label">Description</label>
                                  <textarea
                                    className="form-textarea"
                                    value={translation.description || ''}
                                    onChange={(e) => handleTranslationChange(index, 'description', e.target.value)}
                                    placeholder="Optional description..."
                                  />
                                </div>
                              </div>
                              <button
                                type="button"
                                className={`${styles.iconButton} ${styles.iconButtonDanger} ${styles.translationRemove}`}
                                aria-label="Remove translation"
                                onClick={() =>
                                  dispatch({
                                    type: 'SET_TRANSLATIONS',
                                    value: form.translations.filter((_, i) => i !== index),
                                  })
                                }
                              >
                                <img src={trashIcon} alt="" className={styles.iconImg} aria-hidden="true" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          className={styles.addLink}
                          onClick={() =>
                            dispatch({
                              type: 'SET_TRANSLATIONS',
                              value: [...form.translations, { language: '', label: '', description: '' }],
                            })
                          }
                        >
                          + Add Language
                        </button>
                        {validationErrors.translations && (
                          <div className={styles.errorText}>{validationErrors.translations}</div>
                        )}
                      </div>

                      <div className={`section ${styles.sectionNoBorder}`}>
                        <h2 className="section-title">Status</h2>
                        <div className="form-group">
                          <label className={styles.toggleLabelRow}>
                            <button
                              type="button"
                              className={`toggle ${form.active ? 'active' : ''}`}
                              onClick={() => dispatch({ type: 'SET_FIELD', field: 'active', value: !form.active })}
                            >
                              <span className="toggle-knob"></span>
                            </button>
                            <span>{form.active ? 'Active' : 'Inactive'}</span>
                          </label>
                        </div>
                      </div>

                      <div className={styles.navRow}>
                        <button type="button" className={styles.secondaryButton} onClick={handleBack}>
                          Back
                        </button>
                        <button type="submit" className={styles.primaryButton} disabled={isLoading || !isFormValid}>
                          {isLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>
            </div>

            <Stepper
              steps={steps}
              activeStepId={steps[currentStep].id}
              completedSteps={completedSteps}
              onStepClick={handleStepperClick}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateConfiguration;
