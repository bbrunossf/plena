import { Link, useLocation } from '@remix-run/react';

export default function Sidebar() {
  const location = useLocation();

  const links = [
    { to: '/', label: 'Home' },
    { to: '/pessoas', label: 'Funcionários' },        
    { to: '/obras', label: 'Obras' },    
    { to: '/costs5', label: 'Custos' },    ,
    { to: '/registros', label: 'Registros' },
    { to: '/mes2', label: 'Registros por Mês' },
	{ to: '/relatorioObras', label: 'Registros por Obra, por Mês' },	
    { to: '/agenda', label: 'Agenda' },
    { to: '/gantt', label: 'Cronograma' },
	{ to: '/converter2', label: 'Conversor de Datas' },
  { to: '/tutorial_conversor', label: 'Tutorial de Conversão de Datas' },
    
  ];

  return (
    <div className="bg-gray-800 text-white w-64 min-h-screen fixed left-0 top-0">
      <div className="p-2">
        <h1 className="text-xl font-bold mb-8">Sistema de Gestão</h1>
        <nav>
          <ul className="space-y-1">
            {links.map((link) => (
              <li key={link.to}>
                <Link
                  to={link.to}
                  className={`block p-2 rounded hover:bg-gray-700 transition-colors ${
                    location.pathname === link.to ? 'bg-gray-700' : ''
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}