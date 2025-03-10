/**
 * Script pour récupérer et analyser la structure du fichier CSV de recettes
 */

async function fetchAndAnalyzeCSV() {
  try {
    console.log('Récupération du fichier CSV depuis Hugging Face...');
    
    // URL du fichier CSV sur Hugging Face
    const url = 'https://huggingface.co/datasets/Shengtao/recipe/resolve/main/recipe.csv';
    
    // Récupération du contenu du fichier
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const csvText = await response.text();
    console.log(`Fichier CSV récupéré (${(csvText.length / 1024 / 1024).toFixed(2)} Mo)`);
    
    // Analyse des en-têtes
    const lines = csvText.split('\n');
    const headers = lines[0].split(',');
    
    console.log('\nStructure du CSV:');
    console.log(`Nombre de colonnes: ${headers.length}`);
    console.log(`En-têtes: ${headers.join(', ')}`);
    
    // Analyse des 5 premières lignes pour comprendre la structure des données
    console.log('\nExemples de données (5 premières lignes):');
    
    for (let i = 1; i <= 5 && i < lines.length; i++) {
      console.log(`\nLigne ${i}:`);
      
      // Analyse manuelle pour gérer les virgules dans les champs entre guillemets
      const row = parseCSVLine(lines[i]);
      
      // Affichage des données
      headers.forEach((header, index) => {
        console.log(`  ${header}: ${row[index] ? row[index].substring(0, 100) + (row[index].length > 100 ? '...' : '') : 'null'}`);
      });
    }
    
    // Analyse des types de données
    console.log('\nAnalyse des types de données:');
    const sampleSize = Math.min(100, lines.length - 1);
    const dataTypes: Record<string, Set<string>> = {};
    
    headers.forEach(header => {
      dataTypes[header] = new Set<string>();
    });
    
    for (let i = 1; i <= sampleSize && i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      
      headers.forEach((header, index) => {
        const value = row[index];
        if (value === undefined || value === null || value === '') {
          dataTypes[header].add('null/empty');
        } else if (!isNaN(Number(value))) {
          dataTypes[header].add('number');
        } else {
          dataTypes[header].add('string');
        }
      });
    }
    
    headers.forEach(header => {
      console.log(`  ${header}: ${Array.from(dataTypes[header]).join(', ')}`);
    });
    
    // Analyse des valeurs manquantes
    console.log('\nAnalyse des valeurs manquantes:');
    const missingValues: Record<string, number> = {};
    
    headers.forEach(header => {
      missingValues[header] = 0;
    });
    
    for (let i = 1; i < lines.length; i++) {
      const row = parseCSVLine(lines[i]);
      
      headers.forEach((header, index) => {
        const value = row[index];
        if (value === undefined || value === null || value === '') {
          missingValues[header]++;
        }
      });
    }
    
    headers.forEach(header => {
      const missingPercentage = (missingValues[header] / (lines.length - 1) * 100).toFixed(2);
      console.log(`  ${header}: ${missingValues[header]} valeurs manquantes (${missingPercentage}%)`);
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'analyse du CSV:', error);
  }
}

/**
 * Parse une ligne CSV en gérant les virgules dans les champs entre guillemets
 * @param line Ligne CSV à parser
 * @returns Tableau des valeurs
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Ajouter le dernier champ
  result.push(current.trim());
  
  // Nettoyer les guillemets des valeurs
  return result.map(value => {
    if (value.startsWith('"') && value.endsWith('"')) {
      return value.substring(1, value.length - 1);
    }
    return value;
  });
}

// Exécution de la fonction d'analyse
fetchAndAnalyzeCSV();
