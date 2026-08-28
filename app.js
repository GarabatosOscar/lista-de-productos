
/* Los datos (PRODUCTOS) vienen de datos.js — para actualizar precios,
   reemplaza ese archivo usando el generador-datos.html */

const listaEl = document.getElementById('lista');
const inputEl = document.getElementById('buscador');
const vacioEl = document.getElementById('vacio');
const contadorEl = document.getElementById('contador');
const ordenarProductosEl = document.getElementById('ordenarProductos');
const paginacionEl = document.getElementById('paginacion');
const paginaAnteriorEl = document.getElementById('paginaAnterior');
const paginaSiguienteEl = document.getElementById('paginaSiguiente');
const paginaInfoEl = document.getElementById('paginaInfo');
const abrirCarritoEl = document.getElementById('abrirCarrito');
const cerrarCarritoEl = document.getElementById('cerrarCarrito');
const panelCarritoEl = document.getElementById('panelCarrito');
const itemsCarritoEl = document.getElementById('itemsCarrito');
const cantidadCarritoEl = document.getElementById('cantidadCarrito');
const totalCarritoEl = document.getElementById('totalCarrito');
const enviarCotizacionEl = document.getElementById('enviarCotizacion');
const vaciarCarritoEl = document.getElementById('vaciarCarrito');
const CLAVE_CARRITO = 'garabatos-cotizacion';
const TAMANO_PAGINA = 100;
let carrito = cargarCarrito();
let paginaActual = 1;
let resultadoActual = [];
let palabrasActuales = [];

/* Índice construido una única vez: la búsqueda no necesita normalizar ni
   separar las casi 10.000 descripciones cada vez que el usuario escribe. */
const PRODUCTOS_POR_CODIGO = new Map(PRODUCTOS.map(function(producto){
  return [producto.codigo, producto];
}));
const INDICE_PRODUCTOS = PRODUCTOS.map(function(producto){
  const codigoNorm = normalizar(producto.codigo);
  const descripcionNorm = normalizar(producto.descripcion);
  return {
    producto:producto,
    codigoNorm:codigoNorm,
    descripcionNorm:descripcionNorm,
    palabras:(codigoNorm + ' ' + descripcionNorm).split(/\s+/).filter(Boolean)
  };
});

function cargarCarrito(){
  try{
    const guardado = JSON.parse(localStorage.getItem(CLAVE_CARRITO));
    return Array.isArray(guardado) ? guardado : [];
  }catch(error){
    return [];
  }
}

