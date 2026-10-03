const fs = require('fs');
const path = require('path');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    if (fs.statSync(dirPath).isDirectory()) {
      walk(dirPath, callback);
    } else {
      callback(dirPath);
    }
  });
}

const replacements = [
  { regex: /Gestão de O\.S\./g, repl: 'Gestão de Ocorrências' },
  { regex: /Minhas O\.S\./g, repl: 'Minhas Ocorrências' },
  { regex: /Mapa de O\.S\./g, repl: 'Mapa de Ocorrências' },
  { regex: /Ordens de Serviço/g, repl: 'Ocorrências' },
  { regex: /Ordem de Serviço/g, repl: 'Ocorrência' },
  { regex: /O\.S\. Agendadas/g, repl: 'Ocorrências Agendadas' },
  { regex: /Próximas O\.S\./g, repl: 'Próximas Ocorrências' },
  { regex: /Nova O\.S\./g, repl: 'Nova Ocorrência' },
  { regex: /Ocultar OS/g, repl: 'Ocultar Ocorrência' },
  { regex: /Ocultar O\.S\./g, repl: 'Ocultar Ocorrência' },
  { regex: /O\.S\. #/g, repl: 'Ocorrência #' },
  { regex: /OS #/g, repl: 'Ocorrência #' },
  { regex: /da O\.S\./g, repl: 'da Ocorrência' },
  { regex: /da OS/g, repl: 'da Ocorrência' },
  { regex: /Nenhuma OS/g, repl: 'Nenhuma Ocorrência' },
  { regex: /Nenhuma O\.S\./g, repl: 'Nenhuma Ocorrência' },
  { regex: /Status OS/g, repl: 'Status Ocorrência' },
  { regex: /O\.S\. PENDENTES/g, repl: 'OCORRÊNCIAS PENDENTES' },
  { regex: /Status da O\.S\./g, repl: 'Status da Ocorrência' },
  { regex: />O\.S\.</g, repl: '>Ocorrência<' },
  { regex: /"O\.S\."/g, repl: '"Ocorrência"' },
  { regex: />OS</g, repl: '>Ocorrência<' },
  { regex: /"OS"/g, repl: '"Ocorrência"' },
  { regex: /uma O\.S\./g, repl: 'uma Ocorrência' },
  { regex: /uma OS/g, repl: 'uma Ocorrência' },
  { regex: /na O\.S\./g, repl: 'na Ocorrência' },
  { regex: /na OS/g, repl: 'na Ocorrência' },
  { regex: /O\.S\./g, repl: 'Ocorrências' }, // Fallback for any remaining "O.S." 
];

walk('./app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    
    replacements.forEach(r => {
      content = content.replace(r.regex, r.repl);
    });
    
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Updated ${filePath}`);
    }
  }
});
