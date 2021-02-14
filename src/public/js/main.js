const socket = io(); // Conecta el cliente con el servidor.

let listaNumerosUsados = [];

class Partida {

  constructor(){

    this.nombreJugador = '';
    this.puntos = 0;
    this.jefe = 'no';
    this.arrJugadores = [];
    this.nombrePalabra = ""; // Esto se lo pasare mas adelante
    this.urlSkin = ""; // Esto se lo pasare mas adelante
    this.idInterval;

  }
  
}


let partida = new Partida;

// exportar clase Partida y llamarla desde la funcion.. ponerle la funcion dentro de la clase.



document.getElementById('registroUsuarioForm').addEventListener('submit', agregarJugador);

document.getElementById('formularioPalabra').addEventListener('submit', enviarPalabra);



/* ---------------------------------------------------------------------------- */

function agregarJugador(event){

  // Cancelo el formulario.
  event.preventDefault();
  
  // Obtengo el nombre que se ha puesto el usuario.
  let nicknameTemp = document.getElementById('nombreUsuarioInput').value;

  // data es un callback que confirma la respuesta del servidor.
  socket.emit('sent nickname', nicknameTemp, data => {

    // Si hemos recibido respuesta del servidor.
    if(data){

      // Le pasamos su nombre a la variable global.
      
      partida.nombreJugador = data; 

      esconderFormRegistro();

    }

  }); // socket

}

/* ---------------------------------------------------------------------------- */

function esconderFormRegistro(){

  // Escondo el registro y muestro el juego.

  let registro = document.getElementsByClassName('containerDiv');
  let id = document.getElementById('id');
  let containerPrincipal = document.getElementsByClassName('containerPrincipal');

  registro[0].style.display = 'none';
  id.style.display = 'block';
  containerPrincipal[0].style.display = 'flex';

}

/* ---------------------------------------------------------------------------- */

socket.on('nuevo_jugador', data => {

  actualizarJugadores();
  
  });

  /* ---------------------------------------------------------------------------- */

// ActualizarJugadores() se ejecuta cuando entra / sale un nuevo jugador y actualizar puntajes.

function actualizarJugadores(){

  socket.emit('buscar jugadores', jugadores => { // Devuelve del servidor [lista de jugadores]
 
   // Borra las div de los jugadores.
   borrarJugadores();
 
   // Y las vuelve a generar
   crearJugadores(jugadores);
 
   //Vuelve a salir el boton de empezar
   jugadores.forEach(el => {
 
     // Si Soy yo el jugador Y soy el jefe....
     if(el.nombre == partida.nombreJugador && el.jefe == "si"){
 
         let btn = document.getElementById('botonEmpezar');
 
           // Si el boton ya está creado, solo lo muestro..
           if(btn){
           
             btn.style.display = "block";
 
           }else{ // Si no, lo creo..
             
           let formularioPalabra = document.getElementById('containerInputTexto');
           let botonComenzar = document.createElement('button');
           botonComenzar.id = 'botonEmpezar';
           botonComenzar.innerText = 'Comenzar Partida';
           
           formularioPalabra.appendChild(botonComenzar);
 
           btn = document.getElementById('botonEmpezar');
 
           btn.addEventListener('click', jefeComenzarPartida);
 
         }
       
     }
 
   });
 
 });
   
 }

/* ---------------------------------------------------------------------------- */ 

function crearJugadores(jugadores){

  let contador = 1;

  jugadores.sort(function (a, b) {
    if (a.puntos < b.puntos) {
      return 1;
    }
    if (a.puntos > b.puntos) {
      return -1;
    }
    // a must be equal to b
    return 0;
  });


jugadores.forEach(element => {

  // Creo los elementos del DOM para cada jugador.
  let jugadoresDiv = document.createElement("div");
  jugadoresDiv.className = "jugadoresDiv";
  let newJugador = document.getElementById("tablaPuntuacionesDiv").appendChild(jugadoresDiv);


  let posicionJugador = document.createElement("p");
  posicionJugador.className = "posicionJugador";
  posicionJugador.innerText = "Posición: "+contador;
  newJugador.appendChild(posicionJugador);
  
  let nickname = document.createElement("p");
  nickname.className = "nickname";
  nickname.innerText = element.nombre;
  newJugador.appendChild(nickname);

  let puntuacion = document.createElement("p");
  puntuacion.className = "puntuacion";
  puntuacion.innerText = element.puntos+" pts.";
  newJugador.appendChild(puntuacion);

  contador++;

  });


}

/* ---------------------------------------------------------------------------- */

// Avisa al server que todos empiecen la partida.
function jefeComenzarPartida(){
  socket.emit('jefeComenzarPartida', '');
}

// ---------------------------------------------------------------------------------------------------------------*/

socket.on('comenzarJuegoJuntos', data => {


  console.log('mostrar :>> ',data);
  partida.nombrePalabra = data.palabra.toUpperCase();
  partida.urlSkin = data.img;

  mostrarImagen(); 

  if(document.getElementById('botonEmpezar')){document.getElementById('botonEmpezar').style.display = "none";}

  reactivarEnvio();

  reloj();

})

