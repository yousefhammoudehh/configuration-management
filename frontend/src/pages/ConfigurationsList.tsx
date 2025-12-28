import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { configurationsAPI, Configuration } from '../services/api';
import { useConfigurationStore } from '../store/configurationStore';
import { TopHeader } from '../components/TopHeader';
import { Sidebar } from '../components/Sidebar';
import editIcon from '../assets/edit.svg';
import trashIcon from '../assets/trash.svg';
import './ConfigurationsList.css';

// Local type that optionally supports nested children
export type ConfigNode = Configuration & { children?: ConfigNode[] };

type FlattenedRow = {
  config: ConfigNode;
  level: number;
  hasChildren: boolean;
};

const TYPE_VARIANTS: Record<string, { className: string; label: string }> = {
  list: { className: 'cfg-type-pill--list', label: 'List' },
  string: { className: 'cfg-type-pill--string', label: 'Text' },
  number: { className: 'cfg-type-pill--number', label: 'Number' },
  date: { className: 'cfg-type-pill--date', label: 'Date' },
};

export function ConfigurationsList() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { configurations, setConfigurations, total, limit, offset } = useConfigurationStore();

  const loadConfigurations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await configurationsAPI.listConfigurations(100, 0);
      setConfigurations(response.items, response.total, response.limit, response.offset);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load configurations');
    } finally {
      setIsLoading(false);
    }
  }, [setConfigurations]);

  useEffect(() => {
    void loadConfigurations();
  }, [loadConfigurations]);

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDelete = async (id: string, key: string) => {
    if (!window.confirm(`Delete configuration "${key}"?`)) return;
    try {
      await configurationsAPI.deleteConfiguration(id);
      const nextConfigs = configurations.filter((config) => config.id !== id);
      const nextTotal = Math.max(total - 1, 0);
      setConfigurations(nextConfigs, nextTotal, limit, offset);
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete configuration');
    }
  };

  const flattenedRows: FlattenedRow[] = useMemo(() => {
    const rows: FlattenedRow[] = [];
    const nodeMap = new Map<string, ConfigNode>();
    const roots: ConfigNode[] = [];

    configurations.forEach((config) => {
      nodeMap.set(config.id, { ...config, children: [] });
    });

    nodeMap.forEach((node) => {
      if (node.parent_config_id && nodeMap.has(node.parent_config_id)) {
        nodeMap.get(node.parent_config_id)?.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    const walk = (nodes: ConfigNode[], level: number) => {
      nodes.forEach((node) => {
        const hasChildren = Boolean(node.children && node.children.length > 0);
        rows.push({ config: node, level, hasChildren });
        if (hasChildren && expanded.has(node.id)) {
          walk(node.children || [], level + 1);
        }
      });
    };

    walk(roots, 0);
    return rows;
  }, [configurations, expanded]);

  if (isLoading) {
    return (
      <div className="landing-layout">
        <TopHeader />
        <div className="landing-content">
          <Sidebar />
          <div className="landing-main landing-status">Loading...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="landing-layout">
        <TopHeader />
        <div className="landing-content">
          <Sidebar />
          <div className="landing-main landing-status landing-status--error">{error}</div>
        </div>
      </div>
    );
  }

  const renderTypePill = (type: string) => {
    const variant = TYPE_VARIANTS[type] || { className: 'cfg-type-pill--default', label: type };
    return (
      <span className={`cfg-type-pill ${variant.className}`}>
        {variant.label}
      </span>
    );
  };

  const rowsToRender = flattenedRows.length ? flattenedRows : [];

  return (
    <div className="landing-layout">
      <TopHeader />
      <div className="landing-content">
        <Sidebar />
        {rowsToRender.length === 0 ? (
          <div className="landing-main landing-main--empty">
            <div className="landing-glow landing-glow--centered" />
            <div className="landing-empty-state">
              <div className="landing-illustration">
                <img src="/src/assets/empty_state.svg" alt="No configurations" className="empty-state-image" />
              </div>
              <h1 className="landing-title">Axis Configuration Management</h1>
              <button className="landing-cta-btn" onClick={() => navigate('/create')}>
                Define New Configuration
              </button>
            </div>
          </div>
        ) : (
          <div className="landing-main">
            <div className="cfg-page-container">
              <div className="cfg-page-header">
                <h1 className="cfg-page-title">Axis Configuration Management</h1>
                <button className="cfg-create-btn" onClick={() => navigate('/create')}>
                  Create New
                </button>
              </div>
              <div className="cfg-table-card">
                <div className="cfg-table-header">
                  <div className="col checkbox-col">&nbsp;</div>
                  <div className="col expand-col">&nbsp;</div>
                  <div className="col key-col">KEY</div>
                  <div className="col label-col">LABEL</div>
                  <div className="col type-col">TYPE</div>
                  <div className="col updated-col">LAST UPDATED</div>
                  <div className="col actions-col" aria-hidden="true">&nbsp;</div>
                </div>

                <div className="cfg-table-body">
                  {rowsToRender.map(({ config, level, hasChildren }) => {
                    const isExpanded = expanded.has(config.id);
                    const isChild = level > 0;
                    return (
                      <div key={config.id} className="cfg-row">
                        <div className="col checkbox-col">
                          <input
                            type="checkbox"
                            aria-label={`Select ${config.key}`}
                            checked={selected.has(config.id)}
                            onChange={() => toggleSelect(config.id)}
                            className="cfg-checkbox"
                          />
                        </div>

                        <div className="col expand-col">
                          {hasChildren ? (
                            <button
                              type="button"
                              className="cfg-expand-btn"
                              aria-label={isExpanded ? 'Collapse' : 'Expand'}
                              aria-expanded={isExpanded}
                              onClick={() => toggleExpand(config.id)}
                            >
                              <span className={`cfg-expand-icon ${isExpanded ? 'expanded' : ''}`}>
                                ›
                              </span>
                            </button>
                          ) : null}
                        </div>

                        <div className={`col key-col ${isChild ? 'is-child' : ''}`}>
                          {isChild && (
                            <span className={`tree-connector tree-connector--level-${Math.min(level, 6)}`} aria-hidden="true">
                              <span className="tree-connector-dot" aria-hidden="true"></span>
                            </span>
                          )}
                          <span className={`cfg-key-text ${isChild ? 'cfg-key-text--child' : ''}`}>
                            {config.key}
                          </span>
                        </div>
                        <div className="col label-col">{config.label}</div>
                        <div className="col type-col">{renderTypePill(config.data_type)}</div>
                        <div className="col updated-col">{config.updated_at ? new Date(config.updated_at).toLocaleDateString() : '—'}</div>
                        <div className="col actions-col">
                          <button
                            type="button"
                            className="cfg-action-btn edit"
                            aria-label={`Edit ${config.key}`}
                            onClick={() => navigate(`/edit/${config.id}`)}
                          >
                            <img src={editIcon} alt="" className="cfg-action-icon" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="cfg-action-btn delete"
                            aria-label={`Delete ${config.key}`}
                            onClick={() => handleDelete(config.id, config.key)}
                          >
                            <img src={trashIcon} alt="" className="cfg-action-icon" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
