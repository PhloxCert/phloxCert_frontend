import React from 'react';
import { Link, useNavigate } from 'react-router-dom';

const Sidebar = ({ activePage }) => {
  const navigate = useNavigate();
  const userRole = localStorage.getItem('userRole'); // '2' = technician

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /> },
    // Mostra History solo se role = 2
    ...(userRole === '2'
      ? [{ label: 'History', href: '/history', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> }]
      : []),
  ];

  const logout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <aside className="w-64 bg-phlox-navy text-white flex flex-col fixed inset-y-0 left-0 z-30 transition-transform duration-300 transform -translate-x-full md:translate-x-0 shadow-xl">
      {/* Logo */}
      <div className="h-24 flex items-center px-6 border-b border-slate-800 bg-slate-900">
        <img src="/logoPhloxCert.png" alt="PhloxCert Logo" className="h-14 w-auto drop-shadow-sm mr-3" />
        <div>
          <span className="text-xl font-bold tracking-tight block leading-none">PhloxCert</span>
          <span className="text-[10px] text-slate-400 uppercase tracking-widest font-semibold">Immutable Fire Safety</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map(item => {
          const isActive = activePage === item.label;
          const bgClass = isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700 hover:text-white';
          return (
            <Link
              key={item.label}
              to={item.href}
              className={`${bgClass} group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors`}
            >
              <svg className={`mr-3 h-6 w-6 flex-shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-white'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {item.icon}
              </svg>
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* User / Logout */}
      <div className="p-4 border-t border-slate-700">
        <button onClick={logout} className="flex items-center text-sm font-medium text-slate-300 hover:text-white group w-full text-left">
          <svg className="mr-3 h-5 w-5 text-slate-400 group-hover:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;