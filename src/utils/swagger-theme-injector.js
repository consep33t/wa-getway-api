const { SwaggerTheme, SwaggerThemeNameEnum } = require('swagger-themes');
const theme = new SwaggerTheme();

const customCss = `
  .theme-toggle-container {
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    gap: 10px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 10px;
    border-radius: 50px;
    box-shadow: 0 4px 15px rgba(0,0,0,0.2);
    border: 1px solid rgba(255,255,255,0.2);
  }
  .theme-btn {
    cursor: pointer;
    border: none;
    border-radius: 20px;
    padding: 8px 16px;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.3s ease;
  }
  .theme-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 10px rgba(0,0,0,0.3);
  }
  .btn-dark { background: #2b2b2b; color: #fff; }
  .btn-light { background: #f0f0f0; color: #333; }
  .btn-nord { background: #4c566a; color: #eceff4; }
  .btn-dracula { background: #bd93f9; color: #282a36; }
  
  /* Additional professional tweaks */
  .swagger-ui .topbar { background-color: #1e1e1e !important; box-shadow: 0 2px 10px rgba(0,0,0,0.5); }
  .swagger-ui .info .title { font-family: 'Inter', sans-serif !important; font-weight: 800; }
`;

const customJs = `
  document.addEventListener("DOMContentLoaded", function() {
    const container = document.createElement('div');
    container.className = 'theme-toggle-container';
    
    const themes = [
      { name: 'Dark', class: 'btn-dark', id: 'theme-dark' },
      { name: 'Light', class: 'btn-light', id: 'theme-light' },
      { name: 'Nord', class: 'btn-nord', id: 'theme-nord' },
      { name: 'Dracula', class: 'btn-dracula', id: 'theme-dracula' }
    ];
    
    themes.forEach(t => {
      const btn = document.createElement('button');
      btn.className = 'theme-btn ' + t.class;
      btn.innerText = t.name;
      btn.onclick = () => {
        // Fetch new CSS dynamically
        fetch('/api-docs/theme/' + t.name.toLowerCase())
          .then(res => res.text())
          .then(css => {
            let style = document.getElementById('custom-theme-style');
            if(!style) {
              style = document.createElement('style');
              style.id = 'custom-theme-style';
              document.head.appendChild(style);
            }
            style.innerHTML = css;
            localStorage.setItem('swagger-theme', t.name.toLowerCase());
          });
      };
      container.appendChild(btn);
    });
    
    document.body.appendChild(container);
    
    // Load saved theme
    const saved = localStorage.getItem('swagger-theme');
    if(saved) {
      document.querySelector('.btn-' + saved)?.click();
    } else {
      document.querySelector('.btn-dark')?.click();
    }
  });
`;

module.exports = {
  customCss,
  customJs
};
