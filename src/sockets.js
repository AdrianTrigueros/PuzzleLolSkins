// Exporto este código en forma de funcion con 1 parametro.
module.exports = function (io){

// fetch no tiene soporte nativamente en node, por ello requiero este paquete.
const fetch = require("node-fetch");


// Variables del juego:

let tiempo = 65; // 60s
let listaNumerosUsados = [];
let rondas = 1;
let contadorPuntos = 1; // Lo uso para iterar los puntos y su posicion. 
let contadorJugadoresAcierto = 0; // Lo uso para saber cuando han acertado todos y acabar la ronda.
let palabra = "";
let img = "";
let idInterval = "";
let jugadores = [];


/* ---------------------------------------------------------------------------- */


  // Cada vez que alguien se conecte al servidor {...}
  io.on('connection', function(socket) {

  //console.log('Un nuevo usuario conectado');

      // Registro de Usuario
      socket.on('sent nickname', (data, callback) => {

        // Comprobamos que el nombre no este cogido.
        jugadores.forEach(element => {

          // Si da true es que existe y se le añade +1 al name.
          if(element.nombre.includes(data)){data += 1; }

        })

        let jugador = {
          "nombre": data,
          "puntos": 0,
          "jefe": "no"
        }

        // Le añadimos una propiedad al socket..
        // Para cuando se desconecte saber quien es.
        socket.id = data;

        // Añadimos al jugador
        jugadores.push(jugador);

        // Le damos derechos de jefe.
        buscarJefe(jugadores); 

        //Le decimos a todos los jugadores que actualicen sus listas.
        io.emit('nuevo_jugador', '');
        
        // Se le envia el nombre del jugador.
        callback(jugador.nombre); 

      });

/* ---------------------------------------------------------------------------- */

    // Obtener jugadores
    socket.on('buscar jugadores', callback => {

      callback(jugadores);

    });

/* ---------------------------------------------------------------------------- */

// Sincroniza a todos los jugadores a empezar partida.
socket.on('jefeComenzarPartida', data => {

  rellenarArrCuadrado(listaNumerosUsados);

  activarReloj(tiempo);

  const promesa = ObtenerListaCampeones();

  promesa.then(res => { // Asi se llama a una funcion dentro de una variable. Contiene la búsqueda de la imagen.

    // voy a la api de riot a buscar las skins del campeon..
   const p2 = ObtenerCampeon(palabra);

   p2.then(res => { 


    palabra = palabra.toUpperCase(); // A partir de este momento se tratará en mayusculas.
      
        let objPartida = {
          palabra: palabra,
          img: img
        };
      
        io.emit('comenzarJuegoJuntos', objPartida);

   });

    

  }); 


  
});

function rellenarArrCuadrado(){

  for(let i=0; i <= 64; i++){
    listaNumerosUsados.push(i);
  }

}

function activarReloj(tiempo){

  idInterval = setInterval(function(){
 
    let aleatorio = 0;

    // Si queda al menos 1 seg.
    if(tiempo > 0){
     
    tiempo--; 

    aleatorio = Math.random() * (listaNumerosUsados.length); //+1?

    aleatorio = Math.floor(aleatorio); // Quita los decimales.

  
    io.emit('numCuadradoEliminar', listaNumerosUsados[aleatorio]);

    listaNumerosUsados.splice(aleatorio, 1); // Eliminamos de la lista el número.
    
    // Apagamos el contador cuando no queden numeros.
    
    if(listaNumerosUsados.length === 0 || tiempo === 0){ desconectarReloj(idInterval); acabarRonda();}
    
    }

   }, 1000); // 1 Seg. 
 
}



// -------------------------------------------------------------------------------------------------------------------------------------

function desconectarReloj(IdInterval){ clearInterval(IdInterval); }

// -------------------------------------------------------------------------------------------------------------------------------------


  // Cuando se desconecta un jugador..
  socket.on('disconnect', data => {

    // No acabo de entender como funciona, pero funciona !! xDD


    // Si tiene propiedad no hagas nada.
    if(!socket.id) return;
    // Pero si no la tienes, buscalo y eliminalo de la array.
    jugadores.splice(jugadores.indexOf(socket.id), 1);


    // Que vuelva a cargar la tabla de puntuaciones.
    io.emit('nuevo_jugador', '');

  });






/* ---------------------------------------------------------------------------- */

    // Recibo el nombre de los jugadores que han acertado y sumo puntos
    socket.on('heAcertado', data => {

      jugadores.forEach(e => {

        // Si el jugador esta en la lista.
        if(e.nombre == data){

          switch(contadorPuntos){

            // El primero que acierta..
            case 1:
              e.puntos += 50;
              break;

              case 2:
              e.puntos += 40;
              break;

              case 3:
              e.puntos += 30;
              break;

              case 4:
              e.puntos += 20;
              break;

              default:
              e.puntos += 10;
              break;

            }

            contadorPuntos++;
            contadorJugadoresAcierto++;

          }

      });

      // Si han acertado todos..
      if(contadorJugadoresAcierto === jugadores.length){

        desconectarReloj(idInterval);
        acabarRonda();
      }

    });


//-------------------------------------------------------------- 

function acabarRonda(){
  
  if(rondas < 15){

    contador = 0;
    rondas++;
    contadorJugadoresAcierto = 0;
    contadorPuntos = 1;
    listaNumerosUsados = [];
    skins = [];

    const promesa = ObtenerListaCampeones();

    

    // Busca otra imagen..
    promesa.then(e => {

      // Aviso a los jugadores que ha acabado la ronda.
      io.emit('acabarRonda', '');

    });




 }else{

   // acabarJuego();

   io.emit("Partida Finalizada", '');

   console.log("Aqui iría una función para finalizar el juego, pero a ver quien se hace 15 rondas xD");
 }

}

/* ---------------------------------------------------------------------------- */

let skins = [];

function buscarJefe(){

  jugadores[0].jefe = "si";

}


/* ---------------------------------------------------------------------------- */

// Mensajes del cliente
socket.on('sent message', function(data){
  
  //console.log(data);
  
}); 



/* ---------------------------------------------------------------------------- */




// https://developer.riotgames.com/docs/lol


// let url = 'https://euw1.api.riotgames.com/lol/summoner/v4/summoners/by-name/' + usuario + APILOL;

/* Acceso a los datos del campeon y sus skins.

http://ddragon.leagueoflegends.com/cdn/11.3.1/data/en_US/champion/Aatrox.json

http://ddragon.leagueoflegends.com/cdn/11.3.1/data/en_US/champion/Fizz.json

http://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_1.jpg

-------------------------------------------------------------------------------------------------------------------------------------

No hay una lista unica actualizada, si no que van publicando diferentes listas con diferente url, se debe cambiar manualmente

Buscando el enlace en esta url: https://developer.riotgames.com/docs/lol#data-dragon_champions buscando algo similar a:

http://ddragon.leagueoflegends.com/cdn/11.3.1/data/en_US/champion.json y cambiandolo en la url.

*/




// ********************************************************************************************* \\

function ObtenerListaCampeones(){
  
  let listaCampeonesArr = [];

  return new Promise((resolve, reject) => {

   // let APILOL = "?api_key=RGAPI-6f7557f0-065c-426d-9511-6aa6aa61dec2";

   // let usuario = "explosiboo";

    let url = 'http://ddragon.leagueoflegends.com/cdn/11.3.1/data/en_US/champion.json';
        
    const p1 = fetch(url);

    // cuando se haya cumplido la promesa...
    p1.then(listadoCampeones => {

    const JSON = listadoCampeones.json();

    JSON.then(resp => {

      // Este for coge la respuesta e itera cada elemento bajo el nombre de nameCampeon
      // Iteramos para obtener el nombre de los campeones.
      for (var nameCampeon in resp.data){
        
        listaCampeonesArr.push(nameCampeon);

      }

      let numero = generarNumeroAleatoreo(listaCampeonesArr.length);

      let campeonSeleccionado = listaCampeonesArr[numero]; // Jayce, Elise..

      return campeonSeleccionado;
      
    }).then(campeonSeleccionado => {

    console.log('campeonSeleccionado :>> ', campeonSeleccionado);

    palabra = campeonSeleccionado;
      

      resolve(); 


  })

});

});

}

// ********************************************************************************************* \\

function ObtenerCampeon(campeonSeleccionado){

  return new Promise((resolve, reject) => {

    let urlLimpia = limpiarURL(campeonSeleccionado)
  
    const infoChamp = fetch(urlLimpia);
  
    infoChamp.then(resp => {
  
      const campeon = resp.json(); // !! Esto también es una promesa
  
      return campeon;
  
      }).then(resp => {
        
        for(var inputs of resp.data[campeonSeleccionado].skins){
  
          /*
          console.log(inputs);
          {id: "61000", num: 0, name: "default", chromas: false}
          {id: "61001", num: 1, name: "Gothic Orianna", chromas: false}
          {id: "61002", num: 2, name: "Sewn Chaos Orianna", chromas: false}
          {id: "61003", num: 3, name: "Bladecraft Orianna", chromas: false}
          {id: "61004", num: 4, name: "TPA Orianna", chromas: false}
          {id: "61005", num: 5, name: "Winter Wonder Orianna", chromas: false}
          {id: "61006", num: 6, name: "Heartseeker Orianna", chromas: false}
          {id: "61007", num: 7, name: "Dark Star Orianna", chromas: true}
          {id: "61008", num: 8, name: "Victorious Orianna", chromas: true}
  
          El num: es lo que debemos remplazar en la url.
          
          https://ddragon.leagueoflegends.com/cdn/img/champion/splash/Alistar_20.jpg
  
          */
  
          skins.push(inputs);
  
        }
  
          
        let random = generarNumeroAleatoreo(skins.length);

        console.log('skins :>> ', skins);
        console.log('random :>> ', random);
        console.log('skins.length :>> ', skins.length);
        
        skinSelect = skins[random].num; 
        
        console.log('skinSelect :>> ', skinSelect);


        img = transformarUrl(skinSelect);

        console.log('img :>> ', img);
  
        resolve();
  
      })

      

  })

  

}

// ********************************************************************************************* \\

function transformarUrl(skinSelect){

  let urlExemple = "http://ddragon.leagueoflegends.com/cdn/img/champion/splash/Aatrox_1.jpg"

  let urlNueva = urlExemple.replace('Aatrox', palabra);

  let urlLimpia = urlNueva.replace('1', skinSelect);

  return urlLimpia;

}

// ********************************************************************************************* \\

function limpiarURL(campeon){

  let urlAntigua = 'http://ddragon.leagueoflegends.com/cdn/11.3.1/data/en_US/champion/Fizz.json';

  let urlNueva = urlAntigua.replace('Fizz', campeon);

  return urlNueva;
}

// ********************************************************************************************* \\

function generarNumeroAleatoreo(max){
  
  let number = Math.random() * max;
 // let number =  1 + Math.random() * max;

  number = Math.floor(number);
  
  return number;
  
};

// ********************************************************************************************* \\































/* ---------------------------------------------------------------------------- */
  }); // socket
} // function