// ---------------------------------------------------------------------------------------------------------------*/


// funcion que vaya eliminando cuadros

let allCuadrados = document.getElementsByClassName('cuadrados'); // ARRAY

socket.on('numCuadradoEliminar', aleatorio => {

  allCuadrados[aleatorio].style.opacity = 0;

});


// ---------------------------------------------------------------------------------------------------------------*/

// Muestra como se Reduce el tiempo del reloj de 60seg a 0seg.
function reloj(){

  let tiempo = 60;
  
   partida.idInterval = setInterval( () => {

    tiempo--;

    document.getElementById('cuentaAtras').textContent = tiempo;
    
    if(tiempo === 0){ desconectarReloj(partida.idInterval); }

  }, 1066.666666666667);

}

// ---------------------------------------------------------------------------------------------------------------

function enviarPalabra(event){

  event.preventDefault();

  let tiempo = document.getElementById('cuentaAtras').innerText;

  if(tiempo > 0){

     let palabraEnviada = document.getElementById('entradaPalabra').value.toUpperCase();

     console.log('palabraEnviada :>> ', palabraEnviada.toUpperCase());
     console.log('partida.nombrePalabra :>> ', partida.nombrePalabra);

      if(palabraEnviada == partida.nombrePalabra){

        // Sonido de victoria. bieeeen!
        document.getElementById('botonEnviar').disabled = true;
        document.getElementById('botonEnviar').style.background = "purple";
        sonidoAcierto();
        eliminarTapiz();

        // Le envio mi nombre al server para que sume puntos.
        socket.emit('heAcertado', partida.nombreJugador);

      }else{

      // Sonido de fallo. ñiii!
      sonidoFallo();
      desactivarEnvio();

      // Cronometro para volver a enviar palabras.
      setTimeout(reactivarEnvio, 3000);

      }
  }

  return false;

}

// ---------------------------------------------------------------------------------------------------------------*/

socket.on('acabarRonda', data => {

  desconectarReloj(partida.idInterval);

  actualizarJugadores();

  listaNumerosUsados = [];

  crearTapiz(64, true);

  mostrarImagen();

  document.getElementById("cuentaAtras").textContent = 60; // 60 seg.

  document.getElementById("numeroRonda").textContent++; // 60 seg.

  
   
  });


// ---------------------------------------------------------------------------------------------------------------

function mostrarImagen(){

    let img = document.getElementById('img-skin');

    img.src = partida.urlSkin;

    document.getElementById('img-skin').style.opacity = 1;

}


// ---------------------------------------------------------------------------------------------------------------

function borrarJugadores(){

  let tablaPuntuacionesDiv = document.getElementsByClassName('jugadoresDiv');

  while(tablaPuntuacionesDiv.length += 0){

    tablaPuntuacionesDiv[0].remove('jugadoresDiv');

  }
}

// -------------------------------------------------------------------------------------------------------------------------------------

function desconectarReloj(idInterval){ clearInterval(idInterval); }

// ---------------------------------------------------------------------------------------------------------------

function reactivarEnvio(){

  let btn = document.getElementById('botonEnviar');

  if(btn){
    btn.disabled = false;
    btn.style.background = "green";
  }

}

// ---------------------------------------------------------------------------------------------------------------

function desactivarEnvio(){

  let btn = document.getElementById('botonEnviar')
  
  if(btn){
  btn.disabled = true;
  btn.style.background = "red";
  }

}

// ---------------------------------------------------------------------------------------------------------------

socket.on('Partida Finalizada', data => {

  alert("Se acabó el juego iros a estudiar vagos de mierda ¬¬. By Explo");
  
  });

// ---------------------------------------------------------------------------------------------------------------

function crearTapiz(cuadrados, borrarAntes = false){


  if(borrarAntes){ // Si está la capa borrala..

    eliminarTapiz();

  }

    for(let i = 0; i < cuadrados; i++){

      let creardiv = document.createElement("div"); // Creamos la div.
  
      creardiv.className = "cuadrados";
  
      document.getElementById("capaSuperficial").appendChild(creardiv);
  
      listaNumerosUsados.push(i); // Llenamos la lista con todas las combinaciones del 0 - 64.
  
    }


}

// --------------------------------------------------------------------------------------------------------


function sonidoAcierto(){

    let audioElement = document.createElement("audio");
    audioElement.setAttribute("src", "../audio/aciertoTrompetas.mp3");
    audioElement.setAttribute("autoplay:false", "autoplay");
    audioElement.volume = 0.2;	
    audioElement.play();

}


function sonidoFallo(){

  let audioElement = document.createElement("audio");
  audioElement.setAttribute("src", "../audio/error.mp3");
  audioElement.setAttribute("autoplay:false", "autoplay");
  audioElement.volume = 0.2;	
  audioElement.play();

}

// ---------------------------------------------------------------------------------------------------------------*/

function eliminarTapiz(){

  let element = document.getElementById('capaSuperficial');
      
      while (element.firstChild) {

        element.removeChild(element.firstChild);

      }
}

// ---------------------------------------------------------------------------------------------------------------*/

crearTapiz(64);