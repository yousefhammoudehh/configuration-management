import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { configurationsAPI, ValidationRule, ParentCondition, Translation, ParentOption } from '../services/api';
import { Sidebar } from '../components/Sidebar';
import { TopHeader } from '../components/TopHeader';
import './EditConfiguration.css';
import trashIcon from '../assets/trash.svg';

type DataType = 'string' | 'number' | 'date' | 'list';

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

const EditConfiguration = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parentConfigs, setParentConfigs] = useState<ParentOption[]>([]);
  const [parentConfigType, setParentConfigType] = useState<DataType | null>(null);
  const [parentListOptions, setParentListOptions] = useState<{ label: string; value: string }[]>([]);

  const [form, setForm] = useState<FormData>({
    key: '',
    label: '',
    description: '',
    data_type: 'string',
    default_value: '',
    active: false,
    parent_config_id: null,
    parent_conditions: [],
    validation_rules: [],
    translations: [],
  });

  const [parentConditionRows, setParentConditionRows] = useState<ParentCondition[]>([]);
  const [translationRows, setTranslationRows] = useState<Translation[]>([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        if (!id) return;

        const config = await configurationsAPI.getConfiguration(id);
        setForm({
          key: config.key,
          label: config.label,
          description: config.description || '',
          data_type: config.data_type as DataType,
          default_value: config.default_value || '',
          active: config.active,
          parent_config_id: config.parent_config_id || null,
          parent_conditions: config.parent_conditions || [],
          validation_rules: config.validation_rules || [],
          translations: config.translations || [],
        });

        setParentConditionRows(config.parent_conditions || []);
        setTranslationRows(config.translations || []);

        // Load parent configs for dropdown
        const response = await configurationsAPI.getParentOptions(id);
        setParentConfigs(response);

        if (config.parent_config_id) {
          const parentConfig = await configurationsAPI.getConfiguration(config.parent_config_id);
          const type = parentConfig.data_type as DataType;
          setParentConfigType(type);
          if (type === 'list') {
            const listRule = parentConfig.validation_rules?.find((rule) => rule.rule_type === 'list_options');
            const options = Array.isArray(listRule?.value) ? listRule?.value : [];
            setParentListOptions(options);
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load configuration');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (!form.label.trim()) {
        setError('Label is required');
        return;
      }

      if (!id) return;

      await configurationsAPI.updateConfiguration(id, {
        label: form.label,
        description: form.description,
        data_type: form.data_type,
        default_value: form.default_value || undefined,
        parent_config_id: form.parent_config_id || undefined,
        parent_conditions: parentConditionRows,
        validation_rules: form.validation_rules,
        translations: translationRows,
      });
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update configuration');
    } finally {
      setIsSaving(false);
    }
  };

  const handleParentBetweenChange = (index: number, field: 'min' | 'max', value: string) => {
    const updated = [...parentConditionRows];
    const current = updated[index];
    const [min, max] = `${current.value || ''}`.split(',').map((v) => v.trim());
    const nextMin = field === 'min' ? value : min;
    const nextMax = field === 'max' ? value : max;
    const nextValue = `${nextMin},${nextMax}`;
    updated[index] = { ...current, value: nextValue, default_value: nextValue };
    setParentConditionRows(updated);
  };

  const handleParentListChange = (index: number, values: string[]) => {
    const updated = [...parentConditionRows];
    const nextValue = values.join(',');
    updated[index] = { ...updated[index], value: nextValue, default_value: nextValue, operator: 'in' };
    setParentConditionRows(updated);
  };

  const handleParentConfigSelect = async (value: string | null) => {
    setForm({ ...form, parent_config_id: value });
    setParentConditionRows([]);
    if (!value) {
      setParentConfigType(null);
      setParentListOptions([]);
      return;
    }
    try {
      const parentConfig = await configurationsAPI.getConfiguration(value);
      const type = parentConfig.data_type as DataType;
      setParentConfigType(type);
      if (type === 'list') {
        const listRule = parentConfig.validation_rules?.find((rule) => rule.rule_type === 'list_options');
        const options = Array.isArray(listRule?.value) ? listRule?.value : [];
        setParentListOptions(options);
      } else {
        setParentListOptions([]);
      }
    } catch (err) {
      setParentConfigType(null);
      setParentListOptions([]);
    }
  };

  const handleToggleStatus = async () => {
    try {
      setIsSaving(true);
      setError(null);

      if (!id) return;

      await configurationsAPI.updateConfiguration(id, {
        active: !form.active,
      });

      setForm(prev => ({ ...prev, active: !prev.active }));
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this configuration?')) return;

    try {
      setIsSaving(true);
      setError(null);

      if (!id) return;

      await configurationsAPI.deleteConfiguration(id);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Failed to delete configuration');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="landing-layout">
        <TopHeader />
        <div className="landing-content">
          <Sidebar />
          <div className="main-wrapper">
            <div className="loading">Loading configuration...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="landing-layout">
      <TopHeader />
      <div className="landing-content">
        <Sidebar />
        <div className="main-wrapper">
          <div className="form-header">
            <div>
              <h1 className="form-title">Edit Configuration</h1>
              <p className="form-subtitle">{`Editing: ${form.label}`}</p>
            </div>
            <div className="header-actions">
              <button
                className={`btn ${form.active ? 'btn-secondary' : 'btn-primary'}`}
                onClick={handleToggleStatus}
                disabled={isSaving}
              >
                {form.active ? 'Deactivate' : 'Activate'}
              </button>
              <button
                className="btn btn-secondary btn-danger"
                onClick={handleDelete}
                disabled={isSaving}
              >
                Delete
              </button>
            </div>
          </div>
        <div className="content-area">
          <div className="content-main">
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
              {/* Parent Configuration Section */}
              <div className="section">
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
                  <p className="form-helper">Select a parent configuration for inheritance and conditional defaults.</p>
                </div>

                {form.parent_config_id && (
                  <div className="form-group">
                    <label className="form-label">Parent Condition</label>
                    <p className="form-helper form-helper--spaced">
                      Define the rules that must be met for inheritance to apply.
                    </p>
                    {parentConditionRows.map((rule, index) => (
                      <div key={index} className="condition-row">
                        {parentConfigType !== 'list' && (
                          <div className="condition-field flex-1">
                            <label className="condition-field-label">Operator</label>
                            <select
                              className="form-select"
                              value={rule.operator}
                              onChange={(e) => {
                                const updated = [...parentConditionRows];
                                const nextOperator = e.target.value;
                                updated[index].operator = nextOperator;
                                if (nextOperator !== 'between') {
                                  updated[index].value = '';
                                  updated[index].default_value = '';
                                }
                                setParentConditionRows(updated);
                              }}
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
                              className="form-select multi-select"
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
                            <div className="between-inputs">
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
                              onChange={(e) => {
                                const updated = [...parentConditionRows];
                                updated[index].value = e.target.value;
                                updated[index].default_value = e.target.value;
                                setParentConditionRows(updated);
                              }}
                            />
                          )}
                        </div>
                        <div className="condition-actions">
                          <button
                            type="button"
                            className="btn btn-icon"
                            onClick={() => setParentConditionRows(parentConditionRows.filter((_, i) => i !== index))}
                            aria-label="Remove condition"
                          >
                            <img src={trashIcon} alt="" className="btn-icon-img" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="add-rule-button"
                      onClick={() =>
                        setParentConditionRows([
                          ...parentConditionRows,
                          {
                            operator: parentConfigType === 'list' ? 'in' : '=',
                            value: '',
                            default_value: '',
                          },
                        ])
                      }
                    >
                      + Add Condition
                    </button>
                  </div>
                )}
              </div>

              {/* Key / Label / Description Section */}
              <div className="section">
                <h2 className="section-title">Configuration Details</h2>
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label">Key</label>
                    <input
                      type="text"
                      className="form-input readonly-field"
                      value={form.key}
                      disabled
                    />
                    <p className="form-helper">Key cannot be changed</p>
                  </div>
                  <div className="form-group">
                    <label className="form-label required">Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      placeholder="e.g., Maximum Connections"
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-textarea"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Detailed explanation of this configuration..."
                  />
                </div>
              </div>

              {/* Data Type & Validation Section */}
              <div className="section">
                <h2 className="section-title">Data Type & Validation</h2>
                <div className="form-group-row">
                  <div className="form-group">
                    <label className="form-label required">Data Type</label>
                    <select
                      className="form-select"
                      value={form.data_type}
                      onChange={(e) => setForm({ ...form, data_type: e.target.value as DataType })}
                    >
                      <option value="string">String</option>
                      <option value="number">Number</option>
                      <option value="date">Date</option>
                      <option value="list">List</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Default Value</label>
                    <input
                      type="text"
                      className="form-input"
                      value={form.default_value}
                      onChange={(e) => setForm({ ...form, default_value: e.target.value })}
                      placeholder="Default value for this config..."
                    />
                  </div>
                </div>
              </div>

              {/* Language Variants Section */}
              <div className="section">
                <h2 className="section-title">Language Variants</h2>
                {translationRows.length > 0 && (
                  <table className="language-variants-table">
                    <thead className="table-header">
                      <tr>
                        <th>Language</th>
                        <th>Label</th>
                        <th>Description</th>
                        <th className="table-actions-header">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="table-body">
                      {translationRows.map((translation, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={translation.language}
                              onChange={(e) => {
                                const updated = [...translationRows];
                                updated[index].language = e.target.value;
                                setTranslationRows(updated);
                              }}
                              placeholder="e.g., es, fr, de"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={translation.label}
                              onChange={(e) => {
                                const updated = [...translationRows];
                                updated[index].label = e.target.value;
                                setTranslationRows(updated);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-input"
                              value={translation.description || ''}
                              onChange={(e) => {
                                const updated = [...translationRows];
                                updated[index].description = e.target.value;
                                setTranslationRows(updated);
                              }}
                            />
                          </td>
                          <td className="table-actions-cell">
                            <button
                              type="button"
                              className="btn btn-icon"
                              onClick={() => setTranslationRows(translationRows.filter((_, i) => i !== index))}
                              aria-label="Remove translation"
                            >
                              <img src={trashIcon} alt="" className="btn-icon-img" aria-hidden="true" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                <button
                  type="button"
                  className="add-rule-button"
                  onClick={() =>
                    setTranslationRows([...translationRows, { language: '', label: '', description: '' }])
                  }
                >
                  + Add Translation
                </button>
              </div>

              {/* Active Status Section */}
              <div className="section section--no-border section--spaced">
                <h2 className="section-title">Status</h2>
                <div className="form-group">
                  <label className="toggle-row">
                    <button
                      type="button"
                      className={`toggle ${form.active ? 'active' : ''}`}
                      onClick={() => setForm({ ...form, active: !form.active })}
                    >
                      <span className="toggle-knob"></span>
                    </button>
                    <span>{form.active ? 'Active' : 'Inactive'}</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div className="section section--no-border section-actions">
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/')}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditConfiguration;
