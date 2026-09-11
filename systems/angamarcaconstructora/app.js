const STORAGE_KEY = 'cupula_brief_angamarca_form_v1';

// Inicializa listeners y auto-guardado en localStorage
window.addEventListener('DOMContentLoaded', () => {
  loadFormData();
  setupBeforeUnloadWarning();
  setupAutoSave();

  const form = document.getElementById('brief-form');
  form.addEventListener('input', debounceSave);
  form.addEventListener('change', debounceSave);
});

// Aviso antes de cerrar/navegar si hay cambios sin guardar
let hasUnsavedChanges = false;
function setupBeforeUnloadWarning() {
  window.addEventListener('beforeunload', (e) => {
    if (hasUnsavedChanges) {
      hasUnsavedChanges = false;
      saveFormData();
    }
  });
}

let timeoutId;
let saveCount = 0;
function debounceSave() {
  hasUnsavedChanges = true;
  showSavingIndicator('Guardando cambios...');
  showSavingToast();
  clearTimeout(timeoutId);
  timeoutId = setTimeout(() => {
    saveFormData();
    saveCount++;
    showSavingIndicator('Guardado automático activo');
    hideSavingToast();
  }, 400);
}

// Guardado automático cada 30 segundos como respaldo
function setupAutoSave() {
  setInterval(() => {
    if (hasUnsavedChanges) {
      saveFormData();
      hasUnsavedChanges = false;
    }
  }, 30000);
}

function showSavingIndicator(text) {
  const statusText = document.getElementById('save-status-text');
  if (statusText) statusText.textContent = text;
}

function showSavingToast() {
  let toast = document.getElementById('saving-toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'saving-toast';
    toast.className = 'saving-toast';
    document.body.appendChild(toast);
  }
  toast.textContent = 'Guardando...';
  toast.classList.add('show');
}

function hideSavingToast() {
  const toast = document.getElementById('saving-toast');
  if (toast) toast.classList.remove('show');
}

function saveFormData() {
  try {
    const form = document.getElementById('brief-form');
    const data = {};
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el.name) continue;

      if (el.type === 'checkbox') {
        data[el.name] = el.checked;
      } else {
        data[el.name] = el.value;
      }
    }
    data._lastSaved = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Error guardando en localStorage:', e);
    showSavingIndicator('Error al guardar');
  }
}

function loadFormData() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
    const data = JSON.parse(saved);

    const form = document.getElementById('brief-form');
    const elements = form.elements;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (!el.name || data[el.name] === undefined) continue;

      if (el.type === 'checkbox') {
        el.checked = Boolean(data[el.name]);
      } else {
        el.value = data[el.name];
      }
    }
  } catch (e) {
    console.error('Error cargando desde localStorage:', e);
  }
}

// Modal personalizado sin alert() ni confirm()
function showModal(title, message, actionsHtml) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-message').textContent = message;
  const actionsContainer = document.getElementById('modal-actions');

  if (actionsHtml) {
    actionsContainer.innerHTML = actionsHtml;
  } else {
    actionsContainer.innerHTML = '<button type="button" class="btn-tool btn-gold" onclick="closeModal()">Aceptar</button>';
  }

  document.getElementById('custom-modal').classList.add('active');
}

function closeModal() {
  document.getElementById('custom-modal').classList.remove('active');
}

function confirmReset() {
  showModal(
    'Limpiar formulario',
    '¿Está seguro de que desea borrar todos los campos de este brief? Esta acción no se puede deshacer.',
    '<button type="button" class="btn-tool btn-outline" onclick="closeModal()">Cancelar</button>' +
    '<button type="button" class="btn-tool btn-danger" onclick="executeReset()">Borrar todo</button>'
  );
}

function executeReset() {
  localStorage.removeItem(STORAGE_KEY);
  document.getElementById('brief-form').reset();
  hasUnsavedChanges = false;
  closeModal();
  showSavingIndicator('Formulario reiniciado');
}

