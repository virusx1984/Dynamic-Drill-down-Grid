// --- Global State ---
let rawData = [];       
let headers = [];       
let colMap = {};        
let columnTypes = {};   
let config = { levels: [], valueCols: [], columnColors: {} };

// Store configuration objects
let savedConfigs = []; 

// Sort State
let currentLevel = 0;   
let filterStack = [];   
let currentTableData = []; 
let sortState = { col: null, dir: 'asc' }; 

// Persistent Global Metric Sort
let globalMetricSort = { col: null, dir: 'asc' };

// Predefined colors
const PREDEFINED_COLORS = [
    { name: 'Black', val: '#212529' },
    { name: 'Blue', val: '#0d6efd' },
    { name: 'Green', val: '#198754' },
    { name: 'Red', val: '#dc3545' },
    { name: 'Orange', val: '#fd7e14' },
    { name: 'Purple', val: '#6f42c1' }
];

// --- 1. File Processing ---

$('#dropZone').on('click', function() { $('#fileInput').click(); });

const dropZone = document.getElementById('dropZone');
if (dropZone) {
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, e => {e.preventDefault(); e.stopPropagation();}, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => $('#dropZone').addClass('dragover'), false);
    });
    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => $('#dropZone').removeClass('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        const files = e.dataTransfer.files;
        if (files.length > 0) processFile(files[0]);
    }, false);
}

$('#fileInput').on('change', function(e) {
    if (e.target.files[0]) processFile(e.target.files[0]);
});

function processFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            const json = JSON.parse(event.target.result);
            
            if (json.columns && Array.isArray(json.columns) && 
                json.col_types && Array.isArray(json.col_types) &&
                json.data && Array.isArray(json.data)) {
                
                if (json.columns.length !== json.col_types.length) {
                    alert('Error: "columns" and "col_types" length mismatch.');
                    return;
                }

                headers = json.columns;
                rawData = json.data;
                colMap = {};
                headers.forEach((h, i) => colMap[h] = i);
                
                columnTypes = {};
                json.col_types.forEach((type, i) => {
                    columnTypes[headers[i]] = type;
                });

                // Load saved configs if present in JSON
                if (json.saved_configs && Array.isArray(json.saved_configs)) {
                    savedConfigs = json.saved_configs;
                } else {
                    savedConfigs = [];
                }

                initConfigurationUI();
                $('#uploadSection').addClass('d-none');
                $('#btnReset').removeClass('d-none'); 
            } else {
                alert('Invalid JSON Format! Must contain "columns", "col_types", and "data" arrays.');
            }
        } catch (err) { 
            console.error(err);
            alert('Invalid JSON file.'); 
        }
    };
    reader.readAsText(file);
}

// --- 2. Configuration UI ---

$('#btnReset').click(() => location.reload());

$('#btnBackToConfig').click(function() {
    $('#resultSection').addClass('d-none');
    $('#configSection').removeClass('d-none');
});

function initConfigurationUI() {
    $('#configSection').removeClass('d-none');
    renderGroupSelectors();
    renderValueSelectors();
    initBatchColorPicker();
    
    // Initialize Config Management Dropdown
    updateSavedConfigUI(); 
}

$(document).on('change', 'input[name="levelCount"]', renderGroupSelectors);

function initBatchColorPicker() {
    const $select = $('#batchColorSelect');
    $select.empty();
    PREDEFINED_COLORS.forEach(c => {
        $select.append(`<option value="${c.val}" style="background-color:${c.val};">${c.name}</option>`);
    });
    
    $select.on('change', function() {
        $(this).css('background-color', $(this).val());
    });
}

function renderGroupSelectors() {
    const count = parseInt($('input[name="levelCount"]:checked').val());
    const container = $('#groupColsContainer');
    container.empty();
    const categoryCols = headers.filter(h => columnTypes[h] === 'category');

    for (let i = 1; i <= count; i++) {
        container.append(`
            <div class="col-md-4 mb-3">
                <label class="form-label text-primary">Level ${i} Group By:</label>
                <select class="form-select level-select">
                    <option value="">-- Choose Category --</option>
                    ${categoryCols.map(h => `<option value="${h}">${h}</option>`).join('')}
                </select>
            </div>
        `);
    }
}

