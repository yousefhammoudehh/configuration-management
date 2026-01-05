import salesforceSrc from '../assets/salesforce.svg';
import chartSrc from '../assets/chart.svg';

export function Sidebar() {
  return (
    <aside className="landing-sidebar">
      {/* OP Salesforce Dropdown */}
      <div className="sidebar-product-selector">
        <img src={salesforceSrc} alt="Salesforce" className="sidebar-icon-img" />
        <span className="nav-item-text">OP Salesforce</span>
        <span className="selector-chevron">›</span>
      </div>

      {/* Navigation Section */}
      <nav className="sidebar-nav">
        {/* Active: Configuration Engine */}
        <div className="nav-item-wrapper active">
          <div className="nav-accent-bar"></div>
          <div className="nav-item-content">
            <img src={chartSrc} alt="Configuration Engine" className="nav-item-icon-img" />
            <span className="nav-item-text">Configuration Engine</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}