// Añade dinámicamente filas a tablas editables
function addTableRow(tableId, prefixList) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector('tbody');
  const rowCount = tbody.rows.length + 1;

  const newRow = tbody.insertRow();
  let html = '';

  if (tableId === 'services-table') {
    html = `
      <td><input type="text" name="srv_name_${rowCount}"></td>
      <td><input type="text" name="srv_desc_${rowCount}"></td>
      <td><input type="text" name="srv_cli_${rowCount}"></td>
      <td style="text-align: center;"><input type="checkbox" name="srv_prio_${rowCount}"></td>
      <td style="text-align: center;"><input type="checkbox" name="srv_apply_${rowCount}" checked></td>
    `;
  } else if (tableId === 'portfolio-table') {
    html = `
      <td><input type="text" name="port_nom_${rowCount}"></td>
      <td><input type="text" name="port_yr_${rowCount}"></td>
      <td><input type="text" name="port_city_${rowCount}"></td>
      <td><input type="text" name="port_type_${rowCount}"></td>
      <td><input type="text" name="port_cli_${rowCount}"></td>
      <td style="text-align: center;"><input type="checkbox" name="port_foto_${rowCount}"></td>
      <td style="text-align: center;"><input type="checkbox" name="port_pub_${rowCount}" checked></td>
    `;
  }

  newRow.innerHTML = html;
  debounceSave();
}

// Exporta el documento completo como PDF
function exportFilledHtml() {
  saveFormData();
  hasUnsavedChanges = false;

  const element = document.getElementById('brief-form-wrapper');
  const toolbar = document.querySelector('.top-toolbar');
  const addButtons = document.querySelectorAll('.btn-add-row');

  // Clonar el elemento para no modificar el original
  const clone = element.cloneNode(true);

  // Ocultar toolbar y botones en el clon
  toolbar.style.display = 'none';
  addButtons.forEach(btn => btn.style.display = 'none');

  // Reemplazar inputs de texto con spans que muestren el valor
  clone.querySelectorAll('input[type="text"]').forEach(input => {
    const span = document.createElement('span');
    span.textContent = input.value || '—';
    span.style.cssText = 'display: block; padding: 4px 6px; min-height: 20px; border-bottom: 1px solid #DCDCD8;';
    input.parentNode.replaceChild(span, input);
  });

  // Reemplazar textareas con spans
  clone.querySelectorAll('textarea').forEach(textarea => {
    const span = document.createElement('span');
    span.textContent = textarea.value || '—';
    span.style.cssText = 'display: block; padding: 4px 6px; min-height: 40px; white-space: pre-wrap; border-bottom: 1px solid #DCDCD8;';
    textarea.parentNode.replaceChild(span, textarea);
  });

  // Reemplazar checkboxes con símbolos visuales
  clone.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
    const span = document.createElement('span');
    span.textContent = checkbox.checked ? '☑' : '☐';
    span.style.cssText = 'font-size: 14px;';
    checkbox.parentNode.replaceChild(span, checkbox);
  });

  const opt = {
    margin: [10, 10, 10, 10],
    filename: 'Brief_Angamarca_Constructora_Completado.pdf',
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: {
      scale: 2,
      useCORS: true,
      letterRendering: true
    },
    jsPDF: {
      unit: 'mm',
      format: 'a4',
      orientation: 'portrait'
    },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
  };

  showModal(
    'Generando PDF',
    'Por favor espere mientras se genera el documento PDF con todas sus respuestas...',
    '<button type="button" class="btn-tool btn-outline" onclick="closeModal()" style="display:none;">Cancelar</button>'
  );

  html2pdf().set(opt).from(clone).save()
    .then(() => {
      // Restaurar elementos
      toolbar.style.display = '';
      addButtons.forEach(btn => btn.style.display = '');

      closeModal();
      showModal(
        'Descarga completada',
        'Se ha descargado el archivo "Brief_Angamarca_Constructora_Completado.pdf" con todas sus respuestas. Puede enviarlo directamente a Cúpula Systems.',
        '<button type="button" class="btn-tool btn-gold" onclick="closeModal()">Entendido</button>'
      );
    })
    .catch((error) => {
      console.error('Error generando PDF:', error);
      toolbar.style.display = '';
      addButtons.forEach(btn => btn.style.display = '');

      closeModal();
      showModal(
        'Error al generar PDF',
        'Ocurrió un error al generar el PDF. Por favor intente nuevamente o use la opción de imprimir (Ctrl+P) y seleccione "Guardar como PDF".',
        '<button type="button" class="btn-tool btn-gold" onclick="closeModal()">Entendido</button>'
      );
    });
}