function renderValueSelectors() {
    const container = $('#valueColsContainer');
    container.empty();
    const aggCols = headers.filter(h => columnTypes[h] === 'aggregation');

    aggCols.forEach((h, index) => {
        let colorOptions = PREDEFINED_COLORS.map(c => 
            `<option value="${c.val}" style="background-color:${c.val}; color:white;">${c.name}</option>`
        ).join('');

        // FIX: Use index-based safe ID for HTML labels to avoid space/special character escaping issues
        const safeId = `chk_metric_${index}`;

        container.append(`
            <div class="metric-item d-flex align-items-center">
                <div class="form-check mb-0 me-2">
                    <input class="form-check-input val-col-check" type="checkbox" value="${h}" id="${safeId}" checked>
                </div>
                <select class="form-select form-select-sm p-0 ps-1 me-2 color-select" title="Header Color" 
                        style="width: 24px; height: 24px; background-color: #212529; color: transparent;"
                        onchange="this.style.backgroundColor=this.value">
                    ${colorOptions}
                </select>
                <label class="form-check-label text-truncate" for="${safeId}" title="${h}">${h}</label>
            </div>
        `);
    });

    bindMetricFilterEvents();
}

function bindMetricFilterEvents() {
    $('#metricFilter').off('input').on('input', function() {
        const rawVal = $(this).val().trim();
        const val = rawVal.toLowerCase();
        
        let isRegexMode = false;
        let regex = null;
        if (rawVal.includes('|') || rawVal.includes('(') || rawVal.includes('[')) {
            try { 
                regex = new RegExp(rawVal, 'i'); 
                isRegexMode = true;
            } catch(e) { 
                regex = null; 
            }
        }

        const terms = val.split(/\s+/).filter(t => t.length > 0);

        $('.metric-item').each(function() {
            const label = $(this).find('label').text();
            const labelLower = label.toLowerCase();
            let isMatch = true;

            if (rawVal) {
                if (isRegexMode && regex) {
                    isMatch = regex.test(label);
                } else {
                    isMatch = terms.every(term => labelLower.includes(term));
                }
            }
            
            if (isMatch) $(this).removeClass('d-none').addClass('d-flex');
            else $(this).addClass('d-none').removeClass('d-flex');
        });
    });

    $('#btnSelectAll').off('click').on('click', function() {
        $('.metric-item.d-flex .val-col-check:not(:disabled)').prop('checked', true);
    });

    $('#btnUnselectAll').off('click').on('click', function() {
            $('.metric-item.d-flex .val-col-check:not(:disabled)').prop('checked', false);
    });

    $('#btnBatchColor').off('click').on('click', function() {
        const selectedColor = $('#batchColorSelect').val();
        $('.metric-item.d-flex').each(function() {
            const $colorSelect = $(this).find('.color-select');
            $colorSelect.val(selectedColor);
            $colorSelect.css('background-color', selectedColor);
        });
    });
}

// --- 2.5 Configuration Management (Load / Save / Export) ---

function updateSavedConfigUI() {
    const $select = $('#savedConfigSelect');
    const $section = $('#savedConfigSection');
    
    if (savedConfigs.length > 0) {
        $section.removeClass('d-none');
        $select.find('option:not(:first)').remove(); // Keep default option
        
        savedConfigs.forEach((conf, index) => {
            $select.append(`<option value="${index}">${conf.name}</option>`);
        });
    } else {
        $section.addClass('d-none');
    }
}

