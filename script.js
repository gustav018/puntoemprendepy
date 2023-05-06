const productos = [];

document.getElementById('formularioPuntoEquilibrio').addEventListener('submit', (evento) => {
  evento.preventDefault();
  const costosFijos = parseFloat(document.getElementById('costosFijos').value);
  const nombreProducto = document.getElementById('nombreProducto').value;
  const precioVenta = parseFloat(document.getElementById('precioVenta').value);
  const precioCosto = parseFloat(document.getElementById('precioCosto').value);
  const demandaMensual = parseFloat(document.getElementById('demandaMensual').value);

  productos.push({ nombreProducto, precioVenta, precioCosto, demandaMensual });
  actualizarTabla(costosFijos);
  limpiarFormulario();
  mostrarTablas();
});

function actualizarTabla(costosFijos) {
  const tablaDatos = document.getElementById('tablaDatos');
  tablaDatos.innerHTML = '';

  const productosConPuntoEquilibrio = calcularPuntoEquilibrioMultiproducto(costosFijos, productos);

  let totalDemandaMensual = 0;
  let totalCostoVariablePonderado = 0;
  let totalPrecioVentaPonderado = 0;
  let totalPuntoDeEquilibrio = 0;

  productosConPuntoEquilibrio.forEach((producto) => {
    const fila = document.createElement('tr');

    fila.innerHTML = `
      <td>${producto.nombreProducto}</td>
      <td>${formatoMiles(producto.precioVenta.toFixed(0))}</td>
      <td>${formatoMiles(producto.precioCosto.toFixed(0))}</td>
      <td>${formatoMiles(producto.demandaMensual.toFixed(0))}</td>
      <td>${formatoMiles(producto.costoVariablePonderado.toFixed(0))}</td>
      <td>${formatoMiles(producto.precioVentaPonderado.toFixed(0))}</td>
      <td>${formatoMiles(Math.round(producto.puntoEquilibrio))}</td>
      <td><button class="btn btn-danger" onclick="eliminarFila(${productos.indexOf(producto)})">&times;</button></td>
    `;
    tablaDatos.appendChild(fila);

    totalDemandaMensual += producto.demandaMensual;
    totalCostoVariablePonderado += producto.costoVariablePonderado;
    totalPrecioVentaPonderado += producto.precioVentaPonderado;
    totalPuntoDeEquilibrio += producto.puntoEquilibrio;
  });

  document.getElementById('totalDemandaMensual').innerText = formatoMiles(totalDemandaMensual.toFixed(0));
  document.getElementById('totalCostoVariablePonderado').innerText = formatoMiles(totalCostoVariablePonderado.toFixed(0));
  document.getElementById('totalPrecioVentaPonderado').innerText = formatoMiles(totalPrecioVentaPonderado.toFixed(0));
  document.getElementById('totalPuntoDeEquilibrio').innerText = formatoMiles(totalPuntoDeEquilibrio.toFixed(0));


  actualizarTablaProyeccion(costosFijos, totalPuntoDeEquilibrio, totalCostoVariablePonderado, totalPrecioVentaPonderado, totalDemandaMensual);


}


function calcularPuntoEquilibrioMultiproducto(costosFijos, productos) {
  const totalUnidadesVendidas = productos.reduce((total, producto) => total + producto.demandaMensual, 0);

  productos.forEach(producto => {
    producto.porcentajeParticipacionVentas = (producto.demandaMensual / totalUnidadesVendidas) * 100;
    producto.margenContribucionUnitario = producto.precioVenta - producto.precioCosto;
    producto.margenContribucionPonderado = producto.porcentajeParticipacionVentas * producto.margenContribucionUnitario / 100;

    producto.costoVariablePonderado = producto.precioCosto * producto.porcentajeParticipacionVentas / 100;
    producto.precioVentaPonderado = producto.precioVenta * producto.porcentajeParticipacionVentas / 100;
  });

  const margenContribucionPonderadoTotal = productos.reduce((total, producto) => total + producto.margenContribucionPonderado, 0);
  const puntoEquilibrioTotal = costosFijos / margenContribucionPonderadoTotal;

  productos.forEach(producto => {
    producto.puntoEquilibrio = puntoEquilibrioTotal * producto.porcentajeParticipacionVentas / 100;
  });

  return productos;
}