function guardarCarrito(){
  localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function productoPorCodigo(codigo){
  return PRODUCTOS_POR_CODIGO.get(codigo);
}

function renderCarrito(){
  carrito = carrito.filter(function(item){
    const producto = productoPorCodigo(item.codigo);
    return producto && item.cantidad > 0 && producto.existencias > 0;
  }).map(function(item){
    const producto = productoPorCodigo(item.codigo);
    return { codigo:item.codigo, cantidad:Math.min(item.cantidad, producto.existencias) };
  });
  guardarCarrito();

  const cantidadTotal = carrito.reduce(function(total, item){ return total + item.cantidad; }, 0);
  const total = carrito.reduce(function(suma, item){
    const producto = productoPorCodigo(item.codigo);
    return suma + (producto.precio * item.cantidad);
  }, 0);
  cantidadCarritoEl.textContent = cantidadTotal;
  totalCarritoEl.textContent = formatoPrecio(total);
  enviarCotizacionEl.disabled = carrito.length === 0;
  vaciarCarritoEl.disabled = carrito.length === 0;

  if(!carrito.length){
    itemsCarritoEl.innerHTML = '<div class="cart-empty">Aún no has agregado productos.<br>Usa el botón <strong>Agregar</strong> en la lista.</div>';
    return;
  }

  itemsCarritoEl.innerHTML = carrito.map(function(item){
    const producto = productoPorCodigo(item.codigo);
    return '<article class="cart-item">' +
      '<div class="cart-item-name">' + escapeHtml(producto.descripcion) + '</div>' +
      '<div class="cart-item-meta">' +
        '<div class="quantity">' +
          '<button type="button" data-cart-action="decrease" data-codigo="' + escapeHtml(producto.codigo) + '" aria-label="Reducir cantidad">−</button>' +
          '<span>' + item.cantidad + '</span>' +
          '<button type="button" data-cart-action="increase" data-codigo="' + escapeHtml(producto.codigo) + '" aria-label="Aumentar cantidad"' + (item.cantidad >= producto.existencias ? ' disabled' : '') + '>+</button>' +
        '</div>' +
        '<span class="cart-item-price">' + formatoPrecio(producto.precio * item.cantidad) + '</span>' +
      '</div>' +
      '<button class="remove-item" type="button" data-cart-action="remove" data-codigo="' + escapeHtml(producto.codigo) + '">Quitar</button>' +
    '</article>';
  }).join('');
}

function agregarAlCarrito(codigo){
  const producto = productoPorCodigo(codigo);
  if(!producto || producto.existencias <= 0) return;
  const item = carrito.find(function(elemento){ return elemento.codigo === codigo; });
  if(item){
    item.cantidad = Math.min(item.cantidad + 1, producto.existencias);
  }else{
    carrito.push({ codigo:codigo, cantidad:1 });
  }
  renderCarrito();
}

function actualizarCantidad(codigo, accion){
  const posicion = carrito.findIndex(function(item){ return item.codigo === codigo; });
  if(posicion === -1) return;
  const producto = productoPorCodigo(codigo);
  if(accion === 'increase') carrito[posicion].cantidad = Math.min(carrito[posicion].cantidad + 1, producto.existencias);
  if(accion === 'decrease') carrito[posicion].cantidad -= 1;
  if(accion === 'remove' || carrito[posicion].cantidad <= 0) carrito.splice(posicion, 1);
  renderCarrito();
}

function abrirCarrito(){
  panelCarritoEl.classList.add('show');
  panelCarritoEl.setAttribute('aria-hidden', 'false');
  cerrarCarritoEl.focus();
}

function cerrarCarrito(){
  panelCarritoEl.classList.remove('show');
  panelCarritoEl.setAttribute('aria-hidden', 'true');
  abrirCarritoEl.focus();
}

function enviarCotizacion(){
  if(!carrito.length) return;
  let total = 0;
  const lineas = carrito.map(function(item){
    const producto = productoPorCodigo(item.codigo);
    const subtotal = producto.precio * item.cantidad;
    total += subtotal;
    return '• ' + item.cantidad + ' × ' + producto.descripcion + ' (' + producto.codigo + ') — ' + formatoPrecio(subtotal);
  });
  const mensaje = '¡Hola! Quisiera solicitar esta cotización:\n\n' + lineas.join('\n') + '\n\n*Total estimado: ' + formatoPrecio(total) + '*\n\nQuedo atento(a) a la disponibilidad y confirmación de precios.';
  window.open('https://wa.me/573178549714?text=' + encodeURIComponent(mensaje), '_blank', 'noopener');
}

function normalizar(texto){
  return texto.toString().toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function formatoPrecio(numero){
  return new Intl.NumberFormat('es-CO', { style:'currency', currency:'COP', maximumFractionDigits:0 }).format(numero);
}

function aplicarOrden(productos){
  const orden = ordenarProductosEl.value;
  if(orden === 'relevancia') return productos;
  return productos.slice().sort(function(a, b){
    if(orden === 'precio-desc') return (b.precio - a.precio) || a.descripcion.localeCompare(b.descripcion);
    if(orden === 'existencias-desc') return (b.existencias - a.existencias) || a.descripcion.localeCompare(b.descripcion);
    return 0;
  });
}

function escapeHtml(s){
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function escapeRegex(s){
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/* Distancia de edición (Levenshtein) — para tolerar errores de tecleo */
function distancia(a, b){
  if(a === b) return 0;
  const la = a.length, lb = b.length;
  if(la === 0) return lb;
  if(lb === 0) return la;
  let prev = new Array(lb + 1);
  let curr = new Array(lb + 1);
  for(let j=0;j<=lb;j++) prev[j] = j;
  for(let i=1;i<=la;i++){
    curr[0] = i;
    for(let j=1;j<=lb;j++){
      const costo = a[i-1] === b[j-1] ? 0 : 1;
      curr[j] = Math.min(prev[j]+1, curr[j-1]+1, prev[j-1]+costo);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/* ¿la palabra de búsqueda coincide con este texto, exacta o con
   pequeño margen de error? Compara contra el texto completo (substring)
   y contra cada palabra suelta del texto (para tolerar errores). */
function coincidePalabra(palabraBusqueda, textoNormalizado, palabrasTexto){
  if(textoNormalizado.includes(palabraBusqueda)) return true;
  if(palabraBusqueda.length < 3) return false; // muy corta, evitar falsos positivos
  const tolerancia = palabraBusqueda.length <= 4 ? 1 : 2;
  for(let i=0;i<palabrasTexto.length;i++){
    const pt = palabrasTexto[i];
    if(Math.abs(pt.length - palabraBusqueda.length) > tolerancia) continue;
    if(distancia(palabraBusqueda, pt) <= tolerancia) return true;
  }
  return false;
}

function resaltar(textoOriginal, palabrasBusqueda){
  let html = escapeHtml(textoOriginal);
  palabrasBusqueda.forEach(function(p){
    if(!p) return;
    const re = new RegExp('(' + escapeRegex(p) + ')', 'gi');
    html = html.replace(re, '<mark>$1</mark>');
  });
  return html;
}

function render(items, totalCount, palabrasBusqueda){
  const totalPaginas = Math.max(1, Math.ceil(totalCount / TAMANO_PAGINA));
  if(paginaActual > totalPaginas) paginaActual = totalPaginas;
  if(paginaActual < 1) paginaActual = 1;

  const inicio = (paginaActual - 1) * TAMANO_PAGINA;
  const fin = Math.min(inicio + TAMANO_PAGINA, items.length);

  listaEl.innerHTML = '';
  const frag = document.createDocumentFragment();
  for(let i=inicio;i<fin;i++){
    const p = items[i];
    const row = document.createElement('div');
    row.className = 'row';
    const hay = p.existencias > 0;
    const descHtml = palabrasBusqueda && palabrasBusqueda.length
      ? resaltar(p.descripcion, palabrasBusqueda)
      : escapeHtml(p.descripcion);
    row.innerHTML =
      '<span class="codigo">' + p.codigo + '</span>' +
      '<span class="desc">' + descHtml + '</span>' +
      '<span class="stock ' + (hay?'hay':'no') + '">' + (hay ? p.existencias + ' disp.' : 'agotado') + '</span>' +
      '<span class="precio">' + formatoPrecio(p.precio) + '</span>' +
      '<button class="add-button" type="button" data-codigo="' + escapeHtml(p.codigo) + '"' + (hay ? '' : ' disabled') + '>' + (hay ? 'Agregar' : 'No disponible') + '</button>';
    frag.appendChild(row);
  }
  listaEl.appendChild(frag);
  vacioEl.classList.toggle('show', totalCount === 0);

  let texto = totalCount + (totalCount === 1 ? ' producto' : ' productos');
  if(totalCount > 0){ texto += ' — ' + (inicio + 1) + '–' + fin; }
  contadorEl.textContent = texto;

  paginacionEl.hidden = totalPaginas <= 1;
  paginaInfoEl.textContent = 'Página ' + paginaActual + ' de ' + totalPaginas;
  paginaAnteriorEl.disabled = paginaActual <= 1;
  paginaSiguienteEl.disabled = paginaActual >= totalPaginas;
}

let temporizador = null;
function filtrar(){
  clearTimeout(temporizador);
  temporizador = setTimeout(buscarAhora, 90);
}

function puntajePalabra(palabraBusqueda, codigoNorm, descripcionNorm, palabrasTexto){
  const posDesc = descripcionNorm.indexOf(palabraBusqueda);
  if(posDesc === 0) return 100;                              // el nombre empieza con la palabra
  if(posDesc > 0){
    const inicioDePalabra = (' ' + descripcionNorm).includes(' ' + palabraBusqueda);
    if(inicioDePalabra) return 80;                            // coincide al inicio de alguna palabra del nombre
    return 50;                                                // coincide en medio de una palabra del nombre
  }
  if(codigoNorm.includes(palabraBusqueda)) return 70;         // coincide con la referencia/código

  /* Las descripciones del catálogo usan abreviaturas como "PINT." o
     "CUAD.". Cuando se busca una palabra de al menos 6 letras, admitir
     sus primeras cuatro letras al inicio de una palabra conserva la
     búsqueda natural sin tratar términos cortos como coincidencias. */
  if(palabraBusqueda.length >= 6){
    const raiz = palabraBusqueda.slice(0, 4);
    for(let i=0;i<palabrasTexto.length;i++){
      if(palabrasTexto[i].startsWith(raiz)) return 40;
    }
  }

  // no hubo coincidencia exacta: revisar si alguna palabra coincidió con tolerancia a error
  if(palabraBusqueda.length >= 3){
    const tolerancia = palabraBusqueda.length <= 4 ? 1 : 2;
    for(let i=0;i<palabrasTexto.length;i++){
      const pt = palabrasTexto[i];
      if(Math.abs(pt.length - palabraBusqueda.length) > tolerancia) continue;
      if(distancia(palabraBusqueda, pt) <= tolerancia) return 10; // aproximada, va al final
    }
  }
  return 0; // no coincide
}

function buscarAhora(conservarPagina){
  if(!conservarPagina) paginaActual = 1;
  const crudo = inputEl.value.trim();
  if(!crudo){
    resultadoActual = aplicarOrden(PRODUCTOS);
    palabrasActuales = [];
    render(resultadoActual, resultadoActual.length, palabrasActuales);
    return;
  }

  const palabras = normalizar(crudo).split(/\s+/).filter(Boolean);

  const candidatos = [];
  for(let i=0;i<INDICE_PRODUCTOS.length;i++){
    const entrada = INDICE_PRODUCTOS[i];
    const p = entrada.producto;
    const codigoNorm = entrada.codigoNorm;
    const descripcionNorm = entrada.descripcionNorm;
    const palabrasTexto = entrada.palabras;
    let puntajeTotal = 0;
    let coincideTodo = true;
    let tieneCoincidenciaAproximada = false;
    for(let j=0;j<palabras.length;j++){
      const puntaje = puntajePalabra(palabras[j], codigoNorm, descripcionNorm, palabrasTexto);
      if(puntaje === 0){ coincideTodo = false; break; }
      if(puntaje === 10) tieneCoincidenciaAproximada = true;
      puntajeTotal += puntaje;
    }
    if(coincideTodo){ candidatos.push({ p: p, puntaje: puntajeTotal, aproximado:tieneCoincidenciaAproximada }); }
  }

  candidatos.sort(function(a, b){ return b.puntaje - a.puntaje; });
  // Si hay coincidencias precisas, no mezclar resultados que solo se
  // parecen por una tolerancia de escritura. Así el orden por precio o
  // inventario nunca desplaza productos no relacionados a la consulta.
  const candidatosPrecisos = candidatos.filter(function(c){ return !c.aproximado; });
  const candidatosVisibles = candidatosPrecisos.length ? candidatosPrecisos : candidatos;
  resultadoActual = aplicarOrden(candidatosVisibles.map(function(c){ return c.p; }));
  palabrasActuales = palabras;

  render(resultadoActual, resultadoActual.length, palabrasActuales);
}

function cambiarPagina(delta){
  paginaActual += delta;
  render(resultadoActual, resultadoActual.length, palabrasActuales);
  if(typeof listaEl.scrollIntoView === 'function'){
    listaEl.scrollIntoView({ behavior:'smooth', block:'start' });
  }
}

inputEl.addEventListener('input', filtrar);
ordenarProductosEl.addEventListener('change', function(){ buscarAhora(); });
paginaAnteriorEl.addEventListener('click', function(){ cambiarPagina(-1); });
paginaSiguienteEl.addEventListener('click', function(){ cambiarPagina(1); });
listaEl.addEventListener('click', function(evento){
  const boton = evento.target.closest('.add-button');
  if(boton) agregarAlCarrito(boton.dataset.codigo);
});
abrirCarritoEl.addEventListener('click', abrirCarrito);
cerrarCarritoEl.addEventListener('click', cerrarCarrito);
panelCarritoEl.addEventListener('click', function(evento){
  if(evento.target === panelCarritoEl) cerrarCarrito();
});
itemsCarritoEl.addEventListener('click', function(evento){
  const boton = evento.target.closest('[data-cart-action]');
  if(boton) actualizarCantidad(boton.dataset.codigo, boton.dataset.cartAction);
});
vaciarCarritoEl.addEventListener('click', function(){
  carrito = [];
  renderCarrito();
});
enviarCotizacionEl.addEventListener('click', enviarCotizacion);
document.addEventListener('keydown', function(evento){
  if(evento.key === 'Escape' && panelCarritoEl.classList.contains('show')) cerrarCarrito();
});
renderCarrito();
buscarAhora();