// Load Configuration
$('#btnLoadConfig').click(function() {
    const selectedIndex = $('#savedConfigSelect').val();
    if (selectedIndex === "") {
        alert("Please select a configuration to load.");
        return;
    }

    const conf = savedConfigs[selectedIndex];

    // 1. Set Level Radio Button and trigger change to re-render dropdowns
    const levelCount = conf.levels.length;
    $(`input[name="levelCount"][value="${levelCount}"]`).prop('checked', true).trigger('change');

    // 2. Set Group Selectors (Need delay to allow DOM to render)
    setTimeout(() => {
        $('.level-select').each(function(index) {
            if (conf.levels[index]) {
                $(this).val(conf.levels[index]);
            }
        });

        // 3. Set Metric Checkboxes and Colors
        $('.val-col-check').prop('checked', false); // Uncheck all
        $('.color-select').val('#212529').css('background-color', '#212529'); // Reset colors

        conf.valueCols.forEach(colName => {
            // FIX: Robust way to find checkbox by value instead of ID, avoiding escaping issues
            const $chk = $('.val-col-check').filter(function() {
                return $(this).val() === colName;
            });
            
            if ($chk.length) {
                $chk.prop('checked', true);
                
                // Set color if saved
                if (conf.columnColors && conf.columnColors[colName]) {
                    const colorHex = conf.columnColors[colName];
                    const $colorSelect = $chk.closest('.metric-item').find('.color-select');
                    $colorSelect.val(colorHex).css('background-color', colorHex);
                }
            }
        });
    }, 50);
});

// Save Configuration
$('#btnSaveConfig').click(function() {
    const configName = $('#newConfigName').val().trim();
    if (!configName) {
        alert("Please enter a name for this configuration.");
        return;
    }

    // Gather current UI state
    let currentLevels = [];
    $('.level-select').each(function() { 
        if($(this).val()) currentLevels.push($(this).val()); 
    });
    
    let currentMetrics = [];
    let currentColors = {}; 

    $('.val-col-check:checked').each(function() {
        const colName = $(this).val();
        currentMetrics.push(colName);
        const colorVal = $(this).closest('.metric-item').find('.color-select').val();
        
        // Only save color if it's not the default black (saves file space)
        if(colorVal !== '#212529') {
            currentColors[colName] = colorVal;
        }
    });

    if (currentLevels.length === 0 || currentMetrics.length === 0) {
        alert("Please select at least one level and one metric column to save a config.");
        return;
    }

    const newConfig = {
        name: configName,
        levels: currentLevels,
        valueCols: currentMetrics,
        columnColors: currentColors
    };

    // Check if config name already exists (Overwrite logic)
    const existingIndex = savedConfigs.findIndex(c => c.name === configName);
    if (existingIndex >= 0) {
        if(confirm(`Configuration "${configName}" already exists. Overwrite?`)) {
            savedConfigs[existingIndex] = newConfig;
        } else {
            return;
        }
    } else {
        savedConfigs.push(newConfig);
    }

    $('#newConfigName').val(''); // Clear input field
    updateSavedConfigUI(); // Refresh dropdown
    alert("Configuration saved to memory!");
});

// Export JSON
$('#btnExportJSON').click(function() {
    if(rawData.length === 0) {
        alert("No data to export.");
        return;
    }

    // Map column types correctly
    const colTypesArray = headers.map(h => columnTypes[h]);

    // Build final export object
    const exportObj = {
        columns: headers,
        col_types: colTypesArray,
        data: rawData,
        saved_configs: savedConfigs
    };

    // Create Blob and download
    const jsonString = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = 'data_with_configs.json'; // Default download name
    document.body.appendChild(a);
    a.click();
    
    // Cleanup URL to avoid memory leaks
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
});

// --- 3. Grid Generation ---
$('#btnGenerate').on('click', function() {
    config.levels = [];
    $('.level-select').each(function() { if($(this).val()) config.levels.push($(this).val()); });
    
    config.valueCols = [];
    config.columnColors = {}; 

    $('.val-col-check:checked').each(function() {
        const colName = $(this).val();
        config.valueCols.push(colName);
        const colorVal = $(this).closest('.metric-item').find('.color-select').val();
        config.columnColors[colName] = colorVal;
    });

    if (config.levels.length === 0 || config.valueCols.length === 0) {
        alert('Please select levels and metric columns.');
        return;
    }

    filterStack = []; 
    currentLevel = 0;
    globalMetricSort = { col: null, dir: 'asc' }; 

    $('#configSection').addClass('d-none');
    $('#resultSection').removeClass('d-none');
    loadLevelView(0);
});