function formatoMiles(numero) {
  return numero.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function eliminarFila(indice) {
  productos.splice(indice, 1);
  const costosFijos = parseFloat(document.getElementById('costosFijos').value);
  actualizarTabla(costosFijos);
}

function limpiarFormulario() {
  document.getElementById('nombreProducto').value = '';
  document.getElementById('precioVenta').value = '';
  document.getElementById('precioCosto').value = '';
  document.getElementById('demandaMensual').value = '';
}

function actualizarTablaProyeccion(costosFijos, totalPuntoDeEquilibrio, totalCostoVariablePonderado, totalPrecioVentaPonderado, totalDemandaMensual) {
  const tablaProyeccion = document.getElementById('tablaProyeccion');
  tablaProyeccion.innerHTML = '';

  let cantidad = totalDemandaMensual;

  for (let i = 1; i <= 7; i++) {
    const fila = document.createElement('tr');
    const ingreso = totalPrecioVentaPonderado * cantidad;
    const costoVariable = totalCostoVariablePonderado * cantidad;
    const costoTotal = costoVariable + costosFijos;
    const utilidad = ingreso - costoTotal;
    let escenario;

    if (i === 1) {
      escenario = "Escenario actual";
    } else if (i === 2) {
      escenario = "Escenario Punto de Equilibrio";
    } else {
      escenario = `Escenario ${i - 2}`;
    }

    fila.innerHTML = `
      <td>${escenario}</td>
      <td>${formatoMiles(cantidad.toFixed(0))}</td>
      <td>${formatoMiles(ingreso.toFixed(0))}</td>
      <td>${formatoMiles(costoVariable.toFixed(0))}</td>
      <td>${formatoMiles(costosFijos.toFixed(0))}</td>
      <td>${formatoMiles(costoTotal.toFixed(0))}</td>
      <td>${formatoMiles(utilidad.toFixed(0))}</td>
    `;
    tablaProyeccion.appendChild(fila);

    if (i === 1) {
      cantidad = Math.round(totalPuntoDeEquilibrio);
    } else {
      cantidad += 10;
    }

    mostrarExplicacion(totalPuntoDeEquilibrio, totalDemandaMensual);
  }
}



function mostrarExplicacion(totalPuntoDeEquilibrio, totalDemandaMensual) {
  let mensajeObservacion = `El valor real del Punto de Equilibrio es ${totalPuntoDeEquilibrio}, `;
  let mensajeObservacionExplicacion = `la teoría dice que el punto de equilibrio es el lugar donde no hay ganancia ni 
  pérdidas (en resumen, 0). Pero, en la segunda fila de la tabla de Proyección de Ventas, donde se ve el Escenario del
  Punto de Equilibrio, se redondea a ${totalPuntoDeEquilibrio.toFixed(0)}, por esa razón se observa que en la columna 
  Utilidad no es igual a 0.`;

  let mensaje1 = '';
  let mensaje2 = '';
  let mensaje3 = '';

  if (totalDemandaMensual < totalPuntoDeEquilibrio) {
    mensaje1 = `Actualmente, tu demanda mensual de ${formatoMiles(totalDemandaMensual.toFixed(0))} unidades 
    es menor al Punto de Equilibrio de ${formatoMiles(totalPuntoDeEquilibrio.toFixed(0))} unidades. 
    Esto significa que no estás vendiendo lo suficiente para cubrir tus costos fijos y variables, lo que resulta en pérdidas.`;

    mensaje2 = `Para mejorar la situación financiera de tu negocio, debes considerar aumentar tus ventas y/o reducir tus costos. 
    Puedes implementar estrategias de marketing, mejorar la eficiencia en la producción/ventas o buscar opciones 
    para disminuir costos fijos y variables.`;

    mensaje3 = `Modifica los datos cargados y evalúa diferentes escenarios realizando un análisis de sensibilidad
     para entender cómo podrían mejorar tus resultados al variar el precio de venta, el costo de producción/unitario, 
     o al aumentar la demanda mensual. Estos cambios te permitirán analizar diferentes situaciones y tomar decisiones
     informadas basadas en los resultados obtenidos.`;

  } else {
    mensaje1 = `Con una demanda mensual de ${formatoMiles(totalDemandaMensual.toFixed(0))} unidades y un 
    Punto de Equilibrio de ${formatoMiles(totalPuntoDeEquilibrio.toFixed(0))} unidades, estás cubriendo tus costos fijos y 
    variables y generando ganancias.`;

    mensaje2 = `Ahora que estás generando ganancias, considera cómo puedes aumentar aún más tus ventas y/o reducir 
    tus costos para maximizar tus utilidades. Revisa diferentes escenarios de ventas y costos para tomar decisiones informadas.`;

    mensaje3 = `Realiza un análisis de sensibilidad para evaluar cómo afectan diferentes variables a tus 
    resultados financieros. Varía el costo fijo, el precio de venta, el precio de costo o la demanda mensual 
    para ver cómo cambia el punto de equilibrio y la utilidad proyectada. Esto te ayudará a tomar decisiones más 
    informadas sobre tu estrategia de precios y producción/ventas.`;
  }

  const contenedorExplicacion = document.getElementById("contenedorExplicacion");

  // Verifica si ya existe una alerta de explicación y la elimina si es necesario
  const alertaExistente = contenedorExplicacion.querySelector(".alert");
  if (alertaExistente) {
    contenedorExplicacion.removeChild(alertaExistente);
  }

  const alertaExplicacion = document.createElement("div");
  alertaExplicacion.classList.add("alert", "alert-info", "mt-4");
  alertaExplicacion.innerHTML = `<p>${mensajeObservacion}${mensajeObservacionExplicacion}</p><p>${mensaje1}</p><p>${mensaje2}</p><p>${mensaje3}</p>`;


  contenedorExplicacion.appendChild(alertaExplicacion);
}


function ocultarTablas() {
  const tablaDatos = document.getElementById("tablaDatos");
  const tablaProyeccion = document.getElementById("tablaProyeccion");
  const tituloPuntoEquilibrio = document.getElementById("tituloPuntoEquilibrio");
  const tituloProyeccionVentas = document.getElementById("tituloProyeccionVentas");

  tablaDatos.parentElement.style.display = "none";
  tablaProyeccion.parentElement.style.display = "none";
  tituloPuntoEquilibrio.style.display = "none";
  tituloProyeccionVentas.style.display = "none";
}

function mostrarTablas() {
  const tablaDatos = document.getElementById("tablaDatos");
  const tablaProyeccion = document.getElementById("tablaProyeccion");
  const tituloPuntoEquilibrio = document.getElementById("tituloPuntoEquilibrio");
  const tituloProyeccionVentas = document.getElementById("tituloProyeccionVentas");

  tablaDatos.parentElement.style.display = "table";
  tablaProyeccion.parentElement.style.display = "table";
  tituloPuntoEquilibrio.style.display = "block";
  tituloProyeccionVentas.style.display = "block";
}

ocultarTablas();

