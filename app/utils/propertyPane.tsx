import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { TreeViewComponent } from '@syncfusion/ej2-react-navigations';

export function PropertyPane({ title, children }) {
  // Estado para controlar onde renderizar baseado na detecção de dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  const [mobilePane, setMobilePane] = useState(null);

  useEffect(() => {
    // Verificar se é dispositivo móvel
    const checkMobile = () => {
      return window.matchMedia('(max-width:550px)').matches;
    };

    // Definir o estado inicial
    setIsMobile(checkMobile());

    // Encontrar o elemento onde o portal será renderizado (apenas no cliente)
    const mobilePropPane = document.querySelector('.sb-mobile-prop-pane');
    setMobilePane(mobilePropPane);

    // Adicionar evento de resize para atualizar quando a tela mudar de tamanho
    const handleResize = () => {
      setIsMobile(checkMobile());
    };

    window.addEventListener('resize', handleResize);

    // Limpeza do evento quando o componente é desmontado
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Conteúdo do painel que será renderizado
  const panelContent = (
    <div className='property-panel-section'>
      <div className="property-panel-header">
        {title}
      </div>
      <div className="property-panel-content">
        {children}
      </div>
    </div>
  );

  // Renderizar no portal móvel ou diretamente, dependendo das condições
  if (isMobile && mobilePane) {
    return createPortal(panelContent, mobilePane);
  }

  return panelContent;
}