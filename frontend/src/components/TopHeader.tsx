import { JSX } from 'react';
import logoSrc from '../assets/logo.svg';
import searchSrc from '../assets/search.svg';
import notificationSrc from '../assets/notification.svg';
import flagSrc from '../assets/us_flag.svg';
import moonSrc from '../assets/moon.svg';
import menuSrc from '../assets/menu.svg';

export function TopHeader(): JSX.Element {
  return (
    <header className="top-header">
      {/* Left: AXIS Logo */}
      <div className="header-logo">
        <img src={logoSrc} alt="AXIS Logo" className="logo-image" />
      </div>

      {/* Center-Left: Search Input */}
      <div className="header-search">
        <div className="search-wrap">
          <img src={searchSrc} alt="Search" className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search"
            aria-label="Search"
          />
        </div>
      </div>

      {/* Right: Controls */}
      <div className="header-controls">
        {/* Notification Icon */}
        <button className="header-icon-btn" aria-label="Notifications">
          <img src={notificationSrc} alt="Notifications" className="header-icon-img" />
        </button>

        {/* Language Selector */}
        <button className="language-pill">
          <img src={flagSrc} alt="US flag" className="flag-img" />
          <span className="language-text">English</span>
          <span className="chevron">›</span>
        </button>

        {/* Profile Block */}
        <div className="profile-block">
          {/* TODO: Use real user avatar from assets or generate placeholder */}
          <div className="avatar-placeholder"></div>
          <div className="profile-info">
            <div className="profile-name">Emily Johnson</div>
            <div className="profile-email">emilyjohnson@axis.com</div>
          </div>
        </div>

        {/* Theme Toggle (Moon Icon) */}
        <button className="header-icon-btn" aria-label="Toggle theme">
          <img src={moonSrc} alt="Toggle theme" className="header-icon-img" />
        </button>

        {/* Menu Button */}
        <button className="header-icon-btn" aria-label="Menu">
          <img src={menuSrc} alt="Menu" className="header-icon-img" />
        </button>
      </div>
    </header>
  );
}