function loadLevelView(levelIndex) {
    currentLevel = levelIndex;
    sortState = { ...globalMetricSort };

    let filteredData = rawData;
    filterStack.forEach(f => {
        const idx = colMap[f.col];
        filteredData = filteredData.filter(row => row[idx] == f.val);
    });

    if (currentLevel < config.levels.length) {
        const groupCol = config.levels[currentLevel];
        currentTableData = aggregateData(filteredData, groupCol);
        
        if (sortState.col) {
            performSort(currentTableData, sortState.col, sortState.dir, false);
        }

        renderTable(currentTableData, groupCol, false);
    } else {
        currentTableData = filteredData;

        if (sortState.col) {
            performSort(currentTableData, sortState.col, sortState.dir, true);
        }

        renderTable(currentTableData, null, true);
    }
    updateBreadcrumbs();
}

function aggregateData(dataset, groupKey) {
    const groups = {};
    const groupIdx = colMap[groupKey]; 

    dataset.forEach(row => {
        const val = row[groupIdx];
        if (!groups[val]) {
            groups[val] = { [groupKey]: val };
            config.valueCols.forEach(vc => groups[val][vc] = 0);
        }
        config.valueCols.forEach(vc => {
            const colIdx = colMap[vc];
            groups[val][vc] += parseNum(row[colIdx]);
        });
    });
    return Object.values(groups);
}

function parseNum(val) {
    if (!val || val === '-') return 0;
    if (typeof val === 'number') return val;
    return parseFloat(val.toString().replace(/,/g, '')) || 0;
}

function performSort(data, col, dir, isDetail) {
    data.sort((a, b) => {
        let valA, valB;
        if (isDetail) {
            valA = a[colMap[col]];
            valB = b[colMap[col]];
        } else {
            valA = a[col];
            valB = b[col];
        }

        let numA = parseNum(valA);
        let numB = parseNum(valB);

        let isNum = config.valueCols.includes(col) || (!isNaN(parseFloat(valA)) && !isNaN(parseFloat(valB)));

        if (isNum) {
            return dir === 'asc' ? numA - numB : numB - numA;
        } else {
            valA = valA ? valA.toString().toLowerCase() : '';
            valB = valB ? valB.toString().toLowerCase() : '';
            if (valA < valB) return dir === 'asc' ? -1 : 1;
            if (valA > valB) return dir === 'asc' ? 1 : -1;
            return 0;
        }
    });
}

function renderTable(data, groupCol, isDetail) {
    const $thead = $('#mainTable thead');
    const $tbody = $('#mainTable tbody');
    const $tfoot = $('#mainTable tfoot');
    
    $thead.empty();
    $tbody.empty();
    $tfoot.empty();

    let displayCols = [];
    if (isDetail) {
        const categoryCols = headers.filter(h => columnTypes[h] === 'category');
        displayCols = [...categoryCols, ...config.valueCols];
    } else {
        displayCols = [groupCol, ...config.valueCols];
    }

    let stickyColIndices = [];
    if (isDetail) {
        displayCols.forEach((col, idx) => {
            if (!config.valueCols.includes(col)) stickyColIndices.push(idx);
        });
    } else {
        stickyColIndices.push(0);
    }

    let headHtml = '<tr>';
    displayCols.forEach((col, idx) => {
        const isSticky = stickyColIndices.includes(idx);
        const isValue = config.valueCols.includes(col);
        const stickyClass = isSticky ? 'sticky-col' : '';
        const alignClass = isValue ? 'text-end' : 'text-start'; 
        
        let bgStyle = '';
        if (isValue && config.columnColors[col]) {
            bgStyle = `background-color: ${config.columnColors[col]} !important;`;
        } else {
            bgStyle = `background-color: #212529 !important;`;
        }

        headHtml += `<th class="${stickyClass} ${alignClass}" style="${bgStyle}" data-idx="${idx}" data-col="${col}">${col} <span class="sort-icon">⇅</span></th>`;
    });
    headHtml += '</tr>';
    $thead.html(headHtml);

    data.forEach(row => {
        let tr = `<tr class="${!isDetail ? 'clickable-row' : ''}">`;
        displayCols.forEach((col, idx) => {
            const isSticky = stickyColIndices.includes(idx);
            const isValue = config.valueCols.includes(col);
            const stickyClass = isSticky ? 'sticky-col' : '';
            const alignClass = isValue ? 'text-end' : 'text-start';
            
            let val;
            if (isDetail) val = row[colMap[col]]; 
            else val = row[col];

            if (isValue) val = parseNum(val).toLocaleString();
            
            tr += `<td class="${stickyClass} ${alignClass}" data-idx="${idx}">${val === undefined || val === null ? '-' : val}</td>`;
        });
        tr += '</tr>';
        const $tr = $(tr);
        
        if (!isDetail) {
            $tr.click(function() {
                const groupVal = row[displayCols[0]]; 
                filterStack.push({ col: displayCols[0], val: groupVal });
                loadLevelView(currentLevel + 1);
            });
        }
        $tbody.append($tr);
    });

    let totals = {};
    config.valueCols.forEach(c => totals[c] = 0);
    data.forEach(row => {
        config.valueCols.forEach(c => {
            let val;
            if (isDetail) val = row[colMap[c]];
            else val = row[c];
            totals[c] += parseNum(val);
        });
    });

    let footHtml = '<tr>';
    displayCols.forEach((col, idx) => {
        const isSticky = stickyColIndices.includes(idx);
        const isValue = config.valueCols.includes(col);
        const stickyClass = isSticky ? 'sticky-col' : '';
        const alignClass = isValue ? 'text-end' : 'text-start';

        if (idx === 0) {
            footHtml += `<td class="${stickyClass}" data-idx="${idx}">TOTAL</td>`;
        } else if (isValue) {
            footHtml += `<td class="${stickyClass} ${alignClass}" data-idx="${idx}">${totals[col].toLocaleString()}</td>`;
        } else {
            footHtml += `<td class="${stickyClass}" data-idx="${idx}"></td>`;
        }
    });
    footHtml += '</tr>';
    $tfoot.html(footHtml);
    
    let currentLeft = 0;
    $thead.find('th').each(function(index) {
        if ($(this).hasClass('sticky-col')) {
            const width = $(this).outerWidth();
            $(`#mainTable th[data-idx="${index}"], #mainTable td[data-idx="${index}"]`).css('left', currentLeft + 'px');
            currentLeft += width; 
        }
    });

    if (sortState.col) {
        const arrow = sortState.dir === 'asc' ? '↑' : '↓';
        // Need to escape col selector in case column name has spaces or special chars
        $(`th[data-col="${$.escapeSelector(sortState.col)}"] .sort-icon`).text(arrow).addClass('sort-active');
    }

    $thead.find('th').click(function() {
        const col = $(this).data('col');
        handleSort(col, displayCols, isDetail);
    });
}

function handleSort(col, displayCols, isDetail) {
    if (sortState.col === col) {
        sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
        sortState.col = col;
        sortState.dir = 'asc';
    }

    if (config.valueCols.includes(col)) {
        globalMetricSort = { col: col, dir: sortState.dir };
    } else {
        globalMetricSort = { col: null, dir: 'asc' };
    }

    performSort(currentTableData, col, sortState.dir, isDetail);
    renderTable(currentTableData, isDetail ? null : config.levels[currentLevel], isDetail);
}

function updateBreadcrumbs() {
    const $ul = $('#breadcrumbList');
    $ul.empty();
    $ul.append(`<li class="breadcrumb-item"><a href="#" onclick="resetToRoot()">Home</a></li>`);
    filterStack.forEach((filter, idx) => {
        $ul.append(`<li class="breadcrumb-item"><a href="#" onclick="rollbackTo(${idx})">${filter.val}</a></li>`);
    });
    let label = "Level " + (currentLevel + 1);
    if (currentLevel >= config.levels.length) label = "Details";
    $ul.append(`<li class="breadcrumb-item active">${label}</li>`);
}

window.resetToRoot = function() { filterStack = []; loadLevelView(0); };
window.rollbackTo = function(stackIndex) {
    filterStack = filterStack.slice(0, stackIndex + 1);
    loadLevelView(stackIndex + 1);
};